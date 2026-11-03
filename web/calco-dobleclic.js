/* Calco: doble clic para editar (agregado por BYNS7, 02-11-2026).
   Antes, cualquier clic sobre un símbolo o una línea ya colocados lo seleccionaba y no dejaba marcar nada encima
   (otro símbolo, un punto de ruta, una medición, un punto de las avenidas…). Ahora:
   · UN clic sobre una figura NO seleccionada pasa al mapa, como si la figura no estuviera: se puede poner encima.
   · DOBLE clic la selecciona para editarla (tamaño, giro, vértices, datos).
   · ARRASTRAR una figura la mueve directamente, como una imagen, sin necesidad de seleccionarla antes.
   · La figura ya seleccionada se maneja como siempre. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const capa = () => document.getElementById('calco-capa');
const ESPERA = 300;   // ms para distinguir un clic de un doble clic
let P = null, pasar = false, ultimo = null;
const css = document.createElement('style');
css.textContent = '#calco-capa .cf,#calco-capa .cv .hitl{cursor:pointer}#calco-capa.cd-mueve .cf{cursor:grabbing}';
document.head.append(css);

function debajo(x, y) {   // elemento del mapa debajo de la figura
  return document.elementsFromPoint(x, y).find(el => !capa()?.contains(el) && !el.closest('.calco-ghost')) || null;
}
function reenviar(x, y) {
  const el = debajo(x, y); if (!el) return;
  const base = { clientX: x, clientY: y, screenX: x, screenY: y, bubbles: true, cancelable: true, composed: true, button: 0, view: window };
  const pe = Object.assign({ pointerId: 1, pointerType: 'mouse', isPrimary: true }, base);
  pasar = true;
  try {
    el.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ buttons: 1 }, pe)));
    el.dispatchEvent(new MouseEvent('mousedown', Object.assign({ buttons: 1 }, base)));
    el.dispatchEvent(new PointerEvent('pointerup', pe));
    el.dispatchEvent(new MouseEvent('mouseup', base));
    el.dispatchEvent(new MouseEvent('click', Object.assign({ detail: 1 }, base)));
  } finally { pasar = false; }
}
document.addEventListener('pointerdown', e => {
  if (pasar || e.button) return;
  const c = capa(); if (!c || !c.contains(e.target)) return;
  const fig = e.target.closest('.cf,.cv'); if (!fig || !fig.dataset.id) return;   // manijas (.sh, .vh) siguen igual
  const sel = window.EMTE_CALCO_SEL?.();
  if (sel && fig.dataset.id === sel) return;                                       // la seleccionada se mueve como siempre
  // segundo toque sobre la misma figura en poco tiempo = doble clic → el calco la selecciona
  if (ultimo && ultimo.id === fig.dataset.id && Date.now() - ultimo.t < ESPERA + 120 && Math.hypot(e.clientX - ultimo.x, e.clientY - ultimo.y) < 10) {
    clearTimeout(ultimo.timer); ultimo = null; return;
  }
  e.stopPropagation(); e.preventDefault();
  P = { fig, id: fig.dataset.id, x: e.clientX, y: e.clientY, pid: e.pointerId, mov: false };
}, true);
window.addEventListener('pointermove', e => {
  if (!P || P.mov || e.pointerId !== P.pid) return;
  if (Math.hypot(e.clientX - P.x, e.clientY - P.y) < 6) return;
  // arrastre: la figura se mueve como una imagen (se le entrega al calco el inicio del gesto)
  P.mov = true; pasar = true; capa()?.classList.add('cd-mueve');
  try { P.fig.dispatchEvent(new PointerEvent('pointerdown', { clientX: P.x, clientY: P.y, button: 0, buttons: 1, bubbles: true, cancelable: true, pointerId: P.pid, pointerType: e.pointerType, isPrimary: true })); }
  finally { pasar = false; }
}, true);
window.addEventListener('pointerup', e => {
  if (!P || e.pointerId !== P.pid) return;
  const p = P; P = null; capa()?.classList.remove('cd-mueve');
  if (p.mov) return;
  // clic simple: se espera un instante por si es doble clic; si no, el clic va al mapa
  ultimo = { id: p.id, t: Date.now(), x: p.x, y: p.y, timer: setTimeout(() => { ultimo = null; reenviar(p.x, p.y); }, ESPERA) };
}, true);
// el clic nativo que sigue a un toque interceptado no debe llegar a nadie
document.addEventListener('click', e => {
  if (pasar) return; const c = capa(); if (!c || !c.contains(e.target)) return;
  const fig = e.target.closest('.cf,.cv'); if (!fig) return; const sel = window.EMTE_CALCO_SEL?.();
  if (!(sel && fig.dataset.id === sel)) { e.stopPropagation(); e.preventDefault(); }
}, true);
// el doble clic sobre una figura no debe acercar el mapa
document.addEventListener('dblclick', e => { const c = capa(); if (c && c.contains(e.target) && e.target.closest('.cf,.cv')) { e.stopPropagation(); e.preventDefault(); } }, true);
});
