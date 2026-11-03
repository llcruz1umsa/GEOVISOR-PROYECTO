/* Comparar mapas con cortina (agregado por BYNS7, 02-11-2026). Herramientas › «Comparar mapas».
   Una barra vertical que se arrastra sobre el mapa: a la izquierda queda el mapa como se ve ahora y a la derecha
   otro mapa base (satélite 2026, satélite Esri, estándar, relieve…). Las capas del geovisor siguen encima en los
   dos lados. Además, las pendientes MDT, las curvas de nivel y las cartas IGM colocadas pueden mostrarse solo a la
   derecha, para compararlas con la imagen de la izquierda. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const mapa = document.querySelector('.map'), scene = document.getElementById('scene');
if (!mapa || !scene) return;
const svg = scene.ownerSVGElement, NS = 'http://www.w3.org/2000/svg', K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702;
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const FONDOS = {
  s2026: { n: 'Satélite 2026 (10 m)', url: (z, x, y) => `tiles/sentinel2026/${z}/${x}/${y}.webp`, max: 15, zmin: 9, bbox: [-69.01, -16.276, -68.467, -15.734] },
  planet: { n: 'Satélite 3 m', url: (z, x, y) => `tiles/planet2026/${z}/${x}/${y}.webp`, max: 17, zmin: 9, bbox: [-68.992, -16.2586, -68.4844, -15.751], oculto: true },
  satellite: { n: 'Satélite Esri (en línea)', url: (z, x, y) => `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`, max: 18 },
  standard: { n: 'Estándar OSM (en línea)', url: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`, max: 19 },
  relief: { n: 'Relieve sombreado (en línea)', url: (z, x, y) => `https://services.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/${z}/${y}/${x}`, max: 18 },
  none: { n: 'Sin fondo' }
};
const SOLO_DER = [['pend', 'Pendientes MDT', () => document.getElementById('pendientes-cartas')], ['curvas', 'Curvas de nivel', () => document.getElementById('curvas-cartas')], ['cartas', 'Cartas IGM colocadas', () => document.getElementById('cc-capa')], ['cub', 'Cubierta y encubrimiento', () => document.getElementById('hp-cub')]];

const css = h('style');
css.textContent = `
.cm-barra{position:absolute;top:0;bottom:0;z-index:7;width:0;pointer-events:none}
.cm-barra[hidden]{display:none}
.cm-barra::before{content:'';position:absolute;top:0;bottom:0;left:-2px;width:4px;background:#B79A5B;box-shadow:0 0 0 1px #0B1D3399,0 0 12px #0006}
.cm-asa{position:absolute;top:50%;left:-19px;width:38px;height:38px;margin-top:-19px;border-radius:50%;background:#0B1D33;border:3px solid #B79A5B;color:#fff;display:grid;place-items:center;font:800 16px var(--tipo-titulo,system-ui);cursor:ew-resize;pointer-events:auto;touch-action:none;box-shadow:0 4px 14px #0006}
.cm-asa:focus{outline:3px solid #fff}
.cm-et{position:absolute;top:calc(50% + 28px);white-space:nowrap;padding:4px 9px;border-radius:12px;background:#0B1D33e6;color:#fff;font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.06em;pointer-events:none}
.cm-et.izq{right:10px}.cm-et.der{left:10px}
.cm-panel{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:9;width:min(430px,calc(100% - 24px));background:#fff;border:1px solid #D7DEE8;border-radius:10px;box-shadow:0 14px 40px rgba(11,29,51,.28);font:12px var(--tipo-texto,system-ui);color:#14233A;overflow:hidden}
.cm-panel[hidden]{display:none}
.cm-cab{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#0B1D33;color:#fff;border-bottom:2px solid #B79A5B;font:800 12px var(--tipo-titulo,system-ui);letter-spacing:.08em}
.cm-cab button{margin-left:auto;border:0;background:none;color:#fff;font-size:20px;cursor:pointer}
.cm-c{display:grid;gap:8px;padding:10px 12px}
.cm-fila{display:grid;grid-template-columns:86px 1fr;align-items:center;gap:8px}
.cm-fila b{font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.08em;color:#5A6B80}
.cm-fila select{padding:6px 8px;border:1px solid #CDD6E2;border-radius:6px;font:12px var(--tipo-texto,system-ui)}
.cm-fila span{font-weight:600}
.cm-solo{display:flex;flex-wrap:wrap;gap:4px 12px}
.cm-solo label{display:flex!important;align-items:center;gap:5px;padding:0!important;border:0!important;font-size:11.5px;cursor:pointer}
.cm-solo label.no{opacity:.45}`;
document.head.append(css);

/* ---------- barra y panel ---------- */
const barra = h('div', 'cm-barra'); barra.hidden = true;
const asa = h('div', 'cm-asa', '⇆'); asa.tabIndex = 0; asa.setAttribute('role', 'slider'); asa.setAttribute('aria-label', 'Mover la cortina');
const etI = h('span', 'cm-et izq'), etD = h('span', 'cm-et der');
barra.append(asa, etI, etD); mapa.append(barra);
const panel = h('section', 'cm-panel'); panel.hidden = true;
panel.innerHTML = `<div class="cm-cab">COMPARAR MAPAS<button type="button" aria-label="Cerrar">×</button></div><div class="cm-c">
<div class="cm-fila"><b>IZQUIERDA</b><span class="cm-izq"></span></div>
<div class="cm-fila"><b>DERECHA</b><select class="cm-der">${Object.entries(FONDOS).map(([k, f]) => `<option value="${k}"${f.oculto ? ' hidden' : ''}>${f.n}</option>`).join('')}</select></div>
<div class="cm-fila"><b>SOLO A LA DERECHA</b><div class="cm-solo">${SOLO_DER.map(([k, n]) => `<label><input type="checkbox" value="${k}"> ${n}</label>`).join('')}</div></div></div>`;
mapa.append(panel);
for (const t of ['pointerdown', 'click', 'wheel', 'dblclick']) panel.addEventListener(t, e => e.stopPropagation());
const selDer = panel.querySelector('.cm-der'), izqTxt = panel.querySelector('.cm-izq');
fetch('tiles/planet2026/info.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).then(i => { if (i) selDer.querySelector('[value=planet]').hidden = false; }).catch(() => {});

let activo = false, fx = .5;   // posición de la barra (fracción del ancho del mapa)
const gT = document.createElementNS(NS, 'g'); gT.id = 'cm-fondo'; gT.style.pointerEvents = 'none';
const defs = svg.querySelector(':scope > defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);
const cp = document.createElementNS(NS, 'clipPath'); cp.id = 'cm-clip'; cp.setAttribute('clipPathUnits', 'userSpaceOnUse');
const cpR = document.createElementNS(NS, 'rect'); cp.append(cpR); defs.append(cp);
gT.setAttribute('clip-path', 'url(#cm-clip)');

function nombreIzq() { const r = document.querySelector('#basemap-options input:checked'); return r ? r.closest('label').textContent.trim() : 'Mapa actual'; }
function recorte() {
  const m = scene.getScreenCTM(); if (!m) return;
  const rm = mapa.getBoundingClientRect(), x = rm.left + rm.width * fx, inv = m.inverse();
  const a = new DOMPoint(x, rm.top - 50).matrixTransform(inv), b = new DOMPoint(rm.right + 50, rm.bottom + 50).matrixTransform(inv);
  cpR.setAttribute('x', a.x); cpR.setAttribute('y', a.y); cpR.setAttribute('width', Math.max(0, b.x - a.x)); cpR.setAttribute('height', Math.max(0, b.y - a.y));
  barra.style.left = (rm.width * fx) + 'px';
}
let gen = 0;
function teselas() {
  if (!activo) return;
  const k = selDer.value, F = FONDOS[k], g = ++gen;
  if (!F.url) { gT.replaceChildren(); const r = document.createElementNS(NS, 'rect'); ['x', 'y', 'width', 'height'].forEach(a => r.setAttribute(a, cpR.getAttribute(a))); r.setAttribute('fill', '#F3F4F7'); gT.append(r); return; }
  const m = scene.getScreenCTM(); if (!m) return;
  const rm = mapa.getBoundingClientRect(), inv = m.inverse(), c0 = new DOMPoint(rm.left + rm.width * fx, rm.top).matrixTransform(inv), c1 = new DOMPoint(rm.right, rm.bottom).matrixTransform(inv);
  const cs = Math.hypot(m.a, m.b); let z = Math.max(0, Math.min(F.max, Math.round(Math.log2(K * 2 * Math.PI * cs / 256)))); if (F.zmin && z < F.zmin) z = F.zmin;
  const rango = n => ({ x0: Math.max(0, Math.floor((((c0.x - 500) / K - OX) + Math.PI) / (2 * Math.PI) * n)), x1: Math.min(n - 1, Math.floor((((c1.x - 500) / K - OX) + Math.PI) / (2 * Math.PI) * n)), y0: Math.max(0, Math.floor((Math.PI - ((380 - c0.y) / K - OY)) / (2 * Math.PI) * n)), y1: Math.min(n - 1, Math.floor((Math.PI - ((380 - c1.y) / K - OY)) / (2 * Math.PI) * n)) });
  let n = 2 ** z, r = rango(n); while ((r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1) > 100 && z > (F.zmin || 0)) { z--; n = 2 ** z; r = rango(n); }
  if (F.bbox) { const tx = lo => Math.floor((lo + 180) / 360 * n), ty = la => Math.floor((1 - Math.log(Math.tan(la * Math.PI / 180) + 1 / Math.cos(la * Math.PI / 180)) / Math.PI) / 2 * n); r.x0 = Math.max(r.x0, tx(F.bbox[0])); r.x1 = Math.min(r.x1, tx(F.bbox[2])); r.y0 = Math.max(r.y0, ty(F.bbox[3])); r.y1 = Math.min(r.y1, ty(F.bbox[1])); }
  const hay = new Map([...gT.children].map(e => [e.dataset.k, e])), usar = new Set();
  // fondo claro debajo de las teselas para que el mapa base de la izquierda no se vea a la derecha
  let base = gT.querySelector('.cm-bg'); if (!base) { base = document.createElementNS(NS, 'rect'); base.setAttribute('class', 'cm-bg'); base.dataset.k = 'bg'; base.setAttribute('fill', '#E9EDF2'); gT.prepend(base); }
  ['x', 'y', 'width', 'height'].forEach(a => base.setAttribute(a, cpR.getAttribute(a))); usar.add('bg');
  for (let x = r.x0; x <= r.x1; x++) for (let y = r.y0; y <= r.y1; y++) {
    const key = `${k}/${z}/${x}/${y}`; usar.add(key); if (hay.has(key)) continue;
    const t = document.createElementNS(NS, 'image'), span = 2 * Math.PI * K / n; t.dataset.k = key;
    t.setAttribute('x', 500 + (x / n * 2 * Math.PI - Math.PI + OX) * K); t.setAttribute('y', 380 - (Math.PI - y / n * 2 * Math.PI + OY) * K);
    t.setAttribute('width', span + .05); t.setAttribute('height', span + .05); t.setAttribute('preserveAspectRatio', 'none');
    t.addEventListener('error', () => { if (g === gen) t.remove(); });
    t.setAttribute('href', F.url(z, x, y)); gT.append(t);
  }
  for (const [key, e] of hay) if (!usar.has(key)) e.remove();
}
function soloDerecha() {
  panel.querySelectorAll('.cm-solo input').forEach(cb => {
    const el = SOLO_DER.find(s => s[0] === cb.value)[2](); cb.closest('label').classList.toggle('no', !el);
    if (!el) return;
    if (activo && cb.checked) el.setAttribute('clip-path', 'url(#cm-clip)'); else if (el.getAttribute('clip-path') === 'url(#cm-clip)') el.removeAttribute('clip-path');
  });
}
function actualizar() {
  if (!activo) return;
  recorte(); izqTxt.textContent = nombreIzq(); etI.textContent = '◀ ' + nombreIzq().toUpperCase();
  etD.textContent = (FONDOS[selDer.value].n.replace(/ \(.*\)$/, '') + ([...panel.querySelectorAll('.cm-solo input:checked')].length ? ' + capas' : '')).toUpperCase() + ' ▶';
  const b = document.getElementById('basemap'); if (b && gT.previousSibling !== b) b.after(gT); else if (!b && !gT.isConnected) scene.prepend(gT);
  teselas(); soloDerecha();
}
let t = 0; const programar = () => { clearTimeout(t); t = setTimeout(actualizar, 120); };
function abrir(si) {
  activo = si; barra.hidden = panel.hidden = !si; tarj && tarj.classList.toggle('chosen', si);
  if (si) { if (selDer.value === nombreKey()) selDer.value = nombreKey() === 'satellite' ? 's2026' : 'satellite'; actualizar(); }
  else { gT.remove(); soloDerecha(); }
}
function nombreKey() { return document.querySelector('#basemap-options input:checked')?.value; }
panel.querySelector('.cm-cab button').onclick = () => abrir(false);
selDer.onchange = () => { gT.replaceChildren(); actualizar(); };
panel.querySelectorAll('.cm-solo input').forEach(cb => cb.onchange = actualizar);
document.addEventListener('change', e => { if (activo && e.target.name === 'basemap') programar(); });
// arrastrar la cortina
let arr = false;
asa.addEventListener('pointerdown', e => { e.stopPropagation(); e.preventDefault(); arr = true; asa.setPointerCapture(e.pointerId); });
asa.addEventListener('pointermove', e => { if (!arr) return; const rm = mapa.getBoundingClientRect(); fx = Math.min(.98, Math.max(.02, (e.clientX - rm.left) / rm.width)); recorte(); programar(); });
asa.addEventListener('pointerup', () => { arr = false; programar(); });
asa.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { fx = Math.min(.98, Math.max(.02, fx + (e.key === 'ArrowLeft' ? -.03 : .03))); actualizar(); e.preventDefault(); } });
for (const tp of ['click', 'dblclick', 'wheel']) asa.addEventListener(tp, e => e.stopPropagation());
// al mover o acercar el mapa
if (typeof zoom === 'function') { const zPrev = zoom; zoom = function (...a) { const r = zPrev.apply(this, a); if (activo) { recorte(); programar(); } return r; }; }
window.addEventListener('resize', () => activo && actualizar());
document.addEventListener('keydown', e => { if (e.key === 'Escape' && activo && !document.querySelector('.ct-fondo:not([hidden]), .lm-fondo:not([hidden])')) abrir(false); });

