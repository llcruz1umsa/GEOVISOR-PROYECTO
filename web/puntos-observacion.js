/* Puntos de observación (agregado por BYNS7, 05-11-2026).
   Busca en el modelo de elevación (MDT Omasuyos) los cerros y alturas con mayor dominio visual sobre:
   · un OBJETIVO (punto marcado en el mapa; se evalúa el punto y un anillo a su alrededor), o
   · una AVENIDA DE APROXIMACIÓN (las AA calculadas en Planeamiento o una línea dibujada con clics).
   Cada candidato es una cima local del terreno; se calcula la intervisibilidad (curvatura y refracción k = 0,13)
   hacia los puntos del objetivo y se ordena por % visible, dominio (desnivel) y distancia.
   Los resultados se dibujan como puestos de observación numerados y pueden pasar a «Área visible». */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const mapa = document.querySelector('.map'), scene = document.getElementById('scene');
if (!mapa || !scene) return;
const svgMapa = scene.ownerSVGElement, NS = 'http://www.w3.org/2000/svg';
const K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702, D2R = Math.PI / 180, LAGO = 3808;
const aEscena = (lon, lat) => [500 + (lon * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) + OY) * K];
const deEscena = (x, y) => [((x - 500) / K - OX) / D2R, (2 * Math.atan(Math.exp((380 - y) / K - OY)) - Math.PI / 2) / D2R];
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const miles = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const dec = (n, d = 1) => (+n).toFixed(d).replace('.', ',');
const distTxt = km => km < 1 ? Math.round(km * 1000) + ' m' : dec(km, 1) + ' km';
const dem = () => (window.EMTE_CARGAR_DEM ? window.EMTE_CARGAR_DEM() : Promise.reject()).then(() => window.EMTE_DEM());
const mLonDe = lat => 111320 * Math.cos(lat * D2R), M_LAT = 110574;
const distM = (a, b) => Math.hypot((b[0] - a[0]) * mLonDe((a[1] + b[1]) / 2), (b[1] - a[1]) * M_LAT);
const azimut = (a, b) => { const g = Math.atan2((b[0] - a[0]) * mLonDe(a[1]), (b[1] - a[1]) * M_LAT) / D2R; return (g + 360) % 360; };
const LS = { get(k, d) { try { const v = JSON.parse(localStorage.getItem('emte-po-' + k)); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('emte-po-' + k, JSON.stringify(v)); } catch (e) {} } };

