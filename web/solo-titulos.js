/* Solo títulos (BYNS7, 02-11-2026).
   Oculta los textos explicativos del panel y de las herramientas (descripciones, notas de reglamento,
   fuentes, explicaciones de cada clase) para ganar espacio. Quedan los títulos y los controles.
   Para volver a mostrarlos basta con quitar el <script src="solo-titulos.js"> de index.html. */
(() => {
'use strict';
const css = document.createElement('style');
css.textContent = `
.pp-cuadro small,
.pc-reg,
.pc-menu td.n em, .pc-menu td.n small,
.ca-c p.nota,
.hp-c > p,
.lm-dlg label small,
.calco-body > p:not(.calco-estado),
.fa-cab small,
.st-oculto{display:none !important}
.pc-menu td.n .rg{margin-top:3px}`;
(document.head || document.documentElement).append(css);

// textos que se reconocen por cómo empiezan (están en módulos distintos y sin clase propia)
const INICIOS = [
  /^Imagen satelital guardada/i,
  /^Provincia Omasuyos · límite provincial/i,
  /^Calles, senderos, caminos vecinales/i,
  /^Mediciones planimétricas/i,
  /^Tiempo estimado con velocidades/i,
  /^Fuente del clima/i,
  /^MDT Omasuyos: cartas/i,
  /^■ visible · ■ oculto/i,
  /^Calculado para toda la provincia/i,
  /^Reglamento PCT/i,
  /^Distancia en línea recta al establecimiento/i
];
const NO_TOCAR = '#info, .ficha, .lm-ok, .scale-reading, .rp-paso, .ex-msg, .orden-doc';
function limpiar() {
  document.querySelectorAll('main small, main p, .rp-panel p, .rp-panel small').forEach(e => {
    if (e.classList.contains('st-oculto') || e.closest(NO_TOCAR)) return;
    const t = (e.textContent || '').trim();
    if (INICIOS.some(r => r.test(t))) e.classList.add('st-oculto');
  });
  // subtítulos descriptivos de los cuadros (se dejan los conteos numéricos)
  document.querySelectorAll('.pp-cel > small').forEach(s => { if (!/^\s*\d/.test(s.textContent)) s.classList.add('st-oculto'); });
}
let pend = false;
const mo = new MutationObserver(() => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; limpiar(); }); });
const iniciar = () => { limpiar(); mo.observe(document.body, { childList: true, subtree: true }); };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
