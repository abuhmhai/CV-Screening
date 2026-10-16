<?php
declare(strict_types=1);
namespace Platform\Services;
class CvParser {
    private static function contains(string $text,string $skill): bool {return (bool)preg_match('/(^|[^a-z0-9+#.])'.preg_quote($skill,'/').'([^a-z0-9+#]|$)/i',$text);}
    public static function compare(string $text,array $required): array {
        $required=array_values(array_filter(array_map('trim',$required)));$matched=[];$missing=[];
        foreach($required as $skill){if(trim($text)!==''&&(self::contains($text,Screening::normalizeSkill($skill))||self::contains($text,strtolower($skill))))$matched[]=$skill;else $missing[]=$skill;}
        $normalized=array_map([Screening::class,'normalizeSkill'],$required);$extra=array_values(array_diff(self::parse($text)['skills'],$normalized));
        return ['matched'=>$matched,'missing'=>$missing,'extra'=>$extra,'matchPct'=>$required?(int)round(count($matched)/count($required)*100):0];
    }
    private static function sections(string $text): array {
        $headings=['Tóm tắt'=>'summary|objective|profile|about|giới thiệu|tóm tắt|mục tiêu','Kinh nghiệm'=>'work experience|experience|employment|kinh nghiệm','Học vấn'=>'education|academic|học vấn|trình độ học vấn','Kỹ năng'=>'skills|technical skills|kỹ năng','Dự án'=>'projects?|dự án','Chứng chỉ'=>'certifications?|chứng chỉ'];$sections=[];$current=null;
        foreach(preg_split('/\r?\n/',$text) as $line){$line=trim($line);$heading=null;if(mb_strlen($line)<=40)foreach($headings as $title=>$pattern)if(preg_match('/^('.$pattern.')\b/iu',$line)){$heading=$title;break;}if($heading!==null){if($current&&trim($current['content'])!=='')$sections[]=$current;$current=['title'=>$heading,'content'=>''];}elseif($current!==null)$current['content'].=$line."\n";}
        if($current&&trim($current['content'])!=='')$sections[]=$current;return array_slice($sections,0,6);
    }
    public static function parse(string $text,array $jobSkills=[]): array {
        $skills=['python','fastapi','nestjs','node.js','react','next.js','vue','angular','postgresql','mysql','mongodb','redis','docker','kubernetes','java','spring','typescript','javascript','go','rust','c#','c++','php','laravel','django','flask','graphql','rest','aws','gcp','azure','terraform','machine learning','deep learning','nlp','spacy','pytorch','tensorflow','sentence-transformers','sql','tailwind','html','css'];$found=[];
        foreach($skills as $s)if(preg_match('/(^|[^a-z0-9+#.])'.preg_quote($s,'/').'([^a-z0-9+#]|$)/i',$text))$found[]=$s;
        foreach($jobSkills as $skill){$normalized=Screening::normalizeSkill($skill);if($normalized&&self::contains($text,$normalized))$found[]=$normalized;}$found=array_values(array_unique($found));
        $languages=[];foreach(['english'=>'Tiếng Anh','tiếng anh'=>'Tiếng Anh','vietnamese'=>'Tiếng Việt','tiếng việt'=>'Tiếng Việt','japanese'=>'Tiếng Nhật','chinese'=>'Tiếng Trung','korean'=>'Tiếng Hàn','french'=>'Tiếng Pháp','german'=>'Tiếng Đức'] as $key=>$label)if(mb_stripos($text,$key)!==false)$languages[]=$label;
        $education=[];$certifications=[];foreach(preg_split('/\r?\n/',$text) as $line){$line=trim($line);if(preg_match('/university|đại học|college|bachelor|master|phd|cử nhân|thạc sĩ/iu',$line))$education[]=mb_substr($line,0,160);if(preg_match('/certificate|certified|certification|chứng chỉ|chung chi/iu',$line))$certifications[]=mb_substr($line,0,160);}
        preg_match('/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/',$text,$email);preg_match('/(?:\+?84|0)\s?\d[\d\s]{7,11}/',$text,$phone);preg_match_all('#https?://[^\s)]+#',$text,$links);preg_match_all('/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|năm)/iu',$text,$years);
        return ['hasText'=>trim($text)!=='','sections'=>self::sections($text),'contact'=>['email'=>$email[0]??null,'phone'=>$phone[0]??null,'links'=>array_slice(array_unique($links[0]),0,6)],'skills'=>$found,'totalYears'=>$years[1]?max(array_map('floatval',$years[1])):0,'education'=>array_slice(array_unique($education),0,4),'certifications'=>array_slice(array_unique($certifications),0,5),'languages'=>array_values(array_unique($languages))];
    }
    public static function extractDocx(string $path): string {
        if (!is_file($path)) return '';
        if (class_exists('\\ZipArchive')) {
            $zip = new \ZipArchive();
            if ($zip->open($path) === true) {
                $xml = $zip->getFromName('word/document.xml');
                $zip->close();
                if ($xml) {
                    $xml = preg_replace('/<w:p[^>]*>/i', "\n", $xml);
                    $xml = preg_replace('/<w:br[^>]*>/i', "\n", $xml);
                    $xml = preg_replace('/<w:tab[^>]*>/i', "\t", $xml);
                    return trim(strip_tags($xml));
                }
            }
        }
        $raw = @file_get_contents($path);
        if ($raw && preg_match('/<w:body[^>]*>(.*?)<\/w:body>/is', $raw, $m)) {
            return trim(strip_tags(preg_replace('/<w:p[^>]*>/i', "\n", $m[1])));
        }
        return '';
    }
    public static function extractPdf(string $path): string {
        if (!is_file($path)) return '';
        $content = @file_get_contents($path);
        if ($content === false || $content === '') return '';
        $text = '';
        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $content, $matches)) {
            foreach ($matches[1] as $stream) {
                $data = @gzuncompress($stream);
                if ($data === false) $data = @gzinflate($stream);
                if ($data === false && strlen($stream) > 2) $data = @gzinflate(substr($stream, 2));
                if ($data === false) $data = $stream;
                if (preg_match_all('/BT[\r\n\s]+(.*?)[\r\n\s]+ET/s', $data, $blocks)) {
                    foreach ($blocks[1] as $block) {
                        if (preg_match_all('/\((.*?)\)\s*Tj/s', $block, $tjs)) {
                            $text .= implode(' ', $tjs[1]) . "\n";
                        }
                        if (preg_match_all('/\[(.*?)\]\s*TJ/s', $block, $tjs)) {
                            foreach ($tjs[1] as $tj) {
                                if (preg_match_all('/\((.*?)\)/s', $tj, $parts)) {
                                    $text .= implode('', $parts[1]) . ' ';
                                }
                            }
                            $text .= "\n";
                        }
                    }
                }
            }
        }
        if (trim($text) === '') {
            if (preg_match_all('/\((.*?)\)\s*Tj/s', $content, $tjs)) {
                $text = implode(' ', $tjs[1]);
            }
        }
        $text = str_replace(['\\(', '\\)', '\\\\', '\\n', '\\r', '\\t'], ['(', ')', '\\', "\n", "\r", "\t"], $text);
        return trim(preg_replace('/[^\P{C}\n\t]/u', '', $text));
    }
    public static function extractFromFile(string $path, string $mime = ''): string {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if ($ext === 'docx' || strpos($mime, 'wordprocessingml') !== false) {
            $t = self::extractDocx($path);
            if (trim($t) !== '') return $t;
        }
        if ($ext === 'pdf' || strpos($mime, 'pdf') !== false) {
            $t = self::extractPdf($path);
            if (trim($t) !== '') return $t;
        }
        return trim((string)@file_get_contents($path));
    }
}
