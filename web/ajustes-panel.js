/* Ajustes del panel (agregado por BYNS7):
   · se quitan «Densidad de viviendas (hexágonos)» y el grupo «Trabajo de campo» de CAPAS;
   · los escudos de ruta se ocultan con la red vial apagada;
   · el grupo «Apoyo al planeamiento» (comunidades, zonas de aterrizaje, puentes, obras de agua y relieve)
     pasa de la pestaña CAPAS a la pestaña PLANEAMIENTO.
   Se espera a que los demás módulos terminen de armar sus casillas antes de mover el grupo. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main>aside'), capas = document.getElementById('layers');
if (!aside || !capas) return;
const sum = d => (d.querySelector(':scope > summary')?.textContent || '').trim();

const css = document.createElement('style');
css.textContent = `#apoyo-capas{padding:4px 8px 10px}
#apoyo-capas details.pp-sub{margin:6px 0 4px 10px;border-left:3px solid #B79A5B;border-radius:0 8px 8px 0}`;
document.head.append(css);

/* 1. quitar densidad de viviendas y trabajo de campo */
function quitar() {
  capas.querySelectorAll('details.cp-grupo').forEach(d => {
    d.querySelectorAll('input[type=checkbox]').forEach(cb => { if (cb.checked) cb.click(); });
    d.remove();
  });
  capas.querySelectorAll('label').forEach(l => {
    if (/^Densidad de viviendas/i.test(l.textContent.trim())) { const cb = l.querySelector('input'); if (cb && cb.checked) cb.click(); l.remove(); }
  });
}

/* 2. Apoyo al planeamiento -> pestaña Planeamiento */
const sec = document.createElement('details'); sec.className = 'layer-menu ap-menu'; sec.open = true;
sec.innerHTML = '<summary>Apoyo al planeamiento</summary><div id="apoyo-capas"></div>';
const caja = sec.querySelector('#apoyo-capas');
// los módulos (simbología, leyenda) escuchan los cambios en #layers: se reenvían desde la nueva ubicación
caja.addEventListener('change', e => { if (e.isTrusted || e.bubbles) capas.dispatchEvent(new Event('change', { bubbles: true })); });
let movido = false;
function listo(apo) {
  const rel = [...apo.querySelectorAll('details')].find(d => /^Relieve/i.test(sum(d)));
  return rel && rel.querySelectorAll('label').length >= 3;   // curvas, pendientes y cerros ya agregados
}
function mover(forzar) {
  if (movido) return true;
  const apo = [...capas.querySelectorAll(':scope > details')].find(d => /^Apoyo al planeamiento/i.test(sum(d)));
  if (!apo || (!forzar && !listo(apo))) return false;
  apo.open = true; caja.append(apo);
  const pc = aside.querySelector('.pc-menu');
  pc ? pc.after(sec) : aside.append(sec);
  movido = true; return true;
}
/* 3. escudos de ruta (RN 2, RN 16…): se ocultan cuando la red vial está apagada */
let tE = 0;
function escudos() {
  const R = document.getElementById('roads'), E = document.getElementById('vias-rutas'); if (!R || !E) return;
  const alguna = [...R.children].some(p => p.style.display !== 'none');
  E.style.visibility = alguna && R.style.display !== 'none' ? '' : 'hidden';
}
const R0 = document.getElementById('roads');
if (R0) new MutationObserver(() => { clearTimeout(tE); tE = setTimeout(escudos, 60); }).observe(R0, { attributes: true, subtree: true, childList: true, attributeFilter: ['style'] });
let n = 0;
(function esperar() {
  escudos();
  quitar();
  const ok = mover(n > 60);           // a los ~15 s se mueve aunque falte alguna casilla
  if (++n < 240 && (!ok || n < 40)) setTimeout(esperar, 250);   // sigue vigilando unos segundos para quitar lo que llegue tarde
})();
});
