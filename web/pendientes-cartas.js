/* Pendientes de transitabilidad a partir de las CURVAS DE NIVEL de las cartas IGM 1:50.000 (agregado por BYNS7).
   Sección dentro de la pestaña PLANEAMIENTO. El modelo (TIN de 25 m) y la pendiente se calcularon fuera de línea
   (04_CARTAS_IGM_50000/11_RELIEVE/curvas_cartas): data/pendientes_cartas.png guarda la pendiente en % (0–250; 255 = sin dato)
   en Web Mercator y data/pendientes_cartas.json su extensión. La clasificación se enmarca en el Reglamento del
   Proceso de Conducción de Tropas (análisis de la misión · 3. Terreno: obstáculos y avenidas de aproximación);
   las clases van en PORCENTAJE (0–30 % sin restricción, 30–60 % restringido, más de 60 % severamente restringido) y los
   umbrales se pueden ajustar. La mancha urbana (data/mancha_urbana_omasuyos.geojson) se dibuja rayada como
   terreno severamente restringido. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main>aside'), mapa = document.querySelector('.map'), scene = document.getElementById('scene');
if (!aside || !mapa || !scene) return;
const NS = 'http://www.w3.org/2000/svg', D2R = Math.PI / 180;
const K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702;
const aEscena = (lon, lat) => [500 + (lon * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) + OY) * K];
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const dec = (n, d = 1) => n.toFixed(d).replace('.', ',');

/* Clases (umbral superior en % de pendiente), pensadas para el movimiento de vehículos. Texto según los aspectos militares del terreno del reglamento PCT. */
const BASE = [
  { max: 30, color: '#2E8B47', nombre: 'Sin restricción', ap: 'Avenida de aproximación', uso: 'Vehículos de rueda y oruga y tropa a pie se mueven sin limitación por la pendiente.' },
  { max: 60, color: '#E6C434', nombre: 'Restringido', ap: 'Retarda y canaliza el movimiento', uso: 'Vehículos de rueda con dificultad o canalizados; oruga y tropa a pie avanzan más lento.' },
  { max: Infinity, color: '#C0302A', nombre: 'Severamente restringido', ap: 'Obstáculo: detiene el movimiento', uso: 'Obstáculo para vehículos: sólo tropa a pie, con dificultad.' }
];
const ROJO = '#C0302A';
const RAYADO = `repeating-linear-gradient(135deg,${ROJO} 0 2px,#fff 2px 6px)`;
let CL = BASE.map(c => ({ ...c }));
try { const g = JSON.parse(localStorage.getItem('emte-pend-pct') || 'null'); if (Array.isArray(g) && g.length === 2) g.forEach((v, i) => { if (v > 0 && v < 250) CL[i].max = v; }); } catch (e) {}
// la imagen guarda la pendiente en % (0–250); su equivalente en grados sólo se muestra como referencia:
const GRADOS = new Float32Array(256); for (let v = 0; v < 256; v++) GRADOS[v] = Math.atan(v / 100) / D2R;

