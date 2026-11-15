// Calco militar del proyecto PLANEAMIENTO dentro del geovisor (agregado por BYNS7).
// Símbolos del reglamento (192), líneas tácticas y zonas, con su configuración: bando, escalón,
// designaciones, textos, previsto, tamaño, giro y opacidad. Se dibuja sobre el mapa base del geovisor.
// Guarda en PostgreSQL (esquema planeamiento, EPSG:3857) mediante /api/planeamiento; si el servicio
// no responde, trabaja solo en este navegador. Exporta shape (ZIP), GeoJSON y carta (PNG con cuadrícula UTM).
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main > aside'), map = document.querySelector('.map');
const scene = document.getElementById('scene'), svgMapa = scene && scene.ownerSVGElement;
if (!aside || !map || !scene) return;

/* ---------- constantes ---------- */
const NS = 'http://www.w3.org/2000/svg', R = 6378137, K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702;
const BANDOS = [['Propio', 'Propio (azul)', '#0033cc'], ['Enemigo', 'Enemigo (rojo)', '#e00000'], ['Obstáculo', 'Obstáculo (verde)', '#00a030'],
  ['Contaminado', 'Contaminado (amarillo)', '#e6c800'], ['Negro', 'Obras y poblaciones (negro)', '#111111']];
const color = b => (BANDOS.find(x => x[0] === b) || BANDOS[0])[2];
const ESC = [['', '(sin escalón)'], ['XXXXXX', 'XXXXXX Cmdo. Gral. Ejército'], ['XXXXX', 'XXXXX Cmdo. TO / ZI'], ['XXXX', 'XXXX Cmdo. FF.TT.'],
  ['XXX', 'XXX Cuerpo de Ejército'], ['XX', 'XX División'], ['X', 'X Brigada'], ['III', 'III Regimiento'], ['II', 'II Batallón / Grupo'],
  ['I', 'I Compañía / Escuadrón / Batería'], ['●●', '●● Sección'], ['●', '● Escuadra'], ['▲', '▲ Equipo']];
// d=entrecortada, w=grosor, a=flecha, a0=flecha al inicio, b=bando por defecto, deco=x|o|ox|h|c|M|xM, fill=relleno, sig=sigla, inn=relleno de minas, o=opacidad del trazo, nol=sin línea
const LIN = [['Límite', {}], ['Límite futuro o propuesto', { d: 1 }], ['Límite internacional', { b: 'Negro', d: 1, w: 3.5 }],
  ...['LP - Línea de Partida', 'LS - Línea de Seguridad', 'LFP - Línea Final de Protección', 'LD - Línea de Detención', 'LV - Línea de Vigilancia',
    'LF - Línea de Fase', 'LI - Línea de Igualación', 'L Cord. F - Línea de Coordinación Final', 'LCF - Línea de Coordinación de Fuegos',
    'LSF - Línea de Seguridad de Fuego', 'L PAC - Línea de Puestos Adelantados de Combate', 'L. Extr. - Línea de Extraviados',
    'LCA - Línea de Cabeza Aérea', 'PR - Posición de Retardo'].map(n => [n, {}]),
  ['LPR - Línea Principal de Resistencia', { w: 5 }], ['LC - Línea de Contacto', { deco: 'h' }], ['LP/LC - Línea de Partida es Línea de Contacto', { deco: 'h' }],
  ['Dirección de ataque', { w: 4.5, a: 1 }], ['Dirección de ataque (con orden)', { w: 4, d: 1, a: 1 }], ['Eje de progresión', { w: 10, a: 1, o: .6 }],
  ['Eje de progresión previsto', { w: 10, a: 1, d: 1, o: .6 }], ['ITIN - Itinerario', { a: 1, w: 2 }], ['D - Dirección de aproximación', { a: 1, w: 2 }],
  ['Alambre de púas', { b: 'Obstáculo', deco: 'x', w: 1 }], ['Cerca baja de alambre de púas', { b: 'Obstáculo', deco: 'x' }],
  ['Línea de minas antitanque', { b: 'Obstáculo', deco: 'o' }], ['Línea de minas antipersonal', { b: 'Obstáculo', deco: 'ox' }],
  ['Obstrucción o destrucción prevista', { b: 'Obstáculo', d: 1, w: 3 }], ['Alambre plegable simple', { b: 'Obstáculo', deco: 'c', nol: 1 }],
  ['Frente cubierto (flechas en los extremos)', { w: 3, a: 1, a0: 1 }],
  ['Dirección de ataque enemiga', { b: 'Enemigo', w: 4.5, a: 1 }], ['Eje de progresión enemigo', { b: 'Enemigo', w: 10, a: 1, o: .6 }],
  ['Límite de unidad enemiga', { b: 'Enemigo' }], ['Límite de zona contaminada', { b: 'Contaminado', w: 3 }],
  ['Límite departamental / provincial', { b: 'Negro', d: 1, w: 2.5 }]];
const ZON = [['Zona', {}], ['Zona futura o prevista', { d: 1 }], ['Sector / zona de acción', {}], ['ZR - Zona de Reunión', {}], ['ZR - Zona de Reunión prevista', { d: 1 }],
  ['BP - Base de Partida', {}], ['BP - Base de Partida prevista', { d: 1 }], ['RES - Reserva', {}], ['O - Objetivo', { w: 3.5 }],
  ['ZRV - Zona de Reunión de Vehículos', {}], ['ZDV - Zona de Desembarco de Vehículos', {}], ['Z. Desemb. - Zona de Desembarco', {}],
  ['ZL - Zona de Lanzamiento', {}], ['Z. At. - Zona de Aterrizaje', {}], ['AD - Área Defensiva', {}], ['PB - Puesto de Bloqueo', {}],
  ['Centro de Resistencia (Batallón)', { sig: 'II' }], ['Centro de Resistencia previsto', { sig: 'II', d: 1 }], ['Punto de Apoyo (Compañía)', { sig: 'I' }],
  ['Punto de Apoyo (Sección)', { sig: '●●' }], ['Zona destruida', { fill: 1 }], ['Área fortificada', { deco: 'o' }], ['Campo minado', { b: 'Obstáculo', sig: 'M' }],
  ['Área contaminada', { b: 'Contaminado', fill: 1 }], ['ENO - Enemigo', { b: 'Enemigo' }], ['Faja de minas antitanque', { b: 'Obstáculo', inn: 'o' }],
  ['Faja de minas antipersonal', { b: 'Obstáculo', inn: 'ox' }], ['Campo minado AT conocido sin cerca', { b: 'Obstáculo', d: 1, deco: 'M', inn: 'o', gap: 1 }],
  ['Campo minado antipersonal con cerca', { b: 'Obstáculo', d: 1, deco: 'xM', inn: 'ox', gap: 1 }], ['Campo minado combinado (AT y AP)', { b: 'Obstáculo', inn: 'mix' }],
  ['ENO - Enemigo previsto', { b: 'Enemigo', d: 1 }], ['Área contaminada prevista', { b: 'Contaminado', fill: 1, d: 1 }],
  ['Población / localidad', { b: 'Negro' }], ['Obra de arte (puente, represa, túnel)', { b: 'Negro', w: 3 }]];
// Página del reglamento (assets/reglamento-simbologia.pdf) donde se explica cada grupo del catálogo.
const REGL = 'assets/reglamento-simbologia.pdf';
const PAG = { '1': 3, '2': 4, '3': 5, '4': 6, '5': 19, '6': 20, '7': 24, '8': 14, '9': 12, '10': 13, '11': 25, '12': 25, '13': 25, '14': 25, '15': 25, '16': 25,
  '17': 10, '18': 10, '19': 26, '20': 12, '21': 2, '22': 3 };
const pagDe = nombre => PAG[(String(nombre).match(/^(\d+)\./) || [])[1]] || 2;
const GRP = {}; // clave del ítem -> nombre del grupo
const STY = {}; LIN.forEach(x => STY['l' + x[0]] = x[1]); ZON.forEach(x => STY['z' + x[0]] = x[1]);
const SIN = { l: 'Línea (elija el tipo)', z: 'Zona (elija el tipo)' };   // tipo provisional hasta elegirlo en la ficha
const GRUPO_LZ = { Propio: ['17. Líneas tácticas', '18. Zonas y áreas'], Enemigo: '19. Enemigo: líneas y zonas', 'Obstáculo': '20. Obstáculos (verde)', Contaminado: '21. Áreas contaminadas (amarillo)', Negro: '22. Obras y poblaciones (negro)' };
const grupoLZ = (k, b) => { const g = GRUPO_LZ[b] || GRUPO_LZ.Propio; return Array.isArray(g) ? g[k === 'l' ? 0 : 1] : g; };
LIN.forEach(x => GRP['l' + x[0]] = grupoLZ('l', x[1].b || 'Propio')); ZON.forEach(x => GRP['z' + x[0]] = grupoLZ('z', x[1].b || 'Propio'));
const textos = o => [[o.esc, 100, 44, 'middle'], [o.izq, 22, 111, 'end'], [o.der, 178, 111, 'start'], [o.cen, 100, 111, 'middle'], [o.aba, 100, 178, 'middle']].filter(t => t[0]);
const sigla = o => { const st = STY[o.k + o.tipo] || {}; return st.sig != null ? st.sig : (o.tipo.includes(' - ') ? o.tipo.split(' - ')[0] : ''); };
const r1 = v => Math.round(v * 100) / 100;

/* ---------- coordenadas: EPSG:3857 <-> escena del geovisor <-> pantalla ---------- */
const ll = (x, y) => [x / R * 180 / Math.PI, (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI];
const merc = (lat, lon) => [lon * Math.PI / 180 * R, R * Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360))];
const aEscena = (x, y) => [500 + (x / R + OX) * K, 380 - (y / R + OY) * K];
const deEscena = (sx, sy) => [((sx - 500) / K - OX) * R, ((380 - sy) / K - OY) * R];
let V = null; // vista actual: matriz de la escena, su inversa, rectángulo del mapa y píxeles por metro
function vista() {
  const M = scene.getScreenCTM(); if (!M) return false;
  V = { M, I: M.inverse(), r: map.getBoundingClientRect(), k: Math.hypot(M.a, M.b) * K / R };
  return true;
}
function toScr(x, y) { const [sx, sy] = aEscena(x, y), p = new DOMPoint(sx, sy).matrixTransform(V.M); return [p.x - V.r.left, p.y - V.r.top]; }
function toMap(px, py) { const p = new DOMPoint(px + V.r.left, py + V.r.top).matrixTransform(V.I); return deEscena(p.x, p.y); }

/* ---------- estado ---------- */
let SVG = {}, NAME = {}, CATB = {}, armed = null, draft = [], sel = null, remoto = false, cargado = false;
const S = new Map(), pend = {}, hold = {}, cola = {};

