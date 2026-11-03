/* Inicio sin capas (agregado por BYNS7): al abrir el geovisor sólo se ve el mapa base; cada capa se enciende
   desde la pestaña CAPAS según la necesidad. Las casillas de categorías (tipos de establecimiento, usos de
   vivienda, clases de río, etc.) quedan marcadas para que, al encender la capa, se vea completa.
   Cada casilla principal se apaga una sola vez, la primera vez que aparece (los módulos las crean al cargar). */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const capas = document.getElementById('layers'); if (!capas) return;
const vistas = new WeakSet(), t0 = performance.now();
function principal(cb) {
  const l = cb.closest('label'); if (!l) return false;
  const p = l.parentElement;
  return !!p && p.matches('details.layer-group') && !p.classList.contains('vv-usos');
}
// casillas «todas» de capas con categorías: se esperan a que las categorías terminen de cargar
const cargando = cb => [...cb.closest('details').querySelectorAll('div,details')].some(e => e.childElementCount === 0 && /^Cargando categor/.test(e.textContent.trim()));
function apagar() {
  capas.querySelectorAll('input[type=checkbox]').forEach(cb => {
    if (vistas.has(cb)) return;
    if (principal(cb) && cargando(cb)) return;
    vistas.add(cb);
    if ((cb.checked || cb.indeterminate) && !cb.disabled && principal(cb)) { if (cb.indeterminate) { cb.indeterminate = false; cb.checked = true; } cb.click(); }   // el clic dispara el manejador propio de cada capa
  });
}
apagar();
const obs = new MutationObserver(apagar); obs.observe(capas, { childList: true, subtree: true });
// los módulos que cargan datos crean sus casillas más tarde: se vigila durante los primeros 5 minutos (la red vial puede tardar en llegar)
const iv = setInterval(() => { apagar(); if (performance.now() - t0 > 300000) { clearInterval(iv); obs.disconnect(); } }, 400);
});
