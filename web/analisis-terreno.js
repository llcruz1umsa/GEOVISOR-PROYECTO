/* Análisis del terreno (agregado por BYNS7). Usa el modelo de elevación de relieve.js (MDT Omasuyos: cartas IGM 1:50.000 + Copernicus GLO-30).
   · «Pendientes»: mapa de transitabilidad por pendiente del terreno (4 clases).
   · «Área visible»: zona que se ve desde uno o varios puntos (observatorios, antenas), con curvatura y refracción;
     tabla para regular por punto la altura del observador, del objetivo y la distancia de visibilidad.
   (El perfil e intervisibilidad entre dos puntos está en la tarjeta «Perfil y visibilidad».) */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const mapa = document.querySelector('.map'), scene = document.getElementById('scene');
if (!mapa || !scene) return;
const svgMapa = scene.ownerSVGElement, NS = 'http://www.w3.org/2000/svg';
const K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702, D2R = Math.PI / 180;
const aEscena = (lon, lat) => [500 + (lon * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) + OY) * K];
const deEscena = (x, y) => [((x - 500) / K - OX) / D2R, (2 * Math.atan(Math.exp((380 - y) / K - OY)) - Math.PI / 2) / D2R];
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const miles = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const dec = (n, d = 1) => n.toFixed(d).replace('.', ',');
const LAGO = 3808;   // nivel del Titicaca en el modelo: se deja transparente
const dem = () => (window.EMTE_CARGAR_DEM ? window.EMTE_CARGAR_DEM() : Promise.reject()).then(() => window.EMTE_DEM());

const css = h('style');
css.textContent = `
.at-leyenda{position:absolute;left:16px;bottom:118px;z-index:8;background:#fff;border:1px solid #D7DEE8;border-radius:8px;box-shadow:0 8px 22px rgba(11,29,51,.18);font:11.5px var(--tipo-texto,system-ui);color:#14233A;min-width:230px}
.at-leyenda[hidden]{display:none}
.at-leyenda b.t{display:block;padding:6px 10px;background:#0B1D33;color:#fff;font:600 11px var(--tipo-titulo,system-ui);letter-spacing:.1em;border-radius:7px 7px 0 0;border-bottom:2px solid #B79A5B}
.at-leyenda div{display:flex;align-items:center;gap:8px;padding:3px 10px}
.at-leyenda i{width:22px;height:12px;border-radius:2px;flex:none;border:1px solid #0002}
.at-leyenda small{display:block;padding:4px 10px 7px;color:#5A6B80;font-size:10px}
.at-sel{display:flex;gap:4px}.at-sel button{padding:4px 9px;border:1px solid #cfd6e6;border-radius:6px;background:#fff;color:#12294A;font:600 11px var(--tipo-titulo,system-ui);cursor:pointer}
.at-sel button.on{background:#12294A;color:#fff;border-color:#12294A}
.map.at-activo svg{cursor:crosshair!important}`;
document.head.append(css);

