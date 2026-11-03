/* COC · Calco de Obstáculos Combinados (agregado por BYNS7). Pestaña PLANEAMIENTO.
   Sigue el PICB, «3) Obstáculos» (pág. 21–24):
     1. Identifique obstáculos pertinentes en el AI (área de interés).
     2. Determine los efectos de cada obstáculo sobre la movilidad de la fuerza evaluada.
     3. Combine los efectos de obstáculos individuales en un producto integrado (calco de obstáculos combinados).
   Factores (un calco por factor): vegetación, drenaje de la superficie, materiales de superficie, configuración de la
   superficie (declive), obstáculos naturales y artificiales (también para la movilidad aérea), sistemas de transporte y
   efectos del clima. Clasificación: SIN RESTRICCIÓN (sin marca), RESTRINGIDO (líneas diagonales) y SEVERAMENTE
   RESTRINGIDO (líneas diagonales sombreadas); ríos invadeables con líneas sólidas amplias; símbolos no reglamentarios
   explicados en la leyenda. Calcos separados por tipo de fuerza; vías de infiltración de infantería sobre el calco montado;
   obstáculos perpendiculares / paralelos al eje de avance (consideraciones adicionales).
   Datos: data/pendientes_cartas.png (declive del MDT), rios_omasuyos, cuerpos_agua_omasuyos, mancha_urbana_omasuyos,
   limite_omasuyos; obstáculos dibujados por el usuario (se guardan en este navegador). */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main>aside'), mapa = document.querySelector('.map'), scene = document.getElementById('scene');
if (!aside || !mapa || !scene) return;
const svgR = scene.ownerSVGElement, NS = 'http://www.w3.org/2000/svg', D2R = Math.PI / 180, RT = 6378137;
const K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702;
const aEscena = (lon, lat) => [500 + (lon * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) + OY) * K];
const deEscena = (x, y) => [((x - 500) / K - OX) / D2R, (2 * Math.atan(Math.exp((380 - y) / K - OY)) - Math.PI / 2) / D2R];
const merc = (lon, lat) => [RT * lon * D2R, RT * Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2))];
const esca = () => (typeof scale === 'number' && scale > 0 ? scale : 1);
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const dec = (n, d = 1) => n.toFixed(d).replace('.', ',');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------- definiciones (PICB) ---------------- */
const CLASE = ['Sin restricción', 'Restringido', 'Severamente restringido'];
const FUERZAS = { mec: 'Mecanizada / blindada', inf: 'Infantería (a pie)', aer: 'Helicópteros (movilidad aérea)' };
const FACTORES = [
  ['vegetacion', 'Vegetación', 'diámetro del tronco del árbol y el esparcimiento'],
  ['drenaje', 'Drenaje de la superficie', 'anchura del arroyo, profundidad, velocidad, altura y declive de la ribera'],
  ['materiales', 'Materiales de superficie', 'condiciones y tipos de suelo que afectan la movilidad'],
  ['configuracion', 'Configuración de la superficie', 'declive que afecta la movilidad'],
  ['obstaculos', 'Obstáculos naturales y artificiales', 'también los obstáculos para aviones'],
  ['transporte', 'Sistemas de transporte', 'características del camino y clasificación de puentes'],
  ['clima', 'Efectos del clima', 'precipitación fuerte o nieve']
];
// obstáculos que se dibujan (ejemplos del PICB: edificios, declives empinados, ríos, lagos, bosques, pantanos,
// ciudades, campos minados, fosos y alambradas; para la movilidad aérea: árboles altos, torres, edificios)
const TIPOS = {
  veg: { n: 'Vegetación (bosque, árboles)', g: 'pol', f: 'vegetacion', c: { mec: 1, inf: 0, aer: 0 }, col: '#2E7D32', at: ['Diámetro del tronco (cm)', 'Esparcimiento (m)'] },
  suelo: { n: 'Suelo blando / arenal', g: 'pol', f: 'materiales', c: { mec: 1, inf: 0, aer: 0 }, col: '#A1887F', at: ['Tipo de suelo'] },
  pantano: { n: 'Pantano (bofedal)', g: 'pol', f: 'materiales', c: { mec: 2, inf: 1, aer: 0 }, col: '#00897B', at: ['Observación'] },
  escabroso: { n: 'Terreno escabroso / roca', g: 'pol', f: 'configuracion', c: { mec: 2, inf: 1, aer: 0 }, col: '#795548', at: ['Observación'] },
  rio: { n: 'Río invadeable (no cartografiado)', g: 'lin', f: 'drenaje', c: { mec: 2, inf: 2, aer: 0 }, col: '#0B3D91', at: ['Anchura (m)', 'Profundidad (m)', 'Velocidad (m/s)', 'Altura de ribera (m)'] },
  minado: { n: 'Campo minado', g: 'pol', f: 'obstaculos', c: { mec: 2, inf: 2, aer: 0 }, col: '#C0392B', at: ['Observación'] },
  foso: { n: 'Foso', g: 'lin', f: 'obstaculos', c: { mec: 2, inf: 1, aer: 0 }, col: '#6D4C41', at: ['Anchura (m)', 'Profundidad (m)'] },
  alambrada: { n: 'Alambrada', g: 'lin', f: 'obstaculos', c: { mec: 1, inf: 1, aer: 0 }, col: '#333333', at: ['Observación'] },
  terraplen: { n: 'Terraplén vial o ferroviario', g: 'lin', f: 'obstaculos', c: { mec: 2, inf: 0, aer: 0 }, col: '#8D6E63', at: ['Altura (m)'] },
  edificio: { n: 'Edificios / área construida', g: 'pol', f: 'obstaculos', c: { mec: 1, inf: 0, aer: 1 }, col: '#5D6D7E', at: ['Observación'] },
  torre: { n: 'Torres / cables de alta tensión', g: 'lin', f: 'obstaculos', c: { mec: 0, inf: 0, aer: 2 }, col: '#8E44AD', at: ['Altura (m)'] },
  otro: { n: 'Otro obstáculo', g: 'pol', f: 'obstaculos', c: { mec: 1, inf: 1, aer: 0 }, col: '#616161', at: ['Descripción'] }
};
// efectos de los obstáculos cartografiados, por fuerza (se pueden cambiar en la tabla)
const EFECTOS = [
  ['rio', 'Ríos', 'drenaje'], ['quebrada', 'Quebradas', 'drenaje'], ['canal', 'Canales de riego', 'drenaje'],
  ['agua', 'Lagos, lagunas y cuerpos de agua', 'drenaje'], ['ciudad', 'Ciudades y poblados (mancha urbana)', 'obstaculos']
];
const DEF = {
  fuerza: 'mec', ver: false, op: 75, infil: false, clima: 'normal', corr: 3, ai: null, eje: null,
  fac: { vegetacion: true, drenaje: true, materiales: true, configuracion: true, obstaculos: true, transporte: false },
  ef: {
    mec: { rio: 2, quebrada: 1, canal: 1, agua: 2, ciudad: 2, pr: 30, ps: 60 },
    inf: { rio: 1, quebrada: 0, canal: 0, agua: 2, ciudad: 1, pr: 60, ps: 100 },
    aer: { rio: 0, quebrada: 0, canal: 0, agua: 0, ciudad: 1, pr: '', ps: '' }
  },
  obst: []
};
let S = JSON.parse(JSON.stringify(DEF));
try { const g = JSON.parse(localStorage.getItem('emte-coc') || 'null'); if (g && g.ef) S = Object.assign(S, g, { ver: false }); } catch (e) {}
const guardar = () => { try { localStorage.setItem('emte-coc', JSON.stringify(S)); } catch (e) {} };

