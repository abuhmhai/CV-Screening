<?php $recruiters=array_filter($app->api('users'),function($person){return in_array($person['role'],['RECRUITER','ADMIN'],true);}); ?>
<?php foreach($companies as $company): $members=$app->api('companies/'.$company['id'].'/members'); ?>
<details class="panel section"><summary>Thành viên · <?= e($company['name']) ?></summary>
<?php foreach($members as $member): ?><p><?= e($member['userId']) ?> · <?= e($member['role']) ?></p><?php endforeach; ?>
<form data-api="/companies/<?= e($company['id']) ?>/members" data-reload>
<label>Tài khoản tuyển dụng<select name="userId"><?php foreach($recruiters as $person): ?><option value="<?= e($person['id']) ?>"><?= e(($person['profile']['fullName']??'').' · '.$person['email']) ?></option><?php endforeach; ?></select></label>
<label>Vai trò<select name="role"><option>RECRUITER</option><option>ADMIN</option></select></label><button>Thêm thành viên</button></form></details>
<?php endforeach; ?>
