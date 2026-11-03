/* Herramientas › «Guardar» (agregado por BYNS7, 02-11-2026).
   Única forma de guardar del geovisor. Al pulsarla aparece sobre el mapa un recuadro que se arrastra y se estira por
   las esquinas: solo lo que queda dentro se guarda.
   · Imagen: PDF (hoja formal con marco, escala, norte y leyenda), JPG, PNG, SVG, KMZ (Google Earth) y GeoTIFF (QGIS/ArcGIS).
   · Datos:  Shape (ZIP), KML, GeoJSON, GPX (GPS), CSV (Excel, con WKT) y DXF (AutoCAD, UTM 19 S).
   Los datos son los objetos visibles que tocan el recuadro: capas encendidas, dibujos y análisis, y el calco.
   Reemplaza las tarjetas «Exportar a GPS» y «Descargar mapa (PDF)» y los botones de guardar sueltos. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const mapa = document.querySelector('.map'), scene = document.getElementById('scene');
if (!mapa || !scene) return;
const svgMapa = scene.ownerSVGElement, NS = 'http://www.w3.org/2000/svg';
const K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702, R = 6378137, D2R = Math.PI / 180;
const deEscena = (x, y) => [((x - 500) / K - OX) / D2R, (2 * Math.atan(Math.exp((380 - y) / K - OY)) - Math.PI / 2) / D2R];
const mercX = x => R * ((x - 500) / K - OX), mercY = y => R * ((380 - y) / K - OY);
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const dec = (n, d = 1) => n.toLocaleString('es-BO', { minimumFractionDigits: d, maximumFractionDigits: d });
const hoy = () => new Date().toISOString().slice(0, 10);
const seguro = s => String(s || 'OMASUYOS').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'OMASUYOS';

/* ---------- estilos ---------- */
const css = h('style');
css.textContent = `
.gm-marco{position:absolute;z-index:8;border:2px solid #B79A5B;outline:1px solid #0B1D33;box-shadow:0 0 0 9999px rgba(11,29,51,.32);cursor:move;touch-action:none;background:transparent}
.gm-marco[hidden]{display:none}
.gm-marco .gm-h{position:absolute;width:16px;height:16px;background:#fff;border:2px solid #0B1D33;border-radius:3px;touch-action:none}
.gm-marco .gm-h[data-c=nw]{left:-9px;top:-9px;cursor:nwse-resize}.gm-marco .gm-h[data-c=ne]{right:-9px;top:-9px;cursor:nesw-resize}
.gm-marco .gm-h[data-c=sw]{left:-9px;bottom:-9px;cursor:nesw-resize}.gm-marco .gm-h[data-c=se]{right:-9px;bottom:-9px;cursor:nwse-resize}
.gm-marco .gm-dim{position:absolute;left:50%;top:-26px;transform:translateX(-50%);white-space:nowrap;padding:3px 9px;border-radius:12px;background:#0B1D33;color:#fff;font:700 11px var(--tipo-titulo,system-ui);letter-spacing:.05em;pointer-events:none}
.gm-marco .gm-cruz{position:absolute;left:50%;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;pointer-events:none;opacity:.7}
.gm-panel{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:9;width:min(560px,calc(100% - 24px));background:#fff;border:1px solid #D7DEE8;border-radius:10px;box-shadow:0 14px 40px rgba(11,29,51,.28);font:12px var(--tipo-texto,system-ui);color:#14233A;overflow:hidden}
.gm-panel[hidden]{display:none}
.gm-cab{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#0B1D33;color:#fff;border-bottom:2px solid #B79A5B;font:800 12px var(--tipo-titulo,system-ui);letter-spacing:.08em}
.gm-cab button{margin-left:auto;border:0;background:none;color:#fff;font-size:20px;line-height:1;cursor:pointer}
.gm-fila{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid #E3E8EF}
.gm-fila > b{width:62px;font:800 10.5px var(--tipo-titulo,system-ui);letter-spacing:.08em;color:#5A6B80}
.gm-f{min-width:58px;padding:7px 9px;border:1px solid #12294A;border-radius:7px;background:#fff;color:#12294A;font:800 11px var(--tipo-titulo,system-ui);letter-spacing:.05em;cursor:pointer}
.gm-f:hover{background:#12294A;color:#fff}.gm-f:disabled{opacity:.5;cursor:wait}
.gm-f.img{border-color:#8A6D2F;color:#6B521C}
.gm-f.gm-c{flex:1;background:#12294A;color:#fff;border-color:#12294A;padding:9px}.gm-f.gm-c:hover{background:#B79A5B;border-color:#B79A5B}.gm-f.img:hover{background:#8A6D2F;color:#fff}
.gm-op{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;padding:7px 12px;background:#F6F8FB;font-size:11.5px}
.gm-op input[type=text]{flex:1;min-width:140px;padding:5px 8px;border:1px solid #CDD6E2;border-radius:6px;font:inherit;text-transform:uppercase}
.gm-op select{padding:4px 6px;border:1px solid #CDD6E2;border-radius:6px;font:inherit}
.gm-op button{padding:5px 9px;border:1px solid #CDD6E2;border-radius:6px;background:#fff;font:700 10.5px var(--tipo-titulo,system-ui);cursor:pointer}
.gm-msg{padding:6px 12px 8px;font-size:11px;color:#1E5B3A;min-height:14px}
.gm-msg.mal{color:#9B1C1C}`;
document.head.append(css);

/* ---------- recuadro ---------- */
const marco = h('div', 'gm-marco'); marco.hidden = true;
marco.innerHTML = '<span class="gm-dim"></span><svg class="gm-cruz" viewBox="0 0 18 18"><path d="M9 0v18M0 9h18" stroke="#0B1D33" stroke-width="1.5"/></svg>'
  + ['nw', 'ne', 'sw', 'se'].map(c => `<span class="gm-h" data-c="${c}"></span>`).join('');
