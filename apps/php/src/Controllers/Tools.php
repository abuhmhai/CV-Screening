<?php
declare(strict_types=1);
namespace Platform\Controllers;
use Platform\Http\Request;
use Platform\Http\Error;
use Platform\Services\HttpClient;
use Platform\Services\Visibility;
class Tools extends Controller {
    protected function routes(): void {
        $this->route('GET','users/me/generated-cv',function(){return $this->db->records('generated_cvs','user_id=?',[$this->auth->current()['id']],'updated_at DESC');});
        $this->route('POST','users/me/generated-cv',function(Request $r){$u=$this->auth->current();if(!is_array($r->body['data']??null))throw new Error(400,'CV data required');return $this->db->transaction(function()use($r,$u){if(!empty($r->body['isPrimary']))$this->db->run('UPDATE generated_cvs SET is_primary=0 WHERE user_id=?',[$u['id']]);return $this->db->write('generated_cvs',['userId'=>$u['id'],'title'=>$r->required('title'),'data'=>$r->body['data'],'templateId'=>$r->body['templateId']??'classic','isPrimary'=>$r->body['isPrimary']??false]);});});
        $this->route('GET','users/me/generated-cv/{id}/export',function(Request $r,array $p){$cv=$this->owned('generated_cvs',$p['id']);if(!class_exists('Dompdf\\Dompdf'))throw new Error(503,'Install Composer dependencies');$data=$cv['data'];ob_start();require APP_ROOT.'/views/cv-pdf.php';$html=ob_get_clean();$options=new \Dompdf\Options();$options->set('isRemoteEnabled',false);$options->set('defaultFont','DejaVu Sans');$pdf=new \Dompdf\Dompdf($options);$pdf->loadHtml($html,'UTF-8');$pdf->setPaper('A4');$pdf->render();$pdf->stream('cv.pdf',['Attachment'=>true]);return null;});
        $this->route('GET','users/me/generated-cv/{id}',function(Request $r,array $p){return $this->owned('generated_cvs',$p['id']);});
        $this->route('PATCH','users/me/generated-cv/{id}',function(Request $r,array $p){$cv=$this->owned('generated_cvs',$p['id']);return $this->db->transaction(function()use($r,$cv){if(!empty($r->body['isPrimary']))$this->db->run('UPDATE generated_cvs SET is_primary=0 WHERE user_id=?',[$cv['userId']]);return $this->db->write('generated_cvs',$this->only($r->body,['title','data','templateId','isPrimary']),['id'=>$cv['id']]);});});
        $this->route('DELETE','users/me/generated-cv/{id}',function(Request $r,array $p){$this->owned('generated_cvs',$p['id']);$this->db->delete('generated_cvs',['id'=>$p['id']]);return ['ok'=>true];});
        $this->route('GET','external-jobs/saved/ids',function(){return array_column($this->db->records('saved_external_jobs','user_id=?',[$this->auth->current()['id']]),'externalJobId');});
        $this->route('GET','external-jobs',function(Request $r){
            $where=['is_active=1'];$args=[];
            foreach(['source','location'] as $key)if(!empty($r->query[$key])){$where[]='`'.$key.'` LIKE ?';$args[]='%'.$r->query[$key].'%';}
            if(!empty($r->query['q'])||!empty($r->query['keyword'])){$where[]='(title LIKE ? OR company LIKE ? OR jd LIKE ?)';$q='%'.($r->query['q']??$r->query['keyword']).'%';array_push($args,$q,$q,$q);}
            if(!empty($r->query['level'])){$where[]='title LIKE ?';$args[]='%'.$r->query['level'].'%';}
            if(($r->query['savedOnly']??$r->query['saved']??'')==='true'){$where[]='id IN (SELECT external_job_id FROM saved_external_jobs WHERE user_id=?)';$args[]=$this->auth->current()['id'];}
            $sql=implode(' AND ',$where);$limit=$this->limit($r);$page=$this->page($r);$total=(int)$this->db->one('SELECT COUNT(*) n FROM external_jobs WHERE '.$sql,$args)['n'];
            return ['items'=>array_map(function($j){return $this->db->map('external_jobs',$j);},$this->db->all('SELECT * FROM external_jobs WHERE '.$sql.' ORDER BY crawled_at DESC,id DESC LIMIT '.$limit.' OFFSET '.(($page-1)*$limit),$args)),
                'pagination'=>['page'=>$page,'limit'=>$limit,'total'=>$total,'totalPages'=>(int)ceil($total/$limit)],'cached'=>false,'total'=>$total,'page'=>$page,'limit'=>$limit];
        });
        foreach(['crawl','sync'] as $action)$this->route('POST','external-jobs/'.$action,function(Request $r){$this->auth->role(['ADMIN']);$keywords=$r->body['keywords']??['developer'];if(!is_array($keywords)||count($keywords)>10)throw new Error(400,'Up to 10 keywords');return ['taskId'=>$this->queue('CRAWL',['keywords'=>$keywords]),'status'=>'queued'];});
        $this->route('GET','external-jobs/{id}/summary',function(Request $r,array $p){$j=$this->find('external_jobs',['id'=>$p['id']]);$description=$j['jd']?mb_substr(strip_tags($j['jd']),0,1200):null;return $this->only($j,['id','source','title','company','location','salary','url','skills'])+['description'=>$description,'requirements'=>null,'highlights'=>array_slice($j['skills'],0,6),'hasDetail'=>(bool)$j['jd'],'summary'=>$description??$j['title']];});
        $this->route('GET','external-jobs/{id}',function(Request $r,array $p){return $this->find('external_jobs',['id'=>$p['id']]);});
        foreach(['POST','DELETE'] as $method)$this->route($method,'external-jobs/{id}/save',function(Request $r,array $p)use($method){$this->find('external_jobs',['id'=>$p['id']]);$key=['userId'=>$this->auth->current()['id'],'externalJobId'=>$p['id']];$old=$this->db->record('saved_external_jobs',$key);if($method==='DELETE'||$old){$this->db->delete('saved_external_jobs',$key);return ['saved'=>false];}$this->db->write('saved_external_jobs',$key);return ['saved'=>true];});
        $this->route('POST','external-jobs/{id}/screen',function(Request $r,array $p){
            $this->auth->current();$j=$this->find('external_jobs',['id'=>$p['id']]);
            if(!empty($r->body['cvFileId'])){$cv=$this->owned('cv_files',$r->body['cvFileId']);$text=$cv['extractedText'];}
            else $text=$r->required('cv');
            if(!$text)throw new Error(409,'CV text not available; upload a readable PDF or DOCX');
            if(strlen($text)>200000)throw new Error(400,'CV text too long');
            $result=(new \Platform\Services\Screening())->screen($text,$j['jd']?:$j['title'],$j['id'],['requiredSkills'=>$j['skills']]);
            return ['score'=>$result['overall_score'],'verdict'=>$result['grade'],'strengths'=>$result['strengths'],'gaps'=>$result['concerns'],'suggestion'=>$result['recommendation'],'keywords_matched'=>$result['matched_skills'],'keywords_missing'=>$result['missing_skills']];
        });
        $this->route('GET','tasks/{id}',function(Request $r,array $p){$u=$this->auth->current();$t=$this->db->one('SELECT * FROM task_queue WHERE id=?',[$p['id']]);if(!$t)throw new Error(404,'Task missing');$payload=json_decode($t['payload'],true);if($u['role']!=='ADMIN'){if($t['kind']!=='SCREEN')throw new Error(403,'Task access denied');$a=$this->find('applications',['id'=>$payload['applicationId']]);if($a['candidateId']!==$u['id']){$j=$this->find('jobs',['id'=>$a['jobId']]);$this->auth->company($j['companyId']);}}return ['id'=>$t['id'],'status'=>$t['status'],'attempts'=>(int)$t['attempts'],'error'=>$t['last_error']];});
        $this->route('GET','recommendations/jobs',function(Request $r){return (new \Platform\Services\Profile($this->db))->recommendations($this->auth->current()['id'],$this->limit($r,10));});
        $this->route('GET','search',function(Request $r){return (new \Platform\Services\Search($this->db))->find((string)($r->query['query']??$r->query['q']??''),(string)($r->query['type']??'all'),$this->limit($r,10),$this->auth->current());});
        $this->route('POST','moderation/reports',function(Request $r){$u=$this->auth->current();return $this->db->write('moderation_reports',['reporterId'=>$u['id'],'targetType'=>$r->choice('contentType',['POST','COMMENT','PROFILE','MESSAGE']),'targetId'=>$r->required('targetId'),'reason'=>$r->required('reason'),'details'=>$r->body['detail']??null]);});
        $this->route('GET','moderation/reports',function(){$this->auth->role(['ADMIN']);return $this->db->records('moderation_reports','1',[],'created_at DESC');});
        $this->route('PATCH','moderation/reports/{id}',function(Request $r,array $p){$this->auth->role(['ADMIN']);$report=$this->find('moderation_reports',['id'=>$p['id']]);$action=$r->choice('action',['KEEP','DELETE']);return $this->db->transaction(function()use($report,$action){if($action==='DELETE'){$table=['POST'=>'posts','COMMENT'=>'comments','PROFILE'=>'users','MESSAGE'=>'messages'][$report['targetType']]??null;if($table)$this->db->write($table,['deletedAt'=>\now()],['id'=>$report['targetId']]);}return $this->db->write('moderation_reports',['status'=>$action==='DELETE'?'DELETED':'DISMISSED'],['id'=>$report['id']]);});});
        $this->route('GET','moderation/recovery-requests',function(){$this->auth->role(['ADMIN']);return $this->db->records('password_recovery_requests');});
        $this->route('PATCH','moderation/recovery-requests/{id}',function(Request $r,array $p){$this->auth->role(['ADMIN']);return $this->db->write('password_recovery_requests',['status'=>'RESOLVED'],['id'=>$p['id']]);});
    }
}
