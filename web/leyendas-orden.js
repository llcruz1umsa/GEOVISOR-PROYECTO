/* Leyendas ordenadas (agregado por BYNS7).
   Todas las leyendas y la simbología del mapa se apilan en una sola columna a la derecha, entre los controles
   y la «Vista general», con un mismo formato: encabezado azul marino con filete dorado, cuerpo blanco y
   posibilidad de plegarlas tocando el encabezado. Así ya no se tapan entre sí. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const mapa = document.querySelector('.map'); if (!mapa) return;
const SEL = ['.sim-card', 'section.pc-ley', 'section.coc-ley', 'section.lg-item', 'section.at-leyenda'];

const css = document.createElement('style');
css.textContent = `
.lg-dock{position:absolute;right:16px;z-index:9;width:282px;max-width:calc(100% - 32px);display:flex;flex-direction:column;justify-content:flex-start;gap:8px;overflow-y:auto;overflow-x:hidden;pointer-events:none;scrollbar-width:thin}
.lg-dock > *{pointer-events:auto;position:static!important;inset:auto!important;transform:none!important;width:auto!important;min-width:0!important;max-width:none!important;margin:0!important;flex:none}
.lg-dock > :first-child{margin-top:auto!important}
.lg-dock > section[hidden],.lg-dock > .sim-card[hidden]{display:none!important}
.lg-dock > section{background:#fff!important;border:1px solid #CBD3DF!important;border-radius:8px!important;box-shadow:0 6px 18px rgba(11,29,51,.16)!important;font:11.5px/1.35 var(--tipo-texto,system-ui)!important;color:#14233A!important;overflow:hidden;max-height:46vh;overflow-y:auto}
.lg-dock > section > b.t,.lg-dock > .sim-card::before{position:sticky;top:0;z-index:1;display:flex!important;align-items:center;justify-content:space-between;gap:8px;margin:0!important;padding:7px 11px!important;background:#0B1D33!important;color:#fff!important;font:700 10.5px var(--tipo-titulo,system-ui)!important;letter-spacing:.09em!important;text-transform:uppercase!important;border-radius:0!important;border-bottom:2px solid #B79A5B!important;cursor:pointer;user-select:none}
.lg-dock > section > b.t::after{content:'▾';font-size:11px;opacity:.85}
.lg-dock > section.lg-pleg > b.t::after{content:'▸'}
.lg-dock > section.lg-pleg > :not(b.t){display:none!important}
.lg-dock > .sim-card::before{content:'Simbología del mapa';cursor:default}
.lg-dock > .sim-card{padding:0!important}
.lg-dock > .sim-card > h5{margin:8px 11px 3px!important;padding-bottom:2px;border-bottom:1px solid #E3E8F0;font:700 10px var(--tipo-titulo,system-ui)!important;letter-spacing:.07em;color:#0B1D33!important;text-transform:uppercase!important}
.lg-dock > .sim-card > :not(h5){margin-left:11px!important;margin-right:11px!important}
.lg-dock > .sim-card > :last-child{margin-bottom:9px!important}
.lg-dock > section > div{padding-left:11px!important;padding-right:11px!important}
.lg-dock > section > div:last-child,.lg-dock > section > small:last-child{padding-bottom:8px!important}
.lg-dock > section i{border-radius:2px}
.lg-dock > .sim-btn{align-self:flex-end;background:#0B1D33!important;color:#fff!important;border:1px solid #B79A5B!important;border-radius:6px!important;padding:7px 12px!important;font:700 10.5px var(--tipo-titulo,system-ui)!important;letter-spacing:.08em!important;box-shadow:0 4px 12px rgba(11,29,51,.25)!important;cursor:pointer}
.lg-dock > .sim-btn[aria-expanded="true"]{background:#B79A5B!important;color:#0B1D33!important}
@media(max-width:750px){.lg-dock{width:min(240px,62vw);right:8px}.lg-dock > section{max-height:34vh;font-size:10.5px!important}}`;
document.head.append(css);

const dock = document.createElement('div'); dock.className = 'lg-dock'; dock.setAttribute('aria-label', 'Leyendas del mapa');
mapa.append(dock);
for (const t of ['pointerdown', 'click', 'dblclick', 'wheel', 'touchstart']) dock.addEventListener(t, e => e.stopPropagation(), { passive: true });
// plegar / desplegar tocando el encabezado (las leyendas se redibujan: se delega en la columna)
dock.addEventListener('click', e => { const t = e.target.closest('b.t'); if (t && t.parentElement && t.parentElement.parentElement === dock) t.parentElement.classList.toggle('lg-pleg'); }, true);   // captura: algunas leyendas detienen el clic

function recoger() {
  SEL.forEach(s => mapa.querySelectorAll(':scope > ' + s).forEach(el => { if (el.parentElement !== dock) dock.insertBefore(el, dock.querySelector('.sim-btn')); }));
  const btn = mapa.querySelector(':scope > .sim-btn'); if (btn) dock.append(btn);
}
function ubicar() {
  const r = mapa.getBoundingClientRect(); if (!r.height) return;
  let arriba = 12;
  ['.tools', '.map-compass'].forEach(s => { const e = mapa.querySelector(s); if (e && e.offsetParent) { const b = e.getBoundingClientRect(); if (b.right > r.right - 340) arriba = Math.max(arriba, b.bottom - r.top + 12); } });
  let abajo = 16;
  const ov = mapa.querySelector('.overview');
  if (ov && ov.offsetParent && getComputedStyle(ov).display !== 'none') { const b = ov.getBoundingClientRect(); abajo = Math.max(abajo, r.bottom - b.top + 10); }
  const cr = mapa.querySelector('.basemap-credit'); if (cr && cr.offsetParent) { const b = cr.getBoundingClientRect(); if (b.left > r.right - 340) abajo = Math.max(abajo, r.bottom - b.top + 6); }
  dock.style.top = arriba + 'px'; dock.style.bottom = abajo + 'px';
}
recoger(); ubicar();
new MutationObserver(() => { recoger(); }).observe(mapa, { childList: true });
window.addEventListener('resize', ubicar);
let n = 0; const iv = setInterval(() => { recoger(); ubicar(); if (++n > 40) clearInterval(iv); }, 500);
setInterval(ubicar, 3000);
});