/* =============== PENDIENTES =============== */
const CLASES = [
  [30, '#2E8B47', 'Sin restricción', 'hasta 30 % · vehículos sin limitación'],
  [60, '#E6C434', 'Restringido', '30–60 % · vehículos con dificultad o canalizados'],
  [Infinity, '#C0302A', 'Severamente restringido', 'más de 60 % · sólo a pie']
];
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
let imgPend = null, pendActiva = false, pctClases = null;
const leyenda = h('section', 'at-leyenda'); leyenda.hidden = true;
leyenda.innerHTML = '<b class="t">PENDIENTE DEL TERRENO</b>' + CLASES.map(c => `<div><i style="background:${c[1]}"></i><span><b>${c[2]}</b> · ${c[3]}</span></div>`).join('') + '<small>MDT Omasuyos: cartas IGM 1:50.000 + Copernicus GLO-30 (rejilla ~45 m). Referencial: no considera suelo, vegetación ni obstáculos.</small>';
mapa.append(leyenda);
for (const t of ['pointerdown', 'click', 'wheel']) leyenda.addEventListener(t, e => e.stopPropagation());
function construirPendientes(D) {
  const { x0, y0, dx, dy, w, h: H, z } = D, lat0 = y0, lat1 = y0 - H * dy, lon0 = x0, lon1 = x0 + w * dx;
  const mx = dx * 111320 * Math.cos((lat0 + lat1) / 2 * D2R), my = dy * 110574;
  const pend = new Float32Array(w * H).fill(-1), cuenta = CLASES.map(() => 0);
  for (let j = 1; j < H - 1; j++) for (let i = 1; i < w - 1; i++) {
    const k = j * w + i; if (z[k] <= LAGO) continue;
    const gx = ((z[k - w + 1] + 2 * z[k + 1] + z[k + w + 1]) - (z[k - w - 1] + 2 * z[k - 1] + z[k + w - 1])) / (8 * mx);
    const gy = ((z[k + w - 1] + 2 * z[k + w] + z[k + w + 1]) - (z[k - w - 1] + 2 * z[k - w] + z[k - w + 1])) / (8 * my);
    const s = Math.hypot(gx, gy) * 100; pend[k] = s; cuenta[CLASES.findIndex(c => s < c[0])]++;
  }
  const tot = cuenta.reduce((a, b) => a + b, 0); pctClases = cuenta.map(c => c / tot * 100);
  // lienzo en proyección del mapa (Mercator): cada fila de salida se toma de la fila del modelo de su latitud
  const [ax, ay] = aEscena(lon0, lat0), [bx, by] = aEscena(lon1, lat1), Hs = H;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = Hs;
  const ctx = cv.getContext('2d'), im = ctx.createImageData(w, Hs), cols = CLASES.map(c => rgb(c[1]));
  for (let r = 0; r < Hs; r++) {
    const ys = ay + (by - ay) * (r + .5) / Hs, lat = deEscena(ax, ys)[1], j = Math.min(H - 1, Math.max(0, Math.floor((lat0 - lat) / dy)));
    for (let i = 0; i < w; i++) {
      const s = pend[j * w + i]; if (s < 0) continue;
      const c = cols[CLASES.findIndex(x => s < x[0])], o = (r * w + i) * 4;
      im.data[o] = c[0]; im.data[o + 1] = c[1]; im.data[o + 2] = c[2]; im.data[o + 3] = 255;
    }
  }
  ctx.putImageData(im, 0, 0);
  const img = document.createElementNS(NS, 'image');
  img.setAttribute('id', 'topo-pendientes'); img.setAttribute('x', ax); img.setAttribute('y', ay); img.setAttribute('width', bx - ax); img.setAttribute('height', by - ay);
  img.setAttribute('preserveAspectRatio', 'none'); img.setAttribute('opacity', '.5'); img.setAttribute('pointer-events', 'none');
  img.setAttribute('href', cv.toDataURL('image/png'));
  return img;
}
function ponerPendientes(on) {
  pendActiva = on; tarjPend.classList.toggle('chosen', on); leyenda.hidden = !on;
  if (!on) { imgPend && imgPend.remove(); return; }
  dem().then(D => {
    if (!pendActiva) return;
    if (!imgPend) imgPend = construirPendientes(D);
    const ref = document.getElementById('topo-municipios') || document.getElementById('water') || document.getElementById('rivers');
    ref && ref.parentNode === scene ? ref.after(imgPend) : scene.prepend(imgPend);
    const sm = leyenda.querySelector('small');
    if (pctClases && !leyenda.querySelector('.at-pct')) { leyenda.querySelectorAll('div').forEach((d, i) => { const s = h('span', 'at-pct', dec(pctClases[i]) + ' %'); s.style.cssText = 'margin-left:auto;color:#5A6B80;font-size:10.5px'; d.append(s); }); }
  }).catch(() => { leyenda.querySelector('small').textContent = 'No se pudo cargar el modelo de elevación.'; });
}