/* ---------------- estilos ---------------- */
const css = h('style');
css.textContent = `
.coc-menu .coc-c,.coc-menu .coc-c *,.coc-ley,.coc-ley *{text-transform:none!important}
.coc-menu .coc-c{padding:6px 10px 12px;font:12px var(--tipo-texto,system-ui);color:#14233A}
.coc-menu h4{margin:12px 0 5px;font:700 11px var(--tipo-titulo,system-ui);letter-spacing:.06em;color:#0B1D33;border-bottom:2px solid #B79A5B;padding-bottom:3px;text-transform:uppercase!important}
.coc-menu h4 small{font-weight:600;color:#7a5c12;letter-spacing:0}
.coc-menu .f{display:flex;align-items:center;gap:6px;margin:5px 0;flex-wrap:wrap}
.coc-menu label.k{display:flex;align-items:flex-start;gap:6px;margin:3px 0;cursor:pointer;line-height:1.25}
.coc-menu label.k small{display:block;color:#5A6B80;font-size:10.5px}
.coc-menu select,.coc-menu input[type=number],.coc-menu input[type=text]{padding:3px 5px;border:1px solid #cfd6e6;border-radius:5px;font:600 11.5px system-ui;color:#12294A;background:#fff;box-sizing:border-box}
.coc-menu input[type=number]{width:58px;text-align:right}
.coc-menu .b{padding:5px 9px;border:1px solid #cfd6e6;border-radius:6px;background:#fff;color:#12294A;font:600 11px system-ui;cursor:pointer}
.coc-menu .b:hover{background:#eef2f8}.coc-menu .b.on{background:#12294A;color:#fff;border-color:#12294A}
.coc-menu .b.p{background:#0B1D33;color:#fff;border-color:#0B1D33}
.coc-menu table{width:100%;border-collapse:collapse;font-size:11px}
.coc-menu td,.coc-menu th{padding:4px 3px;border-bottom:1px solid #e3e8f0;text-align:left;vertical-align:middle}
.coc-menu th{font:700 10px system-ui;color:#5A6B80;text-transform:uppercase!important}
.coc-menu td select{width:100%}
.coc-menu .msg{font-size:11px;color:#7a5c12;margin:4px 0}
.coc-menu .res div{display:flex;justify-content:space-between;padding:2px 0}
.coc-menu .reg{font-size:10.5px;color:#3a4658;line-height:1.35}
.coc-menu .reg summary{cursor:pointer;font-weight:700;color:#0B1D33}
.coc-menu .reg li{margin:2px 0}
.coc-menu .x{border:0;background:none;color:#9B1C1C;font:700 14px system-ui;cursor:pointer}
.coc-menu .att input{width:100%;margin:1px 0}
.coc-ley{position:absolute;right:16px;bottom:118px;z-index:8;background:#fff;border:1px solid #D7DEE8;border-radius:8px;box-shadow:0 8px 22px rgba(11,29,51,.18);font:11px var(--tipo-texto,system-ui);color:#14233A;min-width:230px;max-width:290px}
.coc-ley[hidden]{display:none}
.coc-ley b.t{display:block;padding:6px 10px;background:#0B1D33;color:#fff;font:600 11px var(--tipo-titulo,system-ui);letter-spacing:.06em;border-radius:7px 7px 0 0;border-bottom:2px solid #B79A5B}
.coc-ley div{display:flex;align-items:center;gap:8px;padding:2px 10px}
.coc-ley div:last-child{padding-bottom:7px}
.coc-ley i{width:26px;height:13px;flex:none;border:1px solid #0003;border-radius:2px}
.coc-ley i.l{height:0;border:0;border-top-width:4px;border-top-style:solid}
.map.coc-dib svg{cursor:crosshair!important}
@media(max-width:750px){.coc-ley{right:8px;bottom:210px;min-width:190px;font-size:10px}}`;
document.head.append(css);

