<?php
declare(strict_types=1);
namespace Platform\Services;
use Platform\Database;
class Profile {
    private Database $db;
    public function __construct(Database $db){$this->db=$db;}
    public function checklist(string $id): array {
        $p=$this->db->record('user_profiles',['userId'=>$id])??[];$count=function($table)use($id){return (int)$this->db->one('SELECT COUNT(*) n FROM `'.$table.'` WHERE user_id=?',[$id])['n'];};
        $checks=[['full_name','Add full name','basic',!empty($p['fullName']),10],['headline','Add professional headline','basic',!empty($p['headline']),10],['about','Add profile summary','basic',!empty($p['about']),10],['location','Add location','basic',!empty($p['location']),5],['avatar','Upload profile photo','basic',!empty($p['avatarUrl']),10],['cover','Upload cover photo','basic',!empty($p['coverUrl']),5],['experience','Add work experience','experience',$count('work_experiences')>0,15],['education','Add education','education',$count('educations')>0,10],['skills','Add at least 3 skills','skills',$count('user_skills')>=3,10],['projects','Showcase a project','projects',$count('projects')>0,5],['certifications','Add a certification','certifications',$count('certifications')>0,5],['languages','Add a language','languages',!empty($p['languages']),2],['links','Add a portfolio link','links',!empty(array_filter($p['socialLinks']??[])),3],['cv','Upload a CV','cv',$count('cv_files')>0,0]];
        $items=[];$score=0;$completed=0;foreach($checks as [$key,$label,$section,$done,$weight]){$items[]=compact('key','label','section','done');if($done){$completed++;$score+=$weight;}}
        if($p && $p['profileCompleteness']!==$score)$this->db->write('user_profiles',['profileCompleteness'=>$score],['userId'=>$id]);
        return ['completion'=>(int)round($completed/count($checks)*100),'items'=>$items,'profileCompleteness'=>$score];
    }
    public function recommendations(string $id,int $limit=12): array {
        $owned=array_map('strtolower',array_column($this->db->all('SELECT s.name FROM skills s JOIN user_skills us ON us.skill_id=s.id WHERE us.user_id=?',[$id]),'name'));
        $jobs=$this->db->records('jobs',"status='ACTIVE' AND id NOT IN (SELECT job_id FROM applications WHERE candidate_id=?)",[$id]);foreach($jobs as &$job){$matched=count(array_intersect(array_map('strtolower',$job['requiredSkills']),$owned));$job['_count']=['applications'=>(int)$this->db->one('SELECT COUNT(*) n FROM applications WHERE job_id=?',[$job['id']])['n']];$job['recommendationScore']=$matched*20+min(30,$job['_count']['applications']);$job['company']=$this->db->record('companies',['id'=>$job['companyId']]);}usort($jobs,function($a,$b){return $b['recommendationScore']<=>$a['recommendationScore'];});return array_slice($jobs,0,$limit);
    }
    public function insights(string $id): array {
        $check=$this->checklist($id);$completeness=$check['profileCompleteness'];$owned=array_map('strtolower',array_column($this->db->all('SELECT s.name FROM skills s JOIN user_skills us ON us.skill_id=s.id WHERE us.user_id=?',[$id]),'name'));$jobs=$this->recommendations($id);$demand=[];foreach($jobs as $j)foreach($j['requiredSkills'] as $s){$s=strtolower(trim($s));$demand[$s]=($demand[$s]??0)+1;}$total=array_sum($demand);$covered=0;$matchedSkills=[];$missingSkills=[];foreach($demand as $skill=>$count){if(in_array($skill,$owned,true)){$covered+=$count;$matchedSkills[]=$skill;}else $missingSkills[]=['skill'=>$skill,'demand'=>$count];}usort($missingSkills,function($a,$b){return $b['demand']<=>$a['demand'];});$skillCoverage=$total?(int)round($covered/$total*100):0;$readiness=(int)round($completeness*.6+$skillCoverage*.4);$tips=[];if($completeness<80)$tips[]='Complete your profile sections to boost recruiter visibility.';if(count($owned)<5)$tips[]='Add at least 5 skills to match more jobs.';if($missingSkills)$tips[]='In-demand missing skills: '.implode(', ',array_column(array_slice($missingSkills,0,3),'skill'));
        $recommendedJobs=[];foreach(array_slice($jobs,0,5) as $j)$recommendedJobs[]=['id'=>$j['id'],'title'=>$j['title'],'company'=>$j['company']['name']??null,'location'=>$j['location'],'recommendationScore'=>$j['recommendationScore'],'matchedSkillCount'=>count(array_intersect(array_map('strtolower',$j['requiredSkills']),$owned))];
        return compact('readiness','completeness','skillCoverage','matchedSkills','missingSkills','recommendedJobs','tips');
    }
    public function dashboard(string $id): array {
        $groups=$this->db->all('SELECT status,COUNT(*) n FROM applications WHERE candidate_id=? GROUP BY status',[$id]);$applicationsByStatus=[];foreach($groups as $g)$applicationsByStatus[$g['status']]=(int)$g['n'];$totalApplications=array_sum($applicationsByStatus);$savedJobs=(int)$this->db->one('SELECT (SELECT COUNT(*) FROM saved_jobs WHERE user_id=?)+(SELECT COUNT(*) FROM saved_external_jobs WHERE user_id=?) n',[$id,$id])['n'];$recentApplications=$this->db->all('SELECT a.id,a.status,a.applied_at appliedAt,j.title jobTitle,c.name company FROM applications a JOIN jobs j ON j.id=a.job_id JOIN companies c ON c.id=j.company_id WHERE a.candidate_id=? ORDER BY a.applied_at DESC LIMIT 5',[$id]);return compact('totalApplications','applicationsByStatus','savedJobs','recentApplications');
    }
}