const css = h('style');
css.textContent = `
.pc-menu .pc-cuerpo,.pc-menu .pc-cuerpo *,.pc-ley,.pc-ley *{text-transform:none!important}
.pc-menu .pc-cuerpo{padding:8px 10px 12px;font:12px var(--tipo-texto,system-ui);color:#14233A}
.pc-menu .pc-fila{display:flex;align-items:center;gap:8px;margin:6px 0}
.pc-menu .pc-fila label{display:flex;align-items:center;gap:6px;cursor:pointer;font-weight:600}
.pc-menu input[type=range]{flex:1;accent-color:#12294A}
.pc-menu .pc-reg{margin:8px 0;padding:7px 9px;border-left:3px solid #B79A5B;background:#f6f3ea;border-radius:0 6px 6px 0;font-size:11px;line-height:1.35;color:#3a4658}
.pc-menu .pc-reg b{color:#0B1D33}
.pc-menu table{width:100%;border-collapse:collapse;margin-top:6px;font-size:11.5px}
.pc-menu td{padding:5px 3px;border-bottom:1px solid #e3e8f0;vertical-align:top}
.pc-menu td.c i{display:block;width:16px;height:16px;border-radius:3px;border:1px solid #0003;margin-top:1px}
.pc-menu td.n b{display:block;font-size:11.5px}.pc-menu td.n small{display:block;color:#5A6B80;font-size:10.5px;line-height:1.25}
.pc-menu td.n em{font-style:normal;font-weight:700;color:#7a5c12;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
.pc-menu .rg{margin-top:3px;color:#12294A;font-weight:600;font-size:11px}
.pc-menu .rg input{width:46px;padding:2px 4px;border:1px solid #cfd6e6;border-radius:4px;font:600 11px system-ui;text-align:right}
.pc-menu td.p{text-align:right;color:#5A6B80;white-space:nowrap;font-size:10.5px}
.pc-menu .pc-bot{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
.pc-menu .pc-bot button{padding:5px 10px;border:1px solid #cfd6e6;border-radius:6px;background:#fff;color:#12294A;font:600 11px system-ui;cursor:pointer}
.pc-menu .pc-bot button:hover{background:#eef2f8}
.pc-menu .pc-fuente{margin-top:8px;font-size:10.5px;color:#5A6B80;line-height:1.35}
.pc-menu .pc-est{font-size:11px;color:#5A6B80}
.pc-ley{position:absolute;left:16px;bottom:196px;z-index:8;background:#fff;border:1px solid #D7DEE8;border-radius:8px;box-shadow:0 8px 22px rgba(11,29,51,.18);font:11.5px var(--tipo-texto,system-ui);color:#14233A;min-width:240px;max-width:300px}
.pc-ley[hidden]{display:none}
.pc-ley b.t{text-transform:uppercase!important;display:block;padding:6px 10px;background:#0B1D33;color:#fff;font:600 11px var(--tipo-titulo,system-ui);letter-spacing:.08em;border-radius:7px 7px 0 0;border-bottom:2px solid #B79A5B}
.pc-ley div{display:flex;align-items:center;gap:8px;padding:3px 10px}
.pc-ley i{width:22px;height:12px;border-radius:2px;flex:none;border:1px solid #0002}
.pc-ley .cur{display:block;padding:5px 10px 7px;border-top:1px solid #e3e8f0;font-weight:600;color:#12294A;min-height:16px}
.pc-ley .cur small{display:block;font-weight:400;color:#5A6B80;font-size:10.5px}
@media(max-width:750px){.pc-ley{bottom:210px;left:8px;min-width:200px;font-size:10.5px}}`;
document.head.append(css);

/* ---------- sección en la pestaña Planeamiento ---------- */
const sec = h('details', 'layer-menu pc-menu');
sec.innerHTML = `<summary>Pendientes de transitabilidad · MDT Omasuyos</summary><div class="pc-cuerpo">
<div class="pc-fila"><label><input type="checkbox" id="pc-ver"> Mostrar en el mapa</label></div>
<div class="pc-fila"><label><input type="checkbox" id="pc-mu" checked> Mancha urbana de Omasuyos (rayado)</label></div>
<div class="pc-fila"><span>Opacidad</span><input type="range" id="pc-op" min="10" max="100" value="60" aria-label="Opacidad"><span id="pc-opv">60 %</span></div>
<div class="pc-reg"><b>Reglamento PCT · Análisis de la misión · 3. Terreno.</b> La pendiente decide qué terreno sirve de
<b>avenida de aproximación</b> (5) y qué terreno es un <b>obstáculo</b> natural (3): «cualquier característica natural o artificial
que detiene, retarda o canaliza el movimiento de una fuerza».</div>
<table id="pc-tab" aria-label="Clases de pendiente"></table>
<div class="pc-bot"><button type="button" id="pc-ir">Ir a la zona</button><button type="button" id="pc-def">Umbrales por defecto</button></div>
<div class="pc-est" id="pc-est"></div>
<div class="pc-fuente" id="pc-fuente" hidden></div>
</div>`;
aside.append(sec);
const $ = id => document.getElementById(id);

