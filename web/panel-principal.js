/* PANEL DE CONTROL «MÓDULO PRINCIPAL» (11-11-2026), según el diseño entregado:
   botones grandes uno debajo del otro, con dibujo a la izquierda, línea de color por módulo y ELIMINAR en rojo.
   Solo cambia la PANTALLA DE INICIO del panel lateral; dentro de cada módulo todo sigue igual. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main > aside'); if (!aside) return;
const IMG = 'assets/panel/';
const COL = { base: '#18B7C9', capas: '#1E7BE0', herr: '#E8B21C', rutas: '#22B04B', plan: '#D7262C', cartas: '#8A3FD1' };
const css = document.createElement('style');
css.textContent = `
aside.pp-inicio{background:radial-gradient(ellipse at 50% -10%,#1d3d6e 0,transparent 60%),linear-gradient(180deg,#0d2342,#081a33)!important}
aside.pp-inicio .pp-barra{display:flex!important;flex-direction:column;gap:11px!important;padding:14px 12px 16px!important;margin:0 -12px 12px!important;background:transparent!important;border:0!important;box-shadow:none!important}
.mp-cab{display:flex;align-items:center;gap:12px;margin:2px 0 4px;padding:10px 14px;border-radius:14px 14px 4px 4px;background:linear-gradient(180deg,#14325c,#0b2244);border:1px solid #2c4c7a;border-bottom:2px solid #C9A54C;color:#fff;font:800 14px/1 var(--tipo-titulo,"Segoe UI",system-ui);letter-spacing:.06em;white-space:nowrap;box-shadow:0 6px 16px #0006}
.mp-cab img{width:36px;height:auto;flex:none}.mp-cab i{width:2px;height:24px;background:#C9A54C;flex:none}
aside:not(.pp-inicio) .mp-cab{display:none}
aside.pp-inicio .pp-barra .pp-tab,aside.pp-inicio .pp-barra .lm-btn{position:relative;display:grid!important;grid-template-columns:minmax(64px,34%) 2px 1fr;align-items:center;gap:0 10px;min-height:70px;width:100%;margin:0!important;padding:5px 8px 5px 6px!important;
  border:1px solid #2f4f80!important;border-left:6px solid var(--mp,#C9A54C)!important;border-radius:14px!important;text-align:left;color:#fff!important;cursor:pointer;overflow:hidden;
  background:linear-gradient(180deg,#183a68 0,#0f294d 55%,#0b2142 100%)!important;box-shadow:0 5px 14px #0007,inset 0 1px #ffffff22!important;transition:transform .14s,box-shadow .14s,filter .14s!important}
aside.pp-inicio .pp-barra .pp-tab::before{display:none!important}
aside.pp-inicio .pp-barra .pp-tab:hover,aside.pp-inicio .pp-barra .lm-btn:hover{transform:translateX(3px);filter:brightness(1.12);box-shadow:0 8px 20px #0009,0 0 0 1px var(--mp,#C9A54C)!important}
aside.pp-inicio .pp-barra .pp-tab:active,aside.pp-inicio .pp-barra .lm-btn:active{transform:scale(.98)}
aside.pp-inicio .pp-barra .pp-tab>svg,aside.pp-inicio .pp-barra .lm-btn>svg{display:none!important}
.mp-ico{justify-self:center;max-width:100%;max-height:58px;object-fit:contain;filter:drop-shadow(0 3px 4px #0008);pointer-events:none}
.mp-sep{width:2px;height:46px;background:linear-gradient(180deg,transparent,#C9A54C,transparent)}
aside.pp-inicio .pp-barra .pp-tab>span,aside.pp-inicio .pp-barra .lm-btn>span{font:800 clamp(12.5px,1.02vw,17px)/1.1 var(--tipo-titulo,"Segoe UI",system-ui)!important;letter-spacing:.02em!important;white-space:nowrap;overflow:hidden;text-overflow:clip;text-transform:uppercase;color:#fff!important;text-shadow:0 2px 4px #000a}
aside.pp-inicio .pp-barra .lm-btn{--mp:#ff4b4b;border-color:#c43a3a!important;background:linear-gradient(180deg,#c22a2a 0,#8f1414 60%,#6d0d0d 100%)!important}
aside:not(.pp-inicio) .mp-ico,aside:not(.pp-inicio) .mp-sep{display:none}
aside.pp-inicio .pp-tab .pd-n{top:8px!important;right:10px!important}
@media (max-width:750px){aside.pp-inicio .pp-barra .pp-tab,aside.pp-inicio .pp-barra .lm-btn{min-height:64px}.mp-ico{max-height:52px}}`;
document.head.append(css);
function armar() {
  const barra = aside.querySelector('.pp-barra'); if (!barra) return false;
  if (!barra.querySelector('.mp-cab')) { const c = document.createElement('div'); c.className = 'mp-cab'; c.innerHTML = `<img src="${IMG}cabecera.png" alt=""><i></i><span>MÓDULO PRINCIPAL</span>`; barra.prepend(c); }
  barra.querySelectorAll('.pp-tab[data-id], .lm-btn').forEach(b => {
    if (b.querySelector('.mp-ico')) return;
    const id = b.classList.contains('lm-btn') ? 'eliminar' : b.dataset.id; if (!id) return;
    if (COL[id]) b.style.setProperty('--mp', COL[id]);
    const im = document.createElement('img'); im.className = 'mp-ico'; im.alt = ''; im.src = IMG + id + '.png'; im.draggable = false;
    const sp = document.createElement('i'); sp.className = 'mp-sep';
    b.prepend(im, sp);
  });
  return !!barra.querySelector('.lm-btn');
}
let n = 0; (function intentar() { if (!armar() && ++n < 80) setTimeout(intentar, 250); })();
new MutationObserver(() => armar()).observe(aside, { childList: true, subtree: false });
});
