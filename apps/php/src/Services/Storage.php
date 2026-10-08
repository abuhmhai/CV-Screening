<?php
declare(strict_types=1);
namespace Platform\Services;
use Platform\Database;
use Platform\Auth;
use Platform\Http\Error;
class Storage {
    private Database $db; private Auth $auth;
    public function __construct(Database $db,Auth $auth){$this->db=$db;$this->auth=$auth;}
    public static function root(): string { $root=APP_ROOT.'/storage/files'; if(!is_dir($root))mkdir($root,0770,true);return $root; }
    public function upload(array $user,string $kind): array {
        $f=$_FILES['file']??null;if(!$f || $f['error']!==UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name']))throw new Error(400,'Invalid upload');
        $max=($kind==='cv'?5:($kind==='media'?8:10))*1024*1024;if($f['size']>$max)throw new Error(400,'File exceeds size limit');
        $mime=(new \finfo(FILEINFO_MIME_TYPE))->file($f['tmp_name']);$ext=strtolower(pathinfo($f['name'],PATHINFO_EXTENSION));
        $types=['image/png'=>'png','image/jpeg'=>'jpg','image/webp'=>'webp','image/gif'=>'gif','application/pdf'=>'pdf','text/plain'=>'txt'];
        if($ext==='docx') { $z=new \ZipArchive();if($z->open($f['tmp_name'])===true){$valid=$z->locateName('word/document.xml')!==false;$z->close();if($valid){$mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';$types[$mime]='docx';}} }
        if(!isset($types[$mime]) || ($kind==='cv'&&!in_array($types[$mime],['pdf','docx'],true)) || (in_array($kind,['avatar','cover'],true)&&!in_array($types[$mime],['png','jpg','webp'],true)))throw new Error(400,'Unsupported file type');
        if($kind==='cv' && $ext!==$types[$mime])throw new Error(400,'CV filename extension does not match document type');
        if(strpos($mime,'image/')===0 && getimagesize($f['tmp_name'])===false)throw new Error(400,'Invalid image');
        $key=$kind.'/'.$user['id'].'/'.\uuid().'.'.$types[$mime];$path=self::root().'/'.$key;mkdir(dirname($path),0770,true);
        if(!move_uploaded_file($f['tmp_name'],$path))throw new Error(500,'Cannot save upload');
        $url='/api/v1/files/'.$key;$visibility=in_array($kind,['avatar','cover'],true)?'PUBLIC':'PRIVATE';
        $this->db->run('INSERT INTO stored_files(storage_key,owner_id,original_name,mime_type,size_bytes,sha256,visibility) VALUES(?,?,?,?,?,?,?)',[$key,$user['id'],basename($f['name']),$mime,$f['size'],hash_file('sha256',$path),$visibility]);
        if($kind==='cv') {
            $text=null;try{$out=(new HttpClient())->request(\env('AI_SERVICE_URL','http://127.0.0.1:8000').'/extract',['file'=>new \CURLFile($path,$mime,$f['name'])],[],30);$text=$out['text'];}catch(\Throwable $e){error_log('CV extraction unavailable: '.$e->getMessage());}
            return $this->db->write('cv_files',['userId'=>$user['id'],'fileUrl'=>$url,'fileName'=>basename($f['name']),'fileSize'=>$f['size'],'extractedText'=>$text,'isPrimary'=>!$this->db->one('SELECT id FROM cv_files WHERE user_id=?',[$user['id']])]);
        }
        if(in_array($kind,['avatar','cover'],true))$this->db->write('user_profiles',[$kind.'Url'=>$url],['userId'=>$user['id']]);
        return ['url'=>$url,'name'=>basename($f['name']),'mimeType'=>$mime,'size'=>$f['size']];
    }
    public function serve(string $key): void {
        if(strpos($key,"\0")!==false)throw new Error(400,'Invalid file key');
        $root=realpath(self::root());$path=realpath($root.'/'.$key);
        if(!$path || strpos($path,$root.DIRECTORY_SEPARATOR)!==0 || !is_file($path))throw new Error(404,'File not found');
        $f=$this->db->one('SELECT * FROM stored_files WHERE storage_key=?',[$key]);if(!$f)throw new Error(404,'File metadata not found');
        if($f['visibility']!=='PUBLIC') {
            $u=$this->auth->current(false);$allowed=$u&&($u['id']===$f['owner_id'] || $u['role']==='ADMIN');
            if(!$allowed && strpos($key,'media/')===0){$visibility=new Visibility($this->db);foreach($this->db->records('posts','deleted_at IS NULL AND JSON_CONTAINS(media_urls,?)',[json_encode('/api/v1/files/'.$key)]) as $post)if($visibility->post($post,$u)){$allowed=true;break;}}
            if(!$allowed && $u && $u['role']==='RECRUITER')$allowed=(bool)$this->db->one('SELECT a.id FROM applications a JOIN cv_files cv ON cv.id=a.cv_file_id JOIN jobs j ON j.id=a.job_id JOIN company_members cm ON cm.company_id=j.company_id WHERE cv.file_url=? AND cm.user_id=?', ['/api/v1/files/'.$key,$u['id']]);
            if(!$allowed)throw new Error(403,'File access denied');
        }
        header('Content-Type: '.$f['mime_type']);header('Content-Length: '.filesize($path));header('X-Content-Type-Options: nosniff');header('Cache-Control: private, no-store');
        header('Content-Disposition: '.(strpos($f['mime_type'],'image/')===0 || $f['mime_type']==='application/pdf'?'inline':'attachment').'; filename="'.preg_replace('/[^a-zA-Z0-9._-]/','_',basename($f['original_name'])).'"');
        readfile($path);
    }
}