/* =============== ÁREA VISIBLE · VARIOS PUNTOS DE OBSERVACIÓN =============== */
// Cada clic en el mapa agrega un punto. La tabla permite regular por punto la altura del observador,
// la altura del objetivo y la distancia de visibilidad (escribiendo el valor o con el regulador).
const css2 = h('style');
css2.textContent = `
.rp-panel.av-panel{width:min(400px,calc(100% - 24px))} /* av-compacta */
.av-panel .av-def{grid-template-columns:repeat(3,1fr)!important;gap:5px!important;padding:6px 10px!important;font-size:9.5px!important}
.av-panel .av-def label{font-size:9.5px;letter-spacing:.02em}
.av-panel .av-tw{max-height:230px!important}
.av-panel th{font-size:8.5px!important;padding:4px 2px!important}
.av-panel td{padding:3px 2px!important;font-size:10px}
.av-panel td.n b{width:17px!important;height:17px!important;font-size:10px!important}
.av-panel td.u{font-size:9px!important;line-height:1.2;white-space:nowrap}
.av-panel td.h input{display:block;width:44px;margin:1px auto;padding:1px 3px;font-size:10px}
.av-panel td.h small{display:block;font-size:7.5px;color:#7a8698;line-height:1}
.av-panel td.r{width:84px}
.av-panel td.r input[type=number]{width:46px;padding:1px 3px;font-size:10px}
.av-panel td.r input[type=range]{margin:2px 0 0!important}
.av-panel td.res{font-size:9.5px!important}
.av-panel td.res b{font-size:11px}
.av-panel .av-pie{padding:6px 10px!important;font-size:10px!important;flex-wrap:wrap}
.av-panel .av-pie button{padding:4px 8px!important;font-size:10px!important}
.av-panel .rp-nota{padding:4px 10px 8px!important;font-size:9px!important}
.av-panel .av-def{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:8px 12px;background:#f6f3ea;border-bottom:1px solid #e3e8f0;font:11px var(--tipo-texto,system-ui);color:#3a4658}
.av-panel .av-def label{display:flex;flex-direction:column;gap:2px;font-weight:600}
.av-panel input[type=number]{width:100%;box-sizing:border-box;padding:3px 5px;border:1px solid #cfd6e6;border-radius:5px;font:600 11.5px system-ui;color:#12294A;text-align:right}
.av-panel .av-tw{max-height:300px;overflow:auto}
.av-panel table{width:100%;border-collapse:collapse;font:11.5px var(--tipo-texto,system-ui);color:#14233A}
.av-panel th{position:sticky;top:0;background:#0B1D33;color:#fff;font:600 10px var(--tipo-titulo,system-ui);letter-spacing:.04em;padding:5px 4px;text-align:center;text-transform:uppercase}
.av-panel td{padding:5px 4px;border-bottom:1px solid #e3e8f0;vertical-align:middle;text-align:center}
.av-panel td.n b{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;color:#fff;font:700 11px system-ui}
.av-panel td.u{text-align:left;font-size:10.5px;line-height:1.25;color:#3a4658}
.av-panel td.r input[type=range]{width:100%;margin:3px 0 0;accent-color:#12294A}
.av-panel td.res{font-size:10.5px;line-height:1.25;white-space:nowrap}
.av-panel td.res b{color:#2E7D47}
.av-panel .av-x{border:0;background:none;color:#9B1C1C;font:700 15px system-ui;cursor:pointer;padding:0 2px}
.av-panel .av-vacio{padding:12px;color:#5A6B80;font-size:11.5px;text-align:center}
.av-panel .av-pie{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 12px;border-top:1px solid #e3e8f0;font:11px var(--tipo-texto,system-ui);color:#3a4658}
.av-panel .av-pie button{padding:5px 10px;border:1px solid #cfd6e6;border-radius:6px;background:#fff;color:#12294A;font:600 11px system-ui;cursor:pointer}
.av-panel .av-pie button:hover{background:#eef2f8}
.av-panel .rp-nota{margin:0;padding:6px 12px 10px;font-size:10px}`;
document.head.append(css2);

