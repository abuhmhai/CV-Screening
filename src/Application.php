<?php
declare(strict_types=1);
namespace Platform;
use Platform\Http\Request;
use Platform\Http\Router;
use Platform\Http\Error;
use Platform\Services\Storage;
class Application {
    public Database $db; public Auth $auth; public Router $router;
    public function __construct(?Database $db=null){$this->db=$db??new Database();$this->auth=new Auth($this->db);$this->router=new Router();foreach(['Accounts','Recruitment','Social','Messaging','Tools'] as $name){$class='Platform\\Controllers\\'.$name;new $class($this->db,$this->auth,$this->router);}}
    public function api(string $path,array $query=[]){$r=new Request();$r->method='GET';$r->path='/api/v1/'.$path;$r->query=$query;return $this->router->dispatch($r);}
    public function handle(Request $request): void {
        if(strpos($request->path,'/api/v1/files/')===0){if($request->method!=='GET')throw new Error(405,'Method not allowed');(new Storage($this->db,$this->auth))->serve(substr($request->path,14));return;}
        if(strpos($request->path,'/api/v1/')===0){
            if(strpos($request->path,'/api/v1/auth/')===0 && $request->path!=='/api/v1/auth/csrf' && $request->path!=='/api/v1/auth/me')Services\RateLimiter::auth($this->db,$_SERVER['REMOTE_ADDR']??'cli');
            if(!in_array($request->method,['GET','HEAD','OPTIONS'],true))$this->auth->csrf();
            $response=$this->router->dispatch($request);if($response!==null){header('Content-Type: application/json; charset=utf-8');echo json_encode($response,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);}return;
        }
        (new Controllers\Pages($this))->render($request);
    }
}
