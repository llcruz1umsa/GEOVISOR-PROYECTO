/* Fluidez del mapa (agregado por BYNS7, 27-10-2026).
   Mientras arrastras o haces zoom con la rueda o con los dedos, el mapa se mueve como una sola imagen
   (lo hace la tarjeta gráfica) en vez de volver a dibujar las miles de líneas y símbolos en cada cuadro.
   Al soltar (o cada tanto en arrastres largos) se dibuja de nuevo con todo el detalle. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const svg = document.querySelector('.map svg'), scene = document.getElementById('scene');
if (!svg || !scene || typeof vistaEnCuadro !== 'function' || typeof zoom !== 'function') return;
let apl = null;          // estado dibujado de verdad: {s, px, py}
let M0 = null, cajas = null, fin = 0, activo = false;
const capas = () => [svg, ...[...svg.parentElement.querySelectorAll(':scope > svg')].filter(e => e !== svg)];
const ctmOrig = svg.getScreenCTM.bind(svg), ctmScene = scene.getScreenCTM.bind(scene);
function empezar() {
  activo = true; apl = { s: scale, px: panX, py: panY };
  M0 = ctmOrig(); const r = svg.getBoundingClientRect();
  cajas = capas().map(e => { const b = e.getBoundingClientRect(); return { e, igual: Math.abs(b.left - r.left) < 1 && Math.abs(b.top - r.top) < 1 && Math.abs(b.width - r.width) < 1 }; }).filter(c => c.igual);
  cajas.forEach(c => { c.e.style.transformOrigin = '0 0'; c.e.style.willChange = 'transform'; });
  svg.classList.add('moviendo');
  // Mientras dura el gesto, las coordenadas de la pantalla se calculan como si el mapa ya estuviera dibujado.
  svg.getScreenCTM = () => M0;
  scene.getScreenCTM = () => { const s = scale; return DOMMatrix.fromMatrix(M0).multiply(new DOMMatrix([s, 0, 0, s, 500 * (1 - s) + panX, 380 * (1 - s) + panY])); };
  M0.r = r;
}
function mover() {
  const k = scale / apl.s;
  const ax = 500 * (1 - apl.s) + apl.px, ay = 380 * (1 - apl.s) + apl.py;
  const bx = 500 * (1 - scale) + panX, by = 380 * (1 - scale) + panY;
  const tx = bx - k * ax, ty = by - k * ay;                       // desplazamiento en unidades del viewBox
  const E = M0.e - M0.r.left, F = M0.f - M0.r.top;               // margen del viewBox dentro del <svg>
  const cx = M0.a * tx + E * (1 - k), cy = M0.d * ty + F * (1 - k);
  const t = `translate(${cx}px,${cy}px) scale(${k})`;
  cajas.forEach(c => { c.e.style.transform = t; });
  // En arrastres largos se redibuja para que no aparezcan bordes vacíos.
  if (k < .55 || k > 1.8 || Math.abs(cx) > M0.r.width * .35 || Math.abs(cy) > M0.r.height * .35) terminar(true);
}
function terminar(seguir) {
  if (!activo) return;
  cajas.forEach(c => { c.e.style.transform = ''; if (!seguir) c.e.style.willChange = ''; });
  delete svg.getScreenCTM; delete scene.getScreenCTM;
  activo = false; zoom(1);
  if (seguir) empezar(); else svg.classList.remove('moviendo');
}
window.vistaEnCuadro = function () {
  if (!activo) empezar();
  mover();
  clearTimeout(fin); fin = setTimeout(() => terminar(false), 150);
};
// Si algún módulo llama a zoom() en medio de un gesto (botones +/−, ir a un lugar), se dibuja de una vez.
const zoomBase = zoom;
zoom = function (f) { if (activo) { cajas.forEach(c => { c.e.style.transform = ''; c.e.style.willChange = ''; }); delete svg.getScreenCTM; delete scene.getScreenCTM; activo = false; clearTimeout(fin); svg.classList.remove('moviendo'); } return zoomBase(f); };
});
