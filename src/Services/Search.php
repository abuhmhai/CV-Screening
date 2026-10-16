<?php
declare(strict_types=1);
namespace Platform\Services;
use Platform\Database;
class Search {
    private Database $db;
    public function __construct(Database $db){$this->db=$db;}
    public function find(string $query,string $type,int $limit,array $viewer): array {
        $out=['people'=>[],'jobs'=>[],'posts'=>[],'companies'=>[]];$query=trim($query);if($query==='')return $out;
        $q='%'.str_replace(['\\','%','_'],['\\\\','\\%','\\_'],$query).'%';$limit=max(1,min(50,$limit));$visibility=new Visibility($this->db);
        if(in_array($type,['all','jobs'],true)){
            $rows=$this->db->all("SELECT * FROM jobs WHERE status='ACTIVE' AND (title LIKE ? OR description LIKE ? OR location LIKE ?) LIMIT ".$limit,[$q,$q,$q]);
            foreach($rows as $row){$job=$this->db->map('jobs',$row);$job['company']=$this->db->record('companies',['id'=>$job['companyId']]);$job['_count']=['applications'=>(int)$this->db->one('SELECT COUNT(*) n FROM applications WHERE job_id=?',[$job['id']])['n']];$out['jobs'][]=$job;}
        }
        if(in_array($type,['all','people'],true)){
            $rows=$this->db->all('SELECT u.* FROM users u LEFT JOIN user_profiles p ON p.user_id=u.id WHERE u.deleted_at IS NULL AND (u.email LIKE ? OR p.full_name LIKE ? OR p.headline LIKE ?)',[$q,$q,$q]);
            foreach($rows as $row){$person=$this->db->map('users',$row);$privacy=$this->db->record('privacy_settings',['userId'=>$person['id']]);if(($privacy&&$privacy['profileVisibility']!=='PUBLIC')||$visibility->blocked($viewer['id'],$person['id']))continue;unset($person['passwordHash']);$person['profile']=$this->db->record('user_profiles',['userId'=>$person['id']]);$out['people'][]=$person;if(count($out['people'])===$limit)break;}
        }
        if(in_array($type,['all','posts'],true)){
            foreach($this->db->records('posts',"deleted_at IS NULL AND visibility='PUBLIC' AND content LIKE ?",[$q]) as $post){if(!$visibility->post($post,$viewer))continue;$author=$this->db->record('users',['id'=>$post['authorId']]);unset($author['passwordHash']);$author['profile']=$this->db->record('user_profiles',['userId'=>$post['authorId']]);$post['author']=$author;$post['company']=$post['companyId']?$this->db->record('companies',['id'=>$post['companyId']]):null;$out['posts'][]=$post;if(count($out['posts'])===$limit)break;}
        }
        if(in_array($type,['all','companies'],true)){
            $rows=$this->db->all('SELECT * FROM companies WHERE name LIKE ? OR industry LIKE ? OR description LIKE ? LIMIT '.$limit,[$q,$q,$q]);
            foreach($rows as $row){$company=$this->db->map('companies',$row);$company['jobs']=array_slice($this->db->records('jobs',"company_id=? AND status='ACTIVE'",[$company['id']]),0,5);$company['_count']=['members'=>(int)$this->db->one('SELECT COUNT(*) n FROM company_members WHERE company_id=?',[$company['id']])['n']];$out['companies'][]=$company;}
        }
        return $out;
    }
}