const ley = h('section', 'pc-ley'); ley.hidden = true; ley.setAttribute('aria-label', 'Leyenda de pendientes');
mapa.append(ley);
for (const t of ['pointerdown', 'click', 'wheel']) ley.addEventListener(t, e => e.stopPropagation());

const FUENTE = 'pendientes_cartas';
let META = null, VAL = null, W = 0, H = 0, img = null, url = null, on = false, cuenta = null, cargando = null;
let MU = null, gMU = null, muOn = true, cargandoMU = null;
const desde = i => i ? CL[i - 1].max : 0;
const rango = i => i === CL.length - 1 ? `más de ${desde(i)} %` : `${desde(i)} a ${CL[i].max} %`;
const claseDe = v => { for (let i = 0; i < CL.length; i++) if (v < CL[i].max) return i; return CL.length - 1; };

function tabla() {
  const t = $('pc-tab'); t.replaceChildren();
  CL.forEach((c, i) => {
    const tr = h('tr');
    const tc = h('td', 'c'); const sw = h('i'); sw.style.background = c.color; tc.append(sw);
    const tn = h('td', 'n'); tn.append(h('b', null, c.nombre), h('em', null, c.ap), h('small', null, c.uso));
    const rg = h('div', 'rg');
    if (i < CL.length - 1) {
      rg.append(document.createTextNode(`De ${desde(i)} a `));
      const inp = h('input'); inp.type = 'number'; inp.min = 1; inp.max = 249; inp.step = 1; inp.value = c.max; inp.setAttribute('aria-label', 'Límite superior de ' + c.nombre + ' en grados');
      inp.onchange = () => { let v = Math.round(+inp.value); const lo = desde(i) + 1, hi = i < CL.length - 2 ? CL[i + 1].max - 1 : 249; v = Math.min(hi, Math.max(lo, v || c.max)); c.max = v; guardar(); tabla(); pintar(); };
      rg.append(inp, document.createTextNode(' %'));
    } else rg.textContent = `Más de ${desde(i)} %`;
    tn.append(rg);
    const tp = h('td', 'p', cuenta ? dec(cuenta[i]) + ' %' : '');
    tp.title = 'Porcentaje del área analizada';
    tr.append(tc, tn, tp); t.append(tr);
  });
  // mancha urbana: severamente restringido, rayado
  const tr = h('tr'), tc = h('td', 'c'), sw = h('i'); sw.style.background = RAYADO; sw.style.borderColor = ROJO; tc.append(sw);
  const tn = h('td', 'n'); tn.append(h('b', null, 'Mancha urbana'), h('em', null, 'Severamente restringido'),
    h('small', null, 'Zona poblada de Omasuyos: edificaciones y muros canalizan el movimiento a las calles y vías; combate en localidades.'));
  if (MU) tn.append(h('div', 'rg', `${MU.features.length} manchas · ${Math.round(MU.features.reduce((a, f) => a + f.properties.ha, 0)).toLocaleString('es-BO')} ha`));
  tr.append(tc, tn, h('td', 'p')); t.append(tr);
  ley.innerHTML = `<b class="t">PENDIENTES · MDT OMASUYOS (%)</b>` + CL.map((c, i) => `<div><i style="background:${c.color}"></i><span><b>${c.nombre}</b> · ${rango(i)}</span></div>`).join('')
    + (muOn ? `<div><i style="background:${RAYADO};border-color:${ROJO}"></i><span><b>Mancha urbana</b> · severamente restringido</span></div>` : '')
    + '<div class="cur" id="pc-cur">Pasa el cursor o toca el mapa</div>';
}
function guardar() { try { localStorage.setItem('emte-pend-pct', JSON.stringify(CL.slice(0, 2).map(c => c.max))); } catch (e) {} }

