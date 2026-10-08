<?php
declare(strict_types=1);
require __DIR__.'/../bootstrap.php';
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');
try {
    $request=new Platform\Http\Request();
    (new Platform\Application())->handle($request);
} catch(Throwable $exception) {
    $status=$exception instanceof Platform\Http\Error?$exception->status:500;
    if($exception instanceof PDOException && $exception->getCode()==='23000')$status=409;
    http_response_code($status);
    $message=$status===500?'Server unavailable':$exception->getMessage();
    error_log(get_class($exception).': '.$exception->getMessage());
    if(strpos($_SERVER['REQUEST_URI']??'','/api/')===0){header('Content-Type: application/json; charset=utf-8');echo json_encode(['statusCode'=>$status,'message'=>$message,'error'=>$status===500?'Internal Server Error':$message],JSON_UNESCAPED_UNICODE);}
    else {header('Content-Type: text/html; charset=utf-8');echo '<!doctype html><html lang="vi"><meta charset="utf-8"><link rel="stylesheet" href="/assets/app.css"><main class="container"><h1>'.e($status).'</h1><p>'.e($message).'</p><a href="/auth/sign-in">Đăng nhập</a> · <a href="/">Trang chủ</a></main></html>';}
}