mapa.append(marco);
const dim = marco.querySelector('.gm-dim');
let M = null;   // {x, y, w, h} en píxeles dentro del mapa
function ponerMarco() {
  if (!M) return;
  const W = mapa.clientWidth, H = mapa.clientHeight;
  M.w = Math.min(Math.max(M.w, 60), W); M.h = Math.min(Math.max(M.h, 50), H);
  M.x = Math.min(Math.max(M.x, 0), W - M.w); M.y = Math.min(Math.max(M.y, 0), H - M.h);
  Object.assign(marco.style, { left: M.x + 'px', top: M.y + 'px', width: M.w + 'px', height: M.h + 'px' });
  medir();
}
function medir() {
  const r = escenaDelMarco(); if (!r) return;
  const lat = deEscena(r.x + r.w / 2, r.y + r.h / 2)[1], k = R * Math.cos(lat * D2R) / K / 1000;
  dim.textContent = `${dec(r.w * k)} × ${dec(r.h * k)} km`;
}
function marcoInicial() {
  const W = mapa.clientWidth, H = mapa.clientHeight;
  const y = Math.min(H * .45, (panel.offsetHeight || 150) + 46); M = { x: W * .12, y, w: W * .76, h: Math.max(120, H - y - 90) }; ponerMarco();
}
let arr = null;
marco.addEventListener('pointerdown', e => {
  e.stopPropagation(); e.preventDefault();
  arr = { c: e.target.dataset?.c || 'mover', x: e.clientX, y: e.clientY, m: { ...M } };
  marco.setPointerCapture(e.pointerId);
});
marco.addEventListener('pointermove', e => {
  if (!arr) return;
  const dx = e.clientX - arr.x, dy = e.clientY - arr.y, m = arr.m;
  if (arr.c === 'mover') M = { ...m, x: m.x + dx, y: m.y + dy };
  else {
    M = { ...m };
    if (arr.c.includes('w')) { M.x = Math.min(m.x + dx, m.x + m.w - 60); M.w = m.w - (M.x - m.x); }
    if (arr.c.includes('e')) M.w = m.w + dx;
    if (arr.c.includes('n')) { M.y = Math.min(m.y + dy, m.y + m.h - 50); M.h = m.h - (M.y - m.y); }
    if (arr.c.includes('s')) M.h = m.h + dy;
  }
  ponerMarco();
});
const fin = () => { arr = null; };
marco.addEventListener('pointerup', fin); marco.addEventListener('pointercancel', fin);
for (const t of ['click', 'dblclick', 'mousedown', 'touchstart']) marco.addEventListener(t, e => e.stopPropagation());
window.addEventListener('resize', () => { if (!marco.hidden) ponerMarco(); });
// al mover o acercar el mapa cambia lo que cubre el recuadro
if (typeof zoom === 'function') { const zPrev = zoom; zoom = function (...a) { const r = zPrev.apply(this, a); if (!marco.hidden) requestAnimationFrame(medir); return r; }; }
mapa.addEventListener('pointerup', () => { if (!marco.hidden) setTimeout(medir, 200); });

function escenaDelMarco() {
  const m = scene.getScreenCTM(); if (!m) return null;
  const r = marco.getBoundingClientRect(), inv = m.inverse();
  const a = new DOMPoint(r.left, r.top).matrixTransform(inv), b = new DOMPoint(r.right, r.bottom).matrixTransform(inv);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y, r };
}

/* ---------- panel ---------- */
const panel = h('section', 'gm-panel'); panel.hidden = true;
panel.innerHTML = `<div class="gm-cab">GUARDAR<button type="button" class="gm-x" aria-label="Cerrar">×</button></div>
<div class="gm-op"><input type="text" class="gm-nom" maxlength="60" aria-label="Nombre del archivo"><label>RESOLUCIÓN <select class="gm-res"><option value="1">NORMAL</option><option value="2" selected>ALTA</option><option value="3">MUY ALTA</option></select></label><button type="button" class="gm-todo">TODA LA VISTA</button></div>
<div class="gm-fila gm-carta"><b>CARTA</b><button type="button" class="gm-f gm-c" data-f="carta">🗺 CARTA TEMÁTICA (PDF · JPG · PNG)</button></div>
<div class="gm-fila"><b>IMAGEN</b>${[ ['jpg', 'JPG'], ['png', 'PNG'], ['svg', 'SVG'], ['kmz', 'KMZ'], ['tif', 'GEOTIFF']].map(([k, t]) => `<button type="button" class="gm-f img" data-f="${k}">${t}</button>`).join('')}</div>
<div class="gm-fila"><b>DATOS</b>${[['shp', 'SHAPE'], ['kml', 'KML'], ['geojson', 'GEOJSON'], ['gpx', 'GPX'], ['csv', 'CSV'], ['dxf', 'DXF']].map(([k, t]) => `<button type="button" class="gm-f" data-f="${k}">${t}</button>`).join('')}</div>
<div class="gm-msg" role="status"></div>`;
mapa.append(panel);
for (const t of ['pointerdown', 'click', 'wheel', 'dblclick']) panel.addEventListener(t, e => e.stopPropagation());
const $ = s => panel.querySelector(s), msg = $('.gm-msg');
const aviso = (t, mal) => { msg.textContent = t; msg.classList.toggle('mal', !!mal); };
const nombre = () => seguro($('.gm-nom').value.trim() || 'OMASUYOS') + '_' + hoy();
$('.gm-todo').onclick = () => { M = { x: 4, y: 4, w: mapa.clientWidth - 8, h: mapa.clientHeight - 8 }; ponerMarco(); };

let tarj = null;
function abrir(on) {
  marco.hidden = panel.hidden = !on; tarj && tarj.classList.toggle('chosen', on);
  if (on) { if (!$('.gm-nom').value) $('.gm-nom').value = 'OMASUYOS'; if (!M) requestAnimationFrame(marcoInicial); else ponerMarco(); aviso(''); }
}
$('.gm-x').onclick = () => abrir(false);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden && !document.querySelector('#topo-hoja-vista:not([hidden]), .topo-dlg:not([hidden])')) abrir(false); });