/* ---------- estilos ---------- */
const css = document.createElement('style');
css.textContent = `
#calco-capa{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden}
#calco-capa .cf{pointer-events:visiblePainted;cursor:move;touch-action:none}
#calco-capa svg{cursor:inherit}
.calco-msg[hidden],.calco-edit[hidden],.calco-ghost[hidden],.calco-it[hidden],.calco-edit [hidden]{display:none!important}
#calco-capa .cf .hit{pointer-events:all}
#calco-capa .cv{pointer-events:none;cursor:move;touch-action:none}
#calco-capa .cv .hitl{pointer-events:stroke}
#calco-capa .st{font:700 30px Arial,sans-serif;fill:currentColor}
#calco-capa .vl{font:700 13px Arial,sans-serif;fill:currentColor;stroke:#fff;stroke-width:3.5px;paint-order:stroke;pointer-events:none}
#calco-capa .vm{font:700 14px Arial,sans-serif;fill:currentColor;pointer-events:none}
#calco-capa .vp{font:700 12px Arial,sans-serif;fill:#070774;stroke:#fff;stroke-width:3.5px;paint-order:stroke;pointer-events:none}
#calco-capa .vh{fill:#b28405;stroke:#fff;stroke-width:2;cursor:crosshair;pointer-events:all;touch-action:none}
#calco-capa .vd{fill:#b28405;stroke:#fff;stroke-width:1.5}
#calco-capa .sb{fill:none;stroke:#b28405;stroke-width:2;stroke-dasharray:6 4;pointer-events:none}
#calco-capa .sh{fill:#b28405;stroke:#fff;stroke-width:2;pointer-events:all;touch-action:none}
#calco-capa .prev svg *{stroke-dasharray:14 10}
.map.calco-armado svg{cursor:crosshair!important}
.calco-menu>summary{background:#070774;color:#fff;padding:14px;font-weight:600}
.calco-body{padding:12px;display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.calco-body p{margin:0;font-size:12px;line-height:1.5}
.calco-body label{display:flex;gap:8px;align-items:center;padding:0;border:0;font-size:12px}
.calco-body select,.calco-body input[type=search],.calco-body input[type=text]{flex:1;min-width:0;padding:8px;border:1px solid #c9cddd;border-radius:6px;font:12px system-ui}
.calco-btns{display:flex;gap:6px;flex-wrap:wrap}.calco-btns>*{flex:1 1 auto}
.calco-btns button,.calco-btns a{padding:9px 8px;font-size:12px;border:1px solid #070774;border-radius:6px;color:#070774;background:#fff;text-align:center;text-decoration:none;font-weight:600}
.calco-btns .pri{background:#070774;color:#fff}.calco-btns .pri:hover{background:#12129a}
.calco-estado{font-size:11px!important;color:#52695d;background:#f0f3ef;border-radius:6px;padding:7px 9px}
.calco-estado.aviso{background:#fff4dc;color:#7a5a00}
.calco-cat{border:1px solid #dfe5de;border-radius:8px;max-height:380px;overflow:auto}
.calco-cat details{border-top:1px solid #e5e9e3}.calco-cat details:first-child{border-top:0}
.calco-cat summary{padding:10px;font-size:12px;font-weight:600;color:#405b42;background:#f5f7f2;position:sticky;top:0;z-index:1}
.calco-cat summary small{color:#7a8a80;font-weight:400}
.calco-it{display:flex;width:100%;gap:9px;align-items:center;text-align:left;border:0;border-top:1px solid #eef1ed;border-radius:0;padding:5px 10px;font-size:12px;background:#fff;color:#182d38}
.calco-it:hover{background:#f1f2ff}.calco-it.on{background:#e8e9ff;box-shadow:inset 3px 0 #070774}
.calco-it svg{flex:none;width:36px;height:36px;background:#eef1e8;border-radius:4px}
.calco-it span{min-width:0;overflow-wrap:anywhere}
.calco-ghost{position:fixed;width:60px;height:60px;margin:-30px 0 0 -30px;pointer-events:none;z-index:50;opacity:.85}
.calco-ghost svg{width:100%;height:100%;overflow:visible}
.calco-msg{position:absolute;left:50%;transform:translateX(-50%);top:14px;z-index:7;display:flex;gap:8px;align-items:center;background:#070774;color:#fff;border:1px solid #b28405;border-radius:9px;padding:8px 10px;font-size:12px;box-shadow:0 4px 16px #0004;max-width:calc(100% - 24px)}
.calco-msg span{min-width:0}.calco-msg button{padding:6px 10px;font-size:11px;border-radius:6px}
.calco-msg .pri{background:#b28405;color:#fff;border-color:#b28405}
.calco-edit{position:absolute;left:16px;bottom:56px;z-index:8;width:340px;max-width:calc(100% - 32px);max-height:calc(100% - 140px);overflow:auto;background:#fff;border:1px solid #b28405;border-radius:10px;box-shadow:0 8px 30px #07077433;font-size:12px}
.calco-edit .cab{display:flex;align-items:center;gap:8px;background:#070774;color:#fff;padding:9px 10px;position:sticky;top:0;z-index:1}
.calco-edit .cab b{flex:1;min-width:0;font-size:12px}
.calco-edit .cab button{background:transparent;color:#fff;border:0;padding:2px 6px;font-size:16px}
.calco-edit .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px}
.calco-edit label{display:flex;flex-direction:column;gap:3px;padding:0;border:0;font-size:11px;color:#52695d}
.calco-edit .grid>*{min-width:0}.calco-edit input[type=text],.calco-edit select{width:100%}
.calco-edit label{align-items:stretch;text-align:left}
.calco-edit label.fila{flex-direction:row;align-items:center;gap:6px}
.calco-edit label.ancho{grid-column:1/-1}
.calco-edit input[type=text],.calco-edit select{padding:6px;border:1px solid #c9cddd;border-radius:5px;font:12px system-ui;min-width:0}
.calco-edit .par{display:flex;gap:4px}.calco-edit .par button{flex:1;padding:6px;font-size:14px}
.calco-edit .acciones{display:flex;gap:6px;padding:0 10px 10px}.calco-edit .acciones button{flex:1;padding:8px;font-size:12px}
.calco-edit .del{color:#b42330;border-color:#e4b8bd}
.calco-edit .coords{border-top:1px solid #e5e9e3;padding:8px 10px 10px}
.calco-edit .coords div{display:flex;gap:6px;align-items:center;margin-bottom:5px}
.calco-edit .coords div b{flex:1}.calco-edit .coords button{padding:5px 8px;font-size:11px}
.calco-edit table{width:100%;border-collapse:collapse;font-size:11px;font-variant-numeric:tabular-nums}
.calco-edit th,.calco-edit td{padding:3px 5px;border-bottom:1px solid #edf0ed;text-align:right;white-space:nowrap}
.calco-edit th:first-child,.calco-edit td:first-child{text-align:left}
.calco-edit th{background:#f5efdc;color:#7a6b40;font-weight:600;position:sticky;top:0}
.calco-edit tr.c td{font-weight:700;color:#070774}
.calco-edit .tw{max-height:150px;overflow:auto}
.calco-edit .ce-tipo-l span{font-weight:700;color:#070774}
.calco-edit .ce-tipo-l.falta select{border:2px solid #b28405;background:#fff8e6;animation:ce-pulso 1.2s ease-in-out 3}
@keyframes ce-pulso{50%{box-shadow:0 0 0 4px #b2840555}}
@media(max-width:750px){.calco-edit{left:8px;bottom:8px;width:auto;right:8px}.calco-msg{top:60px}}`;
css.textContent += `
.calco-borrar{width:100%;background:#fff;color:#b3261e!important;border:1px solid #b3261e!important;font-weight:700}
.calco-borrar:hover{background:#b3261e!important;color:#fff!important}.calco-borrar.confirmar{background:#b3261e!important;color:#fff!important}
.calco-regl{display:block;margin:6px 0 2px;font-size:11px;color:#070774;font-weight:600}
.calco-pag{float:right;margin-left:6px;font-size:10px;font-weight:600;color:#b28405;text-decoration:none}.calco-pag:hover{text-decoration:underline}
.ce-orden{flex-wrap:wrap;gap:4px!important}.ce-orden button{flex:1 1 45%;font-size:10.5px!important;padding:5px 4px!important}
.ce-ref{display:block;margin:8px 0 2px;font-size:11px;font-weight:600;color:#070774}`;
document.head.append(css);

/* ---------- capa sobre el mapa ---------- */
const capa = document.createElementNS(NS, 'svg'); capa.id = 'calco-capa'; capa.setAttribute('aria-hidden', 'true');
svgMapa.after(capa);
const gVec = el(capa, 'g', {}), gSym = el(capa, 'g', {}), gSel = el(capa, 'g', {});
function el(par, tag, at) { const e = document.createElementNS(NS, tag); for (const k in at) if (at[k] != null) e.setAttribute(k, at[k]); if (par) par.append(e); return e; }

