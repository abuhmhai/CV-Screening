<?php
declare(strict_types=1);
namespace Platform\Services;
/** Candidate labels and recruitment stages shared by list and detail views. */
class ApplicationView {
    public static function hasScore(array $application): bool {return isset($application['aiResult']['overallScore'])&&is_numeric($application['aiResult']['overallScore']);}
    public static function screening(array $application): bool {return $application['status']==='AI_SCREENING'||($application['status']==='APPLIED'&&!self::hasScore($application));}
    public static function label(array $application): string {
        if($application['status']==='APPLIED')return self::hasScore($application)?'Ứng tuyển thành công':'Đã nộp';
        return ['AI_SCREENING'=>'AI đang chấm','HR_REVIEW'=>'HR Đang xem','INTERVIEW'=>'Phỏng vấn','OFFER'=>'Đề nghị','HIRED'=>'Đã tuyển','REJECTED'=>'Từ chối','WITHDRAWN'=>'Đã rút đơn'][$application['status']]??$application['status'];
    }
    public static function stage(array $application): int {return $application['status']==='APPLIED'?(self::hasScore($application)?2:0):($application['status']==='AI_SCREENING'?1:($application['status']==='HR_REVIEW'?2:3));}
    public static function suggestion(array $application): array {
        $score=(float)($application['aiResult']['overallScore']??0);$required=count($application['job']['requiredSkills']??[]);$missing=count($application['aiResult']['missingSkills']??[]);$matched=count($application['aiResult']['matchedSkills']??[]);$match=$required?(int)round($matched/$required*100):0;
        if(trim($application['cvFile']['extractedText']??'')!==''){$comparison=CvParser::compare($application['cvFile']['extractedText'],$application['job']['requiredSkills']??[]);$missing=count($comparison['missing']);$match=$comparison['matchPct'];}
        if($score>=80&&$match>=70)return ['status'=>'INTERVIEW','title'=>'Phù hợp - mời phỏng vấn','note'=>'AI gợi ý phù hợp: điểm '.round($score,1).'/100, khớp '.$match.'% yêu cầu.'];
        if($score<60||($required&&$missing/$required>=0.5))return ['status'=>'REJECTED','title'=>'Chưa phù hợp - cân nhắc từ chối','note'=>'AI gợi ý chưa phù hợp: điểm '.round($score,1).'/100, thiếu '.$missing.'/'.$required.' kỹ năng yêu cầu.'];
        return ['status'=>'HR_REVIEW','title'=>'Cần HR review thêm','note'=>'AI gợi ý cần review thêm: điểm '.round($score,1).'/100, khớp '.$match.'% yêu cầu.'];
    }
}
