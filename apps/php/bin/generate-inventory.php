<?php
declare(strict_types=1);
$root=realpath(__DIR__.'/../../api/src');$routes=[];
$it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));
foreach($it as $file){if(substr($file->getFilename(),-13)!=='controller.ts')continue;$text=file_get_contents($file->getPathname());preg_match('/@Controller\((?:"([^"]*)")?\)/',$text,$c);$prefix=$c[1]??'';preg_match_all('/@(Get|Post|Patch|Delete|Put)\((?:"([^"]*)")?\)/',$text,$ms,PREG_SET_ORDER);foreach($ms as $m)$routes[]=['method'=>strtoupper($m[1]),'path'=>'/api/v1/'.trim($prefix.'/'.($m[2]??''),'/'),'source'=>str_replace('\\','/',substr($file->getPathname(),strlen($root)+1))];}
file_put_contents(__DIR__.'/../database/legacy-routes.json',json_encode($routes,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)."\n");
$pages=[];$root=realpath(__DIR__.'/../../web/app');$it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root));foreach($it as $f)if($f->getFilename()==='page.tsx')$pages[]='/'.str_replace('\\','/',trim(substr($f->getPath(),strlen($root)),'/\\'));
file_put_contents(__DIR__.'/../database/legacy-pages.json',json_encode($pages,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)."\n");
// The legacy seed consists solely of literal objects, arrays, strings and null.
$text=file_get_contents(__DIR__.'/../../api/src/external-jobs/crawler/seed-jobs.ts');$text=substr($text,strpos($text,'= [')+2);$text=trim($text," \r\n\t;");$text=preg_replace('/(?<=[{,])\s*([a-zA-Z]+)\s*:/','"$1":',$text);$text=preg_replace('/,\s*([}\]])/','$1',$text);$data=json_decode($text,true,512,JSON_THROW_ON_ERROR);
file_put_contents(__DIR__.'/../database/external-jobs-demo.json',json_encode($data,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)."\n");
echo count($routes).' routes, '.count($pages).' pages, '.count($data)." external demo jobs\n";
$text=file_get_contents(__DIR__.'/../../web/lib/goals-service.ts');
preg_match('/DEFAULT_SAMPLE_GOALS[^=]*=\s*(\[.*?\n\]);/s',$text,$goals);
$json=preg_replace('/(?<=[{,])\s*([a-zA-Z]+)\s*:/','"$1":',$goals[1]);
$json=preg_replace('/,\s*([}\]])/','$1',$json);
$data=json_decode($json,true,512,JSON_THROW_ON_ERROR);
file_put_contents(__DIR__.'/../public/assets/demo-goals.json',json_encode($data,JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES)."\n");
