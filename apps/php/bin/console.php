<?php
declare(strict_types=1);
require __DIR__.'/../bootstrap.php';
use Platform\Database;
use Platform\Services\Worker;
$command=$argv[1]??'help';
try {
    if($command==='help'){echo "Commands: migrate, seed, worker [--once], import [--dry-run] [--files=manifest.json], verify, inventory\n";exit;}
    $db=new Database();
    if($command==='migrate'){
        $db->pdo->exec('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(150) PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3))');
        foreach(glob(APP_ROOT.'/database/[0-9]*.sql') as $file){$name=basename($file);$hash=hash_file('sha256',$file);$old=$db->one('SELECT checksum FROM schema_migrations WHERE name=?',[$name]);if($old){if(!hash_equals($old['checksum'],$hash))throw new RuntimeException('Applied migration changed: '.$name);continue;}
            foreach(preg_split('/;\s*(?:\r?\n|$)/',file_get_contents($file)) as $sql)if(trim($sql)!=='')$db->pdo->exec($sql);
            $db->run('INSERT INTO schema_migrations(name,checksum) VALUES(?,?)',[$name,$hash]);echo 'Applied '.$name."\n";
        }
    }elseif($command==='seed'){
        $password=env('SEED_PASSWORD');if(strlen($password)<8)throw new RuntimeException('Set SEED_PASSWORD (at least 8 characters) before seeding');
        $db->transaction(function()use($db,$password){
            $users=[];foreach(['candidate'=>'CANDIDATE','recruiter'=>'RECRUITER','admin'=>'ADMIN'] as $name=>$role){$raw=$db->one('SELECT id FROM users WHERE email=?',[$name.'@demo.local']);$u=$raw?$db->record('users',$raw):$db->write('users',['email'=>$name.'@demo.local','username'=>$name,'passwordHash'=>password_hash($password,PASSWORD_BCRYPT),'role'=>$role,'isVerified'=>true]);if(!$db->record('user_profiles',['userId'=>$u['id']]))$db->write('user_profiles',['userId'=>$u['id'],'fullName'=>ucfirst($name),'headline'=>$role==='CANDIDATE'?'PHP Developer':'TalentFlow']);$users[$name]=$u;}
            $raw=$db->one('SELECT id FROM companies WHERE slug=?',['talentflow-demo']);$company=$raw?$db->record('companies',$raw):$db->write('companies',['name'=>'TalentFlow Demo','slug'=>'talentflow-demo','industry'=>'Technology','description'=>'Công ty demo tuyển dụng']);
            $member=['companyId'=>$company['id'],'userId'=>$users['recruiter']['id']];if(!$db->record('company_members',$member))$db->write('company_members',array_merge($member,['role'=>'OWNER']));
            if(!$db->one('SELECT id FROM jobs WHERE company_id=?',[$company['id']]))$db->write('jobs',['companyId'=>$company['id'],'createdBy'=>$users['recruiter']['id'],'title'=>'PHP Developer','description'=>'PHP MySQL HTML developer with 2 years experience.','jobType'=>'FULL_TIME','level'=>'JUNIOR','location'=>'Hồ Chí Minh','requiredSkills'=>['PHP','MySQL','HTML'],'status'=>'ACTIVE','publishedAt'=>now()]);
            foreach(json_decode(file_get_contents(APP_ROOT.'/database/external-jobs-demo.json'),true) as $job)if(!$db->one('SELECT id FROM external_jobs WHERE url=?',[$job['url']]))$db->write('external_jobs',$job);
            Platform\Services\Demo::populate($db,$users,$company);
        });echo "Demo data ready (existing accounts were not overwritten).\n";
    }elseif($command==='worker'){$worker=new Worker($db);do{$worker->scheduleAlerts();$did=$worker->once();if(in_array('--once',$argv,true))break;if(!$did)sleep(2);}while(true);
    }elseif(in_array($command,['import','verify'],true)){
        $importer=new Platform\Services\Importer($db);$manifest=null;foreach($argv as $arg)if(strpos($arg,'--files=')===0)$manifest=substr($arg,8);
        $report=$importer->run($command==='verify'||in_array('--dry-run',$argv,true),$manifest,$command==='verify');
        $dir=APP_ROOT.'/storage/reports';if(!is_dir($dir))mkdir($dir,0770,true);$path=$dir.'/'.$command.'-'.gmdate('Ymd-His').'.json';file_put_contents($path,json_encode($report,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE));echo json_encode($report,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)."\nReport: ".$path."\n";if($report['errors'])exit(1);
    }elseif($command==='inventory'){
        $router=new Platform\Http\Router();$auth=new Platform\Auth($db);foreach(['Accounts','Recruitment','Social','Messaging','Tools'] as $name){$class='Platform\\Controllers\\'.$name;new $class($db,$auth,$router);}echo count($router->inventory())." PHP routes\n";
    }else throw new RuntimeException('Unknown command');
}catch(Throwable $e){fwrite(STDERR,$e->getMessage()."\n");exit(1);}
