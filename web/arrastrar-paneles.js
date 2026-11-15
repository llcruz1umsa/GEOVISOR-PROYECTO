/* Tablas y ventanas que se arrastran como imágenes (BYNS7; 02-11-2026, generalizado el 04-11-2026).
   TODAS las tablas, fichas, leyendas y ventanas flotantes del geovisor se mueven con el mouse o el dedo:
   se detectan solas (cualquier recuadro con posición absoluta o fija, también las ventanas que se abren
   centradas sobre un fondo oscuro), así que las que se agreguen en el futuro también se mueven.
   · Se toman de cualquier parte que no sea un botón, casilla, campo, regulador o enlace (hay que mover 5 px:
     un clic normal sigue funcionando).
   · Nunca salen de la pantalla y recuerdan su lugar aunque se cierren o se recargue la página.
   · Doble clic en una parte libre de la ventana la devuelve a su lugar original.
   No se mueven: el mapa, la cabecera, el panel izquierdo, los botones de zoom y la rosa de los vientos. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const CONTROLES = 'input, select, textarea, button, a, label, summary, option, [contenteditable], [role=slider], [role=button], .gm-h, canvas';
const NO = 'html, body, header, nav, main, main > aside, .map, #scene, svg, .tools, .map-compass, .lg-dock-no';
const CLAVE = 'emte-arrastre';
let POS = {}; try { POS = JSON.parse(localStorage.getItem(CLAVE) || '{}') || {}; } catch (_) { POS = {}; }
// lo que se haya movido del encabezado vuelve a su lugar y no se recuerda
for (const k of Object.keys(POS)) if (/header|institution|session|logo|brand|titulo/i.test(k)) delete POS[k];
const fijarEncabezado = () => document.querySelectorAll('header, header *, .institution-tabs, .institution-tabs *, .session-actions, .session-actions *').forEach(el => { if (el.style && el.style.translate) el.style.translate = ''; el.classList && el.classList.remove('ap-movil'); });
fijarEncabezado(); setTimeout(fijarEncabezado, 1500); setTimeout(fijarEncabezado, 5000);
const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(POS)); } catch (_) {} };
guardar();

const css = document.createElement('style');
css.textContent = `body.ap-moviendo, body.ap-moviendo *{user-select:none !important;cursor:grabbing !important}
.ap-movil{cursor:grab}
.ap-movil :is(input, select, textarea, button, a, label, summary){cursor:auto}
.ap-movil :is(button, a, label, summary){cursor:pointer}
.ap-arrastrando{transition:none !important;box-shadow:0 18px 40px rgba(11,29,51,.35) !important;z-index:60 !important}`;
document.head.append(css);

const grande = r => r.width >= innerWidth * .9 && r.height >= innerHeight * .85;
const estado = /^(ap-|on$|open$|activo|chosen|hidden|lg-pleg|falta|hecho)/;
function clave(el) {   // nombre estable de la ventana para recordar su lugar
  if (el.id) return '#' + el.id;
  const cs = [...el.classList].filter(c => !estado.test(c)).slice(0, 3);
  return cs.length ? el.tagName.toLowerCase() + '.' + cs.join('.') : null;
}
// la ventana que se mueve: el primer recuadro flotante (absolute / fixed) por encima del elemento tocado
function ventana(t) {
  if (t && t.closest && t.closest('header, .institution-tabs, .session-actions')) return null;   // 06-11-2026: el encabezado nunca se mueve
  for (let el = t; el && el.nodeType === 1; el = el.parentElement) {
    if (el.matches(NO) || el.closest('svg')) return null;
    if (el.parentElement && el.parentElement.classList.contains('lg-dock')) return el.parentElement;   // columna de leyendas: se mueve entera
    const pos = getComputedStyle(el).position, r = el.getBoundingClientRect();
    if (r.width < 30 || r.height < 20) continue;
    if ((pos === 'absolute' || pos === 'fixed') && !grande(r)) return el;
    // ventana centrada sobre un fondo que cubre toda la pantalla (resúmenes, fichas, diálogos)
    const p = el.parentElement;
    if (p && p !== document.body && getComputedStyle(p).position === 'fixed' && grande(p.getBoundingClientRect()) && !grande(r)) return el;
  }
  return null;
}
const leer = el => { const t = (el.style.translate || '').match(/(-?[\d.]+)px\s+(-?[\d.]+)px/); return t ? [+t[1], +t[2]] : [0, 0]; };
function poner(el, x, y, base) {   // aplica el desplazamiento sin salir de la pantalla
  // 12-11-2026: «base» = medidas tomadas al empezar el arrastre (sin volver a medir en cada movimiento: mucho más fluido)
  let r = base; if (!r) { el.style.translate = '0px 0px'; r = el.getBoundingClientRect(); }
  x = Math.min(Math.max(x, 40 - r.right), innerWidth - 40 - r.left);
  y = Math.min(Math.max(y, -r.top), innerHeight - 30 - r.top);
  el.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
  return [x, y];
}
// en la tablet: si el dedo toca una lista o tabla que se desplaza (y no la parte de arriba de la ventana), se deja desplazar
function desplazable(t, p) {
  for (let el = t; el && el !== p.parentElement; el = el.parentElement) {
    if (el.scrollHeight > el.clientHeight + 4 || el.scrollWidth > el.clientWidth + 4) { const o = getComputedStyle(el); if (/(auto|scroll)/.test(o.overflowY + o.overflowX)) return true; }
  }
  return false;
}
let A = null, evitarClic = false;
document.addEventListener('pointerdown', e => {
  if (e.button !== 0 || e.target.closest?.(CONTROLES)) return;
  const p = ventana(e.target); if (!p) return;
  const r = p.getBoundingClientRect();
  if (p.scrollHeight > p.clientHeight + 2 && e.clientX > r.left + p.clientLeft + p.clientWidth) return;   // barra de desplazamiento
  const tactil = e.pointerType === 'touch' || e.pointerType === 'pen';
  if (tactil && e.clientY - r.top > 46 && desplazable(e.target, p)) return;                               // deja desplazar la tabla con el dedo
  const [x0, y0] = leer(p);
  const base = { left: r.left - x0, right: r.right - x0, top: r.top - y0, bottom: r.bottom - y0 };     // medidas sin desplazamiento
  A = { p, x: e.clientX, y: e.clientY, x0, y0, mov: false, id: e.pointerId, base, tactil, raf: 0, nx: x0, ny: y0 };
  e.stopPropagation();   // el mapa no se desplaza debajo de la ventana
}, true);
document.addEventListener('pointermove', e => {
  if (!A || e.pointerId !== A.id) return;
  const dx = e.clientX - A.x, dy = e.clientY - A.y;
  if (!A.mov) {
    if (Math.hypot(dx, dy) < (A.tactil ? 4 : 5)) return;
    A.mov = true; A.p.classList.add('ap-arrastrando'); document.body.classList.add('ap-moviendo');
    try { window.getSelection()?.removeAllRanges(); } catch (_) {}
  }
  e.stopPropagation(); e.preventDefault();
  A.nx = A.x0 + dx; A.ny = A.y0 + dy;
  if (!A.raf) A.raf = requestAnimationFrame(() => { if (!A) return; A.raf = 0; A.ult = poner(A.p, A.nx, A.ny, A.base); });   // un cambio por cuadro
}, true);
// 12-11-2026: con el dedo, el navegador ya no «roba» el gesto para desplazar la página (era lo que trababa las ventanas)
document.addEventListener('touchmove', e => { if (A) e.preventDefault(); }, { passive: false, capture: true });
function soltar(e) {
  if (!A || (e && e.pointerId !== A.id)) return;
  if (A.raf) { cancelAnimationFrame(A.raf); A.raf = 0; if (A.mov) A.ult = poner(A.p, A.nx, A.ny, A.base); }
  if (A.mov) {
    evitarClic = true; setTimeout(() => evitarClic = false, 0);
    document.body.classList.remove('ap-moviendo'); A.p.classList.remove('ap-arrastrando');
    const k = clave(A.p); if (k && A.ult) { POS[k] = A.ult.map(Math.round); guardar(); }
  }
  A = null;
}
document.addEventListener('pointerup', soltar, true);
document.addEventListener('pointercancel', soltar, true);
document.addEventListener('click', e => { if (evitarClic) { e.stopPropagation(); e.preventDefault(); evitarClic = false; } }, true);
// 11-11-2026: el doble clic ahora AGRANDA o ACHICA el cuadro (cuadros-zoom.js); Mayús + doble clic lo devuelve a su lugar
window.EMTE_CLAVE_VENTANA = el => { try { return clave(el); } catch (_) { return null; } };
window.EMTE_VENTANA_DE = el => { try { return ventana(el); } catch (_) { return null; } };
document.addEventListener('dblclick', e => {
  if (!e.shiftKey || e.target.closest?.(CONTROLES)) return;
  const p = ventana(e.target); if (!p || !p.style.translate) return;
  p.style.translate = ''; const k = clave(p); if (k) { delete POS[k]; guardar(); }
  e.stopPropagation(); e.preventDefault();
}, true);
// la mano «agarrar» sobre cualquier ventana que se pueda mover
document.addEventListener('pointerover', e => { if (A) return; const p = !e.target.closest?.(CONTROLES) && ventana(e.target); if (p && !p.classList.contains('ap-movil')) p.classList.add('ap-movil'); }, { passive: true });
// las ventanas que vuelven a abrirse (o se crean de nuevo) recuperan su lugar
let pend = false;
function reponer() {
  pend = false;
  for (const k in POS) {
    let els; try { els = document.querySelectorAll(k); } catch (_) { continue; }
    els.forEach(el => { if (!el.style.translate && el.getClientRects().length) poner(el, POS[k][0], POS[k][1]); });
  }
}
new MutationObserver(() => { if (!pend) { pend = true; requestAnimationFrame(reponer); } })
  .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'style'] });
// si la ventana del navegador se achica, ninguna queda fuera
window.addEventListener('resize', () => document.querySelectorAll('[style*="translate"]').forEach(el => { const [x, y] = leer(el); if (x || y) poner(el, x, y); }));
setTimeout(reponer, 1500);
});
