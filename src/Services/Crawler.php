<?php
declare(strict_types=1);
namespace Platform\Services;
use Platform\Database;
class Crawler {
    private Database $db;
    public function __construct(Database $db){$this->db=$db;}
    public static function sources(string $keyword): array {
        $q=rawurlencode($keyword);
        return ['topcv'=>['https://www.topcv.vn','/tim-viec-lam-'.$q.'-trang-1.html','#/viec-lam/[^/]+\.html$#'],
            'vietnamworks'=>['https://www.vietnamworks.com','/viec-lam?q='.$q,'#-jv$#'],
            'itviec'=>['https://itviec.com','/it-jobs/'.$q,'#/it-jobs/[^/]+-\d+$#'],
            'careerviet'=>['https://careerviet.vn','/viec-lam/'.$q.'-k-vi.html','#/tim-viec-lam/[^/]+\.html$#']];
    }
    public static function parse(string $html,string $source,string $base,string $pattern,string $keyword): array {
        $doc=new \DOMDocument();$old=libxml_use_internal_errors(true);$doc->loadHTML('<?xml encoding="UTF-8">'.$html);libxml_clear_errors();libxml_use_internal_errors($old);$xp=new \DOMXPath($doc);$out=[];
        foreach($xp->query('//a[@href]') as $link){$href=$link->getAttribute('href');$url=strpos($href,'/')===0?$base.$href:$href;$url=preg_replace('/[?#].*$/','',$url);$host=parse_url($url,PHP_URL_HOST);if($host!==parse_url($base,PHP_URL_HOST)||!preg_match($pattern,parse_url($url,PHP_URL_PATH)??''))continue;
            $title=trim(preg_replace('/\s+/u',' ',$link->textContent))?:trim($link->getAttribute('title'));if(mb_strlen($title)<5)continue;
            $card=$link;for($i=0;$i<5&&$card->parentNode;$i++){if($card->hasAttributes()&&preg_match('/job-item|job-card/',$card->getAttribute('class')))break;$card=$card->parentNode;}
            $extract=function($classes)use($xp,$card){foreach($classes as $class){$n=$xp->query('.//*[contains(concat(" ",normalize-space(@class)," ")," '.$class.' ")]',$card)->item(0);if($n){$v=trim(preg_replace('/\s+/u',' ',$n->textContent));if($v)return $v;}}return null;};
            $out[$url]=['source'=>$source,'title'=>$title,'company'=>$extract(['company-name','employer-name'])??ucfirst($source),'salary'=>$extract(['salary','title-salary']),'location'=>$extract(['address','location']),'url'=>$url,'jd'=>null,'skills'=>[$keyword]];
        }return array_values($out);
    }
    private function fetch(string $url): string {
        $ch=curl_init($url);curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>15,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_USERAGENT=>'CVScreening-Academic/1.0',CURLOPT_HTTPHEADER=>['Accept-Language: vi,en;q=0.8']]);$html=curl_exec($ch);$status=curl_getinfo($ch,CURLINFO_HTTP_CODE);curl_close($ch);if($html===false||$status!==200)throw new \RuntimeException('Source unavailable: HTTP '.$status);return $html;
    }
    public function crawl(array $keywords): array {
        $count=0;$errors=[];
        foreach($keywords as $keyword)foreach(self::sources((string)$keyword) as $source=>[$base,$path,$pattern]){
            try{$html=$this->fetch($base.$path);foreach(self::parse($html,$source,$base,$pattern,(string)$keyword) as $job){$existing=$this->db->one('SELECT id FROM external_jobs WHERE url=?',[$job['url']]);$job['crawledAt']=\now();$job['isActive']=true;$existing?$this->db->write('external_jobs',$job,$existing):$this->db->write('external_jobs',$job);$count++;}}
            catch(\Throwable $e){$errors[$source]=$e->getMessage();error_log($source.': '.$e->getMessage());}usleep(1500000);
        }
        if(!$count){$fallback=json_decode(file_get_contents(APP_ROOT.'/database/external-jobs-demo.json'),true);foreach($fallback as $job){if(!$this->db->one('SELECT id FROM external_jobs WHERE url=?',[$job['url']]))$this->db->write('external_jobs',$job);}}
        return ['saved'=>$count,'usedFallback'=>$count===0,'errors'=>$errors];
    }
}