const COLORES = ['#1F6FD1', '#C0392B', '#2E8B47', '#8E44AD', '#D35400', '#16A085', '#B7950B', '#34495E'];
const panel = h('section', 'rp-panel av-panel'); panel.hidden = true; panel.setAttribute('aria-label', 'Área visible desde puntos de observación');
panel.innerHTML = `<div class="rp-cab"><b>ÁREA VISIBLE · PUNTOS DE OBSERVACIÓN</b><button type="button" class="at-cerrar" aria-label="Cerrar">×</button></div>
<div class="av-def"><label>Observador (m)<input type="number" class="av-dho" min="0" max="300" step="0.5" value="1.7"></label>
<label>Objetivo (m)<input type="number" class="av-dht" min="0" max="300" step="0.5" value="1.7"></label>
<label>Radio (km)<input type="number" class="av-dr" min="0.5" max="30" step="0.5" value="5"></label></div>
<div class="av-tw"><table><thead><tr><th>N.º</th><th>Ubicación (UTM)</th><th>Alturas (m)</th><th>Radio (km)</th><th>Alcance visible</th><th></th></tr></thead><tbody class="av-filas"></tbody></table>
<div class="av-vacio">Haz clic en el mapa para agregar un punto de observación.<br>Los valores de arriba se usan para cada punto nuevo.</div></div>
<div class="av-pie"><span class="av-tot"></span><span><button type="button" class="av-todos">Aplicar valores a todos</button> <button type="button" class="av-limpiar">Quitar todos</button></span></div>
<p class="rp-nota"><span style="color:#2E9E50">■</span> visible · <span style="color:#9B1C1C">■</span> oculto por el relieve. Alcance visible: hasta dónde se ve en cada dirección dentro del radio (máximo y promedio). Objetivo: altura de lo que se quiere ver (persona 1,7 m · vehículo 2,5–3 m). Considera curvatura terrestre y refracción (k = 0,13); no considera edificios ni vegetación.</p>`;
mapa.append(panel);
for (const t of ['pointerdown', 'click', 'dblclick', 'wheel']) panel.addEventListener(t, e => e.stopPropagation());
const filas = panel.querySelector('.av-filas'), vacio = panel.querySelector('.av-vacio'), $p = s => panel.querySelector(s);
let visActivo = false, sigId = 1;
const puntos = [];
const gVis = document.createElementNS(NS, 'g'); gVis.id = 'topo-area-visible'; gVis.setAttribute('pointer-events', 'none');
$p('.at-cerrar').onclick = () => abrirVis(false);
$p('.av-limpiar').onclick = () => { puntos.splice(0).forEach(p => p.g.remove()); tabla(); };
$p('.av-todos').onclick = () => { const d = defecto(); puntos.forEach(p => Object.assign(p, d)); tabla(); puntos.forEach(calcularPunto); };
const num = (v, lo, hi, def) => { v = parseFloat(String(v).replace(',', '.')); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def; };
const defecto = () => ({ ho: num($p('.av-dho').value, 0, 300, 1.7), ht: num($p('.av-dht').value, 0, 300, 1.7), r: num($p('.av-dr').value, .5, 30, 5) });
function abrirVis(on) {
  visActivo = on; panel.hidden = !on; mapa.classList.toggle('at-activo', on); tarjVis.classList.toggle('chosen', on);
  if (!on) { gVis.remove(); return; }
  if (puntos.length) colocar();
  dem().catch(() => { vacio.textContent = 'No se pudo cargar el modelo de elevación.'; });
}
function colocar() { if (!gVis.isConnected) { const ref = document.getElementById('topo-municipios-nombres'); ref ? ref.before(gVis) : scene.append(gVis); } }
function z(D, lon, lat) {
  const fx = (lon - D.x0) / D.dx - .5, fy = (D.y0 - lat) / D.dy - .5;
  if (fx < 0 || fy < 0 || fx > D.w - 1 || fy > D.h - 1) return null;
  const x = Math.floor(fx), y = Math.floor(fy), tx = fx - x, ty = fy - y, Z = D.z, W = D.w, x1 = Math.min(x + 1, W - 1), y1 = Math.min(y + 1, D.h - 1);
  return (Z[y * W + x] * (1 - tx) + Z[y * W + x1] * tx) * (1 - ty) + (Z[y1 * W + x] * (1 - tx) + Z[y1 * W + x1] * tx) * ty;
}
function agregar([lon, lat]) {
  const D = window.EMTE_DEM && window.EMTE_DEM(); if (!D) return;
  const z0 = z(D, lon, lat); if (z0 == null) { vacio.hidden = false; vacio.textContent = 'Ese punto está fuera del modelo de elevación.'; return; }
  const id = sigId++, p = Object.assign({ id, lon, lat, z0, color: COLORES[(id - 1) % COLORES.length], g: document.createElementNS(NS, 'g') }, defecto());
  puntos.push(p); colocar(); gVis.append(p.g); tabla(); calcularPunto(p);
}
function calcularPunto(p) {
  const D = window.EMTE_DEM && window.EMTE_DEM(); if (!D) return;
  const { lon, lat, ho, ht } = p, R = p.r * 1000, CEL = Math.max(30, Math.min(90, R / 160)), PASO = CEL * .7;
  const RAYOS = Math.min(6000, Math.max(720, Math.ceil(2 * Math.PI * R / (CEL * .8)))), kR = 1 - .13, Rt = 6371000;
  const mLon = 111320 * Math.cos(lat * D2R), mLat = 110574;
  const n = Math.ceil(R / CEL) * 2 + 1, c = (n - 1) / 2, vis = new Int8Array(n * n);   // 0 sin dato, 1 visible, 2 oculto
  const ojo = p.z0 + ho; let sumaAlc = 0, maxAlc = 0;
  for (let a = 0; a < RAYOS; a++) {
    const ang = a / RAYOS * 2 * Math.PI, sx = Math.sin(ang), sy = Math.cos(ang); let maxP = -Infinity, ultimo = 0;
    for (let d = PASO; d <= R; d += PASO) {
      const zz = z(D, lon + sx * d / mLon, lat + sy * d / mLat); if (zz == null) break;
      const zt = (zz <= LAGO ? LAGO : zz) - d * d / (2 * Rt) * kR;
      const pSuelo = (zt - ojo) / d, visto = (zt + ht - ojo) / d >= maxP;
      if (pSuelo > maxP) maxP = pSuelo;
      if (visto) ultimo = d;
      const gx = Math.round(c + sx * d / CEL), gy = Math.round(c - sy * d / CEL);
      if (gx < 0 || gy < 0 || gx >= n || gy >= n) continue;
      const k = gy * n + gx; if (visto) vis[k] = 1; else if (!vis[k]) vis[k] = 2;
    }
    sumaAlc += ultimo; if (ultimo > maxAlc) maxAlc = ultimo;
  }
  const cv = document.createElement('canvas'); cv.width = n; cv.height = n;
  const ctx = cv.getContext('2d'), im = ctx.createImageData(n, n); let nv = 0, nt = 0;
  for (let k = 0; k < n * n; k++) { if (!vis[k]) continue; nt++; const o = k * 4; if (vis[k] === 1) { nv++; im.data[o] = 46; im.data[o + 1] = 160; im.data[o + 2] = 80; im.data[o + 3] = 140; } else { im.data[o] = 120; im.data[o + 1] = 30; im.data[o + 2] = 30; im.data[o + 3] = 45; } }
  ctx.putImageData(im, 0, 0);
  const half = c * CEL + CEL / 2, [ax, ay] = aEscena(lon - half / mLon, lat + half / mLat), [bx, by] = aEscena(lon + half / mLon, lat - half / mLat);
  p.g.replaceChildren();
  const img = document.createElementNS(NS, 'image'); img.setAttribute('x', ax); img.setAttribute('y', ay); img.setAttribute('width', bx - ax); img.setAttribute('height', by - ay);
  img.setAttribute('preserveAspectRatio', 'none'); img.setAttribute('href', cv.toDataURL('image/png')); img.style.imageRendering = 'pixelated'; p.g.append(img);
  const [px, py] = aEscena(lon, lat), circ = document.createElementNS(NS, 'circle');
  circ.setAttribute('cx', px); circ.setAttribute('cy', py); circ.setAttribute('r', (bx - ax) / 2 * (R / half)); circ.setAttribute('fill', 'none'); circ.setAttribute('stroke', p.color); circ.setAttribute('stroke-width', 2); circ.setAttribute('stroke-dasharray', '6 4'); circ.setAttribute('vector-effect', 'non-scaling-stroke'); p.g.append(circ);
  const m = document.createElementNS(NS, 'g'); m.setAttribute('class', 'at-obs'); m.dataset.x = px; m.dataset.y = py; m.setAttribute('transform', `translate(${px} ${py}) scale(${1 / scale})`);
  m.innerHTML = `<circle r="10" fill="#fff"/><circle r="8.2" fill="${p.color}"/><text y="3.6" text-anchor="middle" font-size="10" font-weight="700" font-family="system-ui" fill="#fff">${p.id}</text>`; p.g.append(m);
  p.res = { km2: nv * CEL * CEL / 1e6, pct: nt ? nv / nt * 100 : 0, max: maxAlc / 1000, medio: sumaAlc / RAYOS / 1000 };
  const td = filas.querySelector(`tr[data-id="${p.id}"] td.res`); if (td) td.innerHTML = resTxt(p);
  total();
}
const resTxt = p => p.res ? `<b>${dec(p.res.max, 1)} km</b> máx.<br>${dec(p.res.medio, 1)} km medio · ${dec(p.res.pct, 0)} %` : '…';
function total() { const r = puntos.filter(p => p.res), mx = r.reduce((a, p) => Math.max(a, p.res.max), 0), md = r.length ? r.reduce((a, p) => a + p.res.medio, 0) / r.length : 0; $p('.av-tot').textContent = puntos.length ? `${puntos.length} punto${puntos.length > 1 ? 's' : ''} · alcance máx. ${dec(mx, 1)} km · medio ${dec(md, 1)} km` : ''; }
let tCalc = 0;
function tabla() {
  filas.replaceChildren(); vacio.hidden = puntos.length > 0;
  if (!puntos.length) vacio.innerHTML = 'Haz clic en el mapa para agregar un punto de observación.<br>Los valores de arriba se usan para cada punto nuevo.';
  const T = window.EMTE_TOPO;
  puntos.forEach(p => {
    const tr = h('tr'); tr.dataset.id = p.id; const u = T ? T.textos(p.lat, p.lon) : null;
    tr.innerHTML = `<td class="n"><b style="background:${p.color}">${p.id}</b></td>
<td class="u">${u ? u.utm.replace(/^19S /, '').replace(/ E · /, ' E<br>').replace(/ · /, '<br>') : p.lat.toFixed(5) + '<br>' + p.lon.toFixed(5)}<br><span style="color:#7a5c12">${miles(p.z0)} m s.n.m.</span></td>
<td class="h"><small>OBS.</small><input type="number" data-k="ho" min="0" max="300" step="0.5" value="${p.ho}" aria-label="Altura del observador" title="Altura de los ojos del observador sobre el suelo"><small>OBJ.</small><input type="number" data-k="ht" min="0" max="300" step="0.5" value="${p.ht}" aria-label="Altura del objetivo" title="Altura del objetivo que se quiere ver (persona 1,7 m, vehículo 2,5–3 m)"></td>
<td class="r"><input type="number" data-k="r" min="0.5" max="30" step="0.5" value="${p.r}" aria-label="Distancia de visibilidad en km"><input type="range" data-k="rr" min="0.5" max="30" step="0.5" value="${p.r}" aria-label="Regulador de distancia"></td>
<td class="res">${resTxt(p)}</td><td><button type="button" class="av-x" title="Quitar punto" aria-label="Quitar punto ${p.id}">×</button></td>`;
    const ni = tr.querySelector('[data-k=r]'), rg = tr.querySelector('[data-k=rr]');
    const recalcular = () => { clearTimeout(tCalc); tr.querySelector('td.res').textContent = '…'; tCalc = setTimeout(() => calcularPunto(p), 250); };
    tr.querySelectorAll('input[type=number]').forEach(inp => inp.addEventListener('change', () => {
      const k = inp.dataset.k, v = k === 'r' ? num(inp.value, .5, 30, p.r) : num(inp.value, 0, 300, p[k]);
      p[k] = v; inp.value = v; if (k === 'r') rg.value = v; recalcular();
    }));
    rg.addEventListener('input', () => { p.r = +rg.value; ni.value = rg.value; recalcular(); });
    tr.querySelector('.av-x').onclick = () => { p.g.remove(); puntos.splice(puntos.indexOf(p), 1); tabla(); total(); };
    filas.append(tr);
  });
  total();
}
let abajo = null;
svgMapa.addEventListener('pointerdown', e => { if (visActivo) abajo = [e.clientX, e.clientY]; }, true);
svgMapa.addEventListener('click', e => {
  if (!visActivo) return;
  e.stopPropagation(); e.preventDefault();
  if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 5) return;
  const m = scene.getScreenCTM(); if (!m) return; const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  const ll = deEscena(p.x, p.y);
  dem().then(() => setTimeout(() => agregar(ll), 10));
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && visActivo) abrirVis(false); });
const zoomAnterior = zoom;
zoom = function (f) { zoomAnterior(f); gVis.querySelectorAll('.at-obs').forEach(g => g.setAttribute('transform', `translate(${g.dataset.x} ${g.dataset.y}) scale(${1 / scale})`)); };
window.EMTE_AREA_VISIBLE = { abrir: () => abrirVis(true), calcular: ll => { abrirVis(true); dem().then(() => agregar(ll)); } };

