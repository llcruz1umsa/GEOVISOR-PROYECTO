/* Mejoras del 12-11-2026 (BYNS7):
   1) HERRAMIENTA MANO (✋) en el panel de botones del mapa (arriba a la derecha): mientras está activa el mapa
      solo se arrastra; los clics no abren fichas ni dibujan nada. Se apaga con el mismo botón o con Esc.
   2) CUADROS QUE SE ABREN Y CIERRAN: toda ventana o cuadro flotante (escala, vista general, simbología, fichas,
      tablas…) muestra un botón pequeño «−» en su esquina; al pulsarlo queda como un cuadro pequeño (solo su título)
      y con «+» vuelve a abrirse. Se recuerda en esta computadora / tablet.
   3) En las tablas, «Longitud» (largo de una vía, río, ruta…) se muestra como «Distancia».
      Las coordenadas (Latitud / Longitud) no se tocan. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const mapa = document.querySelector('.map'), svg = mapa && mapa.querySelector('svg');
const css = document.createElement('style');
css.textContent = `
.tools .mano-btn{font-size:17px;line-height:1}
.tools .mano-btn.activo{background:#B79A5B!important;color:#0B1D33!important;box-shadow:0 0 0 2px #E9BE4A inset}
.map.modo-mano, .map.modo-mano svg, .map.modo-mano #scene *{cursor:grab!important}
.map.modo-mano.agarrando, .map.modo-mano.agarrando *{cursor:grabbing!important}
.map.modo-mano > svg ~ svg{pointer-events:none!important}
.mano-aviso{position:absolute;left:50%;top:12px;transform:translateX(-50%);z-index:30;padding:6px 14px;border-radius:16px;background:#0B1D33e6;border:1px solid #B79A5B;color:#F6E3A6;font:700 11px var(--tipo-titulo,system-ui);letter-spacing:.06em;pointer-events:none}
.mano-aviso[hidden]{display:none}
#ap-min{position:fixed;z-index:9999;width:24px;height:24px;margin:0;padding:0;border-radius:50%;border:1.5px solid #E9BE4A;background:#0B1D33;color:#F6E3A6;
  font:800 16px/1 system-ui;display:grid;place-items:center;cursor:pointer;box-shadow:0 2px 8px #0007;opacity:0;pointer-events:none;transition:opacity .15s}
#ap-min.ver{opacity:.95;pointer-events:auto}#ap-min:hover{background:#B79A5B;color:#0B1D33}
@media (pointer:coarse){#ap-min{width:34px;height:34px;font-size:20px}}
.ap-min{max-height:36px!important;min-height:0!important;overflow:hidden!important;resize:none!important}
.ap-min::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:linear-gradient(90deg,#B79A5B,#E9BE4A)}`;
document.head.append(css);

/* ---------- 1) mano ---------- */
const tools = document.querySelector('.tools');
if (mapa && svg && tools) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'mano-btn';
  b.title = 'Mano: solo mover el mapa (Esc para salir)'; b.setAttribute('aria-label', 'Herramienta mano: mover el mapa'); b.setAttribute('aria-pressed', 'false');
  b.textContent = '✋';
  const ref = tools.querySelector('.gps-btn'); ref ? tools.insertBefore(b, ref) : tools.append(b);
  const aviso = document.createElement('div'); aviso.className = 'mano-aviso'; aviso.hidden = true; aviso.textContent = '✋ MANO ACTIVA · ARRASTRA PARA MOVER EL MAPA · ESC PARA SALIR'; mapa.append(aviso);
  let on = false, tAviso = 0;
  const poner = v => {
    on = v; mapa.classList.toggle('modo-mano', on); b.classList.toggle('activo', on); b.setAttribute('aria-pressed', String(on));
    aviso.hidden = !on; clearTimeout(tAviso); if (on) tAviso = setTimeout(() => aviso.hidden = true, 3500);
  };
  b.addEventListener('click', e => { e.stopPropagation(); poner(!on); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && on) poner(false); });
  // en modo mano los clics sobre el mapa no hacen nada más (no abren fichas, no miden, no dibujan)
  const bloquear = e => { if (on && e.target.closest && e.target.closest('svg') && !e.target.closest('.tools')) { e.stopImmediatePropagation(); e.preventDefault(); } };
  ['click', 'dblclick', 'contextmenu'].forEach(t => mapa.addEventListener(t, bloquear, true));
  mapa.addEventListener('pointerdown', e => { if (on) mapa.classList.add('agarrando'); }, true);
  addEventListener('pointerup', () => mapa.classList.remove('agarrando'), true);
  window.EMTE_MANO = { activar: () => poner(true), desactivar: () => poner(false), activa: () => on };
}