/* ---------- panel lateral ---------- */
const panel = document.createElement('details'); panel.className = 'layer-menu calco-menu'; panel.open = true;
panel.innerHTML = `<summary>Calco militar · PLANEAMIENTO</summary><div class="calco-body">
<p class="calco-estado" id="calco-estado" role="status">Cargando el calco…</p>
<label><input type="checkbox" id="calco-ver" checked> Mostrar calco (<b id="calco-n">0</b> figuras)</label>
<div class="calco-btns"><button type="button" id="calco-ir">⌖ Ver el calco</button></div>
<input type="search" id="calco-q" placeholder="Buscar símbolo, línea o zona…" aria-label="Buscar en el catálogo">
<div class="calco-btns"><button type="button" class="calco-borrar" id="calco-borrar">🗑 Borrar toda la simbología de planeamiento</button></div>
<a class="calco-regl" href="assets/reglamento-simbologia.pdf" target="_blank" rel="noopener">📖 Reglamento de símbolos convencionales militares (PDF)</a>
<p>Elige un símbolo y toca el mapa, o arrástralo al mapa. Luego muévelo, estíralo por las esquinas y gíralo con el punto superior. Líneas y zonas: toca cada punto y pulsa Terminar.</p>
<div class="calco-cat" id="calco-cat"></div>
<label>Nombre <input type="text" id="calco-nombre" maxlength="60"></label>
<div class="calco-btns"><button type="button" class="pri" id="calco-shape">Guardar shape</button><button type="button" class="pri" id="calco-carta">Guardar carta</button></div>
<div class="calco-btns"><button type="button" id="calco-geojson">Descargar GeoJSON</button><a href="planeamiento/PLANEAMIENTO.zip" download>Proyecto QGIS (ZIP)</a></div>
<p style="color:#7a8a80;font-size:11px">El shape (EPSG:3857) trae símbolos, líneas y zonas con todos sus atributos. La carta es una imagen A4 de la vista actual con cuadrícula UTM, escala y norte.</p>
</div>`;
aside.append(panel);
const $ = id => document.getElementById(id), estado = $('calco-estado');
function aviso(t, malo) { estado.textContent = t; estado.classList.toggle('aviso', !!malo); }
$('calco-nombre').value = 'Calco ' + new Date().toLocaleDateString('es-BO').replace(/\//g, '-');

/* ---------- barra de dibujo y ficha de edición ---------- */
const msg = document.createElement('div'); msg.className = 'calco-msg'; msg.hidden = true;
msg.innerHTML = '<span id="calco-msgt"></span><button type="button" class="pri" id="calco-fin" hidden>Terminar</button><button type="button" id="calco-undo" hidden>Deshacer</button><button type="button" id="calco-cancel">Cancelar</button>';
map.append(msg);
const ed = document.createElement('section'); ed.className = 'calco-edit'; ed.hidden = true; ed.setAttribute('aria-label', 'Ficha de la figura');
ed.innerHTML = `<div class="cab"><b id="ce-nom"></b><button type="button" id="ce-x" aria-label="Cerrar ficha">×</button></div>
<div class="grid">
<label class="ps">Tamaño<span class="par"><button type="button" id="ce-men" aria-label="Reducir">−</button><button type="button" id="ce-mas" aria-label="Agrandar">+</button></span></label>
<label class="ps">Giro<span class="par"><button type="button" id="ce-rl" aria-label="Girar a la izquierda">↺</button><button type="button" id="ce-rr" aria-label="Girar a la derecha">↻</button></span></label>
<label class="ps">Escalón<select id="ce-esc"></select></label>
<label class="ps">Designación izq.<input type="text" id="ce-izq" maxlength="20"></label>
<label class="ps">Designación der.<input type="text" id="ce-der" maxlength="20"></label>
<label class="ps">Texto centro<input type="text" id="ce-cen" maxlength="20"></label>
<label class="ps">Texto abajo<input type="text" id="ce-aba" maxlength="20"></label>
<label class="pv ancho ce-tipo-l"><span id="ce-tipo-t">Tipo</span><select id="ce-tipo"></select></label>
<label class="pv">Nombre / etiqueta<input type="text" id="ce-et" maxlength="60"></label>
<label class="pv">Fecha-hora<input type="text" id="ce-fh" maxlength="30" placeholder="160500-MAR-26"></label>
<label class="ps fila"><input type="checkbox" id="ce-prev"> Previsto (trazo discontinuo)</label>
<label class="ancho">Opacidad <span class="par" style="align-items:center"><input type="range" id="ce-op" min="0" max="100" step="5" style="flex:1"><span id="ce-opn" style="width:38px;text-align:right"></span></span></label>
</div>
<a class="ce-ref" id="ce-ref" target="_blank" rel="noopener"></a>
<div class="acciones ce-orden"><button type="button" id="ce-frente" title="Este símbolo se dibuja encima de los demás (Re Pág)">⏫ Al frente</button><button type="button" id="ce-subir" title="Una posición más arriba">▲ Subir</button><button type="button" id="ce-bajar" title="Una posición más abajo">▼ Bajar</button><button type="button" id="ce-fondo" title="Este símbolo se dibuja debajo de los demás (Av Pág)">⏬ Al fondo</button></div>
<div class="acciones"><button type="button" class="del" id="ce-del">Eliminar</button><button type="button" id="ce-ok">Listo</button></div>
<div class="coords"><div><b>Coordenadas</b><span id="ce-zona"></span><button type="button" id="ce-copy">Copiar</button></div><div class="tw"><table id="ce-tab"></table></div></div>`;
map.append(ed);
for (const t of ['pointerdown', 'click', 'dblclick', 'wheel']) { ed.addEventListener(t, e => e.stopPropagation()); msg.addEventListener(t, e => e.stopPropagation()); }
ESC.forEach(x => $('ce-esc').add(new Option(x[1], x[0])));

/* ---------- dibujo ---------- */
let pendiente = false;
function programar() { if (!pendiente) { pendiente = true; requestAnimationFrame(() => { pendiente = false; dibujar(); }); } }
function dibujar() {
  if (!vista()) return;
  const ver = $('calco-ver').checked;
  capa.style.display = ver ? '' : 'none';
  gVec.replaceChildren(); gSym.replaceChildren(); gSel.replaceChildren();
  if (!ver) return;
  const ord = enOrden();   // 12-11-2026: orden elegido por el usuario (campo «z»)
  ord.forEach(([id, o]) => { if (o.k) feat(gVec, o, id, toScr, true); });
  if (armed && armed.k && draft.length) feat(gVec, { k: armed.k, tipo: armed.tipo, bando: armed.bando, et: '', p: draft }, null, toScr, true);
  ord.forEach(([id, o]) => { if (!o.k) simbolo(gSym, o, id, toScr, V.k, true); });
  seleccion();
}
function enOrden() { return [...S.entries()].map((e, n) => [e, n]).sort((a, b) => ((a[0][1].z ?? a[1]) - (b[0][1].z ?? b[1])) || a[1] - b[1]).map(x => x[0]); }
function tamPx(o, k) { return Math.max(22, o.tam * k); }
function simbolo(par, o, id, P, k, vivo) {
  const [px, py] = P(o.x, o.y), z = tamPx(o, k);
  const g = el(par, 'g', { transform: `translate(${px.toFixed(1)} ${py.toFixed(1)}) rotate(${o.rot || 0})`, opacity: (o.op ?? 100) / 100 });
  g.style.color = color(o.bando);
  if (vivo) { g.setAttribute('class', 'cf' + (o.prev ? ' prev' : '')); g.dataset.id = id; el(g, 'rect', { x: -z / 2, y: -z / 2, width: z, height: z, fill: 'transparent', class: 'hit' }); }
  const n = el(g, 'svg', { x: -z / 2, y: -z / 2, width: z, height: z, viewBox: '0 0 200 200', overflow: 'visible' });
  if (vivo) n.style.cssText = `width:${z}px;height:${z}px`; // la hoja del geovisor fija .map svg{width:100%}
  n.innerHTML = SVG[o.key] || SVG.unidad || '<rect x="30" y="55" width="140" height="90" fill="#fff" stroke="currentColor" stroke-width="5"/>';
  if (o.prev && !vivo) n.querySelectorAll('*').forEach(e => e.setAttribute('stroke-dasharray', '14 10'));
  textos(o).forEach(([t, x, y, a]) => { el(n, 'text', { x, y, 'text-anchor': a, class: 'st', style: vivo ? null : 'font:700 30px Arial,sans-serif;fill:currentColor' }).textContent = t; });
  return g;
}
function feat(par, o, id, P, vivo) {
  const st = STY[o.k + o.tipo] || {}, q = [];
  for (let i = 0; i < o.p.length; i += 2) q.push(P(o.p[i], o.p[i + 1]));
  const g = el(par, 'g', { class: id && vivo ? 'cv' : null, 'data-id': id });
  g.style.color = id ? color(o.bando) : '#b28405';
  if (id && o.op != null && o.op < 100) g.setAttribute('opacity', o.op / 100);
  const pts = q.map(a => a[0].toFixed(1) + ',' + a[1].toFixed(1)).join(' '), w = st.w || 2.5, dash = st.d || !id ? '10 7' : null, zona = o.k === 'z' && q.length > 2;
  if (q.length > 1) {
    if (vivo) el(g, zona ? 'polygon' : 'polyline', { points: pts, fill: zona ? '#000' : 'none', 'fill-opacity': 0, stroke: '#000', 'stroke-opacity': 0, 'stroke-width': 18, class: 'hitl' });
    if (!st.nol) el(g, zona ? 'polygon' : 'polyline', { points: pts, fill: zona ? (st.fill ? 'currentColor' : '#fff') : 'none', 'fill-opacity': zona ? (st.fill ? .3 : .12) : null,
      stroke: 'currentColor', 'stroke-width': w, 'stroke-opacity': st.o, 'stroke-dasharray': dash, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  }
  const anillo = zona ? q.concat([q[0]]) : q;
  if (st.a && q.length > 1) {
    const [ax, ay] = q[q.length - 2], [bx, by] = q[q.length - 1], t = Math.atan2(by - ay, bx - ax), z = Math.max(14, w * 2.4);
    const f = (d, k) => (bx + Math.cos(t + d) * k).toFixed(1) + ',' + (by + Math.sin(t + d) * k).toFixed(1);
    el(g, 'polygon', { points: f(0, z * .9) + ' ' + f(2.5, z) + ' ' + f(-2.5, z), fill: 'currentColor' });
    if (st.a0) {
      const [cx, cy] = q[1], [dx, dy] = q[0], t0 = Math.atan2(dy - cy, dx - cx);
      const f0 = (d, k) => (dx + Math.cos(t0 + d) * k).toFixed(1) + ',' + (dy + Math.sin(t0 + d) * k).toFixed(1);
      el(g, 'polygon', { points: f0(0, z * .9) + ' ' + f0(2.5, z) + ' ' + f0(-2.5, z), fill: 'currentColor' });
    }
  }
  if (zona && st.inn) {
    const xs = q.map(a => a[0]), ys = q.map(a => a[1]), paso = st.gap ? 34 : 20; let n = 0;
    if ((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys)) / (paso * paso) < 6000) {
      const dentro = (x, y) => { let c = false; for (let i = 0, j = q.length - 1; i < q.length; j = i++) { const [xi, yi] = q[i], [xj, yj] = q[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
      for (let y = Math.min(...ys) + paso / 2; y < Math.max(...ys); y += paso) for (let x = Math.min(...xs) + paso / 2; x < Math.max(...xs); x += paso) {
        if (!dentro(x, y)) continue; n++;
        const ap = st.inn === 'ox' || (st.inn === 'mix' && n % 2 === 0);
        if (ap) el(g, 'path', { d: `M${x - 6},${y - 6}l12,12m0,-12l-12,12`, stroke: 'currentColor', 'stroke-width': 1.3, fill: 'none' });
        el(g, 'circle', { cx: x, cy: y, r: ap ? 3.5 : 4.5, fill: 'currentColor' });
      }
    }
  }
  if (st.deco) {
    const paso = st.deco === 'h' ? 9 : st.deco === 'x' ? 13 : st.deco === 'c' ? 10 : st.deco.includes('M') ? 46 : 22; let resto = paso / 2, n = 0, total = 0;
    for (let i = 1; i < anillo.length && total < 4000; i++) {
      const [ax, ay] = anillo[i - 1], [bx, by] = anillo[i], L = Math.hypot(bx - ax, by - ay); if (!L) continue;
      const ux = (bx - ax) / L, uy = (by - ay) / L;
      for (let d = resto; d < L && total < 4000; d += paso) {
        const x = ax + ux * d, y = ay + uy * d; n++; total++;
        if (st.deco === 'c') { el(g, 'circle', { cx: x, cy: y, r: 4.5, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.6 }); continue; }
        if (st.deco === 'M' || st.deco === 'xM') { el(g, 'text', { x, y: y + 5, 'text-anchor': 'middle', class: 'vm', style: vivo ? null : 'font:700 14px Arial,sans-serif;fill:currentColor' }).textContent = st.deco === 'xM' && n % 2 === 0 ? 'x' : 'M'; continue; }
        if (st.deco === 'h') el(g, 'line', { x1: x, y1: y, x2: x + (ux * .5 + uy) * 9, y2: y + (uy * .5 - ux) * 9, stroke: 'currentColor', 'stroke-width': 1.3 });
        else if (st.deco === 'x') el(g, 'path', { d: `M${x - 4},${y - 4}l8,8m0,-8l-8,8`, stroke: 'currentColor', 'stroke-width': 1.8, fill: 'none' });
        else { if (st.deco === 'ox') el(g, 'path', { d: `M${x - 7},${y - 7}l14,14m0,-14l-14,14`, stroke: 'currentColor', 'stroke-width': 1.3, fill: 'none' }); el(g, 'circle', { cx: x, cy: y, r: 4.5, fill: 'currentColor' }); }
      }
      resto = (resto - L % paso + paso) % paso;
    }
  }
  if (id) {
    const sg = sigla(o), txt = (sg + ' ' + (o.et || '') + (o.fh ? ' · ' + o.fh : '')).trim();
    const lab = (x, y) => { if (txt) el(g, 'text', { x, y, 'text-anchor': 'middle', class: 'vl', style: vivo ? null : 'font:700 13px Arial,sans-serif;fill:currentColor;stroke:#fff;stroke-width:3.5px;paint-order:stroke' }).textContent = txt; };
    if (zona) { const c = q.reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]); lab(c[0] / q.length, c[1] / q.length + 5); }
    else if (q.length > 1) {
      if (sg) { lab(q[0][0], q[0][1] - 9); if (!st.a) lab(q[q.length - 1][0], q[q.length - 1][1] - 9); }
      else { const m = Math.floor((q.length - 1) / 2); lab((q[m][0] + q[m + 1][0]) / 2, (q[m][1] + q[m + 1][1]) / 2 - 9); }
    }
  }
  if (vivo && !id) q.forEach(a => el(g, 'circle', { cx: a[0], cy: a[1], r: 5, class: 'vd' }));
  return g;
}
function seleccion() {
  const o = sel && S.get(sel); if (!o) return;
  if (o.k) {
    const q = []; for (let i = 0; i < o.p.length; i += 2) q.push(toScr(o.p[i], o.p[i + 1]));
    q.forEach((a, i) => { el(gSel, 'circle', { cx: a[0], cy: a[1], r: 9, class: 'vh', 'data-i': i }); el(gSel, 'text', { x: a[0] + 12, y: a[1] - 10, class: 'vp' }).textContent = (o.k === 'z' ? 'V' : 'P') + (i + 1); });
    const ce = puntosFig(o).pop(), [cx, cy] = toScr(ce[1], ce[2]);
    el(gSel, 'path', { d: `M${cx - 9},${cy}h18M${cx},${cy - 9}v18`, stroke: '#b28405', 'stroke-width': 3, 'pointer-events': 'none' });
    return;
  }
  const [px, py] = toScr(o.x, o.y), z = Math.max(40, tamPx(o, V.k));
  const g = el(gSel, 'g', { transform: `translate(${px} ${py}) rotate(${o.rot || 0})` });
  el(g, 'rect', { x: -z / 2, y: -z / 2, width: z, height: z, class: 'sb' });
  el(g, 'line', { x1: 0, y1: -z / 2, x2: 0, y2: -z / 2 - 26, class: 'sb' });
  for (const [cx, cy, c] of [[-1, -1, 'nwse'], [1, -1, 'nesw'], [-1, 1, 'nesw'], [1, 1, 'nwse']])
    el(g, 'rect', { x: cx * z / 2 - 8, y: cy * z / 2 - 8, width: 16, height: 16, class: 'sh', 'data-m': 'resize', style: `cursor:${c}-resize` });
  el(g, 'circle', { cx: 0, cy: -z / 2 - 26, r: 9, class: 'sh', 'data-m': 'rotate', style: 'cursor:grab' });
}

/* ---------- ficha de edición con coordenadas ---------- */
const UA = 6378137, UE2 = 0.00669438, UK0 = 0.9996, UEP = UE2 / (1 - UE2), UE1 = (1 - Math.sqrt(1 - UE2)) / (1 + Math.sqrt(1 - UE2));
function toUTM(lat, lon, zona) {
  const f = lat * Math.PI / 180, l0 = ((zona - 1) * 6 - 180 + 3) * Math.PI / 180, sn = Math.sin(f), cs = Math.cos(f), tn = Math.tan(f);
  const N = UA / Math.sqrt(1 - UE2 * sn * sn), T = tn * tn, C = UEP * cs * cs, A = cs * (lon * Math.PI / 180 - l0);
  const M = UA * ((1 - UE2 / 4 - 3 * UE2 * UE2 / 64 - 5 * UE2 ** 3 / 256) * f - (3 * UE2 / 8 + 3 * UE2 * UE2 / 32 + 45 * UE2 ** 3 / 1024) * Math.sin(2 * f) + (15 * UE2 * UE2 / 256 + 45 * UE2 ** 3 / 1024) * Math.sin(4 * f) - (35 * UE2 ** 3 / 3072) * Math.sin(6 * f));
  const E = UK0 * N * (A + (1 - T + C) * A ** 3 / 6 + (5 - 18 * T + T * T + 72 * C - 58 * UEP) * A ** 5 / 120) + 500000;
  let No = UK0 * (M + N * tn * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A ** 4 / 24 + (61 - 58 * T + T * T + 600 * C - 330 * UEP) * A ** 6 / 720)); if (lat < 0) No += 10000000; return [E, No];
}
function fromUTM(E, No, zona, sur) {
  const x = E - 500000, y = sur ? No - 10000000 : No, M = y / UK0, mu = M / (UA * (1 - UE2 / 4 - 3 * UE2 * UE2 / 64 - 5 * UE2 ** 3 / 256));
  const p1 = mu + (3 * UE1 / 2 - 27 * UE1 ** 3 / 32) * Math.sin(2 * mu) + (21 * UE1 * UE1 / 16 - 55 * UE1 ** 4 / 32) * Math.sin(4 * mu) + (151 * UE1 ** 3 / 96) * Math.sin(6 * mu);
  const sn = Math.sin(p1), cs = Math.cos(p1), tn = Math.tan(p1), N1 = UA / Math.sqrt(1 - UE2 * sn * sn), T1 = tn * tn, C1 = UEP * cs * cs, R1 = UA * (1 - UE2) / Math.pow(1 - UE2 * sn * sn, 1.5), D = x / (N1 * UK0);
  const lat = p1 - (N1 * tn / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * UEP) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * UEP - 3 * C1 * C1) * D ** 6 / 720);
  const lon = ((zona - 1) * 6 - 180 + 3) * Math.PI / 180 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * UEP + 24 * T1 * T1) * D ** 5 / 120) / cs;
  return [lat * 180 / Math.PI, lon * 180 / Math.PI];
}
function puntosFig(o) {
  if (!o.k) return [['Centro', o.x, o.y]];
  const P = []; for (let i = 0; i < o.p.length; i += 2) P.push([o.p[i], o.p[i + 1]]);
  const filas = P.map((q, i) => [(o.k === 'z' ? 'V' : 'P') + (i + 1), q[0], q[1]]); let c;
  if (o.k === 'z' && P.length > 2) {
    let A = 0, cx = 0, cy = 0; const [x0, y0] = P[0];
    for (let i = 0; i < P.length; i++) { const x1 = P[i][0] - x0, y1 = P[i][1] - y0, x2 = P[(i + 1) % P.length][0] - x0, y2 = P[(i + 1) % P.length][1] - y0, f = x1 * y2 - x2 * y1; A += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f; }
    c = Math.abs(A) > 1e-9 ? [x0 + cx / (3 * A), y0 + cy / (3 * A)] : P[0];
  } else {
    let L = 0; const seg = []; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(d); L += d; }
    let m = L / 2; c = P[0];
    for (let i = 1; i < P.length; i++) { if (m <= seg[i - 1]) { const k = seg[i - 1] ? m / seg[i - 1] : 0; c = [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * k, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * k]; break; } m -= seg[i - 1]; }
  }
  return filas.concat([['Centro', c[0], c[1]]]);
}
let coordTxt = '', coordSig = '';
function ficha() {
  const o = sel && S.get(sel); ed.hidden = !o; if (!o) return;
  $('ce-nom').textContent = o.k ? o.tipo : (NAME[o.key] || o.key) + ' · ' + Math.round(o.tam) + ' m · ' + Math.round(o.rot || 0) + '°';
  const filas = puntosFig(o), sig = JSON.stringify(filas.map(f => [f[1].toFixed(0), f[2].toFixed(0)]));
  if (sig === coordSig) return; coordSig = sig;
  const ce = filas[filas.length - 1], [lo0, la0] = ll(ce[1], ce[2]), zona = Math.floor((lo0 + 180) / 6) + 1, t = $('ce-tab'); t.replaceChildren();
  const cab = ['Punto', 'Latitud', 'Longitud', 'UTM Este', 'UTM Norte'], tr = document.createElement('tr');
  cab.forEach(h => { const th = document.createElement('th'); th.textContent = h; tr.append(th); }); t.append(tr);
  const lineas = [cab.join('\t')];
  filas.forEach(([n, x, y]) => {
    const [lo, la] = ll(x, y), [E, N] = toUTM(la, lo, zona), v = [n, la.toFixed(6), lo.toFixed(6), E.toFixed(0), N.toFixed(0)], r = document.createElement('tr');
    if (n === 'Centro') r.className = 'c';
    v.forEach(s => { const td = document.createElement('td'); td.textContent = s; r.append(td); }); t.append(r); lineas.push(v.join('\t'));
  });
  const z = 'UTM ' + zona + (la0 < 0 ? 'S' : 'N') + ' · WGS 84'; $('ce-zona').textContent = z;
  coordTxt = (o.k ? o.tipo : (NAME[o.key] || o.key)) + '\n' + lineas.join('\n') + '\n' + z;
}
function select(id) {
  sel = id && S.has(id) ? id : null; coordSig = ''; const o = sel && S.get(sel);
  ficha(); programar(); if (!o) return;
  ed.querySelectorAll('.ps').forEach(e => e.hidden = !!o.k); ed.querySelectorAll('.pv').forEach(e => e.hidden = !o.k);
  // 10-11-2026: las tareas tácticas y los obstáculos no llevan escalón, designaciones ni textos
  if (!o.k && /^Tareas t[aá]cticas|Minas y trampas|Obst[aá]culo/i.test(GRP[o.key] || '')) ['ce-esc', 'ce-izq', 'ce-der', 'ce-cen', 'ce-aba'].forEach(id => { const l = $(id).closest('label'); if (l) l.hidden = true; });
  const gr = GRP[o.k ? o.k + o.tipo : o.key] || ''; $('ce-ref').href = REGL + '#page=' + pagDe(gr); $('ce-ref').textContent = '📖 Referencia en el reglamento · pág. ' + pagDe(gr) + (gr ? ' (' + gr.replace(/^\d+\.\s*/, '') + ')' : ''); $('ce-op').value = o.op ?? 100; $('ce-opn').textContent = (o.op ?? 100) + ' %';
  if (o.k) { $('ce-et').value = o.et || ''; $('ce-fh').value = o.fh || ''; tipos(o); }
  else { $('ce-esc').value = o.esc || ''; $('ce-izq').value = o.izq || ''; $('ce-der').value = o.der || ''; $('ce-cen').value = o.cen || ''; $('ce-aba').value = o.aba || ''; $('ce-prev').checked = !!o.prev; }
}
function tipos(o) {   // selector del tipo de línea o de zona, agrupado como en el reglamento
  const sl = $('ce-tipo'), lista = o.k === 'l' ? LIN : ZON, falta = !STY[o.k + o.tipo]; sl.replaceChildren();
  $('ce-tipo-t').textContent = o.k === 'l' ? 'Tipo de línea' : 'Tipo de zona o área'; sl.closest('label').classList.toggle('falta', falta);
  if (falta) { const op = document.createElement('option'); op.value = ''; op.textContent = '— Elija el tipo —'; op.selected = true; op.disabled = true; sl.append(op); }
  const grupos = new Map(); lista.forEach(([n, st]) => { const g = grupoLZ(o.k, st.b || 'Propio'); (grupos.get(g) || grupos.set(g, []).get(g)).push(n); });
  [...grupos].sort((x, y) => parseInt(x[0]) - parseInt(y[0])).forEach(([g, ns]) => { const og = document.createElement('optgroup'); og.label = g.replace(/^\d+\.\s*/, ''); ns.forEach(n => { const op = document.createElement('option'); op.value = n; op.textContent = n; if (n === o.tipo) op.selected = true; og.append(op); }); sl.append(og); });
  if (falta) setTimeout(() => { try { sl.focus(); } catch (e) { } }, 50);
}
$('ce-tipo').onchange = e => { const v = e.target.value, o = sel && S.get(sel); if (!o || !o.k || !v) return; const st = STY[o.k + v] || {}; cambiar(n => { n.tipo = v; n.bando = st.b || 'Propio'; }); select(sel); };
window.EMTE_CALCO_SEL = () => sel;   // para calco-dobleclic.js (02-11-2026)
function cambiar(f) { const o = sel && S.get(sel); if (!o) return; const n = JSON.parse(JSON.stringify(o)); f(n); poner(sel, n); ficha(); }
$('ce-men').onclick = () => cambiar(o => o.tam = Math.max(20, Math.round(o.tam / 1.15)));
$('ce-mas').onclick = () => cambiar(o => o.tam = Math.min(200000, Math.round(o.tam * 1.15)));
$('ce-rl').onclick = () => cambiar(o => o.rot = ((o.rot || 0) - 15 + 360) % 360);
$('ce-rr').onclick = () => cambiar(o => o.rot = ((o.rot || 0) + 15) % 360);
$('ce-esc').onchange = e => cambiar(o => o.esc = e.target.value);
for (const [id, k] of [['ce-izq', 'izq'], ['ce-der', 'der'], ['ce-cen', 'cen'], ['ce-aba', 'aba'], ['ce-et', 'et'], ['ce-fh', 'fh']])
  $(id).onchange = e => cambiar(o => o[k] = e.target.value.trim());