/* ---------- utilidades de archivo ---------- */
function bajar(nom, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nom; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = d => { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(archivos) {
  const enc = new TextEncoder(), partes = [], central = []; let off = 0;
  for (const [nom, d0] of archivos) {
    const d = typeof d0 === 'string' ? enc.encode(d0) : d0, n = enc.encode(nom), c = crc32(d);
    const a = new DataView(new ArrayBuffer(30)); a.setUint32(0, 0x04034b50, true); a.setUint16(4, 20, true); a.setUint16(6, 0x0800, true); a.setUint32(14, c, true); a.setUint32(18, d.length, true); a.setUint32(22, d.length, true); a.setUint16(26, n.length, true);
    partes.push(new Uint8Array(a.buffer), n, d);
    const z = new DataView(new ArrayBuffer(46)); z.setUint32(0, 0x02014b50, true); z.setUint16(4, 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true); z.setUint32(16, c, true); z.setUint32(20, d.length, true); z.setUint32(24, d.length, true); z.setUint16(28, n.length, true); z.setUint32(42, off, true);
    central.push(new Uint8Array(z.buffer), n); off += 30 + n.length + d.length;
  }
  const tam = central.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, archivos.length, true); e.setUint16(10, archivos.length, true); e.setUint32(12, tam, true); e.setUint32(16, off, true);
  return new Blob([...partes, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
}

/* =====================================================================
   IMAGEN: copia de la escena recortada al recuadro
   ===================================================================== */
const PROPS = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-family', 'font-size', 'font-weight', 'letter-spacing', 'paint-order', 'vector-effect', 'text-anchor', 'dominant-baseline', 'mix-blend-mode'];
const OMITIR = new Set(['topo-pin', 'cc-indice']);
const aDataURL = blob => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(null); r.readAsDataURL(blob); });
async function incrustar(url) {
  try { const abs = new URL(url, location.href), mismo = abs.origin === location.origin;
    const r = await fetch(abs.href, mismo ? { credentials: 'same-origin' } : { mode: 'cors', credentials: 'omit' }); if (!r.ok) return null; return await aDataURL(await r.blob()); }
  catch (e) { return null; }
}
function conEstilo(vivo) {   // copia con los estilos calculados; lo que no se ve no se copia
  const copia = vivo.cloneNode(true), a = [vivo, ...vivo.querySelectorAll('*')], b = [copia, ...copia.querySelectorAll('*')];
  for (let i = 0; i < a.length; i++) {
    const cs = getComputedStyle(a[i]);
    if (cs.display === 'none' || cs.visibility === 'hidden') { if (i) b[i].remove(); else return null; continue; }
    let st = ''; for (const k of PROPS) { const v = cs.getPropertyValue(k); if (v) st += `${k}:${v};`; }
    b[i].setAttribute('style', st + (b[i].getAttribute('style') || '').replace(/display\s*:\s*[^;]+;?/g, ''));
    b[i].removeAttribute('class');
  }
  copia.removeAttribute('id');
  return copia;
}
async function componer(r, Wpx, Hpx) {
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('xmlns', NS); s.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  s.setAttribute('width', Wpx); s.setAttribute('height', Hpx); s.setAttribute('viewBox', `${r.x} ${r.y} ${r.w} ${r.h}`);
  svgMapa.querySelectorAll(':scope > defs').forEach(d => s.append(d.cloneNode(true)));
  const fondo = document.createElementNS(NS, 'rect'); Object.entries({ x: r.x, y: r.y, width: r.w, height: r.h, fill: '#E9EDF2' }).forEach(([k, v]) => fondo.setAttribute(k, v)); s.append(fondo);
  for (const hijo of scene.children) { if (OMITIR.has(hijo.id)) continue; const c = conEstilo(hijo); if (c) { if (hijo.id === 'topo-cuadricula') c.querySelectorAll('text').forEach(t => t.remove()); s.append(c); } }
  // capas superpuestas en píxeles de pantalla (calco de planeamiento)
  mapa.querySelectorAll(':scope > svg').forEach(o => {
    if (o === svgMapa || !o.childElementCount || o.closest('.gm-marco')) return;
    const cs = getComputedStyle(o); if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const r2 = o.getBoundingClientRect(); if (!r2.width) return;
    const kx = r.w / r.r.width, ky = r.h / r.r.height;
    const n = document.createElementNS(NS, 'svg');
    Object.entries({ x: r.x + (r2.left - r.r.left) * kx, y: r.y + (r2.top - r.r.top) * ky, width: r2.width * kx, height: r2.height * ky, viewBox: `0 0 ${r2.width} ${r2.height}`, preserveAspectRatio: 'none', overflow: 'visible' }).forEach(([k, v]) => n.setAttribute(k, v));
    for (const c of o.children) { const x = conEstilo(c); if (x) n.append(x); }
    s.append(n);
  });
  // imágenes (teselas, rásteres de análisis) incrustadas
  const imgs = [...s.querySelectorAll('image')], cache = new Map(); let fallas = 0;
  await Promise.all(imgs.map(async im => {
    const u = im.getAttribute('href') || im.getAttributeNS('http://www.w3.org/1999/xlink', 'href'); if (!u || u.startsWith('data:')) return;
    if (!cache.has(u)) cache.set(u, incrustar(u));
    const d = await cache.get(u); if (d) { im.setAttribute('href', d); im.removeAttributeNS('http://www.w3.org/1999/xlink', 'href'); } else { im.remove(); fallas++; }
  }));
  return { s, fallas };
}
async function lienzo(r, Wpx, Hpx) {
  const { s, fallas } = await componer(r, Wpx, Hpx);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(s)], { type: 'image/svg+xml' }));
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
  const cv = document.createElement('canvas'); cv.width = Wpx; cv.height = Hpx; const c = cv.getContext('2d');
  c.fillStyle = '#fff'; c.fillRect(0, 0, Wpx, Hpx); c.drawImage(img, 0, 0, Wpx, Hpx); URL.revokeObjectURL(url);
  return { cv, fallas, s };
}
const aBlob = (cv, tipo, q) => new Promise(res => cv.toBlob(res, tipo, q));
function geotiff(cv, r) {   // GeoTIFF RGB sin compresión, EPSG:3857 (Web Mercator)
  const W = cv.width, H = cv.height, px = cv.getContext('2d').getImageData(0, 0, W, H).data, n = W * H, rgb = new Uint8Array(n * 3);
  for (let i = 0, j = 0; i < n; i++, j += 4) { rgb[i * 3] = px[j]; rgb[i * 3 + 1] = px[j + 1]; rgb[i * 3 + 2] = px[j + 2]; }
  const x0 = mercX(r.x), y0 = mercY(r.y), sx = (mercX(r.x + r.w) - x0) / W, sy = (y0 - mercY(r.y + r.h)) / H;
  const claves = [1, 1, 0, 3, 1024, 0, 1, 1, 1025, 0, 1, 1, 3072, 0, 1, 3857];
  const E = [[256, 4, 1, W], [257, 4, 1, H], [258, 3, 3, 'bits'], [259, 3, 1, 1], [262, 3, 1, 2], [273, 4, 1, 'img'], [277, 3, 1, 3], [278, 4, 1, H], [279, 4, 1, rgb.length], [284, 3, 1, 1], [33550, 12, 3, 'esc'], [33922, 12, 6, 'tie'], [34735, 3, claves.length, 'geo']];
  const ifd = 8, extra = ifd + 2 + 12 * E.length + 4;
  const off = { bits: extra, esc: extra + 8, tie: extra + 8 + 24, geo: extra + 8 + 24 + 48 }; off.img = off.geo + claves.length * 2 + (claves.length % 2 ? 2 : 0);
  const buf = new ArrayBuffer(off.img + rgb.length), v = new DataView(buf);
  v.setUint16(0, 0x4949); v.setUint16(2, 42, true); v.setUint32(4, ifd, true); v.setUint16(ifd, E.length, true);
  E.forEach(([tag, tipo, cnt, val], i) => { const o = ifd + 2 + 12 * i; v.setUint16(o, tag, true); v.setUint16(o + 2, tipo, true); v.setUint32(o + 4, cnt, true);
    if (typeof val === 'string') v.setUint32(o + 8, off[val], true); else if (tipo === 3) v.setUint16(o + 8, val, true); else v.setUint32(o + 8, val, true); });
  v.setUint32(ifd + 2 + 12 * E.length, 0, true);
  [8, 8, 8].forEach((b, i) => v.setUint16(off.bits + 2 * i, b, true));
  [sx, sy, 0].forEach((d, i) => v.setFloat64(off.esc + 8 * i, d, true));
  [0, 0, 0, x0, y0, 0].forEach((d, i) => v.setFloat64(off.tie + 8 * i, d, true));
  claves.forEach((k, i) => v.setUint16(off.geo + 2 * i, k, true));
  new Uint8Array(buf, off.img).set(rgb);
  return new Blob([buf], { type: 'image/tiff' });
}
async function guardarImagen(f) {
  const r = escenaDelMarco(); if (!r) return;
  if (f === 'pdf') { if (window.EMTE_TOPO?.pdf) { window.EMTE_TOPO.pdf(marco); aviso('Completa el rótulo y pulsa VISTA PREVIA → DESCARGAR PDF.'); } else aviso('El PDF no está disponible.', true); return; }
  const k = +$('.gm-res').value || 2, esc = Math.min(k, 6000 / Math.max(r.r.width, r.r.height));
  const Wpx = Math.round(r.r.width * esc), Hpx = Math.round(r.r.height * esc), nom = nombre();
  aviso('Preparando la imagen…');
  if (f === 'svg') {
    const { s, fallas } = await componer(r, Wpx, Hpx);
    bajar(nom + '.svg', new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(s)], { type: 'image/svg+xml' }));
    return aviso(`✔ ${nom}.svg (${Wpx} × ${Hpx} px)` + (fallas ? ` · sin ${fallas} tesela(s) del mapa base` : ''));
  }
  const { cv, fallas } = await lienzo(r, Wpx, Hpx), nota = fallas ? ` · sin ${fallas} tesela(s) del mapa base` : '';
  if (f === 'jpg' || f === 'png') { bajar(nom + '.' + f, await aBlob(cv, f === 'jpg' ? 'image/jpeg' : 'image/png', .92)); return aviso(`✔ ${nom}.${f} (${Wpx} × ${Hpx} px)${nota}`); }
  if (f === 'tif') { bajar(nom + '.tif', geotiff(cv, r)); return aviso(`✔ ${nom}.tif · GeoTIFF EPSG:3857 (${Wpx} × ${Hpx} px)${nota}`); }
  if (f === 'kmz') {
    const [oe, no] = deEscena(r.x, r.y), [es, su] = deEscena(r.x + r.w, r.y + r.h);
    const jpg = new Uint8Array(await (await aBlob(cv, 'image/jpeg', .9)).arrayBuffer());
    const kml = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${nom}</name><GroundOverlay><name>${nom}</name><description>Geovisor Omasuyos · EMTE · ${hoy()}</description><Icon><href>mapa.jpg</href></Icon><LatLonBox><north>${no.toFixed(7)}</north><south>${su.toFixed(7)}</south><east>${es.toFixed(7)}</east><west>${oe.toFixed(7)}</west></LatLonBox></GroundOverlay></Document></kml>\n`;
    bajar(nom + '.kmz', zip([['doc.kml', kml], ['mapa.jpg', jpg]])); return aviso(`✔ ${nom}.kmz · se abre en Google Earth${nota}`);
  }
}

/* =====================================================================
   DATOS: objetos visibles que tocan el recuadro
   ===================================================================== */
const visible = e => { try { return e.checkVisibility ? e.checkVisibility({ visibilityProperty: true, opacityProperty: true }) : getComputedStyle(e).display !== 'none'; } catch (_) { return true; } };
const NOMBRES = { 'topo-apoyo': 'Apoyo al planeamiento', 'topo-municipios': 'Municipios', 'topo-municipios-nombres': 'Municipios (nombres)', 'topo-capitales': 'Capitales municipales', 'topo-limites-legales': 'Límites legales', 'topo-area-visible': 'Área visible', route: 'Ruta calculada', measurement: 'Mediciones', 'vias-rutas': 'Rutas nacionales', 'mancha-urbana': 'Mancha urbana', 'hp-aa': 'Avenidas de aproximación', 'hp-cub': 'Cubierta y encubrimiento', 'hp-pts': 'Puntos de planeamiento', 'topo-cuadricula': 'Cuadrícula UTM' };
const RICOS = { health: 'Establecimientos de salud', education: 'Centros educativos', roads: 'Vías y caminos', rivers: 'Ríos y quebradas', water: 'Cuerpos de agua' };
const SALTAR = new Set(['basemap', 'roads-casing', 'roads-top', 'bounds', 'topo-pin', 'cc-indice', ...Object.keys(RICOS)]);
const texto = v => v == null ? '' : String(v);
function propsDe(p) { const o = {}; for (const k in p) { const v = p[k]; if (v == null || typeof v === 'object') continue; o[k] = v; } return o; }
function geomPartes(g) {   // GeoJSON → lista de {type, coords}
  if (!g) return [];
  if (g.type === 'Point') return [{ type: 'Point', coords: g.coordinates }];
  if (g.type === 'MultiPoint') return g.coordinates.map(c => ({ type: 'Point', coords: c }));
  if (g.type === 'LineString') return [{ type: 'LineString', coords: g.coordinates }];
  if (g.type === 'MultiLineString') return g.coordinates.map(c => ({ type: 'LineString', coords: c }));
  if (g.type === 'Polygon') return [{ type: 'Polygon', coords: g.coordinates[0] }];
  if (g.type === 'MultiPolygon') return g.coordinates.map(p => ({ type: 'Polygon', coords: p[0] }));
  return [];
}
function datosRicos(caja) {
  const out = [], fuentes = { health: () => window.healthFeatures || (typeof healthFeatures !== 'undefined' ? healthFeatures : []), education: () => typeof educationFeatures !== 'undefined' ? educationFeatures : [],
    roads: () => typeof roadFeatures !== 'undefined' ? roadFeatures : [], rivers: () => typeof riverFeatures !== 'undefined' ? riverFeatures : [], water: () => typeof waterFeatures !== 'undefined' ? waterFeatures : [] };
  for (const id in RICOS) {
    const g = document.getElementById(id); if (!g || !g.childElementCount || !visible(g)) continue;
    let fs = []; try { fs = fuentes[id]() || []; } catch (e) {}
    for (const f of fs) {
      const p = f.properties || {}, base = propsDe(p);
      const nom = texto(p.nombre || p.name || p.tipo_via || p.tipo || ''), info = [p.categoria, p.tipo, p.municipio, p.superficie, p.estado].filter(Boolean).join(' · ');
      for (const g2 of geomPartes(f.geometry)) if (toca(g2, caja)) out.push({ capa: RICOS[id], nombre: nom, info, tipo: g2.type, coords: g2.coords, extra: base });
    }
  }
  return out;
}
function toca(g, c) {
  if (g.type === 'Point') return g.coords[0] >= c.w && g.coords[0] <= c.e && g.coords[1] >= c.s && g.coords[1] <= c.n;
  let a = 1 / 0, b = 1 / 0, d = -1 / 0, e = -1 / 0;
  for (const p of g.coords) { a = Math.min(a, p[0]); b = Math.min(b, p[1]); d = Math.max(d, p[0]); e = Math.max(e, p[1]); }
  return !(d < c.w || a > c.e || e < c.s || b > c.n);
}
// lectura de geometrías SVG (para dibujos, análisis y capas sin datos propios)
function trazos(d) {
  const t = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) || [], partes = []; let i = 0, cmd = '', x = 0, y = 0, sx = 0, sy = 0, act = null;
  const num = () => +t[i++], nuevo = () => { act = { pts: [[x, y]], z: false }; partes.push(act); }, add = () => { if (!act) nuevo(); else act.pts.push([x, y]); };
  while (i < t.length) {
    if (/[A-Za-z]/.test(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    if (C === 'Z') { if (act) { act.z = true; x = sx; y = sy; } act = null; continue; }
    if (i >= t.length || /[A-Za-z]/.test(t[i])) { if (C !== 'Z') i++; continue; }
    if (C === 'M') { const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; sx = x; sy = y; nuevo(); cmd = rel ? 'l' : 'L'; }
    else if (C === 'L' || C === 'T') { const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; add(); }
    else if (C === 'H') { const a = num(); x = rel ? x + a : a; add(); }
    else if (C === 'V') { const a = num(); y = rel ? y + a : a; add(); }
    else if (C === 'C') { i += 4; const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; add(); }
    else if (C === 'S' || C === 'Q') { i += 2; const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; add(); }
    else if (C === 'A') { i += 5; const a = num(), b = num(); x = rel ? x + a : a; y = rel ? y + b : b; add(); }
    else i++;
  }
  return partes;
}
function datosSVG(caja, lim) {
  const out = [], inv = scene.getScreenCTM().inverse();
  const aGeo = (el, pts) => { const m = el.getScreenCTM(); if (!m) return []; return pts.map(([x, y]) => { const p = new DOMPoint(x, y).matrixTransform(m).matrixTransform(inv); return deEscena(p.x, p.y).map(v => +v.toFixed(7)); }); };
  const nomDe = el => texto(el.dataset?.nombre || el.getAttribute('aria-label') || el.querySelector(':scope > title')?.textContent || '').trim();
  const infoDe = el => texto(el.dataset?.info || el.dataset?.desc || '').trim();
  const poner = (capa, el, tipo, coords, nom) => { if (out.length >= lim) return; const g = { type: tipo, coords: tipo === 'Point' ? coords[0] : coords }; if (!coords.length || !toca(g, caja)) return; out.push({ capa, nombre: nom ?? nomDe(el), info: infoDe(el), tipo, coords: g.coords }); };
  function recorrer(el, capa) {
    if (out.length >= lim || !(el instanceof SVGElement) || !visible(el)) return;
    const tag = el.tagName.toLowerCase();
    if (['defs', 'clippath', 'mask', 'pattern', 'title', 'style', 'image', 'lineargradient', 'radialgradient', 'filter', 'symbol', 'marker'].includes(tag)) return;
    if (tag === 'g' || tag === 'svg' || tag === 'a') {
      if (el.id && NOMBRES[el.id]) capa = NOMBRES[el.id];
      const b = el.getBoundingClientRect();
      if (el !== this && el.childElementCount && b.width && b.width < 36 && b.height < 36) {   // símbolo / marcador → un punto
        const c = new DOMPoint(b.left + b.width / 2, b.top + b.height / 2).matrixTransform(inv);
        return poner(capa, el, 'Point', [deEscena(c.x, c.y).map(v => +v.toFixed(7))], nomDe(el) || texto(el.textContent).trim().slice(0, 80));
      }
      for (const c of el.children) recorrer.call(this, c, capa);
      return;
    }
    const b = el.getBoundingClientRect(), chico = b.width < 6 && b.height < 6;
    if (tag === 'text') return poner(capa, el, 'Point', aGeo(el, [[+el.getAttribute('x') || 0, +el.getAttribute('y') || 0]]), texto(el.textContent).trim().slice(0, 100));
    if (tag === 'use') return poner(capa, el, 'Point', aGeo(el, [[+el.getAttribute('x') || 0, +el.getAttribute('y') || 0]]));
    if (tag === 'circle' || tag === 'ellipse') {
      const cx = +el.getAttribute('cx') || 0, cy = +el.getAttribute('cy') || 0, rx = +(el.getAttribute('r') || el.getAttribute('rx')) || 0, ry = +(el.getAttribute('r') || el.getAttribute('ry')) || 0;
      if (b.width < 24) return poner(capa, el, 'Point', aGeo(el, [[cx, cy]]));
      const pts = []; for (let k = 0; k <= 64; k++) { const a = k / 64 * 2 * Math.PI; pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); }
      return poner(capa, el, 'Polygon', aGeo(el, pts));
    }
    if (tag === 'rect') {
      const x = +el.getAttribute('x') || 0, y = +el.getAttribute('y') || 0, w = +el.getAttribute('width') || 0, hh = +el.getAttribute('height') || 0;
      if (b.width < 24 && b.height < 24) return poner(capa, el, 'Point', aGeo(el, [[x + w / 2, y + hh / 2]]));
      return poner(capa, el, 'Polygon', aGeo(el, [[x, y], [x + w, y], [x + w, y + hh], [x, y + hh], [x, y]]));
    }
    if (tag === 'line') return poner(capa, el, 'LineString', aGeo(el, [[+el.getAttribute('x1'), +el.getAttribute('y1')], [+el.getAttribute('x2'), +el.getAttribute('y2')]]));
    let partes = [];
    if (tag === 'path') partes = trazos(el.getAttribute('d') || '');
    else if (tag === 'polyline' || tag === 'polygon') { const n = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number), pts = []; for (let k = 0; k + 1 < n.length; k += 2) pts.push([n[k], n[k + 1]]); partes = [{ pts, z: tag === 'polygon' }]; }
    const relleno = (getComputedStyle(el).fill || 'none') !== 'none' && !/rgba\(.*,\s*0\)$/.test(getComputedStyle(el).fill);
    for (const p of partes) {
      if (p.pts.length < 2) continue;
      if (chico) { poner(capa, el, 'Point', aGeo(el, [p.pts[0]])); break; }
      const g = aGeo(el, p.pts);
      if ((p.z || relleno) && g.length >= 3) { const c = g.slice(); if (c[0][0] !== c[c.length - 1][0] || c[0][1] !== c[c.length - 1][1]) c.push(c[0]); poner(capa, el, 'Polygon', c); }
      else poner(capa, el, 'LineString', g);
    }
  }
  for (const hijo of scene.children) {
    if (SALTAR.has(hijo.id) || !visible(hijo)) continue;
    if (hijo.id === 'topo-hp') { for (const sg of hijo.children) recorrer.call(sg, sg, NOMBRES[sg.id] || 'Planeamiento'); continue; }
    recorrer.call(hijo, hijo, NOMBRES[hijo.id] || (hijo.id ? (t => t.charAt(0).toUpperCase() + t.slice(1))(hijo.id.replace(/^topo-/, '').replace(/[-_]/g, ' ')) : 'Capa del mapa'));
  }
  return out;
}
function datosCalco(caja) {
  const out = []; if (!document.querySelector('.calco-menu') || document.getElementById('calco-ver')?.checked === false) return out;
  let S = []; try { S = JSON.parse(localStorage.getItem('planeamiento-calco-geovisor') || '[]'); } catch (e) {}
  const ll = (x, y) => [+(x / R / D2R).toFixed(7), +((2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) / D2R).toFixed(7)];
  for (const [, o] of S) {
    if (!o) continue;
    const nom = [o.key || o.tipo, o.izq, o.der, o.cen, o.et].filter(Boolean).join(' · '), info = [o.bando, o.esc, o.fh].filter(Boolean).join(' · ');
    let g;
    if (!o.k) g = { type: 'Point', coords: ll(o.x, o.y) };
    else { const P = []; for (let i = 0; i + 1 < o.p.length; i += 2) P.push(ll(o.p[i], o.p[i + 1])); if (P.length < 2) continue; g = o.k === 'z' ? { type: 'Polygon', coords: P.concat([P[0]]) } : { type: 'LineString', coords: P }; }
    if (toca(g, caja)) out.push({ capa: o.k === 'z' ? 'Calco · zonas' : o.k ? 'Calco · líneas' : 'Calco · símbolos', nombre: nom, info, tipo: g.type, coords: g.coords });
  }
  return out;
}
function recoger() {
  const r = escenaDelMarco(); if (!r) return null;
  const [w, n] = deEscena(r.x, r.y), [e, s] = deEscena(r.x + r.w, r.y + r.h), caja = { w, e, s, n };
  const F = [...datosRicos(caja), ...datosSVG(caja, 40000), ...datosCalco(caja)];
  return { F, caja };
}

/* ---------- escritores ---------- */
const xml = s => String(s ?? '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
const f7 = v => (+v).toFixed(7);
function aGeoJSON(F, nom) {
  return JSON.stringify({ type: 'FeatureCollection', name: nom, crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
    features: F.map(f => ({ type: 'Feature', geometry: { type: f.tipo, coordinates: f.tipo === 'Polygon' ? [f.coords] : f.coords }, properties: Object.assign({ capa: f.capa, nombre: f.nombre, info: f.info }, f.extra || {}) })) });
}
function aKML(F, nom) {
  const grupos = new Map(); F.forEach(f => { if (!grupos.has(f.capa)) grupos.set(f.capa, []); grupos.get(f.capa).push(f); });
  const cc = c => c.map(p => f7(p[0]) + ',' + f7(p[1])).join(' ');
  let s = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>${xml(nom)}</name><description>Geovisor Omasuyos · EMTE · WGS 84 · ${hoy()}</description>
<Style id="l"><LineStyle><color>ff2251c6</color><width>2.5</width></LineStyle></Style><Style id="z"><LineStyle><color>ff2251c6</color><width>2</width></LineStyle><PolyStyle><color>402251c6</color></PolyStyle></Style>\n`;
  for (const [g, fs] of grupos) {
    s += `<Folder><name>${xml(g)}</name>\n`;
    for (const f of fs) {
      const geo = f.tipo === 'Point' ? `<Point><coordinates>${f7(f.coords[0])},${f7(f.coords[1])}</coordinates></Point>` : f.tipo === 'LineString' ? `<styleUrl>#l</styleUrl><LineString><tessellate>1</tessellate><coordinates>${cc(f.coords)}</coordinates></LineString>` : `<styleUrl>#z</styleUrl><Polygon><outerBoundaryIs><LinearRing><coordinates>${cc(f.coords)}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
      s += `<Placemark><name>${xml(f.nombre)}</name>${f.info ? `<description>${xml(f.info)}</description>` : ''}${geo}</Placemark>\n`;
    }
    s += '</Folder>\n';
  }
  return s + '</Document></kml>\n';
}
function aGPX(F, nom) {
  let s = `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="Geovisor Omasuyos - EMTE" xmlns="http://www.topografix.com/GPX/1/1">\n<metadata><name>${xml(nom)}</name><time>${new Date().toISOString()}</time></metadata>\n`;
  F.filter(f => f.tipo === 'Point').forEach(f => { s += `<wpt lat="${f7(f.coords[1])}" lon="${f7(f.coords[0])}"><name>${xml(f.nombre || f.capa)}</name>${f.info ? `<desc>${xml(f.info)}</desc>` : ''}<type>${xml(f.capa)}</type></wpt>\n`; });
  F.filter(f => f.tipo !== 'Point').forEach(f => { s += `<trk><name>${xml(f.nombre || f.capa)}</name><type>${xml(f.capa)}</type><trkseg>${f.coords.map(p => `<trkpt lat="${f7(p[1])}" lon="${f7(p[0])}"/>`).join('')}</trkseg></trk>\n`; });
  return s + '</gpx>\n';
}
const utm = (lon, lat) => window.EMTE_TOPO ? window.EMTE_TOPO.aUTM(lat, lon, 19) : [0, 0, 19, true];
function aCSV(F) {
  const q = v => { const t = String(v ?? ''); return /[";\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
  const wkt = f => f.tipo === 'Point' ? `POINT (${f7(f.coords[0])} ${f7(f.coords[1])})` : f.tipo === 'LineString' ? `LINESTRING (${f.coords.map(p => f7(p[0]) + ' ' + f7(p[1])).join(', ')})` : `POLYGON ((${f.coords.map(p => f7(p[0]) + ' ' + f7(p[1])).join(', ')}))`;
  const filas = [['capa', 'nombre', 'info', 'geometria', 'latitud', 'longitud', 'utm_este', 'utm_norte', 'zona', 'wkt'].join(';')];
  F.forEach(f => {
    const p = f.tipo === 'Point' ? f.coords : f.coords[Math.floor(f.coords.length / 2)], [E, N] = utm(p[0], p[1]);
    filas.push([f.capa, f.nombre, f.info, f.tipo === 'Point' ? 'punto' : f.tipo === 'LineString' ? 'línea' : 'polígono', f7(p[1]), f7(p[0]), E.toFixed(1), N.toFixed(1), '19S', wkt(f)].map(q).join(';'));
  });
  return '﻿' + filas.join('\r\n') + '\r\n';
}
function aDXF(F) {   // DXF R12 en UTM zona 19 Sur (metros)
  const asc = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, '');
  const capa = s => asc(s).toUpperCase().replace(/[^A-Z0-9_-]+/g, '_').slice(0, 31) || 'GEOVISOR';
  const capas = [...new Set(F.map(f => capa(f.capa)))];
  const L = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '9', '$INSUNITS', '70', '6', '0', 'ENDSEC', '0', 'SECTION', '2', 'TABLES', '0', 'TABLE', '2', 'LAYER', '70', String(capas.length)];
  capas.forEach((c, i) => L.push('0', 'LAYER', '2', c, '70', '0', '62', String(1 + (i % 7)), '6', 'CONTINUOUS'));
  L.push('0', 'ENDTAB', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES');
  F.forEach(f => {
    const c = capa(f.capa);
    if (f.tipo === 'Point') {
      const [E, N] = utm(f.coords[0], f.coords[1]);
      L.push('0', 'POINT', '8', c, '10', E.toFixed(2), '20', N.toFixed(2), '30', '0');
      if (f.nombre) L.push('0', 'TEXT', '8', c, '10', (E + 15).toFixed(2), '20', (N + 15).toFixed(2), '30', '0', '40', '40', '1', asc(f.nombre).slice(0, 120));
    } else {
      L.push('0', 'POLYLINE', '8', c, '66', '1', '70', f.tipo === 'Polygon' ? '1' : '0');
      const pts = f.tipo === 'Polygon' ? f.coords.slice(0, -1) : f.coords;
      pts.forEach(p => { const [E, N] = utm(p[0], p[1]); L.push('0', 'VERTEX', '8', c, '10', E.toFixed(2), '20', N.toFixed(2), '30', '0'); });
      L.push('0', 'SEQEND', '8', c);
    }
  });
  L.push('0', 'ENDSEC', '0', 'EOF');
  return L.join('\r\n') + '\r\n';
}
const PRJ4326 = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';
function shapefile(filas, tipo) {   // tipo 1 punto, 3 línea, 5 polígono · filas: {g:[x,y,…], capa, nombre, info}
  const n = filas.length, enc = new TextEncoder(), F = [['capa', 'C', 60], ['nombre', 'C', 120], ['info', 'C', 200]];
  const geo = filas.map(r => {
    let p = r.g.slice(); if (tipo !== 5) return p;
    if (p.length >= 4 && p[0] === p[p.length - 2] && p[1] === p[p.length - 1]) p = p.slice(0, -2);
    let a = 0; for (let i = 0; i < p.length; i += 2) { const j = (i + 2) % p.length; a += p[i] * p[j + 1] - p[j] * p[i + 1]; }
    if (a > 0) { const q = []; for (let i = p.length - 2; i >= 0; i -= 2) q.push(p[i], p[i + 1]); p = q; }
    p.push(p[0], p[1]); return p;
  });
  const tam = g => tipo === 1 ? 28 : 8 + 48 + 8 * g.length;
  const caja = g => { const b = [1 / 0, 1 / 0, -1 / 0, -1 / 0]; for (let i = 0; i < g.length; i += 2) { b[0] = Math.min(b[0], g[i]); b[1] = Math.min(b[1], g[i + 1]); b[2] = Math.max(b[2], g[i]); b[3] = Math.max(b[3], g[i + 1]); } return b; };
  const bb = caja(geo.flat()), total = 100 + geo.reduce((a, g) => a + tam(g), 0);
  const cab = len => { const b = new ArrayBuffer(100), v = new DataView(b); v.setInt32(0, 9994); v.setInt32(24, len / 2); v.setInt32(28, 1000, true); v.setInt32(32, tipo, true); bb.forEach((x, i) => v.setFloat64(36 + i * 8, x, true)); return new Uint8Array(b); };
  const shp = new Uint8Array(total), shx = new Uint8Array(100 + 8 * n), dv = new DataView(shp.buffer), xv = new DataView(shx.buffer);
  shp.set(cab(total)); shx.set(cab(shx.length)); let o = 100;
  geo.forEach((g, i) => {
    const len = tam(g) - 8; dv.setInt32(o, i + 1); dv.setInt32(o + 4, len / 2); xv.setInt32(100 + 8 * i, o / 2); xv.setInt32(104 + 8 * i, len / 2); dv.setInt32(o + 8, tipo, true);
    if (tipo === 1) { dv.setFloat64(o + 12, g[0], true); dv.setFloat64(o + 20, g[1], true); }
    else { caja(g).forEach((x, k) => dv.setFloat64(o + 12 + k * 8, x, true)); dv.setInt32(o + 44, 1, true); dv.setInt32(o + 48, g.length / 2, true); dv.setInt32(o + 52, 0, true); g.forEach((x, k) => dv.setFloat64(o + 56 + k * 8, x, true)); }
    o += len + 8;
  });
  const rl = 1 + F.reduce((a, f) => a + f[2], 0), hl = 32 + 32 * F.length + 1, dbf = new Uint8Array(hl + rl * n + 1), bv = new DataView(dbf.buffer), d = new Date();
  dbf[0] = 3; dbf[1] = d.getFullYear() - 1900; dbf[2] = d.getMonth() + 1; dbf[3] = d.getDate(); bv.setUint32(4, n, true); bv.setUint16(8, hl, true); bv.setUint16(10, rl, true);
  F.forEach((f, i) => { const q = 32 + 32 * i; dbf.set(enc.encode(f[0]), q); dbf[q + 11] = f[1].charCodeAt(0); dbf[q + 16] = f[2]; }); dbf[hl - 1] = 13;
  filas.forEach((r, i) => {
    let q = hl + rl * i; dbf[q++] = 32;
    F.forEach(f => { let t = String(r[f[0]] ?? ''), b = enc.encode(t); while (b.length > f[2]) { t = t.slice(0, -1); b = enc.encode(t); } dbf.fill(32, q, q + f[2]); dbf.set(b, q); q += f[2]; });
  });
  dbf[dbf.length - 1] = 26; return { shp, shx, dbf };
}
function aShape(F, nom) {
  const archivos = [];
  [['puntos', 'Point', 1], ['lineas', 'LineString', 3], ['poligonos', 'Polygon', 5]].forEach(([suf, t, tipo]) => {
    const filas = F.filter(f => f.tipo === t).map(f => ({ g: t === 'Point' ? [f.coords[0], f.coords[1]] : f.coords.flat(), capa: f.capa, nombre: f.nombre, info: f.info }));
    if (!filas.length) return;
    const s = shapefile(filas, tipo), b = nom + '_' + suf;
    archivos.push([b + '.shp', s.shp], [b + '.shx', s.shx], [b + '.dbf', s.dbf], [b + '.prj', PRJ4326], [b + '.cpg', 'UTF-8']);
  });
  return zip(archivos);
}
function guardarDatos(f) {
  aviso('Reuniendo los objetos del recuadro…');
  const d = recoger(); if (!d) return;
  const F = d.F.filter(x => x.coords && (x.tipo === 'Point' ? isFinite(x.coords[0]) : x.coords.length >= 2));
  if (!F.length) return aviso('No hay objetos visibles dentro del recuadro. Enciende capas o muévelo.', true);
  const nom = nombre(), capas = new Set(F.map(x => x.capa)).size;
  if (f === 'geojson') bajar(nom + '.geojson', new Blob([aGeoJSON(F, nom)], { type: 'application/geo+json' }));
  else if (f === 'kml') bajar(nom + '.kml', new Blob([aKML(F, nom)], { type: 'application/vnd.google-earth.kml+xml' }));
  else if (f === 'gpx') bajar(nom + '.gpx', new Blob([aGPX(F, nom)], { type: 'application/gpx+xml' }));
  else if (f === 'csv') bajar(nom + '.csv', new Blob([aCSV(F)], { type: 'text/csv;charset=utf-8' }));
  else if (f === 'dxf') bajar(nom + '.dxf', new Blob([aDXF(F)], { type: 'application/dxf' }));
  else if (f === 'shp') bajar(nom + '_shape.zip', aShape(F, nom));
  const ext = { shp: '_shape.zip', geojson: '.geojson', kml: '.kml', gpx: '.gpx', csv: '.csv', dxf: '.dxf' }[f];
  aviso(`✔ ${nom}${ext} · ${F.length.toLocaleString('es-BO')} objetos de ${capas} capa(s)` + (f === 'dxf' ? ' · UTM 19 S' : ' · WGS 84'));
}
panel.querySelectorAll('.gm-f').forEach(b => b.onclick = async () => {
  const f = b.dataset.f; panel.querySelectorAll('.gm-f').forEach(x => x.disabled = true);
  try { if (f === 'carta') { if (window.EMTE_CARTA) window.EMTE_CARTA.abrir(); else aviso('La carta temática no está disponible.', true); } else if (b.classList.contains('img')) await guardarImagen(f); else guardarDatos(f); }
  catch (e) { console.error(e); aviso('No se pudo guardar. Vuelve a intentarlo o achica el recuadro.', true); }
  finally { panel.querySelectorAll('.gm-f').forEach(x => x.disabled = false); }
});

/* ---------- tarjeta en Herramientas; se quitan las otras formas de guardar ---------- */
const ICONO = '<span class="tool-picture"><svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="64" height="64" rx="12" fill="#edf1e8"/><path d="M14 10h30l8 8v36H14z" fill="#12294A"/><rect x="20" y="10" width="20" height="13" fill="#B79A5B"/><rect x="20" y="33" width="26" height="17" rx="1" fill="#fff"/><path d="M24 39h18M24 44h12" stroke="#12294A" stroke-width="2"/><rect x="34" y="12" width="4" height="9" fill="#12294A"/></svg></span>';
const QUITAR = /Exportar a GPS|Descargar mapa \(PDF\)|Exportar ruta a GPS|Descargar cronograma/i;
function ordenar() {
  document.querySelectorAll('.visual-card, main > aside button, .map button').forEach(b => { if (b !== tarj && QUITAR.test(b.textContent || '')) { if (b.classList.contains('chosen')) b.click(); b.remove(); } });
  const grilla = document.querySelector('main > aside .visual-tools-grid');
  if (grilla && !tarj) {
    tarj = h('button', 'visual-card'); tarj.type = 'button'; tarj.innerHTML = ICONO + '<span>💾 Guardar</span>';
    tarj.title = 'Guardar una parte del mapa: PDF, JPG, PNG, SVG, KMZ, GeoTIFF, Shape, KML, GeoJSON, GPX, CSV o DXF';
    tarj.onclick = () => abrir(panel.hidden);
    grilla.prepend(tarj);
  }
}
ordenar();
let n = 0; (function esperar() { ordenar(); if (++n < 40) setTimeout(esperar, 250); })();
let pend = false;
new MutationObserver(() => { if (pend) return; pend = true; setTimeout(() => { pend = false; ordenar(); }, 300); }).observe(document.querySelector('main > aside') || document.body, { childList: true, subtree: true });
async function imagenMarco(ancho) {   // para la hoja PDF de herramientas-topo.js
  const r = escenaDelMarco(), Wpx = Math.round(ancho), Hpx = Math.round(ancho * r.r.height / r.r.width);
  const { cv } = await lienzo(r, Wpx, Hpx); return cv.toDataURL('image/jpeg', .92);
}
function aspecto(a) {   // cambia la forma del recuadro (ancho / alto) sin mover su centro
  if (!M) return; const W = mapa.clientWidth - 8, H = mapa.clientHeight - 8, cx = M.x + M.w / 2, cy = M.y + M.h / 2;
  let w = Math.sqrt(M.w * M.h * a), hh = w / a; const k = Math.min(1, W / w, H / hh); w *= k; hh *= k;
  M = { x: cx - w / 2, y: cy - hh / 2, w, h: hh }; ponerMarco();
}
window.EMTE_GUARDAR = { abrir, recoger, escenaDelMarco, imagenMarco, aspecto };
});
