/* TC · Terreno clave (agregado por BYNS7). Pestaña PLANEAMIENTO, después del COC.
   Sigue el PICB, «4) El terreno clave» (pág. 24–26):
   · Terreno clave: localidad o área cuya conquista, retención o control da una ventaja marcada al combatiente.
   · Se evalúa por el impacto de su conquista por cualquiera de las fuerzas; primero se evalúan los otros cuatro aspectos
     militares del terreno (obstáculos = COC, observación, direcciones de aproximación) y se integran: sobre una sola
     dirección de aproximación, sus puntos restrictivos pueden ser terreno clave.
   · Ofensiva: al frente de las posiciones avanzadas amigas (objetivos); terreno que ofrece observación eficaz al enemigo a lo
     largo del eje de avance amigo. Defensiva: buena observación sobre las direcciones de aproximación y posiciones defensivas;
     terreno que permite cubrir un obstáculo con fuego; cruces de caminos y centros de comunicaciones importantes.
   · Ejemplos: puente sobre un río invadeable; área despejada en terreno escabroso que es el único campo de aterrizaje.
   · Varía según el nivel de mando (ciudad grande para el teatro / ejército; terreno elevado que domina la ciudad para la división).
   · Rara vez un obstáculo mayor es terreno clave: lo es el terreno elevado que lo domina (excepción: área urbanizada objetivo).
   · Terreno decisivo: terreno clave de impacto extraordinario, lo designa el comandante.
   · Representación: «K» grande dentro de un círculo o curva que encierra y sigue los contornos del terreno; color morado.
   Datos: modelo de elevación del geovisor (EMTE_DEM), ríos, mancha urbana, vías, puentes y campos de aterrizaje. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main>aside'), mapa = document.querySelector('.map'), scene = document.getElementById('scene');
if (!aside || !mapa || !scene) return;
const svgR = scene.ownerSVGElement, NS = 'http://www.w3.org/2000/svg', D2R = Math.PI / 180;
const K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702;
const aEscena = (lon, lat) => [500 + (lon * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) + OY) * K];
const deEscena = (x, y) => [((x - 500) / K - OX) / D2R, (2 * Math.atan(Math.exp((380 - y) / K - OY)) - Math.PI / 2) / D2R];
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const dec = (n, d = 0) => n.toFixed(d).replace('.', ',');
const miles = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const esca = () => (typeof scale === 'number' && scale > 0 ? scale : 1);
const MOR = '#7B2CBF', LAGO = 3808;
const MX = 111320 * Math.cos(16.0 * D2R), MY = 110574;   // metros por grado en Omasuyos
const dist = (a, b) => Math.hypot((a[0] - b[0]) * MX, (a[1] - b[1]) * MY);

/* ---------------- categorías (ejemplos del PICB) ---------------- */
const CAT = {
  obs: { n: 'Terreno que provee buena observación', d: 'Alturas dominantes del AI' },
  ejeobs: { n: 'Observación sobre la dirección / eje de avance', d: 'Alturas desde donde se observa la dirección de aproximación dibujada (o el eje del COC)' },
  restr: { n: 'Puntos restrictivos sobre la dirección de aproximación', d: 'Donde el terreno transitable se angosta' },
  rio: { n: 'Terreno elevado que domina un río', d: 'Permite cubrir el obstáculo con fuego' },
  pueblo: { n: 'Terreno elevado que domina un poblado', d: 'Nivel división' },
  puente: { n: 'Puentes sobre ríos', d: 'Dan acceso a la orilla opuesta sin asalto' },
  cruce: { n: 'Cruces de caminos', d: 'Afectan el uso de reservas, sostenimiento y líneas de comunicación' },
  ciudad: { n: 'Ciudades y centros de comunicaciones', d: 'Nivel teatro de operaciones / ejército' },
  campo: { n: 'Campos de aterrizaje en terreno escabroso', d: 'Área despejada que puede ser el único campo para operaciones aeromóviles' }
};
const PRESET = {
  ofensiva: ['obs', 'ejeobs', 'restr', 'puente', 'campo'],
  defensiva: ['obs', 'ejeobs', 'rio', 'cruce', 'puente']
};
const MOTIVOS = ['Observación y campos de tiro', 'Domina la dirección de aproximación', 'Punto restrictivo de la dirección de aproximación',
  'Permite cubrir un obstáculo con fuego', 'Domina un poblado', 'Puente sobre río invadeable', 'Cruce de caminos / centro de comunicaciones',
  'Ciudad / centro de comunicaciones', 'Único campo de aterrizaje', 'Objetivo asignado', 'Otro'];
const MOT_CAT = { obs: 0, ejeobs: 1, restr: 2, rio: 3, pueblo: 4, puente: 5, cruce: 6, ciudad: 7, campo: 8 };

let S = { sit: 'ofensiva', nivel: 'division', cats: PRESET.ofensiva.slice(), usarEje: true, domMin: 60, ancho: 800, dirs: [], tc: [], ver: true };
try { const g = JSON.parse(localStorage.getItem('emte-tc') || 'null'); if (g && Array.isArray(g.tc)) S = Object.assign(S, g, { ver: false }); } catch (e) {}
const guardar = () => { try { localStorage.setItem('emte-tc', JSON.stringify(S)); } catch (e) {} };
let CAND = [];

