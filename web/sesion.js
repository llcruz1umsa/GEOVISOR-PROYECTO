(()=>{
 const original=window.fetch.bind(window);
 const ready=original('/api/sesion').then(r=>{if(r.status===401){location.replace('/login');throw new Error('Sesión terminada');}if(!r.ok)throw new Error('No se pudo verificar la sesión');return r.json()});
 window.fetch=async function(url,options={}){
  const same=typeof url==='string'&&new URL(url,location.href).origin===location.origin;
  if(same&& !['GET','HEAD','OPTIONS'].includes((options.method||'GET').toUpperCase())){const data=await ready;const headers=new Headers(options.headers);headers.set('X-CSRF-Token',data.csrf);options={...options,headers};}
  const response=await original(url,options);if(same&&response.status===401)location.replace('/login');return response;
 };
 document.addEventListener('DOMContentLoaded',async()=>{
  try{const data=await ready;const bar=document.createElement('div');bar.className='session-actions';bar.style='position:absolute;right:28px;top:8px;display:flex;gap:10px;align-items:center;font-size:11px';
   const name=document.createElement('span');name.textContent=data.usuario;name.style.color='#e5e7ff';
   const form=document.createElement('form');form.method='post';form.action='/logout';const csrf=document.createElement('input');csrf.type='hidden';csrf.name='csrf';csrf.value=data.csrf;const button=document.createElement('button');button.type='submit';button.textContent='Cerrar sesión';button.style='font-size:10px;padding:4px 8px;color:white;background:#ffffff20;border:1px solid #ffffff44';form.append(csrf,button);const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 24 24');icon.setAttribute('aria-hidden','true');icon.style='width:19px;height:19px;flex-shrink:0;fill:#e5e7ff';icon.innerHTML='<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3Z"/>';bar.append(icon,name,form);document.querySelector('header').append(bar);
  }catch{location.replace('/login');}
 });
})();
