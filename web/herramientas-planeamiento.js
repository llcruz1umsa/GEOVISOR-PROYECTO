/* Herramientas de planeamiento (agregado por BYNS7, 30-10-2026). Pestaña PLANEAMIENTO, cada una en su cuadro:
   1 Avenidas de aproximación (3 rutas evaluadas y categorizadas sobre el COC)   2 Calco de situación modificado
   3 Campos de tiro   4 Cubierta y encubrimiento   5 Luz y clima   6 Cálculo de marchas
   7 Línea de tiempo (1/3 – 2/3)   8 Áreas de interés y matriz de eventos   9 Orden de operaciones
   Todo se calcula en el navegador, sin internet, con los datos del geovisor (COC, terreno clave, MDT, vías,
   Sentinel-2 2026). Los valores de referencia (velocidades, anchos, alcances) se pueden cambiar en cada herramienta. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main > aside'), mapa = document.querySelector('.map'), scene = document.getElementById('scene');
if (!aside || !mapa || !scene) return;
const svg = scene.ownerSVGElement, NS = 'http://www.w3.org/2000/svg';
const K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702, D2R = Math.PI / 180, RT = 6378137;
const aEscena = (lon, lat) => [500 + (lon * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) + OY) * K];
const deEscena = (x, y) => [((x - 500) / K - OX) / D2R, (2 * Math.atan(Math.exp((380 - y) / K - OY)) - Math.PI / 2) / D2R];
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const sv = (par, tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) if (at[k] != null) e.setAttribute(k, at[k]); if (par) par.append(e); return e; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dec = (n, d = 1) => (+n).toLocaleString('es-BO', { minimumFractionDigits: d, maximumFractionDigits: d });
const miles = n => Math.round(n).toLocaleString('es-BO');
const kmH = (a, b) => { const dl = (b[1] - a[1]) * D2R, dn = (b[0] - a[0]) * D2R, q = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * D2R) * Math.cos(b[1] * D2R) * Math.sin(dn / 2) ** 2; return 2 * 6371.0088 * Math.asin(Math.sqrt(q)); };
const utm = (lon, lat) => { const T = window.EMTE_TOPO; return T ? T.textos(lat, lon).utm : lat.toFixed(5) + ', ' + lon.toFixed(5); };
const hhmm = d => d.toTimeString().slice(0, 5);
const fechaTxt = d => d.toLocaleDateString('es-BO', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
const LS = { get: (k, v) => { try { return JSON.parse(localStorage.getItem('emte-hp-' + k)) ?? v; } catch (e) { return v; } }, set: (k, v) => { try { localStorage.setItem('emte-hp-' + k, JSON.stringify(v)); } catch (e) {} } };
const descargar = (nombre, texto, tipo) => { const a = h('a'); a.href = URL.createObjectURL(new Blob([texto], { type: tipo })); a.download = nombre; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 3000); };
const csv = filas => '﻿' + filas.map(f => f.map(v => '"' + String(v ?? '').replace(/"/g, '""') + '"').join(';')).join('\r\n');

/* ---------- estilos ---------- */
const css = h('style');
css.textContent = `
.hp-c{padding:10px 11px 12px;display:grid;gap:9px;overflow-x:hidden;font-size:11.5px;color:#14233A}
.hp-c p{margin:0;line-height:1.45;font-size:11px;color:#3A4A60}
.hp-c h4{margin:6px 0 0;font:800 11px var(--tipo-titulo,system-ui);letter-spacing:.07em;color:#0B1D33;border-bottom:2px solid #B79A5B;padding-bottom:3px}
.hp-c label{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:600;color:#12294A}
.hp-c .fila{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.hp-c .fila3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.hp-c .campo{min-width:0;display:grid;gap:3px;font-size:10px;font-weight:700;color:#5A6B80;letter-spacing:.03em}
.hp-c input[type=text],.hp-c input[type=number],.hp-c input[type=date],.hp-c input[type=time],.hp-c input[type=datetime-local],.hp-c select,.hp-c textarea{width:100%;min-width:0;box-sizing:border-box;padding:6px 7px;border:1px solid #C9D1DE;border-radius:6px;font:12px var(--tipo-texto,system-ui);color:#12294A;background:#fff}
.hp-c textarea{min-height:58px;resize:vertical}
.hp-b{display:flex;flex-wrap:wrap;gap:6px}
.hp-b button,.hp-btn{flex:1 1 auto;padding:8px 9px;border:1px solid #12294A;border-radius:7px;background:#fff;color:#12294A;font:700 10.5px var(--tipo-titulo,system-ui);letter-spacing:.05em;cursor:pointer}
.hp-b button.pri,.hp-btn.pri{background:#0B1D33;color:#fff;border-color:#0B1D33}
.hp-b button.on{background:#B79A5B;border-color:#B79A5B;color:#0B1D33}
.hp-b button:disabled{opacity:.45;cursor:default}
.hp-msg{padding:7px 9px;border-radius:7px;background:#F1F5FA;border-left:3px solid #B79A5B;font-size:11px;line-height:1.4}
.hp-msg.err{background:#FDEDEC;border-left-color:#C0392B}
.hp-ruta{border:1px solid #D7DEE8;border-radius:9px;overflow:hidden;background:#fff}
.hp-ruta>div.cab{display:flex;align-items:center;gap:8px;padding:8px 10px;background:#0B1D33;color:#fff;cursor:pointer}
.hp-ruta>div.cab b{font:800 12px var(--tipo-titulo,system-ui);letter-spacing:.06em}
.hp-ruta>div.cab i{width:14px;height:14px;border-radius:3px;flex:none;border:2px solid #fff}
.hp-ruta>div.cab span{margin-left:auto;font-size:10px;font-weight:800;padding:3px 7px;border-radius:10px;background:#fff;color:#0B1D33}
.hp-ruta table,.hp-tabla{width:100%;border-collapse:collapse;font-size:10px;table-layout:auto}
.hp-tabla td{overflow-wrap:break-word}
.hp-ruta td,.hp-tabla td,.hp-tabla th{padding:4px 7px;border-top:1px solid #EEF1F5;vertical-align:top}
.hp-tabla th{background:#0B1D33;color:#fff;font-size:9.5px;text-align:left;letter-spacing:.04em}
.hp-ruta td:first-child{color:#5A6B80;font-weight:700;width:46%}
.hp-barra{display:flex;height:9px;border-radius:5px;overflow:hidden;margin-top:3px}
.hp-lista{display:grid;gap:5px;max-height:260px;overflow:auto}
.hp-it{display:flex;gap:7px;align-items:center;padding:6px 8px;border:1px solid #E3E8EF;border-radius:7px;background:#F8FAFC;font-size:11px}
.hp-it b{flex:1;min-width:0}
.hp-it button{border:0;background:none;color:#C0392B;font-weight:800;cursor:pointer;font-size:13px}
.hp-tl{width:100%;height:auto;border:1px solid #E3E8EF;border-radius:8px;background:#fff}
.hp-doc{max-height:420px;overflow:auto;border:1px solid #D7DEE8;border-radius:8px;padding:12px 14px;background:#fff;font:11px/1.45 'Times New Roman',serif;color:#000;text-transform:none}
.hp-doc h3{text-align:center;font-size:13px;margin:6px 0}.hp-doc h5{font-size:11.5px;margin:9px 0 3px}.hp-doc p{margin:2px 0 2px 14px;color:#000;font-size:11px}
.hp-aviso{position:absolute;left:50%;top:62px;transform:translateX(-50%);z-index:12;padding:7px 15px;border-radius:16px;background:#0B1D33ee;color:#fff;font:12px var(--tipo-texto,system-ui);pointer-events:none;box-shadow:0 4px 14px #0004}
.hp-aviso[hidden]{display:none}
.map.hp-elegir svg{cursor:crosshair!important}
#topo-hp text{pointer-events:none}`;
document.head.append(css);

/* ---------- capa del mapa y selección de puntos ---------- */
const capa = sv(null, 'g', { id: 'topo-hp' });
const sub = {}; ['cub', 'obs', 'ain', 'aa', 'mar', 'pts'].forEach(k => sub[k] = sv(capa, 'g', { id: 'hp-' + k }));
function ponerCapa() { if (capa.parentNode !== scene) { const ref = document.getElementById('topo-municipios-nombres'); ref ? ref.before(capa) : scene.append(capa); } }
const aviso = h('div', 'hp-aviso'); aviso.hidden = true; mapa.append(aviso);
let eleccion = null, abajo = null;   // {texto, fn(ll), multiple}
function elegir(texto, fn, multiple) { eleccion = { texto, fn, multiple }; aviso.textContent = texto + ' · Esc para terminar'; aviso.hidden = false; mapa.classList.add('hp-elegir'); }
function soltar() { eleccion = null; aviso.hidden = true; mapa.classList.remove('hp-elegir'); }
svg.addEventListener('pointerdown', e => { abajo = [e.clientX, e.clientY]; }, true);
svg.addEventListener('click', e => {
  if (!eleccion) return;
  e.stopImmediatePropagation(); e.preventDefault();
  if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 6) return;
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(scene.getScreenCTM().inverse());
  const ll = deEscena(p.x, p.y), el = eleccion; if (!el.multiple) soltar(); el.fn(ll);
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && eleccion) { const f = eleccion.fin; soltar(); f && f(); } });
const k1 = () => 1 / scale;
function marca(par, ll, txt, color = '#0B1D33', forma = 'c') {
  const [x, y] = aEscena(ll[0], ll[1]), g = sv(par, 'g', { class: 'hp-m', 'data-x': x, 'data-y': y, transform: `translate(${x} ${y}) scale(${k1()})` });
  if (forma === 'c') { sv(g, 'circle', { r: 8, fill: '#fff', stroke: color, 'stroke-width': 2.5 }); sv(g, 'circle', { r: 3.5, fill: color }); }
  else if (forma === 'x') { sv(g, 'path', { d: 'M-6-6L6 6M-6 6L6-6', stroke: '#fff', 'stroke-width': 6 }); sv(g, 'path', { d: 'M-6-6L6 6M-6 6L6-6', stroke: color, 'stroke-width': 3 }); }
  else if (forma === 'po') { sv(g, 'path', { d: 'M0-11L10 7H-10Z', fill: '#fff', stroke: color, 'stroke-width': 2.4 }); sv(g, 'circle', { cy: 1, r: 2.5, fill: color }); }
  if (txt) { const t = sv(g, 'text', { x: 11, y: 4, 'font-size': 11, 'font-weight': 800, 'font-family': 'Bahnschrift,system-ui,sans-serif', fill: color, stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke' }); t.textContent = txt; }
  return g;
}
const zoomAnterior = zoom;
zoom = function (f) { zoomAnterior(f); const k = 1 / scale; capa.querySelectorAll('.hp-m').forEach(m => m.setAttribute('transform', `translate(${m.dataset.x} ${m.dataset.y}) scale(${k})`)); capa.querySelectorAll('[data-sw]').forEach(e => e.setAttribute('font-size', e.dataset.sw * k)); };

/* ---------- secciones de la pestaña PLANEAMIENTO ---------- */
const SECC = {}, LIMPIEZA = [];
function seccion(id, titulo, sub2) {
  const d = h('details', 'layer-menu hp-menu hp-' + id); d.open = true;
  d.innerHTML = `<summary>${titulo}${sub2 ? ' · ' + sub2 : ''}</summary>`;
  const c = h('div', 'hp-c'); d.append(c); aside.append(d); SECC[id] = d; return c;
}
const rotulo = (texto, input) => { const l = h('label', 'campo'); l.append(document.createTextNode(texto), input); return l; };
const inp = (tipo, valor, at = {}) => { const i = h('input'); i.type = tipo; if (valor != null) i.value = valor; Object.assign(i, at); return i; };
const sel = (ops, valor) => { const s = h('select'); ops.forEach(([v, t]) => { const o = h('option', null, t); o.value = v; s.append(o); }); if (valor != null) s.value = valor; return s; };
const boton = (t, fn, cls) => { const b = h('button', cls || ''); b.type = 'button'; b.textContent = t; b.onclick = fn; return b; };
const mensaje = (c, t, err) => { let m = c.querySelector(':scope > .hp-msg.dyn'); if (!m) { m = h('div', 'hp-msg dyn'); c.append(m); } m.classList.toggle('err', !!err); m.innerHTML = t; return m; };

/* ---------- datos compartidos ---------- */
let COC = null;   // {meta, fz:{mec,inf,aer}: Uint8Array w*h}
function cargarImg(url) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; }); }
async function rasterGris(url, max) { const i = await cargarImg(url), cv = document.createElement('canvas'), k = max && Math.max(i.naturalWidth, i.naturalHeight) > max ? max / Math.max(i.naturalWidth, i.naturalHeight) : 1; cv.width = Math.round(i.naturalWidth * k); cv.height = Math.round(i.naturalHeight * k); const c = cv.getContext('2d', { willReadFrequently: true }); c.imageSmoothingEnabled = false; c.drawImage(i, 0, 0, cv.width, cv.height); /* 10-11-2026: en tablet/celular se reduce (sin mezclar clases) */ const d = c.getImageData(0, 0, cv.width, cv.height).data, o = new Uint8Array(cv.width * cv.height); for (let k = 0; k < o.length; k++) o[k] = d[k * 4]; return { w: cv.width, h: cv.height, v: o }; }
async function cargarCOC() {
  if (COC) return COC;
  const meta = await fetch('data/coc_omasuyos.json').then(r => r.json());
  const fz = {}; for (const f of ['mec', 'inf']) fz[f] = (await rasterGris('data/coc_' + f + '.png')).v;
  COC = { meta, fz }; return COC;
}
let CUB = null;
async function cargarCub() { if (CUB) return CUB; const meta = await fetch('data/cubierta_omasuyos.json').then(r => r.json()); const r = await rasterGris('data/cubierta_omasuyos.png', matchMedia('(pointer:coarse)').matches ? 3200 : 0); CUB = { meta, ...r }; return CUB; }
const merc = (lon, lat) => [RT * lon * D2R, RT * Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2))];
function muestraCub(ll) { if (!CUB) return null; const [X0, Y0] = merc(...CUB.meta.nw), [X1, Y1] = merc(...CUB.meta.se), [x, y] = merc(ll[0], ll[1]); const i = Math.floor((x - X0) / (X1 - X0) * CUB.w), j = Math.floor((Y0 - y) / (Y0 - Y1) * CUB.h); if (i < 0 || j < 0 || i >= CUB.w || j >= CUB.h) return null; const v = CUB.v[j * CUB.w + i]; return v === 255 ? null : v; }
let TC = null; const cargarTC = () => TC ? Promise.resolve(TC) : fetch('data/terreno_clave_omasuyos.geojson').then(r => r.json()).then(d => TC = d).catch(() => (TC = { features: [] }));
let AGUA = null; const cargarAgua = () => AGUA ? Promise.resolve(AGUA) : fetch('data/cuerpos_agua_omasuyos.geojson').then(r => r.json()).then(d => AGUA = d).catch(() => (AGUA = { features: [] }));
const ESTADO = { aa: LS.get('aa', null), obs: LS.get('obs', { puestos: [], armas: [] }), ain: LS.get('ain', []), luz: null, marcha: LS.get('marcha', null), tl: LS.get('tl', null) };

/* =====================================================================================================
   1. AVENIDAS DE APROXIMACIÓN: 3 rutas evaluadas y categorizadas
   ===================================================================================================== */