/* ---------------- estilos ---------------- */
const css = h('style');
css.textContent = `
.tc-menu .tc-c,.tc-menu .tc-c *{text-transform:none!important}
.tc-menu .tc-c{padding:6px 10px 12px;font:12px var(--tipo-texto,system-ui);color:#14233A}
.tc-menu h4{margin:12px 0 5px;font:700 11px var(--tipo-titulo,system-ui);letter-spacing:.06em;color:#0B1D33;border-bottom:2px solid ${MOR};padding-bottom:3px;text-transform:uppercase!important}
.tc-menu .f{display:flex;align-items:center;gap:6px;margin:5px 0;flex-wrap:wrap}
.tc-menu label.k{display:flex;align-items:flex-start;gap:6px;margin:3px 0;cursor:pointer;line-height:1.25}
.tc-menu label.k small{display:block;color:#5A6B80;font-size:10.5px}
.tc-menu select,.tc-menu input[type=number],.tc-menu input[type=text]{padding:3px 5px;border:1px solid #cfd6e6;border-radius:5px;font:600 11.5px system-ui;color:#12294A;background:#fff;box-sizing:border-box}
.tc-menu input[type=number]{width:62px;text-align:right}
.tc-menu .b{padding:5px 9px;border:1px solid #cfd6e6;border-radius:6px;background:#fff;color:#12294A;font:600 11px system-ui;cursor:pointer}
.tc-menu .b:hover{background:#f3ecfb}.tc-menu .b.on,.tc-menu .b.p{background:${MOR};color:#fff;border-color:${MOR}}
.tc-menu .msg{font-size:11px;color:#5A6B80;margin:4px 0}
.tc-menu .ca{border:1px solid #e3e8f0;border-radius:6px;margin:6px 0;overflow:hidden}
.tc-menu .ca>b{display:block;padding:4px 8px;background:#f3ecfb;color:${MOR};font-size:11px}
.tc-menu .it{display:flex;align-items:center;gap:6px;padding:4px 8px;border-top:1px solid #f0f2f6;font-size:11px}
.tc-menu .it .n{display:inline-grid;place-items:center;min-width:18px;height:18px;border-radius:50%;border:1.5px solid ${MOR};color:${MOR};font:700 10px system-ui}
.tc-menu .it .t{flex:1;cursor:pointer;line-height:1.25}.tc-menu .it .t small{display:block;color:#5A6B80}
.tc-menu .kb{border:1.5px solid ${MOR};background:#fff;color:${MOR};border-radius:50%;width:24px;height:24px;font:800 12px system-ui;cursor:pointer}
.tc-menu .kb:hover{background:${MOR};color:#fff}
.tc-menu table{width:100%;border-collapse:collapse;font-size:11px}
.tc-menu td{padding:4px 3px;border-bottom:1px solid #e3e8f0;vertical-align:middle}
.tc-menu td select,.tc-menu td input[type=text]{width:100%}
.tc-menu .x{border:0;background:none;color:#9B1C1C;font:700 14px system-ui;cursor:pointer}
.tc-menu .reg{font-size:10.5px;color:#3a4658;line-height:1.35}.tc-menu .reg summary{cursor:pointer;font-weight:700;color:#0B1D33}
.map.tc-dib svg{cursor:crosshair!important}`;
document.head.append(css);

/* ---------------- panel ---------------- */
const sec = h('details', 'layer-menu tc-menu');
sec.innerHTML = `<summary>TC · Terreno clave</summary><div class="tc-c">
<details class="reg"><summary>Terreno clave (PICB, 4) El terreno clave)</summary>
Localidad o área cuya conquista, retención o control da una ventaja marcada al combatiente. Se evalúa por el impacto de su conquista por cualquiera de las fuerzas sobre los resultados de la batalla: primero se evalúan los otros cuatro aspectos militares del terreno y se integran sus resultados; de permitirlo el tiempo, conduzca un juego de guerra en escala reducida. Se representa con una «K» grande dentro de un círculo o curva que sigue los contornos del terreno, en morado. El terreno decisivo es terreno clave de impacto extraordinario y lo designa el comandante.</details>
<h4>1 · Situación</h4>
<div class="f"><select id="tc-sit"><option value="ofensiva">Ofensiva</option><option value="defensiva">Defensiva</option></select>
<select id="tc-niv"><option value="teatro">Teatro de operaciones / ejército</option><option value="division">División</option><option value="menor">Unidad de menor nivel</option></select></div>
<h4>2 · Direcciones de aproximación</h4>
<div class="f"><button type="button" class="b" id="tc-dir">Dibujar dirección</button><button type="button" class="b" id="tc-fin" hidden>Terminar</button><button type="button" class="x" id="tc-dirx" title="Quitar direcciones">×</button></div>
<label class="k"><input type="checkbox" id="tc-eje"> <span>Usar también el eje de avance del COC</span></label>
<div class="msg" id="tc-dm"></div>
<h4>3 · Terreno clave potencial</h4><div id="tc-cats"></div>
<div class="f"><span>Dominio mínimo</span><input type="number" id="tc-dom" min="10" max="500" step="10"> m <span>· Paso angosto</span><input type="number" id="tc-anc" min="100" max="5000" step="100"> m</div>
<div class="f"><button type="button" class="b p" id="tc-an">Analizar</button><span class="msg" id="tc-am"></span></div>
<div id="tc-res"></div>
<h4>4 · Terreno clave designado</h4>
<div class="f"><button type="button" class="b" id="tc-man">Dibujar terreno clave</button><label class="k" style="margin:0"><input type="checkbox" id="tc-ver"> <span>Mostrar en el mapa</span></label></div>
<table><tbody id="tc-tab"></tbody></table>
</div>`;
const $ = id => document.getElementById(id);
function colocar() { const c = aside.querySelector('.coc-menu') || aside.querySelector('.ap-menu') || aside.querySelector('.pc-menu'); c ? c.after(sec) : aside.append(sec); }
colocar(); setTimeout(colocar, 17000);
for (const t of ['pointerdown', 'click', 'wheel']) sec.addEventListener(t, e => e.stopPropagation());

