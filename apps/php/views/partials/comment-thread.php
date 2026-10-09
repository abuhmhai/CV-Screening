<?php
function ui_reaction_labels(): array {return ['LIKE'=>'Thích','LOVE'=>'Yêu thích','CELEBRATE'=>'Chúc mừng','SUPPORT'=>'Ủng hộ','INSIGHTFUL'=>'Hữu ích','HAHA'=>'Vui','WOW'=>'Ngạc nhiên','SAD'=>'Buồn','ANGRY'=>'Giận'];}
function ui_reaction_picker(string $path,?string $active,bool $enabled=true): void { ?>
<details class="reaction-control" data-reaction-path="<?= e($path) ?>"><summary data-reaction-label><?= e(ui_reaction_labels()[$active]??'Thích') ?></summary><div class="reaction-picker"><?php foreach(ui_reaction_labels() as $type=>$label): ?><button type="button" class="ghost" data-reaction="<?= e($type) ?>" <?= $enabled?'':'disabled' ?> aria-pressed="<?= $active===$type?'true':'false' ?>"><?= e($label) ?></button><?php endforeach; ?></div></details>
<?php }
function ui_comment_node(array $comment,array $comments,int $depth=0,bool $enabled=true): void { ?>
<div class="comment-node <?= $depth?'comment-reply':'' ?>" data-comment-id="<?= e($comment['id']) ?>"><div class="comment"><a href="/u/<?= e($comment['authorId']) ?>"><?= ui_avatar($comment['author']['profile']??[],32) ?></a><div class="comment-content"><a href="/u/<?= e($comment['authorId']) ?>"><strong><?= e($comment['author']['profile']['fullName']??'Thành viên') ?></strong></a><p class="prose"><?= e($comment['content']) ?></p><p class="muted"><?= e((new DateTimeImmutable($comment['createdAt']))->setTimezone(new DateTimeZone('Asia/Ho_Chi_Minh'))->format('d/m/Y H:i')) ?></p><div class="row"><?php ui_reaction_picker('/social/comments/'.$comment['id'].'/reactions',$comment['userReaction']??null,$enabled); ?><button type="button" class="ghost" <?= $enabled?'':'disabled' ?> data-reply-to="<?= e($comment['id']) ?>" data-reply-name="<?= e($comment['author']['profile']['fullName']??'Thành viên') ?>">Trả lời</button></div></div></div>
<?php if($depth<10)foreach($comments as $child)if($child['parentId']===$comment['id'])ui_comment_node($child,$comments,$depth+1,$enabled); ?></div>
<?php }
function ui_comment_thread(array $post,bool $enabled=true,bool $visible=false): void {
    $comments=$post['comments'];$ids=array_column($comments,'id');$roots=array_values(array_filter($comments,function($c)use($ids){return !$c['parentId']||!in_array($c['parentId'],$ids,true);})); ?>
<div id="comments-<?= e($post['id']) ?>" class="section comment-thread" data-comment-thread <?= $visible?'':'hidden' ?>>
<script type="application/json" data-comment-data><?= json_encode($comments,JSON_HEX_TAG|JSON_HEX_AMP|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR) ?></script>
<div data-comment-list><?php foreach($roots as $index=>$comment): ?><div data-comment-root <?= $index>1?'hidden':'' ?>><?php ui_comment_node($comment,$comments,0,$enabled); ?></div><?php endforeach; ?></div>
<button type="button" class="ghost" data-expand-comments aria-expanded="false" <?= count($roots)>2?'':'hidden' ?>>Xem thêm <?= max(0,count($roots)-2) ?> bình luận</button>
<div class="row reply-context" data-reply-context hidden><span data-reply-label></span><button type="button" class="ghost" data-cancel-reply>Hủy</button></div>
<form class="row" data-comment-form data-post="<?= e($post['id']) ?>"><input type="hidden" name="parentId"><input name="content" placeholder="Viết bình luận..." aria-label="Nội dung bình luận" maxlength="1200" <?= $enabled?'':'disabled' ?> required><button type="submit" <?= $enabled?'':'disabled' ?>>Gửi</button><p class="form-error" role="alert" hidden></p></form>
</div>
<?php }
