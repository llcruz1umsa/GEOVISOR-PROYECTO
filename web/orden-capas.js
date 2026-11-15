/* ORDEN DE CAPAS (12-11-2026, BYNS7).
   En la columna de la Simbología aparece el cuadro «ORDEN DE CAPAS» con las capas que están encendidas en el mapa.
   La de ARRIBA de la lista se dibuja ENCIMA de las demás. Se cambia el orden con las flechas ▲ ▼ o arrastrando
   la fila con el mouse o el dedo. «Restablecer» vuelve al orden original. El orden se recuerda en este aparato. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const scene = document.getElementById('scene'), mapa = document.querySelector('.map'); if (!scene || !mapa) return;
const CLAVE = 'emte-orden-capas';
// capas conocidas: clave → [nombre, ids que se mueven juntos]
const CAPAS = [
  ['curvas', 'Curvas de nivel', ['topo-curvas', 'curvas-cartas']],
  ['pendientes', 'Pendientes', ['topo-pendientes', 'pendientes-cartas']],
  ['municipios', 'Municipios (colores)', ['topo-municipios']],
  ['limites', 'Límites legales', ['topo-limites-legales', 'topo-limites-legales-puntos']],
  ['agua', 'Cuerpos de agua', ['water']],
  ['rios', 'Ríos y quebradas', ['rivers']],
  ['vias', 'Vías y caminos', ['roads-casing', 'roads', 'roads-top']],
  ['rutas', 'Rutas nacionales', ['vias-rutas', 'vias-master']],
  ['mancha', 'Mancha urbana', ['mancha-urbana']],
  ['viviendas', 'Viviendas y construcciones', ['topo-viviendas', 'topo-viviendas-hex']],
  ['educacion', 'Centros educativos', ['education']],
  ['salud', 'Establecimientos de salud', ['health']],
  ['cobertura', 'Cobertura de salud', ['topo-cobertura-salud', 'topo-cobertura-avisos']],
  ['cerros', 'Cerros', ['topo-cerros']],
  ['militar', 'Unidades militares', ['topo-fuerzas']],
  ['apoyo', 'Apoyo al planeamiento', ['topo-apoyo']],
  ['tc', 'Terreno clave (TC)', ['tc-capa']],
  ['coc', 'OCOKA / COC', ['coc-calco']],
  ['visible', 'Área visible', ['topo-area-visible']],
  ['po', 'Puntos de observación', ['topo-puntos-obs']],
  ['campo', 'Puntos de campo', ['topo-campo']],
  ['cuadricula', 'Cuadrícula UTM', ['topo-cuadricula']],
  ['cartas', 'Cartas (índice)', ['cc-capa']],
  ['nombres', 'Nombres de municipios', ['topo-municipios-nombres', 'topo-capitales']],
];
const POR_ID = new Map(); CAPAS.forEach(([k, n, ids]) => ids.forEach(id => POR_ID.set(id, k)));
const NOMBRE = Object.fromEntries(CAPAS.map(([k, n]) => [k, n]));
const FIJAS = new Set(['basemap-fondo', 'basemap', 'route', 'measurement', 'topo-pin', 'topo-gps', 'cc-pin', 'cc-indice', 'cc-regiones', 'cc-div', 'cc-dep', 'cc-hi', 'cc-unidades', 'topo-hp', 'topo-perfil', 'bounds']);
let ORDEN = []; try { ORDEN = JSON.parse(localStorage.getItem(CLAVE) || '[]') || []; } catch (_) { ORDEN = []; }   // claves, de arriba (encima) a abajo
const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(ORDEN)); } catch (_) {} };

const claveDe = el => el.id ? (POR_ID.get(el.id) || (FIJAS.has(el.id) ? null : 'id:' + el.id)) : null;
const nombreDe = k => NOMBRE[k] || k.slice(3).replace(/^topo-/, '').replace(/[-_]/g, ' ').replace(/^./, c => c.toUpperCase());
const vivo = el => { if (!el.childElementCount && el.tagName === 'g') return false; const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
// capas presentes en el mapa, en el orden en que se dibujan ahora (de arriba a abajo)
function presentes(soloVisibles) {
  const m = new Map();
  for (const el of scene.children) { const k = claveDe(el); if (!k) continue; if (!m.has(k)) m.set(k, []); m.get(k).push(el); }
  const L = [...m.entries()].map(([k, els]) => ({ k, els, vis: els.some(vivo) }));
  return (soloVisibles ? L.filter(x => x.vis) : L).reverse();
}
let aplicando = false;
function aplicar() {   // pone las capas en el orden guardado, usando los mismos lugares que ocupan
  if (!ORDEN.length) return;
  const L = presentes(false); if (L.length < 2) return;
  const pos = k => { const i = ORDEN.indexOf(k); return i < 0 ? Infinity : i; };
  const actualAbajoArriba = L.slice().reverse();
  // las que no tienen orden guardado se quedan donde están respecto a sus vecinas: orden estable
  const deseado = actualAbajoArriba.map((x, i) => ({ x, i })).sort((a, b) => {
    const pa = pos(a.x.k), pb = pos(b.x.k); if (pa === Infinity || pb === Infinity) return a.i - b.i; return pb - pa; }).map(o => o.x);
  if (deseado.every((x, i) => x === actualAbajoArriba[i])) return;
  aplicando = true;
  try {
    const marcas = actualAbajoArriba.map(x => { const c = document.createComment('oc'); x.els[0].before(c); return c; });
    deseado.forEach((x, i) => marcas[i].after(...x.els));
    marcas.forEach(c => c.remove());
  } finally { setTimeout(() => { aplicando = false; }, 0); }
}

/* ---------- cuadro en la columna de leyendas ---------- */
const css = document.createElement('style');
css.textContent = `
section.oc-panel{background:#fff;border:1px solid #CBD3DF;border-radius:8px;box-shadow:0 6px 18px rgba(11,29,51,.16);font:11.5px/1.35 var(--tipo-texto,system-ui);color:#14233A;overflow:hidden}
section.oc-panel > b.t{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0;padding:7px 11px;background:#0B1D33;color:#fff;border-bottom:2px solid #B79A5B;font:700 10.5px var(--tipo-titulo,system-ui);letter-spacing:.08em;cursor:pointer;user-select:none}
section.oc-panel.lg-pleg > :not(b.t){display:none!important}
.oc-ayuda{margin:6px 11px 4px;font-size:10px;color:#5A6B80}
.oc-lista{list-style:none;margin:0;padding:0 6px 4px;max-height:260px;overflow:auto}
.oc-lista li{display:flex;align-items:center;gap:6px;margin:3px 0;padding:4px 6px;border:1px solid #E3E8F0;border-radius:6px;background:#F8FAFC;touch-action:none;cursor:grab}
.oc-lista li.oc-arr{opacity:.55;border-style:dashed}
.oc-lista li .n{flex:1;font-weight:600;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.oc-lista li .p{flex:none;display:grid;place-items:center;width:18px;height:18px;border-radius:50%;background:#0B1D33;color:#E9BE4A;font:800 9.5px system-ui}
.oc-lista li button{flex:none;width:24px;height:22px;padding:0;border:1px solid #CBD3DF;border-radius:5px;background:#fff;color:#12294A;font:800 11px system-ui;cursor:pointer}
.oc-lista li button:hover:not(:disabled){background:#B79A5B;color:#fff;border-color:#B79A5B}
.oc-lista li button:disabled{opacity:.3;cursor:default}
@media (pointer:coarse){.oc-lista li button{width:32px;height:30px;font-size:14px}.oc-lista li{padding:6px}}
.oc-pie{display:flex;justify-content:space-between;align-items:center;padding:4px 11px 8px;font-size:10px;color:#5A6B80}
.oc-pie button{padding:3px 8px;border:1px solid #CBD3DF;border-radius:5px;background:#fff;color:#12294A;font:700 10px system-ui;cursor:pointer}
.oc-vacio{margin:6px 11px 8px;font-size:10.5px;color:#5A6B80}`;
document.head.append(css);
const sec = document.createElement('section'); sec.className = 'oc-panel lg-item'; sec.setAttribute('aria-label', 'Orden de capas');
sec.innerHTML = `<b class="t">ORDEN DE CAPAS</b><p class="oc-ayuda">Arriba = se dibuja encima. Usa ▲ ▼ o arrastra la fila.</p><ul class="oc-lista"></ul><p class="oc-vacio" hidden>Enciende capas para ordenarlas.</p><div class="oc-pie"><span class="oc-n"></span><button type="button" class="oc-rest">Restablecer</button></div>`;
for (const t of ['pointerdown', 'click', 'wheel', 'dblclick']) sec.addEventListener(t, e => e.stopPropagation());
const lista = sec.querySelector('.oc-lista');
sec.querySelector('b.t').addEventListener('click', () => sec.classList.toggle('lg-pleg'));
let ORIGINAL = null;   // primer orden visto (para «Restablecer»)
sec.querySelector('.oc-rest').onclick = () => {
  ORDEN = []; guardar();
  if (ORIGINAL) { const actual = presentes(false).map(x => x.k); ORDEN = ORIGINAL.filter(k => actual.includes(k)); aplicar(); ORDEN = []; }
  pintar();
};
function mover(k, paso) {
  const vis = presentes(true).map(x => x.k), i = vis.indexOf(k), j = i + paso; if (i < 0 || j < 0 || j >= vis.length) return;
  [vis[i], vis[j]] = [vis[j], vis[i]]; fijarOrden(vis);
}
function fijarOrden(visibles) {   // nuevo orden: las visibles en el orden pedido y las ocultas en su lugar relativo
  const todas = presentes(false).map(x => x.k), resto = ORDEN.filter(k => !visibles.includes(k));
  const nuevo = visibles.slice(); todas.forEach(k => { if (!nuevo.includes(k)) nuevo.push(k); }); resto.forEach(k => { if (!nuevo.includes(k)) nuevo.push(k); });
  ORDEN = nuevo; guardar(); aplicar(); pintar();
}
function pintar() {
  const vis = presentes(true);
  lista.replaceChildren();
  sec.querySelector('.oc-vacio').hidden = vis.length > 0;
  sec.querySelector('.oc-n').textContent = vis.length ? vis.length + ' capa' + (vis.length > 1 ? 's' : '') + ' encendida' + (vis.length > 1 ? 's' : '') : '';
  vis.forEach((x, i) => {
    const li = document.createElement('li'); li.dataset.k = x.k;
    li.innerHTML = `<span class="p">${i + 1}</span><span class="n" title="${nombreDe(x.k)}">${nombreDe(x.k)}</span><button type="button" class="arr" title="Subir (encima)" aria-label="Subir ${nombreDe(x.k)}">▲</button><button type="button" class="aba" title="Bajar (debajo)" aria-label="Bajar ${nombreDe(x.k)}">▼</button>`;
    li.querySelector('.arr').disabled = i === 0; li.querySelector('.aba').disabled = i === vis.length - 1;
    li.querySelector('.arr').onclick = () => mover(x.k, -1); li.querySelector('.aba').onclick = () => mover(x.k, 1);
    lista.append(li);
  });
}
// arrastrar filas
let D = null;
lista.addEventListener('pointerdown', e => {
  const li = e.target.closest('li'); if (!li || e.target.closest('button')) return;
  e.preventDefault(); D = { li, y: e.clientY, mov: false, id: e.pointerId }; li.setPointerCapture(e.pointerId);
});
lista.addEventListener('pointermove', e => {
  if (!D || e.pointerId !== D.id) return;
  if (!D.mov && Math.abs(e.clientY - D.y) < 4) return; D.mov = true; D.li.classList.add('oc-arr');
  const otro = [...lista.children].find(o => { if (o === D.li) return false; const r = o.getBoundingClientRect(); return e.clientY > r.top && e.clientY < r.bottom; });
  if (otro) { const r = otro.getBoundingClientRect(); e.clientY < r.top + r.height / 2 ? otro.before(D.li) : otro.after(D.li); }
});
const soltar = e => { if (!D || (e && e.pointerId !== D.id)) return; const m = D.mov; D.li.classList.remove('oc-arr'); D = null; if (m) fijarOrden([...lista.children].map(li => li.dataset.k)); };
lista.addEventListener('pointerup', soltar); lista.addEventListener('pointercancel', soltar);

