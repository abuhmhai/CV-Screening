<?php
declare(strict_types=1);
namespace Platform\Services;
use Platform\Database;
use Platform\Auth;
use Platform\Http\Error;
class OAuth {
    private Database $db; private Auth $auth;
    public function __construct(Database $db,Auth $auth){$this->db=$db;$this->auth=$auth;}
    private function config(string $provider): array {
        if(!in_array($provider,['google','linkedin'],true))throw new Error(400,'Unsupported OAuth provider');
        $prefix=strtoupper($provider); $id=\env($prefix.'_CLIENT_ID'); $secret=\env($prefix.'_CLIENT_SECRET'); $redirect=\env($prefix.'_REDIRECT_URI');
        if(!$id || !$secret || !$redirect)throw new Error(503,'OAuth provider is not configured');
        return [$id,$secret,$redirect];
    }
    public function start(string $provider): array {
        [$id,,$redirect]=$this->config($provider); $state=bin2hex(random_bytes(32));
        $this->auth->cookie('oauth_state',$provider.'.'.$state,time()+600);
        $url=$provider==='google'?'https://accounts.google.com/o/oauth2/v2/auth':'https://www.linkedin.com/oauth/v2/authorization';
        return ['url'=>$url.'?'.http_build_query(['client_id'=>$id,'redirect_uri'=>$redirect,'response_type'=>'code','scope'=>$provider==='google'?'openid email profile':'openid profile email','state'=>$state])];
    }
    public function callback(string $provider,string $code,string $state): array {
        [$id,$secret,$redirect]=$this->config($provider);
        if(!$state || !hash_equals($_COOKIE['oauth_state']??'',$provider.'.'.$state))throw new Error(400,'Invalid OAuth state');
        $this->auth->cookie('oauth_state','',1); $client=new HttpClient();
        $token=$client->request($provider==='google'?'https://oauth2.googleapis.com/token':'https://www.linkedin.com/oauth/v2/accessToken',http_build_query(['grant_type'=>'authorization_code','code'=>$code,'client_id'=>$id,'client_secret'=>$secret,'redirect_uri'=>$redirect]),['Content-Type: application/x-www-form-urlencoded']);
        $p=$client->request($provider==='google'?'https://openidconnect.googleapis.com/v1/userinfo':'https://api.linkedin.com/v2/userinfo',null,['Authorization: Bearer '.$token['access_token']]);
        if(empty($p['email']) || empty($p['email_verified']))throw new Error(401,'A verified email is required');
        return $this->db->transaction(function()use($p){
            $raw=$this->db->one('SELECT id FROM users WHERE email=?',[$p['email']]);
            $u=$raw?$this->db->record('users',['id'=>$raw['id']]):null;
            if(!$u){$u=$this->db->write('users',['email'=>strtolower($p['email']),'passwordHash'=>password_hash(bin2hex(random_bytes(32)),PASSWORD_BCRYPT),'role'=>'CANDIDATE','isVerified'=>true]);$this->db->write('user_profiles',['userId'=>$u['id'],'fullName'=>$p['name']??$p['email']]);}
            if($u['deletedAt'])throw new Error(401,'Account unavailable');
            return $this->auth->issue($u);
        });
    }
}
