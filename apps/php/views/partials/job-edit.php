<details><summary>Chỉnh sửa tin tuyển dụng</summary>
<form data-api="/jobs/<?= e($job['id']) ?>" data-method="PATCH" data-reload>
<label>Tiêu đề<input name="title" value="<?= e($job['title']) ?>" required></label>
<label>Mô tả<textarea name="description" required><?= e($job['description']) ?></textarea></label>

<label>Địa điểm<input name="location" value="<?= e($job['location']??'') ?>"></label>
<label>Kỹ năng (dấu phẩy)<input name="requiredSkills" data-array value="<?= e(implode(', ',$job['requiredSkills'])) ?>"></label>
<label>Cấp bậc<select name="level"><?php foreach(['INTERN','JUNIOR','MIDDLE','SENIOR','LEAD','MANAGER'] as $option): ?><option <?= $option===$job['level']?'selected':'' ?>><?= e($option) ?></option><?php endforeach; ?></select></label>
<label>Hình thức<select name="jobType"><?php foreach(['FULL_TIME','PART_TIME','CONTRACT','INTERNSHIP','FREELANCE'] as $option): ?><option <?= $option===$job['jobType']?'selected':'' ?>><?= e($option) ?></option><?php endforeach; ?></select></label>
<label>Lương tối thiểu<input type="number" name="minSalary" min="0" value="<?= e($job['minSalary']??'') ?>"></label>
<label>Lương tối đa<input type="number" name="maxSalary" min="0" value="<?= e($job['maxSalary']??'') ?>"></label>
<label>Hạn tuyển<input type="date" name="expiresAt" value="<?= e(substr($job['expiresAt']??'',0,10)) ?>"></label>
<label><input type="checkbox" name="isRemote" <?= $job['isRemote']?'checked':'' ?>> Làm việc từ xa</label><button>Lưu tin tuyển dụng</button>
</form></details>
