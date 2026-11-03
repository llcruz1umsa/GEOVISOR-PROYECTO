document.addEventListener('DOMContentLoaded',()=>{
 const ns='http://www.w3.org/2000/svg',K=65759.1401421867;
 const providers={
  standard:{name:'Estándar',url:(z,x,y)=>`https://tile.openstreetmap.org/${z}/${x}/${y}.png`,credit:'© OpenStreetMap contributors',href:'https://www.openstreetmap.org/copyright',note:'Servicio en línea de OpenStreetMap. La actualización depende de los datos aportados y de su publicación.'},
  satellite:{name:'Satélite',url:(z,x,y)=>`https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,credit:'Esri World Imagery · Esri, Maxar, Earthstar Geographics y GIS User Community',href:'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9',note:''},
  planet:{name:'Satélite 3 m',url:(z,x,y)=>`tiles/planet2026/${z}/${x}/${y}.webp`,credit:'PlanetScope © Planet Labs PBC · 3 m',href:'https://www.planet.com/',note:'Imagen PlanetScope de 3 m guardada en esta computadora: funciona SIN INTERNET. Cubre solo la provincia Omasuyos.',local:true,bbox:[-68.9920,-16.2586,-68.4844,-15.7510],zmin:9},
 s2026:{name:'Satélite 2026',url:(z,x,y)=>`tiles/sentinel2026/${z}/${x}/${y}.webp`,credit:'Copernicus Sentinel-2 (ESA) · imagen del 08/08/2026 · 10 m',href:'https://dataspace.copernicus.eu/',note:'Imagen satelital guardada en esta computadora: funciona SIN INTERNET. Cubre solo la provincia Omasuyos. Resolución 10 m (cada píxel = 10 × 10 m).',local:true,bbox:[-69.01,-16.276,-68.467,-15.734],zmin:9},
  relief:{name:'Relieve',url:(z,x,y)=>`https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/${z}/${y}/${x}`,credit:'Esri World Hillshade · Esri, USGS, NGA, NASA, CGIAR y GIS User Community',href:'https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer',note:'Relieve sombreado a partir de elevación. No es una imagen satelital; fecha local de los datos aún no verificada.'}
 };
 const scene=document.getElementById('scene'),tiles=document.createElementNS(ns,'g');tiles.id='basemap';tiles.style.pointerEvents='none';scene.prepend(tiles);
 const menu=document.createElement('details');menu.className='layer-menu';menu.open=true;
 menu.innerHTML='<summary>Tipo de mapa</summary><div style="padding:0 12px" id="basemap-options"></div><p id="basemap-status" role="status" style="padding:0 12px;font-size:11px"></p><p id="basemap-note" style="padding:0 12px;font-size:11px"></p>';
 document.querySelector('aside').insertBefore(menu,document.querySelector('.layer-menu'));
 let current='s2026',timer=null,viewGeneration=0,failed=false;
 const nativeLimits={standard:19,satellite:19,relief:18,s2026:15,planet:17};
 const css=document.createElement('style');css.textContent=`#basemap-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:14px 10px!important}#basemap-options label{display:flex;flex-direction:column;gap:6px;align-items:center;padding:3px;border:0;font-size:11px;cursor:pointer;text-align:center}#basemap-options label:has(input:checked) .map-thumb{outline:3px solid #070774;outline-offset:2px}#basemap-options label[hidden]{display:none!important}#basemap-options input{position:absolute;opacity:0}#basemap-options label:focus-within .map-thumb{outline:3px solid #070774;outline-offset:2px}.map-thumb{width:62px;height:62px;border-radius:12px;overflow:hidden}#basemap-options label:last-child{grid-column:1/-1;flex-direction:row;justify-content:center}#basemap-options label:last-child .map-thumb{width:24px;height:24px}`;document.head.append(css);
 const status=menu.querySelector('#basemap-status'),note=menu.querySelector('#basemap-note');
 const attribution=document.createElement('div');attribution.className='basemap-credit';
 attribution.style='position:absolute;right:8px;bottom:4px;z-index:8;max-width:65%;background:#fffffff0;padding:4px 8px;font-size:10px;border-radius:4px';
 document.querySelector('.map').append(attribution);
 function setMap(kind){
  current=kind;viewGeneration++;tiles.replaceChildren();failed=false;
  note.hidden=true;status.hidden=true;note.textContent=providers[kind]?.note||'Solo cartografía propia. Disponible sin conexión a mapas base.';
  attribution.replaceChildren();
  if(providers[kind]){const a=document.createElement('a');a.href=providers[kind].href;a.target='_blank';a.rel='noopener';a.textContent=providers[kind].credit;attribution.append(a)}
  document.getElementById('water').style.opacity=kind==='none'?'1':'.32';
  status.textContent=kind==='none'?'Sin mapa base':'Cargando mapa base…';refresh();
 }
 for(const [kind,name] of [['planet','Satélite 3 m'],['s2026','Satélite 2026'],['standard','Estándar'],['satellite','Satélite'],['relief','Relieve'],['none','Sin mapa base']]){
  const row=document.createElement('label'),radio=document.createElement('input');radio.type='radio';radio.name='basemap';radio.value=kind;radio.checked=kind===current;radio.style.accentColor='#070774';const thumb=document.createElement('span');thumb.className='map-thumb';const colors={standard:['#dce9d1','#9ad9e5','#ffffff'],satellite:['#69704f','#485442','#c7bda9'],relief:['#abb09f','#737e70','#ffffff'],s2026:['#8a7a55','#2f5a78','#e8dcc0'],planet:['#9a8058','#24506e','#f1e6c8'],none:['#f3f4f7','#dddded','#070774']}[kind];thumb.innerHTML=`<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="${colors[0]}"/><path d="M0 5L28 0 22 26 40 43 27 64H0Z" fill="${colors[1]}"/><path d="M-5 58C18 42 7 21 30 25S42 12 68 5" fill="none" stroke="${colors[2]}" stroke-width="7"/><path d="M42 68L34 37 68 34" fill="none" stroke="${colors[2]}" stroke-width="3"/></svg>`;row.append(radio,thumb,document.createTextNode(name));menu.querySelector('#basemap-options').append(row);radio.onchange=()=>setMap(kind);if(kind==='planet')row.hidden=true;
 }
 function refresh(){
  if(!providers[current])return;
  const matrix=scene.getScreenCTM();if(!matrix)return;
  const rect=svg.getBoundingClientRect(),inverse=matrix.inverse();
  const corners=[[rect.left,rect.top],[rect.right,rect.bottom]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(inverse));
  const cssScale=Math.hypot(matrix.a,matrix.b);
  let z=Math.max(0,Math.min(nativeLimits[current],Math.round(Math.log2(K*2*Math.PI*cssScale/256))));
  function range(level){const n=2**level;return {n,x0:Math.max(0,Math.floor((((corners[0].x-500)/K-1.199706713376768)+Math.PI)/(2*Math.PI)*n)),x1:Math.min(n-1,Math.floor((((corners[1].x-500)/K-1.199706713376768)+Math.PI)/(2*Math.PI)*n)),y0:Math.max(0,Math.floor((Math.PI-((380-corners[0].y)/K-0.2830464015276702))/(2*Math.PI)*n)),y1:Math.min(n-1,Math.floor((Math.PI-((380-corners[1].y)/K-0.2830464015276702))/(2*Math.PI)*n))}}
  const P=providers[current];if(P.zmin&&z<P.zmin)z=P.zmin;
  let r=range(z);while((r.x1-r.x0+1)*(r.y1-r.y0+1)>100&&z>(P.zmin||0))r=range(--z);
  if(P.bbox){const n=2**z,tx=lo=>Math.floor((lo+180)/360*n),ty=la=>Math.floor((1-Math.log(Math.tan(la*Math.PI/180)+1/Math.cos(la*Math.PI/180))/Math.PI)/2*n);r.x0=Math.max(r.x0,tx(P.bbox[0]));r.x1=Math.min(r.x1,tx(P.bbox[2]));r.y0=Math.max(r.y0,ty(P.bbox[3]));r.y1=Math.min(r.y1,ty(P.bbox[1]));}
  const needed=new Set(),generation=viewGeneration,kind=current;
  const existing=new Map([...tiles.children].map(el=>[el.dataset.key,el]));
  for(let x=r.x0;x<=r.x1;x++)for(let y=r.y0;y<=r.y1;y++){
   const key=`${kind}/${z}/${x}/${y}`;needed.add(key);if(existing.has(key))continue;
   const tile=document.createElementNS(ns,'image');tile.dataset.key=key;
   const span=2*Math.PI*K/r.n;
   tile.setAttribute('x',500+(x/r.n*2*Math.PI-Math.PI+1.199706713376768)*K);
   tile.setAttribute('y',380-(Math.PI-y/r.n*2*Math.PI+0.2830464015276702)*K);
   tile.setAttribute('width',span+.05);tile.setAttribute('height',span+.05);tile.setAttribute('preserveAspectRatio','none');
   tile.addEventListener('load',()=>{if(generation===viewGeneration&&!failed)status.textContent=providers[kind].name+(providers[kind].local?' · sin internet (guardado en la computadora)':' · servicio en línea')+(Math.log2(K*2*Math.PI*cssScale/256)>nativeLimits[kind]+.5?' · ampliación de imagen; sin detalle adicional':'')});
   tile.addEventListener('error',()=>{if(generation===viewGeneration){if(kind==='satellite'&&z>18&&nativeLimits.satellite>18){nativeLimits.satellite=18;viewGeneration++;tiles.replaceChildren();schedule();return;}if(providers[kind].local){tile.remove();if(!tiles.querySelector('image'))status.textContent='La imagen Satélite 2026 todavía se está preparando en esta computadora.';return;}failed=true;status.textContent='Algunas imágenes no cargaron. Comprueba Internet o elige otro mapa base.'}});
   tile.setAttribute('href',providers[kind].url(z,x,y));tiles.append(tile);
  }
  for(const [key,tile] of existing)if(!needed.has(key))tile.remove();
 }
 function schedule(){clearTimeout(timer);timer=setTimeout(refresh,180)}
 const oldZoom=zoom;zoom=function(f){oldZoom(f);schedule()};
 window.addEventListener('resize',schedule);setMap(current);
 // «Satélite 3 m» aparece solo cuando sus teselas ya están en la computadora (tiles/planet2026/info.json).
 fetch('tiles/planet2026/info.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).then(i=>{if(!i)return;
  const f=(i.fechas||[]).map(d=>d.slice(6,8)+'/'+d.slice(4,6)+'/'+d.slice(0,4));if(f.length)providers.planet.credit='PlanetScope © Planet Labs PBC · 3 m · '+(f.length>1?f[0]+' – '+f[f.length-1]:f[0]);
  const r=menu.querySelector('input[value=planet]');if(!r)return;r.closest('label').hidden=false;
  if(current==='s2026'){r.checked=true;setMap('planet');}}).catch(()=>{});
});