const css = h('style');
css.textContent = `
.po-panel{width:min(430px,calc(100% - 24px))!important;left:auto!important;right:16px!important;transform:none!important;bottom:62px;z-index:13!important;max-height:calc(100% - 150px);overflow:auto}
.po-panel[hidden]{display:none}
.po-panel .po-modo{display:grid;grid-template-columns:1fr 1fr 1fr;margin:8px 10px 0;border:1px solid #12294A;border-radius:8px;overflow:hidden}
.po-panel .po-modo button{all:unset;text-align:center;padding:6px 2px;font:700 9.5px var(--tipo-titulo,system-ui);letter-spacing:.05em;color:#12294A;cursor:pointer}
.po-panel .po-modo button.on{background:#12294A;color:#fff}
.po-panel .po-modo button:disabled{opacity:.35;cursor:not-allowed}
.po-panel .po-aa{display:flex;flex-wrap:wrap;gap:4px;margin:6px 10px 0}
.po-panel .po-aa[hidden]{display:none}
.po-panel .po-aa button{padding:3px 8px;border:1px solid #cfd6e6;border-radius:12px;background:#fff;font:700 10px system-ui;color:#12294A;cursor:pointer}
.po-panel .po-aa button.on{background:#B79A5B;border-color:#B79A5B;color:#fff}
.po-panel .po-def{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:7px 10px;margin-top:7px;background:#f6f3ea;border-block:1px solid #e3e8f0;font:600 9.5px var(--tipo-texto,system-ui);color:#3a4658}
.po-panel .po-def label{display:flex;flex-direction:column;gap:2px}
.po-panel .po-def input,.po-panel .po-def select{width:100%;box-sizing:border-box;padding:3px 4px;border:1px solid #cfd6e6;border-radius:5px;font:600 11px system-ui;color:#12294A;background:#fff}
.po-panel .po-est{padding:7px 10px;font-size:11px;color:#3a4658;line-height:1.4}
.po-panel .po-est b{color:#12294A}
.po-panel .po-acc{display:flex;gap:6px;padding:0 10px 8px}
.po-panel .po-acc button{flex:1;padding:7px 6px;border:1px solid #12294A;border-radius:6px;background:#fff;color:#12294A;font:700 10.5px var(--tipo-titulo,system-ui);letter-spacing:.04em;cursor:pointer}
.po-panel .po-acc button.pri{background:#12294A;color:#fff}
.po-panel .po-acc button:disabled{opacity:.4;cursor:not-allowed}
.po-panel .po-tw{max-height:230px;overflow:auto;border-top:1px solid #e3e8f0}
.po-panel table{width:100%;border-collapse:collapse;font:10.5px var(--tipo-texto,system-ui);color:#14233A}
.po-panel th{position:sticky;top:0;background:#0B1D33;color:#fff;font:600 8.5px var(--tipo-titulo,system-ui);letter-spacing:.04em;padding:4px 3px;text-transform:uppercase}
.po-panel td{padding:4px 3px;border-bottom:1px solid #e3e8f0;text-align:center;vertical-align:middle}
.po-panel tr{cursor:pointer}.po-panel tbody tr:hover{background:#f4f6fb}
.po-panel td.n b{display:inline-grid;place-items:center;width:19px;height:19px;border-radius:4px;background:#12294A;color:#fff;font:700 10px system-ui}
.po-panel tr.mejor td.n b{background:#B79A5B}
.po-panel td.l{text-align:left;line-height:1.25}.po-panel td.l small{display:block;color:#7a5c12;font-size:9px}
.po-panel td.v b{color:#2E7D47;font-size:11.5px}
.po-panel .po-bar{display:block;height:4px;margin-top:2px;border-radius:2px;background:linear-gradient(90deg,#2E9E50 var(--p),#e3e8f0 var(--p))}
.po-panel td .po-av{all:unset;cursor:pointer;font-size:13px;padding:0 2px}
.po-panel .rp-nota{margin:0;padding:6px 10px 9px;font-size:9px;color:#5A6B80;line-height:1.4}
.map.po-activo svg{cursor:crosshair!important}
#topo-puntos-obs .po-lin{fill:none;stroke-width:1.6;vector-effect:non-scaling-stroke;stroke-dasharray:5 4}
`;
document.head.append(css);