/* ---------------- capa SVG ---------------- */
const g = document.createElementNS(NS, 'g'); g.id = 'tc-capa'; g.setAttribute('pointer-events', 'none');
const gC = document.createElementNS(NS, 'g'), gT = document.createElementNS(NS, 'g'), gD = document.createElementNS(NS, 'g'), gTmp = document.createElementNS(NS, 'g');
g.append(gD, gC, gT, gTmp);
const sel = (tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
const path = pts => pts.map((p, i) => { const [x, y] = aEscena(p[0], p[1]); return (i ? 'L' : 'M') + x.toFixed(3) + ' ' + y.toFixed(3); }).join('');
function marca(lon, lat, html) { const [x, y] = aEscena(lon, lat), m = sel('g', { class: 'tc-et' }); m.dataset.x = x; m.dataset.y = y; m.setAttribute('transform', `translate(${x} ${y}) scale(${1 / esca()})`); m.innerHTML = html; return m; }
if (typeof zoom === 'function') { const zp = zoom; zoom = function (...a) { const r = zp.apply(this, a); g.querySelectorAll('.tc-et').forEach(t => t.setAttribute('transform', `translate(${t.dataset.x} ${t.dataset.y}) scale(${1 / scale})`)); return r; }; }
function poner() { if (!g.isConnected) { const ref = document.getElementById('topo-municipios-nombres'); ref ? ref.before(g) : scene.append(g); } }
const defs = svgR.querySelector('defs') || svgR.insertBefore(document.createElementNS(NS, 'defs'), svgR.firstChild);
defs.insertAdjacentHTML('beforeend', `<marker id="tc-flecha" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#B03A2E"/></marker>`);

/* ---------------- datos ---------------- */
let DAT = null, carg = null, VIAS = null;
const j = u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
function cargar() {
  if (carg) return carg;
  carg = Promise.all([(window.EMTE_CARGAR_DEM ? window.EMTE_CARGAR_DEM() : Promise.reject()).then(() => window.EMTE_DEM()),
    j('data/rios_omasuyos.geojson'), j('data/mancha_urbana_omasuyos.geojson').catch(() => ({ features: [] })), j('data/planeamiento_apoyo.json'),
    j('data/cerros_omasuyos.geojson').catch(() => ({ features: [] })), j('data/limite_omasuyos.geojson')])
    .then(([D, rios, mancha, apoyo, cerros, lim]) => {
      DAT = { D, rios: rios.features, mancha: mancha.features, apoyo, cerros: cerros.features, lim: lim.features };
      prepararDEM(); return DAT;
    }).catch(e => { carg = null; throw e; });
  return carg;
}
const lineas = gm => gm.type === 'LineString' ? [gm.coordinates] : gm.type === 'MultiLineString' ? gm.coordinates : [];
const anillos = gm => gm.type === 'Polygon' ? [gm.coordinates] : gm.type === 'MultiPolygon' ? gm.coordinates : [];
function dentroPol(p, polys) {
  for (const pol of polys) { let c = false; const r = pol[0]; for (let i = 0, k = r.length - 1; i < r.length; k = i++) { const [xi, yi] = r[i], [xk, yk] = r[k]; if ((yi > p[1]) !== (yk > p[1]) && p[0] < (xk - xi) * (p[1] - yi) / (yk - yi) + xi) c = !c; } if (c) return true; }
  return false;
}
let PROV = null;
const enProv = p => dentroPol(p, PROV);
function enAI(p) { const c = window.EMTE_COC && window.EMTE_COC.estado().ai; if (c) return p[0] >= c[0] && p[0] <= c[2] && p[1] <= c[1] && p[1] >= c[3]; return enProv(p); }

/* ---------------- modelo de elevación: máximos locales, dominio y pendiente ---------------- */
let ZF = null, MED = null, PEN = null;
function prepararDEM() {
  const { D } = DAT, W = D.w, H = D.h, Z = D.z; PROV = DAT.lim.flatMap(f => anillos(f.geometry));
  ZF = Z;
  // media en 3 km (imagen integral) para el dominio = altura sobre el terreno circundante
  const I = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) { let s = 0; for (let x = 0; x < W; x++) { s += Z[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + s; } }
  const r = Math.round(3000 / (D.dx * MX)); MED = (x, y) => { const x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1), y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1); return (I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]) / ((x1 - x0) * (y1 - y0)); };
  const mx = D.dx * MX, my = D.dy * MY; PEN = new Float32Array(W * H);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const k = y * W + x; PEN[k] = Math.hypot((Z[k + 1] - Z[k - 1]) / (2 * mx), (Z[k + W] - Z[k - W]) / (2 * my)) * 100; }
}
const celda = (lon, lat) => { const D = DAT.D; return [Math.floor((lon - D.x0) / D.dx), Math.floor((D.y0 - lat) / D.dy)]; };
const centro = (x, y) => { const D = DAT.D; return [D.x0 + (x + .5) * D.dx, D.y0 - (y + .5) * D.dy]; };
function zEn(lon, lat) {
  const D = DAT.D, fx = (lon - D.x0) / D.dx - .5, fy = (D.y0 - lat) / D.dy - .5; if (fx < 0 || fy < 0 || fx > D.w - 2 || fy > D.h - 2) return null;
  const x = Math.floor(fx), y = Math.floor(fy), tx = fx - x, ty = fy - y, Z = D.z, W = D.w;
  return (Z[y * W + x] * (1 - tx) + Z[y * W + x + 1] * tx) * (1 - ty) + (Z[(y + 1) * W + x] * (1 - tx) + Z[(y + 1) * W + x + 1] * tx) * ty;
}
function visible(a, b, ha = 1.7, hb = 1.7) {   // línea de vista con curvatura terrestre y refracción (k = 0,13)
  const za = zEn(a[0], a[1]), zb = zEn(b[0], b[1]); if (za == null || zb == null) return false;
  const L = dist(a, b); if (L < 50) return true; const n = Math.ceil(L / 45), o = za + ha, kR = .87 / (2 * 6371000);
  const pf = (zb + hb - L * L * kR - o) / L;
  for (let i = 1; i < n; i++) { const t = i / n, d = L * t, z = zEn(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t); if (z == null) return false; if ((Math.max(z, LAGO) - d * d * kR - o) / d > pf) return false; }
  return true;
}
function alturas() {   // máximos locales (radio ~450 m) con su dominio sobre el terreno circundante (3 km)
  const { D } = DAT, W = D.w, H = D.h, Z = D.z, R = 10, out = [];
  for (let y = R; y < H - R; y += 2) for (let x = R; x < W - R; x += 2) {
    const z = Z[y * W + x]; if (z <= LAGO + 15) continue; let ok = true, bx = x, by = y, bz = z;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const zz = Z[(y + dy) * W + x + dx]; if (zz > bz) { bz = zz; bx = x + dx; by = y + dy; } }
    for (let dy = -R; dy <= R && ok; dy++) for (let dx = -R; dx <= R; dx++) if (Z[(by + dy) * W + bx + dx] > bz) { ok = false; break; }
    if (!ok) continue; const p = centro(bx, by); if (!enAI(p)) continue;
    const dom = bz - MED(bx, by); if (dom < S.domMin) continue;
    if (out.some(o => o.x === bx && o.y === by)) continue;
    out.push({ x: bx, y: by, p, z: bz, dom });
  }
  out.forEach(o => { let best = null, bd = 900; DAT.cerros.forEach(f => { const c = f.geometry.coordinates, dd = dist(c, o.p); if (dd < bd) { bd = dd; best = f.properties.nombre; } }); o.nom = best; });
  out.sort((a, b) => b.z - a.z);
  return out.filter((o, i) => !out.slice(0, i).some(q => dist(q.p, o.p) < 700)).sort((a, b) => b.dom - a.dom);   // una sola cima por cerro
}
function direcciones() { const L = S.dirs.slice(); const e = window.EMTE_COC && window.EMTE_COC.estado().eje; if (S.usarEje && e) L.push(e); return L; }
function muestrear(l, paso) { const out = []; for (let i = 0; i < l.length - 1; i++) { const a = l[i], b = l[i + 1], n = Math.max(1, Math.ceil(dist(a, b) / paso)); for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } out.push(l[l.length - 1]); return out; }
let RM = null;
const riosM = () => RM || (RM = DAT.rios.filter(f => /^R[ií]o/i.test(f.properties.tipo || '')).flatMap(f => lineas(f.geometry).map(l => ({ n: f.properties.nombre, m: muestrear(l, 100) }))));
const dLinea = (p, l) => Math.min(...muestrear(l, 200).map(q => dist(p, q)));

