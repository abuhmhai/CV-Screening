(() => {
  'use strict';
  const { api, feedback } = window.TalentFlow;
  let returnFocus = null;
  function openDialog(dialog, trigger) { if (!dialog) return; returnFocus = trigger || document.activeElement; dialog.showModal(); }
  function closeDialog(dialog) { if (!dialog) return; dialog.close(); returnFocus?.focus(); }
  for (const dialog of document.querySelectorAll('dialog')) {
    dialog.addEventListener('click', event => { if (event.target === dialog) { const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog); } });
    dialog.addEventListener('close', () => returnFocus?.focus());
  }
  document.addEventListener('click', event => {
    const opener=event.target.closest('[data-dialog]');if(opener)openDialog(document.getElementById(opener.dataset.dialog),opener);
    const closer=event.target.closest('[data-close-dialog]');if(closer)closeDialog(closer.closest('dialog'));
    for(const dropdown of document.querySelectorAll('.nav-dropdown[open]'))if(!dropdown.contains(event.target))dropdown.open=false;
    const filter=event.target.closest('[data-mobile-filters]');if(filter){const sidebar=document.querySelector('.filter-sidebar');sidebar?.classList.toggle('mobile-open');filter.setAttribute('aria-expanded',String(sidebar?.classList.contains('mobile-open')));}
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')for(const dropdown of document.querySelectorAll('.nav-dropdown[open]'))dropdown.open=false;});
  for(const dropdown of document.querySelectorAll('.nav-dropdown'))dropdown.addEventListener('toggle',()=>{if(dropdown.open)for(const other of document.querySelectorAll('.nav-dropdown[open]'))if(other!==dropdown)other.open=false;});
  function selectTab(button) {
    const group=button.closest('[role=tablist]');if(!group)return;
    for(const tab of group.querySelectorAll('[data-tab]')) { const selected=tab===button;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;const panel=document.getElementById(tab.dataset.tab);if(panel)panel.hidden=!selected; }
  }
  for(const button of document.querySelectorAll('[data-tab]')) {
    button.addEventListener('click',()=>selectTab(button));
    button.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=[...button.closest('[role=tablist]').querySelectorAll('[data-tab]')];const index=tabs.indexOf(button);const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;selectTab(tabs[next]);tabs[next].focus();});
  }
  for(const faq of document.querySelectorAll('.faq-list details'))faq.addEventListener('toggle',()=>{if(faq.open)for(const other of document.querySelectorAll('.faq-list details[open]'))if(other!==faq)other.open=false;});
  document.querySelector('[data-profile-edit]')?.addEventListener('click',event=>{
    const view=document.getElementById('profile-view'),editor=document.getElementById('profile-editor');if(!view||!editor)return;
    const editing=editor.hidden;view.hidden=editing;editor.hidden=!editing;event.currentTarget.textContent=editing?'Xem hồ sơ':'Chỉnh sửa hồ sơ';event.currentTarget.setAttribute('aria-expanded',String(editing));
  });
  for(const link of document.querySelectorAll('[data-profile-section]'))link.addEventListener('click',event=>{
    event.preventDefault();const editor=document.getElementById('profile-editor');if(editor?.hidden)document.querySelector('[data-profile-edit]')?.click();const section=document.getElementById(link.dataset.profileSection);if(section){section.scrollIntoView({behavior:'smooth',block:'center'});section.querySelector('input,textarea')?.focus({preventScroll:true});}
  });
  document.querySelector('[data-share-profile]')?.addEventListener('click',async event=>{const button=event.currentTarget;button.disabled=true;try{const result=await api('/users/me/public-slug','POST',{});const url=location.origin+'/u/'+result.slug;try{await navigator.clipboard.writeText(url);feedback('Đã sao chép liên kết hồ sơ công khai');}catch{feedback(url);}window.open(url,'_blank','noopener');}catch(error){feedback(error.message,true);}finally{button.disabled=false;}});
  for(const button of document.querySelectorAll('[data-conversation]'))button.addEventListener('click',()=>{
    for(const other of document.querySelectorAll('[data-conversation]'))other.classList.toggle('active',other===button);
    const title=document.getElementById('thread-title'),avatar=document.getElementById('thread-avatar');if(title)title.textContent=button.dataset.title||'Hội thoại';if(avatar)avatar.textContent=(button.dataset.title||'?').slice(0,2).toUpperCase();
  });
  const first=document.querySelector('[data-conversation]');if(first){first.classList.add('active');const title=document.getElementById('thread-title');if(title)title.textContent=first.dataset.title;}
  const themeForm=document.querySelector('[data-preferences="cv_appearance_prefs"]');
  if(themeForm){
    const sync=()=>themeForm.querySelectorAll('[data-theme-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===themeForm.elements.theme.value)));
    themeForm.querySelectorAll('[data-theme-choice]').forEach(button=>button.addEventListener('click',()=>{themeForm.elements.theme.value=button.dataset.themeChoice;sync();}));
    themeForm.addEventListener('reset',()=>setTimeout(sync,0));sync();
  }
  const pendingApplication=document.querySelector('[data-application-refresh]');
  if(pendingApplication){let refreshing=false;setInterval(async()=>{if(refreshing||document.hidden)return;refreshing=true;try{const result=await api('/applications/'+pendingApplication.dataset.applicationRefresh);if(result.status!==pendingApplication.dataset.status||Boolean(result.aiResult)!==(pendingApplication.dataset.scored==='true'))location.reload();}catch(error){feedback(error.message,true);}finally{refreshing=false;}},4000);}
  document.getElementById('conversation-search')?.addEventListener('input',event=>{const q=event.target.value.toLocaleLowerCase();for(const button of document.querySelectorAll('[data-conversation]'))button.hidden=!button.textContent.toLocaleLowerCase().includes(q);});
  for(const select of document.querySelectorAll('[data-filter-change]'))select.addEventListener('change',()=>document.getElementById('job-filters')?.requestSubmit());
  const addText=(parent,tag,value,className)=>{const node=document.createElement(tag);node.textContent=value||'';if(className)node.className=className;parent.append(node);return node;};
  for(const button of document.querySelectorAll('[data-job-summary]'))button.addEventListener('click',async()=>{
    const dialog=document.getElementById('job-summary');const body=dialog.querySelector('.dialog-body');body.replaceChildren();addText(body,'p','Đang tải thông tin...','muted');openDialog(dialog,button);
    try{const job=await api('/external-jobs/'+button.dataset.jobSummary+'/summary');body.replaceChildren();addText(body,'h2',job.title);addText(body,'p',job.company+' · '+(job.location||'Linh hoạt'),'muted');addText(body,'p',job.salary||'Thương lượng','positive');addText(body,'h3','Mô tả công việc');addText(body,'p',job.description||'Nguồn chưa cung cấp mô tả chi tiết. Xem tin gốc để biết thêm.','prose');const chips=document.createElement('div');chips.className='chips';for(const skill of job.skills||[])addText(chips,'span',skill);body.append(chips);if(/^https?:\/\//i.test(job.url)){const link=addText(body,'a','Xem tin tuyển dụng gốc ↗','button secondary');link.href=job.url;link.target='_blank';link.rel='noopener noreferrer';}}
    catch(error){body.replaceChildren();addText(body,'p',error.message,'negative');}
  });
  for(const button of document.querySelectorAll('[data-job-screen]'))button.addEventListener('click',()=>{
    const dialog=document.getElementById('cv-screening');if(!dialog){location.assign('/auth/sign-in');return;}
    const form=dialog.querySelector('form');if(form)form.dataset.api='/external-jobs/'+button.dataset.jobScreen+'/screen';dialog.querySelector('[data-screen-title]').textContent=button.dataset.title;document.getElementById('screen-result')?.replaceChildren();openDialog(dialog,button);
  });
  for(const button of document.querySelectorAll('[data-job-save]'))button.addEventListener('click',async()=>{
    button.disabled=true;try{const external=button.dataset.external==='true';const saved=button.getAttribute('aria-pressed')==='true';const path=(external?'/external-jobs/':'/jobs/')+button.dataset.jobSave+'/save';await api(path,saved?'DELETE':'POST',{});button.setAttribute('aria-pressed',String(!saved));button.classList.toggle('positive',!saved);button.setAttribute('aria-label',saved?'Lưu việc làm':'Bỏ lưu việc làm');feedback(saved?'Đã bỏ lưu việc làm':'Đã lưu việc làm');}catch(error){feedback(error.message,true);}finally{button.disabled=false;}
  });
  document.querySelector('[data-screen-upload]')?.addEventListener('change',async event=>{
    const input=event.target,file=input.files[0];if(!file)return;input.disabled=true;
    try{const body=new FormData();body.append('file',file);const cv=await api('/users/me/cv','POST',body);const select=input.closest('form').querySelector('[name=cvFileId]');const option=document.createElement('option');option.value=cv.id;option.textContent=cv.fileName||file.name;select.append(option);select.value=cv.id;feedback('Đã tải CV lên.');}catch(error){feedback(error.message,true);}finally{input.disabled=false;input.value='';}
  });
  const initial=document.querySelector('[data-initial-job]');if(initial){const button=[...document.querySelectorAll('[data-job-screen]')].find(b=>b.dataset.jobScreen===initial.dataset.initialJob);button?.click();}
  const avatar=document.getElementById('thread-avatar');if(avatar&&first)avatar.textContent=(first.dataset.title||'?').slice(0,2).toUpperCase();
  if(new URLSearchParams(location.search).get('edit')==='true')document.querySelector('[data-profile-edit]')?.click();
  if(location.hash.startsWith('#editor-')){const target=document.getElementById(location.hash.slice(1));if(target){target.scrollIntoView({block:'center'});target.querySelector('input,textarea')?.focus({preventScroll:true});}}
  for(const button of document.querySelectorAll('[data-role]'))button.addEventListener('click',()=>{const role=document.querySelector('form[data-register] [name=role]');role.value=button.dataset.role;for(const other of document.querySelectorAll('[data-role]')){const selected=other===button;other.classList.toggle('active',selected);other.setAttribute('aria-pressed',String(selected));}});
  document.querySelector('[data-password-toggle]')?.addEventListener('click',event=>{const button=event.currentTarget,form=button.closest('form'),visible=form.elements.password.type==='password';for(const key of ['password','confirmPassword'])form.elements[key].type=visible?'text':'password';button.setAttribute('aria-label',visible?'Ẩn mật khẩu':'Hiển thị mật khẩu');});
  document.querySelector('form[data-register] [name=confirmPassword]')?.addEventListener('input',event=>event.target.setCustomValidity(''));
  const composer=document.querySelector('[data-post-media]');if(composer){const content=composer.elements.content;const update=()=>document.getElementById('post-counter').textContent=content.value.length+' / 1000';content.addEventListener('input',update);for(const button of document.querySelectorAll('[data-composer-chip]'))button.addEventListener('click',()=>{content.value=(button.dataset.composerChip+'\n'+content.value).slice(0,1000);content.focus();update();});composer.elements.media.addEventListener('change',()=>{const files=composer.elements.media.files,preview=document.getElementById('attachment-preview');preview.replaceChildren();if(files.length>4){composer.elements.media.value='';feedback('Bạn có thể đính kèm tối đa 4 tệp.',true);return;}for(const file of files){const card=document.createElement('div');card.className='attachment-preview';addText(card,'strong',file.name);addText(card,'small',(file.size/1024).toFixed(1)+' KB','muted');preview.append(card);}});}
  for(const link of document.querySelectorAll('[data-notification-link]'))link.addEventListener('click',async event=>{event.preventDefault();try{await api('/notifications/'+link.dataset.notificationLink+'/read','PATCH',{});}catch(error){feedback(error.message,true);}location.assign(link.href);});
  function filterCandidates(){const query=document.getElementById('candidate-search')?.value.toLocaleLowerCase()||'',status=document.getElementById('candidate-status')?.value||'';for(const row of document.querySelectorAll('[data-candidate]'))row.hidden=!row.textContent.toLocaleLowerCase().includes(query)||(status&&row.dataset.status!==status);const body=document.querySelector('#candidate-table tbody');if(body){const byScore=document.getElementById('candidate-sort').value==='score';[...body.children].sort((a,b)=>byScore?Number(b.dataset.score)-Number(a.dataset.score):b.dataset.date.localeCompare(a.dataset.date)).forEach(row=>body.append(row));}}
  document.getElementById('candidate-search')?.addEventListener('input',filterCandidates);document.getElementById('candidate-status')?.addEventListener('change',filterCandidates);document.getElementById('candidate-sort')?.addEventListener('change',filterCandidates);if(document.getElementById('candidate-table'))filterCandidates();
  for(const select of document.querySelectorAll('[data-application-status]'))select.addEventListener('change',async()=>{select.disabled=true;try{await api('/applications/'+select.dataset.applicationStatus+'/status','PATCH',{status:select.value,note:'Cập nhật từ dashboard'});location.reload();}catch(error){select.value=select.dataset.currentStatus;feedback(error.message,true);select.disabled=false;}});
  const builder=document.querySelector('[data-rich-cv]');
  if(builder){
    function preview(){
      const node=document.getElementById('cv-live-preview');node.replaceChildren();addText(node,'h2',builder.elements.fullName.value||'Họ và tên');addText(node,'p',builder.elements.headline.value,'cv-headline');addText(node,'p',[builder.elements.email.value,builder.elements.phone.value,builder.elements.location.value].filter(Boolean).join(' · '),'cv-contact');if(builder.elements.summary.value){addText(node,'h3','Giới thiệu');addText(node,'p',builder.elements.summary.value,'cv-description');}
      for(const group of builder.querySelectorAll('[data-cv-group]')){if(!group.children.length)continue;const kind=group.dataset.cvGroup;addText(node,'h3',{experiences:'Kinh nghiệm',educations:'Học vấn',skills:'Kỹ năng'}[kind]);const list=document.createElement('div');list.className=kind==='skills'?'cv-skill-list':'cv-entry-list';for(const row of group.children){const values=Object.fromEntries([...row.querySelectorAll('[data-field]')].map(input=>[input.dataset.field,input.value]));if(kind==='skills'){addText(list,'span',[values.name,values.level].filter(Boolean).join(' · '),'cv-skill');}else{const entry=document.createElement('div');entry.className='cv-preview-entry';addText(entry,'h4',kind==='experiences'?[values.position,values.company].filter(Boolean).join(' — '):[values.degree,values.major].filter(Boolean).join(', '));addText(entry,'p',kind==='experiences'?[values.startDate,values.endDate].filter(Boolean).join(' – '):[values.school,[values.startYear,values.endYear].filter(Boolean).join(' – ')].filter(Boolean).join(' · '),'cv-contact');if(values.description)addText(entry,'p',values.description,'cv-description');list.append(entry);}}node.append(list);}
      node.dataset.template=builder.elements.templateId.value;
    }
    builder.addEventListener('input',preview);builder.addEventListener('change',preview);builder.addEventListener('click',event=>{const add=event.target.closest('[data-cv-add]'),remove=event.target.closest('[data-cv-remove]');if(add){const group=builder.querySelector('[data-cv-group="'+add.dataset.cvAdd+'"]');group.append(document.getElementById('cv-template-'+add.dataset.cvAdd).content.cloneNode(true));group.lastElementChild.querySelector('input')?.focus();}if(remove)remove.closest('.cv-repeat-row').remove();if(add||remove)preview();});preview();
  }
})();
