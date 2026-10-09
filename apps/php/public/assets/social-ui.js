(() => {
  'use strict';
  const { onResult, feedback, pageDocument }=window.TalentFlow;

  document.addEventListener('input',event=>{if(event.target.id!=='network-search')return;const query=event.target.value.toLocaleLowerCase();let count=0;for(const card of document.querySelectorAll('[data-network-person]')){card.hidden=!card.dataset.networkPerson.toLocaleLowerCase().includes(query);if(!card.hidden)count++;}document.getElementById('network-no-results').hidden=count>0;});
  onResult(async (element,result)=>{
    if(element.hasAttribute('data-user-follow')){element.dataset.method=result.following?'DELETE':'POST';element.setAttribute('aria-pressed',String(result.following));element.textContent=result.following?'Đang theo dõi · Bỏ theo dõi':'Theo dõi';document.querySelector('[data-follower-count]').textContent=result.followerCount;feedback('Đã cập nhật theo dõi.');return true;}
    if(element.dataset.action?.startsWith('/notifications/')||element.dataset.action==='/notifications/read-all'){
      const items=element.dataset.action==='/notifications/read-all'?[...document.querySelectorAll('[data-notification-item]')]:[element.closest('[data-notification-item]')].filter(Boolean);
      for(const item of items){item.classList.remove('unread');item.querySelector('[data-method=PATCH]')?.remove();}
      const unread=document.querySelectorAll('[data-notification-item].unread').length;const total=document.querySelector('[data-unread-total]');if(total)total.textContent=unread+' chưa đọc';const badge=document.getElementById('notification-count');if(badge)badge.textContent=unread?String(unread):'';feedback('Đã đánh dấu thông báo đã đọc.');return true;
    }
    if(!document.querySelector('.network-layout')||!element.dataset.action?.startsWith('/social/connections'))return false;
    const search=document.getElementById('network-search'),query=search?.value||'',focused=document.activeElement?.id;
    try{const doc=await pageDocument('/network'),replacement=doc.querySelector('.network-layout');if(!replacement)throw new Error('Missing network');document.querySelector('.network-layout').replaceWith(document.importNode(replacement,true));const input=document.getElementById('network-search');if(input){input.value=query;input.dispatchEvent(new Event('input',{bubbles:true}));if(focused==='network-search')input.focus();}feedback('Đã cập nhật kết nối.');}
    catch{delete element.dataset.action;feedback('Đã cập nhật kết nối. Làm mới trang để xem danh sách.');}return true;
  });
})();