/* ---------------- análisis por categoría ---------------- */
function analizar() {
  const t0 = performance.now(), res = {}, A = alturas(), dirs = direcciones(), nombreA = o => (o.nom ? o.nom + ' · ' : '') + miles(o.z) + ' m';
  if (S.cats.includes('obs')) res.obs = A.slice(0, 15).map(o => ({ p: o.p, z: o.z, t: nombreA(o), s: 'Domina ' + miles(o.dom) + ' m el terreno circundante (3 km)', alt: o }));
  if (S.cats.includes('ejeobs') && dirs.length) {
    const L = []; dirs.forEach(l => { const m = muestrear(l, 300); A.forEach(o => { const dd = dLinea(o.p, l); if (dd > 6000) return; const cerca = m.filter(q => dist(q, o.p) <= 6000); if (!cerca.length) return; const v = cerca.filter(q => visible(o.p, q)).length / cerca.length; if (v >= .3) L.push({ p: o.p, z: o.z, t: nombreA(o), s: `Observa el ${dec(v * 100)} % de la dirección a menos de 6 km`, v, alt: o }); }); });
    res.ejeobs = L.sort((a, b) => b.v - a.v).filter((o, i, a) => a.findIndex(q => q.p === o.p) === i).slice(0, 12);
  }
  if (S.cats.includes('restr') && dirs.length) res.restr = restrictivos(dirs);
  if (S.cats.includes('rio')) {
    const L = [];
    A.forEach(o => { let best = null; riosM().forEach(r => { const pts = r.m.filter((q, i) => i % 3 === 0 && dist(q, o.p) <= 2500); if (!pts.length) return; const v = pts.filter(q => visible(o.p, q, 1.7, 0)).length; if (v && (!best || v > best.v)) best = { v, n: r.n || 'río', len: v * 300 }; }); if (best) L.push({ p: o.p, z: o.z, t: nombreA(o), s: `Domina ${esc(best.n)}: ~${miles(best.len)} m de cauce bajo observación y fuego`, v: best.len, alt: o }); });
    res.rio = L.sort((a, b) => b.v - a.v).slice(0, 12);
  }
  if (S.cats.includes('pueblo')) {
    const pb = DAT.mancha.filter(f => f.properties.construcciones >= 500), L = [];
    A.forEach(o => { pb.forEach(f => { const r = anillos(f.geometry)[0][0], c = r.reduce((a, q) => [a[0] + q[0] / r.length, a[1] + q[1] / r.length], [0, 0]), dd = dist(c, o.p); if (dd > 3000) return; const zc = zEn(c[0], c[1]); if (zc == null || o.z - zc < 40 || !visible(o.p, c, 1.7, 5)) return; L.push({ p: o.p, z: o.z, t: nombreA(o), s: `Domina ${esc(f.properties.municipio || 'poblado')} (${miles(f.properties.construcciones)} construcciones) desde ${miles(o.z - zc)} m más alto, a ${dec(dd / 1000, 1)} km`, v: (o.z - zc) * f.properties.construcciones / dd, alt: o }); }); });
    res.pueblo = L.sort((a, b) => b.v - a.v).slice(0, 10);
  }
  if (S.cats.includes('puente')) {
    res.puente = DAT.apoyo.puentes.map(b => { const p = [b[2], b[1]]; if (!enAI(p)) return null; let best = null; riosM().forEach(r => { const dd = Math.min(...r.m.map(q => dist(p, q))); if (dd < 200 && (!best || dd < best.d)) best = { d: dd, n: r.n }; }); return best ? { p, t: b[0] || 'Puente', s: `Sobre ${esc(best.n || 'río')} · ${esc(b[3] || '')}${b[5] ? ' · ' + b[5] + ' m' : ''}`, v: +b[5] || 0 } : null; }).filter(Boolean).sort((a, b) => b.v - a.v).slice(0, 15);
  }
  if (S.cats.includes('ciudad')) {
    res.ciudad = DAT.mancha.filter(f => f.properties.construcciones >= 800).map(f => { const r = anillos(f.geometry)[0][0], c = r.reduce((a, q) => [a[0] + q[0] / r.length, a[1] + q[1] / r.length], [0, 0]); return enAI(c) ? { p: c, t: f.properties.municipio || 'Poblado', s: `${miles(f.properties.construcciones)} construcciones · ${dec(f.properties.ha)} ha`, v: f.properties.construcciones, pol: r } : null; }).filter(Boolean).sort((a, b) => b.v - a.v).slice(0, 8);
  }
  if (S.cats.includes('campo')) {
    const W = DAT.D.w, L = [], zonas = DAT.apoyo.zonas.map(z => [z[2], z[1], z[0], z[7]]);
    zonas.forEach(([lon, lat, nom, apt]) => {
      const p = [lon, lat]; if (!enAI(p)) return; const [x, y] = celda(lon, lat); if (x < 25 || y < 25 || x > W - 25 || y > DAT.D.h - 25) return;
      const pl = PEN[y * W + x]; let s = 0, n = 0; for (let dy = -22; dy <= 22; dy += 2) for (let dx = -22; dx <= 22; dx += 2) { s += PEN[(y + dy) * W + x + dx]; n++; }
      const pm = s / n, vec = zonas.filter(q => dist([q[0], q[1]], p) < 5000).length - 1;
      if (pl < 10 && pm >= 20) L.push({ p, t: nom || 'Campo', s: `Pendiente propia ${dec(pl)} % · entorno ${dec(pm)} % (1 km) · ${vec <= 0 ? 'único campo a 5 km' : vec + ' campos más a 5 km'}${apt && apt !== 'Sin dimensiones' ? ' · ' + esc(apt) : ''}`, v: pm - vec * 5 });
    });
    res.campo = L.sort((a, b) => b.v - a.v).slice(0, 10);
  }
  CAND = res;
  return cruces().then(() => { mostrarCand(); $('tc-am').textContent = `Listo (${dec((performance.now() - t0) / 1000, 1)} s).`; });
}
function restrictivos(dirs) {   // ancho transitable perpendicular a la dirección (pendiente < umbral severo del COC y sin agua)
  const coc = window.EMTE_COC && window.EMTE_COC.estado(), ps = coc && coc.ef && coc.ef.mec && coc.ef.mec.ps !== '' ? +coc.ef.mec.ps : 60, D = DAT.D, W = D.w, out = [];
  const libre = p => { const [x, y] = celda(p[0], p[1]); if (x < 1 || y < 1 || x >= W - 1 || y >= D.h - 1) return false; const k = y * W + x; return D.z[k] > LAGO + .5 && PEN[k] < ps; };
  dirs.forEach(l => {
    const m = muestrear(l, 150), anchos = m.map((p, i) => {
      const a = m[Math.max(0, i - 1)], b = m[Math.min(m.length - 1, i + 1)], ux = (b[0] - a[0]) * MX, uy = (b[1] - a[1]) * MY, n = Math.hypot(ux, uy) || 1, px = -uy / n, py = ux / n;
      let w = 0; for (const sg of [1, -1]) for (let d = 45; d <= 3000; d += 45) { if (!libre([p[0] + sg * px * d / MX, p[1] + sg * py * d / MY])) break; w += 45; }
      return libre(p) ? w : 0;
    });
    anchos.forEach((w, i) => { if (w > 0 && w < S.ancho && (i === 0 || w <= anchos[i - 1]) && (i === anchos.length - 1 || w <= anchos[i + 1])) out.push({ p: m[i], z: zEn(m[i][0], m[i][1]), t: `Paso de ~${miles(w)} m de ancho`, s: 'Punto restrictivo sobre la dirección de aproximación', v: -w }); });
  });
  return out.sort((a, b) => b.v - a.v).filter((o, i, a) => a.findIndex(q => dist(q.p, o.p) < 600) === i).slice(0, 12);
}
function cruces() {
  if (!S.cats.includes('cruce')) return Promise.resolve();
  return (VIAS ? Promise.resolve(VIAS) : j('data/vias_omasuyos.geojson').then(v => (VIAS = v))).then(v => {
    const PR = { 'Carretera RVF': 4, 'Carretera principal (no RVF)': 3, 'Camino secundario': 2, 'Camino terciario': 1 }, nodos = new Map();
    v.features.forEach((f, i) => { const w = PR[f.properties.tipo_via]; if (!w) return; lineas(f.geometry).forEach(l => l.forEach(q => { const k = q[0].toFixed(4) + ',' + q[1].toFixed(4); let n = nodos.get(k); if (!n) nodos.set(k, n = { p: q, f: new Set(), w: 0, nom: new Set() }); if (!n.f.has(i)) { n.f.add(i); n.w += w; if (f.properties.nombre) n.nom.add(f.properties.nombre); } })); });
    const L = [...nodos.values()].filter(n => n.f.size >= 3 && enAI(n.p)).map(n => ({ p: n.p, t: [...n.nom].slice(0, 2).join(' / ') || 'Cruce de caminos', s: `${n.f.size} tramos de la red principal se unen`, v: n.w }));
    L.sort((a, b) => b.v - a.v);
    CAND.cruce = L.filter((o, i, a) => a.findIndex(q => dist(q.p, o.p) < 500) === i).slice(0, 15);
  });
}

