// Tareas tácticas (Llavero táctico) dentro del calco de PLANEAMIENTO (agregado por BYNS7).
// Las 29 tareas están en el catálogo del calco (planeamiento/simbolos.json, claves tt_*): se arrastran
// y colocan como cualquier símbolo. Al tocar una tarea colocada aparece su carta del llavero, que se da
// la vuelta para mostrar Propósito, Efecto y Condiciones de ejecución. Tocar la carta la voltea otra vez.
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const map = document.querySelector('.map');
if (!map) return;
const COLOR = { amigas: '#45999f', terreno: '#ffff00', enemigo: '#ff1f1f' };
const GRUPO = { amigas: 'Acciones ejecutadas por las fuerzas amigas', terreno: 'Efectos sobre el terreno', enemigo: 'Efectos sobre el enemigo' };
let T = new Map();

const css = document.createElement('style');
css.textContent = `
.tt-zona{position:absolute;right:16px;top:132px;z-index:11;width:280px;height:410px;max-height:calc(100% - 190px);perspective:1100px}
.tt-zona[hidden]{display:none}
.tt-carta{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .65s cubic-bezier(.3,.7,.25,1);cursor:pointer}
.tt-carta.vuelta{transform:rotateY(180deg)}
.tt-cara{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;background:#fff;border:5px solid #111;border-radius:10px;box-shadow:0 14px 34px #0006;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#111}
.tt-dorso{transform:rotateY(180deg);display:flex;flex-direction:column}
.tt-num{position:absolute;top:-2px;right:-2px;width:46px;height:40px;border:4px solid #111;border-radius:50%;background:#fff;display:grid;place-items:center;font:900 19px Arial;z-index:1}
.tt-tit{margin:24px 50px 0 14px;text-align:center;font:800 17px Arial;text-decoration:underline;text-underline-offset:3px;line-height:1.15;min-height:42px;display:flex;align-items:center;justify-content:center}
.tt-panel{position:absolute;left:12px;right:12px;bottom:12px;top:88px;border:2px solid #111;display:grid;place-items:center}
.tt-panel svg{width:88%;height:88%;color:#111;overflow:visible}
.tt-pie{position:absolute;left:0;right:0;bottom:-26px;text-align:center;font:600 10px system-ui;color:#fff;text-shadow:0 1px 3px #000}
.tt-dorso .cuerpo{padding:12px 14px 14px;overflow:auto;font:11.5px/1.35 Arial;flex:1}
.tt-dorso h4{margin:0 0 4px;text-align:center;font:800 13px Arial;text-decoration:underline;text-underline-offset:2px}
.tt-dorso h5{margin:9px 0 3px;text-align:center;font:700 11.5px Arial;text-decoration:underline;text-underline-offset:2px}
.tt-dorso p{margin:0;text-align:justify;color:#111}
.tt-dorso ul{margin:0;padding:0;list-style:none}
.tt-dorso li{position:relative;padding-left:15px;margin:2px 0;text-align:left}
.tt-dorso li::before{content:'';position:absolute;left:1px;top:3px;width:8px;height:8px;border:1.5px solid #111}
.tt-dorso .cat{flex:none;padding:5px 10px;font:700 10px system-ui;letter-spacing:.4px;text-align:center;border-bottom:2px solid #111}
.tt-ctl{position:absolute;top:-38px;right:0;display:flex;gap:6px}
.tt-ctl button{border:1px solid #b28405;background:#070774;color:#fff;border-radius:16px;padding:5px 11px;font:600 11px system-ui;cursor:pointer;box-shadow:0 2px 8px #0004}
.tt-ctl button:hover{background:#12129a}
@media(max-width:750px){.tt-zona{right:50%;transform:translateX(50%);top:auto;bottom:150px;width:230px;height:318px}}`;
document.head.append(css);

const zona = document.createElement('section'); zona.className = 'tt-zona'; zona.hidden = true; zona.setAttribute('aria-label', 'Carta de la tarea táctica');
zona.innerHTML = `<div class="tt-ctl"><button type="button" id="tt-voltear">⟲ Voltear</button><button type="button" id="tt-cerrar" aria-label="Cerrar carta">✕</button></div>
<div class="tt-carta" id="tt-carta" role="button" tabindex="0" aria-label="Voltear la carta">
 <div class="tt-cara tt-frente"><div class="tt-num" id="tt-num"></div><div class="tt-tit" id="tt-tit"></div><div class="tt-panel" id="tt-panel"></div></div>
 <div class="tt-cara tt-dorso"><div class="cat" id="tt-cat"></div><div class="cuerpo" id="tt-dorso"></div></div>
</div><div class="tt-pie">Toca la carta para darle la vuelta</div>`;
map.append(zona);
for (const t of ['pointerdown', 'click', 'dblclick', 'wheel']) zona.addEventListener(t, e => e.stopPropagation());
const $ = id => document.getElementById(id), carta = $('tt-carta');
const voltear = () => carta.classList.toggle('vuelta');
carta.addEventListener('click', voltear);
carta.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); voltear(); } });
$('tt-voltear').onclick = voltear;
let cerradaPara = null;
$('tt-cerrar').onclick = () => { zona.hidden = true; cerradaPara = actual; };

