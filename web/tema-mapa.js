/* Tema visual del mapa (agregado por BYNS7, 02-11-2026): misma gama azul marino y dorado, con más color.
   · Fondo del mapa con curvas de nivel decorativas: oscuro con las imágenes satelitales (así el recuadro de la imagen
     se funde con el fondo) y claro con los demás mapas base.
   · Buscador, «sin conexión», botones de zoom, rosa de los vientos, escala, coordenadas, vista general, créditos y
     botón del panel con el mismo estilo: vidrio azul marino, bordes y acentos dorados.
   · Pestañas de inicio y cuadros del panel con un color de acento por tema.
   Solo cambia la apariencia: para volver al aspecto anterior basta quitar el <script src="tema-mapa.js">. */
(() => {
'use strict';
const curvas = (c, o) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'><g fill='none' stroke='${c}' stroke-opacity='${o}' stroke-width='1.1'><path d='M-20 80C60 40 120 120 210 90S350 20 440 70'/><path d='M-20 110C70 70 130 150 215 118S355 52 440 100'/><path d='M-20 140C80 104 140 178 220 148S360 86 440 130'/><path d='M-20 250C40 210 110 290 190 262S330 200 440 236'/><path d='M-20 282C50 246 118 318 196 292S336 232 440 268'/><path d='M60 360c30-40 90-40 120 0s90 40 120 0'/><path d='M80 372c26-28 74-28 100 0s74 28 100 0'/><circle cx='330' cy='180' r='22'/><circle cx='330' cy='180' r='40'/><circle cx='330' cy='180' r='58'/></g></svg>`)}")`;
const css = document.createElement('style');
css.id = 'tema-mapa';
css.textContent = `
:root{--tm-nav:#0B1D33;--tm-nav2:#12294A;--tm-nav3:#1C3A66;--tm-oro:#B79A5B;--tm-oro2:#E2CB8E;--tm-vidrio:rgba(11,29,51,.86)}
/* fondo del mapa */
.map{background:#E9EEF4 ${curvas('#12294A', .07)} !important;background-size:420px 420px !important;transition:background-color .4s}
.map.tm-oscuro{background:radial-gradient(ellipse at 50% 45%,#1d3352 0%,#12243d 45%,#0a1628 100%),${curvas('#E2CB8E', .09)} !important;background-blend-mode:normal !important}
.map.tm-oscuro{background-image:${curvas('#E2CB8E', .08)},radial-gradient(ellipse at 50% 45%,#1d3352 0%,#12243d 45%,#0a1628 100%) !important;background-size:420px 420px,100% 100% !important}
/* buscador */
.map .search{border:1px solid #D7DEE8 !important;border-radius:14px !important;padding-left:42px !important;background:#fff url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#B79A5B' stroke-width='2.4' stroke-linecap='round'><circle cx='10.5' cy='10.5' r='6.5'/><path d='M15.5 15.5L21 21'/></svg>`)}") no-repeat 14px 50% / 18px !important;box-shadow:0 8px 26px rgba(11,29,51,.22),inset 0 -3px 0 #B79A5B !important;transition:box-shadow .2s}
.map .search:focus{outline:none !important;box-shadow:0 10px 30px rgba(11,29,51,.3),0 0 0 3px #B79A5B66,inset 0 -3px 0 #B79A5B !important}
/* sin conexión */
.map .legend{display:inline-flex !important;align-items:center;gap:8px;background:var(--tm-vidrio) !important;color:#fff !important;border:1px solid #ffffff22 !important;border-radius:20px !important;padding:6px 14px 6px 12px !important;font:700 10.5px var(--tipo-titulo,system-ui) !important;letter-spacing:.06em;box-shadow:0 6px 18px rgba(0,0,0,.25) !important;backdrop-filter:blur(6px)}
.map .legend::before{content:'';width:9px;height:9px;border-radius:50%;background:#3DDC84;box-shadow:0 0 0 3px #3DDC8433,0 0 10px #3DDC84;animation:tm-latido 2.4s ease-in-out infinite}
@keyframes tm-latido{50%{box-shadow:0 0 0 6px #3DDC8400,0 0 4px #3DDC84}}
/* botón del panel */
.map .sidebar-toggle{background:linear-gradient(135deg,var(--tm-nav2),var(--tm-nav)) !important;color:#fff !important;border:1px solid #B79A5B88 !important;border-radius:12px !important;box-shadow:0 6px 18px rgba(11,29,51,.35) !important}
.map .sidebar-toggle svg{color:var(--tm-oro2) !important}
.map .sidebar-toggle:hover{border-color:var(--tm-oro) !important;transform:translateY(-1px)}
/* zoom y ubicación */
.map .tools{display:flex !important;flex-direction:column;gap:0 !important;padding:5px !important;border-radius:16px !important;background:var(--tm-vidrio) !important;border:1px solid #B79A5B66 !important;box-shadow:0 10px 26px rgba(0,0,0,.3) !important;backdrop-filter:blur(6px)}
.map .tools button{width:42px !important;height:42px !important;margin:2px 0 !important;border:0 !important;border-radius:11px !important;background:transparent !important;color:#fff !important;font-size:19px !important;box-shadow:none !important;transition:background .15s,color .15s}
.map .tools button:hover{background:#B79A5B !important;color:var(--tm-nav) !important}
.map .tools button + button{border-top:1px solid #ffffff14 !important;border-radius:0 0 11px 11px}
/* rosa de los vientos */
.map .map-compass{border-radius:50% !important;background:radial-gradient(circle,#ffffffee 0 52%,#ffffffb0 53% 100%) !important;box-shadow:0 0 0 2px #B79A5B,0 8px 22px rgba(0,0,0,.28) !important;padding:2px !important}
.map.tm-oscuro .map-compass{background:radial-gradient(circle,#ffffffee 0 52%,#ffffffcc 53% 100%) !important}
/* escala numérica */
.map .map-scale{background:linear-gradient(160deg,#1C3A66f2,#0B1D33f2) !important;border:1px solid #B79A5B88 !important;border-top:3px solid var(--tm-oro) !important;border-radius:14px !important;box-shadow:0 12px 28px rgba(0,0,0,.35) !important}
/* coordenadas */
.map .bottom.topo-coord{background:var(--tm-vidrio) !important;color:#fff !important;border:1px solid #B79A5B66 !important;border-radius:22px !important;padding:8px 16px !important;box-shadow:0 8px 22px rgba(0,0,0,.28) !important;backdrop-filter:blur(6px)}
.map .bottom.topo-coord *{color:#fff}
.map .bottom.topo-coord b,.map .bottom.topo-coord strong,.map .bottom.topo-coord .lbl,.map .bottom.topo-coord small{color:var(--tm-oro2) !important}
.map .bottom.topo-coord .topo-pista{color:#C9D4E5 !important}
/* vista general */
.map .overview{border:2px solid var(--tm-oro) !important;border-radius:14px !important;overflow:hidden;box-shadow:0 12px 28px rgba(0,0,0,.32) !important}
.map .overview-title{background:linear-gradient(90deg,var(--tm-nav),var(--tm-nav3)) !important;color:var(--tm-oro2) !important;letter-spacing:.1em}
/* créditos */
.map .basemap-credit{background:var(--tm-vidrio) !important;border-radius:14px !important;padding:4px 11px !important;border:1px solid #ffffff1a}
.map .basemap-credit a{color:var(--tm-oro2) !important;text-decoration:none !important}
/* simbología */
.map .sim-btn{background:linear-gradient(135deg,#C9AE6E,#8A6D2F) !important;color:#0B1D33 !important;border-radius:12px !important;border:1px solid #E2CB8E !important}
.map .sim-card{border-radius:14px !important;overflow:hidden;border:1px solid #B79A5B66 !important;box-shadow:0 12px 30px rgba(11,29,51,.28) !important}
.map .sim-card h5{color:#8A6D2F !important}
/* paneles flotantes con el mismo acabado */
.map .rp-panel,.map .gm-panel,.map .cm-panel,.map .cc-mapa,.map .popup{border-radius:14px !important;box-shadow:0 16px 40px rgba(11,29,51,.32) !important}
/* pestañas de inicio con acento de color */
.pp-barra .pp-tab{position:relative;overflow:hidden;transition:transform .15s,box-shadow .15s}
.pp-barra .pp-tab::before{content:'';position:absolute;inset:0 0 auto;height:4px;background:var(--tm-ac,#B79A5B)}
.pp-barra .pp-tab svg{color:var(--tm-ac,#12294A) !important}
.pp-barra .pp-tab:hover{transform:translateY(-2px);box-shadow:0 10px 22px rgba(11,29,51,.22)}
.pp-barra .pp-tab:nth-of-type(1){--tm-ac:#13818A}.pp-barra .pp-tab:nth-of-type(2){--tm-ac:#1F5AA6}.pp-barra .pp-tab:nth-of-type(3){--tm-ac:#B7791F}
.pp-barra .pp-tab:nth-of-type(4){--tm-ac:#2E7D52}.pp-barra .pp-tab:nth-of-type(5){--tm-ac:#9B1C1C}.pp-barra .pp-tab:nth-of-type(6){--tm-ac:#6A3D9A}
/* cuadros del panel: color por grupo */
.pp-grilla .pp-cel[data-g="TERRENO"] .ic{background:#E3F1E8 !important;color:#2E7D52 !important}
.pp-grilla .pp-cel[data-g="MANIOBRA Y TIEMPO"] .ic{background:#E4ECF8 !important;color:#1F5AA6 !important}
.pp-grilla .pp-cel[data-g="SIMBOLOGÍA Y FUERZAS"] .ic{background:#F8E6E6 !important;color:#9B1C1C !important}
.pp-grilla .pp-cel[data-g="OTROS"] .ic{background:#F6EEDC !important;color:#8A6D2F !important}
.pp-grilla .pp-cel.pd-on .ic{background:#B79A5B !important;color:#fff !important}
.pp-grilla .pp-cel[data-g="TERRENO"]{border-bottom:3px solid #2E7D5255}.pp-grilla .pp-cel[data-g="MANIOBRA Y TIEMPO"]{border-bottom:3px solid #1F5AA655}
.pp-grilla .pp-cel[data-g="SIMBOLOGÍA Y FUERZAS"]{border-bottom:3px solid #9B1C1C55}.pp-grilla .pp-cel[data-g="OTROS"]{border-bottom:3px solid #B79A5B66}
.pp-grilla .pd-grupo[data-g="TERRENO"]{color:#2E7D52}.pp-grilla .pd-grupo[data-g="MANIOBRA Y TIEMPO"]{color:#1F5AA6}.pp-grilla .pd-grupo[data-g="SIMBOLOGÍA Y FUERZAS"]{color:#9B1C1C}
/* cabecera del cuadro activo */
.pp-cuadro{background:linear-gradient(135deg,#0B1D33,#1C3A66) !important;border-bottom:3px solid var(--tm-oro) !important}`;
document.head.append(css);
// fondo oscuro con las imágenes satelitales
const SAT = new Set(['s2026', 'planet', 'satellite']);
function fondo() { const m = document.querySelector('.map'), v = document.querySelector('#basemap-options input:checked')?.value; if (m) m.classList.toggle('tm-oscuro', SAT.has(v)); }
document.addEventListener('change', e => { if (e.target.name === 'basemap') fondo(); });
document.addEventListener('DOMContentLoaded', () => { fondo(); setTimeout(fondo, 1500); setTimeout(fondo, 5000); });
})();
