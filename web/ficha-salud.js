/* Ficha del establecimiento de salud en 6 bloques.
   Datos base: capa de salud (PostGIS o copia GeoJSON).
   Datos complementarios (fotos, teléfonos, camas, etc.): data/centros_salud_complemento.json,
   indexado por id_salud. Cada dato agregado guarda su fuente. */
(function(){
 let extra={};
 fetch('data/centros_salud_complemento.json').then(r=>r.ok?r.json():{}).then(d=>{extra=d||{}}).catch(()=>{});

 const css=document.createElement('style');
 css.textContent=`
 .popup.ficha-salud{width:380px;max-height:72vh}
 .fs-foto{width:100%;max-height:190px;object-fit:cover;border-radius:6px;margin:6px 0 2px;background:#eef0f6}
 .fs-cred{font-size:9.5px;color:#7b8197;margin:0 0 6px}
 .fs-badges{display:flex;flex-wrap:wrap;gap:5px;margin:8px 0 4px}
 .fs-b{font-size:10.5px;font-weight:700;padding:3px 7px;border-radius:12px;border:1px solid}
 .fs-si{background:#e5f5ea;color:#17703a;border-color:#9bd3ad}
 .fs-med{background:#fff4dc;color:#8a5a00;border-color:#f0cf7d}
 .fs-no{background:#f1f2f6;color:#8a90a5;border-color:#d8dbe5}
 .fs-blq{margin-top:10px;border:1px solid #e1e4ee;border-radius:7px;overflow:hidden}
 .fs-blq h4{margin:0;padding:5px 8px;font-size:11px;letter-spacing:.5px;background:#0b1f6b;color:#fff;text-transform:uppercase}
 .fs-row{display:grid;grid-template-columns:42% 58%;font-size:11.5px;border-top:1px solid #eef0f5}
 .fs-row:first-of-type{border-top:0}
 .fs-row b{padding:4px 8px;color:#0b1f6b;font-weight:600}
 .fs-row span{padding:4px 8px;word-break:break-word}
 .fs-vacio{color:#a3a8ba}
 .fs-src{font-size:9.5px;color:#7b8197;display:block}
 .fs-maps{margin-top:12px;border-top:2px solid #0b1f6b;padding-top:8px}
 .fs-maps h4{margin:0 0 6px;font-size:12px;color:#0b1f6b;text-transform:uppercase;letter-spacing:.4px}
 .fs-maps img{width:100%;max-height:230px;object-fit:cover;border-radius:6px;display:block;background:#eee}
 .fs-maps .fs-links{display:flex;gap:6px;margin-top:6px}
 .fs-maps .fs-links a{flex:1;text-align:center;padding:6px;border-radius:6px;background:#0b1f6b;color:#fff;text-decoration:none;font-size:11px;font-weight:600}
 .fs-maps .fs-links a.sv{background:#e8a317;color:#111}
 .fs-btn{margin-top:10px;width:100%;padding:7px;border:1px solid #0b1f6b;background:#fff;color:#0b1f6b;border-radius:6px;font-weight:600;cursor:pointer;font-size:11.5px}
 .fs-btn:hover{background:#0b1f6b;color:#fff}
 .fs-tabla{width:100%;border-collapse:collapse;font-size:11px;margin-top:6px}
 .fs-tabla td{padding:3px 6px;border-top:1px solid #e3e6ef;vertical-align:top;word-break:break-word}
 .fs-tabla tr:nth-child(odd){background:#f6f7fb}
 .fs-tabla td:first-child{font-weight:600;color:#0b1f6b;width:42%}`;
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

 window.selectHealth=function(f){
  const p=f.properties||{};const x=extra[String(p.id_salud)]||{};const fx=x.fuentes||{};
  const g=(k)=>vacio(x[k])?p[k]:x[k];
  const info=document.getElementById('info');info.replaceChildren();info.classList.add('ficha-salud');
  info.append(el('span','tag','ESTABLECIMIENTO DE SALUD · '+(p.categoria||'')));
  info.append(el('h3',null,p.nombre||'Establecimiento sin nombre'));

  if(x.foto){
   const img=el('img','fs-foto');img.src=x.foto;img.alt='Foto de '+(p.nombre||'');img.loading='lazy';
   img.onerror=()=>{img.remove();cred.remove()};
   const cred=el('p','fs-cred','Foto: '+(x.foto_fuente||'fuente no indicada')+(x.foto_fecha?' · '+x.foto_fecha:''));
   info.append(img,cred);
  }

  const bd=el('div','fs-badges');
  bd.append(badge('Emergencia'+(p.emergencia&&p.emergencia!=='No'&&p.emergencia!=='Sí'?' '+p.emergencia.toLowerCase():''),p.emergencia),
            badge('Internación',p.internacion),
            badge(p.horario==='24 horas'?'24 horas':'No 24 h',p.horario==='24 horas'?'Sí':'No'),
            badge('Laboratorio',p.laboratorio));
  info.append(bd);

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
   ['Altitud',x.altitud,fx.altitud],['Acceso',x.acceso,fx.acceso],
   ['Ver en Google Maps',vacio(p.latitud_origen)?null:'https://www.google.com/maps?q='+p.latitud_origen+','+p.longitud_origen]]));
  info.append(bloque('4. Comunicación y contacto',[
   ['Teléfono',g('telefono'),fx.telefono],['Responsable',x.responsable,fx.responsable],
   ['Página / Facebook',x.web,fx.web],['Correo',x.correo,fx.correo]]));
  info.append(bloque('5. Apoyo logístico',[
   ['Ambulancias (del municipio)',p.ambulancias_municipio],['Ambulancias propias',x.ambulancias_propias,fx.ambulancias_propias],
   ['Hospital de referencia',x.hospital_referencia||(p.categoria&&p.categoria.startsWith('HOSPITAL')?null:'Hospital Achacachi (2do nivel)'),fx.hospital_referencia||(x.hospital_referencia?null:'red de salud de Omasuyos')]]));
  info.append(bloque('6. Confiabilidad del dato',[
   ['Precisión de la ubicación',p.precision_declarada],['Fuente',p.fuente],['Fuente de ubicación',p.fuente_ubicacion],
   ['Gestión',p.gestion],['Datos complementados',x.actualizado,null],['Observaciones',g('observacion'),fx.observacion]]));

  const btn=el('button','fs-btn','Ver todos los atributos');let tabla=null;
  btn.onclick=()=>{
   if(tabla){tabla.remove();tabla=null;btn.textContent='Ver todos los atributos';return}
   tabla=el('table','fs-tabla');
   const todos={...p};for(const [k,v] of Object.entries(x))if(k!=='fuentes'&&!k.startsWith('maps_'))todos['+ '+k]=v;
   for(const [k,v] of Object.entries(todos)){const tr=el('tr');tr.append(el('td',null,k),el('td',vacio(v)?'fs-vacio':null,vacio(v)?'—':String(v)));tabla.append(tr)}
   btn.after(tabla);btn.textContent='Ocultar tabla de atributos';
  };
  info.append(btn);

  // 7. Vista en Google Maps (al final de la ficha)
  const lat=x.maps_lat||p.latitud_origen, lon=x.maps_lon||p.longitud_origen;
  if(lat&&lon){
   const m=el('div','fs-maps');m.append(el('h4',null,'7. Vista en Google Maps'));
   if(x.maps_foto){
    const im=el('img');im.src=x.maps_foto;im.alt='Google Maps: '+(x.maps_nombre||p.nombre||'');im.loading='lazy';
    const cr=el('p','fs-cred','Imagen: Google Maps'+(x.maps_foto_tipo?' ('+x.maps_foto_tipo+')':'')+' · '+(x.maps_nombre||''));
    im.onerror=()=>{im.remove();cr.remove()};m.append(im,cr);
   } else m.append(el('p','fs-cred',x.maps_nota||'Google Maps no tiene una foto de la fachada con el nombre de este establecimiento.'));
   const filas=[['Nombre en Maps',x.maps_nombre],['Plus Code',x.maps_plus],['Dirección (Maps)',x.maps_direccion],
     ['Horario (Maps)',x.maps_horario],['Calificación',x.maps_calificacion],['Coordenadas Maps',x.maps_lat?(x.maps_lat+', '+x.maps_lon):null]].filter(r=>!vacio(r[1]));
   if(filas.length){const b=bloque('Datos de Google Maps',filas);b.querySelector('h4').remove();m.append(b)}
   const ln=el('div','fs-links');
   const a1=el('a',null,'📍 Abrir en Google Maps');a1.href=x.maps_url||('https://www.google.com/maps/search/?api=1&query='+lat+','+lon);a1.target='_blank';a1.rel='noopener';
   const a2=el('a','sv','👁 Ver en Street View');a2.href='https://www.google.com/maps/@?api=1&map_action=pano&viewpoint='+lat+','+lon;a2.target='_blank';a2.rel='noopener';
   ln.append(a1,a2);m.append(ln);info.append(m);
  }
 };

 // Al mostrar otra ficha, se quita el ancho especial.
 const info=document.getElementById('info');
 if(info)new MutationObserver(()=>{if(!info.querySelector('.fs-blq')&&!info.querySelector('.fs-foto'))info.classList.remove('ficha-salud')}).observe(info,{childList:true});
})();