/* ---------------- presentación ---------------- */
let nCand = 0;
function mostrarCand() {
  const box = $('tc-res'); box.replaceChildren(); gC.replaceChildren(); nCand = 0;
  Object.keys(CAT).forEach(k => {
    if (!S.cats.includes(k)) return; const L = CAND[k];
    const ca = h('div', 'ca'); ca.append(h('b', null, CAT[k].n));
    if ((k === 'ejeobs' || k === 'restr') && !direcciones().length) { ca.append(h('div', 'it', 'Dibuje primero una dirección de aproximación (paso 2) o un eje en el COC.')); box.append(ca); return; }
    if (!L || !L.length) { ca.append(h('div', 'it', 'Sin resultados en el AI con estos valores.')); box.append(ca); return; }
    L.forEach(o => {
      const n = ++nCand, it = h('div', 'it'); o.n = n; o.cat = k;
      it.innerHTML = `<span class="n">${n}</span><span class="t">${esc(o.t)}<small>${o.s}</small></span><button type="button" class="kb" title="Designar como terreno clave">K</button>`;
      it.querySelector('.t').onclick = () => ir(o.p);
      it.querySelector('.kb').onclick = () => designar(o);
      ca.append(it);
      gC.append(marca(o.p[0], o.p[1], `<circle r="9" fill="#fff" fill-opacity=".85" stroke="${MOR}" stroke-width="1.6" stroke-dasharray="3 2"/><text y="3.4" text-anchor="middle" font-size="9" font-weight="700" font-family="system-ui" fill="${MOR}">${n}</text>`));
    });
    box.append(ca);
  });
  poner();
}
function ir(p) { if (typeof zoom !== 'function') return; const [x, y] = aEscena(p[0], p[1]); scale = Math.max(scale, 60); panX = (500 - x) * scale; panY = (380 - y) * scale; zoom(1); }
function curvaAltura(o) {   // curva que encierra y sigue los contornos: terreno a menos de Δ m bajo la cima, conectado a ella
  const D = DAT.D, W = D.w, H = D.h, Z = D.z, d = Math.max(20, Math.min(80, (o.dom || 60) * .5)), lim = o.z - d, R = Math.round(2500 / (D.dx * MX));
  const vis = new Set([o.y * W + o.x]), cola = [[o.x, o.y]];
  while (cola.length) { const [x, y] = cola.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H || Math.abs(X - o.x) > R || Math.abs(Y - o.y) > R) continue; const k = Y * W + X; if (vis.has(k) || Z[k] < lim) continue; vis.add(k); cola.push([X, Y]); } }
  const rad = []; for (let a = 0; a < 72; a++) { const t = a / 72 * 2 * Math.PI, sx = Math.cos(t), sy = Math.sin(t); let r = 0; for (let s = .5; s <= R; s += .5) { const X = Math.round(o.x + sx * s), Y = Math.round(o.y - sy * s); if (!vis.has(Y * W + X)) break; r = s; } rad.push(Math.max(r + .8, 3)); }
  const sm = rad.map((r, i) => (rad[(i + 71) % 72] + 2 * r + rad[(i + 1) % 72]) / 4);
  return sm.map((r, i) => { const t = i / 72 * 2 * Math.PI; return [o.p[0] + Math.cos(t) * r * D.dx, o.p[1] + Math.sin(t) * r * D.dy]; });
}
function circulo(p, m) { const out = []; for (let a = 0; a < 48; a++) { const t = a / 48 * 2 * Math.PI; out.push([p[0] + Math.cos(t) * m / MX, p[1] + Math.sin(t) * m / MY]); } return out; }
function designar(o) {
  const id = (S.tc.reduce((a, t) => Math.max(a, t.id), 0) || 0) + 1;
  const pts = o.alt ? curvaAltura(o.alt) : o.pol ? o.pol.map(q => q.slice(0, 2)) : circulo(o.p, 350);
  S.tc.push({ id, nom: o.t, mot: MOTIVOS[MOT_CAT[o.cat]] || 'Otro', p: o.p, z: o.z || zEn(o.p[0], o.p[1]), pts, dec: false, obs: '' });
  S.ver = true; guardar(); dibujarTC(); tabla();
}
function dibujarTC() {
  gT.replaceChildren(); if (!S.ver) return; poner();
  S.tc.forEach(t => {
    gT.append(sel('path', { d: path(t.pts) + 'Z', fill: MOR, 'fill-opacity': .08, stroke: MOR, 'stroke-width': t.dec ? 4 : 2.5, 'vector-effect': 'non-scaling-stroke' }));
    gT.append(marca(t.p[0], t.p[1], `<circle r="24" fill="#fff" fill-opacity=".9" stroke="${MOR}" stroke-width="3"/>${t.dec ? `<circle r="29" fill="none" stroke="${MOR}" stroke-width="2.5"/>` : ''}<text y="11" text-anchor="middle" font-size="32" font-weight="900" font-family="Arial,system-ui" fill="${MOR}">K</text>` +
      `<text y="${t.dec ? 45 : 39}" text-anchor="middle" font-size="11" font-weight="800" font-family="system-ui" fill="${MOR}" stroke="#fff" stroke-width="3" paint-order="stroke">K${t.id}${t.dec ? ' · TERRENO DECISIVO' : ''}</text>`));
  });
}
function dibujarDirs() {
  gD.replaceChildren(); poner();
  S.dirs.forEach(l => gD.append(sel('path', { d: path(l), fill: 'none', stroke: '#B03A2E', 'stroke-width': 4, 'stroke-opacity': .85, 'vector-effect': 'non-scaling-stroke', 'marker-end': 'url(#tc-flecha)' })));
}
function tabla() {
  $('tc-sit').value = S.sit; $('tc-niv').value = S.nivel; $('tc-eje').checked = S.usarEje; $('tc-dom').value = S.domMin; $('tc-anc').value = S.ancho; $('tc-ver').checked = S.ver;
  $('tc-dm').textContent = `${S.dirs.length} dirección(es) dibujada(s)` + ((window.EMTE_COC && window.EMTE_COC.estado().eje) ? ' · hay eje en el COC' : '');
  const cats = $('tc-cats'); cats.replaceChildren();
  Object.entries(CAT).forEach(([k, c]) => { const l = h('label', 'k'), cb = h('input'); cb.type = 'checkbox'; cb.checked = S.cats.includes(k); cb.onchange = () => { S.cats = Object.keys(CAT).filter(x => x === k ? cb.checked : S.cats.includes(x)); guardar(); }; const t = h('span'); t.append(document.createTextNode(c.n), h('small', null, c.d)); l.append(cb, t); cats.append(l); });
  const tb = $('tc-tab'); tb.replaceChildren();
  if (!S.tc.length) { const r = h('tr'); r.innerHTML = '<td style="color:#5A6B80">Designe candidatos con el botón «K» o dibuje el terreno clave.</td>'; tb.append(r); return; }
  S.tc.forEach(t => {
    const r = h('tr'), T = window.EMTE_TOPO, u = T ? T.textos(t.p[1], t.p[0]) : null;
    r.innerHTML = `<td style="width:26px"><b style="color:${MOR};font-size:13px">K${t.id}</b></td><td><input type="text" value="${esc(t.nom)}" data-k="nom"><select data-k="mot">${MOTIVOS.map(m => `<option${m === t.mot ? ' selected' : ''}>${m}</option>`).join('')}</select><small style="color:#5A6B80;display:block">${u ? u.utm : t.p[1].toFixed(5) + ', ' + t.p[0].toFixed(5)}${t.z ? ' · ' + miles(t.z) + ' m' : ''}</small><label class="k" style="margin:2px 0 0"><input type="checkbox" data-k="dec"${t.dec ? ' checked' : ''}> <span>Terreno decisivo</span></label></td><td style="width:20px"><button type="button" class="x" title="Quitar">×</button></td>`;
    r.querySelectorAll('[data-k]').forEach(i => i.onchange = () => { t[i.dataset.k] = i.type === 'checkbox' ? i.checked : i.value; guardar(); dibujarTC(); });
    r.querySelector('td b').style.cursor = 'pointer'; r.querySelector('td b').onclick = () => ir(t.p);
    r.querySelector('.x').onclick = () => { S.tc.splice(S.tc.indexOf(t), 1); guardar(); dibujarTC(); tabla(); };
    tb.append(r);
  });
}