/* ---------- mancha urbana (rayado rojo) ---------- */
const svgR = scene.ownerSVGElement;
let defs = svgR.querySelector('defs'); if (!defs) { defs = document.createElementNS(NS, 'defs'); svgR.prepend(defs); }
const pat = document.createElementNS(NS, 'pattern'); pat.id = 'pc-rayado'; pat.setAttribute('patternUnits', 'userSpaceOnUse');
pat.setAttribute('width', 8); pat.setAttribute('height', 8);
pat.innerHTML = `<rect width="8" height="8" fill="${ROJO}" fill-opacity=".18"/><line x1="1.5" y1="0" x2="1.5" y2="8" stroke="${ROJO}" stroke-width="3"/>`;
defs.append(pat);
const escalaMapa = () => (typeof scale === 'number' && scale > 0 ? scale : 1);
const ajustarRayado = () => pat.setAttribute('patternTransform', `scale(${1 / escalaMapa()}) rotate(45)`);
ajustarRayado();
if (typeof zoom === 'function') { const zPrev = zoom; zoom = function (...a) { const r = zPrev.apply(this, a); ajustarRayado(); return r; }; }
function cargarMU() {
  if (cargandoMU) return cargandoMU;
  cargandoMU = fetch('data/mancha_urbana_omasuyos.geojson').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => {
    MU = d; gMU = document.createElementNS(NS, 'g'); gMU.id = 'mancha-urbana'; gMU.setAttribute('pointer-events', 'none');
    for (const f of d.features) {
      const g = f.geometry, polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates]; let s = '';
      for (const pol of polys) for (const ring of pol) ring.forEach((c, i) => { const [x, y] = aEscena(c[0], c[1]); s += (i ? 'L' : 'M') + x.toFixed(3) + ' ' + y.toFixed(3); }), s += 'Z';
      const p = document.createElementNS(NS, 'path'); p.setAttribute('d', s); p.setAttribute('fill', 'url(#pc-rayado)'); p.setAttribute('fill-rule', 'evenodd');
      p.setAttribute('stroke', ROJO); p.setAttribute('stroke-width', '2'); p.setAttribute('vector-effect', 'non-scaling-stroke');
      p.dataset.info = `${f.properties.municipio} · ${f.properties.construcciones.toLocaleString('es-BO')} construcciones · ${f.properties.ha} ha`;
      gMU.append(p);
    }
    tabla();
  }).catch(e => { cargandoMU = null; throw e; });
  return cargandoMU;
}
function ponerMU() {
  if (!(on && muOn)) { gMU && gMU.remove(); return; }
  cargarMU().then(() => {
    if (!(on && muOn) || gMU.isConnected) return;
    img && img.isConnected ? img.after(gMU) : scene.append(gMU);
  }).catch(() => { $('pc-est').textContent = 'No se pudo cargar la mancha urbana.'; });
}

function cargar() {
  if (cargando) return cargando;
  $('pc-est').textContent = 'Cargando el modelo de pendientes…';
  cargando = fetch(`data/${FUENTE}.json`).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(m => {
    META = m;
    return new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = mal; im.src = `data/${FUENTE}.png`; });
  }).then(im => {
    W = im.naturalWidth; H = im.naturalHeight;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(im, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data; VAL = new Uint8Array(W * H);
    for (let k = 0, o = 0; k < VAL.length; k++, o += 4) VAL[k] = d[o + 3] < 128 ? 255 : d[o];
    $('pc-est').textContent = '';
    const v = META.validacion && META.validacion[META.clave_validacion || 'topo_validacion'], vc = v && v.curvas_reservadas, vk = v && v.cotas;
    const ex = vc ? ` Precisión comprobada con datos que no entraron al modelo: error medio ${dec(vc.ema_m)} m (90 % de los puntos con error menor a ${dec(vc.le90_m)} m) en ${vc.n.toLocaleString('es-BO')} puntos de curvas reservadas` + (vk ? ` y ${dec(vk.ema_m)} m en ${vk.n} cotas impresas.` : '.') : '';
    $('pc-fuente').textContent = (META.fuente || 'Curvas de nivel de las cartas IGM 1:50.000.') + ` Hojas ${META.hojas.join(', ')}.` + ex + ' No considera suelo, vegetación, humedad ni obstáculos artificiales; confirmar con reconocimiento.';
  }).catch(e => { cargando = null; $('pc-est').textContent = 'No se pudo cargar el modelo de pendientes.'; throw e; });
  return cargando;
}