const panel = h('section', 'rp-panel po-panel'); panel.hidden = true; panel.setAttribute('aria-label', 'Puntos de observación');
panel.innerHTML = `<div class="rp-cab"><b>PUNTOS DE OBSERVACIÓN</b><button type="button" class="po-x" aria-label="Cerrar">×</button></div>
<div class="po-modo" role="tablist"><button type="button" data-m="obj">⊕ OBJETIVO</button><button type="button" data-m="aa">➚ AV. DE APROXIMACIÓN</button><button type="button" data-m="lin">✎ DIBUJAR LÍNEA</button></div>
<div class="po-aa" hidden></div>
<div class="po-def"><label>Buscar hasta (km)<input type="number" class="po-r" min="0.5" max="10" step="0.5" value="5"></label>
<label>Observador (m)<input type="number" class="po-ho" min="0" max="50" step="0.5" value="1.7"></label>
<label>Objetivo (m)<select class="po-ht"><option value="1.7">Persona 1,7</option><option value="2.5">Vehículo 2,5</option><option value="3.5">Blindado 3,5</option><option value="0">Suelo 0</option></select></label>
<label>Cantidad<select class="po-n"><option>3</option><option selected>5</option><option>8</option></select></label></div>
<div class="po-est"></div>
<div class="po-acc"><button type="button" class="pri po-calc">BUSCAR PUNTOS</button><button type="button" class="po-limpiar">QUITAR</button></div>
<div class="po-tw" hidden><table><thead><tr><th>N.º</th><th>Lugar · cota</th><th>Ve del objetivo</th><th>Dominio</th><th>Distancia · azimut</th><th></th></tr></thead><tbody class="po-filas"></tbody></table></div>
<p class="rp-nota">Busca las cimas del terreno con mejor vista sobre el objetivo o la avenida. <b>Ve del objetivo</b>: porcentaje de puntos del objetivo visibles desde ahí. <b>Dominio</b>: cuánto más alto está que el objetivo. Usa el MDT (cartas IGM 1:50.000 + Copernicus); considera curvatura y refracción, no edificios ni vegetación. 👁 abre su área visible.</p>`;
mapa.append(panel);
for (const t of ['pointerdown', 'click', 'dblclick', 'wheel']) panel.addEventListener(t, e => e.stopPropagation());
const $ = s => panel.querySelector(s);
const g = document.createElementNS(NS, 'g'); g.id = 'topo-puntos-obs'; g.setAttribute('pointer-events', 'none');
const colocarG = () => { if (!g.isConnected) { const ref = document.getElementById('topo-municipios-nombres'); ref ? ref.before(g) : scene.append(g); } };

let activo = false, modo = LS.get('modo', 'obj'), objetivo = LS.get('obj', null), linea = LS.get('lin', []), aaSel = 0, RES = LS.get('res', []), CERROS = null;
['r', 'ho'].forEach(k => { const v = LS.get(k, null); if (v != null) $('.po-' + k).value = v; });
['ht', 'n'].forEach(k => { const v = LS.get(k, null); if (v != null) $('.po-' + k).value = v; });
panel.querySelectorAll('.po-def input,.po-def select').forEach(e => e.addEventListener('change', () => LS.set(e.className.replace('po-', ''), e.value)));
fetch('data/cerros_omasuyos.geojson').then(r => r.ok ? r.json() : null).then(d => { CERROS = d ? d.features.filter(f => f.geometry && f.geometry.type === 'Point') : []; }).catch(() => { CERROS = []; });