const ESCALON = { cia: ['Compañía', 500], bat: ['Batallón', 1500], bri: ['Brigada', 3000] };
const FZ = { mec: { t: 'Mecanizada / blindada', costo: [1, 4, 25], vel: [20, 10, 3], via: .55 }, inf: { t: 'Infantería a pie', costo: [1, 2, 7], vel: [4, 3, 1.5], via: .8 } };
const COLOR_CAT = { 'Muy favorable': '#1E8B4C', 'Favorable': '#7CB342', 'Poco favorable': '#E39B16', 'Desfavorable': '#C0392B' };
const COLOR_AA = ['#0033cc', '#7B2CBF', '#00838F'];
(function avenidas() {
  const c = seccion('aa', 'Avenidas de aproximación', '3 rutas evaluadas');
  c.innerHTML = `<p>Puedes calcular <b>varias avenidas numeradas</b> (N.º 1, 2, 3…), cada una con su <b>partida</b> y su <b>objetivo</b>. Para cada una se calculan <b>3 rutas distintas</b> (AA-1, AA-2, AA-3) y se evalúan: tiempo, desnivel, pendientes, obstáculos, cuellos de botella, ancho del corredor, encubrimiento y terreno clave. Si quieres que pase por lugares obligados, activa <b>puntos de paso</b>. <b>A pie</b>, la ruta busca el menor tiempo de marcha según el relieve de las curvas de nivel IGM y la pendiente.</p>`;
  // ---------- estado: lista de avenidas numeradas ----------
  let G = LS.get('aa-lista', null);
  if (!G || !Array.isArray(G.L) || !G.L.length) {   // primera vez: se toma lo que había
    const pts = LS.get('aa-pts', null), r = ESTADO.aa;
    G = { act: 0, todas: true, L: [{ A: pts?.A || r?.A || null, B: pts?.B || r?.B || null, M: pts?.M || r?.puntos?.slice(1, -1) || [], paso: !!(pts?.M?.length || r?.puntos?.length > 2), fz: LS.get('aa-fz', 'inf'), es: LS.get('aa-es', 'bat'), r: r || null }] };
  }
  G.act = Math.min(Math.max(0, G.act | 0), G.L.length - 1);
  const cur = () => G.L[G.act];
  const nueva = () => ({ A: null, B: null, M: [], paso: false, fz: cur()?.fz || 'inf', es: cur()?.es || 'bat', r: null });
  const guardar = () => { LS.set('aa-lista', G); ESTADO.aa = cur().r || null; LS.set('aa', ESTADO.aa); };
  // ---------- controles ----------
  const chips = h('div', 'aa-chips'); c.append(chips);
  const cab = h('div', 'aa-cab'); c.append(cab);
  const fz = sel([['inf', FZ.inf.t + ' (marcha)'], ['mec', FZ.mec.t]], 'inf'), es = sel(Object.entries(ESCALON).map(([k, v]) => [k, v[0] + ' (corredor ≥ ' + miles(v[1]) + ' m)']), 'bat');
  fz.onchange = () => { cur().fz = fz.value; guardar(); }; es.onchange = () => { cur().es = es.value; guardar(); };
  const f1 = h('div', 'fila'); f1.append(rotulo('FUERZA', fz), rotulo('ESCALÓN QUE AVANZA', es)); c.append(f1);
  const bA = boton('① Partida', () => elegir(`Avenida N.º ${G.act + 1}: toca el mapa en la zona de partida`, ll => { cur().A = ll; cambio(); }));
  const bB = boton('② Objetivo', () => elegir(`Avenida N.º ${G.act + 1}: toca el mapa en el objetivo`, ll => { cur().B = ll; cambio(); }));
  const fb = h('div', 'hp-b'); fb.append(bA, bB); c.append(fb);
  const lPaso = h('label'), cbPaso = h('input'); cbPaso.type = 'checkbox'; lPaso.append(cbPaso, document.createTextNode('Agregar puntos de paso (opcional)')); c.append(lPaso);
  cbPaso.onchange = () => { cur().paso = cbPaso.checked; cambio(); };
  const bM = boton('＋ Punto de paso', () => { elegir(`Avenida N.º ${G.act + 1}: toca el mapa en cada punto de paso, en orden`, ll => { cur().M.push(ll); cambio(); }, true); eleccion.fin = () => cambio(); });
  const fbM = h('div', 'hp-b'); fbM.append(bM); c.append(fbM);
  const tabPts = h('div', 'hp-lista'); c.append(tabPts);
  const bC = boton('CALCULAR 3 RUTAS', () => calcular([G.act]), 'pri'), bT = boton('CALCULAR TODAS', () => calcular(G.L.map((_, i) => i)));
  const fb2 = h('div', 'hp-b'); fb2.append(bC, bT, boton('Limpiar esta', () => { if (!confirm(`¿Borrar los puntos y las rutas de la avenida N.º ${G.act + 1}?`)) return; Object.assign(cur(), { A: null, B: null, M: [], r: null }); cambio(); })); c.append(fb2);
  const lTodas = h('label'), cbTodas = h('input'); cbTodas.type = 'checkbox'; lTodas.append(cbTodas, document.createTextNode('Mostrar en el mapa todas las avenidas numeradas')); c.append(lTodas);
  cbTodas.onchange = () => { G.todas = cbTodas.checked; guardar(); dibujar(); };
  const res = h('div'); res.style.cssText = 'display:grid;gap:8px'; c.append(res);
  const css2 = h('style'); css2.textContent = `.aa-chips{display:flex;flex-wrap:wrap;gap:5px}
.aa-chips button{display:flex;align-items:center;gap:5px;padding:6px 9px;border:1px solid #C9D1DE;border-radius:16px;background:#fff;color:#12294A;font:800 10.5px var(--tipo-titulo,system-ui);letter-spacing:.04em;cursor:pointer}
.aa-chips button.on{background:#0B1D33;color:#fff;border-color:#0B1D33}.aa-chips button i{font-style:normal;font-size:9px;color:#1E8B4C}.aa-chips button.on i{color:#7DDBA0}
.aa-chips button.mas{border-style:dashed;color:#8A6D2F;border-color:#B79A5B}
.aa-cab{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;background:linear-gradient(135deg,#0B1D33,#1C3A66);color:#fff;font:800 11.5px var(--tipo-titulo,system-ui);letter-spacing:.08em}
.aa-ojo{border:0;border-radius:50%;width:24px;height:24px;flex:none;background:#fff;color:#0B1D33;font-size:12px;cursor:pointer;line-height:1;padding:0}.aa-ojo.off{background:#ffffff40;color:#fff}
.aa-cab span{flex:1}.aa-cab small{font-weight:600;letter-spacing:0;color:#E2CB8E}.aa-cab button{border:0;background:#ffffff1f;color:#fff;border-radius:6px;padding:3px 8px;cursor:pointer;font-weight:800}`;
  document.head.append(css2);
  const gP = sv(sub.aa, 'g', {});
  const lista = A => [A.A, ...(A.paso ? A.M : []), A.B];
  const etiqueta = (i, n, k) => i === 0 ? 'PARTIDA ' + k : i === n - 1 ? 'OBJETIVO ' + k : `P${i} (N.º ${k})`;
  function cambio() { guardar(); pintarPanel(); dibujar(); }
  function pintarPanel() {
    chips.replaceChildren();
    G.L.forEach((A, i) => { const b = h('button', i === G.act ? 'on' : ''); b.type = 'button'; b.append(document.createTextNode('N.º ' + (i + 1))); if (A.r) b.append(h('i', null, '✔')); b.title = A.r ? 'Rutas calculadas' : 'Sin calcular'; b.onclick = () => { G.act = i; guardar(); pintarPanel(); dibujar(); }; chips.append(b); });
    const mas = h('button', 'mas', '＋ NUEVA AVENIDA'); mas.type = 'button'; mas.onclick = () => { G.L.push(nueva()); G.act = G.L.length - 1; cambio(); }; chips.append(mas);
    const A = cur(); cab.replaceChildren();
    const t = h('span', null, `AVENIDA DE APROXIMACIÓN N.º ${G.act + 1} `); t.append(h('small', null, A.r ? `· ${A.r.rutas.length} rutas calculadas` : '· sin calcular')); cab.append(t);
    if (G.L.length > 1) { const x = h('button', null, '✕'); x.type = 'button'; x.title = 'Borrar esta avenida'; x.onclick = () => { if (!confirm(`¿Borrar la avenida N.º ${G.act + 1}? Las siguientes se renumeran.`)) return; G.L.splice(G.act, 1); G.act = Math.max(0, G.act - 1); cambio(); }; cab.append(x); }
    fz.value = A.fz || 'inf'; es.value = A.es || 'bat'; cbPaso.checked = !!A.paso; fbM.style.display = A.paso ? '' : 'none'; cbTodas.checked = G.todas !== false;
    tabPts.replaceChildren(); const L = lista(A), n = L.length;
    L.forEach((p, i) => {
      const d = h('div', 'hp-it'), col = i === 0 ? '#0B1D33' : i === n - 1 ? '#C0392B' : '#B7791F';
      const tt = h('b'); tt.innerHTML = `<span style="color:${col}">${i === 0 ? 'PARTIDA' : i === n - 1 ? 'OBJETIVO' : 'PUNTO DE PASO ' + i}</span> <small style="font-weight:600;color:#5A6B80">${p ? esc(utm(p[0], p[1])) : 'sin marcar'}</small>`; d.append(tt);
      if (i > 0 && i < n - 1) {
        const m = i - 1, mv = (txt, ti, fn) => { const b = h('button', null, txt); b.type = 'button'; b.title = ti; b.style.color = '#12294A'; b.onclick = fn; d.append(b); };
        if (m > 0) mv('↑', 'Subir', () => { [A.M[m - 1], A.M[m]] = [A.M[m], A.M[m - 1]]; cambio(); });
        if (m < A.M.length - 1) mv('↓', 'Bajar', () => { [A.M[m + 1], A.M[m]] = [A.M[m], A.M[m + 1]]; cambio(); });
        const x = h('button', null, '✕'); x.type = 'button'; x.title = 'Quitar este punto de paso'; x.onclick = () => { A.M.splice(m, 1); cambio(); }; d.append(x);
      }
      tabPts.append(d);
    });
    bC.disabled = !(A.A && A.B); bC.textContent = `CALCULAR 3 RUTAS (N.º ${G.act + 1})`; bT.hidden = G.L.length < 2; bT.disabled = !G.L.some(x => x.A && x.B);
    if (A.r) tarjetas(A.r); else res.replaceChildren();
  }
  function dibujar() {   // puntos y rutas de todas las avenidas (la elegida resaltada)
    ponerCapa(); [...sub.aa.children].forEach(e => { if (e !== gP) e.remove(); }); if (!gP.isConnected) sub.aa.prepend(gP); gP.replaceChildren();
    const mostrar = G.L.map((A, i) => [A, i]).filter(([, i]) => G.todas !== false || i === G.act);
    mostrar.forEach(([A, i]) => { if (A.r) dibujarAA(A.r, sub.aa, G.L.length > 1 ? (i + 1) + '·' : '', i === G.act ? 1 : .5, A.ocultas || []); });
    mostrar.forEach(([A, i]) => {
      const L = lista(A), n = L.length, ok = L.filter(Boolean), op = i === G.act ? 1 : .55;
      const g = sv(gP, 'g', { opacity: op });
      if (ok.length > 1 && !A.r) { const pts = ok.map(p => aEscena(p[0], p[1])); sv(g, 'path', { d: 'M' + pts.map(p => p.join(' ')).join('L'), fill: 'none', stroke: '#0B1D33', 'stroke-width': 1.2, 'stroke-dasharray': '3 5', 'stroke-opacity': .6, 'vector-effect': 'non-scaling-stroke' }); }
      L.forEach((p, j) => { if (p) marca(g, p, etiqueta(j, n, i + 1), j === 0 ? '#0B1D33' : j === n - 1 ? '#C0392B' : '#B7791F', j > 0 && j < n - 1 ? 'po' : 'c'); });
    });
  }
  SECC.aa?.addEventListener('toggle', () => { if (SECC.aa.open) { pintarPanel(); dibujar(); } });
  function limpiarAA() { G = { act: 0, todas: true, L: [nueva()] }; guardar(); res.replaceChildren(); c.querySelector('.hp-msg.dyn')?.remove(); pintarPanel(); dibujar(); }
  LIMPIEZA.push(limpiarAA);
  async function calcular(indices) {
    indices = indices.filter(i => G.L[i]?.A && G.L[i]?.B); if (!indices.length) return;
    mensaje(c, 'Calculando… (pendientes MDT y modelo de elevación de toda la provincia)');
    let C, D = null; try {
      const PM = window.EMTE_PENDIENTES_MDT; if (!PM) throw new Error('sin pendientes'); await PM.cargar(); C = PM.datos(); if (!C) throw new Error('sin pendientes');
      await Promise.all([cargarTC(), cargarAgua(), cargarRios(), cargarCub().catch(() => null)]);
      if (window.EMTE_CARGAR_DEM) { await window.EMTE_CARGAR_DEM(); D = window.EMTE_DEM(); }
    } catch (e) { mensaje(c, 'No se pudieron cargar las pendientes de transitabilidad o el modelo de elevación.', true); return; }
    const fallas = []; let motivo = '';
    for (const i of indices) {
      const A = G.L[i]; mensaje(c, `Calculando la avenida N.º ${i + 1}…`); await new Promise(r => setTimeout(r, 30));
      if (A.fz === 'inf' && !D) { fallas.push(i + 1); continue; }
      try { const r = avenidasRuta(C, D, A.fz || 'inf', A.es || 'bat', lista(A).filter(Boolean)); if (r && r.error) { fallas.push(i + 1); motivo = r.error; } else if (r) { r.n = i + 1; A.r = r; A.ocultas = []; } else fallas.push(i + 1); }
      catch (e) { console.error(e); fallas.push(i + 1); }
    }
    guardar(); pintarPanel(); dibujar(); window.EMTE_HP_EVENTO?.('aa');
    if (fallas.length) mensaje(c, `No se pudo calcular la avenida N.º ${fallas.join(', ')}: ${motivo || 'algún punto está fuera de Omasuyos, sobre agua, o no hay paso entre ellos.'}`, true); else c.querySelector('.hp-msg.dyn')?.remove();
  }
  function tarjetas(r) {
    res.replaceChildren();
    const pie = r.fz === 'inf', resumen = h('div', 'hp-msg');
    resumen.innerHTML = `<b>N.º ${G.act + 1} · ${FZ[r.fz].t} · ${ESCALON[r.esc][0]}</b> · distancia directa ${dec(r.directa)} km${r.puntos?.length > 2 ? ` · ${r.puntos.length - 2} punto(s) de paso` : ''}` +
      (pie ? '<br><b>AA-1</b> casi recta (la más directa) · <b>AA-2</b> sin pasar por zonas restringidas · <b>AA-3</b> la más factible según las curvas de nivel IGM (subidas, bajadas y pendiente).' : '<br>Mecanizada: <b>AA-1</b> y <b>AA-2</b> solo por terreno sin restricción (pendiente ≤ ' + (r.umbrales?.[0] ?? 30) + ' %), por corredores distintos · <b>AA-3</b> admite terreno restringido con mayor costo (más directa).') + '<br>Ninguna ruta pasa por poblaciones (mancha urbana: severamente restringido).' +
      (r.sinVerde ? `<br><b style="color:#9B1C1C">No hay paso solo por terreno sin restricción entre estos puntos:</b> ${pie ? 'la AA-2 cruza lo mínimo posible de terreno restringido.' : 'las rutas admiten terreno restringido.'}` : '') +
      (r.rutas.length < 3 ? `<br><b style="color:#9B1C1C">Solo se encontraron ${r.rutas.length} ruta(s) distinta(s):</b> el terreno no deja otro corredor.` : '');
    res.append(resumen);
    r.rutas.forEach((R, i) => {
      const d = h('div', 'hp-ruta'), cb = h('div', 'cab'), dot = h('i'); dot.style.background = COLOR_AA[i];
      const A0 = cur(), apagada = (A0.ocultas || []).includes(i), ojo = h('button', 'aa-ojo' + (apagada ? ' off' : ''), apagada ? '⊘' : '👁'); ojo.type = 'button'; ojo.title = (apagada ? 'Encender' : 'Apagar') + ` AA-${i + 1} en el mapa`;
      ojo.onclick = e => { e.stopPropagation(); const L = new Set(A0.ocultas || []); L.has(i) ? L.delete(i) : L.add(i); A0.ocultas = [...L]; guardar(); tarjetas(A0.r); dibujar(); };
      if (apagada) d.style.opacity = .55;
      cb.append(ojo, dot, h('b', null, `AA-${i + 1} · ${R.rol}`), h('span', null, R.cat + ' · ' + R.puntaje));
      const TAG = { recta: ['CASI RECTA · LA MÁS DIRECTA', '#0033cc'], verde: ['SIN ZONAS RESTRINGIDAS', '#1E8B4C'], verdeMin: ['MÍNIMO TERRENO RESTRINGIDO', '#B7791F'], restringido: ['ADMITE RESTRINGIDO', '#B7791F'], pie: ['SEGÚN CURVAS DE NIVEL · MÁS FACTIBLE', '#7B2CBF'] }[R.tipo];
      if (TAG) { const tg = h('em', 'hp-tipo', TAG[0]); tg.style.cssText = `display:block;flex-basis:100%;margin:2px 0 0 18px;font:800 9.5px var(--tipo-titulo,system-ui);letter-spacing:.08em;font-style:normal;color:${TAG[1]}`; cb.style.flexWrap = 'wrap'; cb.append(tg); }
      cb.querySelector('span').style.background = COLOR_CAT[R.cat]; cb.querySelector('span').style.color = '#fff';
      const t = h('table'), pc = R.pct, tiempo = x => x >= 1 ? dec(x) + ' h' : miles(x * 60) + ' min';
      const crit = R.tipo === 'pie' ? 'La más factible según las curvas de nivel: menor tiempo de marcha a pie subiendo y bajando (función de Tobler) y según la pendiente de cada tramo'
        : R.tipo === 'recta' ? 'Casi recta: la menor distancia entre los puntos; solo rodea el agua y las laderas muy empinadas'
        : R.tipo === 'verdeMin' ? 'No existe paso continuo solo por terreno sin restricción: cruza lo mínimo posible de terreno restringido y severamente restringido'
        : R.tipo === 'verde' ? 'Solo terreno sin restricción (verde): no entra en zonas restringidas, severamente restringidas ni en la mancha urbana' : 'Puede cruzar terreno restringido (amarillo) y, si no hay otra salida, severamente restringido (rojo), con mayor costo';
      void crit;   // 04-11-2026: en cada AA solo longitud, tiempo (sin descansos) con la velocidad media, y obstáculos cruzados
      const vm = R.horas > 0 ? R.km / R.horas : 0;
      t.innerHTML = `<tr><td>Distancia</td><td><b>${dec(R.km)} km</b></td></tr>
<tr><td>Tiempo estimado</td><td><b>${tiempo(R.horas)}</b> sin descansos · velocidad media <b>${dec(vm)} km/h</b></td></tr>
<tr><td>Obstáculos cruzados</td><td><b>${R.obst}</b> (ríos o tramos severamente restringidos)</td></tr>`;
      d.append(cb, t); cb.onclick = () => t.hidden = !t.hidden; res.append(d);
    });
    const filas = G.L.flatMap((A, k) => (A.r?.rutas || []).map((R, i) => ['N.º ' + (k + 1), 'AA-' + (i + 1), R.rol, R.cat, R.puntaje, dec(R.km), dec(R.horas), R.horasAltos != null ? dec(R.horasAltos) : '', R.subida ?? '', R.bajada ?? '', R.pendMedia != null ? dec(R.pendMedia, 0) : '', R.pendMax != null ? dec(R.pendMax, 0) : '', dec(R.pct[0], 0), dec(R.pct[1], 0), dec(R.pct[2], 0), dec(R.pctVia, 0), R.obst, R.anchoMin, R.cuellos.length, R.encub == null ? '' : dec(R.encub, 0), R.tc.join(', ')]));
    const fb3 = h('div', 'hp-b'); fb3.append(boton('Descargar evaluación de todas (CSV)', () => descargar('avenidas_aproximacion.csv', csv([['Avenida', 'Ruta', 'Rol', 'Categoría', 'Puntaje', 'Distancia km', 'Tiempo h', 'Tiempo con altos h', 'Subida m', 'Bajada m', 'Pendiente media %', 'Pendiente máx %', '% sin restricción', '% restringido', '% sev. restringido', '% sobre caminos', 'Obstáculos', 'Ancho mínimo m', 'Cuellos', 'Encubrimiento %', 'Terreno clave'], ...filas]), 'text/csv'))); res.append(fb3);
  }
  guardar(); pintarPanel(); dibujar();
})();
let RIOS = null; const cargarRios = () => RIOS ? Promise.resolve(RIOS) : fetch('data/rios_omasuyos.geojson').then(r => r.json()).then(d => RIOS = d).catch(() => (RIOS = { features: [] }));
function avenidasRuta(C, D, fz, escK, puntos) {
  // C = pendientes de transitabilidad MDT (20 m, hechas con las curvas de las cartas IGM); D = modelo de elevación del geovisor
  const m = C.meta, W0 = C.w, H0 = C.h, F = 3, w = Math.ceil(W0 / F), hh = Math.ceil(H0 / F), cel = (m.celda_m || 20) * F;
  const [X0, Y0] = merc(...m.nw), [X1, Y1] = merc(...m.se);
  const aIJ = ll => { const [x, y] = merc(ll[0], ll[1]); return [Math.floor((x - X0) / (X1 - X0) * w), Math.floor((Y0 - y) / (Y0 - Y1) * hh)]; };
  const aLL = (i, j) => { const x = X0 + (i + .5) / w * (X1 - X0), y = Y0 - (j + .5) / hh * (Y0 - Y1); return [x / RT / D2R, (2 * Math.atan(Math.exp(y / RT)) - Math.PI / 2) / D2R]; };
  // 1) por celda de 60 m: clase (0 sin restricción · 1 restringido · 2 severamente restringido · 255 sin dato/agua) y pendiente media
  const N = w * hh, nt = new Uint16Array(N), n1 = new Uint16Array(N), n2 = new Uint16Array(N), sp = new Float32Array(N), cls = new Uint8Array(N).fill(255), pend = new Float32Array(N);
  for (let j = 0; j < H0; j++) { const jj = (j / F) | 0; for (let i = 0; i < W0; i++) { const v = C.v[j * W0 + i]; if (v === 255) continue; const k = jj * w + ((i / F) | 0), cc = C.clase(v); nt[k]++; sp[k] += v; if (cc === 1) n1[k]++; else if (cc >= 2) n2[k]++; } }
  for (let k = 0; k < N; k++) if (nt[k]) { cls[k] = n2[k] * 3 >= nt[k] ? 2 : (n1[k] + n2[k]) * 3 >= nt[k] ? 1 : 0; pend[k] = sp[k] / nt[k]; }
  const urb = C.mancha && C.mancha.features ? rasterPol(C.mancha.features, w, hh, aIJ) : new Uint8Array(N);
  { const u2 = urb.slice(); for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) if (urb[j * w + i]) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < w && jj < hh) u2[jj * w + ii] = 1; }
    for (let k = 0; k < N; k++) if (u2[k]) cls[k] = 255; }   // poblaciones (mancha urbana) + 1 celda de margen: severamente restringido, ninguna avenida pasa por ellas
  // «limpio»: celda sin terreno restringido (como mucho 1 píxel de 20 m de los 9) — para las rutas que NO pueden pisar zonas restringidas
  const limpio = new Uint8Array(N); for (let k = 0; k < N; k++) limpio[k] = cls[k] !== 255 && nt[k] && (n1[k] + n2[k]) <= 1 ? 1 : 0;
  const agua = rasterPol(AGUA.features, w, hh, aIJ); for (let k = 0; k < N; k++) if (agua[k]) cls[k] = 255;
  // vías y ríos
  const via = new Uint8Array(N), rio = new Uint8Array(N);
  (typeof roadFeatures !== 'undefined' ? roadFeatures : []).forEach(f => { const tv = f.properties.tipo_via || ''; if (!(fz === 'inf' ? /Carretera|secundario|terciario|vecinal|Calle|herradura|sendero|brecha/i : /Carretera|secundario|terciario|vecinal|Calle/i).test(tv) || /intransitable/i.test(f.properties.estado || '')) return; const g = f.geometry, Ls = g.type === 'LineString' ? [g.coordinates] : g.coordinates; for (const l of Ls) for (let n = 1; n < l.length; n++) linea(aIJ(l[n - 1]), aIJ(l[n]), (i, j) => { if (i >= 0 && j >= 0 && i < w && j < hh) via[j * w + i] = 1; }); });
  (RIOS?.features || []).forEach(f => { if (!/^R[ií]o/i.test(f.properties.tipo || '')) return; const g = f.geometry, Ls = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []; for (const l of Ls) for (let n = 1; n < l.length; n++) linea(aIJ(l[n - 1]), aIJ(l[n]), (i, j) => { if (i >= 0 && j >= 0 && i < w && j < hh) rio[j * w + i] = 1; }); });
  // elevación de cada celda (modelo hecho con las curvas de nivel IGM)
  const Z = new Float32Array(N); if (D) for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) { const [lo, la] = aLL(i, j), z = zDem(D, lo, la); Z[j * w + i] = z == null ? 3808 : z; }
  // 2) ancho del corredor: distancia al terreno que no es «sin restricción»
  const dist = new Float32Array(N), INF = 1e9;
  for (let k = 0; k < N; k++) dist[k] = cls[k] === 0 ? INF : 0;
  for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) { const k = j * w + i; if (!dist[k]) continue; let d = dist[k]; if (i) d = Math.min(d, dist[k - 1] + 1); if (j) { d = Math.min(d, dist[k - w] + 1); if (i) d = Math.min(d, dist[k - w - 1] + 1.414); if (i < w - 1) d = Math.min(d, dist[k - w + 1] + 1.414); } dist[k] = d; }
  for (let j = hh - 1; j >= 0; j--) for (let i = w - 1; i >= 0; i--) { const k = j * w + i; if (!dist[k]) continue; let d = dist[k]; if (i < w - 1) d = Math.min(d, dist[k + 1] + 1); if (j < hh - 1) { d = Math.min(d, dist[k + w] + 1); if (i < w - 1) d = Math.min(d, dist[k + w + 1] + 1.414); if (i) d = Math.min(d, dist[k + w - 1] + 1.414); } dist[k] = d; }
  // 3) costo de cada paso = HORAS para recorrerlo
  const P = FZ[fz];
  const fPend = p => p <= 30 ? 1 : p <= 60 ? 1.25 : p <= 100 ? 2.5 : 8;   // a pie: trepar / descolgarse en laderas fuertes
  const pasoPie = (k, q, f) => {   // función de Tobler: v = 6·e^(−3,5·|pendiente + 0,05|) km/h, distinta al subir y al bajar
    if (cls[q] === 255) return Infinity; const dm = f * cel, s = (Z[q] - Z[k]) / dm;
    let t = dm / 1000 / (6 * Math.exp(-3.5 * Math.abs(s + .05))) * fPend(pend[q]);
    if (via[q]) t *= .85; else if (rio[q]) t *= 2.5; return t;
  };
  const pasoMec = soloVerde => (k, q, f) => {
    const cq = cls[q]; if (cq === 255 || (soloVerde && !limpio[q])) return Infinity;
    if (rio[q] && !via[q]) { if (soloVerde) return Infinity; return f * cel / 1000 / P.vel[2] * 3; }
    return f * cel / 1000 / (via[q] ? 30 : P.vel[cq]);
  };
  const vmax = fz === 'inf' ? 7.6 : 30;
  // celda válida más cercana a cada punto
  const ajustar = (ll, valido, R) => { const [i, j] = aIJ(ll), ok = (x, y) => x >= 0 && y >= 0 && x < w && y < hh && valido(y * w + x); if (ok(i, j)) return [i, j, 0]; for (let r = 1; r < R; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if ((Math.abs(di) === r || Math.abs(dj) === r) && ok(i + di, j + dj)) return [i + di, j + dj, Math.round(Math.hypot(di, dj) * cel)]; return null; };
  const pen = new Float32Array(N).fill(1);
  function rutaPor(paso, valido, R, hmin = cel / 1000 / vmax) {   // une los tramos partida → puntos de paso → objetivo
    let total = [], aj = 0;
    for (let n = 0; n < puntos.length - 1; n++) {
      const s = ajustar(puntos[n], valido, R), t = ajustar(puntos[n + 1], valido, R); if (!s || !t) return null; aj = Math.max(aj, s[2], t[2]);
      const p = astar(w, hh, s[1] * w + s[0], t[1] * w + t[0], paso, pen, hmin); if (!p) return null;
      total = total.length ? total.concat(p.slice(1)) : p;
    }
    return { p: total, ajuste: aj };
  }
  const libre = Math.round(1200 / cel), radio = Math.max(8, Math.round((fz === 'inf' ? 700 : 1200) / cel)), PIJ = puntos.map(aIJ);
  const penalizar = (p, fac) => { for (const k of p) { const i = k % w, j = (k / w) | 0; if (PIJ.some(q => Math.hypot(i - q[0], j - q[1]) < libre)) continue;
    for (let dj = -radio; dj <= radio; dj++) for (let di = -radio; di <= radio; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= w || jj >= hh || di * di + dj * dj > radio * radio) continue; const q = jj * w + ii; if (pen[q] < fac) pen[q] = fac; } } };
  const solape = (p, previas) => { const S = new Set(previas.flatMap(r => r.p)); let n = 0; for (const k of p) if (S.has(k)) n++; return n / p.length; };
  const rutas = []; let sinVerde = false;
  const agregar = (paso, valido, R, tipo, fac) => {
    for (const f of [fac, fac * 2.5]) {   // si sale casi igual a una anterior, se aleja más
      const r = rutaPor(paso, valido, R); if (!r) return false;
      if (rutas.length && solape(r.p, rutas) > .6 && f === fac) { penalizar(r.p, f * 2.5); continue; }
      if (rutas.length && solape(r.p, rutas) > .85) return false;
      rutas.push({ ...r, tipo, paso }); penalizar(r.p, f); return true;
    }
    return false;
  };
  if (fz === 'inf') {
    // AA-1 · CASI RECTA: la menor distancia; solo evita el agua y rodea las laderas muy empinadas
    const pasoRecta = (k, q, f) => cls[q] === 255 ? Infinity : f * cel / 1000 * (pend[q] > 100 ? 3 : pend[q] > 60 ? 1.3 : 1);
    const r1 = rutaPor(pasoRecta, k => cls[k] !== 255, 25, cel / 1000);
    // AA-2 · SIN ZONAS RESTRINGIDAS: solo terreno sin restricción (pendiente ≤ 30 %), fuera de la mancha urbana
    const libreV = k => limpio[k] === 1, pasoVerde = (k, q, f) => libreV(q) ? pasoPie(k, q, f) : Infinity;
    let r2 = rutaPor(pasoVerde, libreV, Math.round(2500 / cel)), r2tipo = 'verde';
    if (!r2) { sinVerde = true; r2tipo = 'verdeMin';   // no hay paso continuo sin restricción: el que menos terreno restringido cruza
      const pasoMin = (k, q, f) => { const t = pasoPie(k, q, f); return !isFinite(t) ? t : t * (urb[q] || cls[q] === 2 ? 30 : cls[q] === 1 ? 8 : 1); };
      r2 = rutaPor(pasoMin, k => cls[k] !== 255, 25); }
    // AA-3 · SEGÚN LAS CURVAS DE NIVEL: la más factible = menor tiempo de marcha subiendo y bajando (Tobler) y con la pendiente
    const r3 = rutaPor(pasoPie, k => cls[k] !== 255, 25);
    if (r1) rutas.push({ ...r1, tipo: 'recta', paso: pasoRecta });
    if (r2) rutas.push({ ...r2, tipo: r2tipo, paso: pasoVerde });
    if (r3) rutas.push({ ...r3, tipo: 'pie', paso: pasoPie });
    if (!rutas.length) return null;
  } else {
    // mecanizada: SOLO terreno sin restricción (ni restringido, ni severamente restringido, ni poblaciones); 3 corredores distintos
    // 11-11-2026 (como en el geovisor web): AA-1 y AA-2 SOLO por terreno sin restricción; AA-3 puede cruzar terreno
    // restringido (amarillo) y, si no hay otra salida, severamente restringido (rojo) y ríos sin puente, con mayor costo.
    // Si no hay paso continuo sin restricción, las 3 rutas admiten terreno restringido (se avisa en el resumen).
    const verde = k => limpio[k] === 1, transitable = k => cls[k] !== 255;
    const pasoR = (k, q, f) => { const cq = cls[q]; if (cq === 255) return Infinity; if (rio[q] && !via[q]) return f * cel / 1000 / P.vel[2] * 3; return f * cel / 1000 / (via[q] ? 30 : P.vel[cq]) * (cq === 2 ? 3 : 1); };
    for (let n = 0; n < 2; n++) if (!agregar(pasoMec(true), verde, Math.round(2500 / cel), 'verde', 6 + n * 2)) break;
    if (!rutas.length) sinVerde = true;
    for (let n = 0; rutas.length < 3 && n < 3; n++) if (!agregar(pasoR, transitable, 25, 'restringido', 6 + n * 2)) break;
    if (!rutas.length) return { error: 'para la fuerza mecanizada no hay paso entre esos puntos (agua, poblaciones o fuera de Omasuyos). Mueve la partida o el objetivo, o agrega puntos de paso.' };
  }
  const minAncho = ESCALON[escK][1], tcF = (TC && TC.features) || [], A = puntos[0], B = puntos[puntos.length - 1];
  const evaluadas = rutas.map(({ p, tipo, ajuste, paso }) => {
    let L = 0, horas = 0, viaL = 0, sube = 0, baja = 0, pm = 0, pMax = 0; const porCl = [0, 0, 0]; let obst = 0, prev = 0, prevRio = 0, anchoMin = Infinity, okAncho = 0, enc = 0, encN = 0; const cuellos = []; let enCuello = false;
    const coords = p.map(k => aLL(k % w, (k / w) | 0));
    for (let n = 1; n < p.length; n++) {
      const k0 = p[n - 1], k = p[n], f = (k0 % w !== k % w && ((k0 / w) | 0) !== ((k / w) | 0)) ? 1.414 : 1, d = f * cel / 1000, c = cls[k];
      L += d; porCl[c] += d; if (via[k]) viaL += d; horas += fz === 'inf' ? pasoPie(k0, k, f) : paso(k0, k, f);
      const dz = Z[k] - Z[k0]; if (dz > 0) sube += dz; else baja -= dz; pm += pend[k] * d; if (pend[k] > pMax) pMax = pend[k];
      if ((c === 2 && prev !== 2) || (rio[k] && !via[k] && !prevRio)) obst++; prev = c; prevRio = rio[k] && !via[k];
      const lejos = kmH(coords[n], A) > 1 && kmH(coords[n], B) > 1, ancho = 2 * dist[k] * cel;
      if (lejos) { anchoMin = Math.min(anchoMin, ancho); if (ancho >= minAncho) okAncho += d; else if (!enCuello && ancho < minAncho * .6) { cuellos.push(coords[n]); enCuello = true; } if (ancho >= minAncho * .8) enCuello = false; }
      const cb = muestraCub(coords[n]); if (cb != null) { encN += d; if (cb === 1 || cb === 4 || cb === 6) enc += d; }
    }
    const tc = []; for (const f of tcF) { const g = f.geometry, pr = f.properties, pt = pr.lon != null ? [pr.lon, pr.lat] : g.type === 'Point' ? g.coordinates : null; if (!pt) continue; for (let n = 0; n < coords.length; n += 3) if (kmH(coords[n], pt) <= 1) { tc.push(pr.nombre || pr.tipo || 'K'); break; } }
    const pct = porCl.map(v => v / L * 100), lejosL = Math.max(.001, L - 2), pctAncho = Math.min(100, okAncho / lejosL * 100);
    const o = { tipo, ajuste, coords: simplificar(coords), km: L, horas, pct, pctVia: viaL / L * 100, obst, anchoMin: isFinite(anchoMin) ? Math.round(anchoMin / 10) * 10 : 0, pctAncho, cuellos, encub: encN ? enc / encN * 100 : null, tc: [...new Set(tc)].slice(0, 6) };
    if (fz === 'inf') Object.assign(o, { horasAltos: horas * 60 / 50, subida: Math.round(sube), bajada: Math.round(baja), pendMedia: pm / L, pendMax: pMax });
    return o;
  });
  const minL = Math.min(...evaluadas.map(r => r.km)), minH = Math.min(...evaluadas.map(r => r.horas));
  evaluadas.forEach(R => {
    let s;
    if (fz === 'inf') s = 100 - (R.horas / minH - 1) * 60 - R.pct[1] * .2 - R.pct[2] * .8 - R.obst * 3 - R.cuellos.length * 2 - (100 - R.pctAncho) * .08 + .15 * (R.encub || 0) + Math.min(6, R.pctVia / 10);
    else { s = 100 - R.pct[1] * .45 - R.pct[2] * 1.4 - R.obst * 4 - R.cuellos.length * 4 - (R.km / minL - 1) * 35 - (100 - R.pctAncho) * .15; s += .05 * (R.encub || 0) + Math.min(10, R.pctVia / 6); }
    R.puntaje = Math.max(0, Math.min(100, Math.round(s)));
    R.cat = R.puntaje >= 75 ? 'Muy favorable' : R.puntaje >= 55 ? 'Favorable' : R.puntaje >= 35 ? 'Poco favorable' : 'Desfavorable';
    const n = [];
    if (fz === 'inf') { n.push({ recta: 'la más corta y directa', verde: 'todo el recorrido por terreno sin restricción', verdeMin: 'no hay paso continuo sin restricción: cruza lo mínimo de terreno restringido', pie: 'la más factible según las curvas de nivel' }[R.tipo]); if (R.horas <= minH * 1.05) n.push('la más rápida a pie'); if (R.subida > 400) n.push(`subida fuerte (${miles(R.subida)} m acumulados)`); else if (R.subida < 150) n.push('poco desnivel'); if (R.pendMax > 60) n.push('tramos con pendiente mayor a 60 %'); }
    if (R.pct[0] >= 85) n.push('terreno mayormente transitable'); if (R.pct[2] > 10) n.push('tramos severamente restringidos'); if (R.obst) n.push(R.obst + ' obstáculo(s) a superar'); if (R.cuellos.length) n.push('cuellos de botella: posible canalización'); if (R.pctVia > 50) n.push('aprovecha caminos y sendas'); if ((R.encub || 0) > 20) n.push('buen encubrimiento'); else n.push('poco encubrimiento: expuesta a la observación'); if (R.tc.length) n.push('domina o pasa junto a terreno clave'); if (R.km / minL > 1.4) n.push('recorrido largo');
    R.notas = n;
  });
  // a pie: ordenadas por puntaje · vehículos: primero las de terreno verde
  const orden = fz === 'inf' ? evaluadas : [...evaluadas.filter(R => R.tipo === 'verde').sort((a, b) => b.puntaje - a.puntaje), ...evaluadas.filter(R => R.tipo !== 'verde')];
  orden.slice().sort((a, b) => b.puntaje - a.puntaje).forEach((R, i) => { R.rol = ['Principal', 'Secundaria', 'Alterna'][i] || 'Alterna'; });
  return { fz, esc: escK, A, B, puntos, directa: kmH(A, B), rutas: orden, base: 'pendientes', umbrales: C.umbrales, sinVerde, fecha: new Date().toISOString() };
}
function astar(w, hh, s, t, paso, pen, hmin) {   // A* sobre la rejilla (8 vecinos); costo = horas
  const N = w * hh, g = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), hecho = new Uint8Array(N), ti = t % w, tj = (t / w) | 0;
  let cap = 1 << 16, hk = new Int32Array(cap), hp = new Float64Array(cap), n = 0;
  const push = (k, p) => { if (n === cap) { cap *= 2; const a = new Int32Array(cap), b = new Float64Array(cap); a.set(hk); b.set(hp); hk = a; hp = b; } let i = n++; while (i) { const q = (i - 1) >> 1; if (hp[q] <= p) break; hk[i] = hk[q]; hp[i] = hp[q]; i = q; } hk[i] = k; hp[i] = p; };
  const pop = () => { const top = hk[0], lk = hk[--n], lp = hp[n]; let i = 0; for (;;) { const l = 2 * i + 1; if (l >= n) break; const r = l + 1, m = r < n && hp[r] < hp[l] ? r : l; if (hp[m] >= lp) break; hk[i] = hk[m]; hp[i] = hp[m]; i = m; } hk[i] = lk; hp[i] = lp; return top; };
  const V = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  g[s] = 0; push(s, 0);
  while (n) {
    const k = pop(); if (hecho[k]) continue; hecho[k] = 1; if (k === t) break;
    const i = k % w, j = (k / w) | 0, gk = g[k];
    for (const [di, dj, f] of V) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= w || jj >= hh) continue; const q = jj * w + ii; if (hecho[q]) continue;
      const c = paso(k, q, f); if (!isFinite(c)) continue; const nd = gk + c * pen[q]; if (nd < g[q]) { g[q] = nd; prev[q] = k; push(q, nd + Math.hypot(ii - ti, jj - tj) * hmin); } }
  }
  if (!isFinite(g[t])) return null; const p = []; for (let k = t; k !== -1; k = prev[k]) p.push(k); return p.reverse();
}
function dijkstra(w, hh, costo, pen, s, t) {
  const N = w * hh, d = new Float64Array(N).fill(Infinity), prev = new Int32Array(N).fill(-1), heap = [], tj = (t / w) | 0, ti = t % w;
  const hfun = k => Math.hypot(k % w - ti, ((k / w) | 0) - tj);   // A* con heurística admisible (costo mínimo 0,55)
  const push = (k, p) => { heap.push([p, k]); let i = heap.length - 1; while (i) { const q = (i - 1) >> 1; if (heap[q][0] <= heap[i][0]) break; [heap[q], heap[i]] = [heap[i], heap[q]]; i = q; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
  d[s] = 0; push(s, 0); const V = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  while (heap.length) {
    const [, k] = pop(); if (k === t) break; const i = k % w, j = (k / w) | 0, dk = d[k];
    for (const [di, dj, f] of V) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= w || jj >= hh) continue; const q = jj * w + ii, cq = costo[q]; if (!isFinite(cq)) continue;
      const nd = dk + f * (cq + costo[k]) / 2 * pen[q]; if (nd < d[q]) { d[q] = nd; prev[q] = k; push(q, nd + hfun(q) * .55); } }
  }
  if (!isFinite(d[t])) return null; const p = []; for (let k = t; k !== -1; k = prev[k]) p.push(k); return p.reverse();
}
function linea([x0, y0], [x1, y1], fn) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let s = 0; s <= n; s++) fn(Math.round(x0 + (x1 - x0) * s / n), Math.round(y0 + (y1 - y0) * s / n)); }
function rasterPol(feats, w, hh, aIJ) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = hh; const c = cv.getContext('2d', { willReadFrequently: true }); c.fillStyle = '#fff';
  for (const f of feats) { const g = f.geometry; const ps = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []; for (const p of ps) { c.beginPath(); for (const r of p) r.forEach((q, n) => { const [i, j] = aIJ(q); n ? c.lineTo(i, j) : c.moveTo(i, j); }); c.fill('evenodd'); } }
  const d = c.getImageData(0, 0, w, hh).data, o = new Uint8Array(w * hh); for (let k = 0; k < o.length; k++) o[k] = d[k * 4 + 3] > 100 ? 1 : 0; return o;
}
function simplificar(c) { if (c.length < 4) return c; const o = [c[0]]; for (let n = 1; n < c.length - 1; n++) if (n % 2 === 0) o.push(c[n]); o.push(c[c.length - 1]); return o.map(p => [+p[0].toFixed(5), +p[1].toFixed(5)]); }
function dibujarAA(r, par, pref = '', op = 1, ocultas = []) {   // ocultas: índices de rutas apagadas   // par: grupo donde dibujar (sin él, reemplaza lo dibujado) · pref: «2·» para avenidas numeradas
  ponerCapa(); if (!par) { [...sub.aa.children].slice(1).forEach(e => e.remove()); par = sub.aa; }
  const cont = sv(par, 'g', { opacity: op });
  r.rutas.slice().reverse().forEach((R, iRev) => {
    const i = r.rutas.length - 1 - iRev; if (ocultas.includes(i)) return; const col = COLOR_AA[i], pts = R.coords.map(c => aEscena(c[0], c[1]));
    const d = 'M' + pts.map(p => p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('L');
    const g = sv(cont, 'g', {});
    sv(g, 'path', { d, fill: 'none', stroke: col, 'stroke-opacity': .18, 'stroke-width': 22, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' });
    sv(g, 'path', { d, fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-dasharray': '10 6', 'vector-effect': 'non-scaling-stroke' });
    // punta de flecha (símbolo de avenida de aproximación) y rótulo
    const n = pts.length, a = pts[Math.max(0, n - 6)], b = pts[n - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
    const fl = sv(g, 'g', { class: 'hp-m', 'data-x': b[0], 'data-y': b[1], transform: `translate(${b[0]} ${b[1]}) scale(${k1()})` });
    sv(fl, 'path', { d: 'M0 0L-22-13-18 0-22 13Z', fill: col, stroke: '#fff', 'stroke-width': 1.5, transform: `rotate(${ang})` });
    const txt = pref + 'AA-' + (i + 1), wd = 14 + txt.length * 7.6;
    const m = pts[Math.floor(n * (.35 + .1 * i))], lab = sv(g, 'g', { class: 'hp-m', 'data-x': m[0], 'data-y': m[1], transform: `translate(${m[0]} ${m[1]}) scale(${k1()})` });
    sv(lab, 'rect', { x: -wd / 2, y: -11, width: wd, height: 22, rx: 5, fill: col, stroke: '#fff', 'stroke-width': 2 });
    const t = sv(lab, 'text', { x: 0, y: 5, 'text-anchor': 'middle', 'font-size': 12.5, 'font-weight': 800, fill: '#fff', 'font-family': 'Bahnschrift,system-ui,sans-serif' }); t.textContent = txt;
    R.cuellos.forEach(cu => marca(g, cu, '', col, 'x'));
  });
}

/* =====================================================================================================
   2. CALCO DE SITUACIÓN MODIFICADO (CSM)
   ===================================================================================================== */
(function csm() {
  const c = seccion('csm', 'Calco de situación modificado', 'COC + avenidas + TC');
  c.innerHTML = `<p>Reúne en un solo calco el resultado del análisis del terreno: <b>obstáculos combinados (COC)</b>, <b>avenidas de aproximación</b>, <b>terreno clave</b>, <b>áreas de interés</b> y, si quieres, <b>cubierta y encubrimiento</b>. Luego se exporta como lámina con rótulo, convenciones, norte, escala y cuadrícula UTM.</p>`;
  const fz = sel([['mec', 'COC fuerza mecanizada / blindada'], ['inf', 'COC infantería a pie'], ['aer', 'COC helicópteros']], 'mec');
  c.append(rotulo('OBSTÁCULOS COMBINADOS DE', fz));
  const op = {}; [['aa', 'Avenidas de aproximación (herramienta 1)', true], ['tc', 'Terreno clave (K)', true], ['ain', 'Áreas de interés (herramienta 8)', true], ['cub', 'Cubierta y encubrimiento (herramienta 4)', false], ['obs', 'Campos de tiro (herramienta 3)', false]].forEach(([k, t, v]) => { const l = h('label'), i = inp('checkbox'); i.checked = v; op[k] = i; l.append(i, document.createTextNode(t)); c.append(l); });
  const fb = h('div', 'hp-b'); c.append(fb);
  fb.append(boton('Mostrar el calco', mostrar, 'pri'), boton('Exportar lámina PDF', exportar));
  function mostrar() {
    const A = window.EMTE_ANALISIS; if (A) { A.coc(fz.value); A.tc(op.tc.checked); }
    sub.aa.style.display = op.aa.checked ? '' : 'none'; sub.ain.style.display = op.ain.checked ? '' : 'none'; sub.obs.style.display = op.obs.checked ? '' : 'none';
    window.EMTE_HP_CUB?.(op.cub.checked);
    const faltan = []; if (op.aa.checked && !ESTADO.aa) faltan.push('avenidas (usa la herramienta 1)'); if (op.ain.checked && !ESTADO.ain.length) faltan.push('áreas de interés (herramienta 8)');
    mensaje(c, faltan.length ? 'Calco mostrado. Falta: ' + faltan.join(' y ') + '.' : 'Calco de situación modificado en el mapa. Ajusta la vista y exporta la lámina.');
    if (ESTADO.aa && op.aa.checked && window.EMTE_TOPO) { const cs = ESTADO.aa.rutas.flatMap(r => r.coords); const lo = cs.map(p => p[0]), la = cs.map(p => p[1]); window.EMTE_TOPO.volar(Math.min(...lo) - .02, Math.min(...la) - .02, Math.max(...lo) + .02, Math.max(...la) + .02); }
  }
  function exportar() {
    mostrar();
    const card = [...document.querySelectorAll('.visual-card')].find(b => /Descargar mapa/i.test(b.textContent));
    if (!card) { mensaje(c, 'No se encontró la herramienta «Descargar mapa (PDF)».', true); return; }
    card.click();
    setTimeout(() => { const t = document.getElementById('topo-t'), s = document.getElementById('topo-s'); if (t) t.value = 'CALCO DE SITUACIÓN MODIFICADO'; if (s) s.value = 'ANÁLISIS DEL TERRENO · ' + fz.options[fz.selectedIndex].text.toUpperCase(); }, 60);
  }
})();
// Convenciones del CSM en la leyenda del PDF y en la simbología
window.EMTE_LEYENDAS_EXTRA = window.EMTE_LEYENDAS_EXTRA || [];
window.EMTE_LEYENDAS_EXTRA.push(() => {
  const out = [], A = window.EMTE_ANALISIS?.estado?.();
  if (A && A.coc) { out.push({ nombre: 'COC · terreno restringido', tipo: 'area', color: '#E3B23C' }, { nombre: 'COC · terreno severamente restringido', tipo: 'area', color: '#C0392B' }); }
  if (A && A.tc) out.push({ nombre: 'Terreno clave (K)', tipo: 'area', color: '#6A3D9A' });
  if (ESTADO.aa && sub.aa.style.display !== 'none') ESTADO.aa.rutas.forEach((R, i) => out.push({ nombre: `AA-${i + 1} avenida ${R.rol.toLowerCase()} (${R.cat.toLowerCase()})`, tipo: 'linea', color: COLOR_AA[i] }));
  if (ESTADO.aa && ESTADO.aa.rutas.some(R => R.cuellos.length)) out.push({ nombre: 'Cuello de botella', tipo: 'sim', s: '<path d="M-6-6L6 6M-6 6L6-6" stroke="#0B1D33" stroke-width="3"/>' });
  if (ESTADO.ain.length && sub.ain.style.display !== 'none') out.push({ nombre: 'Área de interés (AIN)', tipo: 'area', color: '#D35400' });
  if (ESTADO.obs.armas.length && sub.obs.style.display !== 'none') out.push({ nombre: 'Alcance eficaz de arma', tipo: 'area', color: '#C0392B' });
  if (window.EMTE_HP_CUB_ON?.()) Object.values(CUB?.meta?.clases || {}).forEach((cl, i) => out.push({ nombre: cl.nombre, tipo: 'area', color: PAL_CUB[i + 1] }));
  return out;
});

/* =====================================================================================================
   3. OBSERVACIÓN Y CAMPOS DE TIRO
   ===================================================================================================== */
const ARMAS = [['Fusil de asalto', 400], ['Ametralladora de uso general', 800], ['Ametralladora pesada', 1500], ['Lanzacohetes / arma antitanque', 300], ['Mortero ligero', 1700], ['Mortero mediano', 5000], ['Otra (escribe el alcance)', 1000]];
(function observacion() {
  // Los puestos de observación se trabajan en una sola herramienta: «Área visible» (Herramientas). Aquí quedan los campos de tiro.
  const c = seccion('obs', 'Campos de tiro', 'alcances de armas');
  c.innerHTML = `<p><b>Campos de tiro:</b> elige un arma y su alcance eficaz y se dibuja el anillo (y el sector, si lo indicas). Para los <b>puestos de observación</b> y lo que ve cada uno, usa <b>Área visible</b>.</p>`;
  const S = ESTADO.obs; S.puestos = [];
  const lista = h('div', 'hp-lista'); const fb = h('div', 'hp-b');
  fb.append(boton('◉ Puestos de observación (Área visible)', () => window.EMTE_AREA_VISIBLE?.abrir()));
  c.append(fb);
  const arma = sel(ARMAS.map(([t, r], i) => [i, t + ' · ' + miles(r) + ' m']), 0), alc = inp('number', ARMAS[0][1], { min: 50, max: 20000, step: 50 });
  arma.onchange = () => alc.value = ARMAS[arma.value][1];
  const azI = inp('number', '', { min: 0, max: 360, placeholder: '—' }), azD = inp('number', '', { min: 0, max: 360, placeholder: '—' });
  const f2 = h('div', 'fila'); f2.append(rotulo('ARMA', arma), rotulo('ALCANCE EFICAZ (m)', alc)); const f3 = h('div', 'fila'); f3.append(rotulo('SECTOR: AZIMUT IZQ. (°)', azI), rotulo('AZIMUT DER. (°)', azD));
  c.append(f2, f3, h('p', null, 'Alcances de referencia: verifícalos con el manual de cada arma. El sector es opcional (azimut magnético aproximado al norte de cuadrícula).'));
  const fb2 = h('div', 'hp-b'); fb2.append(boton('+ Colocar arma', () => elegir('Toca el mapa donde está el arma', ll => { S.armas.push({ ll, t: ARMAS[arma.value][0], r: +alc.value, i: azI.value === '' ? null : +azI.value, d: azD.value === '' ? null : +azD.value }); guardar(); })), boton('Borrar todo', () => { S.puestos = []; S.armas = []; vis = null; guardar(); }));
  c.append(fb2, lista);
  let vis = null;
  function guardar() { LS.set('obs', S); listar(); pintar(); }
  LIMPIEZA.push(() => { S.puestos = []; S.armas = []; vis = null; guardar(); c.querySelector('.hp-msg.dyn')?.remove(); });
  function listar() {
    lista.replaceChildren(...S.puestos.map((p, i) => { const d = h('div', 'hp-it'); d.append(h('b', null, `PO-${i + 1} · ${utm(...p.ll)} · ${p.h} m`)); const x = boton('✕', () => { S.puestos.splice(i, 1); vis = null; guardar(); }); d.append(x); return d; }),
      ...S.armas.map((a, i) => { const d = h('div', 'hp-it'); d.append(h('b', null, `${a.t} · ${miles(a.r)} m${a.i != null ? ` · sector ${a.i}°–${a.d}°` : ''}`)); d.append(boton('✕', () => { S.armas.splice(i, 1); guardar(); })); return d; }));
  }
  function pintar() {
    ponerCapa(); sub.obs.replaceChildren();
    if (vis) sub.obs.append(vis.img);
    S.armas.forEach(a => {
      const [x, y] = aEscena(...a.ll), mLat = 110574, rr = a.r / mLat, [, y2] = aEscena(a.ll[0], a.ll[1] + rr), R = Math.abs(y - y2);
      if (a.i != null && a.d != null) {
        const a0 = (a.i - 90) * D2R, a1 = ((a.d < a.i ? a.d + 360 : a.d) - 90) * D2R, big = (a1 - a0) > Math.PI ? 1 : 0;
        sv(sub.obs, 'path', { d: `M${x} ${y}L${x + R * Math.cos(a0)} ${y + R * Math.sin(a0)}A${R} ${R} 0 ${big} 1 ${x + R * Math.cos(a1)} ${y + R * Math.sin(a1)}Z`, fill: '#C0392B', 'fill-opacity': .12, stroke: '#C0392B', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' });
      } else sv(sub.obs, 'circle', { cx: x, cy: y, r: R, fill: '#C0392B', 'fill-opacity': .07, stroke: '#C0392B', 'stroke-width': 2, 'stroke-dasharray': '8 4', 'vector-effect': 'non-scaling-stroke' });
      marca(sub.obs, a.ll, a.t.split(' ')[0].toUpperCase() + ' ' + miles(a.r) + ' m', '#C0392B', 'x');
    });
    S.puestos.forEach((p, i) => marca(sub.obs, p.ll, 'PO-' + (i + 1), '#0B1D33', 'po'));
  }
  async function calcular() {
    if (!S.puestos.length) { mensaje(c, 'Agrega al menos un puesto de observación.', true); return; }
    soltar(); mensaje(c, 'Calculando la intervisibilidad…');
    const D = await (window.EMTE_CARGAR_DEM ? window.EMTE_CARGAR_DEM() : Promise.reject()).then(() => window.EMTE_DEM()).catch(() => null);
    if (!D) { mensaje(c, 'No se pudo cargar el modelo de elevación.', true); return; }
    setTimeout(() => { vis = cobertura(D, S.puestos); pintar(); mensaje(c, `Terreno visible desde al menos un puesto: <b>${dec(vis.km2v)} km²</b> de ${dec(vis.km2t)} km² (${dec(vis.km2v / vis.km2t * 100, 0)} %). Visto por 2 o más puestos: ${dec(vis.km2m)} km². <b>Ángulos muertos</b> (en rojo): ${dec(vis.km2t - vis.km2v)} km².`); window.EMTE_HP_EVENTO?.('obs'); }, 20);
  }
  listar(); pintar();
})();
function zDem(D, lon, lat) { const fx = (lon - D.x0) / D.dx - .5, fy = (D.y0 - lat) / D.dy - .5; if (fx < 0 || fy < 0 || fx > D.w - 1 || fy > D.h - 1) return null; const x = Math.floor(fx), y = Math.floor(fy), tx = fx - x, ty = fy - y, Z = D.z, W = D.w, x1 = Math.min(x + 1, W - 1), y1 = Math.min(y + 1, D.h - 1); return (Z[y * W + x] * (1 - tx) + Z[y * W + x1] * tx) * (1 - ty) + (Z[y1 * W + x] * (1 - tx) + Z[y1 * W + x1] * tx) * ty; }
function cobertura(D, puestos) {
  // rejilla común (90 m) que cubre todos los radios
  const lon0 = Math.min(...puestos.map(p => p.ll[0] - p.r * 1000 / (111320 * Math.cos(p.ll[1] * D2R)))), lon1 = Math.max(...puestos.map(p => p.ll[0] + p.r * 1000 / (111320 * Math.cos(p.ll[1] * D2R))));
  const lat0 = Math.min(...puestos.map(p => p.ll[1] - p.r * 1000 / 110574)), lat1 = Math.max(...puestos.map(p => p.ll[1] + p.r * 1000 / 110574));
  const cel = 90, mLon = 111320 * Math.cos((lat0 + lat1) / 2 * D2R), mLat = 110574, w = Math.ceil((lon1 - lon0) * mLon / cel), hh = Math.ceil((lat1 - lat0) * mLat / cel);
  const cuenta = new Uint8Array(w * hh), radio = new Uint8Array(w * hh), kR = 1 - .13, Rt = 6371000, LAGO = 3808;
  for (const p of puestos) {
    const [lon, lat] = p.ll, z0 = zDem(D, lon, lat); if (z0 == null) continue; const ojo = z0 + p.h, R = p.r * 1000, PASO = 45, RAYOS = 1080, ml = 111320 * Math.cos(lat * D2R), visto = new Uint8Array(w * hh);
    for (let a = 0; a < RAYOS; a++) {
      const ang = a / RAYOS * 2 * Math.PI, sx = Math.sin(ang), sy = Math.cos(ang); let maxP = -Infinity;
      for (let d = PASO; d <= R; d += PASO) {
        const lo = lon + sx * d / ml, la = lat + sy * d / mLat, zz = zDem(D, lo, la); if (zz == null) break;
        const zt = (zz <= LAGO ? LAGO : zz) - d * d / (2 * Rt) * kR, pS = (zt - ojo) / d, pO = (zt + 1.7 - ojo) / d;
        const gi = Math.floor((lo - lon0) * mLon / cel), gj = Math.floor((lat1 - la) * mLat / cel); if (gi < 0 || gj < 0 || gi >= w || gj >= hh) continue; const k = gj * w + gi;
        radio[k] = 1; if (pO >= maxP) visto[k] = 1; if (pS > maxP) maxP = pS;
      }
    }
    for (let k = 0; k < visto.length; k++) cuenta[k] += visto[k];
  }
  const cv = document.createElement('canvas'); cv.width = w; cv.height = hh; const ctx = cv.getContext('2d'), im = ctx.createImageData(w, hh); let nv = 0, nm = 0, nt = 0;
  for (let k = 0; k < w * hh; k++) { if (!radio[k]) continue; nt++; const o = k * 4; if (cuenta[k] >= 2) { nm++; nv++; im.data.set([20, 120, 55, 165], o); } else if (cuenta[k] === 1) { nv++; im.data.set([46, 160, 80, 130], o); } else im.data.set([170, 35, 35, 120], o); }
  ctx.putImageData(im, 0, 0);
  const [ax, ay] = aEscena(lon0, lat1), [bx, by] = aEscena(lon0 + w * cel / mLon, lat1 - hh * cel / mLat), img = sv(null, 'image', { x: ax, y: ay, width: bx - ax, height: by - ay, preserveAspectRatio: 'none', href: cv.toDataURL('image/png') });
  img.style.imageRendering = 'pixelated'; img.setAttribute('pointer-events', 'none');
  const a = cel * cel / 1e6; return { img, km2v: nv * a, km2m: nm * a, km2t: nt * a };
}

/* =====================================================================================================
   4. CUBIERTA Y ENCUBRIMIENTO
   ===================================================================================================== */
const PAL_CUB = { 1: '#1F6F3B', 2: '#9CCC65', 3: '#E8D9B5', 4: '#6D6D6D', 5: '#4A86C8', 6: '#8D4A24' };
(function cubierta() {
  const c = seccion('cub', 'Cubierta y encubrimiento', 'Sentinel-2 2026');
  c.innerHTML = `<p><b>Encubrimiento:</b> protección contra la observación (vegetación, edificaciones). <b>Cubierta:</b> protección contra el fuego (edificaciones, quebradas). Clasificación de la imagen Sentinel-2 del 08/08/2026 (época seca) con la mancha urbana, el agua y las quebradas del geovisor.</p>`;
  const ver = h('label'), cb = inp('checkbox'); ver.append(cb, document.createTextNode('Mostrar en el mapa')); c.append(ver);
  const modo = sel([['cob', 'Tipo de cobertura'], ['enc', 'Encubrimiento (contra la observación)'], ['cub', 'Cubierta (contra el fuego)']], 'cob'), opa = inp('range', 70, { min: 20, max: 100 });
  const f = h('div', 'fila'); f.append(rotulo('VER COMO', modo), rotulo('OPACIDAD', opa)); c.append(f);
  const ley = h('table', 'hp-tabla hp-cub-t'); c.append(ley);
  { const st = h('style'); st.textContent = '.hp-cub-t{table-layout:auto;width:100%}.hp-cub-t th,.hp-cub-t td{font-size:10px!important;word-break:normal!important;overflow-wrap:normal!important;hyphens:none;padding:3px 4px!important;vertical-align:top}.hp-cub-t td:nth-child(2){min-width:92px}'; document.head.append(st); }   // 10-11-2026: tabla legible
  let img = null, on = false;
  const COLE = { Bueno: '#1E8B4C', Escaso: '#E3B23C', Nulo: '#C0392B', Buena: '#1E8B4C', Nula: '#C0392B' };
  async function pintar() {
    sub.cub.replaceChildren(); if (!on) return;
    let C; try { C = await cargarCub(); } catch (e) { mensaje(c, 'No se encontró data/cubierta_omasuyos.png.', true); return; }
    const cv = document.createElement('canvas'); cv.width = C.w; cv.height = C.h; const ctx = cv.getContext('2d'), im = ctx.createImageData(C.w, C.h);
    const col = {}; for (const [k, cl] of Object.entries(C.meta.clases)) { const hx = modo.value === 'cob' ? PAL_CUB[k] : COLE[modo.value === 'enc' ? cl.encubrimiento : cl.cubierta]; col[k] = [1, 3, 5].map(i => parseInt(hx.slice(i, i + 2), 16)); }
    // 10-11-2026: pintado rápido con una tabla de colores (antes: un arreglo nuevo por píxel; lento en la tablet)
    const LUT = new Uint32Array(256), px = new Uint32Array(im.data.buffer), rgba = (c, a) => ((a << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
    for (const k in col) { const v = +k; LUT[v] = v === 3 && modo.value !== 'cob' ? rgba(col[3], 70) : rgba(col[k], 230); }
    for (let n = 0, V = C.v; n < V.length; n++) { const v = V[n]; if (v !== 255) px[n] = LUT[v]; }
    ctx.putImageData(im, 0, 0);
    const [ax, ay] = aEscena(...C.meta.nw), [bx, by] = aEscena(...C.meta.se);
    img = sv(sub.cub, 'image', { x: ax, y: ay, width: bx - ax, height: by - ay, preserveAspectRatio: 'none', href: cv.toDataURL('image/png'), opacity: opa.value / 100, 'pointer-events': 'none' });
    ponerCapa(); if (capa.firstChild !== sub.cub) capa.prepend(sub.cub);
    ley.innerHTML = '<tr><th></th><th>Cobertura</th><th>km²</th><th>Encubr.</th><th>Cubierta</th></tr>' + Object.entries(C.meta.clases).map(([k, cl]) => `<tr><td><i style="display:inline-block;width:14px;height:10px;border-radius:2px;background:${PAL_CUB[k]}"></i></td><td>${esc(cl.nombre)}</td><td>${dec(cl.km2)}</td><td style="color:${COLE[cl.encubrimiento]};font-weight:700">${cl.encubrimiento}</td><td style="color:${COLE[cl.cubierta]};font-weight:700">${cl.cubierta}</td></tr>`).join('');
    mensaje(c, esc(C.meta.nota));
  }
  cb.onchange = () => { on = cb.checked; pintar(); };
  modo.onchange = pintar; opa.oninput = () => img && img.setAttribute('opacity', opa.value / 100);
  window.EMTE_HP_CUB = v => { cb.checked = !!v; on = !!v; pintar(); };
  window.EMTE_HP_CUB_ON = () => on;
  LIMPIEZA.push(() => { cb.checked = false; on = false; pintar(); });
  cargarCub().then(C => { ley.innerHTML = '<tr><th></th><th>Cobertura</th><th>km²</th><th>Encubr.</th><th>Cubierta</th></tr>' + Object.entries(C.meta.clases).map(([k, cl]) => `<tr><td><i style="display:inline-block;width:14px;height:10px;border-radius:2px;background:${PAL_CUB[k]}"></i></td><td>${esc(cl.nombre)}</td><td>${dec(cl.km2)}</td><td style="color:${COLE[cl.encubrimiento]};font-weight:700">${cl.encubrimiento}</td><td style="color:${COLE[cl.cubierta]};font-weight:700">${cl.cubierta}</td></tr>`).join(''); }).catch(() => {});
})();

/* =====================================================================================================
   5. LUZ Y CLIMA
   ===================================================================================================== */
// Posición del Sol y la Luna (algoritmos astronómicos simplificados, precisión de 1–2 minutos)
const J1970 = 2440588, J2000 = 2451545, dayMs = 864e5, e0 = D2R * 23.4397;
const toJ = d => d.valueOf() / dayMs - .5 + J1970, fromJ = j => new Date((j + .5 - J1970) * dayMs), toDays = d => toJ(d) - J2000;
const decl = (l, b) => Math.asin(Math.sin(b) * Math.cos(e0) + Math.cos(b) * Math.sin(e0) * Math.sin(l));
const ra = (l, b) => Math.atan2(Math.sin(l) * Math.cos(e0) - Math.tan(b) * Math.sin(e0), Math.cos(l));
const altitud = (H, phi, dc) => Math.asin(Math.sin(phi) * Math.sin(dc) + Math.cos(phi) * Math.cos(dc) * Math.cos(H));
const sidereal = (d, lw) => D2R * (280.16 + 360.9856235 * d) - lw;
const solM = d => D2R * (357.5291 + .98560028 * d), eclLon = M => M + D2R * (1.9148 * Math.sin(M) + .02 * Math.sin(2 * M) + .0003 * Math.sin(3 * M)) + D2R * 102.9372 + Math.PI;
function horasSol(fecha, lat, lon) {
  const lw = D2R * -lon, phi = D2R * lat, d = toDays(fecha), n = Math.round(d - .0009 - lw / (2 * Math.PI)), ds = .0009 + lw / (2 * Math.PI) + n;
  const M = solM(ds), L = eclLon(M), dc = decl(L, 0), Jnoon = J2000 + ds + .0053 * Math.sin(M) - .0069 * Math.sin(2 * L);
  const H = (h0) => { const w = Math.acos((Math.sin(h0) - Math.sin(phi) * Math.sin(dc)) / (Math.cos(phi) * Math.cos(dc))); const a = .0009 + (w + lw) / (2 * Math.PI) + n; const Jset = J2000 + a + .0053 * Math.sin(M) - .0069 * Math.sin(2 * L); return [fromJ(Jnoon - (Jset - Jnoon)), fromJ(Jset)]; };
  const [na, nf] = H(-12 * D2R), [ca, cf] = H(-6 * D2R), [sa, sp] = H(-.833 * D2R);
  return { BMNT: na, crepCivil: ca, salida: sa, mediodia: fromJ(Jnoon), puesta: sp, finCivil: cf, EENT: nf };
}
function luna(fecha, lat, lon) {
  const pos = dt => { const d = toDays(dt), L = D2R * (218.316 + 13.176396 * d), M = D2R * (134.963 + 13.064993 * d), F = D2R * (93.272 + 13.22935 * d), l = L + D2R * 6.289 * Math.sin(M), b = D2R * 5.128 * Math.sin(F), dist = 385001 - 20905 * Math.cos(M);
    const lw = D2R * -lon, H = sidereal(d, lw) - ra(l, b), dc = decl(l, b); let al = altitud(H, D2R * lat, dc); al += D2R * .017 / Math.tan(al + D2R * 10.26 / (al + D2R * 5.10)); return { al, dist, l, b }; };
  const ilum = dt => { const d = toDays(dt), M = solM(d), L = eclLon(M), s = { d: decl(L, 0), r: ra(L, 0) }, m = pos(dt), md = decl(m.l, m.b), mr = ra(m.l, m.b), sdist = 149598000;
    const phi = Math.acos(Math.sin(s.d) * Math.sin(md) + Math.cos(s.d) * Math.cos(md) * Math.cos(s.r - mr)), inc = Math.atan2(sdist * Math.sin(phi), m.dist - sdist * Math.cos(phi)), ang = Math.atan2(Math.cos(s.d) * Math.sin(s.r - mr), Math.sin(s.d) * Math.cos(md) - Math.cos(s.d) * Math.sin(md) * Math.cos(s.r - mr));
    return { frac: (1 + Math.cos(inc)) / 2, fase: .5 + .5 * inc * (ang < 0 ? -1 : 1) / Math.PI }; };
  const t0 = new Date(fecha); t0.setHours(0, 0, 0, 0); const hc = .133 * D2R; let h0 = pos(t0).al - hc, sale = null, pone = null;
  for (let i = 1; i <= 24 && !(sale && pone); i++) { const t = new Date(t0.valueOf() + i * 36e5), h1 = pos(t).al - hc; if (h0 < 0 && h1 >= 0 && !sale) sale = new Date(t.valueOf() - 36e5 * h1 / (h1 - h0)); if (h0 > 0 && h1 <= 0 && !pone) pone = new Date(t.valueOf() - 36e5 * h1 / (h1 - h0)); h0 = h1; }
  const il = ilum(new Date(t0.valueOf() + 12 * 36e5)); return { sale, pone, ...il };
}
const nombreFase = f => f < .03 || f > .97 ? 'Luna nueva' : f < .22 ? 'Creciente' : f < .28 ? 'Cuarto creciente' : f < .47 ? 'Creciente gibosa' : f < .53 ? 'Luna llena' : f < .72 ? 'Menguante gibosa' : f < .78 ? 'Cuarto menguante' : 'Menguante';
// Normales climáticas: estación El Alto (4.058 m), SENAMHI – Deutscher Wetterdienst (Wikipedia «El Alto», clima). Referencia regional para el altiplano de Omasuyos (3.810–4.500 m).
const CLIMA = [[14.3, 9.3, 4.4, 133.7, 20.7, 66], [14.3, 9.0, 4.4, 104.7, 15.8, 72], [14.2, 8.9, 3.6, 71.7, 14.2, 67], [14.4, 8.8, 1.0, 31.7, 9.8, 59], [14.4, 8.2, -1.9, 14.3, 3.6, 48], [14.0, 7.3, -4.3, 5.1, 2.8, 42], [13.5, 6.8, -4.4, 7.1, 2.8, 43], [13.7, 8.2, -3.0, 15.2, 5.1, 42], [15.3, 8.7, -1.0, 35.5, 8.2, 48], [15.3, 10.0, 1.5, 38.1, 10.4, 49], [17.0, 10.5, 2.1, 50.5, 11.5, 51], [15.7, 9.7, 3.6, 94.9, 15.5, 60]];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
(function luzClima() {
  const c = seccion('luz', 'Luz y clima', 'día de la operación');
  c.innerHTML = `<p>Crepúsculo náutico (BMNT / EENT), crepúsculo civil, salida y puesta del Sol y de la Luna e iluminación lunar para la fecha y el lugar de la operación (hora de Bolivia, UTC−4). Clima típico del mes en el altiplano.</p>`;
  const hoy = new Date(); const f = inp('date', hoy.toISOString().slice(0, 10)), lug = sel([['-68.6851,-16.0431', 'Achacachi'], ['-68.6067,-16.1848', 'Huarina (EMTE)'], ['-68.8711,-15.9058', 'Ancoraimes'], ['-68.8167,-16.0833', 'Santiago de Huata'], ['centro', 'Centro del mapa']], '-68.6851,-16.0431');
  const dias = sel([['1', '1 día'], ['3', '3 días'], ['7', '7 días']], '3');
  const f1 = h('div', 'fila'); f1.append(rotulo('FECHA', f), rotulo('DÍAS', dias)); c.append(f1, rotulo('LUGAR', lug));
  const out = h('div'); c.append(out); const fb = h('div', 'hp-b'); fb.append(boton('Descargar tabla (CSV)', () => descargar('luz_' + f.value + '.csv', csv(ultimas), 'text/csv'))); c.append(fb);
  let ultimas = [];
  function calcular() {
    let ll = lug.value === 'centro' ? (() => { const r = svg.getBoundingClientRect(), p = new DOMPoint(r.left + r.width / 2, r.top + r.height / 2).matrixTransform(scene.getScreenCTM().inverse()); return deEscena(p.x, p.y); })() : lug.value.split(',').map(Number);
    const filas = [['Fecha', 'Inicio crep. náutico (BMNT)', 'Inicio crep. civil', 'Salida del sol', 'Mediodía', 'Puesta del sol', 'Fin crep. civil', 'Fin crep. náutico (EENT)', 'Horas de luz', 'Salida de la luna', 'Puesta de la luna', 'Fase', 'Iluminación %']];
    const base = new Date(f.value + 'T12:00:00-04:00'); let html = '<table class="hp-tabla"><tr><th>Día</th><th>BMNT</th><th>☀↑</th><th>☀↓</th><th>EENT</th><th>Luna</th></tr>';
    for (let i = 0; i < +dias.value; i++) {
      const d = new Date(base.valueOf() + i * dayMs), s = horasSol(d, ll[1], ll[0]), L = luna(d, ll[1], ll[0]), luz = (s.puesta - s.salida) / 36e5;
      const t = x => x && !isNaN(x) ? hhmm(new Date(x.valueOf() - 4 * 36e5 - new Date().getTimezoneOffset() * -6e4)) : '—';
      const tt = x => x && !isNaN(x) ? new Date(x).toLocaleTimeString('es-BO', { timeZone: 'America/La_Paz', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }) : '—';
      filas.push([fechaTxt(d), tt(s.BMNT), tt(s.crepCivil), tt(s.salida), tt(s.mediodia), tt(s.puesta), tt(s.finCivil), tt(s.EENT), dec(luz), tt(L.sale), tt(L.pone), nombreFase(L.fase), Math.round(L.frac * 100)]);
      html += `<tr><td>${d.toLocaleDateString('es-BO', { weekday: 'short', day: '2-digit', month: '2-digit' })}</td><td>${tt(s.BMNT)}</td><td>${tt(s.salida)}</td><td>${tt(s.puesta)}</td><td>${tt(s.EENT)}</td><td>${nombreFase(L.fase)} ${Math.round(L.frac * 100)} %<br><small>↑ ${tt(L.sale)} ↓ ${tt(L.pone)}</small></td></tr>`;
      if (i === 0) ESTADO.luz = { fecha: f.value, lugar: lug.options[lug.selectedIndex].text, s, L, luz, tt };
    }
    ultimas = filas;
    const m = new Date(f.value + 'T12:00:00').getMonth(), C = CLIMA[m];
    const efectos = []; if (C[2] < 0) efectos.push('heladas nocturnas: protección del personal, arranque de motores y agua'); if (C[3] > 60) efectos.push('época de lluvias: suelos blandos y crecida de ríos, más terreno restringido para vehículos'); else efectos.push('época seca: suelos firmes y polvo que delata el movimiento'); if (C[5] < 50) efectos.push('aire seco y radiación alta: visibilidad muy buena, riesgo de deshidratación'); efectos.push('altitud de 3.800–4.500 m: aclimatación del personal y menor potencia de motores');
    html += '</table>';
    html += `<h4>Clima típico de ${MESES[m]}</h4><table class="hp-tabla"><tr><td>Temperatura máx. / media / mín.</td><td>${dec(C[0])} / ${dec(C[1])} / ${dec(C[2])} °C</td></tr><tr><td>Precipitación</td><td>${dec(C[3])} mm en ${dec(C[4], 0)} días</td></tr><tr><td>Humedad relativa</td><td>${C[5]} %</td></tr><tr><td>Efectos en la operación</td><td>${efectos.join('; ')}.</td></tr></table><p style="font-size:10px">Fuente del clima: normales de la estación El Alto (SENAMHI – Servicio Meteorológico Alemán), referencia regional para el altiplano de Omasuyos. Horas calculadas con algoritmos astronómicos (±2 min).</p>`;
    out.innerHTML = html; ESTADO.clima = { mes: MESES[m], C, efectos }; window.EMTE_HP_EVENTO?.('luz');
  }
  [f, lug, dias].forEach(e => e.onchange = calcular); calcular();
})();

/* =====================================================================================================
   6. CÁLCULO DE MARCHAS
   ===================================================================================================== */
(function marchas() {
  const c = seccion('mar', 'Cálculo de marchas', 'columna y horario');
  c.innerHTML = `<p>Calcula la <b>distancia de la columna</b>, el <b>tiempo de paso</b> y el <b>horario</b> de cabeza y cola en el punto inicial (PI), los puntos de control (PC) y el punto de liberación (PL). El itinerario puede ser una avenida de la herramienta 1 o uno que dibujes en el mapa.</p>`;
  const S = Object.assign({ veh: 30, dist: 50, largo: 7, unid: 3, inter: 2, vel: 30, alto: 10, hora: '05:00', fecha: new Date().toISOString().slice(0, 10), pc: 5 }, ESTADO.marcha || {});
  const it = sel([['ruta', 'Ruta por la red vial (pestaña RUTAS)'], ['aa0', 'Avenida AA-1'], ['aa1', 'Avenida AA-2'], ['aa2', 'Avenida AA-3'], ['dib', 'Itinerario dibujado en el mapa']], 'ruta');
  c.append(rotulo('ITINERARIO', it));
  const campos = [['veh', 'VEHÍCULOS', 1], ['dist', 'DISTANCIA ENTRE VEHÍCULOS (m)', 5], ['largo', 'LARGO DE CADA VEHÍCULO (m)', 1], ['unid', 'UNIDADES DE MARCHA', 1], ['inter', 'INTERVALO ENTRE UNIDADES (min)', .5], ['vel', 'VELOCIDAD DE MARCHA (km/h)', 1], ['alto', 'ALTO HORARIO (min por hora)', 1], ['pc', 'PUNTO DE CONTROL CADA (km)', 1]];
  const I = {}; const g = h('div', 'fila'); campos.forEach(([k, t, st]) => { I[k] = inp('number', S[k], { min: 0, step: st }); g.append(rotulo(t, I[k])); }); c.append(g);
  I.fecha = inp('date', S.fecha); I.hora = inp('time', S.hora); const g2 = h('div', 'fila'); g2.append(rotulo('FECHA', I.fecha), rotulo('HORA DE PASO DE LA CABEZA POR EL PI', I.hora)); c.append(g2);
  let dib = []; const fb = h('div', 'hp-b'); fb.append(boton('Dibujar itinerario', () => { dib = []; it.value = 'dib'; elegir('Toca el mapa en cada punto del itinerario (Esc para terminar)', ll => { dib.push(ll); calcular(); }, true); }), boton('CALCULAR', calcular, 'pri')); c.append(fb);
  const out = h('div'); c.append(out);
  function rutaVial() {   // la ruta calculada en la pestaña RUTAS (trazo azul del grupo #route)
    const ps = [...document.querySelectorAll('#route path.rt')].map(p => (p.getAttribute('d') || '').slice(1).split('L').map(q => q.split(/[ ,]/).map(Number)).filter(q => q.length === 2 && isFinite(q[0])));
    const larga = ps.sort((a, b) => b.length - a.length)[0]; return larga ? larga.map(([x, y]) => deEscena(x, y)) : [];
  }
  function itinerario() { if (it.value === 'dib') return dib; if (it.value === 'ruta') return rutaVial(); const r = ESTADO.aa?.rutas?.[+it.value.slice(2)]; return r ? r.coords : []; }
  function calcular() {
    Object.keys(I).forEach(k => S[k] = I[k].type === 'number' ? +I[k].value : I[k].value); ESTADO.marcha = S; LS.set('marcha', S);
    const P = itinerario(); sub.mar.replaceChildren();
    if (P.length < 2) { out.innerHTML = '<div class="hp-msg">' + (it.value === 'ruta' ? 'Calcula primero una ruta en la pestaña RUTAS (origen, destino y «Calcular ruta»).' : 'Calcula primero las avenidas (herramienta 1) o dibuja el itinerario.') + '</div>'; return; }
    const acum = [0]; for (let i = 1; i < P.length; i++) acum.push(acum[i - 1] + kmH(P[i - 1], P[i])); const L = acum[acum.length - 1];
    const porUnidad = Math.ceil(S.veh / Math.max(1, S.unid));
    const longUnidad = (porUnidad - 1) * S.dist + porUnidad * S.largo, longCol = (S.unid * longUnidad + (S.unid - 1) * (S.inter / 60 * S.vel * 1000)) / 1000;   // km
    const factor = 60 / Math.max(1, 60 - S.alto);   // altos horarios
    const tPasoMin = longCol / S.vel * 60;
    const t0 = new Date(S.fecha + 'T' + S.hora + ':00');
    const horaEn = km => new Date(t0.valueOf() + km / S.vel * factor * 36e5);
    const puntos = [{ n: 'PI', km: 0 }]; for (let k = S.pc; k < L - .5; k += S.pc) puntos.push({ n: 'PC-' + puntos.length, km: k }); puntos.push({ n: 'PL', km: L });
    const pos = km => { let i = acum.findIndex(a => a >= km); if (i <= 0) return P[0]; const f = (km - acum[i - 1]) / (acum[i] - acum[i - 1] || 1); return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f]; };
    const filas = puntos.map(p => { const cab = horaEn(p.km), col = new Date(cab.valueOf() + tPasoMin * 6e4); return { ...p, ll: pos(p.km), cab, col }; });
    ESTADO.marcha.res = { L, longCol, tPasoMin, filas: filas.map(f => ({ n: f.n, km: f.km, cab: hhmm(f.cab), col: hhmm(f.col), utm: utm(...f.ll) })), dur: (filas[filas.length - 1].col - filas[0].cab) / 36e5 };
    LS.set('marcha', ESTADO.marcha);
    out.innerHTML = `<table class="hp-tabla"><tr><td>Distancia del itinerario</td><td>${dec(L)} km</td></tr><tr><td>Distancia de la columna</td><td>${dec(longCol, 2)} km (${porUnidad} vehículos por unidad de marcha)</td></tr><tr><td>Tiempo de paso</td><td>${dec(tPasoMin, 0)} min</td></tr><tr><td>Duración total (cabeza en PI → cola en PL)</td><td>${dec(ESTADO.marcha.res.dur)} h, con altos de ${S.alto} min/h</td></tr></table>
<table class="hp-tabla" style="margin-top:6px"><tr><th>Punto</th><th>km</th><th>Cabeza</th><th>Cola</th><th>Coordenada</th></tr>${filas.map(f => `<tr><td><b>${f.n}</b></td><td>${dec(f.km)}</td><td>${hhmm(f.cab)}</td><td>${hhmm(f.col)}</td><td style="font-size:9.5px">${esc(utm(...f.ll))}</td></tr>`).join('')}</table>`;
    const fb2 = h('div', 'hp-b'); fb2.append(boton('Descargar horario (CSV)', () => descargar('horario_marcha.csv', csv([['Punto', 'km', 'Hora cabeza', 'Hora cola', 'Coordenada UTM'], ...filas.map(f => [f.n, dec(f.km), hhmm(f.cab), hhmm(f.col), utm(...f.ll)])]), 'text/csv'))); out.append(fb2);
    ponerCapa(); const d = 'M' + P.map(p => aEscena(...p).map(v => v.toFixed(2)).join(' ')).join('L');
    sv(sub.mar, 'path', { d, fill: 'none', stroke: '#0B1D33', 'stroke-width': 4, 'stroke-opacity': .8, 'vector-effect': 'non-scaling-stroke' });
    filas.forEach(f => marca(sub.mar, f.ll, f.n + ' ' + hhmm(f.cab), f.n === 'PI' ? '#1E8B4C' : f.n === 'PL' ? '#C0392B' : '#0B1D33'));
    window.EMTE_HP_EVENTO?.('mar');
  }
  Object.values(I).forEach(e => e.onchange = calcular); it.onchange = calcular;
  window.EMTE_HP_MARCHA = calcular;
  LIMPIEZA.push(() => { dib = []; sub.mar.replaceChildren(); out.replaceChildren(); if (ESTADO.marcha) { delete ESTADO.marcha.res; LS.set('marcha', ESTADO.marcha); } });
})();

/* =====================================================================================================
   7. LÍNEA DE TIEMPO (regla 1/3 – 2/3)
   ===================================================================================================== */
const PASOS = [['Recepción de la misión', 5], ['Orden preparatoria', 5], ['Análisis de la misión (PICB, terreno, enemigo, tiempo)', 25], ['Desarrollo y comparación de líneas de acción', 25], ['Decisión del comandante y plan', 15], ['Redacción y emisión de la orden de operaciones', 25]];
(function lineaTiempo() {
  const c = seccion('tl', 'Línea de tiempo', 'regla 1/3 – 2/3');
  c.innerHTML = `<p>Con la hora de recepción de la misión y la hora H, el comandante usa <b>1/3</b> del tiempo disponible para su planeamiento y deja <b>2/3</b> a las unidades subordinadas. Los pasos y sus porcentajes se pueden ajustar al reglamento.</p>`;
  const S = Object.assign({ rec: new Date(Date.now() + 36e5).toISOString().slice(0, 16), H: new Date(Date.now() + 26 * 36e5).toISOString().slice(0, 16), pasos: PASOS }, ESTADO.tl || {});
  const rec = inp('datetime-local', S.rec), H = inp('datetime-local', S.H); const f1 = h('div', 'fila'); f1.append(rotulo('RECEPCIÓN DE LA MISIÓN', rec), rotulo('HORA H', H)); c.append(f1);
  const tab = h('div', 'hp-lista'); c.append(h('h4', null, 'Pasos del tercio del comandante (%)'), tab);
  const out = h('div'); c.append(out);
  const fb = h('div', 'hp-b'); fb.append(boton('+ Paso', () => { S.pasos.push(['Nuevo paso', 5]); listar(); calcular(); }), boton('Descargar cronograma (CSV)', () => descargar('cronograma_planeamiento.csv', csv([['Actividad', 'Inicio', 'Fin', 'Duración (h)'], ...(ESTADO.tl?.filas || []).map(f => [f.t, f.i, f.f, dec(f.h)])]), 'text/csv'))); c.append(fb);
  function listar() { tab.replaceChildren(...S.pasos.map((p, i) => { const d = h('div', 'hp-it'), t = inp('text', p[0]), n = inp('number', p[1], { min: 1, max: 90 }); t.style.flex = '1'; n.style.width = '58px'; t.onchange = () => { p[0] = t.value; calcular(); }; n.onchange = () => { p[1] = +n.value; calcular(); }; d.append(t, n, boton('✕', () => { S.pasos.splice(i, 1); listar(); calcular(); })); return d; })); }
  function calcular() {
    S.rec = rec.value; S.H = H.value; const t0 = new Date(S.rec), tH = new Date(S.H), tot = (tH - t0) / 36e5;
    if (!(tot > 0)) { out.innerHTML = '<div class="hp-msg err">La hora H debe ser posterior a la recepción de la misión.</div>'; return; }
    const tercio = tot / 3, suma = S.pasos.reduce((a, p) => a + (+p[1] || 0), 0) || 1; let t = t0.valueOf(); const filas = [];
    S.pasos.forEach(p => { const dur = tercio * (+p[1] || 0) / suma; filas.push({ t: p[0], ini: new Date(t), fin: new Date(t + dur * 36e5), h: dur, tipo: 'cdte' }); t += dur * 36e5; });
    const finCdte = new Date(t0.valueOf() + tercio * 36e5);
    filas.push({ t: 'Planeamiento y preparación de las unidades subordinadas (2/3)', ini: finCdte, fin: tH, h: tot - tercio, tipo: 'sub' });
    const f = d => d.toLocaleString('es-BO', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    ESTADO.tl = { rec: S.rec, H: S.H, pasos: S.pasos, filas: filas.map(x => ({ t: x.t, i: f(x.ini), f: f(x.fin), h: x.h })), total: tot }; LS.set('tl', ESTADO.tl);
    // gráfico
    const W = 300, Hh = 26 + filas.length * 22 + 26, X = d => 8 + (d - t0) / (tH - t0) * (W - 16);
    let g = `<svg class="hp-tl" viewBox="0 0 ${W} ${Hh}" xmlns="${NS}"><rect x="8" y="8" width="${(W - 16) / 3}" height="${Hh - 30}" fill="#0B1D33" opacity=".06"/><text x="${8 + (W - 16) / 6}" y="18" font-size="8" text-anchor="middle" fill="#0B1D33" font-weight="700">1/3 COMANDANTE</text><text x="${8 + (W - 16) * 2 / 3}" y="18" font-size="8" text-anchor="middle" fill="#7B4F12" font-weight="700">2/3 UNIDADES SUBORDINADAS</text>`;
    filas.forEach((x, i) => { const y = 24 + i * 22; g += `<rect x="${X(x.ini)}" y="${y}" width="${Math.max(2, X(x.fin) - X(x.ini))}" height="14" rx="3" fill="${x.tipo === 'sub' ? '#B79A5B' : '#12294A'}"/><text x="${Math.min(X(x.ini) + 2, W - 150)}" y="${y + 21}" font-size="6.5" fill="#3A4A60">${esc(x.t.slice(0, 48))}</text>`; });
    const L = ESTADO.luz; if (L && L.fecha === S.H.slice(0, 10)) [['BMNT', L.s.BMNT], ['EENT', L.s.EENT]].forEach(([n, d]) => { if (d > t0 && d < tH) g += `<line x1="${X(d)}" x2="${X(d)}" y1="8" y2="${Hh - 18}" stroke="#C0392B" stroke-dasharray="3 2"/><text x="${X(d)}" y="${Hh - 10}" font-size="7" text-anchor="middle" fill="#C0392B">${n}</text>`; });
    g += `<text x="8" y="${Hh - 2}" font-size="7" fill="#5A6B80">${esc(f(t0))}</text><text x="${W - 8}" y="${Hh - 2}" font-size="7" text-anchor="end" fill="#C0392B" font-weight="700">H ${esc(f(tH))}</text></svg>`;
    out.innerHTML = g + `<table class="hp-tabla"><tr><th>Actividad</th><th>Inicio</th><th>Fin</th><th>h</th></tr>${ESTADO.tl.filas.map(x => `<tr><td>${esc(x.t)}</td><td>${x.i}</td><td>${x.f}</td><td>${dec(x.h)}</td></tr>`).join('')}<tr><td><b>Tiempo disponible</b></td><td colspan="3"><b>${dec(tot)} h</b> · comandante ${dec(tercio)} h · subordinados ${dec(tot - tercio)} h</td></tr></table>`;
    window.EMTE_HP_EVENTO?.('tl');
  }
  rec.onchange = calcular; H.onchange = calcular; listar(); calcular();
})();

/* =====================================================================================================
   8. ÁREAS DE INTERÉS (AIN) Y MATRIZ DE EVENTOS
   ===================================================================================================== */
(function areasInteres() {
  const c = seccion('ain', 'Áreas de interés', 'matriz de eventos');
  c.innerHTML = `<p>Dibuja las <b>áreas de interés (AIN)</b> donde esperas ver la actividad del enemigo (por ejemplo, sobre las avenidas de aproximación). Cada una lleva qué indicador observar, cuándo y quién lo observa. Con ellas se arma la <b>matriz de eventos</b>.</p>`;
  const L = ESTADO.ain; let borrador = [];
  const fb = h('div', 'hp-b'); const bN = boton('+ Dibujar AIN', () => { borrador = []; pintar(); elegir('Toca los vértices del AIN; pulsa Terminar o Esc', ll => { borrador.push(ll); pintar(); }, true); eleccion.fin = terminar; }), bT = boton('Terminar AIN', () => { soltar(); terminar(); }, 'pri');
  fb.append(bN, bT); c.append(fb);
  const lista = h('div'); lista.style.cssText = 'display:grid;gap:7px'; c.append(lista);
  const fb2 = h('div', 'hp-b'); fb2.append(boton('Descargar matriz (CSV)', () => descargar('matriz_de_eventos.csv', csv([['AIN', 'Avenida', 'Actividad / indicador', 'No antes de', 'No después de', 'Medio de obtención', 'Punto de decisión / observaciones', 'Centro UTM'], ...L.map(a => [a.n, a.aa, a.ind, a.na, a.nd, a.medio, a.obs, utm(...centroide(a.p))])]), 'text/csv')), boton('Ver matriz', verMatriz)); c.append(fb2);
  const mat = h('div'); c.append(mat);
  function terminar() { if (borrador.length >= 3) { L.push({ n: 'AIN ' + (L.length + 1), p: borrador.map(p => [+p[0].toFixed(5), +p[1].toFixed(5)]), aa: ESTADO.aa ? 'AA-1' : '', ind: '', na: '', nd: '', medio: '', obs: '' }); guardar(); } else if (borrador.length) mensaje(c, 'Un AIN necesita al menos 3 vértices.', true); borrador = []; pintar(); }
  function guardar() { LS.set('ain', L); listar(); pintar(); window.EMTE_HP_EVENTO?.('ain'); }
  function listar() {
    lista.replaceChildren(...L.map((a, i) => {
      const d = h('div', 'hp-ruta'), cab = h('div', 'cab'); cab.append(h('b', null, a.n), h('span', null, a.aa || '—')); cab.querySelector('span').style.background = '#D35400'; cab.querySelector('span').style.color = '#fff';
      const b = h('div', 'hp-c'); b.style.padding = '8px';
      const nm = inp('text', a.n), aa = sel([['', '—'], ['AA-1', 'AA-1'], ['AA-2', 'AA-2'], ['AA-3', 'AA-3']], a.aa), ind = h('textarea'); ind.value = a.ind; ind.placeholder = 'Ej.: paso de vehículos blindados, reconocimiento del enemigo…';
      const na = inp('text', a.na, { placeholder: 'H-6' }), nd = inp('text', a.nd, { placeholder: 'H+2' }), me = inp('text', a.medio, { placeholder: 'PO-1, patrulla, dron…' }), ob = inp('text', a.obs, { placeholder: 'Punto de decisión, reacción…' });
      const f1 = h('div', 'fila'); f1.append(rotulo('NOMBRE', nm), rotulo('AVENIDA', aa)); const f2 = h('div', 'fila'); f2.append(rotulo('NO ANTES DE', na), rotulo('NO DESPUÉS DE', nd));
      b.append(f1, rotulo('ACTIVIDAD / INDICADOR', ind), f2, rotulo('MEDIO DE OBTENCIÓN', me), rotulo('PUNTO DE DECISIÓN / OBSERVACIONES', ob));
      const bb = h('div', 'hp-b'); bb.append(boton('Ver en el mapa', () => { const c2 = centroide(a.p); window.EMTE_FICHA?.centrar(c2[0], c2[1]); }), boton('Eliminar', () => { L.splice(i, 1); guardar(); })); b.append(bb);
      [[nm, 'n'], [aa, 'aa'], [ind, 'ind'], [na, 'na'], [nd, 'nd'], [me, 'medio'], [ob, 'obs']].forEach(([e, k]) => e.onchange = () => { a[k] = e.value; LS.set('ain', L); if (k === 'n' || k === 'aa') { listar(); pintar(); } });
      b.hidden = i < L.length - 1; cab.onclick = () => b.hidden = !b.hidden; d.append(cab, b); return d;
    }));
  }
  function verMatriz() { mat.innerHTML = L.length ? `<table class="hp-tabla"><tr><th>AIN</th><th>AA</th><th>Indicador</th><th>NA</th><th>ND</th><th>Medio</th></tr>${L.map(a => `<tr><td><b>${esc(a.n)}</b></td><td>${esc(a.aa)}</td><td>${esc(a.ind)}</td><td>${esc(a.na)}</td><td>${esc(a.nd)}</td><td>${esc(a.medio)}</td></tr>`).join('')}</table>` : '<div class="hp-msg">Todavía no hay áreas de interés.</div>'; }
  function pintar() {
    ponerCapa(); sub.ain.replaceChildren();
    const poli = (pts, cerrado, col) => sv(sub.ain, 'path', { d: 'M' + pts.map(p => aEscena(...p).map(v => v.toFixed(2)).join(' ')).join('L') + (cerrado ? 'Z' : ''), fill: cerrado ? col : 'none', 'fill-opacity': .14, stroke: col, 'stroke-width': 2.5, 'stroke-dasharray': '9 4', 'vector-effect': 'non-scaling-stroke' });
    L.forEach(a => { poli(a.p, true, '#D35400'); marca(sub.ain, centroide(a.p), a.n + (a.aa ? ' · ' + a.aa : ''), '#D35400', 'n'); });
    if (borrador.length) { poli(borrador, false, '#0B1D33'); borrador.forEach(p => marca(sub.ain, p, '', '#0B1D33')); }
  }
  LIMPIEZA.push(() => { L.length = 0; borrador = []; mat.replaceChildren(); guardar(); });
  listar(); pintar();
})();
function centroide(p) { return [p.reduce((a, q) => a + q[0], 0) / p.length, p.reduce((a, q) => a + q[1], 0) / p.length]; }

/* =====================================================================================================
   9. ORDEN DE OPERACIONES (5 párrafos)
   ===================================================================================================== */
(function ordenOperaciones() {
  const c = seccion('oo', 'Orden de operaciones', '5 párrafos');
  c.innerHTML = `<p>Plantilla de la <b>orden de operaciones</b> en 5 párrafos. El botón <b>Completar con el geovisor</b> escribe lo que ya se analizó: terreno (COC, terreno clave, avenidas, cubierta), luz y clima, unidades propias de Omasuyos, tareas tácticas del calco, horario de marcha, línea de tiempo y áreas de interés. Revisa y corrige todo antes de emitirla.</p>`;
  const D = Object.assign({ clas: 'RESERVADO', ej: '1', unidad: '', lugar: 'ACHACACHI', fh: '', num: '1', cartas: 'CARTAS IGM 1:50.000 DE LA PROVINCIA OMASUYOS (GEOVISOR EMTE)', eno: '', prop: '', agr: '', terreno: '', mision: '', concepto: '', tareas: '', coord: '', log: '', mando: '', cdte: '', anexos: 'A. CALCO DE OPERACIONES\nB. CALCO DE SITUACIÓN MODIFICADO\nC. MATRIZ DE EVENTOS\nD. HORARIO DE MARCHA' }, LS.get('oo', {}));
  const F = {}; const campo = (k, t, area, ph) => { const e = area ? h('textarea') : inp('text', ''); e.value = D[k] || ''; if (ph) e.placeholder = ph; if (area) e.style.minHeight = area + 'px'; e.oninput = () => { D[k] = e.value; LS.set('oo', D); }; F[k] = e; return rotulo(t, e); };
  const g1 = h('div', 'fila'); g1.append(campo('clas', 'CLASIFICACIÓN'), campo('ej', 'EJEMPLAR N°'), campo('unidad', 'UNIDAD QUE EMITE'), campo('lugar', 'LUGAR'), campo('fh', 'FECHA – HORA (GRUPO)'), campo('num', 'ORDEN DE OPERACIONES N°')); c.append(g1, campo('cartas', 'REFERENCIAS', 0));
  c.append(h('h4', null, '1. Situación'), campo('eno', 'a. FUERZAS ENEMIGAS', 60, 'Composición, ubicación, actividad, posibles líneas de acción…'), campo('prop', 'b. FUERZAS PROPIAS', 60), campo('agr', 'c. AGREGACIONES Y SEGREGACIONES', 40), campo('terreno', 'd. TERRENO Y CONDICIONES METEOROLÓGICAS', 110));
  c.append(h('h4', null, '2. Misión'), campo('mision', 'QUIÉN, QUÉ, CUÁNDO, DÓNDE Y PARA QUÉ', 50));
  c.append(h('h4', null, '3. Ejecución'), campo('concepto', 'a. CONCEPTO DE LA OPERACIÓN', 60), campo('tareas', 'b. TAREAS A LAS UNIDADES SUBORDINADAS', 90), campo('coord', 'c. INSTRUCCIONES DE COORDINACIÓN', 90));
  c.append(h('h4', null, '4. Apoyo administrativo y logístico'), campo('log', 'ABASTECIMIENTOS, SANIDAD, TRANSPORTE…', 60));
  c.append(h('h4', null, '5. Mando y comunicaciones'), campo('mando', 'PUESTO DE COMANDO, SUCESIÓN, ENLACES…', 50), campo('cdte', 'FIRMA (GRADO Y NOMBRE DEL COMANDANTE)', 0), campo('anexos', 'ANEXOS', 60));
  const fb = h('div', 'hp-b'); fb.append(boton('Completar con el geovisor', completar, 'pri'), boton('Vista previa', previa), boton('Descargar Word', word), boton('Imprimir / PDF', imprimir), boton('Vaciar', () => { if (!confirmar.dataset.ok) { confirmar.dataset.ok = '1'; confirmar.textContent = '¿Seguro? Pulsa otra vez'; setTimeout(() => { delete confirmar.dataset.ok; confirmar.textContent = 'Vaciar'; }, 4000); return; } Object.keys(F).forEach(k => { if (!['clas', 'ej', 'lugar', 'cartas', 'anexos'].includes(k)) { D[k] = ''; F[k].value = ''; } }); LS.set('oo', D); }));
  const confirmar = fb.lastChild; c.append(fb);
  const prev = h('div'); c.append(prev);
  async function completar() {
    mensaje(c, 'Reuniendo la información del geovisor…');
    const add = (k, t) => { if (!t) return; const v = F[k].value.trim(); if (v.includes(t.slice(0, 40))) return; F[k].value = (v ? v + '\n' : '') + t; D[k] = F[k].value; };
    // terreno
    let coc = null; try { coc = await fetch('data/coc_omasuyos.json').then(r => r.json()); } catch (e) {}
    const tc = await cargarTC(); const cub = await cargarCub().catch(() => null);
    const T = [];
    T.push('(1) Aspectos generales: altiplano de la provincia Omasuyos (3.810–4.500 m s.n.m.), limitado al oeste por el lago Titicaca; relieve de llanura ondulada con serranías al este y quebradas que bajan al lago.');
    if (coc) { const m = coc.fuerzas.mec.pct, i = coc.fuerzas.inf.pct; T.push(`(2) Obstáculos (COC): para fuerzas mecanizadas ${dec(m[0], 0)} % sin restricción, ${dec(m[1], 0)} % restringido y ${dec(m[2], 0)} % severamente restringido; para infantería a pie ${dec(i[0], 0)} % / ${dec(i[1], 0)} % / ${dec(i[2], 0)} %. Obstáculos principales: lago Titicaca, lagunas, ríos y quebradas, zonas urbanas y pendientes fuertes.`); }
    if (tc?.features?.length) T.push(`(3) Terreno clave: ${tc.features.length} elementos identificados (alturas dominantes, pasos y nudos viales), entre ellos ${tc.features.slice(0, 4).map(f => (f.properties.nombre || f.properties.tipo || '').split(' · ')[0]).filter(Boolean).join(', ')}.`);
    if (ESTADO.aa) T.push('(4) Avenidas de aproximación (' + FZ[ESTADO.aa.fz].t.toLowerCase() + '): ' + ESTADO.aa.rutas.map((R, k) => `AA-${k + 1} ${R.rol.toLowerCase()} — ${R.cat.toLowerCase()} (${R.puntaje}/100), ${dec(R.km)} km, ${dec(R.pct[0], 0)} % sin restricción, ancho mínimo ${miles(R.anchoMin)} m${R.cuellos.length ? ', ' + R.cuellos.length + ' cuello(s) de botella' : ''}`).join('; ') + '.');
    if (cub) { const k = cub.meta.clases; T.push(`(5) Cubierta y encubrimiento: predomina el suelo desnudo o pastizal seco (${dec(k[3].km2, 0)} km², sin encubrimiento); vegetación densa ${dec(k[1].km2)} km², zonas edificadas ${dec(k[4].km2)} km² y quebradas ${dec(k[6].km2)} km² ofrecen protección.`); }
    T.push(`(6) Observación y campos de tiro: observación en general muy buena por la escasa vegetación${ESTADO.obs?.armas?.length ? '; campos de tiro planificados: ' + ESTADO.obs.armas.map(a => a.t.toLowerCase() + ' ' + miles(a.r) + ' m').join(', ') : ''}.`);
    const L = ESTADO.luz; if (L) T.push(`(7) Luz (${L.fecha}, ${L.lugar}): BMNT ${L.tt(L.s.BMNT)}, salida del sol ${L.tt(L.s.salida)}, puesta ${L.tt(L.s.puesta)}, EENT ${L.tt(L.s.EENT)}; ${nombreFase(L.L.fase).toLowerCase()} con ${Math.round(L.L.frac * 100)} % de iluminación.`);
    if (ESTADO.clima) { const C = ESTADO.clima.C; T.push(`(8) Condiciones meteorológicas (${ESTADO.clima.mes}): temperatura ${dec(C[2])} a ${dec(C[0])} °C, ${dec(C[3])} mm de lluvia en ${dec(C[4], 0)} días; ${ESTADO.clima.efectos.join('; ')}.`); }
    F.terreno.value = T.join('\n'); D.terreno = F.terreno.value;
    // fuerzas propias en Omasuyos (datos FF.AA., solo usuarios registrados)
    const FA = window.EMTE_FUERZAS_ARMADAS; if (FA) { const pr = FA.features.filter(f => f.properties.om && f.geometry.type === 'Point').map(f => f.properties.sigla + (f.properties.ubicacion ? ' (' + f.properties.ubicacion + ')' : '')); add('prop', 'Unidades e instalaciones militares en la provincia: ' + pr.join(', ') + '.'); }
    // tareas tácticas y símbolos del calco
    try {
      const calco = JSON.parse(localStorage.getItem('planeamiento-calco-geovisor') || '[]'), tt = await fetch('planeamiento/tareas_tacticas.json').then(r => r.ok ? r.json() : { tareas: [] }).catch(() => ({ tareas: [] })), sim = await fetch('planeamiento/simbolos.json').then(r => r.ok ? r.json() : { cat: [] }).catch(() => ({ cat: [] }));
      const T2 = new Map(tt.tareas.map(t => [t.key, t])), NOM = new Map(sim.cat.map(s => [s.key, s]));
      const lin = [], eno = [];
      calco.forEach(([, o]) => { const s = NOM.get(o.key), t = T2.get(o.key), pos = posCalco(o); const donde = pos ? ' en ' + utm(...pos) : ''; const nombre = (o.esc ? o.esc + ' ' : '') + (o.izq || o.der || o.cen || '');
        if (t) lin.push(`- ${nombre || 'Unidad'}: ${t.nombre.toUpperCase()}${donde}. Propósito: ${t.prop.toLowerCase()}.`); else if (s && s.bando === 'Enemigo') eno.push(`${s.nombre}${nombre ? ' ' + nombre : ''}${donde}`); });
      if (lin.length) add('tareas', lin.join('\n')); if (eno.length) add('eno', 'Según el calco: ' + eno.join('; ') + '.');
    } catch (e) {}
    // coordinación: horario, marcha, AIN
    const co = []; if (ESTADO.tl) co.push(`(1) Hora H: ${new Date(ESTADO.tl.H).toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })}. Tiempo disponible ${dec(ESTADO.tl.total)} h (1/3 comandante, 2/3 unidades).`);
    if (ESTADO.marcha?.res) { const R = ESTADO.marcha.res; co.push(`(2) Marcha: ${dec(R.L)} km, columna de ${dec(R.longCol, 2)} km, tiempo de paso ${dec(R.tPasoMin, 0)} min. ` + R.filas.map(f => `${f.n} ${f.cab}–${f.col}`).join(', ') + '.'); }
    if (ESTADO.ain.length) co.push('(3) Áreas de interés: ' + ESTADO.ain.map(a => `${a.n}${a.aa ? ' (' + a.aa + ')' : ''}${a.ind ? ': ' + a.ind : ''}${a.na || a.nd ? ' [' + (a.na || '') + ' – ' + (a.nd || '') + ']' : ''}`).join('; ') + '.');
    co.forEach(t => add('coord', t));
    // logística: sanidad y agua más cercanas
    const H = (typeof healthFeatures !== 'undefined' ? healthFeatures : []).filter(f => /HOSPITAL/i.test(f.properties.categoria || '')).map(f => f.properties.nombre);
    if (H.length) add('log', 'Sanidad: hospitales de referencia en la provincia: ' + H.join(', ') + '.');
    LS.set('oo', D); mensaje(c, 'Listo. Revisa cada párrafo, completa la misión, el concepto y las firmas, y descarga la orden.'); previa();
  }
  function posCalco(o) { let x = o.x, y = o.y; if (x == null && o.p) { x = o.p[0]; y = o.p[1]; } if (x == null) return null; if (Math.abs(x) <= 180) return [x, y]; return [x / RT / D2R, (2 * Math.atan(Math.exp(y / RT)) - Math.PI / 2) / D2R]; }
  function html() {
    const p = t => esc(t || '…').split('\n').map(l => `<p>${l}</p>`).join('');
    return `<div style="text-align:center;font-weight:bold">${esc(D.clas)}</div><div style="text-align:right">Ejemplar N° ${esc(D.ej)}<br>${esc(D.unidad)}<br>${esc(D.lugar)}<br>${esc(D.fh)}</div>
<h3>ORDEN DE OPERACIONES N° ${esc(D.num)}</h3><p><b>Referencias:</b> ${esc(D.cartas)}</p>
<h5>1. SITUACIÓN</h5><p><b>a. Fuerzas enemigas.</b></p>${p(D.eno)}<p><b>b. Fuerzas propias.</b></p>${p(D.prop)}<p><b>c. Agregaciones y segregaciones.</b></p>${p(D.agr)}<p><b>d. Terreno y condiciones meteorológicas.</b></p>${p(D.terreno)}
<h5>2. MISIÓN</h5>${p(D.mision)}<h5>3. EJECUCIÓN</h5><p><b>a. Concepto de la operación.</b></p>${p(D.concepto)}<p><b>b. Tareas a las unidades subordinadas.</b></p>${p(D.tareas)}<p><b>c. Instrucciones de coordinación.</b></p>${p(D.coord)}
<h5>4. APOYO ADMINISTRATIVO Y LOGÍSTICO</h5>${p(D.log)}<h5>5. MANDO Y COMUNICACIONES</h5>${p(D.mando)}
<br><div style="text-align:right">${esc(D.cdte) || '________________________<br>COMANDANTE'}</div><p><b>ANEXOS:</b></p>${p(D.anexos)}<div style="text-align:center;font-weight:bold;margin-top:10px">${esc(D.clas)}</div>`;
  }
  function previa() { prev.innerHTML = `<div class="hp-doc">${html()}</div>`; }
  function word() { const doc = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Orden de operaciones</title><style>body{font-family:'Times New Roman';font-size:12pt}h3{text-align:center}h5{font-size:12pt;margin:10pt 0 4pt}p{margin:2pt 0 2pt 18pt}</style></head><body>${html()}</body></html>`; descargar('Orden_de_operaciones_' + (D.num || '1') + '.doc', '﻿' + doc, 'application/msword'); }
  function imprimir() { const w = window.open('', '_blank'); if (!w) { mensaje(c, 'El navegador bloqueó la ventana de impresión.', true); return; } w.document.write(`<html><head><meta charset="utf-8"><title>Orden de operaciones N° ${esc(D.num)}</title><style>body{font-family:'Times New Roman';font-size:12pt;margin:2cm}h3{text-align:center}h5{font-size:12pt;margin:10pt 0 4pt}p{margin:2pt 0 2pt 18pt}</style></head><body>${html()}<script>setTimeout(()=>print(),300)<\/script></body></html>`); w.document.close(); }
})();

/* ---------- borrar todo lo dibujado por estas herramientas (botón «Eliminar» del inicio) ---------- */
window.EMTE_HP_LIMPIAR = () => { soltar(); LIMPIEZA.forEach(f => { try { f(); } catch (e) { console.error(e); } }); };

/* ---------- avisos entre herramientas ---------- */
window.EMTE_HP_AA = () => (ESTADO.aa && ESTADO.aa.rutas || []).map((r, i) => ({ n: i + 1, tipo: r.tipo, coords: r.coords, km: r.km }));   // para «Puntos de observación»
window.EMTE_HP_EVENTO = k => { if (k === 'aa' && ESTADO.marcha?.res) { try { window.EMTE_HP_MARCHA?.(); } catch (e) {} } };
});
