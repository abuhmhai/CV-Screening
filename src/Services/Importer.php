<?php
declare(strict_types=1);
namespace Platform\Services;
use Platform\Database;
class Importer {
    private Database $db;
    public function __construct(Database $db){$this->db=$db;}
    private function order(array $schema): array {
        $sql=file_get_contents(APP_ROOT.'/database/001_domain.sql');$deps=[];foreach($schema as $table=>$meta)$deps[$table]=[];
        preg_match_all('/ALTER TABLE `(\w+)`.*?REFERENCES `(\w+)`/',$sql,$matches,PREG_SET_ORDER);foreach($matches as $m)if($m[1]!==$m[2])$deps[$m[1]][]=$m[2];
        $order=[];while($deps){$ready=[];foreach($deps as $t=>$ds)if(!array_diff($ds,$order))$ready[]=$t;if(!$ready)throw new \RuntimeException('Cyclic import dependency');foreach($ready as $t){$order[]=$t;unset($deps[$t]);}}return $order;
    }
    public function run(bool $dryRun,?string $manifest,bool $verify=false): array {
        if(!\env('SOURCE_PG_DSN') || !\env('SOURCE_PG_USER'))throw new \RuntimeException('Configure SOURCE_PG_DSN and SOURCE_PG_USER');
        $source=new \PDO(\env('SOURCE_PG_DSN'),\env('SOURCE_PG_USER'),\env('SOURCE_PG_PASSWORD'),[\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION,\PDO::ATTR_DEFAULT_FETCH_MODE=>\PDO::FETCH_ASSOC]);
        $source->exec('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');$source->exec("SET LOCAL TIME ZONE 'UTC'");
        $schema=json_decode(file_get_contents(APP_ROOT.'/database/schema.json'),true);$report=['dryRun'=>$dryRun,'tables'=>[],'files'=>[],'errors'=>[]];$files=$manifest?json_decode(file_get_contents($manifest),true,512,JSON_THROW_ON_ERROR):[];$urlMap=[];
        try {
            foreach($files as $entry){$old=$entry['oldUrl'];$key=$entry['key'];if(!preg_match('#^[a-zA-Z0-9_/.-]+$#',$key)||strpos($key,'..')!==false)throw new \RuntimeException('Invalid storage key');$root=realpath(\env('SOURCE_STORAGE_ROOT'));$path=realpath($entry['path']);if(!$root||!$path||strpos($path,$root.DIRECTORY_SEPARATOR)!==0||!is_file($path)){$report['errors'][]='Missing or outside source storage: '.$old;continue;}$hash=hash_file('sha256',$path);$urlMap[$old]='/api/v1/files/'.$key;$report['files'][]=['oldUrl'=>$old,'key'=>$key,'sha256'=>$hash];}
            // Validate all source rows and files before changing the target.
            foreach($source->query('SELECT file_url FROM cv_files') as $cv)if(!isset($urlMap[$cv['file_url']]))$report['errors'][]='CV requires manifest entry: '.$cv['file_url'];
            if($report['errors'])return $report;
            // First pass validates real MySQL constraints inside a rolled-back transaction.
            // A second pass imports the same repeatable-read source snapshot.
            $passes=$verify?[false]:($dryRun?[true]:[true,false]);
            foreach($passes as $preflight){
            if($preflight)$this->db->pdo->beginTransaction();
            if(!$preflight&&!$dryRun)foreach($files as $entry){$target=Storage::root().'/'.$entry['key'];if(!is_dir(dirname($target)))mkdir(dirname($target),0770,true);if(is_file($target)&&hash_file('sha256',$target)!==hash_file('sha256',$entry['path']))throw new \RuntimeException('Destination differs: '.$entry['key']);if(!is_file($target)&&!copy($entry['path'],$target))throw new \RuntimeException('File copy failed');if(hash_file('sha256',$target)!==hash_file('sha256',$entry['path']))throw new \RuntimeException('Copy checksum failed: '.$entry['key']);}
            foreach($this->order($schema) as $table){$meta=$schema[$table];$count=(int)$source->query('SELECT COUNT(*) FROM "'.$table.'"')->fetchColumn();$report['tables'][$table]=['source'=>$count,'imported'=>0,'mismatches'=>0];
                $statement=$source->query('SELECT * FROM "'.$table.'" ORDER BY '.implode(',',array_map(function($k)use($meta){return '"'.$meta['fields'][$k]['column'].'"';},$meta['primary'])));
                $batch=[];while($row=$statement->fetch()){$data=[];foreach($meta['fields'] as $name=>$field){$value=$row[$field['column']];if($value!==null&&$field['type']==='Boolean')$value=in_array($value,[true,1,'1','t','true'],true);if($value!==null&&$field['type']==='Json')$value=json_decode($value,true,512,JSON_THROW_ON_ERROR);$data[$name]=$this->rewrite($value,$urlMap);}
                    $key=[];foreach($meta['primary'] as $k)$key[$k]=$data[$k];$existing=$this->db->record($table,$key);
                    if($verify){if(!$existing||!$this->same($data,$existing,$meta['fields']))$report['tables'][$table]['mismatches']++;}
                    else {if($table==='users'&&!preg_match('/^\$2[aby]\$/',$data['passwordHash']))$data['passwordHash']=$existing&&password_verify($data['passwordHash'],$existing['passwordHash'])?$existing['passwordHash']:password_hash($data['passwordHash'],PASSWORD_BCRYPT);$batch[]=[$data,$key,$existing!==null];}
                    if(count($batch)>=250){$this->flush($table,$batch);$report['tables'][$table]['imported']+=count($batch);$batch=[];}
                }
                if($batch){$this->flush($table,$batch);$report['tables'][$table]['imported']+=count($batch);}
                $report['tables'][$table]['target']=(int)$this->db->one('SELECT COUNT(*) n FROM `'.$table.'`')['n'];if($verify&&$report['tables'][$table]['mismatches'])$report['errors'][]='Data mismatch: '.$table;
            }
            if($preflight){$this->db->pdo->rollBack();foreach($report['tables'] as $table=>&$stats){$stats['imported']=0;$stats['target']=(int)$this->db->one('SELECT COUNT(*) n FROM `'.$table.'`')['n'];}unset($stats);}
            }
            if(!$dryRun)foreach($files as $entry){$target=Storage::root().'/'.$entry['key'];$mime=(new \finfo(FILEINFO_MIME_TYPE))->file($target);if(strtolower(pathinfo($target,PATHINFO_EXTENSION))==='docx')$mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';$this->db->run('INSERT INTO stored_files(storage_key,owner_id,original_name,mime_type,size_bytes,sha256,visibility) VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE owner_id=VALUES(owner_id),sha256=VALUES(sha256),size_bytes=VALUES(size_bytes),visibility=VALUES(visibility)',[$entry['key'],$entry['ownerId']??null,basename($entry['path']),$mime,filesize($target),hash_file('sha256',$target),$entry['visibility']??'PRIVATE']);}
            if($verify)foreach($report['files'] as $f){$path=Storage::root().'/'.$f['key'];if(!is_file($path)||hash_file('sha256',$path)!==$f['sha256'])$report['errors'][]='File checksum mismatch: '.$f['key'];}
            return $report;
        }finally{if($this->db->pdo->inTransaction())$this->db->pdo->rollBack();$source->rollBack();}
    }
    private function flush(string $table,array $rows): void {$fn=function()use($table,$rows){foreach($rows as [$data,$key,$exists])$this->db->write($table,$data,$exists?$key:null);};$this->db->pdo->inTransaction()?$fn():$this->db->transaction($fn);}
    private function rewrite($value,array $urls){if(is_array($value)){foreach($value as &$v)$v=$this->rewrite($v,$urls);return $value;}if(is_string($value))return strtr($value,$urls);return $value;}
    private function same(array $source,array $target,array $fields): bool {
        foreach($source as $key=>$value){$actual=$target[$key]??null;if($fields[$key]['type']==='DateTime'&&$value!==null)$value=(new \DateTimeImmutable($value,new \DateTimeZone('UTC')))->format('Y-m-d\TH:i:s.v\Z');if($key==='passwordHash'&&!preg_match('/^\$2[aby]\$/',$value)){if(!password_verify($value,$actual))return false;continue;}if($fields[$key]['type']==='Decimal'&&$value!==null){if((float)$value!==(float)$actual)return false;}elseif($value!=$actual)return false;}return true;
    }
}