/* ---------------- sección del panel ---------------- */
const sec = h('details', 'layer-menu coc-menu');
sec.innerHTML = `<summary>COC · Calco de obstáculos combinados</summary><div class="coc-c">
<details class="reg"><summary>Procedimiento (PICB, 3) Obstáculos)</summary><ol>
<li>Identifique obstáculos pertinentes en el AI.</li><li>Determine los efectos de cada obstáculo sobre la movilidad de la fuerza evaluada.</li>
<li>Combine los efectos de obstáculos individuales en un producto integrado.</li></ol>
<b>Sin restricción:</b> libre de restricción, nada se necesita para mejorar la movilidad. <b>Restringido:</b> impide el movimiento hasta cierto punto (zigzagueo, desvíos); líneas diagonales. <b>Severamente restringido:</b> impide el movimiento en formaciones de combate a menos que se haga algún esfuerzo; líneas diagonales sombreadas. Las clasificaciones no son absolutas: reflejan el efecto relativo sobre la maniobra de formaciones de combate.</details>
<h4>1 · Fuerza evaluada</h4>
<div class="f"><select id="coc-fz">${Object.entries(FUERZAS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
<h4>2 · Área de interés (AI)</h4>
<div class="f"><button type="button" class="b" id="coc-ai-p">Toda Omasuyos</button><button type="button" class="b" id="coc-ai-d">Dibujar AI</button></div>
<div class="msg" id="coc-ai-m"></div>
<h4>3 · Calcos de factores</h4><div id="coc-fac"></div>
<div class="f"><span>Clima</span><select id="coc-cl"><option value="normal">Normal / seco</option><option value="lluvia">Lluvias pesadas</option><option value="nieve">Nieve</option></select></div>
<h4>4 · Efectos sobre la movilidad <small id="coc-fz2"></small></h4>
<table><tbody id="coc-ef"></tbody></table>
<h4>5 · Obstáculos identificados en el terreno</h4>
<div class="f"><select id="coc-tp" style="flex:1">${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}">${t.n}</option>`).join('')}</select>
<button type="button" class="b" id="coc-dib">Dibujar</button><button type="button" class="b" id="coc-fin" hidden>Terminar</button></div>
<div class="msg" id="coc-dm"></div>
<table><thead><tr><th>N.º</th><th>Obstáculo</th><th>Efecto</th><th></th></tr></thead><tbody id="coc-ob"></tbody></table>
<h4>6 · Calco de obstáculos combinados</h4>
<label class="k"><input type="checkbox" id="coc-ver"> <span>Mostrar el COC en el mapa</span></label>
<div class="f"><span>Opacidad</span><input type="range" id="coc-op" min="20" max="100" style="flex:1;accent-color:#12294A"></div>
<label class="k" id="coc-il"><input type="checkbox" id="coc-in"> <span>Marcar vías de infiltración para la infantería<small>Áreas severamente restringidas para la fuerza montada que la infantería sí puede atravesar.</small></span></label>
<div class="res" id="coc-res"></div>
<h4>7 · Eje de avance <small>consideraciones adicionales</small></h4>
<div class="f"><button type="button" class="b" id="coc-eje">Dibujar eje</button><span>Franja</span><input type="number" id="coc-corr" min="0.5" max="20" step="0.5"> <span>km</span><button type="button" class="x" id="coc-eje-x" title="Quitar eje">×</button></div>
<div class="res" id="coc-eres"></div>
<div class="f" style="margin-top:10px"><button type="button" class="b" id="coc-ir">Ir al AI</button><button type="button" class="b" id="coc-reset">Valores por defecto</button></div>
</div>`;
const $ = id => document.getElementById(id);
(function colocar() { const ap = aside.querySelector('.ap-menu'), pc = aside.querySelector('.pc-menu'); (ap || pc) ? (ap || pc).after(sec) : aside.append(sec); })();
setTimeout(() => { const ap = aside.querySelector('.ap-menu'); if (ap && ap.nextElementSibling !== sec) ap.after(sec); }, 16000);

const ley = h('section', 'coc-ley'); ley.hidden = true; mapa.append(ley);
for (const t of ['pointerdown', 'click', 'wheel']) ley.addEventListener(t, e => e.stopPropagation());

/* ---------------- capa SVG ---------------- */
const g = document.createElementNS(NS, 'g'); g.id = 'coc-calco'; g.setAttribute('pointer-events', 'none');
const gImg = document.createElementNS(NS, 'g'), gVec = document.createElementNS(NS, 'g'), gEje = document.createElementNS(NS, 'g'), gTmp = document.createElementNS(NS, 'g');
g.append(gImg, gVec, gEje, gTmp);
const sel = (tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
const d = pts => pts.map((p, i) => { const [x, y] = aEscena(p[0], p[1]); return (i ? 'L' : 'M') + x.toFixed(3) + ' ' + y.toFixed(3); }).join('');
const etiquetas = [];
function etiqueta(lon, lat, txt, col) {
  const [x, y] = aEscena(lon, lat), t = sel('g', { class: 'coc-et' }); t.dataset.x = x; t.dataset.y = y;
  t.setAttribute('transform', `translate(${x} ${y}) scale(${1 / esca()})`);
  const w = txt.length * 5.6 + 8;
  t.append(sel('rect', { x: -w / 2, y: -8, width: w, height: 14, rx: 3, fill: '#fff', stroke: col, 'stroke-width': 1 }));
  const tx = sel('text', { y: 3, 'text-anchor': 'middle', 'font-size': 9.5, 'font-weight': 700, 'font-family': 'system-ui', fill: col }); tx.textContent = txt; t.append(tx);
  return t;
}
if (typeof zoom === 'function') { const zp = zoom; zoom = function (...a) { const r = zp.apply(this, a); g.querySelectorAll('.coc-et').forEach(t => t.setAttribute('transform', `translate(${t.dataset.x} ${t.dataset.y}) scale(${1 / scale})`)); return r; }; }
function poner() { if (!g.isConnected) { const ref = document.getElementById('topo-municipios-nombres'); ref ? ref.before(g) : scene.append(g); } }

/* ---------------- datos ---------------- */
let DAT = null, cargando = null;
function cargar() {
  if (cargando) return cargando;
  const j = u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
  cargando = Promise.all([j('data/pendientes_cartas.json'), j('data/rios_omasuyos.geojson'), j('data/cuerpos_agua_omasuyos.geojson'), j('data/mancha_urbana_omasuyos.geojson').catch(() => ({ features: [] })), j('data/limite_omasuyos.geojson'),
    new Promise((ok, mal) => { const im = new Image(); im.onload = () => ok(im); im.onerror = mal; im.src = 'data/pendientes_cartas.png'; })])
    .then(([meta, rios, agua, mancha, lim, im]) => {
      const W = im.naturalWidth, H = im.naturalHeight, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0);
      const px = cx.getImageData(0, 0, W, H).data, V = new Uint8Array(W * H);
      for (let k = 0, o = 0; k < V.length; k++, o += 4) V[k] = px[o + 3] < 128 ? 255 : px[o];
      const [X0, Y0] = merc(meta.nw[0], meta.nw[1]), [X1, Y1] = merc(meta.se[0], meta.se[1]);
      DAT = { meta, W, H, V, X0, Y0, X1, Y1, rios: rios.features, agua: agua.features, mancha: mancha.features, lim: lim.features };
      DAT.prov = mascara(ctx => lim.features.forEach(f => anillos(f.geometry).forEach(r => trazar(ctx, r, true))), true);
      return DAT;
    }).catch(e => { cargando = null; throw e; });
  return cargando;
}
const anillos = gm => gm.type === 'Polygon' ? gm.coordinates : gm.type === 'MultiPolygon' ? gm.coordinates.flat() : [];
const lineas = gm => gm.type === 'LineString' ? [gm.coordinates] : gm.type === 'MultiLineString' ? gm.coordinates : [];
const aPix = (lon, lat) => { const [x, y] = merc(lon, lat); return [(x - DAT.X0) / (DAT.X1 - DAT.X0) * DAT.W, (DAT.Y0 - y) / (DAT.Y0 - DAT.Y1) * DAT.H]; };
function trazar(ctx, pts, cerrar) { pts.forEach((p, i) => { const [x, y] = aPix(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); if (cerrar) ctx.closePath(); }
function mascara(dibujar, relleno) {
  const cv = document.createElement('canvas'); cv.width = DAT.W; cv.height = DAT.H; const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = ctx.strokeStyle = '#fff'; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); dibujar(ctx);
  if (relleno) ctx.fill('evenodd');
  const px = ctx.getImageData(0, 0, DAT.W, DAT.H).data, m = new Uint8Array(DAT.W * DAT.H);
  for (let k = 0, o = 3; k < m.length; k++, o += 4) m[k] = px[o] > 100 ? 1 : 0;
  return m;
}

/* ---------------- clasificación por fuerza ---------------- */
const tipoRio = t => /^R[ií]o/i.test(t || '') ? 'rio' : /Quebrada/i.test(t || '') ? 'quebrada' : 'canal';
const extra = (f) => (S.clima !== 'normal' && (f === 'drenaje' || f === 'materiales')) ? 1 : 0;   // lluvias pesadas / nieve
const ef = (fz, k, fac) => Math.min(2, (+S.ef[fz][k] || 0) + (+S.ef[fz][k] > 0 || k === 'quebrada' || k === 'canal' ? extra(fac) : 0));
function clasificar(fz) {
  const { W, H, V, prov } = DAT, C = new Uint8Array(W * H), e = S.ef[fz];
  // configuración de la superficie (declive) y agua del modelo
  const pr = e.pr === '' ? Infinity : +e.pr, ps = e.ps === '' ? Infinity : +e.ps;
  const cAgua = S.fac.drenaje ? ef(fz, 'agua', 'drenaje') : 0;
  for (let k = 0; k < C.length; k++) {
    if (!prov[k]) continue; const v = V[k];
    if (v === 255) { C[k] = cAgua; continue; }
    if (S.fac.configuracion) C[k] = v >= ps ? 2 : v >= pr ? 1 : 0;
  }
  // obstáculos vectoriales, uno por clase
  for (const c of [1, 2]) {
    const capas = [];
    if (S.fac.drenaje) {
      DAT.rios.forEach(f => { const k = tipoRio(f.properties.tipo); if (ef(fz, k, 'drenaje') === c) capas.push(['l', lineas(f.geometry), k === 'rio' ? 2.2 : 1.2]); });
      DAT.agua.forEach(f => { if (cAgua === c) capas.push(['p', anillos(f.geometry)]); });
    }
    if (S.fac.obstaculos && ef(fz, 'ciudad', 'obstaculos') === c) DAT.mancha.forEach(f => capas.push(['p', anillos(f.geometry)]));
    S.obst.forEach(o => { const t = TIPOS[o.tipo]; if (!t || !S.fac[t.f]) return; const cc = Math.min(2, (+o.cls[fz] || 0) + (+o.cls[fz] > 0 ? extra(t.f) : 0)); if (cc !== c) return; capas.push(t.g === 'pol' ? ['p', [o.pts]] : ['l', [o.pts], 2.2]); });
    if (!capas.length) continue;
    const m = mascara(ctx => { capas.forEach(([tp, geom, ancho]) => { if (tp === 'p') { ctx.beginPath(); geom.forEach(r => trazar(ctx, r, true)); ctx.fill('evenodd'); } else { ctx.lineWidth = ancho; geom.forEach(l => { ctx.beginPath(); trazar(ctx, l, false); ctx.stroke(); }); } }); }, false);
    for (let k = 0; k < C.length; k++) if (m[k] && prov[k] && C[k] < c) C[k] = c;
  }
  return C;
}
function enAI() {
  if (!S.ai) return null;
  const [a, b] = [aPix(S.ai[0], S.ai[1]), aPix(S.ai[2], S.ai[3])];
  return [Math.max(0, Math.floor(Math.min(a[0], b[0]))), Math.max(0, Math.floor(Math.min(a[1], b[1]))), Math.min(DAT.W, Math.ceil(Math.max(a[0], b[0]))), Math.min(DAT.H, Math.ceil(Math.max(a[1], b[1])))];
}

/* ---------------- dibujo del COC ---------------- */
let url = null, tPint = 0;
const pintarPronto = () => { clearTimeout(tPint); tPint = setTimeout(pintar, 120); };
function pintar() {
  tabla(); leyenda();
  if (!S.ver) { g.remove(); ley.hidden = true; return; }
  $('coc-res').innerHTML = '<div><span>Calculando…</span></div>';
  cargar().then(() => {
    const fz = S.fuerza, C = clasificar(fz), { W, H, prov } = DAT;
    const I = (S.infil && fz !== 'inf') ? clasificar('inf') : null;
    const r = enAI() || [0, 0, W, H];
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'), im = ctx.createImageData(W, H), px = im.data, n = [0, 0, 0]; let ni = 0;
    for (let y = r[1]; y < r[3]; y++) for (let x = r[0]; x < r[2]; x++) {
      const k = y * W + x; if (!prov[k]) continue; const c = C[k]; n[c]++; const o = k * 4, diag = (x + y) % 7;
      if (c === 1) { if (diag === 0) { px[o] = 120; px[o + 1] = 80; px[o + 2] = 0; px[o + 3] = 255; } }
      else if (c === 2) { if (diag === 0 || diag === 1) { px[o] = 110; px[o + 1] = 0; px[o + 2] = 0; px[o + 3] = 255; } else { px[o] = 150; px[o + 1] = 20; px[o + 2] = 20; px[o + 3] = 80; } }
      if (I && c === 2 && I[k] < 2 && x % 5 === 0 && y % 5 === 0) { px[o] = 0; px[o + 1] = 140; px[o + 2] = 60; px[o + 3] = 255; ni++; }
    }
    ctx.putImageData(im, 0, 0);
    cv.toBlob(b => {
      const nuevo = URL.createObjectURL(b); gImg.replaceChildren();
      const [ax, ay] = aEscena(DAT.meta.nw[0], DAT.meta.nw[1]), [bx, by] = aEscena(DAT.meta.se[0], DAT.meta.se[1]);
      const img = sel('image', { x: ax, y: ay, width: bx - ax, height: by - ay, preserveAspectRatio: 'none', href: nuevo, opacity: S.op / 100 });
      gImg.append(img); if (url) URL.revokeObjectURL(url); url = nuevo;
      vectores(fz); poner(); ley.hidden = false;
    }, 'image/png');
    const tot = n[0] + n[1] + n[2] || 1, km2 = c => dec(c * 400 / 1e6, 1);
    $('coc-res').innerHTML = `<div><b>${S.ai ? 'AI dibujada' : 'AI: toda Omasuyos'}</b><span>${FUERZAS[fz]}</span></div>` +
      CLASE.map((t, i) => `<div><span>${t}</span><span><b>${dec(n[i] / tot * 100)} %</b> · ${km2(n[i])} km²</span></div>`).join('') +
      (I ? `<div><span>Vías de infiltración (infantería)</span><span>${km2(ni * 25)} km² aprox.</span></div>` : '');
    analizarEje();
  }).catch(() => { $('coc-res').innerHTML = '<div><span>No se pudieron cargar los datos del calco.</span></div>'; });
}
function vectores(fz) {
  gVec.replaceChildren();
  // ríos invadeables: líneas sólidas amplias
  if (S.fac.drenaje && ef(fz, 'rio', 'drenaje') === 2)
    DAT.rios.forEach(f => { if (tipoRio(f.properties.tipo) === 'rio') lineas(f.geometry).filter(dentroAI).forEach(l => gVec.append(sel('path', { d: d(l), fill: 'none', stroke: '#0B3D91', 'stroke-width': 4, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }))); });
  S.obst.forEach(o => {
    const t = TIPOS[o.tipo]; if (!t) return;
    const p = sel('path', { d: d(o.pts) + (t.g === 'pol' ? 'Z' : ''), fill: t.g === 'pol' ? t.col : 'none', 'fill-opacity': .18, stroke: t.col, 'stroke-width': t.g === 'pol' ? 2 : (o.tipo === 'rio' ? 5 : 3.5), 'vector-effect': 'non-scaling-stroke' });
    if (o.tipo === 'alambrada') p.setAttribute('stroke-dasharray', '2 5');
    if (o.tipo === 'torre') p.setAttribute('stroke-dasharray', '9 4');
    if (o.tipo === 'foso') p.setAttribute('stroke-dasharray', '12 3');
    gVec.append(p);
    const c = o.pts.reduce((a, q) => [a[0] + q[0] / o.pts.length, a[1] + q[1] / o.pts.length], [0, 0]);
    const m = t.g === 'lin' ? o.pts[Math.floor(o.pts.length / 2)] : c;
    gVec.append(etiqueta(m[0], m[1], o.id + ' · ' + t.n.split(' (')[0].split(' /')[0], t.col));
  });
  if (S.ai) { const [a, b, c2, e] = S.ai; gVec.append(sel('path', { d: d([[a, b], [c2, b], [c2, e], [a, e]]) + 'Z', fill: 'none', stroke: '#0B1D33', 'stroke-width': 2, 'stroke-dasharray': '10 5', 'vector-effect': 'non-scaling-stroke' })); gVec.append(etiqueta(a, b, 'AI', '#0B1D33')); }
}

function dentroAI(l) { if (!S.ai) return true; const [a, b, c, e] = S.ai; return l.some(([x, y]) => x >= a && x <= c && y <= b && y >= e); }
/* ---------------- eje de avance: obstáculos perpendiculares y paralelos ---------------- */
function analizarEje() {
  gEje.replaceChildren(); const out = $('coc-eres'); if (!S.eje) { out.innerHTML = ''; return; }
  const [p1, p2] = S.eje, [ax, ay] = merc(p1[0], p1[1]), [bx, by] = merc(p2[0], p2[1]), k = Math.cos(((p1[1] + p2[1]) / 2) * D2R);
  const L = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / L, uy = (by - ay) / L, corr = (+S.corr || 3) * 1000 / k;
  // flecha del eje
  const [sx, sy] = aEscena(p1[0], p1[1]), [ex, ey] = aEscena(p2[0], p2[1]);
  gEje.append(sel('path', { d: `M${sx} ${sy}L${ex} ${ey}`, stroke: '#1F4E9E', 'stroke-width': 5, fill: 'none', 'vector-effect': 'non-scaling-stroke', 'marker-end': 'url(#coc-flecha)' }));
  const lin = [], fz = S.fuerza;
  if (S.fac.drenaje) DAT.rios.forEach(f => { const kk = tipoRio(f.properties.tipo); if (ef(fz, kk, 'drenaje') > 0) lineas(f.geometry).forEach(l => lin.push([l, f.properties.nombre || (kk === 'rio' ? 'Río' : kk === 'quebrada' ? 'Quebrada' : 'Canal')])); });
  S.obst.forEach(o => { const t = TIPOS[o.tipo]; if (t && t.g === 'lin' && S.fac[t.f] && +o.cls[fz] > 0) lin.push([o.pts, o.id + ' · ' + t.n]); });
  let nPer = 0, nPar = 0; const nombres = { per: new Set(), par: new Set() };
  lin.forEach(([l, nom]) => {
    if (l.length < 2) return;
    let dmin = Infinity; const P = l.map(q => merc(q[0], q[1]));
    for (const [x, y] of P) { const t = Math.max(0, Math.min(L, (x - ax) * ux + (y - ay) * uy)), dd = Math.hypot(ax + ux * t - x, ay + uy * t - y); if (dd < dmin) dmin = dd; }
    if (dmin > corr) return;
    const [fx, fy] = P[0], [lx, ly] = P[P.length - 1], ll = Math.hypot(lx - fx, ly - fy); if (ll < 200 / k) return;
    const ang = Math.acos(Math.min(1, Math.abs(((lx - fx) * ux + (ly - fy) * uy) / ll))) / D2R;
    const tipo = ang >= 60 ? 'per' : ang <= 30 ? 'par' : null; if (!tipo) return;
    tipo === 'per' ? nPer++ : nPar++; nombres[tipo].add(nom);
    gEje.append(sel('path', { d: d(l), fill: 'none', stroke: tipo === 'per' ? '#E67E22' : '#16A085', 'stroke-width': 5, 'stroke-opacity': .85, 'stroke-dasharray': '8 4', 'vector-effect': 'non-scaling-stroke' }));
  });
  const lista = s => [...s].slice(0, 6).map(esc).join(', ') + (s.size > 6 ? '…' : '');
  out.innerHTML = `<div><span><b style="color:#E67E22">Perpendiculares</b> al eje</span><b>${nPer}</b></div>${nPer ? `<div style="display:block;color:#5A6B80;font-size:10.5px">${lista(nombres.per)}</div>` : ''}
