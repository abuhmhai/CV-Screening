<?php
declare(strict_types=1);
namespace Platform\Controllers;
use Platform\Database;
use Platform\Auth;
use Platform\Http\Error;
use Platform\Http\Request;
use Platform\Http\Router;
abstract class Controller {
    protected Database $db; protected Auth $auth; protected Router $router;
    public function __construct(Database $db,Auth $auth,Router $router){$this->db=$db;$this->auth=$auth;$this->router=$router;$this->routes();}
    abstract protected function routes(): void;
    protected function route(string $method,string $path,callable $fn): void { $this->router->add($method,'/api/v1/'.$path,$fn); }
    protected function find(string $table,array $key): array { $r=$this->db->record($table,$key); if(!$r)throw new Error(404,'Record not found'); return $r; }
    protected function only(array $body,array $keys): array { return array_intersect_key($body,array_flip($keys)); }
    protected function owned(string $table,string $id,string $field='userId'): array { $u=$this->auth->current(); $r=$this->find($table,['id'=>$id]); if($r[$field]!==$u['id'])throw new Error(403,'Access denied'); return $r; }
    protected function notify(string $userId,string $type,string $title,string $body,array $data=[]): array { return $this->db->write('notifications',compact('userId','type','title','body','data')); }
    protected function queue(string $kind,array $payload): string { $id=\uuid(); $this->db->run('INSERT INTO task_queue(id,kind,payload) VALUES(?,?,?)',[$id,$kind,json_encode($payload,JSON_THROW_ON_ERROR)]); return $id; }
    protected function safeUser(array $u): array { unset($u['passwordHash']); $u['profile']=$this->db->record('user_profiles',['userId'=>$u['id']]); return $u; }
    protected function limit(Request $r,int $default=20): int { return max(1,min(100,(int)($r->query['limit']??($r->query['pageSize']??$default)))); }
    protected function page(Request $r): int { return max(1,(int)($r->query['page']??1)); }
}
