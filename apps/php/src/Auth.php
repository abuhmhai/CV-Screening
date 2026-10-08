<?php
declare(strict_types=1);
namespace Platform;
use Platform\Http\Error;
class Auth {
    private Database $db;
    public function __construct(Database $db) { $this->db=$db; }
    private function secret(): string { $s=\env('JWT_SECRET'); if(strlen($s)<32) throw new Error(503,'Configure JWT_SECRET (at least 32 characters)'); return $s; }
    private static function b64(string $v): string { return rtrim(strtr(base64_encode($v),'+/','-_'),'='); }
    public function sign(array $claims): string {
        $head=self::b64('{"alg":"HS256","typ":"JWT"}'); $payload=self::b64(json_encode($claims,JSON_THROW_ON_ERROR));
        return $head.'.'.$payload.'.'.self::b64(hash_hmac('sha256',$head.'.'.$payload,$this->secret(),true));
    }
    public function verify(string $jwt): array {
        $parts=explode('.',$jwt); if(count($parts)!==3)throw new Error(401,'Invalid token');
        [$h,$p,$sig]=$parts; $header=json_decode(base64_decode(strtr($h,'-_','+/')),true);
        if(($header['alg']??'')!=='HS256' || !hash_equals(self::b64(hash_hmac('sha256',$h.'.'.$p,$this->secret(),true)),$sig))throw new Error(401,'Invalid token');
        $claims=json_decode(base64_decode(strtr($p,'-_','+/')),true);
        if(!is_array($claims) || ($claims['exp']??0)<=time() || ($claims['purpose']??'')!=='access')throw new Error(401,'Expired token');
        return $claims;
    }
    public function current(bool $required=true): ?array {
        $header=$_SERVER['HTTP_AUTHORIZATION']??''; $bearer=preg_match('/^Bearer (.+)$/i',$header,$m)?$m[1]:null;
        $jwt=$bearer??($_COOKIE['access_token']??'');
        if(!$jwt) { if($required)throw new Error(401,'Please sign in'); return null; }
        try {
            $c=$this->verify($jwt);
            $s=$this->db->one('SELECT * FROM auth_sessions WHERE id=? AND user_id=? AND revoked_at IS NULL AND expires_at>UTC_TIMESTAMP(3)',[$c['sid']??'',$c['sub']??'']);
            $u=$s?$this->db->record('users',['id'=>$c['sub']]):null;
            if(!$u || $u['deletedAt'])throw new Error(401,'Session revoked');
            unset($u['passwordHash']); return $u;
        } catch(Error $e) { if($required)throw $e; return null; }
    }
    public function role(array $roles): array { $u=$this->current(); if(!in_array($u['role'],$roles,true))throw new Error(403,'Role not allowed'); return $u; }
    public function csrf(): void {
        if(preg_match('/^Bearer /i',$_SERVER['HTTP_AUTHORIZATION']??'')) return;
        $cookie=$_COOKIE['csrf_token']??''; $header=$_SERVER['HTTP_X_CSRF_TOKEN']??($_POST['_csrf']??'');
        if(!$cookie || !$header || !hash_equals($cookie,$header))throw new Error(403,'Invalid CSRF token');
    }
    public function cookie(string $name,string $value,int $expires,bool $httpOnly=true): void {
        setcookie($name,$value,['expires'=>$expires,'path'=>'/','secure'=>strpos(\env('APP_URL'),'https://')===0,'httponly'=>$httpOnly,'samesite'=>'Lax']);
        if($expires>time())$_COOKIE[$name]=$value;else unset($_COOKIE[$name]);
    }
    public function issue(array $user): array {
        $sid=\uuid(); $refresh=bin2hex(random_bytes(32));
        $this->db->run('INSERT INTO auth_sessions(id,user_id,refresh_hash,expires_at) VALUES(?,?,?,?)',[$sid,$user['id'],hash('sha256',$refresh),gmdate('Y-m-d H:i:s',time()+30*86400)]);
        $access=$this->sign(['sub'=>$user['id'],'sid'=>$sid,'role'=>$user['role'],'purpose'=>'access','iat'=>time(),'exp'=>time()+3600]);
        $this->cookie('access_token',$access,time()+3600); $this->cookie('refresh_token',$sid.'.'.$refresh,time()+30*86400);
        return ['accessToken'=>$access,'refreshToken'=>$sid.'.'.$refresh,'expiresIn'=>'1h'];
    }
    public function refresh(string $token): array {
        [$sid,$raw]=array_pad(explode('.',$token,2),2,'');
        return $this->db->transaction(function()use($sid,$raw){
            $s=$this->db->one('SELECT * FROM auth_sessions WHERE id=? FOR UPDATE',[$sid]);
            if(!$s || $s['revoked_at'] || strtotime($s['expires_at'])<=time() || !hash_equals($s['refresh_hash'],hash('sha256',$raw)))throw new Error(401,'Invalid refresh token');
            $u=$this->db->record('users',['id'=>$s['user_id']]); if(!$u || $u['deletedAt'])throw new Error(401,'Account unavailable');
            $this->db->run('UPDATE auth_sessions SET revoked_at=UTC_TIMESTAMP(3) WHERE id=?',[$sid]);
            return $this->issue($u);
        });
    }
    public function logout(): array {
        $u=$this->current(false);
        if($u) { $jwt=$_COOKIE['access_token']??preg_replace('/^Bearer /i','',$_SERVER['HTTP_AUTHORIZATION']??''); $c=$this->verify($jwt); $this->db->run('UPDATE auth_sessions SET revoked_at=UTC_TIMESTAMP(3) WHERE id=?',[$c['sid']]); }
        $this->cookie('access_token','',1); $this->cookie('refresh_token','',1); return ['ok'=>true];
    }
    public function company(string $id,bool $manager=false): array {
        $u=$this->role(['RECRUITER','ADMIN']); if($u['role']==='ADMIN')return $u;
        $m=$this->db->record('company_members',['companyId'=>$id,'userId'=>$u['id']]);
        if(!$m || ($manager && !in_array($m['role'],['OWNER','ADMIN'],true)))throw new Error(403,'Company access denied');
        return $u;
    }
}
