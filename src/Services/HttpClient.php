<?php
declare(strict_types=1);
namespace Platform\Services;
use Platform\Http\Error;
class HttpClient {
    public function request(string $url, $body=null, array $headers=[], int $timeout=10): array {
        $ch=curl_init($url);
        curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>$timeout,CURLOPT_FOLLOWLOCATION=>false]);
        if($body!==null) { curl_setopt($ch,CURLOPT_POST,true); if(is_array($body) && !isset($body['file'])) { $body=json_encode($body,JSON_THROW_ON_ERROR); $headers[]='Content-Type: application/json'; } curl_setopt($ch,CURLOPT_POSTFIELDS,$body); }
        curl_setopt($ch,CURLOPT_HTTPHEADER,$headers); $raw=curl_exec($ch); $status=curl_getinfo($ch,CURLINFO_HTTP_CODE); $error=curl_error($ch); curl_close($ch);
        if($raw===false || $status<200 || $status>=300)throw new Error(502,'Remote service failed: '.($error?:'HTTP '.$status));
        $result=json_decode($raw,true); if(!is_array($result))throw new Error(502,'Invalid remote response'); return $result;
    }
}