$('ce-prev').onchange = e => cambiar(o => o.prev = e.target.checked ? 1 : 0);
$('ce-op').oninput = e => { const o = sel && S.get(sel); if (!o) return; o.op = +e.target.value; $('ce-opn').textContent = o.op + ' %'; programar(); };
$('ce-op').onchange = e => cambiar(o => o.op = +e.target.value);
$('ce-del').onclick = () => { if (sel) quitar(sel); };
// 12-11-2026: orden de dibujo de los símbolos, líneas y zonas (los de más arriba tapan a los de abajo)
function ordenar(modo) {
  const o = sel && S.get(sel); if (!o) return;
  const T = enOrden(), zg = new Map(T.map(([id, x], n) => [id, x.z ?? n]));
  const L = T.filter(([, x]) => !!x.k === !!o.k), i = L.findIndex(([id]) => id === sel); if (i < 0) return;
  const zs = L.map(([id]) => zg.get(id));
  if (modo === 'frente') cambiar(n => { n.z = Math.max(...zs) + 1; });
  else if (modo === 'fondo') cambiar(n => { n.z = Math.min(...zs) - 1; });
  else {
    const j = i + (modo === 'subir' ? 1 : -1); if (j < 0 || j >= L.length) return;
    const otro = L[j][0], zo = zs[j], zy = zs[i], nz = zo === zy ? zo + (modo === 'subir' ? 1 : -1) : zo;
    const ov = JSON.parse(JSON.stringify(S.get(otro))); ov.z = zy; poner(otro, ov);
    cambiar(n => { n.z = nz; });
  }
}
$('ce-frente').onclick = () => ordenar('frente'); $('ce-fondo').onclick = () => ordenar('fondo');
$('ce-subir').onclick = () => ordenar('subir'); $('ce-bajar').onclick = () => ordenar('bajar');
$('ce-ok').onclick = $('ce-x').onclick = () => select(null);
$('ce-copy').onclick = async () => {
  const b = $('ce-copy');
  try { await navigator.clipboard.writeText(coordTxt); b.textContent = 'Copiadas'; }
  catch (e) { const r = document.createRange(); r.selectNodeContents($('ce-tab')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Ctrl+C'; }
  setTimeout(() => b.textContent = 'Copiar', 2500);
};

/* ---------- guardado: PostgreSQL mediante el servidor, o este navegador ---------- */
const LOCAL = 'planeamiento-calco-geovisor';
function contar() { $('calco-n').textContent = S.size; }
function guardarLocal() { try { localStorage.setItem(LOCAL, JSON.stringify([...S])); } catch (e) { } }
function persistir(id) {
  if (!remoto) { guardarLocal(); return; }
  const o = S.get(id), datos = o ? JSON.stringify(o) : null;
  pend[id] = (pend[id] || 0) + 1; hold[id] = Date.now() + 6000;
  cola[id] = (cola[id] || Promise.resolve()).then(async () => {
    const r = await fetch('/api/planeamiento/' + encodeURIComponent(id), datos ? { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: datos } : { method: 'DELETE' });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'Error ' + r.status); }
    aviso('Calco guardado en PostgreSQL (esquema planeamiento) · ' + new Date().toLocaleTimeString('es-BO'));
  }).catch(e => { aviso('No se pudo guardar el último cambio: ' + e.message + ' Se reintentará al volver a editar.', true); guardarLocal(); })
    .then(() => { pend[id]--; hold[id] = Date.now() + 4000; });
}
function poner(id, o) { S.set(id, o); contar(); persistir(id); programar(); }
function quitar(id) { S.delete(id); contar(); persistir(id); if (sel === id) select(null); programar(); }
const nuevoId = () => 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

