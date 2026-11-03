/* Panel depurado (agregado por BYNS7, 02-11-2026): se quitan las herramientas y capas que repetían la misma función.
   · Cartas › «Unidades militares (241)»  → queda Planeamiento › Fuerzas Armadas (433, los dos archivos, con figuras).
   · Herramientas › «Pendientes» y Capas › Relieve › «Pendientes (transitabilidad)» (modelo de 90 m)
       → queda Planeamiento › «Pendientes de transitabilidad · MDT» (cartas IGM, 20 m, la misma base del COC).
   · Herramientas › «Estadísticas» → queda la pestaña «Estadísticas» del encabezado.
   · Los puestos de observación se trabajan solo en «Área visible»; en Planeamiento queda «Campos de tiro».
   · Funciones que se pisaban en parte (se queda la mejor diseñada):
       Herramientas › «Consultar coordenadas» → la barra de coordenadas de abajo, el buscador y «COPIAR UTM» de las fichas.
       Calco › «Guardar carta» → Herramientas › «Descargar mapa (PDF)» (rótulo, leyenda, cuadrícula UTM).
       Apoyo al planeamiento › «Puentes» → Análisis del terreno › Terreno clave › «Puentes sobre ríos».
   · 02-11-2026: la mancha urbana (rayado) vuelve a mostrarse con las pendientes. Se quitan, a pedido:
       Capas › «Cobertura de salud» y «Límite referencial»; Apoyo › «Relieve»; el cuadro «Calco» de Planeamiento;
       Planeamiento › «Calco de situación modificado», «Campos de tiro», «Luz y clima», «Cálculo de marchas»,
       «Áreas de interés» y «Orden de operaciones». Guardar queda solo en Herramientas › «Guardar» (guardar-mapa.js).
   Los archivos originales no se borran: basta quitar este script de index.html para volver a verlos. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const txt = e => (e.textContent || '').replace(/\s+/g, ' ').trim();
const apagar = cb => { if (cb && (cb.checked || cb.indeterminate)) { cb.indeterminate = false; cb.checked = true; cb.click(); } };
const hecho = { uni: false, card: false, rel: false, est: false, coord: false, carta: false, puente: false, cob: false, lim: false, relieve: false, hp: false };
const css = document.createElement('style');
css.textContent = '#hp-obs,#hp-ain,#hp-mar{display:none}';   // dibujos de las herramientas quitadas
document.head.append(css);
function depurar() {
  // 1) Unidades militares de Cartas
  if (!hecho.uni) { const m = document.querySelector('main > aside .cc-menu.cc-uni'); if (m) { apagar(m.querySelector('#cc-uni-ver')); document.getElementById('cc-unidades')?.remove(); m.remove(); hecho.uni = true; } }
  // 2) tarjetas repetidas en Herramientas
  document.querySelectorAll('.visual-card').forEach(b => {
    const t = txt(b);
    if (/^◢?\s*Pendientes$/i.test(t)) { if (b.classList.contains('chosen')) b.click(); b.remove(); hecho.card = true; }
    else if (/^▤?\s*Estad[ií]sticas$/i.test(t)) { b.remove(); hecho.est = true; }
    else if (/Consultar coordenadas/i.test(t)) { if (b.classList.contains('chosen')) document.getElementById('measurement-clear')?.click(); b.remove(); hecho.coord = true; }
  });
  // 3) Relieve › Pendientes (transitabilidad)
  document.querySelectorAll('#layers label, #apoyo-capas label').forEach(l => { if (/^Pendientes \(transitabilidad\)/i.test(txt(l))) { apagar(l.querySelector('input[type=checkbox]')); l.remove(); hecho.rel = true; } });
  // 4) Calco › Guardar carta
  const gc = document.getElementById('calco-carta'); if (gc) { gc.remove(); hecho.carta = true; } else if (!document.querySelector('.calco-menu')) hecho.carta = true;
  // 5) Apoyo al planeamiento › Puentes
  document.querySelectorAll('#apoyo-capas label, #layers label').forEach(l => { if (/^Puentes$/i.test(txt(l))) { apagar(l.querySelector('input[type=checkbox]')); l.remove(); hecho.puente = true; } });
  // 6) Capas › Cobertura de salud y Límite referencial
  document.querySelectorAll('#layers label, #apoyo-capas label').forEach(l => {
    const t = txt(l);
    if (/^Cobertura de salud/i.test(t)) { apagar(l.querySelector('input[type=checkbox]')); l.remove(); hecho.cob = true; }
    else if (/^L[ií]mite referencial$/i.test(t)) { apagar(l.querySelector('input[type=checkbox]')); l.remove(); hecho.lim = true; }
  });
  // 7) Apoyo › Relieve (grupo completo; se espera a que ajustes-panel.js mueva Apoyo a Planeamiento)
  document.querySelectorAll('#apoyo-capas details').forEach(d => {
    if (/^\s*Relieve/i.test(d.querySelector(':scope > summary')?.textContent || '')) { d.querySelectorAll('input[type=checkbox]').forEach(apagar); d.remove(); hecho.relieve = true; }
  });
  // 8) herramientas de planeamiento quitadas y botones de guardar sueltos (todo se guarda desde Herramientas › Guardar)
  const hp = ['.hp-csm', '.hp-obs', '.hp-luz', '.hp-mar', '.hp-ain', '.hp-oo'].map(c => document.querySelector('main > aside > ' + c));
  if (hp.some(Boolean) || hecho.hp) { hp.forEach(e => e && e.remove()); ['obs', 'ain', 'mar'].forEach(k => document.getElementById('hp-' + k)?.replaceChildren()); hecho.hp = !document.querySelector('.hp-csm,.hp-obs,.hp-luz,.hp-mar,.hp-ain,.hp-oo'); }
  document.querySelectorAll('main > aside button, .map button').forEach(b => { if (/Exportar ruta a GPS|Descargar cronograma/i.test(txt(b))) b.remove(); });
  return Object.values(hecho).every(Boolean);
}
let n = 0;
(function esperar() { if (!depurar() && ++n < 120) setTimeout(esperar, 250); })();
});