function pintar() {
  if (!VAL || !on) return;
  const cols = CL.map(c => [1, 3, 5].map(i => parseInt(c.color.slice(i, i + 2), 16)));
  const lut = new Uint8Array(256 * 4), n = new Array(CL.length).fill(0);
  for (let v = 0; v < 255; v++) { const c = cols[claseDe(v)]; lut[v * 4] = c[0]; lut[v * 4 + 1] = c[1]; lut[v * 4 + 2] = c[2]; lut[v * 4 + 3] = 255; }
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d'), im = ctx.createImageData(W, H), d = im.data;
  const hist = new Uint32Array(256);
  for (let k = 0, o = 0; k < VAL.length; k++, o += 4) { const v = VAL[k]; hist[v]++; if (v === 255) continue; const q = v * 4; d[o] = lut[q]; d[o + 1] = lut[q + 1]; d[o + 2] = lut[q + 2]; d[o + 3] = 255; }
  for (let v = 0; v < 255; v++) n[claseDe(v)] += hist[v];
  const tot = n.reduce((a, b) => a + b, 0) || 1; cuenta = n.map(x => x / tot * 100);
  ctx.putImageData(im, 0, 0);
  cv.toBlob(b => {
    if (!b) return;
    const nuevo = URL.createObjectURL(b);
    if (!img) {
      img = document.createElementNS(NS, 'image'); img.id = 'pendientes-cartas';
      img.setAttribute('preserveAspectRatio', 'none'); img.setAttribute('pointer-events', 'none');
      const [ax, ay] = aEscena(META.nw[0], META.nw[1]), [bx, by] = aEscena(META.se[0], META.se[1]);
      img.setAttribute('x', ax); img.setAttribute('y', ay); img.setAttribute('width', bx - ax); img.setAttribute('height', by - ay);
    }
    img.setAttribute('opacity', $('pc-op').value / 100);
    img.setAttribute('href', nuevo); if (url) URL.revokeObjectURL(url); url = nuevo;
    if (on && !img.isConnected) {
      const ref = document.getElementById('topo-pendientes') || document.getElementById('topo-municipios') || document.getElementById('water') || document.getElementById('rivers');
      ref && ref.parentNode === scene ? ref.after(img) : scene.prepend(img);
      if (gMU && gMU.isConnected) img.after(gMU);
    }
    tabla();
  }, 'image/png');
}

function poner(v) {
  on = v; $('pc-ver').checked = v; ley.hidden = !v;
  if (!v) { img && img.remove(); ponerMU(); return; }
  cargar().then(pintar).then(ponerMU).catch(() => { on = false; $('pc-ver').checked = false; ley.hidden = true; });
}
$('pc-ver').onchange = e => poner(e.target.checked);