/* ---------- 2) cuadros que se abren y cierran ---------- */
const CLAVE = 'emte-cuadros-min';
let MIN = {}; try { MIN = JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}; } catch (_) { MIN = {}; }
const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(MIN)); } catch (_) {} };
const ventanaDe = el => (window.EMTE_VENTANA_DE ? window.EMTE_VENTANA_DE(el) : null);
const claveDe = el => (window.EMTE_CLAVE_VENTANA ? window.EMTE_CLAVE_VENTANA(el) : null);
const btn = document.createElement('button'); btn.id = 'ap-min'; btn.type = 'button'; document.body.append(btn);
let actual = null, tOcultar = 0;
const sirve = w => {
  if (!w || !w.isConnected || w.id === 'ap-min' || w.closest('.gm-marco, .tools, header')) return false;
  if (w.classList.contains('ap-min')) return true;
  const r = w.getBoundingClientRect(); return r.width >= 120 && r.height >= 70;
};
function colocar(w) {
  const r = w.getBoundingClientRect(), t = btn.offsetWidth || 24;
  btn.style.left = Math.min(innerWidth - t - 2, Math.max(2, r.right - t * .7)) + 'px';
  btn.style.top = Math.min(innerHeight - t - 2, Math.max(2, r.top - t * .3)) + 'px';
  const min = w.classList.contains('ap-min'); btn.textContent = min ? '+' : '−';
  btn.title = min ? 'Abrir el cuadro' : 'Cerrar a un cuadro pequeño'; btn.setAttribute('aria-label', btn.title);
}
function mostrar(w, ms) { actual = w; colocar(w); btn.classList.add('ver'); clearTimeout(tOcultar); if (ms) tOcultar = setTimeout(ocultar, ms); }
function ocultar() { btn.classList.remove('ver'); actual = null; }
function alternar(w) {
  const min = !w.classList.contains('ap-min'); w.classList.toggle('ap-min', min);
  const k = claveDe(w); if (k) { if (min) MIN[k] = 1; else delete MIN[k]; guardar(); }
  requestAnimationFrame(() => { if (w.isConnected) colocar(w); });
}
btn.addEventListener('pointerdown', e => e.stopPropagation(), true);
btn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); if (actual) alternar(actual); mostrar(actual, matchMedia('(pointer:coarse)').matches ? 3500 : 0); });
btn.addEventListener('pointerleave', () => { clearTimeout(tOcultar); tOcultar = setTimeout(ocultar, 900); });
btn.addEventListener('pointerenter', () => clearTimeout(tOcultar));
document.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse' || document.body.classList.contains('ap-moviendo') || e.target === btn) return;
  const w = ventanaDe(e.target);
  if (w && sirve(w)) { if (w !== actual || !btn.classList.contains('ver')) mostrar(w); clearTimeout(tOcultar); }
  else if (actual && !actual.contains(e.target)) { clearTimeout(tOcultar); tOcultar = setTimeout(ocultar, 900); }
}, { passive: true });
document.addEventListener('pointerdown', e => {   // en la tablet: tocar un cuadro muestra su botón unos segundos
  if (e.pointerType === 'mouse' || e.target === btn) return;
  const w = ventanaDe(e.target); if (w && sirve(w)) mostrar(w, 3500);
}, { passive: true, capture: true });
document.addEventListener('pointerup', () => { if (actual && actual.isConnected && btn.classList.contains('ver')) colocar(actual); }, true);
addEventListener('resize', () => { if (actual && actual.isConnected) colocar(actual); });
// los cuadros que se cerraron a pequeño vuelven así al reaparecer
let pend = false;
function reponer() {
  pend = false;
  for (const k in MIN) { let els; try { els = document.querySelectorAll(k); } catch (_) { continue; } els.forEach(el => el.classList.add('ap-min')); }
  if (actual && !actual.isConnected) ocultar();
}

/* ---------- 3) Longitud → Distancia en las tablas ---------- */
const RE = /\bLongitud\b|\bLONGITUD\b|\blongitud\b/;
function distancia(raiz) {
  const tablas = raiz.nodeType === 1 ? [...(raiz.matches('table') ? [raiz] : []), ...raiz.querySelectorAll('table')] : [];
  const t0 = raiz.nodeType === 1 && raiz.closest && raiz.closest('table'); if (t0) tablas.push(t0);
  for (const t of tablas) {
    if (/latitud/i.test(t.textContent)) continue;                       // tabla de coordenadas: no se toca
    const tw = document.createTreeWalker(t, NodeFilter.SHOW_TEXT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) if (RE.test(n.nodeValue))
      n.nodeValue = n.nodeValue.replace(/\bLONGITUD\b/g, 'DISTANCIA').replace(/\bLongitud\b/g, 'Distancia').replace(/\blongitud\b/g, 'distancia');
  }
}
let cola = new Set();
new MutationObserver(rs => {
  for (const r of rs) { if (r.type === 'childList') r.addedNodes.forEach(n => cola.add(n.nodeType === 3 ? n.parentElement : n)); else if (r.target) cola.add(r.target.parentElement || r.target); }
  if (!pend) { pend = true; requestAnimationFrame(() => { const c = cola; cola = new Set(); c.forEach(n => { if (n && n.isConnected && !(n.closest && n.closest('svg'))) distancia(n); }); reponer(); }); }
}).observe(document.body, { childList: true, subtree: true, characterData: true });
setTimeout(() => { distancia(document.body); reponer(); }, 1200);
});
