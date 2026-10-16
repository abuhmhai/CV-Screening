(() => {
  'use strict';
  const { api, feedback, onResult, pageDocument } = window.TalentFlow;
  const posts = document.getElementById('feed-posts');
  const labels = {LIKE:'Thích',LOVE:'Yêu thích',CELEBRATE:'Chúc mừng',SUPPORT:'Ủng hộ',INSIGHTFUL:'Hữu ích',HAHA:'Vui',WOW:'Ngạc nhiên',SAD:'Buồn',ANGRY:'Giận'};
  const state = new WeakMap();
  const node = (tag, text, className) => {const element=document.createElement(tag);if(text!=null)element.textContent=text;if(className)element.className=className;return element;};
  if(!posts)return;
  let filter='ALL';
  let nextCursor=document.querySelector('[data-feed-more]')?.dataset.cursor||'';
  function filterFeed(){
    const active=document.activeElement;
    const mine=document.querySelector('[data-feed-user]')?.dataset.feedUser;let count=0;
    for(const post of posts.children){post.hidden=!(filter==='ALL'||filter==='MINE'&&post.dataset.author===mine||filter==='MEDIA'&&Number(post.dataset.media)>0||filter==='TRENDING'&&(Number(post.dataset.score)>=25||Number(post.dataset.engagement)>0));if(!post.hidden)count++;}
    const recommended=document.getElementById('feed-sort')?.value==='RECOMMENDED';
    [...posts.children].sort((a,b)=>recommended?Number(b.dataset.score)-Number(a.dataset.score):b.dataset.created.localeCompare(a.dataset.created)||b.dataset.postId.localeCompare(a.dataset.postId)).forEach(post=>posts.append(post));
    document.getElementById('feed-empty-filter').hidden=count>0;
    if(active&&document.contains(active)&&!active.closest('[data-feed-post]')?.hidden)active.focus({preventScroll:true});
  }
  function threadState(thread){if(!state.has(thread))state.set(thread,{comments:JSON.parse(thread.querySelector('[data-comment-data]').textContent),expanded:false});return state.get(thread);}
  function picker(path, active){
    const details=node('details',null,'reaction-control');details.dataset.reactionPath=path;
    const summary=node('summary',labels[active]||'Thích');summary.dataset.reactionLabel='';details.append(summary);
    const options=node('div',null,'reaction-picker');
    for(const [type,label] of Object.entries(labels)){const button=node('button',label,'ghost');button.type='button';button.dataset.reaction=type;button.setAttribute('aria-pressed',String(type===active));options.append(button);}details.append(options);return details;
  }
  function commentNode(comment, comments, depth=0){
    const profile=comment.author?.profile||{};const author=comment.author?.id||comment.authorId;const name=profile.fullName||'Thành viên';
    const outer=node('div',null,'comment-node'+(depth?' comment-reply':''));outer.dataset.commentId=comment.id;
    const card=node('div',null,'comment'),avatar=node('a',null,'ui-avatar');avatar.href='/u/'+encodeURIComponent(author);
    if(profile.avatarUrl&&/^(https?:\/\/|\/(?!\/))/i.test(profile.avatarUrl)){const img=node('img');img.src=profile.avatarUrl;img.alt=name;img.loading='lazy';avatar.append(img);}else avatar.textContent=Array.from(name).slice(0,2).join('');
    const content=node('div',null,'comment-content'),link=node('a',name);link.href=avatar.href;content.append(link,node('p',comment.content,'prose'));
    const date=new Date(comment.createdAt);content.append(node('p',Number.isNaN(date.getTime())?'':date.toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}),'muted'));
    const actions=node('div',null,'row');actions.append(picker('/social/comments/'+comment.id+'/reactions',comment.userReaction));
    const reply=node('button','Trả lời','ghost');reply.type='button';reply.dataset.replyTo=comment.id;reply.dataset.replyName=name;actions.append(reply);content.append(actions);card.append(avatar,content);outer.append(card);
    if(depth<10)for(const child of comments.filter(c=>c.parentId===comment.id))outer.append(commentNode(child,comments,depth+1));return outer;
  }
  function renderComments(thread){
    const value=threadState(thread),ids=new Set(value.comments.map(c=>c.id));const roots=value.comments.filter(c=>!c.parentId||!ids.has(c.parentId));
    const list=thread.querySelector('[data-comment-list]');list.replaceChildren();
    for(const [index,comment] of roots.entries()){const root=node('div');root.dataset.commentRoot='';root.hidden=!value.expanded&&index>1;root.append(commentNode(comment,value.comments));list.append(root);}
    const button=thread.querySelector('[data-expand-comments]');button.hidden=roots.length<=2;button.textContent=value.expanded?'Thu gọn':'Xem thêm '+Math.max(0,roots.length-2)+' bình luận';button.setAttribute('aria-expanded',String(value.expanded));
  }
  function cancelReply(thread){const form=thread.querySelector('[data-comment-form]');form.elements.parentId.value='';form.elements.content.placeholder='Viết bình luận...';form.elements.content.setAttribute('aria-label','Nội dung bình luận');thread.querySelector('[data-reply-context]').hidden=true;}
  document.addEventListener('click',async event=>{
    const target=event.target;
    const tab=target.closest('[data-feed-filter]');if(tab){filter=tab.dataset.feedFilter;for(const other of document.querySelectorAll('[data-feed-filter]'))other.setAttribute('aria-pressed',String(other===tab));filterFeed();}
    const toggle=target.closest('[data-show-comments]');if(toggle){const thread=document.getElementById(toggle.dataset.showComments);thread.hidden=!thread.hidden;toggle.setAttribute('aria-expanded',String(!thread.hidden));if(!thread.hidden)thread.querySelector('[name=content]').focus();}
    const expand=target.closest('[data-expand-comments]');if(expand){const thread=expand.closest('[data-comment-thread]');threadState(thread).expanded=!threadState(thread).expanded;renderComments(thread);expand.focus();}
    const reply=target.closest('[data-reply-to]');if(reply){const thread=reply.closest('[data-comment-thread]'),form=thread.querySelector('[data-comment-form]');form.elements.parentId.value=reply.dataset.replyTo;form.elements.content.placeholder='Viết trả lời...';form.elements.content.setAttribute('aria-label','Nội dung trả lời');thread.querySelector('[data-reply-label]').textContent='Đang trả lời '+reply.dataset.replyName;thread.querySelector('[data-reply-context]').hidden=false;form.elements.content.focus();}
    const cancel=target.closest('[data-cancel-reply]');if(cancel){const thread=cancel.closest('[data-comment-thread]');cancelReply(thread);thread.querySelector('[name=content]').focus();}
    const share=target.closest('[data-copy-post]');if(share){try{await navigator.clipboard.writeText(location.origin+'/feed?post='+encodeURIComponent(share.dataset.copyPost));feedback('Đã sao chép liên kết bài viết');}catch{feedback('Không thể sao chép liên kết',true);}}
    const reaction=target.closest('[data-reaction]');if(reaction){
      const control=reaction.closest('[data-reaction-path]');if(control.dataset.busy)return;control.dataset.busy='true';const buttons=[...control.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
      try{const result=await api(control.dataset.reactionPath,'POST',{reactionType:reaction.dataset.reaction});control.querySelector('[data-reaction-label]').textContent=labels[result.userReaction]||'Thích';buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.reaction===result.userReaction)));control.open=false;control.querySelector('summary').focus();
        const comment=control.closest('[data-comment-id]');if(comment){const value=threadState(control.closest('[data-comment-thread]'));const record=value.comments.find(c=>c.id===comment.dataset.commentId);if(record)record.userReaction=result.userReaction;}
        else{const post=control.closest('[data-feed-post]');post.querySelector('[data-like-count]').textContent=result.totalReactions??result.likeCount;post.dataset.engagement=Number(result.totalReactions??result.likeCount)+Number(post.querySelector('[data-comment-count]').textContent)*2;}
      }catch(error){feedback(error.message,true);}finally{delete control.dataset.busy;buttons.forEach(b=>b.disabled=false);}
    }
    const more=target.closest('[data-feed-more]');if(more&&!more.disabled){more.disabled=true;try{const limit=Number(posts.dataset.limit||10);const doc=await pageDocument((posts.dataset.pagePath||'/feed')+'?cursor='+encodeURIComponent(nextCursor)+'&limit='+limit);const incoming=[...doc.querySelectorAll('[data-feed-post]')];for(const post of incoming)if(![...posts.children].some(p=>p.dataset.postId===post.dataset.postId))posts.append(document.importNode(post,true));nextCursor=doc.querySelector('[data-feed-more]')?.dataset.cursor||nextCursor;more.dataset.cursor=nextCursor;more.hidden=incoming.length<limit;filterFeed();}catch(error){feedback(error.message,true);}finally{more.disabled=false;}}
  });
  document.addEventListener('submit',async event=>{
    const form=event.target;if(!form.matches('[data-comment-form]'))return;event.preventDefault();if(form.dataset.busy)return;
    const content=form.elements.content.value.trim();if(!content)return;
    form.dataset.busy='true';const button=form.querySelector('button[type=submit]');button.disabled=true;const errorNode=form.querySelector('.form-error');errorNode.hidden=true;
    try{const result=await api('/social/posts/'+form.dataset.post+'/comments','POST',{content,...(form.elements.parentId.value?{parentId:form.elements.parentId.value}:{})});const thread=form.closest('[data-comment-thread]'),value=threadState(thread);if(!value.comments.some(c=>c.id===result.id))value.comments.push(result);value.expanded=true;renderComments(thread);form.elements.content.value='';cancelReply(thread);form.elements.content.focus();const post=form.closest('[data-feed-post]');post.querySelector('[data-comment-count]').textContent=value.comments.length;post.dataset.engagement=Number(post.querySelector('[data-like-count]').textContent)+value.comments.length*2;feedback('Đã gửi bình luận.');}
    catch(error){errorNode.textContent=error.message;errorNode.hidden=false;feedback(error.message,true);}finally{delete form.dataset.busy;button.disabled=false;}
  });
  onResult(async (element,result)=>{
    if(element.hasAttribute('data-post-media')){
      element.reset();document.getElementById('post-counter').textContent='0 / 1000';document.getElementById('attachment-preview').replaceChildren();
      try{const doc=await pageDocument('/feed?post='+encodeURIComponent(result.id));const post=doc.querySelector('[data-feed-post]');if(!post)throw new Error('Missing post');posts.prepend(document.importNode(post,true));filterFeed();feedback('Đã đăng bài.');}catch{feedback('Đã đăng bài. Làm mới bảng tin để xem bài viết.');}return true;
    }
    if(element.dataset.method==='DELETE'&&/^\/social\/posts\/[^/]+$/.test(element.dataset.action||'')){element.closest('[data-feed-post]').remove();filterFeed();feedback('Đã xóa bài viết.');return true;}
    if(element.matches('form[data-api="/moderation/reports"]')){element.reset();element.closest('details').open=false;feedback('Đã gửi báo cáo.');return true;}
    if(element.dataset.action==='/social/connections'){element.textContent='Đã gửi';element.dataset.connectionId=result.id;delete element.dataset.action;delete element.dataset.reload;element.dataset.completed='true';feedback('Đã gửi lời mời kết nối.');return true;}
    return false;
  });
  document.getElementById('feed-sort')?.addEventListener('change',filterFeed);filterFeed();
})();
