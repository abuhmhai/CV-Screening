(() => {
  'use strict';
  const { api, feedback, onResult, pageDocument }=window.TalentFlow;
  if(!document.querySelector('[data-applications-list]'))return;
  let busy=false;
  const signature=rows=>rows.map(row=>[row.id,row.status,String(row.aiResult?.overallScore??'')].join(':')).sort().join('|');
  const current=()=>[...document.querySelectorAll('[data-application-card]')].map(card=>({id:card.dataset.applicationCard,status:card.dataset.status,aiResult:{overallScore:card.dataset.score}}));
  async function refresh(){const doc=await pageDocument('/applications');const list=doc.querySelector('[data-applications-list]');if(!list)throw new Error('Không tải được danh sách ứng tuyển.');document.querySelector('[data-applications-list]').replaceWith(document.importNode(list,true));}
  onResult(async element=>{
    if(!/^\/applications\/[^/]+(?:\/reapply)?$/.test(element.dataset.action||''))return false;
    busy=true;try{await refresh();feedback(element.dataset.method==='DELETE'?'Đã rút đơn ứng tuyển.':'Đã gửi lại đơn ứng tuyển.');}catch{delete element.dataset.action;element.dataset.completed='true';feedback('Đã cập nhật đơn ứng tuyển. Làm mới trang để xem trạng thái.');}finally{busy=false;}return true;
  });
  setInterval(async()=>{if(document.hidden||busy)return;const rows=current();if(!rows.some(a=>a.status==='AI_SCREENING'||a.status==='APPLIED'&&!a.aiResult.overallScore))return;busy=true;try{const updated=await api('/applications/me');if(signature(rows)!==signature(updated))await refresh();}catch{/* Keep visible records and retry on the next tick. */}finally{busy=false;}},5000);
})();
