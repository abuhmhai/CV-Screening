<?php
declare(strict_types=1);
require __DIR__.'/../bootstrap.php';
use Platform\Services\Screening;
use Platform\Services\Crawler;
use Platform\Http\Router;
use Platform\Http\Request;
$passed=0;
function check(bool $condition,string $name): void {global $passed;if(!$condition)throw new RuntimeException('FAIL: '.$name);$passed++;echo 'PASS: '.$name."\n";}
try {
    check(PHP_VERSION_ID>=70400&&PHP_VERSION_ID<80000,'Tests run on PHP 7.4');
    foreach(['src','views','public/assets'] as $folder)foreach(new RecursiveIteratorIterator(new RecursiveDirectoryIterator(APP_ROOT.'/'.$folder)) as $file){if(!$file->isFile()||!in_array($file->getExtension(),['php','js','css'],true))continue;$source=file_get_contents($file->getPathname());if(strpos($source,"\0")!==false||!mb_check_encoding($source,'UTF-8'))throw new RuntimeException('Invalid text source: '.$file->getPathname());}check(true,'PHP views and browser assets contain valid UTF-8 text');
    $plain=['status'=>'APPLIED','aiResult'=>null];$scored=['status'=>'APPLIED','aiResult'=>['overallScore'=>0]];
    check(Platform\Services\ApplicationView::screening($plain)&&!Platform\Services\ApplicationView::screening($scored),'Unscored application screens; zero is a valid score');
    check(Platform\Services\ApplicationView::label($scored)==='Ứng tuyển thành công'&&Platform\Services\ApplicationView::stage($scored)===2,'Scored APPLIED label and pipeline match legacy UI');
    check(Platform\Services\ApplicationView::stage(['status'=>'INTERVIEW'])===3,'Interview uses Result pipeline stage');
    $threadSource=file_get_contents(APP_ROOT.'/views/partials/comment-thread.php');check(strpos($threadSource,"'LOVE'=>'Yêu thích'")!==false&&strpos(file_get_contents(APP_ROOT.'/public/assets/feed-ui.js'),"LOVE:'Yêu thích'")!==false,'Vietnamese reaction labels survive file generation');
    $comparison=Platform\Services\CvParser::compare('PHP MySQL Google React.js',['PHP','MySQL','Go','React.js']);check($comparison['matched']===['PHP','MySQL','React.js']&&$comparison['missing']===['Go']&&$comparison['matchPct']===75,'CV comparison respects aliases and skill word boundaries');
    check(Platform\Services\CvParser::parse("Kỹ năng\nPHP MySQL")['sections'][0]['title']==='Kỹ năng','Vietnamese CV sections are extracted');
    $ids=[];for($i=0;$i<100;$i++)$ids[]=uuid();check(count(array_unique($ids))===100&&preg_match('/^[0-9a-f-]{14}4[0-9a-f-]{21}$/',$ids[0])===1,'UUIDs are unique version 4');
    $schema=json_decode(file_get_contents(APP_ROOT.'/database/schema.json'),true,512,JSON_THROW_ON_ERROR);check(count($schema)===35,'All 35 legacy models are represented');
    check(Screening::normalizeSkill('React.js')==='react'&&Screening::normalizeSkill('JS')==='javascript','Skill aliases');
    $good=Screening::local('PHP MySQL HTML 3 years experience github','PHP MySQL developer 2 years experience',['requiredSkills'=>['PHP','MySQL'],'education'=>[['degree'=>'bachelor','gpa'=>3.5]]]);
    $bad=Screening::local('Marketing 1 year experience','PHP MySQL developer 2 years experience',['requiredSkills'=>['PHP','MySQL']]);
    check($good['overall_score']>$bad['overall_score']&&$good['breakdown']['skill_score']===100.0,'Screening separates matching and nonmatching CVs');
    check(count($bad['missing_skills'])===2,'Missing skills are explained');
    $jobs=Crawler::parse('<div class="job-item"><a href="/viec-lam/php-123.html">PHP Developer</a><span class="company-name">Công ty Việt</span></div><a href="https://evil.example/viec-lam/other.html">Bad link</a>','topcv','https://www.topcv.vn','#/viec-lam/[^/]+\.html$#','php');
    check(count($jobs)===1&&$jobs[0]['company']==='Công ty Việt','Crawler parses UTF-8 and rejects foreign hosts');
    $router=new Router();$router->add('GET','/a/{id}',function($r,$p){return $p['id'];});$r=new Request();$r->method='GET';$r->path='/a/test';check($router->dispatch($r)==='test','Router path parameters');
    if(env('TEST_DB_DSN')) {require __DIR__.'/integration.php';}
    else echo "SKIP: MySQL integration (set TEST_DB_DSN to a dedicated test database)\n";
    echo $passed." checks passed\n";
}catch(Throwable $e){fwrite(STDERR,$e->getMessage()."\n".$e->getTraceAsString()."\n");exit(1);}
