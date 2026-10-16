<?php
$fields=[
    'experiences'=>['company'=>'Công ty','position'=>'Vị trí','startDate'=>'Ngày bắt đầu','endDate'=>'Ngày kết thúc','description'=>'Mô tả'],
    'educations'=>['school'=>'Trường','degree'=>'Bằng cấp','major'=>'Chuyên ngành','startYear'=>'Năm bắt đầu','endYear'=>'Năm kết thúc','gpa'=>'GPA'],
    'certifications'=>['name'=>'Tên chứng nhận','issuer'=>'Đơn vị cấp','issueDate'=>'Ngày cấp','credentialUrl'=>'Liên kết'],
    'projects'=>['title'=>'Tên dự án','description'=>'Mô tả','url'=>'Liên kết']
][$key];
$editing=isset($editItem);$record=$editItem??[];
?>
<form data-api="/users/me/<?= e($key) ?><?= $editing?'/'.e($record['id']):'' ?>" data-method="<?= $editing?'PATCH':'POST' ?>" data-reload>
<?php foreach($fields as $field=>$fieldLabel):
    $date=in_array($field,['startDate','endDate','issueDate'],true);
    $number=strpos($field,'Year')!==false||$field==='gpa';
    $value=$record[$field]??'';if($date&&$value)$value=substr($value,0,10);
?>
<label><?= e($fieldLabel) ?><input name="<?= e($field) ?>" type="<?= $date?'date':($number?'number':(in_array($field,['url','credentialUrl'],true)?'url':'text')) ?>" value="<?= e($value) ?>" <?= $field==='gpa'?'step="0.01" min="0" max="4"':'' ?> <?= in_array($field,['company','position','startDate','school','degree','startYear','name','issuer','title'],true)?'required':'' ?>></label>
<?php endforeach; ?>
<?php if($key==='experiences'): ?><label><input type="checkbox" name="isCurrent" <?= !empty($record['isCurrent'])?'checked':'' ?>> Đang làm việc tại đây</label><?php endif; ?>
<?php if($key==='projects'): ?><label>Kỹ năng (dấu phẩy)<input name="skills" data-array value="<?= e(implode(', ',$record['skills']??[])) ?>"></label><?php endif; ?>
<button><?= $editing?'Lưu thay đổi':'Thêm' ?></button></form>
