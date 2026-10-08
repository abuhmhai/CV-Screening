<?php
declare(strict_types=1);
require __DIR__.'/../bootstrap.php';
$dsn=env('TEST_DB_DSN',env('DB_DSN'));
if(strpos($dsn,'mysql:')!==0||!preg_match('/(?:^|;)dbname=([a-zA-Z0-9_]+)/',$dsn,$match)||strpos($match[1],'test')===false)throw new RuntimeException('Dedicated MySQL test database required');
$name=$match[1];$serverDsn=preg_replace('/;dbname=[a-zA-Z0-9_]+/','',$dsn);
$pdo=new PDO($serverDsn,env('TEST_DB_USER',env('DB_USER')),env('TEST_DB_PASSWORD',env('DB_PASSWORD')),[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$pdo->exec('CREATE DATABASE IF NOT EXISTS `'.$name.'` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
echo "Test database ready: ".$name."\n";