/* =============== tarjetas en «Herramientas del mapa» y casilla en Capas =============== */
const menuHerr = [...document.querySelectorAll('main>aside details')].find(d => (d.querySelector('summary')?.textContent || '').trim().startsWith('Herramientas'));
const grilla = menuHerr && menuHerr.querySelector('.visual-tools-grid');
function tarjeta(svg, texto, fn) { const b = h('button', 'visual-card'); b.type = 'button'; b.innerHTML = `<span class="tool-picture"><svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${svg}</svg></span><span>${texto}</span>`; b.onclick = fn; (grilla || document.querySelector('main>aside'))?.append(b); return b; }
const tarjPend = tarjeta('<rect width="64" height="64" rx="12" fill="#f3efe4"/><path d="M4 56L20 40 32 46 46 22 60 30V60H4Z" fill="#3E9B4F"/><path d="M20 40L32 46 40 32 28 30Z" fill="#E7C744"/><path d="M40 32L46 22 52 26 46 36Z" fill="#E07B28"/><path d="M46 22L52 26 50 18Z" fill="#B0231E"/>', '◢ Pendientes', () => ponerPendientes(!pendActiva));
const tarjVis = tarjeta('<rect width="64" height="64" rx="12" fill="#e8f0ea"/><path d="M32 32L58 18A30 30 0 0 1 58 46Z" fill="#2E9E50" opacity=".55"/><path d="M32 32L6 46A30 30 0 0 1 10 14Z" fill="#2E9E50" opacity=".55"/><circle cx="32" cy="32" r="27" fill="none" stroke="#0B1D33" stroke-width="2" stroke-dasharray="5 4"/><circle cx="32" cy="32" r="6" fill="#0B1D33"/><path d="M28 32Q32 28 36 32Q32 36 28 32z" fill="#fff"/>', '◉ Área visible', () => abrirVis(!visActivo));
let cbPend = null, intentos = 0;
(function casillaPend() {
  const capas = document.getElementById('layers'), g = capas && [...capas.querySelectorAll('details')].find(d => /^\s*Relieve/i.test(d.querySelector(':scope > summary')?.textContent || ''));
  if (!g) { if (++intentos < 60) setTimeout(casillaPend, 250); return; }
  const lab = h('label'), cb = h('input'), dot = h('span', 'dot'); cb.type = 'checkbox'; cbPend = cb;
  dot.style.background = 'linear-gradient(90deg,#2E8B47 33%,#E6C434 33% 66%,#C0302A 66%)';
  lab.append(cb, dot, document.createTextNode('Pendientes (transitabilidad)')); g.append(lab); cb.checked = pendActiva; cb.onchange = () => ponerPendientes(cb.checked);
})();
tarjPend.addEventListener('click', () => { if (cbPend) cbPend.checked = pendActiva; });
window.EMTE_LEYENDA_PENDIENTES = () => pendActiva ? CLASES.map(c => ({ nombre: 'Pendiente: ' + c[2].toLowerCase() + ' (' + c[3].split(' · ')[0] + ')', tipo: 'area', color: c[1] })) : [];
});
