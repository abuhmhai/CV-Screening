<?php
// Tests insert only generated identities into a dedicated test database.
putenv('DB_DSN='.env('TEST_DB_DSN'));
$db=new Platform\Database();$app=new Platform\Application($db);
check(strpos(env('TEST_DB_DSN'),'test')!==false,'Dedicated test database is required');
$db->pdo->beginTransaction();
$created=[];
try {
    foreach(['CANDIDATE','RECRUITER','CANDIDATE'] as $role){$id=uuid();$u=$db->write('users',['id'=>$id,'email'=>$id.'@test.local','username'=>$id,'passwordHash'=>password_hash('Test-password-123',PASSWORD_BCRYPT),'role'=>$role]);$db->write('user_profiles',['userId'=>$id,'fullName'=>'Ứng viên Việt 🧑‍💻']);$created[]=$u;}
    [$candidate,$recruiter,$outsider]=$created;
    $profile=$db->record('user_profiles',['userId'=>$candidate['id']]);check($profile['fullName']==='Ứng viên Việt 🧑‍💻','MySQL preserves Vietnamese and emoji');
    $company=$db->write('companies',['name'=>'Test Company','slug'=>uuid()]);$db->write('company_members',['companyId'=>$company['id'],'userId'=>$recruiter['id'],'role'=>'OWNER']);
    $job=$db->write('jobs',['companyId'=>$company['id'],'createdBy'=>$recruiter['id'],'title'=>'PHP Developer','description'=>'PHP MySQL 2 years experience','jobType'=>'FULL_TIME','level'=>'JUNIOR','requiredSkills'=>['PHP','MySQL'],'status'=>'ACTIVE']);
    check($job['requiredSkills']===['PHP','MySQL'],'JSON skill arrays round trip');
    $cv=$db->write('cv_files',['userId'=>$candidate['id'],'fileUrl'=>'/api/v1/files/test.pdf','fileName'=>'CV Việt.pdf','fileSize'=>'9007199254740993','extractedText'=>'PHP MySQL 3 years experience']);
    check($cv['fileSize']==='9007199254740993','BIGINT file sizes are not rounded');
    $session=uuid();$db->run('INSERT INTO auth_sessions(id,user_id,refresh_hash,expires_at) VALUES(?,?,?,?)',[$session,$candidate['id'],hash('sha256','test'),gmdate('Y-m-d H:i:s',time()+3600)]);
    $token=$app->auth->sign(['sub'=>$candidate['id'],'sid'=>$session,'purpose'=>'access','exp'=>time()+3600]);$_SERVER['HTTP_AUTHORIZATION']='Bearer '.$token;
    check($app->auth->current()['id']===$candidate['id'],'Bearer token requires a live session');
    $a=$db->write('applications',['candidateId'=>$candidate['id'],'jobId'=>$job['id'],'cvFileId'=>$cv['id']]);
    check($app->api('applications/'.$a['id'])['cvFile']['id']===$cv['id'],'Candidate can read own application');
    $os=uuid();$db->run('INSERT INTO auth_sessions(id,user_id,refresh_hash,expires_at) VALUES(?,?,?,?)',[$os,$outsider['id'],hash('sha256','test'),gmdate('Y-m-d H:i:s',time()+3600)]);$_SERVER['HTTP_AUTHORIZATION']='Bearer '.$app->auth->sign(['sub'=>$outsider['id'],'sid'=>$os,'purpose'=>'access','exp'=>time()+3600]);
    $denied=false;try{$app->api('applications/'.$a['id']);}catch(Platform\Http\Error $e){$denied=$e->status===403;}check($denied,'Another candidate cannot read the application');
    $post=$db->write('posts',['authorId'=>$candidate['id'],'content'=>'Private data','visibility'=>'PRIVATE']);check(!(new Platform\Services\Visibility($db))->post($post,$outsider),'Private posts are hidden');
    $connection=$db->write('connections',['requesterId'=>$candidate['id'],'addresseeId'=>$outsider['id'],'status'=>'BLOCKED']);check(!(new Platform\Services\Visibility($db))->message($candidate['id'],$outsider['id']),'Blocked users cannot send messages');
    $routes=$app->router->inventory();$missing=[];foreach(json_decode(file_get_contents(APP_ROOT.'/database/legacy-routes.json'),true) as $route){if(strpos($route['path'],'/files/')!==false)continue;$path=preg_replace('/:([a-zA-Z]+)/','test',$route['path']);$found=false;foreach($routes as [$method,$pattern])if($method===$route['method']&&preg_match($pattern,$path)){$found=true;break;}if(!$found)$missing[]=$route['method'].' '.$route['path'];}
    if($missing)echo 'Uncovered legacy routes: '.implode(', ',$missing)."\n";
    check(!$missing,'Every legacy HTTP route is represented');
}finally{$db->pdo->rollBack();unset($_SERVER['HTTP_AUTHORIZATION']);}