const avenidas = () => (window.EMTE_HP_AA ? window.EMTE_HP_AA() : []).filter(r => r.coords && r.coords.length > 1);
function objetivoPts() {   // puntos que hay que ver
  if (modo === 'obj') { if (!objetivo) return [];
    const pts = [objetivo]; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = 150; pts.push([objetivo[0] + Math.sin(a) * r / mLonDe(objetivo[1]), objetivo[1] + Math.cos(a) * r / M_LAT]); } return pts; }
  const cs = modo === 'aa' ? (avenidas()[aaSel] || {}).coords || [] : linea;
  if (cs.length < 2) return [];
  const pts = []; let total = 0; for (let i = 1; i < cs.length; i++) total += distM(cs[i - 1], cs[i]);
  const paso = Math.max(100, total / 60);   // como máximo ~60 puntos a lo largo de la línea
  let resto = 0; pts.push(cs[0]);
  for (let i = 1; i < cs.length; i++) { const a = cs[i - 1], b = cs[i], L = distM(a, b); let d = paso - resto;
    while (d <= L) { const t = d / L; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); d += paso; } resto = L - (d - paso); }
  pts.push(cs[cs.length - 1]); return pts;
}
function zDe(D, lon, lat) {
  const fx = (lon - D.x0) / D.dx - .5, fy = (D.y0 - lat) / D.dy - .5;
  if (fx < 0 || fy < 0 || fx > D.w - 1 || fy > D.h - 1) return null;
  const x = Math.floor(fx), y = Math.floor(fy), tx = fx - x, ty = fy - y, Z = D.z, W = D.w, x1 = Math.min(x + 1, W - 1), y1 = Math.min(y + 1, D.h - 1);
  return (Z[y * W + x] * (1 - tx) + Z[y * W + x1] * tx) * (1 - ty) + (Z[y1 * W + x] * (1 - tx) + Z[y1 * W + x1] * tx) * ty;
}
const zT = (D, lon, lat) => { const v = zDe(D, lon, lat); return v == null ? null : Math.max(v, LAGO); };
function veo(D, a, za, b, ht) {   // intervisibilidad de a (ojo a za) hacia b (objetivo a ht sobre el suelo)
  const L = distM(a, b); if (L < 1) return true;
  const zb = zT(D, b[0], b[1]); if (zb == null) return false;
  const kR = 1 - .13, Rt = 6371000, tgt = zb + ht - L * L / (2 * Rt) * kR, paso = Math.max(30, Math.abs(D.dy) * M_LAT * .8), n = Math.floor(L / paso);
  for (let i = 1; i < n; i++) { const t = i / n, d = L * t, zz = zT(D, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); if (zz == null) continue;
    const linea = za + (tgt - za) * t, suelo = zz - d * d / (2 * Rt) * kR; if (suelo > linea) return false; }
  return true;
}
function nombreCerca(lon, lat) {
  if (!CERROS) return null; let m = 700, n = null;
  for (const f of CERROS) { const d = distM([lon, lat], f.geometry.coordinates); if (d < m) { m = d; n = f.properties.nombre; } }
  return n;
}
function buscar() {
  const D = window.EMTE_DEM && window.EMTE_DEM(); if (!D) return;
  const P = objetivoPts(); if (!P.length) { estado(); return; }
  const R = Math.min(10, Math.max(.5, parseFloat(String($('.po-r').value).replace(',', '.')) || 5)) * 1000;
  const ho = Math.max(0, parseFloat(String($('.po-ho').value).replace(',', '.')) || 0), ht = +$('.po-ht').value, N = +$('.po-n').value;
  // caja de búsqueda: alrededor de todos los puntos del objetivo
  let lo0 = 1e9, lo1 = -1e9, la0 = 1e9, la1 = -1e9; P.forEach(([lo, la]) => { lo0 = Math.min(lo0, lo); lo1 = Math.max(lo1, lo); la0 = Math.min(la0, la); la1 = Math.max(la1, la); });
  const lat = (la0 + la1) / 2, dLo = R / mLonDe(lat), dLa = R / M_LAT;
  const ix = lo => Math.floor((lo - D.x0) / D.dx), iy = la => Math.floor((D.y0 - la) / D.dy);
  const x0 = Math.max(2, ix(lo0 - dLo)), x1 = Math.min(D.w - 3, ix(lo1 + dLo)), y0 = Math.max(2, iy(la1 + dLa)), y1 = Math.min(D.h - 3, iy(la0 - dLa));
  const VEN = 4, Z = D.z, W = D.w, cand = [];   // cima local: la más alta en una ventana de 9×9 celdas (~400 m)
  const zMin = Math.min(...P.map(p => zT(D, p[0], p[1]) ?? 1e9));
  for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) {
    const z0 = Z[y * W + x]; if (!(z0 > LAGO + 5)) continue;
    let max = true; for (let dy = -VEN; dy <= VEN && max; dy++) { const yy = y + dy; if (yy < 0 || yy >= D.h) continue; for (let dx = -VEN; dx <= VEN; dx++) { const xx = x + dx; if (xx < 0 || xx >= W || (!dx && !dy)) continue; if (Z[yy * W + xx] > z0) { max = false; break; } } }
    if (!max) continue;
    const lon = D.x0 + (x + .5) * D.dx, la = D.y0 - (y + .5) * D.dy;
    const dmin = Math.min(...P.map(p => distM([lon, la], p))); if (dmin > R || dmin < 200) continue;
    cand.push({ lon, lat: la, z: z0, dmin });
  }
  const res = [];
  for (const c of cand) {
    const za = c.z + ho; let v = 0; for (const p of P) if (veo(D, [c.lon, c.lat], za, p, ht)) v++;
    if (!v) continue;
    const pct = v / P.length * 100, dom = c.z - zMin;
    if (dom < 5) continue;   // un puesto de observación debe dominar (estar más alto que) el objetivo
    const score = pct * 1.0 + Math.min(40, Math.max(0, dom) / 10) - c.dmin / R * 15;   // ver mucho, dominar y no estar demasiado lejos
    res.push({ lon: c.lon, lat: c.lat, z: c.z, pct, dom, d: c.dmin, score });
  }
  res.sort((a, b) => b.score - a.score);
  const sel = []; for (const r of res) { if (sel.every(s => distM([s.lon, s.lat], [r.lon, r.lat]) > 600)) sel.push(r); if (sel.length >= N) break; }
  const ref = modo === 'obj' ? objetivo : P[Math.floor(P.length / 2)];
  sel.forEach((s, i) => { s.n = i + 1; s.az = azimut([s.lon, s.lat], ref); s.nom = nombreCerca(s.lon, s.lat); });
  RES = sel; LS.set('res', RES); pintar(); tabla(); estado(cand.length);
}
function estado(nc) {
  const e = $('.po-est'), aa = avenidas();
  panel.querySelector('.po-modo [data-m=aa]').disabled = !aa.length;
  const pa = $('.po-aa'); pa.hidden = modo !== 'aa'; pa.replaceChildren();
  if (modo === 'aa') aa.forEach((r, i) => { const b = h('button', i === aaSel ? 'on' : null, 'AA-' + r.n + (r.km ? ' · ' + dec(r.km, 1) + ' km' : '')); b.type = 'button'; b.onclick = () => { aaSel = i; estado(); pintar(); }; pa.append(b); });
  let t = '';
  if (modo === 'obj') t = objetivo ? `<b>Objetivo marcado.</b> Haz clic en otro lugar del mapa para cambiarlo.` : `<b>Haz clic en el mapa</b> para marcar el objetivo que se quiere observar.`;
  else if (modo === 'aa') t = aa.length ? `Se evalúa la <b>AA-${(aa[aaSel] || aa[0]).n}</b> calculada en Planeamiento › Avenidas de aproximación.` : `No hay avenidas calculadas. Calcúlalas en Planeamiento › Avenidas de aproximación o usa «Dibujar línea».`;
  else t = linea.length > 1 ? `<b>Línea de ${linea.length} puntos.</b> Sigue haciendo clic para alargarla; doble clic o «Buscar» para terminar.` : `<b>Haz clic en el mapa</b> punto por punto para dibujar la avenida o el itinerario.`;
  if (nc != null) t += RES.length ? ` · ${nc} cimas analizadas, ${RES.length} puntos elegidos.` : ` · ${nc} cimas analizadas: ninguna ve el objetivo; aumenta la distancia de búsqueda.`;
  e.innerHTML = t;
  $('.po-calc').disabled = !objetivoPts().length;
}
function tabla() {
  const tb = $('.po-filas'); tb.replaceChildren(); $('.po-tw').hidden = !RES.length;
  const T = window.EMTE_TOPO;
  RES.forEach((s, i) => { const tr = h('tr', i === 0 ? 'mejor' : null), u = T ? T.textos(s.lat, s.lon) : null;
    tr.innerHTML = `<td class="n"><b>PO${s.n}</b></td><td class="l">${s.nom ? '<b>' + s.nom + '</b><br>' : ''}${u ? u.utm.replace(/^19S /, '') : dec(s.lat, 5) + ', ' + dec(s.lon, 5)}<small>${miles(s.z)} m s.n.m.</small></td>
<td class="v"><b>${Math.round(s.pct)} %</b><span class="po-bar" style="--p:${Math.round(s.pct)}%"></span></td><td>${s.dom >= 0 ? '+' : ''}${miles(s.dom)} m</td><td>${distTxt(s.d / 1000)}<br>${Math.round(s.az)}°</td><td><button type="button" class="po-av" title="Ver su área visible" aria-label="Ver área visible de PO${s.n}">👁</button></td>`;
    tr.onclick = e => { if (e.target.closest('.po-av')) { window.EMTE_AREA_VISIBLE?.calcular([s.lon, s.lat]); return; } window.EMTE_TOPO?.volar?.(s.lon - .02, s.lat - .02, s.lon + .02, s.lat + .02, .9); };
    tb.append(tr); });
}
function marca(x, y, html, cls) { const m = document.createElementNS(NS, 'g'); m.setAttribute('class', 'po-m ' + (cls || '')); m.dataset.x = x; m.dataset.y = y; m.setAttribute('transform', `translate(${x} ${y}) scale(${1 / (typeof scale === 'number' ? scale : 1)})`); m.innerHTML = html; g.append(m); return m; }
function pintar() {
  g.replaceChildren(); const ref = modo === 'obj' ? objetivo : null;
  const cs = modo === 'aa' ? (avenidas()[aaSel] || {}).coords || [] : modo === 'lin' ? linea : [];
  if (cs.length > 1) { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', 'M' + cs.map(c => aEscena(c[0], c[1]).map(v => v.toFixed(1)).join(' ')).join('L')); p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#B42330'); p.setAttribute('stroke-width', 3); p.setAttribute('vector-effect', 'non-scaling-stroke'); p.setAttribute('stroke-dasharray', modo === 'lin' ? '8 5' : ''); p.setAttribute('opacity', '.85'); g.append(p); }
  const P = objetivoPts(), centro = ref || (P.length ? P[Math.floor(P.length / 2)] : null);
  RES.forEach(s => { if (!centro) return; const [a, b] = aEscena(s.lon, s.lat), [c, d] = aEscena(centro[0], centro[1]); const l = document.createElementNS(NS, 'line'); l.setAttribute('x1', a); l.setAttribute('y1', b); l.setAttribute('x2', c); l.setAttribute('y2', d); l.setAttribute('class', 'po-lin'); l.setAttribute('stroke', s.n === 1 ? '#B79A5B' : '#12294A'); g.append(l); });
  if (ref) { const [x, y] = aEscena(ref[0], ref[1]); marca(x, y, '<circle r="11" fill="#fff" stroke="#B42330" stroke-width="2.5"/><circle r="4" fill="#B42330"/><path d="M-16 0H-8M8 0H16M0 -16V-8M0 8V16" stroke="#B42330" stroke-width="2.5"/>'); }
  RES.forEach(s => { const [x, y] = aEscena(s.lon, s.lat), col = s.n === 1 ? '#B79A5B' : '#12294A';
    marca(x, y, `<path d="M0 -14L13 9H-13Z" fill="#fff" stroke="${col}" stroke-width="2.6" stroke-linejoin="round"/><circle cy="1" r="2.6" fill="${col}"/><rect x="11" y="-21" width="${s.n > 9 ? 30 : 25}" height="15" rx="7" fill="${col}"/><text x="${s.n > 9 ? 26 : 23.5}" y="-10" text-anchor="middle" font-size="10" font-weight="800" font-family="system-ui" fill="#fff">PO${s.n}</text><title>PO${s.n}${s.nom ? ' · ' + s.nom : ''} · ve ${Math.round(s.pct)} % · ${miles(s.z)} m</title>`); });
  if (g.childNodes.length) colocarG(); else g.remove();
}
function abrir(on) {
  activo = on; panel.hidden = !on; mapa.classList.toggle('po-activo', on && modo !== 'aa'); tarj && tarj.classList.toggle('chosen', on);
  panel.querySelectorAll('.po-modo button').forEach(b => b.classList.toggle('on', b.dataset.m === modo));
  if (on) { dem().catch(() => { $('.po-est').textContent = 'No se pudo cargar el modelo de elevación.'; }); estado(); tabla(); pintar(); }
}
panel.querySelectorAll('.po-modo button').forEach(b => b.onclick = () => { modo = b.dataset.m; LS.set('modo', modo); RES = []; LS.set('res', RES); abrir(true); });
$('.po-x').onclick = () => abrir(false);
$('.po-calc').onclick = () => { $('.po-est').innerHTML = '<b>Analizando el terreno…</b>'; dem().then(() => setTimeout(buscar, 30)).catch(() => {}); };
$('.po-limpiar').onclick = () => { RES = []; objetivo = null; linea = []; ['res', 'obj', 'lin'].forEach(k => LS.set(k, k === 'obj' ? null : [])); pintar(); tabla(); estado(); };
let abajo = null;
svgMapa.addEventListener('pointerdown', e => { if (activo) abajo = [e.clientX, e.clientY]; }, true);
svgMapa.addEventListener('click', e => {
  if (!activo || modo === 'aa') return;
  e.stopPropagation(); e.preventDefault();
  if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 5) return;
  const m = scene.getScreenCTM(); if (!m) return; const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()), ll = deEscena(p.x, p.y);
  if (modo === 'obj') { objetivo = ll; LS.set('obj', ll); } else { linea.push(ll); LS.set('lin', linea); }
  RES = []; LS.set('res', RES); tabla(); pintar(); estado();
}, true);
svgMapa.addEventListener('dblclick', e => { if (activo && modo === 'lin') { e.stopPropagation(); e.preventDefault(); if (linea.length > 1) $('.po-calc').click(); } }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && activo) abrir(false); });
const zoomAnt = zoom;
zoom = function (f) { zoomAnt(f); g.querySelectorAll('.po-m').forEach(m => m.setAttribute('transform', `translate(${m.dataset.x} ${m.dataset.y}) scale(${1 / scale})`)); };
window.EMTE_PUNTOS_OBS = { abrir: () => abrir(true) };