/* ---------------- dibujo: direcciones y terreno clave a mano ---------------- */
let modo = null, pts = [];
function iniciar(m) { modo = m; pts = []; gTmp.replaceChildren(); mapa.classList.add('tc-dib'); poner(); $('tc-fin').hidden = false; $(m === 'dir' ? 'tc-dir' : 'tc-man').classList.add('on'); $('tc-dm').textContent = 'Clic en el mapa para marcar los puntos; «Terminar» o doble clic. Esc cancela.'; }
function terminar(cancelar) {
  const m = modo; modo = null; mapa.classList.remove('tc-dib'); gTmp.replaceChildren(); $('tc-fin').hidden = true; ['tc-dir', 'tc-man'].forEach(i => $(i).classList.remove('on'));
  if (!cancelar && m === 'dir' && pts.length >= 2) S.dirs.push(pts.slice());
  if (!cancelar && m === 'man' && pts.length >= 3) { const c = pts.reduce((a, q) => [a[0] + q[0] / pts.length, a[1] + q[1] / pts.length], [0, 0]); const id = (S.tc.reduce((a, t) => Math.max(a, t.id), 0) || 0) + 1; S.tc.push({ id, nom: 'Terreno clave ' + id, mot: 'Otro', p: c, z: DAT ? zEn(c[0], c[1]) : null, pts: pts.slice(), dec: false }); S.ver = true; }
  guardar(); dibujarDirs(); dibujarTC(); tabla();
}
function previa() { gTmp.replaceChildren(); if (pts.length) gTmp.append(sel('path', { d: path(pts) + (modo === 'man' && pts.length > 2 ? 'Z' : ''), fill: modo === 'man' ? MOR : 'none', 'fill-opacity': .1, stroke: modo === 'man' ? MOR : '#B03A2E', 'stroke-width': 3, 'stroke-dasharray': '6 3', 'vector-effect': 'non-scaling-stroke' })); }
let abajo = null;
svgR.addEventListener('pointerdown', e => { if (modo) abajo = [e.clientX, e.clientY]; }, true);
svgR.addEventListener('click', e => { if (!modo) return; e.stopPropagation(); e.preventDefault(); if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 5) return; const m = scene.getScreenCTM(); if (!m) return; const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); pts.push(deEscena(q.x, q.y)); previa(); }, true);
svgR.addEventListener('dblclick', e => { if (modo) { e.stopPropagation(); e.preventDefault(); pts.pop(); terminar(); } }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modo) terminar(true); });

