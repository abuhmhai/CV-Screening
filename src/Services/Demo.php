<?php
declare(strict_types=1);
namespace Platform\Services;
use Platform\Database;

/** Adds examples only when absent; never resets existing accounts or their work. */
class Demo {
    public static function populate(Database $db,array $users,array $company): void {
        $candidate=$users['candidate']['id'];$recruiter=$users['recruiter']['id'];
        $profile=$db->record('user_profiles',['userId'=>$candidate]);
        if(empty($profile['about']))$db->write('user_profiles',[
            'fullName'=>'Nguyễn Minh Anh','headline'=>'PHP Developer · 3 năm kinh nghiệm',
            'about'=>'Phát triển ứng dụng PHP, MySQL và giao diện HTML. Quan tâm đến sản phẩm tuyển dụng và trải nghiệm người dùng.',
            'location'=>'Hồ Chí Minh','languages'=>[['name'=>'Vietnamese'],['name'=>'English']],
            'socialLinks'=>['github'=>'https://github.com/','website'=>'https://example.com']
        ],['userId'=>$candidate]);
        foreach(['PHP','MySQL','HTML','CSS','JavaScript'] as $name){
            $skill=$db->one('SELECT id FROM skills WHERE name=?',[$name])??$db->write('skills',['name'=>$name]);
            $key=['userId'=>$candidate,'skillId'=>$skill['id']];
            if(!$db->record('user_skills',$key))$db->write('user_skills',$key+['level'=>'ADVANCED','yearsExp'=>3]);
        }
        if(!$db->one('SELECT id FROM work_experiences WHERE user_id=?',[$candidate]))$db->write('work_experiences',[
            'userId'=>$candidate,'company'=>'Demo Software','position'=>'PHP Developer','startDate'=>'2023-01-01',
            'description'=>'Xây dựng API PHP, tối ưu MySQL và phát triển giao diện HTML/CSS.', 'isCurrent'=>true
        ]);
        if(!$db->one('SELECT id FROM educations WHERE user_id=?',[$candidate]))$db->write('educations',[
            'userId'=>$candidate,'school'=>'Đại học Công nghệ (dữ liệu mẫu)','degree'=>'Bachelor','major'=>'Computer Science','startYear'=>2018,'endYear'=>2022,'gpa'=>3.5
        ]);
        if(!$db->one('SELECT id FROM projects WHERE user_id=?',[$candidate]))$db->write('projects',[
            'userId'=>$candidate,'title'=>'TalentFlow Demo','description'=>'Ứng dụng tuyển dụng PHP, HTML và MySQL.','url'=>'https://example.com','skills'=>['PHP','MySQL','HTML']
        ]);
        $data=['fullName'=>'Nguyễn Minh Anh','headline'=>'PHP Developer','email'=>'candidate@demo.local','location'=>'Hồ Chí Minh',
            'summary'=>'PHP MySQL HTML developer with 3 years experience. Bachelor of Computer Science. GPA 3.5.',
            'skills'=>['PHP','MySQL','HTML','CSS','JavaScript'],
            'experiences'=>[['company'=>'Demo Software','position'=>'PHP Developer','description'=>'3 years building PHP MySQL HTML applications.']],
            'educations'=>[['school'=>'Demo University','degree'=>'Bachelor of Computer Science']]
        ];
        if(!$db->one('SELECT id FROM generated_cvs WHERE user_id=?',[$candidate]))$db->write('generated_cvs',[
            'userId'=>$candidate,'title'=>'CV PHP Developer (demo)','data'=>$data,'templateId'=>'classic','isPrimary'=>true
        ]);
        if(!$db->one('SELECT id FROM cv_files WHERE user_id=?',[$candidate])&&class_exists('Dompdf\\Dompdf')){
            ob_start();require APP_ROOT.'/views/cv-pdf.php';$html=ob_get_clean();
            $options=new \Dompdf\Options();$options->set('isRemoteEnabled',false);$options->set('defaultFont','DejaVu Sans');
            $pdf=new \Dompdf\Dompdf($options);$pdf->loadHtml($html,'UTF-8');$pdf->setPaper('A4');$pdf->render();
            $key='cv/'.$candidate.'/demo-php-developer.pdf';$path=Storage::root().'/'.$key;
            if(!is_dir(dirname($path)))mkdir(dirname($path),0770,true);file_put_contents($path,$pdf->output());
            $db->run('INSERT INTO stored_files(storage_key,owner_id,original_name,mime_type,size_bytes,sha256,visibility) VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE sha256=VALUES(sha256)',[
                $key,$candidate,'demo-php-developer.pdf','application/pdf',filesize($path),hash_file('sha256',$path),'PRIVATE'
            ]);
            $db->write('cv_files',['userId'=>$candidate,'fileName'=>'demo-php-developer.pdf','fileUrl'=>'/api/v1/files/'.$key,'fileSize'=>(string)filesize($path),'extractedText'=>$data['summary'].' PHP MySQL HTML CSS JavaScript','isPrimary'=>true]);
        }
        $job=$db->one('SELECT id FROM jobs WHERE company_id=? LIMIT 1',[$company['id']]);
        $cv=$db->one('SELECT id FROM cv_files WHERE user_id=? LIMIT 1',[$candidate]);
        if($job&&$cv&&!$db->one('SELECT id FROM applications WHERE candidate_id=? AND job_id=?',[$candidate,$job['id']])){
            $a=$db->write('applications',['candidateId'=>$candidate,'jobId'=>$job['id'],'cvFileId'=>$cv['id'],'coverLetter'=>'Đơn ứng tuyển mẫu để thử quy trình chấm CV và tuyển dụng.','status'=>'APPLIED']);
            $db->write('application_status_history',['applicationId'=>$a['id'],'toStatus'=>'APPLIED','changedBy'=>$candidate]);
            $db->run('INSERT INTO task_queue(id,kind,payload) VALUES(?,?,?)',[\uuid(),'SCREEN',json_encode(['applicationId'=>$a['id']])]);
        }
        if(!$db->one('SELECT id FROM posts WHERE author_id=?',[$recruiter]))$db->write('posts',[
            'authorId'=>$recruiter,'content'=>'Chào mừng đến TalentFlow! Công ty đang tuyển PHP Developer. Đây là dữ liệu demo để thử ứng tuyển, kết nối và nhắn tin.','visibility'=>'PUBLIC'
        ]);
        $exists=$db->one('SELECT a.conversation_id FROM conversation_participants a JOIN conversation_participants b ON b.conversation_id=a.conversation_id WHERE a.user_id=? AND b.user_id=?',[$candidate,$recruiter]);
        if(!$exists){
            $conversation=$db->write('conversations',['type'=>'DIRECT']);
            foreach([$candidate,$recruiter] as $id)$db->write('conversation_participants',['conversationId'=>$conversation['id'],'userId'=>$id]);
            $db->write('messages',['conversationId'=>$conversation['id'],'senderId'=>$recruiter,'content'=>'Chào anh! Anh có thể thử gửi tin nhắn và xem kết quả ứng tuyển tại đây.']);
        }
    }
}