/* ---------- tarjeta en Herramientas ---------- */
let tarj = null, n = 0;
(function poner() {
  const grilla = document.querySelector('main > aside .visual-tools-grid');
  if (!grilla) { if (++n < 60) setTimeout(poner, 250); return; }
  tarj = h('button', 'visual-card'); tarj.type = 'button'; tarj.title = 'Comparar dos mapas con una cortina que se arrastra';
  tarj.innerHTML = '<span class="tool-picture"><svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="64" height="64" rx="12" fill="#edf1e8"/><rect x="8" y="12" width="24" height="40" fill="#8a7a55"/><path d="M8 40l8-10 7 6 9-9" fill="none" stroke="#e8dcc0" stroke-width="2.5"/><rect x="32" y="12" width="24" height="40" fill="#dce9d1"/><path d="M32 40l8-6 8 4 8-8" fill="none" stroke="#9C6B3C" stroke-width="2"/><path d="M32 8v48" stroke="#B79A5B" stroke-width="3"/><circle cx="32" cy="32" r="6" fill="#0B1D33" stroke="#B79A5B" stroke-width="2"/></svg></span><span>Comparar mapas</span>';
  tarj.onclick = () => abrir(!activo);
  const g = grilla.querySelector('.visual-card'); g && /Guardar/.test(g.textContent) ? g.after(tarj) : grilla.prepend(tarj);
})();
window.EMTE_COMPARAR = { abrir, estado: () => ({ activo, fx, der: selDer.value }) };
});