$('pc-mu').onchange = e => { muOn = e.target.checked; tabla(); ponerMU(); };
$('pc-op').oninput = e => { $('pc-opv').textContent = e.target.value + ' %'; img && img.setAttribute('opacity', e.target.value / 100); };
$('pc-def').onclick = () => { CL = BASE.map(c => ({ ...c })); guardar(); tabla(); pintar(); };
$('pc-ir').onclick = () => {
  const ir = () => {   // mismo vuelo que la consulta de cartas
    if (!META || typeof zoom !== 'function' || typeof scale !== 'number') return;
    const [ax, ay] = aEscena(META.nw[0], META.nw[1]), [bx, by] = aEscena(META.se[0], META.se[1]), cx = (ax + bx) / 2, cy = (ay + by) / 2;
    const s1 = Math.max(.008, Math.min(480, Math.min(1000 / (bx - ax), 760 / (by - ay)) * .9));
    const s0 = scale, c0 = [500 - panX / s0, 380 - panY / s0], t0 = performance.now();
    const paso = t => {
      const k = Math.min(1, (t - t0) / 700), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      const s = Math.exp(Math.log(s0) + (Math.log(s1) - Math.log(s0)) * e), x = c0[0] + (cx - c0[0]) * e, y = c0[1] + (cy - c0[1]) * e;
      scale = s; panX = (500 - x) * s; panY = (380 - y) * s; zoom(1);
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  };
  if (!on) poner(true);
  cargar().then(ir).catch(() => {});
};

/* lectura bajo el cursor */
let raf = 0;
// 11-11-2026: en tablet y celular no hay cursor: al TOCAR el mapa también se lee la pendiente de ese punto
scene.ownerSVGElement.addEventListener('click', e => leerPendiente(e), true);
scene.ownerSVGElement.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') leerPendiente(e); });
function leerPendiente(e) {
  if (!on || !VAL || !img) return;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    const m = scene.getScreenCTM(); const cur = $('pc-cur'); if (!m || !cur) return;
    const p = scene.ownerSVGElement.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(m.inverse());
    const x = +img.getAttribute('x'), y = +img.getAttribute('y'), w = +img.getAttribute('width'), hh = +img.getAttribute('height');
    if (gMU && gMU.isConnected) {
      const pt = svgR.createSVGPoint(); pt.x = q.x; pt.y = q.y;
      const pm = [...gMU.children].find(p => p.isPointInFill(pt));
      if (pm) { cur.replaceChildren(); cur.append(document.createTextNode('Mancha urbana → ')); const b = h('span', null, 'Severamente restringido'); b.style.color = ROJO; cur.append(b, h('small', null, pm.dataset.info)); return; }
    }
    const i = Math.floor((q.x - x) / w * W), j = Math.floor((q.y - y) / hh * H);
    if (i < 0 || j < 0 || i >= W || j >= H || VAL[j * W + i] === 255) { cur.textContent = 'Fuera de las cartas analizadas'; return; }
    const v = VAL[j * W + i], c = CL[claseDe(v)], g = GRADOS[v];
    cur.replaceChildren(); cur.append(document.createTextNode(`Pendiente ${v >= 250 ? 'más de 250' : v} % (${v >= 250 ? '>68' : dec(g, 0)}°) → `)); const b = h('span', null, c.nombre); b.style.color = c.color === '#E6C434' ? '#8a6d00' : c.color; cur.append(b);
  });
}

tabla();
/* Lectura de la pendiente MDT y de la mancha urbana en un punto (la usa el perfil topográfico de relieve.js) */
function enMancha(lon, lat) {
  if (!MU) return null;
  for (const f of MU.features) {
    const g = f.geometry, polys = g.type === 'MultiPolygon' ? g.coordinates : [g.coordinates];
    for (const pol of polys) {
      let dentro = false;
      pol.forEach((ring, k) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) c = !c; } if (c) dentro = k === 0 ? true : false; });
      if (dentro) return f;
    }
  }
  return null;
}
window.EMTE_PENDIENTES_MDT = {
  cargar: () => cargar().then(() => cargarMU().catch(() => null)),
  listo: () => !!VAL,
  datos: () => VAL ? { v: VAL, w: W, h: H, meta: META, clase: claseDe, mancha: MU, umbrales: CL.map(c => c.max) } : null,
  clases: () => CL.map((c, i) => ({ nombre: c.nombre, color: c.color, rango: rango(i) })).concat([{ nombre: 'Mancha urbana', color: ROJO, rango: 'severamente restringido', rayado: true }]),
  en(lon, lat) {   // → {pct, clase} · clase = índice en clases(); null fuera de las cartas analizadas
    if (!VAL || !META) return null;
    if (MU && enMancha(lon, lat)) return { pct: null, clase: CL.length };
    const [x, y] = aEscena(lon, lat), [ax, ay] = aEscena(META.nw[0], META.nw[1]), [bx, by] = aEscena(META.se[0], META.se[1]);
    const i = Math.floor((x - ax) / (bx - ax) * W), j = Math.floor((y - ay) / (by - ay) * H);
    if (i < 0 || j < 0 || i >= W || j >= H) return null;
    const v = VAL[j * W + i]; if (v === 255) return null;
    return { pct: v, clase: claseDe(v) };
  }
};
window.EMTE_LEYENDA_PENDIENTES_CARTAS = () => on ? CL.map((c, i) => ({ nombre: 'Pendiente: ' + c.nombre.toLowerCase() + ' (' + rango(i) + ')', tipo: 'area', color: c.color }))
  .concat(muOn ? [{ nombre: 'Mancha urbana: severamente restringido', tipo: 'area', color: ROJO }] : []) : [];
});
