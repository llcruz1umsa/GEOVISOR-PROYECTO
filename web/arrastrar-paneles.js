/* Tablas y cuadros que se arrastran (agregado por BYNS7, 02-11-2026).
   Cualquier tabla o cuadro flotante del mapa (fichas, área visible, perfil, guardar, simbología y leyendas,
   escala, análisis…) se puede mover con el mouse o el dedo, como una imagen: se toma de cualquier parte que
   no sea un botón, casilla o campo de texto. Un clic normal sigue funcionando (hace falta mover 5 px). */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const mapa = document.querySelector('.map'); if (!mapa) return;
const PANELES = '.map > .popup, .map > .tt-zona, .map > .rp-panel, .map > .cp-panel, .map > .ca-info, .map > .lg-dock > section, .map > .gm-panel, .map > .map-scale, .map > .legend, .map > .route-panel, .map > .sim-card, .map > .cc-mapa, .map > .cm-panel';
const CONTROLES = 'input, select, textarea, button, a, label, summary, [contenteditable], [role=slider], .gm-h';
const css = document.createElement('style');
css.textContent = `body.ap-moviendo, body.ap-moviendo *{user-select:none !important;cursor:grabbing !important}
.ap-movido{transition:none !important}`;
document.head.append(css);

let A = null, evitarClic = false;
document.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  const p = e.target.closest?.(PANELES); if (!p || e.target.closest(CONTROLES)) return;
  // barra de desplazamiento interna: no se arrastra
  const r0 = p.getBoundingClientRect();
  if (p.scrollHeight > p.clientHeight + 2 && e.clientX > r0.left + p.clientLeft + p.clientWidth) return;
  A = { p, x: e.clientX, y: e.clientY, mov: false, id: e.pointerId };
  e.stopPropagation();   // el mapa no se desplaza debajo de la tabla
}, true);
document.addEventListener('pointermove', e => {
  if (!A || e.pointerId !== A.id) return;
  const dx = e.clientX - A.x, dy = e.clientY - A.y;
  if (!A.mov) {
    if (Math.hypot(dx, dy) < 5) return;
    // se fija la posición actual en píxeles (quita centrados con transform, bottom o right)
    const p = A.p, rm = mapa.getBoundingClientRect(), r = p.getBoundingClientRect();
    if (getComputedStyle(p).position === 'static') { p.style.width = r.width + 'px'; p.style.position = 'absolute'; }   // cuadros dentro del panel de leyendas
    const rb = (p.offsetParent || mapa).getBoundingClientRect();
    A.bx = rb.left - rm.left; A.by = rb.top - rm.top;           // origen del contenedor respecto al mapa
    A.l0 = r.left - rm.left; A.t0 = r.top - rm.top; A.w = r.width; A.h = r.height; A.rm = rm;
    Object.assign(p.style, { left: (A.l0 - A.bx) + 'px', top: (A.t0 - A.by) + 'px', right: 'auto', bottom: 'auto', transform: 'none', margin: '0' });
    p.classList.add('ap-movido'); document.body.classList.add('ap-moviendo');
    try { window.getSelection()?.removeAllRanges(); } catch (_) {}
    A.mov = true;
  }
  e.stopPropagation(); e.preventDefault();
  const W = A.rm.width, H = A.rm.height;
  const l = Math.min(Math.max(A.l0 + dx, 40 - A.w), W - 40), t = Math.min(Math.max(A.t0 + dy, 0), H - 30);
  A.p.style.left = (l - A.bx) + 'px'; A.p.style.top = (t - A.by) + 'px';
}, true);
function soltar(e) {
  if (!A || (e && e.pointerId !== A.id)) return;
  if (A.mov) { evitarClic = true; setTimeout(() => evitarClic = false, 0); document.body.classList.remove('ap-moviendo'); }
  A = null;
}
document.addEventListener('pointerup', soltar, true);
document.addEventListener('pointercancel', soltar, true);
document.addEventListener('click', e => { if (evitarClic) { e.stopPropagation(); e.preventDefault(); evitarClic = false; } }, true);
// el puntero «mano» indica que se puede mover
const mano = document.createElement('style');
mano.textContent = PANELES.split(',').map(s => s.trim()).join(',') + '{cursor:grab}';
document.head.append(mano);
// si la ventana se achica, la tabla movida vuelve a entrar en el mapa
window.addEventListener('resize', () => {
  const rm = mapa.getBoundingClientRect();
  document.querySelectorAll('.ap-movido').forEach(p => {
    const r = p.getBoundingClientRect(), dx = Math.max(0, r.left - rm.left - (rm.width - 60)), dy = Math.max(0, r.top - rm.top - (rm.height - 40));
    if (dx) p.style.left = (parseFloat(p.style.left) - dx) + 'px'; if (dy) p.style.top = (parseFloat(p.style.top) - dy) + 'px';
  });
});
});
