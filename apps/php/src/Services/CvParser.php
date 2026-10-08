<?php
declare(strict_types=1);
namespace Platform\Services;
class CvParser {
    public static function parse(string $text): array {
        $skills=['python','fastapi','nestjs','node.js','react','next.js','vue','angular','postgresql','mysql','mongodb','redis','docker','kubernetes','java','spring','typescript','javascript','go','rust','c#','c++','php','laravel','django','flask','graphql','rest','aws','gcp','azure','terraform','machine learning','deep learning','nlp','spacy','pytorch','tensorflow','sql','tailwind','html','css'];$found=[];
        foreach($skills as $s)if(preg_match('/(^|[^a-z0-9+#.])'.preg_quote($s,'/').'([^a-z0-9+#]|$)/i',$text))$found[]=$s;
        $languages=[];foreach(['english'=>'Tiếng Anh','tiếng anh'=>'Tiếng Anh','vietnamese'=>'Tiếng Việt','tiếng việt'=>'Tiếng Việt','japanese'=>'Tiếng Nhật','chinese'=>'Tiếng Trung','korean'=>'Tiếng Hàn','french'=>'Tiếng Pháp','german'=>'Tiếng Đức'] as $key=>$label)if(mb_stripos($text,$key)!==false)$languages[]=$label;
        $education=[];$certifications=[];foreach(preg_split('/\r?\n/',$text) as $line){$line=trim($line);if(preg_match('/university|đại học|college|bachelor|master|phd|cử nhân|thạc sĩ/iu',$line))$education[]=mb_substr($line,0,160);if(preg_match('/certificate|certified|certification|chứng chỉ|chung chi/iu',$line))$certifications[]=mb_substr($line,0,160);}
        preg_match('/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/',$text,$email);preg_match('/(?:\+?84|0)\s?\d[\d\s]{7,11}/',$text,$phone);preg_match_all('#https?://[^\s)]+#',$text,$links);preg_match_all('/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|năm)/iu',$text,$years);
        return ['hasText'=>trim($text)!=='','contact'=>['email'=>$email[0]??null,'phone'=>$phone[0]??null,'links'=>array_slice(array_unique($links[0]),0,6)],'skills'=>$found,'totalYears'=>$years[1]?max(array_map('floatval',$years[1])):0,'education'=>array_slice(array_unique($education),0,4),'certifications'=>array_slice(array_unique($certifications),0,5),'languages'=>array_values(array_unique($languages))];
    }
}
