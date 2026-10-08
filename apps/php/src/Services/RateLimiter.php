<?php
declare(strict_types=1);
namespace Platform\Services;
use Platform\Database;
use Platform\Http\Error;
class RateLimiter {
    public static function auth(Database $db,string $address): void {
        $bucket=hash('sha256',$address);$db->run('INSERT INTO auth_rate_limits(bucket,window_started,requests) VALUES(?,UTC_TIMESTAMP(3),1) ON DUPLICATE KEY UPDATE requests=IF(window_started<UTC_TIMESTAMP()-INTERVAL 1 MINUTE,1,requests+1),window_started=IF(window_started<UTC_TIMESTAMP()-INTERVAL 1 MINUTE,UTC_TIMESTAMP(3),window_started)',[$bucket]);
        $r=$db->one('SELECT requests FROM auth_rate_limits WHERE bucket=?',[$bucket]);if((int)$r['requests']>60){header('Retry-After: 60');throw new Error(429,'Too many authentication requests');}
    }
}