// colocar el cuadro en la columna de leyendas (o abajo a la derecha si aún no existe)
function montar() {
  const dock = mapa.querySelector('.lg-dock');
  if (dock) { if (sec.parentElement !== dock) { const sim = dock.querySelector('.sim-card'); sim ? sim.before(sec) : dock.prepend(sec); } }
  else if (!sec.isConnected) { Object.assign(sec.style, { position: 'absolute', right: '16px', bottom: '170px', width: '260px', zIndex: 9 }); mapa.append(sec); }
}
// vigilar: capas que se encienden, apagan o se agregan
let pend = 0;
function revisar() {
  pend = 0; if (!ORIGINAL) { const p = presentes(false); if (p.length) ORIGINAL = p.map(x => x.k); }
  if (!aplicando) aplicar(); montar(); if (!D) pintar();
}
const programar = () => { if (!pend) pend = setTimeout(revisar, 120); };
new MutationObserver(() => { if (!aplicando) programar(); }).observe(scene, { childList: true });
// capas que se encienden o apagan sin agregarse (cambio de visibilidad): revisión liviana cada 1,5 s
let firma = '';
setInterval(() => {
  if (document.hidden || D || document.documentElement.classList.contains('mapa-gesto')) return;
  const f = presentes(true).map(x => x.k).join('|'); if (f !== firma) { firma = f; programar(); }
}, 1500);
document.addEventListener('change', e => { if (e.target.matches && e.target.matches('input[type=checkbox]')) setTimeout(programar, 60); }, true);
setTimeout(revisar, 1500); setTimeout(revisar, 5000);
window.EMTE_ORDEN_CAPAS = { lista: () => presentes(true).map(x => x.k), mover, revisar };
});
