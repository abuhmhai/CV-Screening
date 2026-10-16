<?php
declare(strict_types=1);
namespace Platform\Controllers;
use Platform\Application;
use Platform\Http\Request;
use Platform\Http\Error;
class Pages {
    private Application $app;
    public function __construct(Application $app){$this->app=$app;}
    public function render(Request $request): void {
        $app=$this->app;$path=rtrim($request->path,'/')?:'/';
        if($path==='/ai-score-detail'){header('Location: /applications',true,307);return;}
        $user=$app->auth->current(false);$data=[];$id=null;
        if(!$user&&!empty($_COOKIE['refresh_token'])){try{$app->auth->refresh($_COOKIE['refresh_token']);$user=$app->auth->current(false);}catch(Error $e){}}
        if($user&&in_array($user['role'],['RECRUITER','ADMIN'],true)&&in_array($path,['/jobs','/external-jobs','/search'],true)){header('Location: /recruiter/dashboard');return;}
        if($path==='/applications'&&$user&&$user['role']!=='CANDIDATE'){header('Location: /');return;}
        $titles=['/'=>'TalentFlow — Cơ hội nghề nghiệp của bạn','/profile'=>'Hồ sơ cá nhân','/jobs'=>'Tìm việc làm','/external-jobs'=>'Việc làm tổng hợp','/feed'=>'Bảng tin','/network'=>'Mạng lưới','/messages'=>'Tin nhắn','/notifications'=>'Thông báo','/applications'=>'Đơn ứng tuyển','/saved-jobs'=>'Việc làm đã lưu','/cv-builder'=>'Tạo CV','/recruiter/dashboard'=>'Quản lý tuyển dụng','/recruiter/analytics'=>'Thống kê tuyển dụng','/recruiter/jobs/new'=>'Đăng tin tuyển dụng','/admin/moderation'=>'Quản trị nội dung','/search'=>'Tìm kiếm','/goals'=>'Mục tiêu nghề nghiệp','/onboarding'=>'Hoàn thiện hồ sơ'];
        $view='';$title=$titles[$path]??'TalentFlow';
        if($path==='/'){$view='home';$data=$app->api('jobs/search',['limit'=>6]);}
        elseif(strpos($path,'/auth/')===0){if(!in_array($path,['/auth/sign-in','/auth/sign-up','/auth/forgot-password','/auth/oauth-callback'],true))throw new Error(404,'Page not found');$view='auth';}
        elseif(preg_match('#^/u/([^/]+)$#',$path,$m)){$view='profile';$data=$app->api('public/users/'.$m[1]);$title=$data['fullName'];}
        elseif(preg_match('#^/company/([^/]+)$#',$path,$m)){$view='company';$id=$m[1];$data=$app->api('companies/'.$id);$title=$data['name'];}
        elseif(preg_match('#^/jobs/([^/]+)$#',$path,$m)){$view='job';$id=$m[1];$data=$app->api('jobs/'.$id);$title=$data['title'];if($user)$cvs=$app->api('users/me/cv');}
        elseif(in_array($path,['/jobs','/external-jobs'],true)){$view='jobs';$data=$app->api($path==='/jobs'?'jobs/search':'external-jobs',$request->query);}
        else {
            if(!$user){header('Location: /auth/sign-in');return;}
            if($path==='/profile'){$view='profile';$data=$app->api('users/me/profile');}
            elseif($path==='/onboarding'){$view='onboarding';$data=$app->api('users/me/profile');$checklist=$app->api('users/me/onboarding-checklist');}
            elseif($path==='/feed'){$view='feed';$data=!empty($request->query['post'])?[$app->api('social/posts/'.$request->query['post'])]:$app->api('feed',$request->query+['limit'=>10]);}
            elseif($path==='/network'){$view='network';$data=$app->api('social/connections');$suggestions=$app->api('social/connections/suggestions');}
            elseif($path==='/messages'){$view='messages';$data=$app->api('messages/conversations');}
            elseif($path==='/notifications'){$view='notifications';$data=$app->api('notifications');}
            elseif($path==='/applications'){$view='applications';$data=$user['role']==='CANDIDATE'?$app->api('applications/me'):[];}
            elseif(preg_match('#^/(?:applications|ai-score)/([^/]+)$#',$path,$m)){$view='application';$id=$m[1];$data=$app->api('applications/'.$id);$title='Chi tiết ứng tuyển';}
            elseif($path==='/saved-jobs'){$view='saved';$data=$app->api('users/me/saved-jobs');}
            elseif($path==='/cv-builder'){$view='cv-builder';$data=$app->api('users/me/generated-cv');}
            elseif(strpos($path,'/settings')===0){if(!in_array($path,['/settings','/settings/profile','/settings/account','/settings/security','/settings/privacy','/settings/notifications','/settings/appearance'],true))throw new Error(404,'Page not found');$view='settings';$title='Cài đặt';$data=$app->api('privacy/settings');$alerts=$app->api('job-alerts');}
            elseif(in_array($path,['/recruiter/dashboard','/recruiter/analytics','/recruiter/jobs/new'],true)){if(!in_array($user['role'],['RECRUITER','ADMIN'],true))throw new Error(403,'Recruiter role required');$view='recruiter';$companies=array_filter($app->api('companies'),function($c)use($app){try{$app->auth->company($c['id']);return true;}catch(Error $e){return false;}});$data=$app->api('jobs/search',['mine'=>'true','limit'=>100]);}
            elseif($path==='/admin/moderation'){$view='moderation';$data=$app->api('moderation/reports');$recoveries=$app->api('moderation/recovery-requests');}
            elseif($path==='/search'){$view='search';$data=$app->api('search',$request->query);}
            elseif($path==='/goals'){$view='goals';}
            else throw new Error(404,'Page not found');
        }
        $csrf=$_COOKIE['csrf_token']??bin2hex(random_bytes(32));$app->auth->cookie('csrf_token',$csrf,time()+86400,false);
        header('Content-Type: text/html; charset=utf-8');require APP_ROOT.'/views/layout.php';
    }
}