<div style="display:block;font-size:10.5px;color:#3a4658">Favorecen al defensor: demoran al atacante, lo fuerzan en concentraciones y lo sostienen más tiempo bajo los fuegos del defensor.</div>
<div><span><b style="color:#16A085">Paralelos</b> al eje</span><b>${nPar}</b></div>${nPar ? `<div style="display:block;color:#5A6B80;font-size:10.5px">${lista(nombres.par)}</div>` : ''}
<div style="display:block;font-size:10.5px;color:#3a4658">Pueden dar al atacante protección en los flancos, pero interfieren con su movimiento lateral, el empleo de reservas y la coordinación entre unidades adyacentes.</div>`;
}
const defs = svgR.querySelector('defs') || svgR.insertBefore(document.createElementNS(NS, 'defs'), svgR.firstChild);
defs.insertAdjacentHTML('beforeend', '<marker id="coc-flecha" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1F4E9E"/></marker>');

/* ---------------- tablas del panel ---------------- */
function tabla() {
  const fz = S.fuerza; $('coc-fz').value = fz; $('coc-fz2').textContent = '· ' + FUERZAS[fz]; $('coc-cl').value = S.clima;
  $('coc-ver').checked = S.ver; $('coc-op').value = S.op; $('coc-in').checked = S.infil; $('coc-il').hidden = fz === 'inf'; $('coc-corr').value = S.corr;
  $('coc-ai-m').textContent = S.ai ? 'AI dibujada en el mapa.' : 'AI: toda la provincia Omasuyos.';
  $('coc-ai-p').classList.toggle('on', !S.ai); $('coc-ai-d').classList.toggle('on', !!S.ai);
  // factores
  const fac = $('coc-fac'); fac.replaceChildren();
  FACTORES.filter(f => f[0] !== 'clima').forEach(([k, n, s]) => {
    const l = h('label', 'k'), cb = h('input'); cb.type = 'checkbox'; cb.checked = !!S.fac[k];
    cb.onchange = () => { S.fac[k] = cb.checked; if (k === 'transporte') transporte(cb.checked); guardar(); pintarPronto(); };
    const t = h('span'); t.append(document.createTextNode(n), h('small', null, s)); l.append(cb, t); fac.append(l);
  });
  // efectos
  const tb = $('coc-ef'); tb.replaceChildren(); const e = S.ef[fz];
  const opc = v => CLASE.map((t, i) => `<option value="${i}"${+v === i ? ' selected' : ''}>${t}</option>`).join('');
  EFECTOS.forEach(([k, n]) => {
    const tr = h('tr'); tr.innerHTML = `<td>${n}</td><td style="width:52%"><select>${opc(e[k])}</select></td>`;
    tr.querySelector('select').onchange = ev => { e[k] = +ev.target.value; guardar(); pintarPronto(); }; tb.append(tr);
  });
  const tr = h('tr'); tr.innerHTML = `<td>Declive<br><small style="color:#5A6B80">restringido desde · severamente desde</small></td><td><input type="number" min="1" max="250" value="${e.pr}" data-k="pr"> % <input type="number" min="1" max="250" value="${e.ps}" data-k="ps"> %</td>`;
  tr.querySelectorAll('input').forEach(i => i.onchange = () => { const v = i.value === '' ? '' : Math.max(1, Math.min(250, Math.round(+i.value))); e[i.dataset.k] = v; i.value = v; guardar(); pintarPronto(); });
  tb.append(tr);
  // obstáculos dibujados
  const ob = $('coc-ob'); ob.replaceChildren();
  if (!S.obst.length) { const r = h('tr'); r.innerHTML = '<td colspan="4" style="color:#5A6B80">Elija el tipo, pulse «Dibujar» y marque los puntos en el mapa.</td>'; ob.append(r); }
  S.obst.forEach(o => {
    const t = TIPOS[o.tipo], r = h('tr');
    r.innerHTML = `<td><b style="color:${t.col}">${o.id}</b></td><td class="att"><b>${esc(t.n)}</b>${t.at.map((a, i) => `<input type="text" placeholder="${esc(a)}" value="${esc((o.at || [])[i] || '')}" data-i="${i}">`).join('')}</td><td><select>${opc(o.cls[fz])}</select></td><td><button type="button" class="x" title="Quitar">×</button></td>`;
    r.querySelector('select').onchange = ev => { o.cls[fz] = +ev.target.value; guardar(); pintarPronto(); };
    r.querySelectorAll('input').forEach(i => i.onchange = () => { o.at = o.at || []; o.at[+i.dataset.i] = i.value; guardar(); });
    r.querySelector('.x').onclick = () => { S.obst.splice(S.obst.indexOf(o), 1); guardar(); pintarPronto(); };
    ob.append(r);
  });
}
function leyenda() {
  const fz = S.fuerza, usados = new Set(S.obst.filter(o => S.fac[TIPOS[o.tipo].f]).map(o => o.tipo));
  const rioInv = S.fac.drenaje && ef(fz, 'rio', 'drenaje') === 2;
  ley.innerHTML = `<b class="t">COC · ${esc(FUERZAS[fz].toUpperCase())}</b>
