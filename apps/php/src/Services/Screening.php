<?php
declare(strict_types=1);
namespace Platform\Services;
class Screening {
    public static function normalizeSkill(string $skill): string {
        $s=preg_replace('/[^a-z0-9.+#\-\s]/','',strtolower(trim($skill)));
        return ['js'=>'javascript','ts'=>'typescript','reactjs'=>'react','react.js'=>'react','nodejs'=>'node.js','node'=>'node.js','nextjs'=>'next.js','postgres'=>'postgresql','psql'=>'postgresql','ml'=>'machine learning','k8s'=>'kubernetes','c sharp'=>'c#','golang'=>'go'][$s]??$s;
    }
    private static function years(string $text): float {preg_match_all('/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|năm)/iu',$text,$m);return $m[1]?max(array_map('floatval',$m[1])):0;}
    public static function local(string $cv,string $jd,array $context=[]): array {
        $start=microtime(true);
        $known=['python','fastapi','nestjs','node.js','react','next.js','vue','angular','postgresql','mysql','mongodb','redis','docker','kubernetes','java','spring','typescript','javascript','go','rust','c#','c++','php','laravel','django','flask','graphql','rest','aws','gcp','azure','terraform','machine learning','deep learning','nlp','spacy','pytorch','tensorflow','sentence-transformers','sql','tailwind','html','css'];
        $detect=function($text)use($known){$found=[];foreach($known as $s)if(preg_match('/(^|[^a-z0-9+#.])'.preg_quote($s,'/').'([^a-z0-9+#]|$)/i',$text))$found[]=$s;return $found;};
        $required=array_values(array_filter(array_unique(array_map([self::class,'normalizeSkill'],$context['requiredSkills']??[]))));
        if(!$required)$required=$detect($jd);
        $available=array_merge($detect($cv),array_map(function($s){return self::normalizeSkill(is_array($s)?$s['name']:$s);},$context['candidateSkills']??[]));
        $matched=array_values(array_intersect($required,$available));$missing=array_values(array_diff($required,$available));
        $skill=$required?round(count($matched)/count($required)*100,2):100.0;
        $requiredYears=$context['minExperienceYears']??0;
        if(!$requiredYears){preg_match('/(\d+)\s*\+?\s*(?:years|năm)[^.]{0,20}(?:experience|kinh nghiệm)/iu',$jd,$years);$requiredYears=isset($years[1])?(int)$years[1]:1;}
        $actual=max(self::years($cv),(float)($context['candidateTotalYears']??0));
        foreach($context['candidateSkills']??[] as $s)if(is_array($s))$actual=max($actual,(float)($s['years']??0));
        $experience=$requiredYears>0?min(100,round($actual/$requiredYears*100,2)):100.0;
        $degree=function($t){if(preg_match('/phd|doctor|tiến sĩ/iu',$t))return 4;if(preg_match('/master|thạc/iu',$t))return 3;if(preg_match('/associate|cao đẳng/iu',$t))return 1;if(preg_match('/high|thpt/iu',$t))return 0;return 2;};
        $education=60;$best=null;$bestRank=-1;
        foreach($context['education']??[] as $ed){$rank=$degree($ed['degree']??'');if($rank>=$bestRank){$best=$ed;$bestRank=$rank;}}
        if($best!==null){$education=$bestRank>=2?80:65;if(isset($best['gpa'])&&(float)$best['gpa']>=3.2)$education=min($education+10,100);}
        $certifications=!empty($context['hasCertifications'])||preg_match('/certificat|chứng chỉ/iu',$cv);
        $portfolio=!empty($context['hasPortfolio'])||preg_match('/github|portfolio|gitlab|behance|dribbble/i',$cv);
        $other=60+($certifications?15:0)+($portfolio?15:0);
        $overall=round($skill*.4+$experience*.3+$education*.2+$other*.1,2);
        if($overall>=90){$grade='A+';$recommendation='Strongly recommend for interview';}
        elseif($overall>=85){$grade='A';$recommendation='Strongly recommend for interview';}
        elseif($overall>=75){$grade='B+';$recommendation='Recommend for interview';}
        elseif($overall>=65){$grade='B';$recommendation='Consider for interview';}
        elseif($overall>=50){$grade='C';$recommendation='Need manual recruiter review';}
        else{$grade='D';$recommendation='Not recommended';}
        $strengths=[];if($skill>=75)$strengths[]='Strong alignment with required technical skills';if($experience>=75)$strengths[]='Relevant years of experience for the role';if($education>=80)$strengths[]='Education profile meets job expectations';if($portfolio)$strengths[]='Public portfolio / open-source presence';if(!$strengths)$strengths[]='Baseline profile suitable for further review';
        $concerns=[];if($missing)$concerns[]='Missing skills: '.implode(', ',array_slice($missing,0,6));if($experience<60)$concerns[]='Experience depth may be below requirement';if($education<65)$concerns[]='Education signal is limited';if(!$concerns)$concerns[]='No major risk identified in automated screening';
        return ['overall_score'=>$overall,'grade'=>$grade,'recommendation'=>$recommendation,'breakdown'=>['skill_score'=>$skill,'experience_score'=>$experience,'education_score'=>$education,'other_score'=>$other],'matched_skills'=>$matched,'missing_skills'=>$missing,'skill_gaps'=>array_map(function($s){return ['skill'=>$s,'importance'=>'mandatory'];},$missing),'experience_analysis'=>['required_years'=>$requiredYears,'actual_years'=>round($actual,2),'relevant_experience'=>$matched?'Hands-on experience with '.implode(', ',array_slice($matched,0,4)):'Relevant experience could not be confirmed from the CV'],'strengths'=>$strengths,'concerns'=>$concerns,'explanation'=>'Weighted matching - skills 40%, experience 30%, education 20%, other 10%. Matched '.count($matched).'/'.count($required).' required skills.','model_version'=>'cv-screener-php-v1.0.0','processing_time_ms'=>max(1,(int)((microtime(true)-$start)*1000)),'cached_key'=>''];
    }
    public function screen(string $cv,string $jd,string $job,array $context): array {
        try {$r=(new HttpClient())->request(\env('AI_SERVICE_URL','http://127.0.0.1:8000').'/screen',['cv_data'=>['raw_text'=>$cv],'jd_text'=>strlen($jd)>=10?$jd:($jd.' job description'),'job_id'=>$job],[],(int)\env('AI_TIMEOUT_SECONDS','10'));if(!isset($r['overall_score'],$r['breakdown'],$r['model_version']))throw new \RuntimeException('Malformed AI result');return $r;}
        catch(\Throwable $e){error_log('Remote AI unavailable: '.$e->getMessage());return self::local($cv,$jd,$context);}
    }
}
