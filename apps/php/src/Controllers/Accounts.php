<?php
declare(strict_types=1);
namespace Platform\Controllers;
use Platform\Http\Request;
use Platform\Http\Error;
use Platform\Services\OAuth;
use Platform\Services\Storage;
class Accounts extends Controller {
    protected function routes(): void {
        $this->route('GET','health',function(){return ['status'=>'ok','service'=>'php-api'];});
        $this->route('GET','metrics',function(){return ['uptimeSeconds'=>(int)(microtime(true)-($_SERVER['REQUEST_TIME_FLOAT']??microtime(true))),'rssBytes'=>memory_get_usage(true),'heapUsedBytes'=>memory_get_usage(),'heapTotalBytes'=>memory_get_peak_usage(true),'timestamp'=>(new \DateTimeImmutable())->format(DATE_ATOM)];});
        $this->route('GET','auth/csrf',function(){ $v=$_COOKIE['csrf_token']??bin2hex(random_bytes(32)); $this->auth->cookie('csrf_token',$v,time()+86400,false); return ['csrfToken'=>$v]; });
        $this->route('POST','auth/register',function(Request $r){
            $email=strtolower($r->required('email')); if(!filter_var($email,FILTER_VALIDATE_EMAIL))throw new Error(400,'Invalid email');
            $password=$r->required('password'); if(strlen($password)<8 || strlen($password)>72)throw new Error(400,'Password must have 8–72 bytes');
            $role=$r->choice('role',['CANDIDATE','RECRUITER'],'CANDIDATE'); $name=$r->required('fullName'); $username=strtolower($r->required('username'));
            if(!preg_match('/^[a-z0-9_.-]{3,50}$/',$username))throw new Error(400,'Invalid username');
            return $this->db->transaction(function()use($r,$email,$password,$role,$name,$username){
                if($this->db->one('SELECT id FROM users WHERE email=? OR username=?',[$email,$username]))throw new Error(409,'Email or username already exists');
                $u=$this->db->write('users',['email'=>$email,'username'=>$username,'phone'=>$r->body['phone']??null,'passwordHash'=>password_hash($password,PASSWORD_BCRYPT),'role'=>$role]);
                $this->db->write('user_profiles',['userId'=>$u['id'],'fullName'=>$name,'headline'=>$role==='RECRUITER'?'Recruiter':'Open to work']);
                return $this->auth->issue($u);
            });
        });
        $this->route('POST','auth/login',function(Request $r){
            $row=$this->db->one('SELECT id FROM users WHERE email=? OR username=?',[strtolower($r->required('email')),strtolower($r->required('email'))]);
            $u=$row?$this->db->record('users',['id'=>$row['id']]):null;
            if(!$u || $u['deletedAt'] || !password_verify($r->required('password'),$u['passwordHash']))throw new Error(401,'Invalid credentials');
            return $this->auth->issue($u);
        });
        $this->route('POST','auth/refresh',function(Request $r){ return $this->auth->refresh($r->body['refreshToken']??($_COOKIE['refresh_token']??'')); });
        $this->route('POST','auth/logout',function(){return $this->auth->logout();});
        $this->route('GET','auth/me',function(){return $this->safeUser($this->auth->current());});
        $this->route('GET','auth/demo-login',function(Request $r){ if(\env('DEMO_LOGIN')!=='true')throw new Error(403,'Demo login disabled');$email=$r->query['email']??'';if(!in_array($email,['candidate@demo.local','recruiter@demo.local','admin@demo.local'],true))throw new Error(403,'Only seeded demo accounts are allowed'); $u=$this->db->one('SELECT id FROM users WHERE email=?',[$email]); if(!$u)throw new Error(404,'Demo user missing'); return $this->auth->issue($this->find('users',$u)); });
        $this->route('POST','auth/forgot-password',function(Request $r){ if(empty($r->body['email'])&&empty($r->body['phone']))throw new Error(400,'Email or phone required'); $this->db->write('password_recovery_requests',$this->only($r->body,['email','phone'])); return ['ok'=>true]; });
        $this->route('POST','auth/request-verification',function(){ $u=$this->auth->current(); $token=bin2hex(random_bytes(32)); $this->db->run('INSERT INTO verification_tokens(token_hash,user_id,expires_at) VALUES(?,?,?)',[hash('sha256',$token),$u['id'],gmdate('Y-m-d H:i:s',time()+86400)]); return ['token'=>$token]; });
        $this->route('POST','auth/verify-email',function(Request $r){ return $this->db->transaction(function()use($r){ $hash=hash('sha256',$r->required('token')); $t=$this->db->one('SELECT * FROM verification_tokens WHERE token_hash=? AND expires_at>UTC_TIMESTAMP() FOR UPDATE',[$hash]); if(!$t)throw new Error(400,'Invalid verification token'); $this->db->write('users',['isVerified'=>true],['id'=>$t['user_id']]); $this->db->run('DELETE FROM verification_tokens WHERE token_hash=?',[$hash]); return ['verified'=>true]; }); });
        $this->route('GET','auth/{provider}/callback',function(Request $r,array $p){ (new OAuth($this->db,$this->auth))->callback($p['provider'],$r->query['code']??'',$r->query['state']??''); header('Location: /profile'); return null; });
        $this->route('GET','auth/{provider}',function(Request $r,array $p){return (new OAuth($this->db,$this->auth))->start($p['provider']);});
        $this->route('GET','users',function(){ $this->auth->role(['ADMIN','RECRUITER']); return array_map([$this,'safeUser'],$this->db->records('users','deleted_at IS NULL')); });
        $this->route('GET','users/me/profile',function(){return $this->profile($this->auth->current()['id']);});
        $this->route('GET','users/{id}/profile',function(Request $r,array $p){$this->auth->current();return $this->profile($p['id']);});
        $this->route('GET','public/users/{slug}',function(Request $r,array $p){$slug=$p['slug'];$v=$this->db->one('SELECT user_id FROM user_profiles WHERE public_slug=? OR user_id=?',[$slug,$slug]);
            if(!$v)throw new Error(404,'Profile not found');
            $settings=$this->db->record('privacy_settings',['userId'=>$v['user_id']]);
            if($settings&&$settings['profileVisibility']!=='PUBLIC')throw new Error(404,'Profile not found');
            $viewer=$this->auth->current(false);
            if($viewer&&(new \Platform\Services\Visibility($this->db))->blocked($viewer['id'],$v['user_id']))throw new Error(404,'Profile not found');
            $profile=$this->profile($v['user_id']);unset($profile['cvFiles'],$profile['email'],$profile['user']['email']);return $profile;});
        $this->route('PATCH','users/me/profile',function(Request $r){$u=$this->auth->current();$data=$this->only($r->body,['fullName','headline','about','location','socialLinks','languages']);return $this->db->write('user_profiles',$data,['userId'=>$u['id']]);});
        $this->route('POST','users/me/public-slug',function(){ $u=$this->auth->current(); $p=$this->find('user_profiles',['userId'=>$u['id']]); if(!$p['publicSlug'])$p=$this->db->write('user_profiles',['publicSlug'=>($u['username']??'user').'-'.substr($u['id'],0,8)],['userId'=>$u['id']]);return ['slug'=>$p['publicSlug']]; });
        foreach(['experiences'=>'work_experiences','educations'=>'educations','certifications'=>'certifications','projects'=>'projects'] as $path=>$table){
            $this->route('GET','users/me/'.$path,function()use($table){return $this->db->records($table,'user_id=?',[$this->auth->current()['id']]);});
            $this->route('POST','users/me/'.$path,function(Request $r)use($table){$u=$this->auth->current(); $data=$this->only($r->body,array_diff(array_keys($this->db->fields($table)),['id','userId','createdAt']));$data['userId']=$u['id'];return $this->db->write($table,$data);});
            $this->route('PATCH','users/me/'.$path.'/{id}',function(Request $r,array $p)use($table){$this->owned($table,$p['id']);return $this->db->write($table,$this->only($r->body,array_diff(array_keys($this->db->fields($table)),['id','userId','createdAt'])),['id'=>$p['id']]);});
            $this->route('DELETE','users/me/'.$path.'/{id}',function(Request $r,array $p)use($table){$this->owned($table,$p['id']);$this->db->delete($table,['id'=>$p['id']]);return ['ok'=>true];});
        }
        $this->route('GET','users/me/skills',function(){return $this->skills($this->auth->current()['id']);});
        $this->route('POST','users/me/skills',function(Request $r){$u=$this->auth->current();$name=$r->required('name');$raw=$this->db->one('SELECT id FROM skills WHERE name=?',[$name]);$s=$raw?$this->find('skills',$raw):$this->db->write('skills',['name'=>$name]);$key=['userId'=>$u['id'],'skillId'=>$s['id']];$data=['level'=>$r->choice('level',['BEGINNER','INTERMEDIATE','ADVANCED','EXPERT'],'INTERMEDIATE'),'yearsExp'=>$r->body['yearsExp']??null];return $this->db->record('user_skills',$key)?$this->db->write('user_skills',$data,$key):$this->db->write('user_skills',array_merge($key,$data));});
        $this->route('DELETE','users/me/skills/{id}',function(Request $r,array $p){$this->db->delete('user_skills',['userId'=>$this->auth->current()['id'],'skillId'=>$p['id']]);return ['ok'=>true];});
        foreach(['cv','avatar','cover'] as $kind) $this->route('POST','users/me/'.$kind,function()use($kind){$u=$kind==='cv'?$this->auth->role(['CANDIDATE']):$this->auth->current();return (new Storage($this->db,$this->auth))->upload($u,$kind);});
        $this->route('GET','users/me/cv',function(){return $this->db->records('cv_files','user_id=?',[$this->auth->current()['id']]);});
        $this->route('GET','users/me/cv/{id}/parsed',function(Request $r,array $p){$cv=$this->owned('cv_files',$p['id']);return \Platform\Services\CvParser::parse($cv['extractedText']??'');});
        $this->route('POST','users/me/cv/{id}/autofill',function(Request $r,array $p){$cv=$this->owned('cv_files',$p['id']);$parsed=\Platform\Services\CvParser::parse($cv['extractedText']??'');$u=$this->auth->current();return $this->db->transaction(function()use($r,$parsed,$u){foreach(['skills','languages','certifications'] as $key){$selected=$r->body[$key]??[];if(!is_array($selected)||array_diff($selected,$parsed[$key]))throw new Error(400,'Select only detected '.$key);}
            foreach($r->body['skills']??[] as $name){$raw=$this->db->one('SELECT id FROM skills WHERE name=?',[$name]);$s=$raw?$this->find('skills',$raw):$this->db->write('skills',['name'=>$name]);$key=['userId'=>$u['id'],'skillId'=>$s['id']];if(!$this->db->record('user_skills',$key))$this->db->write('user_skills',array_merge($key,['level'=>'INTERMEDIATE']));}
            $profile=$this->find('user_profiles',['userId'=>$u['id']]);$langs=$profile['languages']??[];$names=array_column($langs,'name');foreach($r->body['languages']??[] as $name)if(!in_array($name,$names,true))$langs[]=['name'=>$name];$this->db->write('user_profiles',['languages'=>$langs],['userId'=>$u['id']]);
            foreach($r->body['certifications']??[] as $name)if(!$this->db->one('SELECT id FROM certifications WHERE user_id=? AND name=?',[$u['id'],$name]))$this->db->write('certifications',['userId'=>$u['id'],'name'=>$name,'issuer'=>'From CV — please confirm']);return ['ok'=>true];});});
        $this->route('PATCH','users/me/cv/{id}/primary',function(Request $r,array $p){$cv=$this->owned('cv_files',$p['id']);return $this->db->transaction(function()use($cv){$this->db->run('UPDATE cv_files SET is_primary=0 WHERE user_id=?',[$cv['userId']]);return $this->db->write('cv_files',['isPrimary'=>true],['id'=>$cv['id']]);});});
        $this->route('DELETE','users/me/cv/{id}',function(Request $r,array $p){$this->owned('cv_files',$p['id']);if($this->db->one('SELECT id FROM applications WHERE cv_file_id=?',[$p['id']]))throw new Error(409,'CV used by an application');$this->db->delete('cv_files',['id'=>$p['id']]);return ['ok'=>true];});
        $this->route('POST','uploads/media',function(){return (new Storage($this->db,$this->auth))->upload($this->auth->current(),'media');});
        foreach(['onboarding-checklist'=>'checklist','insights'=>'insights','dashboard'=>'dashboard'] as $kind=>$method)$this->route('GET','users/me/'.$kind,function()use($method){return (new \Platform\Services\Profile($this->db))->$method($this->auth->current()['id']);});
        $this->route('GET','privacy/settings',function(){return $this->privacy($this->auth->current()['id']);});
        $this->route('PATCH','privacy/settings',function(Request $r){$u=$this->auth->current();$this->privacy($u['id']);$data=$this->only($r->body,['profileVisibility','showActivity','showConnections','allowMessages']);if(isset($data['profileVisibility']))$r->choice('profileVisibility',['PUBLIC','CONNECTIONS','PRIVATE']);if(isset($data['allowMessages']))$r->choice('allowMessages',['EVERYONE','CONNECTIONS','NOBODY']);foreach(['profilePublic','allowMessagesFromNonConnections','showOnlinePresence'] as $key)if(array_key_exists($key,$r->body)&&!is_bool($r->body[$key]))throw new Error(400,'Invalid privacy option');if(array_key_exists('profilePublic',$r->body))$data['profileVisibility']=$r->body['profilePublic']?'PUBLIC':'PRIVATE';if(array_key_exists('allowMessagesFromNonConnections',$r->body))$data['allowMessages']=$r->body['allowMessagesFromNonConnections']?'EVERYONE':'CONNECTIONS';if(array_key_exists('showOnlinePresence',$r->body))$data['showConnections']=$r->body['showOnlinePresence'];$this->db->write('privacy_settings',$data,['userId'=>$u['id']]);return $this->privacy($u['id']);});
    }
    private function privacy(string $id): array { $row=$this->db->record('privacy_settings',['userId'=>$id])??$this->db->write('privacy_settings',['userId'=>$id]);return $row+['profilePublic'=>$row['profileVisibility']==='PUBLIC','allowMessagesFromNonConnections'=>$row['allowMessages']==='EVERYONE','showOnlinePresence'=>$row['showConnections']]; }
    private function skills(string $id): array { $s=$this->db->records('user_skills','user_id=?',[$id]);foreach($s as &$v)$v['skill']=$this->find('skills',['id'=>$v['skillId']]);return $s; }
    private function profile(string $id): array {
        $viewer=$this->auth->current(false);$settings=$this->db->record('privacy_settings',['userId'=>$id]);$owner=$viewer && ($viewer['id']===$id || $viewer['role']==='ADMIN');
        if(!$owner && $settings && $settings['profileVisibility']!=='PUBLIC') {
            $connected=$viewer && $this->db->one("SELECT id FROM connections WHERE status='ACCEPTED' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?))",[$viewer['id'],$id,$id,$viewer['id']]);
            if($settings['profileVisibility']==='PRIVATE' || !$connected)throw new Error(403,'Private profile');
        }
        $user=$this->find('users',['id'=>$id]);if($user['deletedAt'])throw new Error(404,'Profile unavailable');
        $p=$this->find('user_profiles',['userId'=>$id]);$p['user']=['id'=>$id,'role'=>$user['role'],'username'=>$user['username']];
        if($owner)$p['user']['email']=$user['email'];
        foreach(['experiences'=>'work_experiences','educations'=>'educations','certifications'=>'certifications','projects'=>'projects'] as $key=>$t)$p[$key]=$this->db->records($t,'user_id=?',[$id]);
        $p['skills']=$this->skills($id);if($owner)$p['cvFiles']=$this->db->records('cv_files','user_id=?',[$id]);
        $p['slug']=$p['publicSlug']??$id;
        $p['activity']=(!$settings||$settings['showActivity'])?['applications'=>(int)$this->db->one('SELECT COUNT(*) n FROM applications WHERE candidate_id=?',[$id])['n']]:null;
        $p['workExperiences']=$p['experiences'];$p['userSkills']=$p['skills'];$p['profile']=$this->db->record('user_profiles',['userId'=>$id]);
        $p['id']=$id;$p['role']=$user['role'];$p['username']=$user['username'];if($owner)$p['email']=$user['email'];
        return $p;
    }
}
