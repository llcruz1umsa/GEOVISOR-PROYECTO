/* Ficha del establecimiento de salud.
   Datos base: capa de salud (PostGIS o copia GeoJSON).
   Datos complementarios: data/centros_salud_complemento.json, indexado por id_salud.
   Imagen Street View: campo "sv" del complemento; se muestra en una ficha pequeña
   que se abre al costado de la ficha principal. */
(function(){
 let extra={};
 fetch('data/centros_salud_complemento.json').then(r=>r.ok?r.json():{}).then(d=>{extra=d||{}}).catch(()=>{});

 const css=document.createElement('style');
 css.textContent=`
 .popup.ficha-salud{width:390px;max-height:74vh;padding:0 16px 16px}
 .fs-head{position:sticky;top:0;z-index:2;display:grid;grid-template-columns:58px 1fr 58px;align-items:center;gap:8px;
   margin:0 -16px 8px;padding:10px 12px;background:#fff;border-bottom:3px solid #0b1f6b}
 .fs-head img{width:58px;height:58px;object-fit:contain;display:block}
 .fs-head .fs-tit{text-align:center;line-height:1.2}
 .fs-head .fs-tit b{display:block;font-size:12.5px;color:#0b1f6b;letter-spacing:.4px}
 .fs-head .fs-tit small{display:block;font-size:9.5px;color:#7a6b40;letter-spacing:.8px;margin-top:2px}
 .popup.ficha-salud h3{margin:6px 0 2px;font-size:16px;color:#0b1f6b;text-align:center}
 .fs-cat{display:block;text-align:center;font-size:10.5px;color:#7a6b40;letter-spacing:.6px}
 .fs-badges{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin:8px 0 4px}
 .fs-b{font-size:10.5px;font-weight:700;padding:3px 7px;border-radius:12px;border:1px solid}
 .fs-si{background:#e5f5ea;color:#17703a;border-color:#9bd3ad}
 .fs-med{background:#fff4dc;color:#8a5a00;border-color:#f0cf7d}
 .fs-no{background:#f1f2f6;color:#8a90a5;border-color:#d8dbe5}
 .fs-svbtn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin:8px 0 2px;padding:7px;border-radius:6px;
   border:1px solid #0b1f6b;background:#0b1f6b;color:#fff;font-weight:600;font-size:11.5px;cursor:pointer}
 .fs-svbtn:hover{background:#13308f}
 .fs-svbtn.fs-svno{background:#f1f2f6;color:#6b7187;border-color:#d8dbe5}
 .fs-svbtn[disabled]{background:#f1f2f6;color:#8a90a5;border-color:#d8dbe5;cursor:default}
 .fs-blq{margin-top:10px;border:1px solid #e1e4ee;border-radius:7px;overflow:hidden}
 .fs-blq h4{margin:0;padding:5px 8px;font-size:11px;letter-spacing:.5px;background:#0b1f6b;color:#fff;text-transform:uppercase}
 .fs-row{display:grid;grid-template-columns:42% 58%;font-size:11.5px;border-top:1px solid #eef0f5}
 .fs-row:first-of-type{border-top:0}
 .fs-row b{padding:4px 8px;color:#0b1f6b;font-weight:600}
 .fs-row span{padding:4px 8px;word-break:break-word}
 .fs-vacio{color:#a3a8ba}
 .fs-src{font-size:9.5px;color:#7b8197;display:block}
 .fs-sv{position:fixed;z-index:1200;width:330px;background:#fff;border-radius:10px;box-shadow:0 8px 40px #07077440;
   overflow:hidden;font-family:inherit;animation:fsIn .18s ease-out}
 @keyframes fsIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
 .fs-sv .fs-svh{height:auto;min-height:0;margin:0;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:7px 10px;background:#0b1f6b;color:#fff}
 .fs-sv .fs-svh b{font-size:11.5px;letter-spacing:.4px}
 .fs-sv .fs-svh button{border:0;background:transparent;color:#fff;font-size:18px;line-height:1;cursor:pointer;padding:0 2px}
 .fs-sv img{display:block;width:100%;height:200px;object-fit:cover;background:#e9ebf2;cursor:zoom-in}
 .fs-sv.grande{width:min(760px,70vw)}
 .fs-sv.grande img{height:auto;max-height:62vh;cursor:zoom-out}
 .fs-sv p{margin:0;padding:6px 10px 8px;font-size:10.5px;color:#4a5068;line-height:1.35}
 .fs-sv p small{display:block;color:#8a90a5;font-size:9.5px;margin-top:2px}
 .fs-sv .fs-nosv{padding:22px 14px;text-align:center;color:#6b7187;font-size:11.5px;background:#f6f7fb}`;
 document.head.append(css);

 const vacio=v=>v===null||v===undefined||v==='';
 const el=(t,c,txt)=>{const e=document.createElement(t);if(c)e.className=c;if(txt!==undefined)e.textContent=txt;return e};

 function badge(label,val){
  const v=String(val||'').toLowerCase();
  const cls=v.startsWith('sí')||v.startsWith('si')||v==='24 horas'?'fs-si':v.startsWith('básica')||v.startsWith('basica')?'fs-med':'fs-no';
  const icon=cls==='fs-si'?'✔':cls==='fs-med'?'◐':'✖';
  return el('span','fs-b '+cls,icon+' '+label);
 }

 function bloque(titulo,filas){
  const b=el('div','fs-blq');b.append(el('h4',null,titulo));
  for(const [label,val,src] of filas){
   const r=el('div','fs-row');r.append(el('b',null,label));
   const s=el('span');
   if(vacio(val)){s.textContent='Sin dato';s.classList.add('fs-vacio')}
   else if(typeof val==='string'&&/^https?:\/\//.test(val)){const a=el('a',null,'Abrir enlace');a.href=val;a.target='_blank';a.rel='noopener';s.append(a)}
   else s.textContent=String(val);
   if(src&&!vacio(val))s.append(el('small','fs-src','Fuente: '+src));
   r.append(s);b.append(r);
  }
  return b;
 }

 // ---------- Ficha pequeña de Street View (sale al costado de la ficha principal) ----------
 let svCard=null;
 function cerrarSV(){if(svCard){svCard.remove();svCard=null}}
 function ubicarSV(){
  if(!svCard)return;const info=document.getElementById('info');if(!info)return;
  const r=info.getBoundingClientRect(), w=svCard.offsetWidth, h=svCard.offsetHeight, m=12;
  let left=r.left-w-m; if(left<m) left=Math.max(m,r.left);            // si no cabe a la izquierda, se superpone
  let top=Math.min(Math.max(m,r.top),window.innerHeight-h-m);
  svCard.style.left=left+'px';svCard.style.top=top+'px';
 }
 function abrirSV(p,sv){
  cerrarSV();
  svCard=el('div','fs-sv');
  const hd=el('div','fs-svh');hd.append(el('b',null,'📷 VISTA DE CALLE · '+(p.nombre||'')));
  const x=el('button',null,'×');x.title='Cerrar';x.onclick=cerrarSV;hd.append(x);svCard.append(hd);
  if(sv&&sv.foto){
   const img=el('img');img.src=sv.foto;img.alt='Street View de '+(p.nombre||'');
   img.title='Clic para ampliar';img.onclick=()=>{svCard.classList.toggle('grande');requestAnimationFrame(ubicarSV)};
   img.onload=ubicarSV;
   img.onerror=()=>{img.replaceWith(el('div','fs-nosv','No se pudo cargar la imagen.'))};
   const t=el('p',null,(sv.dist!=null?'Tomada desde la vía, a unos '+sv.dist+' m del punto del establecimiento, mirando hacia él.':'Vista de calle del establecimiento.'));
   t.append(el('small',null,'Imagen: © Google Street View'+(sv.fecha?' · '+sv.fecha:'')));
   svCard.append(img,t);
  } else {
   svCard.append(el('div','fs-nosv',(sv&&sv.nota)||'Google Street View no tiene cobertura en este sector.'));
  }
  document.body.append(svCard);ubicarSV();
 }
 window.addEventListener('resize',ubicarSV);

 window.selectHealth=function(f){
  const p=f.properties||{};const x=extra[String(p.id_salud)]||{};const fx=x.fuentes||{};
  const g=(k)=>vacio(x[k])?p[k]:x[k];
  const info=document.getElementById('info');info.replaceChildren();info.classList.add('ficha-salud');info.scrollTop=0;

  // Encabezado: logo del Ejército (izq.) · título (centro) · logo EMTE (der.)
  const hd=el('div','fs-head');
  const l1=el('img');l1.src='assets/logos/ejercito_bolivia.png';l1.alt='Ejército de Bolivia';
  const l2=el('img');l2.src='assets/logos/emte.png';l2.alt='Escuela Militar de Topografía del Ejército';
  const tt=el('div','fs-tit');tt.append(el('b',null,'FICHA DE ESTABLECIMIENTO DE SALUD'),el('small',null,'GEOVISOR OMASUYOS · EMTE'));
  hd.append(l1,tt,l2);info.append(hd);

  info.append(el('h3',null,p.nombre||'Establecimiento sin nombre'));
  if(p.categoria)info.append(el('span','fs-cat',p.categoria));

  const bd=el('div','fs-badges');
  bd.append(badge('Emergencia'+(p.emergencia&&p.emergencia!=='No'&&p.emergencia!=='Sí'?' '+p.emergencia.toLowerCase():''),p.emergencia),
            badge('Internación',p.internacion),
            badge(p.horario==='24 horas'?'24 horas':'No 24 h',p.horario==='24 horas'?'Sí':'No'),
            badge('Laboratorio',p.laboratorio));
  info.append(bd);

  const sv=x.sv||null;
  const sb=el('button','fs-svbtn',sv&&sv.foto?'📷 Ver imagen de la vista de calle':'📷 Sin imagen de vista de calle');
  if(!(sv&&sv.foto))sb.classList.add('fs-svno');
  sb.onclick=()=>{if(svCard)cerrarSV();else abrirSV(p,sv)};
  info.append(sb);

  info.append(bloque('1. Identificación',[
   ['Categoría',p.categoria],['Tipo',p.tipo],['Nivel de atención',p.nivel],['Subsector',p.subsector],
   ['Dependencia',p.dependencia],['Red de salud',p.area_red],['Código SNIS',x.codigo_snis,fx.codigo_snis]]));
  info.append(bloque('2. Capacidad de atención',[
   ['Emergencia',p.emergencia],['Internación',p.internacion],['Horario',p.horario],['Laboratorio',p.laboratorio],
   ['Especialidades',p.especialidades],['Servicios',p.servicios],['Atención',p.atencion],
   ['Camas',x.camas,fx.camas],['Quirófano',x.quirofano,fx.quirofano],['Sala de partos',x.sala_partos,fx.sala_partos],
   ['Personal',x.personal,fx.personal]]));
  const n=v=>vacio(v)?v:Number(v).toLocaleString('es-BO',{maximumFractionDigits:6});
  info.append(bloque('3. Ubicación y acceso',[
   ['Este (UTM 19S)',vacio(p.este_origen)?null:Math.round(p.este_origen)+' m'],['Norte (UTM 19S)',vacio(p.norte_origen)?null:Math.round(p.norte_origen)+' m'],
   ['Latitud / Longitud',vacio(p.latitud_origen)?null:n(p.latitud_origen)+' , '+n(p.longitud_origen)],
   ['Municipio',p.municipio],['Comunidad',x.comunidad,fx.comunidad],['Dirección',g('direccion'),fx.direccion],
   ['Altitud',x.altitud,fx.altitud],['Acceso',x.acceso,fx.acceso]]));
  info.append(bloque('4. Comunicación y contacto',[
   ['Teléfono',g('telefono'),fx.telefono],['Responsable',x.responsable,fx.responsable],
   ['Página / Facebook',x.web,fx.web],['Correo',x.correo,fx.correo]]));
  info.append(bloque('5. Apoyo logístico',[
   ['Ambulancias (del municipio)',p.ambulancias_municipio],['Ambulancias propias',x.ambulancias_propias,fx.ambulancias_propias],
   ['Hospital de referencia',x.hospital_referencia||(p.categoria&&p.categoria.startsWith('HOSPITAL')?null:'Hospital Achacachi (2do nivel)'),fx.hospital_referencia||(x.hospital_referencia?null:'red de salud de Omasuyos')]]));

  // La ficha pequeña se abre sola cuando hay imagen.
  if(sv&&sv.foto)abrirSV(p,sv);else cerrarSV();
 };

 // Al mostrar otra ficha o cerrar la principal, se quita el ancho especial y la ficha pequeña.
 const info=document.getElementById('info');
 if(info){
  new MutationObserver(()=>{if(!info.querySelector('.fs-head')){info.classList.remove('ficha-salud');cerrarSV()}}).observe(info,{childList:true});
  new MutationObserver(()=>{const st=getComputedStyle(info);if(st.display==='none'||st.visibility==='hidden')cerrarSV();else ubicarSV()}).observe(info,{attributes:true,attributeFilter:['style','class']});
 }
})();