async function sincronizar(primera) {
  let d;
  try {
    const r = await fetch('/api/planeamiento', { cache: 'no-store' });
    d = await r.json(); if (!r.ok) throw new Error(d.error || 'Error ' + r.status);
  } catch (e) {
    if (primera) {
      remoto = false;
      try { JSON.parse(localStorage.getItem(LOCAL) || '[]').forEach(([id, o]) => S.set(id, o)); } catch (_) { }
      aviso('Sin conexión con el calco de PostgreSQL. Los cambios se guardan solo en este navegador.', true);
      contar(); programar(); cargado = true;
    }
    return;
  }
  remoto = true;
  const ahora = Date.now(), ocupado = id => id === arr.id || pend[id] || ahora < (hold[id] || 0);
  const vistos = new Set(Object.keys(d.figuras));
  for (const [id, o] of Object.entries(d.figuras)) if (!ocupado(id)) S.set(id, o);
  for (const id of [...S.keys()]) if (!vistos.has(id) && !ocupado(id)) { S.delete(id); if (sel === id) select(null); }
  if (primera) { aviso('Calco conectado a PostgreSQL (esquema planeamiento). Los cambios se comparten con QGIS y con quien use el geovisor.'); cargado = true; }
  contar(); if (sel) ficha(); programar();
}

/* ---------- colocar y dibujar ---------- */
function armar(a) {
  armed = a; draft = [];
  map.classList.toggle('calco-armado', !!a); msg.hidden = !a;
  const vec = !!(a && a.k); $('calco-fin').hidden = $('calco-undo').hidden = !vec;
  document.querySelectorAll('.calco-it').forEach(b => b.classList.toggle('on', !!a && b.dataset.key === (vec ? a.k + a.tipo : a)));
  if (a) { $('calco-msgt').textContent = vec ? 'Toca el mapa para marcar cada punto de la ' + (a.k === 'l' ? 'línea' : 'zona') + '; al terminar eliges su tipo.' : 'Toca el mapa para colocar: ' + NAME[a]; select(null); }
  programar();
}
function colocar(px, py) {
  if (!vista()) return;
  const [x, y] = toMap(px, py);
  if (armed.k) {
    draft.push(r1(x), r1(y)); const n = draft.length / 2, falta = (armed.k === 'z' ? 3 : 2) - n;
    $('calco-msgt').textContent = (armed.k === 'l' ? 'Línea' : 'Zona') + ': ' + n + ' punto(s). ' + (falta > 0 ? 'Faltan ' + falta + '.' : 'Pulsa Terminar cuando acabes.');
    programar(); return;
  }
  const clave = armed, b = CATB[clave] || 'Propio';
  const id = nuevoId(); armar(null);
  poner(id, { key: clave, bando: b, x: r1(x), y: r1(y), tam: Math.max(20, Math.round(56 / V.k)), rot: 0, esc: '', izq: '', der: '', cen: '', aba: '', prev: 0, op: 100 });
  select(id);
}
function terminar() {
  if (!armed || !armed.k) return; const need = armed.k === 'z' ? 3 : 2;
  if (draft.length / 2 < need) { $('calco-msgt').textContent = 'Hacen falta al menos ' + need + ' puntos.'; return; }
  const id = nuevoId(), o = { k: armed.k, tipo: armed.tipo, bando: armed.bando, et: '', fh: '', op: 100, p: draft.slice() };
  armar(null); poner(id, o); select(id);
}
$('calco-fin').onclick = terminar;
$('calco-undo').onclick = () => { draft.splice(-2); $('calco-msgt').textContent = armed.tipo + ': ' + draft.length / 2 + ' punto(s).'; programar(); };
$('calco-cancel').onclick = () => armar(null);

