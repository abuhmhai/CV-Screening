<?php
declare(strict_types=1);
namespace Platform\Services;
use Platform\Database;
class Worker {
    private Database $db;
    public function __construct(Database $db){$this->db=$db;}
    public function once(): bool {
        $task=$this->db->transaction(function(){
            $this->db->run("UPDATE task_queue SET status=IF(attempts>=3,'FAILED','PENDING'),locked_at=NULL,last_error='Worker lease expired' WHERE status='RUNNING' AND locked_at<UTC_TIMESTAMP()-INTERVAL 20 MINUTE");
            $t=$this->db->one("SELECT * FROM task_queue WHERE status='PENDING' AND available_at<=UTC_TIMESTAMP(3) ORDER BY created_at,id LIMIT 1 FOR UPDATE SKIP LOCKED");
            if($t)$this->db->run("UPDATE task_queue SET status='RUNNING',attempts=attempts+1,locked_at=UTC_TIMESTAMP(3) WHERE id=?",[$t['id']]);return $t;
        });
        if(!$task)return false;
        try {
            $payload=json_decode($task['payload'],true,512,JSON_THROW_ON_ERROR);
            if($task['kind']==='SCREEN')$this->screen($payload);
            elseif($task['kind']==='CRAWL')(new Crawler($this->db))->crawl($payload['keywords']);
            elseif($task['kind']==='ALERTS')$this->alerts();
            else throw new \RuntimeException('Unknown task kind');
            $this->db->run("UPDATE task_queue SET status='COMPLETED',locked_at=NULL,last_error=NULL WHERE id=?",[$task['id']]);
        }catch(\Throwable $e){$attempt=(int)$task['attempts']+1;$this->db->run("UPDATE task_queue SET status=?,locked_at=NULL,last_error=?,available_at=UTC_TIMESTAMP(3)+INTERVAL 15 SECOND WHERE id=?",[$attempt>=3?'FAILED':'PENDING',mb_substr($e->getMessage(),0,2000),$task['id']]);error_log('Task '.$task['id'].' failed: '.$e->getMessage());}
        return true;
    }
    public function scheduleAlerts(): void {
        $id=substr(hash('sha256','alerts-'.gmdate('Y-m-d-H')),0,32);$id=substr($id,0,8).'-'.substr($id,8,4).'-'.substr($id,12,4).'-'.substr($id,16,4).'-'.substr($id,20);
        $this->db->run("INSERT IGNORE INTO task_queue(id,kind,payload) VALUES(?,'ALERTS','{}')",[$id]);
        if(\env('CRAWL_SCHEDULED','true')==='true'){
            $stamp=gmdate('Y-m-d-H').'-'.(int)(gmdate('i')>=30);$hex=substr(hash('sha256','crawl-'.$stamp),0,32);$crawlId=substr($hex,0,8).'-'.substr($hex,8,4).'-'.substr($hex,12,4).'-'.substr($hex,16,4).'-'.substr($hex,20);
            $this->db->run("INSERT IGNORE INTO task_queue(id,kind,payload) VALUES(?,'CRAWL',?)",[$crawlId,json_encode(['keywords'=>['php','react','python']])]);
        }
    }
    private function screen(array $payload): void {
        $a=$this->db->record('applications',['id'=>$payload['applicationId']]);if(!$a)throw new \RuntimeException('Application missing');
        if(!in_array($a['status'],['APPLIED','AI_SCREENING','HR_REVIEW'],true))return;
        $j=$this->db->record('jobs',['id'=>$a['jobId']]);$cv=$this->db->record('cv_files',['id'=>$a['cvFileId']]);
        $text=$cv['extractedText'];
        if(!$text){$key=parse_url($cv['fileUrl'],PHP_URL_PATH);$key=preg_replace('#^/api/v1/files/#','',$key);$root=realpath(Storage::root());$path=realpath($root.'/'.$key);if(!$path||strpos($path,$root.DIRECTORY_SEPARATOR)!==0)throw new \RuntimeException('CV file unavailable');$mime=strtolower(pathinfo($path,PATHINFO_EXTENSION))==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document';$extract=(new HttpClient())->request(\env('AI_SERVICE_URL','http://127.0.0.1:8000').'/extract',['file'=>new \CURLFile($path,$mime,$cv['fileName'])],[],30);$text=$extract['text'];$this->db->write('cv_files',['extractedText'=>$text],['id'=>$cv['id']]);}
        $this->db->transaction(function()use($a){$this->db->run("UPDATE applications SET status='AI_SCREENING' WHERE id=? AND status IN ('APPLIED','AI_SCREENING','HR_REVIEW')",[$a['id']]);});
        $skills=$this->db->all('SELECT s.name,us.years_exp years FROM user_skills us JOIN skills s ON s.id=us.skill_id WHERE us.user_id=?',[$a['candidateId']]);
        $r=(new Screening())->screen($text,$j['description'],$j['id'],['candidateSkills'=>$skills,'requiredSkills'=>$j['requiredSkills'],'education'=>$this->db->records('educations','user_id=?',[$a['candidateId']]),'hasCertifications'=>(bool)$this->db->one('SELECT id FROM certifications WHERE user_id=?',[$a['candidateId']]),'hasPortfolio'=>(bool)$this->db->one('SELECT id FROM projects WHERE user_id=?',[$a['candidateId']])]);
        $this->db->transaction(function()use($a,$r){
            $current=$this->db->one('SELECT status FROM applications WHERE id=? FOR UPDATE',[$a['id']]);if(!$current||$current['status']!=='AI_SCREENING')return;
            $data=['overallScore'=>$r['overall_score'],'skillScore'=>$r['breakdown']['skill_score'],'experienceScore'=>$r['breakdown']['experience_score'],'educationScore'=>$r['breakdown']['education_score'],'otherScore'=>$r['breakdown']['other_score'],'grade'=>$r['grade'],'matchedSkills'=>$r['matched_skills'],'missingSkills'=>$r['missing_skills'],'strengths'=>$r['strengths'],'concerns'=>$r['concerns'],'explanation'=>$r['explanation'],'modelVersion'=>$r['model_version'],'processingTimeMs'=>$r['processing_time_ms']];
            $old=$this->db->one('SELECT id FROM ai_screening_results WHERE application_id=?',[$a['id']]);$old?$this->db->write('ai_screening_results',$data,$old):$this->db->write('ai_screening_results',array_merge($data,['applicationId'=>$a['id']]));
            $this->db->write('applications',['status'=>'HR_REVIEW'],['id'=>$a['id']]);
            $this->db->write('application_status_history',['applicationId'=>$a['id'],'fromStatus'=>'AI_SCREENING','toStatus'=>'HR_REVIEW','changedBy'=>$a['candidateId'],'note'=>'Screening completed: '.$r['model_version']]);
            $this->db->write('notifications',['userId'=>$a['candidateId'],'type'=>'AI_SCREENING','title'=>'CV screening completed','body'=>'Score: '.$r['overall_score'],'data'=>['applicationId'=>$a['id']]]);
        });
    }
    private function alerts(): void {
        foreach($this->db->records('job_alerts','is_active=1') as $alert){$interval=['INSTANT'=>3600,'DAILY'=>86400,'WEEKLY'=>604800][$alert['frequency']]??86400;$last=$alert['lastSentAt']?strtotime($alert['lastSentAt']):time()-$interval;if(time()-$last<$interval)continue;
            $where=["status='ACTIVE'",'published_at>?'];$args=[gmdate('Y-m-d H:i:s',$last)];if($alert['keyword']){$where[]='title LIKE ?';$args[]='%'.$alert['keyword'].'%';}
            foreach(['location'=>'location','jobType'=>'job_type','level'=>'level','category'=>'category','isRemote'=>'is_remote'] as $key=>$column)if(isset($alert['filters'][$key])){$where[]='`'.$column.'`=?';$args[]=$alert['filters'][$key];}
            $rows=$this->db->all('SELECT id,title FROM jobs WHERE '.implode(' AND ',$where).' ORDER BY published_at DESC LIMIT 10',$args);
            $this->db->transaction(function()use($rows,$alert){if($rows)$this->db->write('notifications',['userId'=>$alert['userId'],'type'=>'JOB_ALERT','title'=>count($rows).' new matching jobs','body'=>implode(', ',array_column($rows,'title')),'data'=>['alertId'=>$alert['id'],'jobIds'=>array_column($rows,'id')]]);$this->db->write('job_alerts',['lastSentAt'=>\now()],['id'=>$alert['id']]);});
        }
    }
}