<div><i style="background:#fff"></i><span>Sin restricción (sin marca)</span></div>
<div><i style="background:repeating-linear-gradient(135deg,#785000 0 1.5px,#fff 1.5px 6px)"></i><span>Restringido · líneas diagonales</span></div>
<div><i style="background:repeating-linear-gradient(135deg,#6E0000 0 2.5px,#e8c8c8 2.5px 6px)"></i><span>Severamente restringido · líneas diagonales sombreadas</span></div>` +
    (rioInv ? '<div><i class="l" style="border-top-color:#0B3D91"></i><span>Río invadeable · línea sólida amplia</span></div>' : '') +
    [...usados].map(k => `<div><i class="l" style="border-top-color:${TIPOS[k].col}${TIPOS[k].g === 'pol' ? ';border-top-width:0;height:11px;border:2px solid ' + TIPOS[k].col + ';background:' + TIPOS[k].col + '33' : ''}"></i><span>${esc(TIPOS[k].n)}</span></div>`).join('') +
    (S.infil && fz !== 'inf' ? '<div><i style="background:radial-gradient(#008C3C 1.5px,transparent 2px) 0 0/6px 6px"></i><span>Vía de infiltración para infantería</span></div>' : '') +
    (S.eje ? '<div><i class="l" style="border-top-color:#1F4E9E"></i><span>Eje de avance</span></div><div><i class="l" style="border-top-color:#E67E22;border-top-style:dashed"></i><span>Obstáculo perpendicular al eje</span></div><div><i class="l" style="border-top-color:#16A085;border-top-style:dashed"></i><span>Obstáculo paralelo al eje</span></div>' : '') +
    (S.ai ? '<div><i class="l" style="border-top-color:#0B1D33;border-top-style:dashed"></i><span>Área de interés (AI)</span></div>' : '') +
    `<div style="font-size:9.5px;color:#5A6B80">Clima: ${{ normal: 'normal / seco', lluvia: 'lluvias pesadas', nieve: 'nieve' }[S.clima]}. Las clasificaciones no son absolutas.</div>`;
}
function transporte(on) {   // sistemas de transporte: enciende/apaga la red vial y los puentes del geovisor
  const vias = [...document.querySelectorAll('#layers label')].find(l => /^Todas las vías/.test(l.textContent.trim()))?.querySelector('input');
  const puentes = [...document.querySelectorAll('#apoyo-capas label, #layers label')].find(l => /^Puentes/.test(l.textContent.trim()))?.querySelector('input');
  [vias, puentes].forEach(cb => { if (cb && cb.checked !== on) cb.click(); });
}

/* ---------------- dibujo en el mapa (AI, obstáculos, eje) ---------------- */
let modo = null, pts = [];
function iniciar(m) {
  modo = m; pts = []; gTmp.replaceChildren(); mapa.classList.add('coc-dib'); poner();
  $('coc-fin').hidden = m !== 'obst'; $('coc-dib').classList.toggle('on', m === 'obst'); $('coc-ai-d').classList.toggle('on', m === 'ai'); $('coc-eje').classList.toggle('on', m === 'eje');
  $('coc-dm').textContent = m === 'obst' ? 'Clic en el mapa para marcar los vértices; «Terminar» o doble clic para cerrar. Esc cancela.' : '';
  if (m === 'ai') $('coc-ai-m').textContent = 'Clic en dos esquinas opuestas del AI.';
  if (m === 'eje') $('coc-eres').innerHTML = '<div><span>Clic en el inicio y luego en el objetivo del eje.</span></div>';
}
function terminar(cancelar) {
  const m = modo; modo = null; mapa.classList.remove('coc-dib'); gTmp.replaceChildren(); $('coc-fin').hidden = true; $('coc-dm').textContent = '';
  ['coc-dib', 'coc-eje'].forEach(i => $(i).classList.remove('on'));
  if (cancelar || !m) { tabla(); if (S.ver) analizarEje(); return; }
  if (m === 'obst') {
    const t = TIPOS[$('coc-tp').value], min = t.g === 'pol' ? 3 : 2;
    if (pts.length >= min) { const id = (S.obst.reduce((a, o) => Math.max(a, o.id), 0) || 0) + 1; S.obst.push({ id, tipo: $('coc-tp').value, pts: pts.slice(), cls: { ...t.c }, at: [] }); }
  }
  guardar(); if (!S.ver) { S.ver = true; } pintarPronto();
}
function previa() {
  gTmp.replaceChildren(); if (!pts.length) return;
  const t = modo === 'obst' ? TIPOS[$('coc-tp').value] : null;
  gTmp.append(sel('path', { d: d(pts) + (t && t.g === 'pol' && pts.length > 2 ? 'Z' : ''), fill: t && t.g === 'pol' ? t.col : 'none', 'fill-opacity': .15, stroke: t ? t.col : '#0B1D33', 'stroke-width': 2.5, 'stroke-dasharray': '6 3', 'vector-effect': 'non-scaling-stroke' }));
  pts.forEach(p => { const [x, y] = aEscena(p[0], p[1]); gTmp.append(sel('circle', { cx: x, cy: y, r: 3.5 / esca(), fill: '#fff', stroke: '#0B1D33', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' })); });
}
let abajo = null;
svgR.addEventListener('pointerdown', e => { if (modo) abajo = [e.clientX, e.clientY]; }, true);
svgR.addEventListener('click', e => {
  if (!modo) return; e.stopPropagation(); e.preventDefault();
  if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 5) return;
  const m = scene.getScreenCTM(); if (!m) return; const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()), ll = deEscena(q.x, q.y);
  pts.push(ll); previa();
  if (modo === 'ai' && pts.length === 2) { S.ai = [Math.min(pts[0][0], pts[1][0]), Math.max(pts[0][1], pts[1][1]), Math.max(pts[0][0], pts[1][0]), Math.min(pts[0][1], pts[1][1])]; terminar(); }
  else if (modo === 'eje' && pts.length === 2) { S.eje = pts.slice(); terminar(); }
}, true);
svgR.addEventListener('dblclick', e => { if (modo === 'obst') { e.stopPropagation(); e.preventDefault(); pts.pop(); terminar(); } }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modo) terminar(true); });

/* ---------------- controles ---------------- */
for (const t of ['pointerdown', 'click', 'wheel']) sec.addEventListener(t, e => e.stopPropagation());
$('coc-fz').onchange = e => { S.fuerza = e.target.value; guardar(); pintarPronto(); };
$('coc-cl').onchange = e => { S.clima = e.target.value; guardar(); pintarPronto(); };
$('coc-ver').onchange = e => { S.ver = e.target.checked; pintarPronto(); };
$('coc-op').oninput = e => { S.op = +e.target.value; gImg.querySelector('image')?.setAttribute('opacity', S.op / 100); guardar(); };
$('coc-in').onchange = e => { S.infil = e.target.checked; guardar(); pintarPronto(); };
$('coc-ai-p').onclick = () => { S.ai = null; guardar(); pintarPronto(); };
$('coc-ai-d').onclick = () => iniciar('ai');
$('coc-dib').onclick = () => modo === 'obst' ? terminar() : iniciar('obst');
$('coc-fin').onclick = () => terminar();
$('coc-eje').onclick = () => iniciar('eje');
$('coc-eje-x').onclick = () => { S.eje = null; guardar(); pintarPronto(); };
$('coc-corr').onchange = e => { S.corr = Math.max(.5, Math.min(20, +e.target.value || 3)); guardar(); pintarPronto(); };
$('coc-reset').onclick = () => { const ob = S.obst; S = JSON.parse(JSON.stringify(DEF)); S.obst = ob; S.ver = true; guardar(); pintarPronto(); };
$('coc-ir').onclick = () => {
  cargar().then(() => {
    if (typeof zoom !== 'function') return;
    const b = S.ai || [DAT.meta.nw[0], DAT.meta.nw[1], DAT.meta.se[0], DAT.meta.se[1]];
    const [ax, ay] = aEscena(b[0], b[1]), [bx, by] = aEscena(b[2], b[3]), cx = (ax + bx) / 2, cy = (ay + by) / 2;
    scale = Math.max(.05, Math.min(480, Math.min(1000 / Math.abs(bx - ax), 760 / Math.abs(by - ay)) * .85)); panX = (500 - cx) * scale; panY = (380 - cy) * scale; zoom(1);
  });
};
tabla(); leyenda();
window.EMTE_COC = { estado: () => S, pintar };
});