// Clic sobre el mapa del geovisor: coloca o deselecciona. Se respeta el arrastre del mapa.
let arrastroMapa = false;
svgMapa.addEventListener('pointerup', () => { arrastroMapa = typeof mapDragged !== 'undefined' && mapDragged; });
svgMapa.addEventListener('click', e => {
  if (arrastroMapa) { arrastroMapa = false; return; }
  if (armed) { e.stopImmediatePropagation(); e.preventDefault(); const r = map.getBoundingClientRect(); colocar(e.clientX - r.left, e.clientY - r.top); }
  else if (sel) select(null);
}, { capture: true });

/* ---------- mover, estirar, girar y editar vértices ---------- */
const arr = { id: null, modo: null, vi: 0, x: 0, y: 0, movio: false, obra: null };
capa.addEventListener('pointerdown', e => {
  if (e.button || armed) return;
  const t = e.target, h = t.closest('.sh'), vh = t.closest('.vh'), f = t.closest('.cf,.cv');
  let id = null, modo = 'mover';
  if (h && sel) { id = sel; modo = h.dataset.m; }
  else if (vh && sel) { id = sel; modo = 'vertice'; arr.vi = +vh.dataset.i; }
  else if (f) id = f.dataset.id;
  if (!id || !S.has(id)) return;
  e.stopPropagation(); e.preventDefault();
  if (id !== sel) select(id);
  Object.assign(arr, { id, modo, x: e.clientX, y: e.clientY, movio: false, obra: JSON.parse(JSON.stringify(S.get(id))) });
  S.set(id, arr.obra);
});
window.addEventListener('pointermove', e => {
  if (!arr.id) return;
  if (!arr.movio && Math.hypot(e.clientX - arr.x, e.clientY - arr.y) < 4) return;
  arr.movio = true; vista();
  const o = arr.obra, mx = e.clientX - V.r.left, my = e.clientY - V.r.top, dx = (e.clientX - arr.x) / V.k, dy = (e.clientY - arr.y) / V.k;
  arr.x = e.clientX; arr.y = e.clientY;
  if (o.k) {
    if (arr.modo === 'vertice') { const [x, y] = toMap(mx, my); o.p[arr.vi * 2] = x; o.p[arr.vi * 2 + 1] = y; }
    else for (let i = 0; i < o.p.length; i += 2) { o.p[i] += dx; o.p[i + 1] -= dy; }
  } else {
    const [cx, cy] = toScr(o.x, o.y), ax = mx - cx, ay = my - cy;
    if (arr.modo === 'resize') o.tam = Math.min(200000, Math.max(20, Math.hypot(ax, ay) * Math.SQRT2 / V.k));
    else if (arr.modo === 'rotate') o.rot = Math.round((Math.atan2(ax, -ay) * 180 / Math.PI + 360) % 360);
    else { o.x += dx; o.y -= dy; }
  }
  ficha(); programar();
});
function soltar() {
  if (!arr.id) return; const id = arr.id, o = arr.obra, movio = arr.movio; arr.id = null; arr.obra = null;
  if (!movio) return;
  if (o.k) o.p = o.p.map(r1); else { o.x = r1(o.x); o.y = r1(o.y); o.tam = Math.round(o.tam); }
  poner(id, o); ficha();
}
window.addEventListener('pointerup', soltar); window.addEventListener('pointercancel', soltar);
// La rueda sobre una figura sigue acercando el mapa; con Ctrl cambia el tamaño del símbolo seleccionado.
capa.addEventListener('wheel', e => {
  const o = sel && S.get(sel);
  if (e.ctrlKey && o && !o.k) { e.preventDefault(); cambiar(n => n.tam = Math.max(20, Math.round(n.tam * (e.deltaY < 0 ? 1.1 : 1 / 1.1)))); return; }
  e.preventDefault(); svgMapa.dispatchEvent(new WheelEvent('wheel', e));
}, { passive: false });
document.addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea')) return;
  if (e.key === 'Escape' && (armed || sel)) { armar(null); select(null); }
  if (e.key === 'Enter' && armed && armed.k) terminar();
  if (!sel) return;
  if (e.key === 'Delete') quitar(sel);
  if (e.key === 'PageUp') { e.preventDefault(); ordenar(e.shiftKey ? 'frente' : 'subir'); }
  if (e.key === 'PageDown') { e.preventDefault(); ordenar(e.shiftKey ? 'fondo' : 'bajar'); }
  if (e.key === '+' || e.key === '=') cambiar(o => { if (!o.k) o.tam = Math.round(o.tam * 1.1); });
  if (e.key === '-') cambiar(o => { if (!o.k) o.tam = Math.max(20, Math.round(o.tam / 1.1)); });
});

/* ---------- catálogo en cascada ---------- */
function grupo(nombre, n, abierto) {
  const d = document.createElement('details'); d.open = abierto;
  const sm = document.createElement('summary'); sm.textContent = nombre + ' '; const k = document.createElement('small'); k.textContent = '(' + n + ')'; sm.append(k);
  const rf = document.createElement('a'); rf.className = 'calco-pag'; rf.href = REGL + '#page=' + pagDe(nombre); rf.target = '_blank'; rf.rel = 'noopener';
  rf.textContent = '📖 pág. ' + pagDe(nombre); rf.title = 'Ver en el reglamento'; rf.addEventListener('click', e => e.stopPropagation()); sm.append(rf);
  d.append(sm); $('calco-cat').append(d); return d;
}
function boton(d, clave, icono, nombre, alPulsar, arrastrable) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'calco-it'; b.dataset.key = clave;
  const t = document.createElement('span'); t.textContent = nombre; b.append(icono, t); d.append(b);
  let pal = null, saltar = false;
  b.onclick = () => { if (saltar) { saltar = false; return; } alPulsar(); };
  if (!arrastrable) return;
  const fantasma = document.createElement('div'); fantasma.className = 'calco-ghost'; fantasma.hidden = true;
  b.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' || e.button) return; pal = { x: e.clientX, y: e.clientY, on: false }; b.setPointerCapture(e.pointerId); });
  b.addEventListener('pointermove', e => {
    if (!pal) return;
    if (!pal.on && Math.hypot(e.clientX - pal.x, e.clientY - pal.y) > 8) { pal.on = true; fantasma.replaceChildren(icono.cloneNode(true)); fantasma.style.color = icono.style.color; document.body.append(fantasma); fantasma.hidden = false; }
    if (pal.on) { fantasma.style.left = e.clientX + 'px'; fantasma.style.top = e.clientY + 'px'; }
  });
  const fin = e => {
    if (!pal) return; const on = pal.on; pal = null; if (!on) return;
    fantasma.remove(); saltar = true; setTimeout(() => saltar = false, 0);
    const r = map.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (e.type === 'pointerup' && x >= 0 && y >= 0 && x <= r.width && y <= r.height) { armar(null); armed = clave; colocar(x, y); }
  };
  b.addEventListener('pointerup', fin); b.addEventListener('pointercancel', fin);
}
function catalogo(cat) {
  const grupos = new Map();
  cat.forEach(c => { NAME[c.key] = c.nombre; CATB[c.key] = c.bando; GRP[c.key] = c.cat; (grupos.get(c.cat) || grupos.set(c.cat, []).get(c.cat)).push(c); });
  let primero = true;
  grupos.forEach((items, nombre) => {
    const d = grupo(nombre, items.length, primero); primero = false;
    items.forEach(c => {
      const g = document.createElementNS(NS, 'svg'); g.setAttribute('viewBox', '0 0 200 200'); g.innerHTML = SVG[c.key] || ''; g.style.color = color(c.bando);
      boton(d, c.key, g, c.nombre, () => armar(armed === c.key ? null : c.key), true);
    });
  });
  // Líneas y zonas: un solo botón para cada una; el tipo se elige en la ficha después de dibujarla.
  const d = grupo('17. Líneas tácticas y zonas', 2, false);
  [['l', SIN.l, 'Línea', { d: 'M5,26 L20,14 L35,22', fill: 'none', stroke: 'currentColor', 'stroke-width': 3 }],
   ['z', SIN.z, 'Zona / área', { d: 'M8,12 L32,8 L35,30 L10,33 Z', fill: 'currentColor', 'fill-opacity': .18, stroke: 'currentColor', 'stroke-width': 2.5 }]].forEach(([k, tipo, nom, at]) => {
    GRP[k + tipo] = '17. Líneas tácticas y zonas';
    const g = document.createElementNS(NS, 'svg'); g.setAttribute('viewBox', '0 0 40 40'); g.style.color = color('Propio'); el(g, 'path', at);
    boton(d, k + tipo, g, nom, () => armar(armed && armed.k === k ? null : { k, tipo, bando: 'Propio' }), false);
  });
}
$('calco-q').oninput = e => {
  const t = e.target.value.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  document.querySelectorAll('#calco-cat details').forEach(d => {
    let alguno = false;
    d.querySelectorAll('.calco-it').forEach(b => { const v = !t || b.textContent.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(t); b.hidden = !v; alguno = alguno || v; });
    d.hidden = !alguno; if (t) d.open = alguno;
  });
};
let borrarT = null;
$('calco-borrar').onclick = e => {
  const b = e.currentTarget;
  if (!S.size) { aviso('El calco no tiene figuras para borrar.'); return; }
  if (!b.classList.contains('confirmar')) {
    b.classList.add('confirmar'); b.textContent = '⚠ ¿Borrar las ' + S.size + ' figuras? Pulsa otra vez para confirmar';
    clearTimeout(borrarT); borrarT = setTimeout(() => { b.classList.remove('confirmar'); b.textContent = '🗑 Borrar toda la simbología de planeamiento'; }, 5000); return;
  }
  clearTimeout(borrarT); const n = S.size; armar(null); select(null);
  for (const id of [...S.keys()]) quitar(id);
  b.classList.remove('confirmar'); b.textContent = '🗑 Borrar toda la simbología de planeamiento';
  aviso('Se borraron ' + n + ' figuras del calco.');
};
$('calco-ver').onchange = programar;
$('calco-ir').onclick = () => {
  if (!S.size) { aviso('El calco todavía no tiene figuras.'); return; }
  let x0 = 1 / 0, y0 = 1 / 0, x1 = -1 / 0, y1 = -1 / 0;
  S.forEach(o => { const P = o.k ? o.p : [o.x, o.y]; for (let i = 0; i < P.length; i += 2) { x0 = Math.min(x0, P[i]); x1 = Math.max(x1, P[i]); y0 = Math.min(y0, P[i + 1]); y1 = Math.max(y1, P[i + 1]); } });
  const [ax, ay] = aEscena(x0, y1), [bx, by] = aEscena(x1, y0), cx = (ax + bx) / 2, cy = (ay + by) / 2;
  const s = Math.max(.65, Math.min(480, Math.min(1000 / Math.max(bx - ax, 1) , 760 / Math.max(by - ay, 1)) * .75));
  scale = s; panX = (500 - cx) * s; panY = (380 - cy) * s; zoom(1);
};
new MutationObserver(programar).observe(scene, { attributes: true, attributeFilter: ['transform'] });
window.addEventListener('resize', programar);
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(programar).observe(map);

