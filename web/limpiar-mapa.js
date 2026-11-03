/* Botón «Eliminar» del panel principal (agregado por BYNS7, 01-11-2026).
   Borra de una vez todo lo que se agregó al geovisor durante el trabajo: mediciones, rutas, perfiles, área visible,
   avenidas de aproximación, puestos y alcances, áreas de interés, marchas, marcador de búsqueda y fichas abiertas;
   apaga todas las capas (queda solo el mapa base) y, si se marca, borra también los símbolos del calco.
   Pide confirmación antes de borrar. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main > aside'); if (!aside) return;
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const css = h('style');
css.textContent = `
.lm-btn{grid-column:1 / -1;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:3px;padding:11px 8px;border:1px solid #E57373;border-radius:12px;background:#7F1D1D;color:#fff;font:800 11px var(--tipo-titulo,system-ui);letter-spacing:.08em;cursor:pointer;transition:background .15s,transform .15s}
.lm-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.lm-btn:hover{background:#A52A2A;transform:translateY(-1px)}
.lm-fondo{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:#0B1D3399}
.lm-fondo[hidden]{display:none}
.lm-dlg{width:min(380px,calc(100vw - 32px));background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 18px 50px #0006;font:12px var(--tipo-texto,system-ui);color:#14233A}
.lm-dlg h3{margin:0;padding:12px 14px;background:#7F1D1D;color:#fff;font:800 13px var(--tipo-titulo,system-ui);letter-spacing:.08em;border-bottom:3px solid #B79A5B}
.lm-dlg .cuerpo{display:grid;gap:9px;padding:12px 14px}
.lm-dlg label{display:flex;gap:9px;align-items:flex-start;font-size:11.5px;font-weight:700;line-height:1.3;cursor:pointer}
.lm-dlg label input{margin-top:2px;flex:none}
.lm-dlg label small{display:block;font-weight:400;color:#5A6B80;font-size:10.5px}
.lm-dlg .peligro{color:#9B1C1C}
.lm-dlg .acc{display:flex;gap:8px;justify-content:flex-end;padding:10px 14px;border-top:1px solid #E3E8EF;background:#F8FAFC}
.lm-dlg .acc button{padding:8px 14px;border:1px solid #12294A;border-radius:7px;background:#fff;color:#12294A;font:700 11px var(--tipo-titulo,system-ui);letter-spacing:.05em;cursor:pointer}
.lm-dlg .acc button.si{background:#9B1C1C;border-color:#9B1C1C;color:#fff}
.lm-ok{position:absolute;left:50%;top:70px;transform:translateX(-50%);z-index:30;padding:8px 16px;border-radius:18px;background:#1E8B4C;color:#fff;font:700 12px var(--tipo-texto,system-ui);box-shadow:0 6px 18px #0004;pointer-events:none}`;
document.head.append(css);

const fondo = h('div', 'lm-fondo'); fondo.hidden = true;
fondo.innerHTML = `<div class="lm-dlg" role="dialog" aria-modal="true" aria-label="Eliminar todo lo agregado"><h3>ELIMINAR TODO LO AGREGADO</h3><div class="cuerpo">
<label><input type="checkbox" class="lm-dib" checked><span>Dibujos y análisis del mapa<small>Mediciones, rutas, perfiles, área visible, avenidas de aproximación, puestos de observación y alcances, áreas de interés, marchas, marcador de búsqueda y fichas abiertas.</small></span></label>
<label><input type="checkbox" class="lm-cap" checked><span>Apagar todas las capas<small>Queda solo el mapa base. Las capas se vuelven a encender desde CAPAS o PLANEAMIENTO.</small></span></label>
<label class="peligro"><input type="checkbox" class="lm-calco"><span>Símbolos del calco de planeamiento<small>Borra las figuras colocadas en el calco. No se puede deshacer.</small></span></label>
</div><div class="acc"><button type="button" class="no">Cancelar</button><button type="button" class="si">ELIMINAR</button></div></div>`;
document.body.append(fondo);
const $ = s => fondo.querySelector(s);
$('.no').onclick = () => fondo.hidden = true;
fondo.addEventListener('click', e => { if (e.target === fondo) fondo.hidden = true; });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !fondo.hidden) fondo.hidden = true; });

const clic = sel => document.querySelectorAll(sel).forEach(b => { try { b.click(); } catch (e) {} });
function dibujos() {
  clic('#measurement-clear'); clic('#clear-route');
  // área visible (varios puntos) y perfil topográfico
  document.querySelectorAll('.av-panel .av-limpiar').forEach(b => b.click());
  document.querySelectorAll('.av-panel:not([hidden]) .at-cerrar').forEach(b => b.click());
  document.querySelectorAll('#rp-cerrar').forEach(b => { if (!b.closest('[hidden]')) b.click(); });
  // herramientas de planeamiento (avenidas, observación, AIN, marchas, cubierta)
  try { window.EMTE_HP_LIMPIAR?.(); } catch (e) {}
  // marcador de búsqueda y fichas
  document.getElementById('topo-pin')?.replaceChildren();
  const info = document.getElementById('info'); if (info) info.hidden = true;
  document.querySelectorAll('.tt-zona').forEach(z => z.hidden = true);
}
function capas() {
  // casillas principales de cada capa (las de categorías quedan marcadas para cuando se vuelva a encender la capa)
  const principal = cb => { const l = cb.closest('label'); if (!l) return false; const p = l.parentElement; return !!p && p.matches('details.layer-group') && !p.classList.contains('vv-usos'); };
  document.querySelectorAll('#layers input[type=checkbox], #apoyo-capas input[type=checkbox]').forEach(cb => { if ((cb.checked || cb.indeterminate) && principal(cb)) { if (cb.indeterminate) { cb.indeterminate = false; cb.checked = true; } cb.click(); } });
  // secciones de PLANEAMIENTO: pendientes, análisis del terreno, fuerzas armadas, cubierta
  document.querySelectorAll('.pc-menu input[type=checkbox]:checked, .fa-sec .fa-ver:checked').forEach(cb => cb.click());
  try { window.EMTE_ANALISIS?.coc(''); window.EMTE_ANALISIS?.tc(false); } catch (e) {}
  try { window.EMTE_HP_CUB?.(false); } catch (e) {}
  // herramientas que funcionan como capa (pendientes del MDT, cuadrícula UTM)
  document.querySelectorAll('.visual-card.chosen').forEach(b => { if (!/Área visible|Perfil/i.test(b.textContent)) b.click(); });
  document.querySelectorAll('.visual-card').forEach(b => { if (/Cuadr[ií]cula/i.test(b.textContent) && /ENCENDIDA|ACTIVA/i.test(b.textContent)) b.click(); });
}
function calco() {
  const b = document.getElementById('calco-borrar'); if (!b) return;
  b.click(); if (b.classList.contains('confirmar')) b.click();   // el calco pide doble pulsación
}
$('.si').onclick = () => {
  const hecho = [];
  if ($('.lm-dib').checked) { dibujos(); hecho.push('dibujos y análisis'); }
  if ($('.lm-cap').checked) { capas(); hecho.push('capas apagadas'); }
  if ($('.lm-calco').checked) { calco(); hecho.push('calco borrado'); }
  fondo.hidden = true; $('.lm-calco').checked = false;
  try { window.EMTE_SIMB_REFRESCAR?.(); } catch (e) {}
  const ok = h('div', 'lm-ok', hecho.length ? '✔ Eliminado: ' + hecho.join(' · ') : 'No se eliminó nada'); document.querySelector('.map')?.append(ok); setTimeout(() => ok.remove(), 2600);
};
// el botón va en el panel principal, debajo de los cuadros
const boton = h('button', 'lm-btn'); boton.type = 'button'; boton.title = 'Borrar todo lo agregado al geovisor';
boton.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg><span>ELIMINAR</span>';
boton.onclick = () => { $('.lm-calco').closest('label').hidden = !document.getElementById('calco-borrar'); fondo.hidden = false; $('.no').focus(); };
let n = 0;
(function poner() { const b = aside.querySelector('.pp-barra'); if (b) { if (!b.contains(boton)) b.append(boton); return; } if (++n < 60) setTimeout(poner, 250); })();
});