/* tarjeta en Herramientas, junto a «Área visible» */
const menuHerr = [...document.querySelectorAll('main>aside details')].find(d => (d.querySelector('summary')?.textContent || '').trim().startsWith('Herramientas'));
const grilla = menuHerr && menuHerr.querySelector('.visual-tools-grid');
const tarj = h('button', 'visual-card'); tarj.type = 'button';
tarj.innerHTML = '<span class="tool-picture"><svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="64" height="64" rx="12" fill="#eef1e8"/><path d="M2 54L18 30 28 40 40 18 62 50V62H2Z" fill="#8FA36B"/><path d="M40 18L33 10H47Z" fill="#fff" stroke="#12294A" stroke-width="2.4" stroke-linejoin="round"/><circle cx="40" cy="14" r="1.8" fill="#12294A"/><path d="M40 18L14 52" stroke="#B79A5B" stroke-width="2.2" stroke-dasharray="4 3"/><circle cx="14" cy="52" r="5" fill="#fff" stroke="#B42330" stroke-width="2.4"/><circle cx="14" cy="52" r="1.8" fill="#B42330"/></svg></span><span>◭ Puntos de observación</span>';
tarj.title = 'Busca los cerros con mejor vista sobre un objetivo o una avenida de aproximación';
tarj.onclick = () => abrir(panel.hidden);
const av = grilla && [...grilla.children].find(b => /Área visible/i.test(b.textContent));
if (av) av.after(tarj); else (grilla || document.querySelector('main>aside'))?.append(tarj);
if (RES.length || objetivo || linea.length) setTimeout(pintar, 1500);   // lo marcado queda en el mapa al volver
});