/* ---------- exportar: shape (ZIP), GeoJSON y carta ---------- */
const nombreArchivo = () => { const n = $('calco-nombre').value.trim() || 'Calco'; return [n, n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '') || 'Calco']; };
function bajar(nombre, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = d => { let c = 0xFFFFFFFF; for (let i = 0; i < d.length; i++) c = CRC[(c ^ d[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zip(archivos) { // ZIP sin compresión (método «stored»), suficiente para shapefiles pequeños
  const enc = new TextEncoder(), partes = [], central = []; let off = 0;
  for (const [nombre, datos0] of archivos) {
    const datos = typeof datos0 === 'string' ? enc.encode(datos0) : datos0, n = enc.encode(nombre), c = crc32(datos);
    const h = new DataView(new ArrayBuffer(30)); h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint32(14, c, true); h.setUint32(18, datos.length, true); h.setUint32(22, datos.length, true); h.setUint16(26, n.length, true);
    partes.push(new Uint8Array(h.buffer), n, datos);
    const z = new DataView(new ArrayBuffer(46)); z.setUint32(0, 0x02014b50, true); z.setUint16(4, 20, true); z.setUint16(6, 20, true); z.setUint16(8, 0x0800, true); z.setUint32(16, c, true); z.setUint32(20, datos.length, true); z.setUint32(24, datos.length, true); z.setUint16(28, n.length, true); z.setUint32(42, off, true);
    central.push(new Uint8Array(z.buffer), n); off += 30 + n.length + datos.length;
  }
  const tam = central.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, archivos.length, true); e.setUint16(10, archivos.length, true); e.setUint32(12, tam, true); e.setUint32(16, off, true);
  return new Blob([...partes, ...central, new Uint8Array(e.buffer)], { type: 'application/zip' });
}
function shapefile(filas, tipo, F) {
  const n = filas.length, enc = new TextEncoder();
  const geo = filas.map(r => {
    if (tipo === 1) return [r.x, r.y]; let p = r.p.slice();
    if (tipo === 5) { let a = 0; for (let i = 0; i < p.length; i += 2) { const j = (i + 2) % p.length; a += p[i] * p[j + 1] - p[j] * p[i + 1]; } if (a > 0) { const q = []; for (let i = p.length - 2; i >= 0; i -= 2) q.push(p[i], p[i + 1]); p = q; } p.push(p[0], p[1]); }
    return p;
  });
  const tam = g => tipo === 1 ? 28 : 8 + 48 + 8 * g.length;
  const caja = g => { const b = [1 / 0, 1 / 0, -1 / 0, -1 / 0]; for (let i = 0; i < g.length; i += 2) { b[0] = Math.min(b[0], g[i]); b[1] = Math.min(b[1], g[i + 1]); b[2] = Math.max(b[2], g[i]); b[3] = Math.max(b[3], g[i + 1]); } return b; };
  const bb = caja(geo.flat()), total = 100 + geo.reduce((a, g) => a + tam(g), 0);
  const cab = len => { const b = new ArrayBuffer(100), v = new DataView(b); v.setInt32(0, 9994); v.setInt32(24, len / 2); v.setInt32(28, 1000, true); v.setInt32(32, tipo, true); bb.forEach((x, i) => v.setFloat64(36 + i * 8, x, true)); return new Uint8Array(b); };
  const shp = new Uint8Array(total), shx = new Uint8Array(100 + 8 * n), dv = new DataView(shp.buffer), xv = new DataView(shx.buffer);
  shp.set(cab(total)); shx.set(cab(shx.length)); let o = 100;
  geo.forEach((g, i) => {
    const len = tam(g) - 8; dv.setInt32(o, i + 1); dv.setInt32(o + 4, len / 2); xv.setInt32(100 + 8 * i, o / 2); xv.setInt32(104 + 8 * i, len / 2); dv.setInt32(o + 8, tipo, true);
    if (tipo === 1) { dv.setFloat64(o + 12, g[0], true); dv.setFloat64(o + 20, g[1], true); }
    else { caja(g).forEach((x, k) => dv.setFloat64(o + 12 + k * 8, x, true)); dv.setInt32(o + 44, 1, true); dv.setInt32(o + 48, g.length / 2, true); dv.setInt32(o + 52, 0, true); g.forEach((x, k) => dv.setFloat64(o + 56 + k * 8, x, true)); }
    o += len + 8;
  });
  const rl = 1 + F.reduce((a, f) => a + f[2], 0), hl = 32 + 32 * F.length + 1, dbf = new Uint8Array(hl + rl * n + 1), bv = new DataView(dbf.buffer), d = new Date();
  dbf[0] = 3; dbf[1] = d.getFullYear() - 1900; dbf[2] = d.getMonth() + 1; dbf[3] = d.getDate(); bv.setUint32(4, n, true); bv.setUint16(8, hl, true); bv.setUint16(10, rl, true);
  F.forEach((f, i) => { const q = 32 + 32 * i; dbf.set(enc.encode(f[0]), q); dbf[q + 11] = f[1].charCodeAt(0); dbf[q + 16] = f[2]; dbf[q + 17] = f[3] || 0; }); dbf[hl - 1] = 13;
  filas.forEach((r, i) => {
    let q = hl + rl * i; dbf[q++] = 32;
    F.forEach(f => {
      const v = r[f[0]]; let bytes;
      if (f[1] === 'N') bytes = enc.encode(Number(v || 0).toFixed(f[3] || 0).padStart(f[2]).slice(-f[2]));
      else { let t = String(v ?? ''); bytes = enc.encode(t); while (bytes.length > f[2]) { t = t.slice(0, -1); bytes = enc.encode(t); } }
      dbf.fill(32, q, q + f[2]); dbf.set(bytes, q); q += f[2];
    });
  });
  dbf[dbf.length - 1] = 26; return { shp, shx, dbf };
}
const PRJ = 'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]';
function capasShape(pre) {
  const todo = [...S.values()], out = {};
  const pt = todo.filter(o => !o.k).map(o => { const [lon, lat] = ll(o.x, o.y); return { x: o.x, y: o.y, simbolo: o.key, nombre: NAME[o.key] || o.key, bando: o.bando, escalon: o.esc || '', desig_izq: o.izq || '', desig_der: o.der || '', texto_cent: o.cen || '', texto_abaj: o.aba || '', previsto: o.prev ? 1 : 0, tamano: o.tam, rotacion: o.rot || 0, opacidad: o.op ?? 100, lat, lon }; });
  const vf = k => todo.filter(o => o.k === k && o.p.length >= (k === 'z' ? 6 : 4)).map(o => ({ p: o.p, tipo: o.tipo, sigla: sigla(o), etiqueta: o.et || '', fecha_hora: o.fh || '', bando: o.bando, opacidad: o.op ?? 100 }));
  const FV = [['tipo', 'C', 80], ['sigla', 'C', 12], ['etiqueta', 'C', 60], ['fecha_hora', 'C', 30], ['bando', 'C', 20], ['opacidad', 'N', 4, 0]];
  if (pt.length) out[pre + '_simbolos'] = shapefile(pt, 1, [['simbolo', 'C', 40], ['nombre', 'C', 100], ['bando', 'C', 20], ['escalon', 'C', 20], ['desig_izq', 'C', 30], ['desig_der', 'C', 30], ['texto_cent', 'C', 30], ['texto_abaj', 'C', 30], ['previsto', 'N', 2, 0], ['tamano', 'N', 12, 1], ['rotacion', 'N', 8, 1], ['opacidad', 'N', 4, 0], ['lat', 'N', 12, 6], ['lon', 'N', 12, 6]]);
  if (vf('l').length) out[pre + '_lineas'] = shapefile(vf('l'), 3, FV);
  if (vf('z').length) out[pre + '_zonas'] = shapefile(vf('z'), 5, FV);
  return out;
}
$('calco-shape').onclick = () => {
  const [nombre, seguro] = nombreArchivo(), L = capasShape(seguro), capas = Object.keys(L);
  if (!capas.length) { aviso('No hay figuras para guardar.', true); return; }
  const archivos = []; capas.forEach(n => { const f = L[n]; archivos.push([n + '.shp', f.shp], [n + '.shx', f.shx], [n + '.dbf', f.dbf], [n + '.prj', PRJ], [n + '.cpg', 'UTF-8']); });
  bajar(seguro + '_shape.zip', zip(archivos)); aviso('Shape «' + nombre + '» descargado: ' + capas.length + ' capa(s).');
};
$('calco-geojson').onclick = () => {
  const [nombre, seguro] = nombreArchivo(), g = (x, y) => ll(x, y).map(v => +v.toFixed(7)), features = [];
  S.forEach((o, id) => {
    if (!o.k) features.push({ type: 'Feature', id, geometry: { type: 'Point', coordinates: g(o.x, o.y) }, properties: { capa: 'Símbolos militares', simbolo: o.key, nombre: NAME[o.key] || o.key, bando: o.bando, escalon: o.esc || '', desig_izq: o.izq || '', desig_der: o.der || '', texto_centro: o.cen || '', texto_abajo: o.aba || '', previsto: o.prev ? 1 : 0, tamano: o.tam, rotacion: o.rot || 0, opacidad: o.op ?? 100 } });
    else { const P = []; for (let i = 0; i < o.p.length; i += 2) P.push(g(o.p[i], o.p[i + 1]));
      features.push({ type: 'Feature', id, geometry: o.k === 'z' ? { type: 'Polygon', coordinates: [P.concat([P[0]])] } : { type: 'LineString', coordinates: P }, properties: { capa: o.k === 'z' ? 'Zonas y áreas' : 'Líneas tácticas', tipo: o.tipo, sigla: sigla(o), etiqueta: o.et || '', fecha_hora: o.fh || '', bando: o.bando, opacidad: o.op ?? 100 } }); }
  });
  if (!features.length) { aviso('No hay figuras para guardar.', true); return; }
  bajar(seguro + '.geojson', new Blob([JSON.stringify({ type: 'FeatureCollection', name: nombre, features })], { type: 'application/geo+json' }));
};

const fmtN = n => Math.round(n).toLocaleString('es-BO').replace(/,/g, '.');
const cargarImagen = (src, cors) => new Promise(res => { const im = new Image(); if (cors) im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
async function carta(nombre) {
  vista();
  const Wc = 1754, Hc = 1240, fx = 70, fy = 118, fw = 1614, fh = 930, r = V.r;
  const [ax, ay] = toMap(0, 0), [bx, by] = toMap(r.width, r.height), cx = (ax + bx) / 2, cy = (ay + by) / 2;
  const u = Math.max((bx - ax) / fw, (ay - by) / fh), x0 = cx - fw / 2 * u, y1 = cy + fh / 2 * u; // u = metros (EPSG:3857) por píxel de la carta
  const P = (x, y) => [(x - x0) / u, (y1 - y) / u];
  const cv = document.createElement('canvas'); cv.width = Wc; cv.height = Hc; const c = cv.getContext('2d');
  c.fillStyle = '#fff'; c.fillRect(0, 0, Wc, Hc); c.fillStyle = '#e9ece4'; c.fillRect(fx, fy, fw, fh);
  c.save(); c.beginPath(); c.rect(fx, fy, fw, fh); c.clip();
  // 1) mapa base del geovisor (las mismas teselas que se ven en pantalla)
  let baseOk = 0, baseFallo = 0;
  const teselas = [...document.querySelectorAll('#basemap image')];
  await Promise.all(teselas.map(async t => {
    const im = await cargarImagen(t.getAttribute('href'), true); if (!im) { baseFallo++; return; }
    const sx = +t.getAttribute('x'), sy = +t.getAttribute('y'), w = +t.getAttribute('width'), h = +t.getAttribute('height');
    const [mx0, my1] = deEscena(sx, sy), [mx1, my0] = deEscena(sx + w, sy + h), [px0, py0] = P(mx0, my1), [px1, py1] = P(mx1, my0);
    try { c.drawImage(im, fx + px0, fy + py0, px1 - px0, py1 - py0); baseOk++; } catch (e) { baseFallo++; }
  }));
  // 2) capas del geovisor (vías, ríos, agua, límite, salud, educación, ruta, mediciones)
  const [sx0, sy0] = aEscena(x0, y1), [sx1, sy1] = aEscena(x0 + fw * u, y1 - fh * u);
  const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('xmlns', NS); sv.setAttribute('width', fw); sv.setAttribute('height', fh);
  sv.setAttribute('viewBox', `${sx0} ${sy0} ${sx1 - sx0} ${sy1 - sy0}`);
  el(sv, 'style', {}).textContent = '.boundary{stroke:#68754d;stroke-width:2;stroke-dasharray:8 5;fill:none}';
  const g = el(sv, 'g', {});
  for (const hijo of scene.children) { if (hijo.id === 'basemap') continue; const copia = hijo.cloneNode(true); copia.removeAttribute('id'); g.append(copia); }
  const urlA = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(sv)], { type: 'image/svg+xml' }));
  try { const im = await cargarImagen(urlA); if (im) c.drawImage(im, fx, fy, fw, fh); } finally { URL.revokeObjectURL(urlA); }
  // 3) calco militar
  if ($('calco-ver').checked) {
    const sc = document.createElementNS(NS, 'svg'); sc.setAttribute('xmlns', NS); sc.setAttribute('width', fw); sc.setAttribute('height', fh);
    S.forEach((o, id) => { if (o.k) feat(sc, o, id, P, false); });
    S.forEach((o, id) => { if (!o.k) simbolo(sc, o, id, P, 1 / u, false); });
    const urlB = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(sc)], { type: 'image/svg+xml' }));
    try { const im = await cargarImagen(urlB); if (im) c.drawImage(im, fx, fy); } finally { URL.revokeObjectURL(urlB); }
  }
  // 4) cuadrícula UTM
  const [lonc, latc] = ll(cx, cy), zona = Math.floor((lonc + 180) / 6) + 1, sur = latc < 0;
  const aF = (x, y) => [fx + (x - x0) / u, fy + (y1 - y) / u];
  const esq = [[x0, y1], [x0 + fw * u, y1], [x0, y1 - fh * u], [x0 + fw * u, y1 - fh * u]].map(([x, y]) => { const [lo, la] = ll(x, y); return toUTM(la, lo, zona); });
  const e0 = Math.min(...esq.map(a => a[0])), e1 = Math.max(...esq.map(a => a[0])), n0 = Math.min(...esq.map(a => a[1])), n1 = Math.max(...esq.map(a => a[1]));
  const bruto = (e1 - e0) / 7, bb = Math.pow(10, Math.floor(Math.log10(bruto))), iv = [1, 2, 5, 10].map(k => k * bb).find(v => v >= bruto);
  const Pu = (E, N) => { const [la, lo] = fromUTM(E, N, zona, sur); return aF(...merc(la, lo)); };
  c.strokeStyle = 'rgba(7,7,116,.45)'; c.lineWidth = 1.2;
  for (let E = Math.ceil(e0 / iv) * iv; E <= e1; E += iv) { c.beginPath(); for (let k = 0; k <= 20; k++) { const q = Pu(E, n0 - iv + (n1 - n0 + 2 * iv) * k / 20); k ? c.lineTo(...q) : c.moveTo(...q); } c.stroke(); }
  for (let N = Math.ceil(n0 / iv) * iv; N <= n1; N += iv) { c.beginPath(); for (let k = 0; k <= 20; k++) { const q = Pu(e0 - iv + (e1 - e0 + 2 * iv) * k / 20, N); k ? c.lineTo(...q) : c.moveTo(...q); } c.stroke(); }
  c.restore();
  c.strokeStyle = '#111'; c.lineWidth = 3; c.strokeRect(fx, fy, fw, fh);
  c.fillStyle = '#111'; c.font = '15px Arial'; c.textAlign = 'center';
  const [lob, lab] = ll(cx, y1 - fh * u), nb = toUTM(lab, lob, zona)[1], [lol, lal] = ll(x0, cy), el0 = toUTM(lal, lol, zona)[0];
  for (let E = Math.ceil(e0 / iv) * iv; E <= e1; E += iv) { const [x] = Pu(E, nb); if (x > fx + 30 && x < fx + fw - 30) { c.fillText(fmtN(E), x, fy + fh + 22); c.fillText(fmtN(E), x, fy - 8); } }
  for (let N = Math.ceil(n0 / iv) * iv; N <= n1; N += iv) { const [, y] = Pu(el0, N); if (y > fy + 30 && y < fy + fh - 30) { c.save(); c.translate(fx - 10, y); c.rotate(-Math.PI / 2); c.fillText(fmtN(N), 0, 0); c.restore(); c.save(); c.translate(fx + fw + 22, y); c.rotate(-Math.PI / 2); c.fillText(fmtN(N), 0, 0); c.restore(); } }
  // 5) título, escala y norte
  c.textAlign = 'left'; c.font = 'bold 40px Arial'; c.fillStyle = '#070774'; c.fillText(nombre.toUpperCase(), fx, 58);
  c.font = '19px Arial'; c.fillStyle = '#444'; c.fillText('Escuela Militar de Topografía del Ejército · Calco de operaciones · ' + new Date().toLocaleDateString('es-BO'), fx, 90);
  const gm = u * Math.cos(latc * Math.PI / 180), esc = gm / (0.0254 / 150);
  let L = gm * fw / 4; const pb = Math.pow(10, Math.floor(Math.log10(L))); L = [5, 2, 1].map(k => k * pb).find(v => v <= L); const bw = L / gm, by0 = fy + fh + 50;
  for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#fff' : '#111'; c.fillRect(fx + i * bw / 4, by0, bw / 4, 12); } c.strokeStyle = '#111'; c.lineWidth = 1.5; c.strokeRect(fx, by0, bw, 12);
  c.fillStyle = '#111'; c.font = '16px Arial'; c.textAlign = 'center';
  [0, .5, 1].forEach(k => c.fillText(L * k >= 1000 ? fmtN(L * k / 1000) + (k === 1 ? ' km' : '') : fmtN(L * k) + (k === 1 ? ' m' : ''), fx + bw * k, by0 + 34));
  c.textAlign = 'right'; c.fillStyle = '#333'; c.font = '16px Arial';
  const credito = document.querySelector('.basemap-credit')?.textContent.trim();
  ['Escala aprox. 1:' + fmtN(Math.round(esc / 100) * 100), 'Cuadrícula UTM zona ' + zona + (sur ? 'S' : 'N') + ' (WGS 84) cada ' + fmtN(iv) + ' m', baseOk ? 'Mapa base: ' + (credito || 'servicio en línea') : 'Sin mapa base en la carta']
    .forEach((t, i) => c.fillText(t.slice(0, 110), fx + fw - 90, by0 + 4 + i * 21));
  const nx = fx + fw - 30, ny = by0 + 8; c.fillStyle = '#111'; c.beginPath(); c.moveTo(nx, ny - 14); c.lineTo(nx + 14, ny + 30); c.lineTo(nx, ny + 20); c.lineTo(nx - 14, ny + 30); c.closePath(); c.fill();
  c.font = 'bold 18px Arial'; c.textAlign = 'center'; c.fillText('N', nx, ny - 20);
  const blob = await new Promise(res => { try { cv.toBlob(res, 'image/png'); } catch (e) { res(null); } });
  return { blob, baseFallo };
}
$('calco-carta').onclick = async () => {
  const [nombre, seguro] = nombreArchivo(); aviso('Preparando la carta…');
  try {
    const { blob, baseFallo } = await carta(nombre);
    if (!blob) throw new Error();
    bajar(seguro + '_carta.png', blob);
    aviso('Carta «' + nombre + '» descargada.' + (baseFallo ? ' Algunas teselas del mapa base no se pudieron incluir.' : ''));
  } catch (e) { aviso('No se pudo preparar la carta. Vuelve a intentarlo.', true); }
};

/* ---------- arranque ---------- */
fetch('planeamiento/simbolos.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => {
  SVG = d.svg; catalogo(d.cat);
  return sincronizar(true);
}).catch(() => aviso('No se pudo cargar el catálogo de símbolos (planeamiento/simbolos.json).', true));
setInterval(() => { if (cargado && remoto && !document.hidden) sincronizar(false); }, 15000);
});
