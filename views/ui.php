<?php
/** Small inline icons for the HTML port of the original Lucide-based UI. */
function ui_icon(string $name,int $size=18): string {
    $name=['arrow-right'=>'arrow','lock'=>'shield'][$name]??$name;
    $paths=[
        'search'=>'<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
        'pin'=>'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        'briefcase'=>'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12a20 20 0 0 0 18 0M12 11v4"/>',
        'globe'=>'<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a20 20 0 0 1 0 20 20 20 0 0 1 0-20Z"/>',
        'sparkles'=>'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4m-2-2h4M3 18v4m-2-2h4"/>',
        'arrow'=>'<path d="M5 12h14m-6-6 6 6-6 6"/>',
        'chevron'=>'<path d="m6 9 6 6 6-6"/>',
        'check'=>'<path d="m5 12 4 4L19 6"/>',
        'close'=>'<path d="m6 6 12 12M18 6 6 18"/>',
        'menu'=>'<path d="M3 6h18M3 12h18M3 18h18"/>',
        'bell'=>'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
        'user'=>'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
        'users'=>'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.9M16 3a4 4 0 0 1 0 8"/><circle cx="9" cy="7" r="4"/>',
        'message'=>'<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>',
        'rss'=>'<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1"/>',
        'bookmark'=>'<path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>',
        'file'=>'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8M8 17h6"/>',
        'target'=>'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
        'settings'=>'<path d="m12 2 2 3 3-.3 1.5 2.6-1.3 2.7 1.3 2.7L17 15.3l-3-.3-2 3-2-3-3 .3-1.5-2.6 1.3-2.7-1.3-2.7L7 4.7l3 .3Z"/><circle cx="12" cy="10" r="3"/>',
        'logout'=>'<path d="M9 3H5v18h4M9 12h12m-4-4 4 4-4 4"/>',
        'moon'=>'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
        'sun'=>'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
        'eye'=>'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        'chart'=>'<path d="M3 3v18h18M7 16v-5m5 5V7m5 9V4"/>',
        'grid'=>'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
        'plus'=>'<path d="M12 5v14M5 12h14"/>',
        'filter'=>'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
        'wallet'=>'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18m-4 4h4v4h-4a2 2 0 0 1 0-4ZM3 5l14-3v3"/>',
        'clock'=>'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
        'building'=>'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h1m6 0h1M8 10h1m6 0h1M8 14h1m6 0h1"/>',
        'edit'=>'<path d="m16 3 5 5L8 21H3v-5Zm-2 2 5 5"/>',
        'share'=>'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
        'heart'=>'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
        'send'=>'<path d="m22 2-7 20-4-9-9-4Zm0 0L11 13"/>',
        'shield'=>'<path d="m12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6Z"/>',
        'image'=>'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    ];
    return '<svg class="ui-icon" width="'.$size.'" height="'.$size.'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'.($paths[$name]??$paths['grid']).'</svg>';
}
function ui_header(string $title,string $description=''): void {
    echo '<section class="panel page-header"><h1>'.e($title).'</h1>'.($description?'<p>'.e($description).'</p>':'').'</section>';
}
function ui_avatar(array $profile,int $size=40): string {
    $name=$profile['fullName']??'Thành viên';$url=safe_url($profile['avatarUrl']??'');
    return '<span class="ui-avatar" style="width:'.$size.'px;height:'.$size.'px">'.($url!=='#'?'<img src="'.e($url).'" alt="'.e($name).'" loading="lazy">':e(mb_strtoupper(mb_substr($name,0,2)))).'</span>';
}
function ui_salary(array $job): string {
    $min=$job['minSalary']??null;$max=$job['maxSalary']??null;$currency=$job['salaryCurrency']??'VND';
    if(!$min&&!$max)return 'Thương lượng';
    return ($min&&$max?number_format((float)$min).' – '.number_format((float)$max):($min?'Từ '.number_format((float)$min):'Đến '.number_format((float)$max))).' '.$currency;
}