function lista(titulo, items) {
  const f = document.createDocumentFragment(); if (!items || !items.length) return f;
  const h = document.createElement('h5'); h.textContent = titulo; const ul = document.createElement('ul');
  items.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.append(li); });
  f.append(h, ul); return f;
}
let actual = null, tFlip = 0;
function mostrar(n) {
  const t = T.get(n); if (!t) { ocultar(); return; }
  if (actual === n && !zona.hidden) return;
  if (cerradaPara === n) return;
  actual = n; cerradaPara = null;
  $('tt-num').textContent = t.n; $('tt-tit').textContent = t.nombre.toUpperCase();
  const pnl = $('tt-panel'); pnl.style.background = COLOR[t.color]; pnl.innerHTML = `<svg viewBox="0 0 200 200" aria-hidden="true">${t.svg}</svg>`;
  $('tt-cat').textContent = 'TAREA TÁCTICA ' + t.n + ' · ' + GRUPO[t.cat].toUpperCase(); $('tt-cat').style.background = COLOR[t.cat];
  $('tt-cat').style.color = t.cat === 'terreno' ? '#111' : '#fff';
  const d = $('tt-dorso'); d.replaceChildren();
  const h = document.createElement('h4'); h.textContent = t.nombre.toUpperCase(); d.append(h);
  const hp = document.createElement('h5'); hp.textContent = 'PROPÓSITO'; const p = document.createElement('p'); p.textContent = t.prop; d.append(hp, p);
  d.append(lista('EFECTO', t.efecto), lista('CONDICIONES DE EJECUCIÓN', t.cond));
  carta.classList.remove('vuelta'); zona.hidden = false; d.scrollTop = 0;
  clearTimeout(tFlip); tFlip = setTimeout(() => carta.classList.add('vuelta'), 700);
}
function ocultar() { actual = null; zona.hidden = true; clearTimeout(tFlip); }

/* ---------- conexión con el calco: detectar la figura seleccionada ---------- */
function revisar() {
  const ed = document.querySelector('.calco-edit'), nom = document.getElementById('ce-nom');
  if (!ed || !nom || ed.hidden) { cerradaPara = null; ocultar(); return; }
  const m = nom.textContent.match(/^TT (\d+) ·/);
  const ref = document.getElementById('ce-ref'); if (ref) ref.hidden = !!m;
  if (m) mostrar(+m[1]); else { cerradaPara = null; ocultar(); }
}
const obs = new MutationObserver(revisar);
function enganchar() {
  const ed = document.querySelector('.calco-edit'), nom = document.getElementById('ce-nom');
  if (!ed || !nom) return false;
  obs.observe(ed, { attributes: true, attributeFilter: ['hidden'] });
  obs.observe(nom, { childList: true, characterData: true, subtree: true });
  return true;
}
// Las referencias al reglamento no aplican al llavero: se quitan de sus grupos del catálogo.
function limpiarCatalogo() {
  document.querySelectorAll('#calco-cat details > summary').forEach(s => {
    if (/^Tareas tácticas/.test(s.textContent)) {
      s.querySelector('.calco-pag')?.remove(); s.parentElement.classList.add('tt-grupo');
    }
  });
  // color de cada tarea según su grupo del llavero (amigas, terreno, enemigo), tomado de la propia tarea:
  // así no lo cambia el grupo general «Tareas tácticas» del catálogo en cascada (02-11-2026)
  const porClave = new Map([...T.values()].map(t => [t.key, t]));
  document.querySelectorAll('#calco-cat .calco-it[data-key^="tt_"]').forEach(b => {
    const t = porClave.get(b.dataset.key), c = t ? (COLOR[t.cat] ? t.cat : COLOR[t.color] ? t.color : 'amigas') : null; if (!c) return;
    const g = b.querySelector('svg'); if (g && g.style.background !== COLOR[c]) { g.style.setProperty('background', COLOR[c], 'important'); g.style.color = '#111'; }
  });
}
const cat = document.getElementById('calco-cat');
if (cat) new MutationObserver(limpiarCatalogo).observe(cat, { childList: true, subtree: true });

fetch('planeamiento/tareas_tacticas.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => {
  d.tareas.forEach(t => T.set(t.n, t));
  if (!enganchar()) { let n = 0; const iv = setInterval(() => { if (enganchar() || ++n > 40) clearInterval(iv); }, 250); }
  limpiarCatalogo(); revisar();
}).catch(() => {});
});
