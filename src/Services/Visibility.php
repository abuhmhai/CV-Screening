<?php
declare(strict_types=1);
namespace Platform\Services;
use Platform\Database;
use Platform\Http\Error;
class Visibility {
    private Database $db;
    public function __construct(Database $db){$this->db=$db;}
    public function connected(string $a,string $b): bool {return (bool)$this->db->one("SELECT id FROM connections WHERE status='ACCEPTED' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?))",[$a,$b,$b,$a]);}
    public function blocked(string $a,string $b): bool {return (bool)$this->db->one("SELECT id FROM connections WHERE status='BLOCKED' AND ((requester_id=? AND addressee_id=?) OR (requester_id=? AND addressee_id=?))",[$a,$b,$b,$a]);}
    public function post(array $post,?array $viewer): bool {
        if($post['deletedAt'])return false;
        $author=$this->db->record('users',['id'=>$post['authorId']]);if(!$author||$author['deletedAt'])return false;
        if($viewer && $viewer['id']===$post['authorId'])return true;
        if($viewer && $this->blocked($viewer['id'],$post['authorId']))return false;
        return $post['visibility']==='PUBLIC' || ($post['visibility']==='CONNECTIONS' && $viewer && $this->connected($viewer['id'],$post['authorId']));
    }
    public function requirePost(string $id,?array $viewer): array {
        $p=$this->db->record('posts',['id'=>$id]);if(!$p || !$this->post($p,$viewer))throw new Error(404,'Post not found');return $p;
    }
    public function message(string $from,string $to): bool {
        if($this->blocked($from,$to))return false;$settings=$this->db->record('privacy_settings',['userId'=>$to]);$mode=$settings['allowMessages']??'EVERYONE';
        return $mode==='EVERYONE' || ($mode==='CONNECTIONS' && $this->connected($from,$to));
    }
}
