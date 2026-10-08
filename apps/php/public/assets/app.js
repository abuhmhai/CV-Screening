'use strict';
(() => {
  let feedbackTimer;
  const feedback = (message, error = false) => {
    const node = document.getElementById('feedback'); if (!node) return;
    node.className = 'feedback ' + (error ? 'error' : 'success'); node.textContent = message;
    clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{node.textContent='';node.className='';},7000);
  };
  let refreshInFlight = null;
  async function api(path, method = 'GET', body, retry = true) {
    method = method.toUpperCase();
    if (method === 'GET' || method === 'HEAD') body = undefined;
    const headers = { 'Accept': 'application/json', 'X-CSRF-Token': document.querySelector('meta[name=csrf-token]')?.content || '' };
    if (body && !(body instanceof FormData)) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(body); }
    const response = await fetch('/api/v1' + path, { method, headers, body, credentials: 'same-origin' });
    const result = await response.json();
    if (response.status === 401 && retry && path !== '/auth/login' && path !== '/auth/refresh') {
      refreshInFlight ||= api('/auth/refresh', 'POST', {}, false).finally(() => { refreshInFlight = null; });
      await refreshInFlight;
      return api(path, method, body instanceof FormData ? body : (body ? JSON.parse(body) : undefined), false);
    }
    if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(', ') : result.message || 'Yêu cầu thất bại');
    return result;
  }
  function formBody(form) {
    const data = {};
    if(form.hasAttribute('data-job-alert'))return {keyword:form.elements.keyword.value.trim()||null,filters:form.elements.location.value.trim()?{location:form.elements.location.value.trim()}:{},frequency:form.elements.frequency.value};
    if (form.hasAttribute('data-autofill')) {
      return Object.fromEntries(['skills', 'languages', 'certifications'].map(key => [key, [...form.querySelectorAll('input[name="' + key + '[]"]:checked')].map(input => input.value)]));
    }
    if (form.hasAttribute('data-profile-links')) {
      return { languages: form.elements.languages.value.split(',').map(name => ({ name: name.trim() })).filter(l => l.name), socialLinks: Object.fromEntries(['github', 'linkedin', 'website', 'portfolio', 'twitter'].map(key => [key, form.elements[key].value])) };
    }
    for (const element of form.elements) {
      if (!element.name || element.disabled || ['submit', 'button', 'file'].includes(element.type)) continue;
      if (element.type === 'checkbox') data[element.name] = element.checked;
      else if (element.hasAttribute('data-array')) data[element.name] = element.value.split(',').map(x => x.trim()).filter(Boolean);
      else if (element.type === 'number') { if (element.value !== '') data[element.name] = Number(element.value); else if (form.dataset.method === 'PATCH') data[element.name] = null; }
      else if (element.type === 'date' || element.type === 'datetime-local') { if (element.value) data[element.name] = element.type === 'datetime-local' ? new Date(element.value).toISOString() : element.value; else if (form.dataset.method === 'PATCH') data[element.name] = null; }
      else if (element.value !== '') data[element.name] = element.value;
      else if (form.dataset.method === 'PATCH') data[element.name] = null;
    }
    if (form.hasAttribute('data-cv-builder')) {
      if (form.hasAttribute('data-rich-cv')) {
        const title=data.title,templateId=data.templateId;delete data.title;delete data.templateId;
        for(const group of form.querySelectorAll('[data-cv-group]'))data[group.dataset.cvGroup]=[...group.querySelectorAll('.cv-repeat-row')].map(row=>Object.fromEntries([...row.querySelectorAll('[data-field]')].map(input=>[input.dataset.field,input.value])));
        return {title,templateId,data};
      }
      const title = data.title; delete data.title;
      data.skills = (data.skills || '').split(',').map(s => s.trim()).filter(Boolean);
      data.experiences = (data.experiences || '').split('\n').filter(Boolean).map(s => { const [company, position, description] = s.split('|').map(x => x.trim()); return { company, position, description }; });
      data.educations = (data.educations || '').split('\n').filter(Boolean).map(s => { const [school, degree] = s.split('|').map(x => x.trim()); return { school, degree }; });
      return { title, data, templateId: 'classic' };
    }
    return data;
  }
  function showResult(id, result) {
    const node = document.getElementById(id); if (!node) return;
    node.replaceChildren();
    if (result.score !== undefined) {
      const title = document.createElement('h3'); title.textContent = `${result.score}/100 · ${result.verdict}`; node.append(title);
      for (const text of [...(result.strengths || []), ...(result.gaps || []), result.suggestion || '']) { const p = document.createElement('p'); p.textContent = text; node.append(p); }
    } else { const p = document.createElement('pre'); p.textContent = JSON.stringify(result, null, 2); node.append(p); }
  }
  async function finish(element, result) {
    if (element.dataset.result) showResult(element.dataset.result, result);
    feedback('Đã lưu thành công.');
    if (result.taskId) feedback('Đã đưa vào hàng đợi xử lý.');
    if(element.hasAttribute('data-register')){location.assign(element.elements.role.value==='RECRUITER'?'/recruiter/dashboard':'/feed');return;}
    if(element.dataset.success){element.closest('.panel').hidden=true;document.getElementById(element.dataset.success).hidden=false;return;}
    if(element.hasAttribute('data-rich-cv')&&result.id){location.assign('/cv-builder?cv='+encodeURIComponent(result.id));return;}
    if (element.dataset.redirect) location.assign(element.dataset.redirect);
    else if (element.hasAttribute('data-reload')) location.reload();
  }
  document.addEventListener('submit', async event => {
    const form = event.target; if (!form.dataset.api && !form.dataset.upload) return;
    event.preventDefault(); const button = form.querySelector('button[type=submit],button'); if (button) button.disabled = true;
    try {
      const errorNode=form.querySelector('.form-error');if(errorNode)errorNode.hidden=true;
      if(form.hasAttribute('data-register')&&form.elements.password.value!==form.elements.confirmPassword.value)throw new Error('Mật khẩu xác nhận không khớp');
      if(form.dataset.success==='recovery-success'&&!form.elements.email.value.trim()&&!form.elements.phone.value.trim())throw new Error('Vui lòng nhập email hoặc số điện thoại');
      if(form.hasAttribute('data-job-alert')&&!form.elements.keyword.value.trim()&&!form.elements.location.value.trim())throw new Error('Nhập từ khóa hoặc địa điểm cho thông báo');
      const body = form.dataset.upload ? new FormData(form) : formBody(form);
      if (form.hasAttribute('data-post-media')) {
        if(form.querySelector('input[type=file]').files.length>4)throw new Error('Bạn có thể đính kèm tối đa 4 tệp.');
        body.mediaUrls = [];
        for (const file of form.querySelector('input[type=file]').files) { const upload = new FormData(); upload.append('file', file); body.mediaUrls.push((await api('/uploads/media', 'POST', upload)).url); }
      }
      const result = await api(form.dataset.api || form.dataset.upload, form.dataset.method || 'POST', body); await finish(form, result);
    }
    catch (error) { feedback(error.message, true);const node=form.querySelector('.form-error');if(node){node.hidden=false;node.textContent=error.message;} } finally { if (button) button.disabled = false; }
  });
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-action],[data-oauth]'); if (!button) return;
    button.disabled = true;
    try {
      if (button.dataset.oauth) location.assign((await api('/auth/' + button.dataset.oauth)).url);
      else await finish(button, await api(button.dataset.action, button.dataset.method || 'POST', JSON.parse(button.dataset.body || '{}')));
    } catch (error) { feedback(error.message, true); } finally { button.disabled = false; }
  });
  const readPrefs = (key, defaults = {}) => { try { return { ...defaults, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { return defaults; } };
  const applyAppearance = () => {
    const prefs = readPrefs('cv_appearance_prefs', { theme: localStorage.getItem('talentflow-theme') || 'dark', fontSize: 'default' });
    const root = document.documentElement;
    root.dataset.theme = prefs.theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : prefs.theme;
    root.dataset.fontSize = prefs.fontSize;
    for (const [attr, key] of [['compact', 'compactMode'], ['reduceMotion', 'reduceMotion'], ['highContrast', 'highContrast']]) root.dataset[attr] = String(Boolean(prefs[key]));
  };
  const setTheme = value => { localStorage.setItem('cv_appearance_prefs', JSON.stringify({ ...readPrefs('cv_appearance_prefs'), theme: value })); applyAppearance(); };
  applyAppearance();
  matchMedia('(prefers-color-scheme: light)').addEventListener('change', applyAppearance);
  for (const form of document.querySelectorAll('[data-preferences]')) {
    const defaults = form.dataset.preferences === 'cv_notification_prefs' ? { emailApplications: true, emailMessages: true, emailJobAlerts: true, emailDigest: true, pushMessages: true, pushApplications: true, marketingEmails: false } : { theme: 'dark', fontSize: 'default', compactMode: false, reduceMotion: false, highContrast: false };
    const prefs = readPrefs(form.dataset.preferences, defaults);
    for (const element of form.elements) if (element.name && element.name in prefs) { if (element.type === 'checkbox') element.defaultChecked=element.checked = prefs[element.name]; else {element.value = prefs[element.name];element.defaultValue=element.value;} }
    form.addEventListener('reset', event => { event.preventDefault(); const saved=readPrefs(form.dataset.preferences,defaults); for(const element of form.elements)if(element.name in saved){if(element.type==='checkbox')element.checked=saved[element.name];else element.value=saved[element.name];} });
    form.addEventListener('submit', event => { event.preventDefault(); localStorage.setItem(form.dataset.preferences, JSON.stringify(formBody(form))); applyAppearance(); feedback('Đã lưu cài đặt trên trình duyệt.'); });
  }
  for (const id of ['theme-toggle', 'settings-theme-toggle']) document.getElementById(id)?.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'));
  function poll(fn, delay) {
    let timer, busy = false, failures = 0;
    const tick = async () => {
      if (document.hidden || busy) return;
      busy = true;
      try { await fn(); failures = 0; } catch (error) { failures = Math.min(failures + 1, 4); } finally { busy = false; clearTimeout(timer); if (!document.hidden) timer = setTimeout(tick, delay * 2 ** failures); }
    };
    document.addEventListener('visibilitychange', () => { clearTimeout(timer); if (!document.hidden) tick(); }); tick();
  }
  if (document.body.dataset.authenticated === 'true') {
    poll(async () => { const notifications = await api('/notifications');const unread=notifications.filter(n=>!n.isRead).length;const badge=document.getElementById('notification-count');if(badge)badge.textContent = unread ? String(unread) : ''; }, 3000);
    poll(() => api('/presence/heartbeat', 'POST', {}), 10000);
  }
  window.TalentFlow = { api, feedback };
})();