/* ---------------- controles ---------------- */
$('tc-sit').onchange = e => { S.sit = e.target.value; S.cats = PRESET[S.sit].slice(); if (S.nivel === 'teatro') S.cats.push('ciudad'); if (S.nivel === 'division') S.cats.push('pueblo'); guardar(); tabla(); };
$('tc-niv').onchange = e => { S.nivel = e.target.value; S.cats = S.cats.filter(c => c !== 'ciudad' && c !== 'pueblo'); if (S.nivel === 'teatro') S.cats.push('ciudad'); if (S.nivel === 'division') S.cats.push('pueblo'); guardar(); tabla(); };
$('tc-eje').onchange = e => { S.usarEje = e.target.checked; guardar(); tabla(); };
$('tc-dom').onchange = e => { S.domMin = Math.max(10, +e.target.value || 60); guardar(); };
$('tc-anc').onchange = e => { S.ancho = Math.max(100, +e.target.value || 800); guardar(); };
$('tc-dir').onclick = () => modo ? terminar() : iniciar('dir');
$('tc-man').onclick = () => modo ? terminar() : iniciar('man');
$('tc-fin').onclick = () => terminar();
$('tc-dirx').onclick = () => { S.dirs = []; guardar(); dibujarDirs(); tabla(); };
$('tc-ver').onchange = e => { S.ver = e.target.checked; guardar(); dibujarTC(); if (S.ver) dibujarDirs(); else gD.replaceChildren(); };
$('tc-an').onclick = () => { $('tc-am').textContent = DAT ? 'Analizando…' : 'Cargando datos y analizando (la primera vez tarda unos segundos)…'; cargar().then(() => setTimeout(() => analizar().catch(err => { $('tc-am').textContent = 'Error en el análisis.'; console.error(err); }), 20)).catch(() => { $('tc-am').textContent = 'No se pudieron cargar los datos.'; }); };
tabla();
window.EMTE_TC = { estado: () => S, candidatos: () => CAND, analizar: () => cargar().then(analizar) };
});
