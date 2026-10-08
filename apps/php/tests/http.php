<?php
declare(strict_types=1);
require __DIR__.'/../bootstrap.php';
use Platform\Database;
use Platform\Services\Worker;
if(!env('TEST_DB_DSN')||strpos(env('TEST_DB_DSN'),'test')===false)throw new RuntimeException('Set TEST_DB_DSN to a dedicated test database');
putenv('DB_DSN='.env('TEST_DB_DSN'));$db=new Database();$root=APP_ROOT.'/storage/tests';if(!is_dir($root))mkdir($root,0770,true);$users=[];$companies=[];$files=[];$checks=0;
function verify(bool $condition,string $label): void {global $checks;if(!$condition)throw new RuntimeException('FAIL: '.$label);$checks++;echo 'PASS: '.$label."\n";}
function request(string $path,string $method='GET',$body=null,string $client='candidate',bool $csrf=true): array {
    global $root;$url=env('TEST_APP_URL','http://127.0.0.1:8080').$path;$ch=curl_init($url);$jar=$root.'/'.$client.'.cookies';$headers=['Accept: application/json'];
    if($csrf&&$method!=='GET'){[$status,$token]=request('/api/v1/auth/csrf','GET',null,$client);$headers[]='X-CSRF-Token: '.$token['csrfToken'];}
    curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_COOKIEFILE=>$jar,CURLOPT_COOKIEJAR=>$jar,CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_TIMEOUT=>30]);
    if($body!==null){if(!is_array($body)||!isset($body['file'])){$body=json_encode($body,JSON_THROW_ON_ERROR);$headers[]='Content-Type: application/json';}curl_setopt($ch,CURLOPT_POSTFIELDS,$body);}
    curl_setopt($ch,CURLOPT_HTTPHEADER,$headers);$raw=curl_exec($ch);$status=curl_getinfo($ch,CURLINFO_HTTP_CODE);$error=curl_error($ch);curl_close($ch);if($raw===false)throw new RuntimeException($error);return [$status,json_decode($raw,true)??$raw];
}
try {
    [$status,$health]=request('/api/v1/health');verify($status===200&&$health['status']==='ok','Health endpoint');
    [$status,$html]=request('/');verify($status===200&&strpos($html,'TalentFlow')!==false,'HTML home page');
    [$status]=request('/api/v1/auth/register','POST',['email'=>'bad@example.com'], 'candidate',false);verify($status===403,'Cookie writes require CSRF');
    foreach(['candidate'=>'CANDIDATE','recruiter'=>'RECRUITER','stranger'=>'CANDIDATE'] as $client=>$role){$name=$client.'-'.substr(uuid(),0,8);[$status,$tokens]=request('/api/v1/auth/register','POST',['email'=>$name.'@test.local','username'=>$name,'password'=>'Test-password-123','fullName'=>'Ứng viên Việt','role'=>$role],$client);verify($status===200&&isset($tokens['accessToken']),'Register '.$role);[$status,$me]=request('/api/v1/auth/me','GET',null,$client);$users[]=$me['id'];verify($status===200&&$me['role']===$role,'Cookie login '.$role);}
    [$status,$c]=request('/api/v1/companies','POST',['name'=>'HTTP Test Company','slug'=>uuid()],'recruiter');verify($status===200,'Create company');$companies[]=$c['id'];
    [$status,$job]=request('/api/v1/jobs','POST',['companyId'=>$c['id'],'title'=>'PHP Developer','description'=>'PHP MySQL 2 years experience','requiredSkills'=>['PHP','MySQL'],'jobType'=>'FULL_TIME','level'=>'JUNIOR','status'=>'ACTIVE'],'recruiter');verify($status===200,'Publish job with company membership');
    [$status]=request('/api/v1/jobs','POST',['companyId'=>$c['id'],'title'=>'Intrusion'],'stranger');verify($status===403,'Candidate cannot publish jobs');
    [$status,$search]=request('/api/v1/jobs/search?keyword=PHP');verify($status===200&&!empty($search['items']),'Search jobs');
    $pdf=new Dompdf\Dompdf();$pdf->loadHtml('<meta charset="utf-8"><p>PHP MySQL HTML 3 years experience</p>');$pdf->render();$path=$root.'/cv.pdf';file_put_contents($path,$pdf->output());
    [$status,$cv]=request('/api/v1/users/me/cv','POST',['file'=>new CURLFile($path,'application/pdf','CV.pdf')]);verify($status===200&&isset($cv['id']),'Upload PDF CV');$files[]=preg_replace('#^/api/v1/files/#','',$cv['fileUrl']);
    // This text fixture allows testing PHP fallback without Python running.
    $db->write('cv_files',['extractedText'=>'PHP MySQL HTML 3 years experience'],['id'=>$cv['id']]);
    [$status]=request($cv['fileUrl'],'GET',null,'stranger');verify($status===403,'CV download is private');
    [$status,$a]=request('/api/v1/applications','POST',['jobId'=>$job['id'],'cvFileId'=>$cv['id']]);verify($status===200&&$a['status']==='APPLIED','Apply and enqueue atomically');
    [$status]=request('/api/v1/applications','POST',['jobId'=>$job['id'],'cvFileId'=>$cv['id']]);verify($status===409,'Duplicate application rejected');
    [$status]=request('/api/v1/applications/'.$a['id'],'GET',null,'stranger');verify($status===403,'Application cannot be read by another candidate');
    (new Worker($db))->once();[$status,$detail]=request('/api/v1/applications/'.$a['id']);verify($status===200&&$detail['status']==='HR_REVIEW'&&isset($detail['aiResult']['overallScore']),'Worker scores CV and advances to HR_REVIEW');
    [$status]=request('/api/v1/applications/'.$a['id'].'/schedule-interview','POST',['interviewAt'=>'2026-12-01T09:00:00+07:00'],'recruiter');verify($status===200,'Schedule interview');
    [$status,$interview]=request('/api/v1/applications/'.$a['id']);verify($status===200&&strpos($interview['interviewAt'],'2026-12-01')===0,'Interview date is returned from status history');
    [$status,$offer]=request('/api/v1/applications/'.$a['id'].'/offer','POST',['salaryAmount'=>25000000,'salaryCurrency'=>'VND'],'recruiter');verify($status===200&&$offer['status']==='PENDING','Send offer');
    [$status]=request('/api/v1/applications/'.$a['id'].'/offer/respond','POST',['action'=>'accept']);verify($status===200,'Candidate accepts offer');
    [$status,$detail]=request('/api/v1/applications/'.$a['id']);verify($detail['status']==='HIRED','Offer acceptance advances to HIRED');
    [$status,$post]=request('/api/v1/social/posts','POST',['content'=>'Private test post','visibility'=>'PRIVATE']);verify($status===200,'Create private post');[$status,$feed]=request('/api/v1/feed','GET',null,'stranger');verify(!in_array($post['id'],array_column($feed,'id'),true),'Private post not in other user feed');
    [$status,$conv]=request('/api/v1/messages/conversations','POST',['participantIds'=>[$users[1]]]);verify($status===200,'Start conversation');
    [$status,$msg]=request('/api/v1/messages','POST',['conversationId'=>$conv['id'],'content'=>'Hello Việt']);verify($status===200,'Send message');
    [$status,$poll]=request('/api/v1/messages/conversations/'.$conv['id'].'/poll','GET',null,'recruiter');verify($status===200&&count($poll['items'])===1,'Recipient receives polling messages');
    [$status,$next]=request('/api/v1/messages/conversations/'.$conv['id'].'/poll?cursor='.urlencode($poll['cursor']),'GET',null,'recruiter');verify($status===200&&count($next['items'])===0,'Polling cursor avoids duplicates');
    [$status,$same]=request('/api/v1/messages/conversations','POST',['participantIds'=>[$users[1]]]);verify($status===200&&$same['id']===$conv['id'],'Direct conversation is reused');
    [$status,$wrapped]=request('/api/v1/messages/conversations');verify($status===200&&isset($wrapped[0]['conversation']['id']),'Conversation retains legacy response field');
    [$status,$privacy]=request('/api/v1/privacy/settings','PATCH',['profilePublic'=>true,'allowMessagesFromNonConnections'=>true,'showOnlinePresence'=>false,'showActivity'=>false],'recruiter');verify($status===200&&!$privacy['showOnlinePresence']&&$privacy['profilePublic'],'Legacy privacy toggles persist');
    request('/api/v1/presence/heartbeat','POST',[],'recruiter');[$status,$presence]=request('/api/v1/messages/conversations');$peer=array_values(array_filter($presence[0]['participants'],function($p)use($users){return $p['userId']===$users[1];}))[0];verify($status===200&&$peer['online']===false,'Hidden online presence is respected');
    $historyIds=[];for($i=0;$i<56;$i++){$record=$db->write('messages',['conversationId'=>$conv['id'],'senderId'=>$users[1],'content'=>'History fixture '.$i,'sentAt'=>'2026-10-01T12:00:00Z']);$historyIds[]=$record['id'];}
    sort($historyIds);[$status,$older]=request('/api/v1/messages/conversations/'.$conv['id'].'?before='.urlencode($historyIds[30]).'&limit=50');verify($status===200&&count($older)===30&&!in_array($historyIds[30],array_column($older,'id'),true),'UUID history pagination handles messages at the same timestamp');
    [$status]=request('/api/v1/messages/conversations/'.$conv['id'].'?before=invalid-cursor');verify($status===400,'Invalid history cursor is rejected');
    [$status,$companyDetail]=request('/api/v1/companies/'.$c['id']);verify($status===200&&isset($companyDetail['company'],$companyDetail['activeJobs'],$companyDetail['posts']),'Company detail retains legacy UI fields');
    [$status,$globalSearch]=request('/api/v1/search?query=PHP');verify($status===200&&isset($globalSearch['jobs'][0]['company']['name']),'Global job search includes company data');
    [$status,$alert]=request('/api/v1/job-alerts','POST',['keyword'=>'PHP','filters'=>['location'=>'Hà Nội'],'frequency'=>'WEEKLY']);verify($status===200&&$alert['filters']['location']==='Hà Nội','Job alert preserves location filter');
    [$status,$alert]=request('/api/v1/job-alerts/'.$alert['id'],'PATCH',['isActive'=>false]);verify($status===200&&!$alert['isActive'],'Job alert can be paused');
    [$status]=request('/api/v1/job-alerts/'.$alert['id'],'DELETE');verify($status===200,'Job alert can be deleted');
    [$status]=request('/api/v1/messages/conversations/'.$conv['id'].'/poll','GET',null,'stranger');verify($status===403,'Nonparticipant cannot poll conversation');
    [$status,$generated]=request('/api/v1/users/me/generated-cv','POST',['title'=>'CV Việt','data'=>['fullName'=>'Ứng viên Việt','skills'=>['PHP','MySQL']]]);verify($status===200,'Build structured CV');
    [$status,$binary]=request('/api/v1/users/me/generated-cv/'.$generated['id'].'/export');verify($status===200&&strpos($binary,'%PDF-')===0,'Export PDF');
    [$status,$updated]=request('/api/v1/users/me/generated-cv/'.$generated['id'],'PATCH',['title'=>'Updated CV']);verify($status===200&&$updated['title']==='Updated CV','Edit structured CV');
    [$status,$external]=request('/api/v1/external-jobs?limit=1');verify($status===200&&isset($external['pagination']['totalPages']),'External jobs retain pagination contract');
    if($external['items']){[$status,$report]=request('/api/v1/external-jobs/'.$external['items'][0]['id'].'/screen','POST',['cv'=>'PHP MySQL HTML developer with 3 years experience']);verify($status===200&&isset($report['score'],$report['keywords_matched']),'External screening accepts CV text');}
    $image=$root.'/media.png';file_put_contents($image,base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII='));
    [$status,$media]=request('/api/v1/uploads/media','POST',['file'=>new CURLFile($image,'image/png','media.png')]);verify($status===200&&isset($media['url']),'Upload post media');$files[]=substr($media['url'],14);
    [$status]=request('/api/v1/social/posts','POST',['content'=>'Private attachment','visibility'=>'PRIVATE','mediaUrls'=>[$media['url']]]);verify($status===200,'Private post with owned attachment');
    [$status]=request($media['url'],'GET',null,'stranger');verify($status===403,'Private post attachment is inaccessible to outsiders');
    [$status]=request('/api/v1/social/posts','POST',['content'=>'Public attachment','visibility'=>'PUBLIC','mediaUrls'=>[$media['url']]]);verify($status===200,'Public post with attachment');
    [$status]=request($media['url'],'GET',null,'public');verify($status===200,'Public post attachment is readable without login');
    [$status]=request('/api/v1/social/posts','POST',['content'=>'Stolen attachment','mediaUrls'=>[$media['url']]],'stranger');verify($status===403,'Only attachment owner can publish it');
    foreach(['experiences'=>['company'=>'Audit company','position'=>'Developer','startDate'=>'2024-01-01'],'educations'=>['school'=>'Audit school','degree'=>'Bachelor','startYear'=>2020],'certifications'=>['name'=>'Audit certificate','issuer'=>'Audit issuer'],'projects'=>['title'=>'Audit project','skills'=>['PHP']]] as $kind=>$values){
        [$status,$entry]=request('/api/v1/users/me/'.$kind,'POST',$values);verify($status===200&&isset($entry['id']),'Create profile '.$kind);
        $field=array_keys($values)[0];[$status,$updatedEntry]=request('/api/v1/users/me/'.$kind.'/'.$entry['id'],'PATCH',[$field=>'Updated audit']);verify($status===200&&$updatedEntry[$field]==='Updated audit','Edit profile '.$kind);
        [$status]=request('/api/v1/users/me/'.$kind.'/'.$entry['id'],'DELETE',null,'stranger');verify($status===403,'Profile '.$kind.' enforces ownership');
        [$status]=request('/api/v1/users/me/'.$kind.'/'.$entry['id'],'DELETE');verify($status===200,'Delete profile '.$kind);
    }
    [$status,$slug]=request('/api/v1/users/me/public-slug','POST',[]);verify($status===200&&isset($slug['slug']),'Generate public profile link');
    [$status,$publicProfile]=request('/api/v1/public/users/'.$slug['slug'],'GET',null,'public');verify($status===200&&$publicProfile['fullName']==='Ứng viên Việt','Public profile is readable');
    request('/api/v1/privacy/settings','PATCH',['profilePublic'=>false]);[$status]=request('/api/v1/public/users/'.$slug['slug'],'GET',null,'public');verify($status===403,'Private profile link is protected');request('/api/v1/privacy/settings','PATCH',['profilePublic'=>true]);
    [$status,$connection]=request('/api/v1/social/connections','POST',['addresseeId'=>$users[1]]);verify($status===200&&$connection['status']==='PENDING','Send connection invitation');
    [$status]=request('/api/v1/social/connections/'.$connection['id'].'/status','PATCH',['status'=>'ACCEPTED']);verify($status===403,'Sender cannot accept own invitation');
    [$status,$accepted]=request('/api/v1/social/connections/'.$connection['id'].'/status','PATCH',['status'=>'ACCEPTED'],'recruiter');verify($status===200&&$accepted['status']==='ACCEPTED','Recipient accepts invitation');
    [$status,$blocked]=request('/api/v1/social/connections/'.$connection['id'].'/status','PATCH',['status'=>'BLOCKED']);verify($status===200&&$blocked['status']==='BLOCKED','Block connection');
    [$status]=request('/api/v1/messages','POST',['conversationId'=>$conv['id'],'content'=>'Blocked sender'],'recruiter');verify($status===403,'Blocked connection cannot send chat');
    [$status]=request('/api/v1/social/connections/'.$connection['id'],'DELETE');verify($status===200,'Remove blocked connection');
    [$status,$publicPost]=request('/api/v1/social/posts','POST',['content'=>'Audit social interactions','visibility'=>'PUBLIC']);verify($status===200,'Publish feed post');
    [$status,$reaction]=request('/api/v1/social/posts/'.$publicPost['id'].'/reactions','POST',['reactionType'=>'LOVE'],'recruiter');verify($status===200&&$reaction['likeCount']===1,'React to feed post');
    [$status,$reaction]=request('/api/v1/social/posts/'.$publicPost['id'].'/reactions','POST',['reactionType'=>'LOVE'],'recruiter');verify($status===200&&$reaction['userReaction']===null,'Toggle feed reaction off');
    [$status,$comment]=request('/api/v1/social/posts/'.$publicPost['id'].'/comments','POST',['content'=>'Audit comment'],'recruiter');verify($status===200&&isset($comment['id']),'Comment on feed post');
    [$status,$reply]=request('/api/v1/social/posts/'.$publicPost['id'].'/comments','POST',['content'=>'Audit reply','parentId'=>$comment['id']]);verify($status===200&&$reply['parentId']===$comment['id'],'Reply to comment');
    [$status,$report]=request('/api/v1/moderation/reports','POST',['contentType'=>'MESSAGE','targetId'=>$msg['id'],'reason'=>'Audit report']);verify($status===200&&$report['targetType']==='MESSAGE','Report chat message');
    [$status]=request('/api/v1/moderation/reports/'.$report['id'],'PATCH',['action'=>'DELETE']);verify($status===403,'Candidate cannot moderate reports');
    [$status,$permalink]=request('/feed?post='.$publicPost['id']);verify($status===200&&strpos($permalink,'Audit social interactions')!==false,'Feed permalink opens the selected post');
    [$status]=request('/api/v1/social/posts/'.$publicPost['id'],'DELETE');verify($status===200,'Delete own feed post');
    foreach(['/profile','/jobs','/external-jobs','/feed','/network','/messages','/notifications','/applications','/saved-jobs','/cv-builder','/settings','/settings/account','/settings/profile','/settings/privacy','/settings/appearance','/settings/security','/settings/notifications','/goals','/onboarding','/search','/search?q=PHP','/applications/'.$a['id'],'/ai-score/'.$a['id'],'/ai-score-detail?applicationId='.$a['id'],'/company/'.$c['id'],'/jobs/'.$job['id']] as $page){[$status,$html]=request($page);verify($status===200&&strpos($html,'<!doctype html>')!==false&&strpos($html,'Warning:')===false&&strpos($html,'Fatal error:')===false,'HTML '.$page);}
    [$status]=request('/recruiter/dashboard','GET',null,'candidate');verify($status===403,'Candidate cannot view recruiter dashboard');
    [$status]=request('/recruiter/dashboard','GET',null,'recruiter');verify($status===200,'Recruiter dashboard renders');
    [$status]=request('/api/v1/auth/logout','POST',[]);verify($status===200,'Logout revokes session');[$status]=request('/api/v1/auth/me');verify($status===401,'Logged out session cannot be reused');
    echo $checks." HTTP checks passed\n";
}catch(Throwable $e){fwrite(STDERR,$e->getMessage()."\n");$failed=true;
}finally {
    foreach($companies as $id)$db->delete('companies',['id'=>$id]);
    foreach($users as $id){$db->run('DELETE FROM application_status_history WHERE changed_by=?',[$id]);$db->run('DELETE FROM conversation_participants WHERE user_id=?',[$id]);$db->run('DELETE FROM conversations WHERE id NOT IN (SELECT conversation_id FROM conversation_participants)');$db->delete('users',['id'=>$id]);}
    foreach($files as $key){$db->run('DELETE FROM stored_files WHERE storage_key=?',[$key]);$f=Platform\Services\Storage::root().'/'.$key;if(is_file($f))unlink($f);}
}
if(!empty($failed))exit(1);
