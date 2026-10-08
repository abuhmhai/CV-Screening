<?php
declare(strict_types=1);
require __DIR__.'/../bootstrap.php';
if(is_file(APP_ROOT.'/.env')) {
    new Platform\Database();
    echo "Existing MySQL configuration connected successfully.\n";
    exit;
}
// Creates only the new MySQL target; no legacy database is modified.
$host=env('MYSQL_HOST','127.0.0.1');$port=(int)env('MYSQL_PORT','33306');
$name=env('MYSQL_DATABASE','cvscreening_php');$admin=env('MYSQL_ADMIN_USER','root');$adminPassword=env('MYSQL_ADMIN_PASSWORD');
if(!preg_match('/^[a-zA-Z0-9_]+$/',$name))throw new RuntimeException('Invalid database name');
$pdo=new PDO('mysql:host='.$host.';port='.$port,$admin,$adminPassword,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE DATABASE IF NOT EXISTS `'.$name.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
if(!is_file(APP_ROOT.'/.env')) {
    $text=file_get_contents(APP_ROOT.'/.env.example');
    $text=preg_replace('/^DB_DSN=.*$/m','DB_DSN=mysql:host='.$host.';port='.$port.';dbname='.$name.';charset=utf8mb4',$text);
    $text=preg_replace('/^DB_USER=.*$/m','DB_USER='.$admin,$text);
    $text=preg_replace('/^DB_PASSWORD=.*$/m','DB_PASSWORD='.$adminPassword,$text);
    $text=preg_replace('/^JWT_SECRET=.*$/m','JWT_SECRET='.bin2hex(random_bytes(32)),$text);
    $text.="\nSEED_PASSWORD=".env('SEED_PASSWORD','Demo@12345')."\n";
    file_put_contents(APP_ROOT.'/.env',$text);
    echo "Created apps/php/.env (existing configuration is never overwritten).\n";
}
echo "MySQL target ready: ".$name."\nRun console.php migrate and console.php seed next.\n";
