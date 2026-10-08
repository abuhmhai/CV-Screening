<?php
declare(strict_types=1);

define('APP_ROOT', __DIR__);
date_default_timezone_set('UTC');
if (is_file(__DIR__ . '/.env')) {
    foreach (file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES) as $line) {
        if (preg_match('/^([A-Z_]+)=(.*)$/', trim($line), $m) && getenv($m[1]) === false) {
            putenv($m[1] . '=' . trim($m[2], "\"'"));
        }
    }
}
if (is_file(__DIR__ . '/vendor/autoload.php')) require __DIR__ . '/vendor/autoload.php';
spl_autoload_register(function (string $class): void {
    if (strpos($class, 'Platform\\') === 0) {
        $file = __DIR__ . '/src/' . str_replace('\\', '/', substr($class, 9)) . '.php';
        if (is_file($file)) require $file;
    }
});
function env(string $key, string $default = ''): string { $v = getenv($key); return $v === false ? $default : $v; }
function e($value): string { return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function safe_url($value): string {
    $url=trim((string)$value);
    return preg_match('#^(https?://|/(?!/))#i',$url) ? $url : '#';
}
function uuid(): string {
    $b = random_bytes(16); $b[6] = chr((ord($b[6]) & 15) | 64); $b[8] = chr((ord($b[8]) & 63) | 128);
    $h = bin2hex($b); return substr($h,0,8).'-'.substr($h,8,4).'-'.substr($h,12,4).'-'.substr($h,16,4).'-'.substr($h,20);
}
function now(): string { return (new DateTimeImmutable())->format('Y-m-d H:i:s.v'); }
