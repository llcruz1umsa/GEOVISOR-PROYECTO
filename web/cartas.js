// Cartas IGM 1:50.000 (agregado por BYNS7).
// Panel lateral «Cartas Omasuyos»: las hojas que cubren la provincia, en orden alfabético, y al final
// «Explorar más cartas»: Departamento → División → Unidades y puestos militares / Cartas, con la capa de divisiones.
// Al elegir una carta se coloca georreferenciada sobre el mapa base (fija, con opacidad regulable)
// y el mapa viaja hasta ella. Descargas: PDF (original del IGM cuando existe) y GeoTIFF de la hoja completa.
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const map = document.querySelector('.map'), scene = document.getElementById('scene'), nav = document.querySelector('.institution-tabs');
if (!map || !scene) return;
const NS = 'http://www.w3.org/2000/svg', R = 6378137, K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702;
const aEscena = (lon, lat) => { const x = lon * Math.PI / 180, y = Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)); return [500 + (x + OX) * K, 380 - (y + OY) * K]; };
const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const el = (par, tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) if (at[k] != null) e.setAttribute(k, at[k]); if (par) par.append(e); return e; };
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

/* UTM (WGS 84) → geográficas */
function deUTM(E, N, zona) {
  const a = 6378137, e2 = 0.00669438, k0 = 0.9996, ep = e2 / (1 - e2), e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const x = E - 500000, y = N - 10000000, M = y / k0, mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 ** 3 / 256));
  const p1 = mu + (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) + (151 * e1 ** 3 / 96) * Math.sin(6 * mu);
  const sn = Math.sin(p1), cs = Math.cos(p1), tn = Math.tan(p1), N1 = a / Math.sqrt(1 - e2 * sn * sn), T1 = tn * tn, C1 = ep * cs * cs, R1 = a * (1 - e2) / Math.pow(1 - e2 * sn * sn, 1.5), D = x / (N1 * k0);
  const lat = p1 - (N1 * tn / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * ep) * D ** 4 / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * ep - 3 * C1 * C1) * D ** 6 / 720);
  const lon = ((zona - 1) * 6 - 180 + 3) * Math.PI / 180 + (D - (1 + 2 * T1 + C1) * D ** 3 / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * ep + 24 * T1 * T1) * D ** 5 / 120) / cs;
  return [lon * 180 / Math.PI, lat * 180 / Math.PI];
}

/* ---------- estilos ---------- */
const css = document.createElement('style');
css.textContent = `
.cc-panel{width:min(470px,calc(100vw - 40px))!important;padding:0!important;display:flex;flex-direction:column;max-height:calc(100vh - 130px)!important;overflow:hidden!important}
.cc-panel[hidden]{display:none!important}
.cc-menu>summary{list-style:none}.cc-menu>summary::-webkit-details-marker{display:none}.cc-menu>summary::before{content:'◈ ';color:#e5c675}.cc-menu.cc-activo>summary{box-shadow:inset 4px 0 #b28405}
.cc-cab{padding:20px 22px 14px;border-bottom:1px solid #e4e7f0;background:linear-gradient(#fff,#fafbff)}
.cc-cab h3{margin:0 0 2px;font-size:17px;color:#070774;letter-spacing:.3px}
.cc-cab p{margin:0;font-size:12px;color:#5d6b75}
.cc-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0 10px}
.cc-kpi div{background:#f2f3fb;border-radius:8px;padding:7px 6px;text-align:center;font-size:10px;color:#5d6b75;line-height:1.2}
.cc-kpi b{display:block;font-size:17px;color:#070774}
.cc-busca{width:100%;padding:10px 12px;border:1px solid #cdd2e4;border-radius:8px;font:13px system-ui}
.cc-busca:focus{outline:2px solid #b28405;outline-offset:1px}
.cc-opc{display:flex;gap:14px;flex-wrap:wrap;margin-top:9px;font-size:12px;color:#33414a}
.cc-opc label{display:flex;gap:6px;align-items:center;padding:0;border:0;font-size:12px}
.cc-aviso{margin:10px 0 0;padding:8px 10px;border-radius:7px;background:#fff4dc;color:#6d5300;font-size:11.5px;line-height:1.45}
.cc-cuerpo{overflow:auto;padding:8px 12px 16px;flex:1}
.cc-cuerpo details{border-radius:8px}
.cc-cuerpo summary{list-style:none;display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none}
.cc-cuerpo summary::-webkit-details-marker{display:none}
.cc-cuerpo summary::before{content:'';width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(-45deg);transition:transform .15s;flex:none;margin:0 3px 0 2px;opacity:.7}
.cc-cuerpo details[open]>summary::before{transform:rotate(45deg)}
.cc-dep{margin:6px 0;border:1px solid #e1e4ef;background:#fff}
.cc-dep>summary{padding:11px 12px;font-weight:700;color:#070774;font-size:13px;letter-spacing:.4px}
.cc-dep[open]>summary{border-bottom:1px solid #eceef5;background:#f7f8fd;border-radius:8px 8px 0 0}
.cc-cnt{margin-left:auto;display:flex;gap:5px}
.cc-cnt span{font-size:10px;font-weight:600;color:#5d6b75;background:#eef0f7;border-radius:10px;padding:2px 7px;white-space:nowrap}
.cc-div{margin:6px 8px;border-left:3px solid #b28405;border-radius:0 8px 8px 0;background:#fcfcfe}
.cc-div>summary{padding:9px 10px;font-size:12.5px;font-weight:700;color:#24313a}
.cc-div>summary small{display:block;font-weight:500;color:#6a7680;font-size:10.5px;letter-spacing:.2px}
.cc-sub{margin:2px 8px 8px 12px}
.cc-sub>summary{padding:7px 8px;font-size:12px;font-weight:600;color:#405b42}
.cc-lista{display:grid;gap:2px;padding:2px 0 4px}
.cc-it{display:grid;grid-template-columns:auto 1fr auto;gap:2px 10px;align-items:center;text-align:left;width:100%;border:1px solid transparent;border-radius:7px;background:transparent;padding:7px 9px;font:12px system-ui;color:#1d2a33;cursor:pointer}
.cc-it:hover{background:#f1f2ff;border-color:#dfe2f7}
.cc-it.on{background:#e9ebff;border-color:#c9cdf4}
.cc-it .cod{font:700 12px ui-monospace,Consolas,monospace;color:#070774;background:#eef0fb;border-radius:5px;padding:3px 6px}
.cc-it .nom{font-weight:600;min-width:0;overflow-wrap:anywhere}
.cc-it .sec{grid-column:2/4;color:#6a7680;font-size:10.5px}
.cc-it .ir{color:#b28405;font-size:15px}
.cc-it .ico{width:22px;height:22px;display:grid;place-items:center;border-radius:50%;font:700 9px system-ui;color:#fff}
.cc-vacio{padding:8px 10px;font-size:12px;color:#6a7680}
.cc-res{padding:4px 0}
.cc-res h4{margin:10px 6px 4px;font-size:11px;letter-spacing:1px;color:#6a7680;text-transform:uppercase}
.cc-pie{padding:10px 18px 14px;border-top:1px solid #eceef5;font-size:10.5px;color:#7a8690;line-height:1.5}
#cc-capa image{image-rendering:auto}
#cc-indice{pointer-events:none}
#cc-indice rect{pointer-events:all;cursor:pointer}
#cc-indice rect:hover{fill:#b2840522!important;stroke:#b28405!important;stroke-opacity:1!important;stroke-width:2!important}
#cc-indice rect.act{stroke:#b28405!important;stroke-opacity:1!important;stroke-width:2.4!important}
#cc-indice text{pointer-events:none}
#cc-dep path{pointer-events:none}
.cc-mapa{position:absolute;right:16px;top:140px;z-index:7;width:310px;max-width:calc(100% - 32px);max-height:calc(100% - 330px);display:flex;flex-direction:column;background:#fff;border:1px solid #b28405;border-radius:12px;box-shadow:0 10px 30px #07077430;overflow:hidden;font:12px system-ui}
.cc-mapa[hidden]{display:none}
.cc-mapa>.cab{display:flex;align-items:center;gap:8px;background:#070774;color:#fff;padding:9px 12px;cursor:pointer}
.cc-mapa>.cab b{flex:1;font-size:12px;letter-spacing:.4px}
.cc-mapa>.cab span{font-size:10px;background:#ffffff26;border-radius:9px;padding:1px 7px}
.cc-mapa>.cab button{all:unset;cursor:pointer;font-size:15px;line-height:1;padding:0 2px}
.cc-mapa>.cab .cc-cerrar{width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#ffffff22;font-size:19px;margin-left:2px}.cc-mapa>.cab .cc-cerrar:hover{background:#b28405}
.cc-carta .t .cc-x{all:unset;margin-left:auto;flex:none;width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:#edf0fa;color:#070774;font-size:18px;line-height:1;cursor:pointer}.cc-carta .t .cc-x:hover{background:#070774;color:#fff}
.cc-mapa .lista{overflow:auto}
.cc-mapa.min .lista{display:none}
.cc-carta{padding:10px 12px;border-top:1px solid #eceef5}
.cc-carta:first-child{border-top:0}
.cc-carta .t{display:flex;gap:8px;align-items:baseline}
.cc-carta .t b{font:700 13px ui-monospace,Consolas,monospace;color:#070774}
.cc-carta .t span{font-weight:600;color:#1d2a33;min-width:0;overflow-wrap:anywhere}
.cc-carta .m{color:#6a7680;font-size:10.5px;margin:2px 0 7px}
.cc-carta .op{display:flex;align-items:center;gap:8px;font-size:11px;color:#33414a}
.cc-carta .op input{flex:1;accent-color:#070774}
.cc-carta .op output{width:42px;white-space:nowrap;text-align:right;font-variant-numeric:tabular-nums}
.cc-carta .b{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-top:8px}
.cc-carta .b a,.cc-carta .b button{all:unset;box-sizing:border-box;text-align:center;cursor:pointer;border:1px solid #cdd2e4;border-radius:6px;padding:6px 2px;font-size:11px;font-weight:600;color:#070774}
.cc-carta .b a:hover,.cc-carta .b button:hover{background:#f1f2ff}
.cc-carta .b .pdf{border-color:#e8b7b7;color:#a8231d}.cc-carta .b .tif{border-color:#bfe0c8;color:#17663a}
.cc-carta .b .x{color:#6a7680}
.cc-carta .cargando{font-size:10.5px;color:#b28405;margin-top:5px}
/* panel lateral «Cartas Omasuyos» */
.cc-menu>summary::before{content:none!important}
.cc-menu .cc-om{padding:8px 8px 10px}
.cc-menu .cc-it{grid-template-columns:auto 1fr auto;padding:8px 8px}
.cc-menu .cc-it .sec{font-size:10px}
.cc-mas{display:flex!important;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:8px;padding:10px 12px!important;border:1px solid #12294A!important;border-radius:6px!important;background:#12294A!important;color:#fff!important;font:600 12px var(--tipo-titulo,system-ui)!important;letter-spacing:.06em;cursor:pointer}
.cc-mas:hover{background:#1C3A66!important}
.cc-mas.on{background:#B79A5B!important;border-color:#B79A5B!important}
/* capa de divisiones */
#cc-div path{pointer-events:none}
#cc-div text{pointer-events:none}
.cc-leyenda{display:grid;grid-template-columns:1fr 1fr;gap:3px 10px;margin-top:8px;font-size:10.5px;color:#33414a}
.cc-leyenda[hidden]{display:none}
.cc-leyenda span{display:flex;align-items:center;gap:6px;min-width:0}
.cc-leyenda i{flex:none;width:13px;height:10px;border-radius:2px;border:1.5px solid}
.cc-div>summary .cc-sw{flex:none;width:11px;height:11px;border-radius:2px}
/* rediseño 02-11-2026 */
.cc-kpi2{display:flex;flex-wrap:wrap;gap:4px 12px;margin:4px 0 10px;font-size:11px;color:#5d6b75}.cc-kpi2 b{color:#070774}
.cc-modo{display:grid;grid-template-columns:1fr 1fr;margin-top:9px;border:1px solid #12294A;border-radius:8px;overflow:hidden}
.cc-modo button{all:unset;text-align:center;padding:7px 4px;font:700 10.5px var(--tipo-titulo,system-ui);letter-spacing:.06em;color:#12294A;cursor:pointer}
.cc-modo button.on{background:#12294A;color:#fff}
.cc-mini{margin:4px 0 6px}.cc-mini-svg{width:100%;height:auto;display:block}
.cc-mini-svg .rg path{fill:#E9EDF4;stroke:#fff;stroke-width:1;cursor:pointer;transition:fill .12s}
.cc-mini-svg .rg:hover path{fill:#D5DDEA}.cc-mini-svg .rg.sel path{fill:#E9DDBF;stroke:#B79A5B;stroke-width:2}
.cc-mini-svg .rg.col path{fill:color-mix(in srgb,var(--c) 28%,#fff)}.cc-mini-svg .rg.col:hover path{fill:color-mix(in srgb,var(--c) 45%,#fff)}.cc-mini-svg .rg.col.sel path{fill:color-mix(in srgb,var(--c) 60%,#fff);stroke:#0B1D33}
.cc-mini-svg .et{font:700 9px var(--tipo-titulo,system-ui);fill:#12294A;text-anchor:middle;dominant-baseline:middle;pointer-events:none;paint-order:stroke;stroke:#fff;stroke-width:2.5px}
.cc-mini-svg .et.sel{font-size:10px}
.cc-mini-svg .hj{fill:#12294A22;stroke:#12294A;stroke-width:.5;cursor:pointer}.cc-mini-svg .hj:hover,.cc-mini-svg .hj.act{fill:#B79A5B;stroke:#7D6418}
.cc-ruta{display:flex;align-items:center;gap:7px;margin:2px 2px 8px;font:700 11px var(--tipo-titulo,system-ui);letter-spacing:.06em;color:#12294A}
.cc-miga{all:unset;cursor:pointer;color:#5d6b75;text-decoration:underline}.cc-miga.on{text-decoration:none;color:#12294A}
.cc-cuerpo h4{margin:8px 2px 6px;font:800 10.5px var(--tipo-titulo,system-ui);letter-spacing:.1em;color:#5d6b75}
.cc-tarjs{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.cc-tarj{all:unset;display:grid;grid-template-columns:auto 1fr;gap:1px 8px;align-items:center;padding:8px 10px;border:1px solid #e1e4ef;border-radius:9px;background:#fff;cursor:pointer}
.cc-tarj:hover{border-color:#B79A5B;background:#FBF8F0}.cc-tarj b{font-size:12px;color:#070774}.cc-tarj small{grid-column:2;font-size:10.5px;color:#6a7680}
.cc-sw{width:11px;height:11px;border-radius:3px;flex:none;grid-row:span 2}
.cc-grupo{margin:6px 0;border:1px solid #e1e4ef;border-radius:9px;background:#fff}
.cc-grupo>summary{padding:9px 10px;font-size:12px;font-weight:700;color:#24313a}
.cc-grupo>summary .tt{flex:1;min-width:0}.cc-grupo>summary .n{font-size:10px;font-weight:600;color:#5d6b75;background:#eef0f7;border-radius:10px;padding:2px 8px;white-space:nowrap}
.cc-chips{display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:5px;padding:2px 8px 10px}
.cc-chip{all:unset;display:grid;gap:1px;padding:6px 8px;border:1px solid #dfe3ee;border-radius:7px;background:#fafbff;cursor:pointer;min-width:0}
.cc-chip b{font:700 11.5px ui-monospace,Consolas,monospace;color:#070774}.cc-chip span{font-size:10.5px;color:#4a5763;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cc-chip:hover{border-color:#B79A5B;background:#FBF8F0}.cc-chip.on{background:#12294A;border-color:#12294A}.cc-chip.on b,.cc-chip.on span{color:#fff}
.cc-om-svg{width:100%;height:auto;display:block;margin:0 0 6px;border:1px solid #E3E8EF;border-radius:8px;background:#F8FAFC}
.cc-om-svg .lim{fill:#DDE8D5;stroke:#5B7B1C;stroke-width:1.2}
.cc-om-svg .hoja rect{fill:#12294A0d;stroke:#12294A;stroke-width:1;cursor:pointer;transition:fill .12s}
.cc-om-svg .hoja:hover rect{fill:#B79A5B44}.cc-om-svg .hoja.act rect{fill:#B79A5B88;stroke:#7D6418;stroke-width:2}
.cc-om-svg text{font:700 10px ui-monospace,Consolas,monospace;fill:#070774;text-anchor:middle;pointer-events:none;paint-order:stroke;stroke:#ffffffcc;stroke-width:2.5px}
.cc-om-svg text.n{font:600 7.5px var(--tipo-texto,system-ui);fill:#3A4A60}
.cc-om-acc{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 6px}
.cc-om-acc button{padding:7px 4px!important;border:1px solid #12294A!important;border-radius:6px!important;background:#fff!important;color:#12294A!important;font:700 10.5px var(--tipo-titulo,system-ui)!important;letter-spacing:.05em;cursor:pointer}
.cc-om-acc button:first-child{background:#12294A!important;color:#fff!important}
.cc-om-it .sec{display:flex;align-items:center;gap:7px}
.cc-bar{flex:none;width:46px;height:6px;border-radius:3px;background:linear-gradient(90deg,#B79A5B var(--p),#E3E8EF var(--p))}
.cc-bloq{display:grid;gap:4px;padding:12px;border:1px dashed #B79A5B;border-radius:8px;background:#FBF8F0;font-size:11.5px;color:#3A4A60}.cc-bloq b{color:#6B521C;font-size:11px;letter-spacing:.05em}
.cc-mas:disabled{opacity:.45;cursor:not-allowed}
@media(max-width:750px){.cc-mapa{top:auto;bottom:150px;right:8px;width:260px}.cc-kpi{grid-template-columns:repeat(2,1fr)}}`;
document.head.append(css);

/* ---------- capas en la escena: cartas (sobre el mapa base), índice, departamento y marcador ---------- */
const capa = el(null, 'g', { id: 'cc-capa' }), gDep = el(null, 'g', { id: 'cc-dep' }), gIdx = el(null, 'g', { id: 'cc-indice' }), gPin = el(null, 'g', { id: 'cc-pin' }), gDiv = el(null, 'g', { id: 'cc-div' });
capa.style.pointerEvents = 'none'; gPin.style.pointerEvents = 'none';
const basemap = document.getElementById('basemap');
// Las cartas van ENCIMA del mapa base y de todas las capas (ríos, vías, salud, educación, rutas…);
// solo quedan sobre ellas el índice de hojas, las divisiones, el marcador y el calco de planeamiento.
function colocarCapas() {
  if (!gDep.isConnected) scene.append(gDiv, gDep, gIdx, gPin);
  if (capa.nextSibling !== gDiv) scene.insertBefore(capa, gDiv);
}
colocarCapas(); if (!basemap) setTimeout(colocarCapas, 0);
const defs = el(capa, 'defs', {});

/* ---------- panel «Explorar más cartas» (se abre desde el panel lateral) ---------- */
const panel = h('section', 'institution-tab-panel cc-panel'); panel.id = 'panel-cartas'; panel.hidden = true;
panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Explorar más cartas');
panel.innerHTML = `<button type="button" class="institution-tab-close" aria-label="Cerrar explorar más cartas">×</button>
<div class="cc-cab"><h3>Explorar cartas IGM 1:50.000</h3>
<div class="cc-kpi2"><span><b id="cc-k1">–</b> cartas</span><span><b id="cc-k2">–</b> departamentos</span><span><b id="cc-k3">–</b> divisiones</span><span><b id="cc-k4">–</b> unidades y puestos</span></div>
<input type="search" class="cc-busca" id="cc-busca" placeholder="Buscar hoja (5845-II), nombre, unidad o localidad…" aria-label="Buscar cartas y unidades">
<div class="cc-modo" role="tablist"><button type="button" data-m="dep" class="on">DEPARTAMENTOS</button><button type="button" data-m="div">DIVISIONES DEL EJÉRCITO</button></div>
<div class="cc-opc"><label><input type="checkbox" id="cc-ver-indice"> Índice de hojas en el mapa</label><label><input type="checkbox" id="cc-ver-div"> Divisiones en el mapa</label></div>
<div class="cc-leyenda" id="cc-leyenda" hidden></div>
<p class="cc-aviso" id="cc-aviso" hidden></p></div>
<div class="cc-cuerpo" id="cc-cuerpo"><div class="cc-mini" id="cc-mini"></div><div class="cc-ruta" id="cc-ruta"></div><div id="cc-sel"><p class="cc-vacio">Cargando el índice de cartas…</p></div></div>
<div class="cc-pie" id="cc-pie" hidden></div>`;
document.body.append(panel);
const asideIzq = document.querySelector('main > aside');
function abrir(si) {
  if (si) nav && nav.querySelectorAll('[role=tab][aria-selected=true]').forEach(b => b.click());
  if (si) { // a la derecha del panel lateral, sin taparlo
    const r = asideIzq && !asideIzq.hidden ? asideIzq.getBoundingClientRect() : null;
    if (r && innerWidth > 900) { panel.style.setProperty('left', (r.right + 12) + 'px', 'important'); panel.style.setProperty('right', 'auto', 'important'); }
    else { panel.style.removeProperty('left'); panel.style.removeProperty('right'); }
  }
  panel.hidden = !si; menuLateral.classList.toggle('cc-activo', si); masBtn.classList.toggle('on', si);
  masBtn.setAttribute('aria-expanded', String(si));
  if (si) setTimeout(() => document.getElementById('cc-busca').focus(), 50);
}
// Panel lateral «Cartas Omasuyos»: hojas de la provincia en orden alfabético y, al final, «Explorar más cartas».
const menuLateral = h('details', 'layer-menu cc-menu');
menuLateral.innerHTML = '<summary>Cartas Omasuyos <span id="cc-badge">–</span></summary><div class="cc-om"><div class="cc-om-mapa" id="cc-om-mapa"></div><div class="cc-om-acc" id="cc-om-acc" hidden><button type="button" id="cc-om-todas">COLOCAR LAS 8</button><button type="button" id="cc-om-quitar">QUITAR TODAS</button></div><div class="cc-lista" id="cc-om-lista"><p class="cc-vacio">Cargando cartas…</p></div></div>';
const masBtn = h('button', 'cc-mas', 'EXPLORAR MÁS CARTAS ➜'); masBtn.type = 'button'; masBtn.setAttribute('aria-controls', 'panel-cartas'); masBtn.setAttribute('aria-expanded', 'false');
masBtn.title = 'Todas las cartas IGM 1:50.000 de Bolivia por departamento y división';
masBtn.onclick = () => abrir(panel.hidden);
menuLateral.querySelector('.cc-om').append(masBtn);
if (asideIzq) asideIzq.append(menuLateral);
panel.querySelector('.institution-tab-close').onclick = () => { abrir(false); masBtn.focus(); };
if (nav) nav.addEventListener('click', e => { const b = e.target.closest('[role=tab]'); if (b && !panel.hidden) abrir(false); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) abrir(false); });
const $ = id => document.getElementById(id);

/* ---------- tarjeta «Cartas en el mapa» ---------- */
const tarjeta = h('section', 'cc-mapa'); tarjeta.hidden = true; tarjeta.setAttribute('aria-label', 'Cartas colocadas en el mapa');
tarjeta.innerHTML = '<div class="cab"><b>CARTAS EN EL MAPA</b><span id="cc-n">0</span><button type="button" id="cc-min" aria-label="Plegar">▾</button><button type="button" id="cc-cerrar" class="cc-cerrar" aria-label="Cerrar y quitar todas las cartas del mapa" title="Quitar todas las cartas">×</button></div><div class="lista" id="cc-lista"></div>';
map.append(tarjeta);
for (const t of ['pointerdown', 'click', 'dblclick', 'wheel']) tarjeta.addEventListener(t, e => e.stopPropagation());
$('cc-cerrar').onclick = e => { e.stopPropagation(); [...ACT.keys()].forEach(quitarCarta); };
tarjeta.querySelector('.cab').onclick = () => { tarjeta.classList.toggle('min'); $('cc-min').textContent = tarjeta.classList.contains('min') ? '▸' : '▾'; };

/* ---------- datos ---------- */
let D = null, HOJAS = new Map(), disponible = true;
const ORDEN_DIV = d => { const m = /MEC/.test(d) ? 100 : /CMDO/.test(d) ? 200 : /SIN/.test(d) ? 300 : +((d.match(/\d+/) || [999])[0]); return m; };
const COLOR_TIPO = t => /ADELANTADO/.test(t) ? '#b42330' : /FRONTERIZO|CONTROL/.test(t) ? '#c26a00' : /REGIMIENTO|BATALL|GRUPO|COMPA/.test(t) ? '#070774' : '#2f6b4f';

/* ---------- vuelo del mapa ---------- */
let vuelo = 0;
function volar(lon0, lat0, lon1, lat1, extra = .82) {
  const [ax, ay] = aEscena(lon0, lat1), [bx, by] = aEscena(lon1, lat0), cx = (ax + bx) / 2, cy = (ay + by) / 2;
  const s1 = Math.max(.05, Math.min(480, Math.min(1000 / Math.max(bx - ax, 1e-6), 760 / Math.max(by - ay, 1e-6)) * extra));
  const s0 = scale, c0 = [(500 - panX / s0), (380 - panY / s0)], id = ++vuelo, t0 = performance.now(), dur = 700;
  const paso = t => {
    if (id !== vuelo) return;
    const k = Math.min(1, (t - t0) / dur), e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    const s = Math.exp(Math.log(s0) + (Math.log(s1) - Math.log(s0)) * e), x = c0[0] + (cx - c0[0]) * e, y = c0[1] + (cy - c0[1]) * e;
    scale = s; panX = (500 - x) * s; panY = (380 - y) * s; zoom(1);
    if (k < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/* ---------- cartas sobre el mapa ---------- */
const ACT = new Map();
function geometriaImagen(c) {
  const g = c.img, x0 = g.x - g.a / 2, y0 = g.y - g.d / 2, x1 = x0 + g.a * g.w, y1 = y0 + g.d * g.h;
  const P = (E, N) => aEscena(...deUTM(E, N, c.z));
  const tl = P(x0, y0), tr = P(x1, y0), bl = P(x0, y1);
  return `matrix(${(tr[0] - tl[0]) / g.w} ${(tr[1] - tl[1]) / g.w} ${(bl[0] - tl[0]) / g.h} ${(bl[1] - tl[1]) / g.h} ${tl[0]} ${tl[1]})`;
}
function agregarCarta(hoja, viajar = true) {
  const c = HOJAS.get(hoja); if (!c) return;
  colocarCapas();
  if (!ACT.has(hoja)) {
    if (!disponible) { avisar('Las imágenes de las cartas no están disponibles en este servidor.'); }
    const [ax, ay] = aEscena(c.b[0], c.b[3]), [bx, by] = aEscena(c.b[2], c.b[1]);
    const cp = el(defs, 'clipPath', { id: 'cc-clip-' + hoja, clipPathUnits: 'userSpaceOnUse' });
    el(cp, 'rect', { x: ax, y: ay, width: bx - ax, height: by - ay });
    const g = el(capa, 'g', { 'clip-path': `url(#cc-clip-${hoja})`, 'data-hoja': hoja });
    const im = el(g, 'image', { width: c.img.w, height: c.img.h, transform: geometriaImagen(c), preserveAspectRatio: 'none' });
    const item = { g, cp, im, op: 100, cargada: false };
    g.setAttribute('opacity', item.op / 100);
    im.addEventListener('load', () => { item.cargada = true; pintarTarjeta(); });
    im.addEventListener('error', () => { item.error = true; pintarTarjeta(); });
    im.setAttribute('href', '/api/cartas/' + encodeURIComponent(hoja) + '/imagen');
    ACT.set(hoja, item); marcarIndice(); pintarTarjeta();
  }
  if (viajar) volar(c.b[0], c.b[1], c.b[2], c.b[3]);
  document.querySelectorAll('.cc-it[data-hoja], .cc-chip[data-hoja]').forEach(b => b.classList.toggle('on', ACT.has(b.dataset.hoja))); marcarMinis();
}
function quitarCarta(hoja) {
  const it = ACT.get(hoja); if (!it) return;
  it.g.remove(); it.cp.remove(); ACT.delete(hoja); marcarIndice(); pintarTarjeta();
  document.querySelectorAll('.cc-it[data-hoja], .cc-chip[data-hoja]').forEach(b => b.classList.toggle('on', ACT.has(b.dataset.hoja))); marcarMinis();
}
function pintarTarjeta() {
  const l = $('cc-lista'); l.replaceChildren(); tarjeta.hidden = !ACT.size; $('cc-n').textContent = ACT.size;
  [...ACT.keys()].reverse().forEach(hoja => {
    const c = HOJAS.get(hoja), it = ACT.get(hoja), d = h('div', 'cc-carta');
    const t = h('div', 't'); t.append(h('b', null, hoja), h('span', null, c.n || 'Sin nombre impreso'));
    const cx = h('button', 'cc-x', '×'); cx.type = 'button'; cx.title = 'Quitar esta carta del mapa'; cx.setAttribute('aria-label', 'Quitar la carta ' + hoja); cx.onclick = () => quitarCarta(hoja);
    t.append(cx); d.append(t);
    d.append(h('div', 'm', `${c.dv} · ${c.dp.join(' / ')} · UTM ${c.z}S · ${c.lim[0]}–${c.lim[1]}, ${c.lim[2]}–${c.lim[3]}`));
    const op = h('label', 'op'); op.append(document.createTextNode('Opacidad'));
    const r = h('input'); r.type = 'range'; r.min = 0; r.max = 100; r.step = 5; r.value = it.op; r.setAttribute('aria-label', 'Opacidad de la carta ' + hoja);
    const o = h('output', null, it.op + ' %');
    r.oninput = () => { it.op = +r.value; it.g.setAttribute('opacity', it.op / 100); o.textContent = it.op + ' %'; };
    op.append(r, o); d.append(op);
    const b = h('div', 'b');
    const ir = h('button', null, 'Ir'); ir.type = 'button'; ir.title = 'Centrar el mapa en la carta'; ir.onclick = () => volar(c.b[0], c.b[1], c.b[2], c.b[3]);
    const pdf = h('a', 'pdf', 'PDF'); pdf.href = '/api/cartas/' + encodeURIComponent(hoja) + '/pdf'; pdf.title = c.pdf ? 'PDF original del IGM' : 'PDF de la hoja completa a escala 1:50.000'; pdf.setAttribute('download', '');
    const tif = h('a', 'tif', 'GeoTIFF'); tif.href = '/api/cartas/' + encodeURIComponent(hoja) + '/tif'; tif.title = 'GeoTIFF georreferenciado de la hoja completa (sin recorte)'; tif.setAttribute('download', '');
    const x = h('button', 'x', 'Quitar'); x.type = 'button'; x.onclick = () => quitarCarta(hoja);
    b.append(ir, pdf, tif, x); d.append(b);
    if (it.error) d.append(h('div', 'cargando', 'No se pudo cargar la imagen de esta carta en el servidor.'));
    else if (!it.cargada) d.append(h('div', 'cargando', 'Cargando la carta…'));
    l.append(d);
  });
}

/* ---------- índice de hojas y departamento en el mapa ---------- */
function dibujarIndice() {
  gIdx.replaceChildren(); if (!$('cc-ver-indice').checked || !D) return;
  for (const c of D.hojas) {
    const [ax, ay] = aEscena(c.b[0], c.b[3]), [bx, by] = aEscena(c.b[2], c.b[1]);
    const r = el(gIdx, 'rect', { x: ax, y: ay, width: bx - ax, height: by - ay, 'data-hoja': c.h, fill: 'transparent', stroke: '#070774', 'stroke-opacity': .55, 'stroke-width': .8, 'vector-effect': 'non-scaling-stroke' });
    el(r, 'title', {}).textContent = c.h + (c.n ? ' · ' + c.n : '');
  }
  etiquetasIndice(); marcarIndice();
}
function etiquetasIndice() {
  gIdx.querySelectorAll('text').forEach(t => t.remove());
  if (!$('cc-ver-indice').checked || !D || scale < 9) return;
  const f = 1 / scale;
  for (const c of D.hojas) {
    const [x, y] = aEscena((c.b[0] + c.b[2]) / 2, (c.b[1] + c.b[3]) / 2);
    const t = el(gIdx, 'text', { x, y, 'font-family': 'system-ui,sans-serif', 'font-size': 11, 'font-weight': 700, fill: '#070774', stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke', 'text-anchor': 'middle', transform: `translate(${x} ${y}) scale(${f}) translate(${-x} ${-y})` }); t.textContent = c.h;
  }
}
function marcarIndice() { gIdx.querySelectorAll('rect').forEach(r => r.classList.toggle('act', ACT.has(r.dataset.hoja))); }
gIdx.addEventListener('click', e => { const r = e.target.closest('rect[data-hoja]'); if (r) { e.stopPropagation(); agregarCarta(r.dataset.hoja); } });
function mostrarDepartamento(nombre) {
  gDep.replaceChildren(); const dp = D && D.departamentos.find(x => x.n === nombre); if (!dp) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const d = dp.r.map(r => 'M' + r.map(([lon, lat]) => { x0 = Math.min(x0, lon); x1 = Math.max(x1, lon); y0 = Math.min(y0, lat); y1 = Math.max(y1, lat); return aEscena(lon, lat).map(v => v.toFixed(2)).join(','); }).join('L') + 'Z').join('');
  el(gDep, 'path', { d, 'fill-rule': 'evenodd', fill: '#b28405', 'fill-opacity': .07, stroke: '#b28405', 'stroke-width': 2, 'stroke-dasharray': '7 5', 'vector-effect': 'non-scaling-stroke' });
  volar(x0, y0, x1, y1, .9);
}
function marcador(u) {
  gPin.replaceChildren(); if (!u) return;
  const [x, y] = aEscena(u.lon, u.lat), g = el(gPin, 'g', { class: 'cc-pin', transform: `translate(${x} ${y}) scale(${1 / scale})` });
  el(g, 'path', { d: 'M0 0C-4-7-13-15-13-25A13 13 0 0 1 13-25C13-15 4-7 0 0Z', fill: '#b42330', stroke: '#fff', 'stroke-width': 2 }); el(g, 'circle', { cx: 0, cy: -25, r: 5, fill: '#fff' });
}
/* ---------- capa de divisiones del Ejército (jurisdicción GG.UU.CC.) ---------- */
const PALETA_DIV = { 'DIV-1': '#1F5AA6', 'DIV-2': '#B03A2E', 'DIV-3': '#2E7D52', 'DIV-4': '#C77C0E', 'DIV-5': '#6F4A9B', 'DIV-6': '#13818A',
  'DIV-7': '#94522B', 'DIV-8': '#5B7B1C', 'DIV-9': '#B0245F', 'DIV-10': '#34557F', 'DIV. MEC-1': '#7D6418', 'CMDO. UU. DD. EJTO.': '#56657A' };
const COLOR_DIV = k => PALETA_DIV[k] || '#56657A';
let DIVS = null;
function dibujarDivisiones() {
  gDiv.replaceChildren(); const ley = $('cc-leyenda'); ley.hidden = !$('cc-ver-div').checked;
  if (!$('cc-ver-div').checked) return;
  if (!DIVS) { ley.replaceChildren(h('span', null, 'Cargando divisiones…'));
    fetch('cartas/divisiones.json').then(r => r.json()).then(d => { DIVS = d.divisiones.sort((a, b) => ORDEN_DIV(a.k) - ORDEN_DIV(b.k)); dibujarDivisiones(); }).catch(() => ley.replaceChildren(h('span', null, 'No se pudo cargar la capa de divisiones.'))); return; }
  ley.replaceChildren();
  for (const dv of DIVS) {
    const col = COLOR_DIV(dv.k), d = dv.r.map(r => 'M' + r.map(([lon, lat]) => aEscena(lon, lat).map(v => v.toFixed(2)).join(',')).join('L') + 'Z').join('');
    const p = el(gDiv, 'path', { d, 'fill-rule': 'evenodd', fill: col, 'fill-opacity': .13, stroke: col, 'stroke-width': 2, 'stroke-opacity': .9, 'vector-effect': 'non-scaling-stroke' });
    el(p, 'title', {}).textContent = dv.k + ' – ' + dv.n;
    const s = h('span'), i = h('i'); i.style.background = col + '33'; i.style.borderColor = col; s.append(i, document.createTextNode(dv.k)); s.title = dv.n; ley.append(s);
  }
  etiquetasDivisiones();
}
function etiquetasDivisiones() {
  gDiv.querySelectorAll('text').forEach(t => t.remove()); if (!DIVS || !$('cc-ver-div').checked) return;
  const f = 1 / scale;
  for (const dv of DIVS) {
    const [x, y] = aEscena(dv.c[0], dv.c[1]);
    const t = el(gDiv, 'text', { x, y, 'font-family': 'Bahnschrift,system-ui,sans-serif', 'font-size': 13, 'font-weight': 700, 'letter-spacing': '.06em', fill: COLOR_DIV(dv.k), stroke: '#fff', 'stroke-width': 3.5, 'paint-order': 'stroke', 'text-anchor': 'middle', transform: `translate(${x} ${y}) scale(${f}) translate(${-x} ${-y})` });
    t.textContent = dv.k;
  }
}
$('cc-ver-div').onchange = () => { dibujarDivisiones(); if ($('cc-ver-div').checked) volar(-69.7, -22.95, -57.4, -9.6, .95); };

/* ---------- capa «Unidades militares» (solo usuarios registrados: este archivo no se entrega a invitados) ---------- */
const gUni = el(null, 'g', { id: 'cc-unidades' });
const TIPOS_U = [['PEQUEÑA UNIDAD (REGIMIENTO / BATALLÓN)', 'Regimientos y batallones'], ['PUESTO MILITAR ADELANTADO', 'Puestos militares adelantados'], ['PUESTO MILITAR DE CONTROL FRONTERIZO', 'Puestos de control fronterizo'], ['PUESTO MILITAR P.M.S.', 'Puestos militares P.M.S.'], ['PUESTO MILITAR P.M.P.', 'Puestos militares P.M.P.']];
const verTipo = new Set(TIPOS_U.map(t => t[0]));
let uniActiva = false;
function dibujarUnidades() {
  gUni.replaceChildren(); if (!uniActiva || !D) { gUni.remove(); return; }
  for (const u of D.unidades) {
    if (!verTipo.has(u.t)) continue;
    const [x, y] = aEscena(u.lon, u.lat), c = COLOR_TIPO(u.t), g = el(gUni, 'g', { class: 'cc-u', 'data-x': x, 'data-y': y, transform: `translate(${x} ${y}) scale(${1 / scale})`, style: 'cursor:pointer' });
    if (/PEQUEÑA UNIDAD/.test(u.t)) { el(g, 'rect', { x: -10, y: -7, width: 20, height: 14, fill: '#fff', stroke: c, 'stroke-width': 2.2 }); el(g, 'path', { d: 'M-10-7L10 7M-10 7L10-7', stroke: c, 'stroke-width': 1.6 }); }
    else { el(g, 'path', { d: 'M0-9L9 7H-9Z', fill: '#fff', stroke: c, 'stroke-width': 2.2 }); el(g, 'circle', { cy: 2, r: 2.2, fill: c }); }
    el(g, 'title', {}).textContent = (u.sg ? u.sg + ' ' : '') + u.n;
    g.addEventListener('click', e => { e.stopPropagation(); marcador(u); fichaUnidad(u); });
  }
  if (!gUni.isConnected) scene.insertBefore(gUni, gIdx);
}
function escalarUnidades() { if (!uniActiva) return; const f = 1 / scale; gUni.querySelectorAll('.cc-u').forEach(g => g.setAttribute('transform', `translate(${g.dataset.x} ${g.dataset.y}) scale(${f})`)); }
const menuUni = h('details', 'layer-menu cc-menu cc-uni');
menuUni.innerHTML = '<summary>Unidades militares <span id="cc-uni-n">–</span></summary><div class="cc-om"><label class="cc-uni-ver"><input type="checkbox" id="cc-uni-ver"> Mostrar unidades y puestos en el mapa</label><div class="cc-uni-tipos" id="cc-uni-tipos"></div><div class="cc-uni-tit">EN LA PROVINCIA OMASUYOS</div><div class="cc-lista" id="cc-uni-om"></div><p class="cc-uni-nota">Uso restringido · Ejército de Bolivia, unidades 2018 con jurisdicción 2024.</p></div>';
if (asideIzq) asideIzq.append(menuUni);
const cssU = document.createElement('style');
cssU.textContent = `.cc-uni-ver{display:flex!important;gap:8px;align-items:center;padding:4px 2px 8px!important;border:0!important;font-size:12.5px;font-weight:600;color:#12294A}
.cc-uni-tipos{display:grid;gap:4px;margin:0 0 10px;padding:8px;border:1px solid #E3E8EF;border-radius:6px;background:#F8FAFC}
.cc-uni-tipos label{display:flex!important;gap:7px;align-items:center;padding:0!important;border:0!important;font-size:11.5px;color:#3A4A60}
.cc-uni-tipos i{width:12px;height:12px;border-radius:2px;flex:none}
.cc-uni-tit{font:700 10px var(--tipo-titulo,system-ui);letter-spacing:.12em;color:#5A6B80;margin:4px 2px}
.cc-uni-nota{margin:8px 2px 0;font-size:10.5px;color:#9B1C1C}`;
document.head.append(cssU);
$('cc-uni-ver').onchange = e => { uniActiva = e.target.checked; dibujarUnidades(); if (uniActiva) volar(-69.65, -22.9, -57.45, -9.67, .95); };
function prepararUnidades() {
  if (!$('cc-uni-n') || !menuUni.isConnected) return;   // la sección «Unidades militares» se quitó del panel (depurar-panel.js)
  $('cc-uni-n').textContent = D.unidades.length;
  const tipos = $('cc-uni-tipos');
  for (const [t, nombre] of TIPOS_U) {
    const n = D.unidades.filter(u => u.t === t).length; if (!n) continue;
    const l = h('label'), cb = h('input'), i = h('i'); cb.type = 'checkbox'; cb.checked = true; i.style.background = COLOR_TIPO(t);
    cb.onchange = () => { cb.checked ? verTipo.add(t) : verTipo.delete(t); dibujarUnidades(); };
    l.append(cb, i, document.createTextNode(`${nombre} (${n})`)); tipos.append(l);
  }
  const om = D.unidades.filter(u => /OMASUYOS/i.test(u.prov || '')), lista = $('cc-uni-om');
  if (!om.length) lista.append(h('p', 'cc-vacio', 'No hay unidades registradas en la provincia.'));
  om.forEach(u => { const b = itemUnidad(u); b.onclick = () => { if (!uniActiva) { $('cc-uni-ver').checked = true; uniActiva = true; dibujarUnidades(); } irUnidad(u); }; lista.append(b); });
}

/* ---------- lista «Cartas Omasuyos» ---------- */
let OM = [];
function proyector(b, ancho, alto, pad = 6) {   // lon/lat → px de un mapa chico (equirectangular con coseno)
  const k = Math.cos((b[1] + b[3]) / 2 * Math.PI / 180), w = (b[2] - b[0]) * k, hh = b[3] - b[1], f = Math.min((ancho - 2 * pad) / w, (alto - 2 * pad) / hh);
  const ox = (ancho - w * f) / 2, oy = (alto - hh * f) / 2;
  return (lon, lat) => [ox + (lon - b[0]) * k * f, oy + (b[3] - lat) * f];
}
const anillosD = (rs, P) => rs.map(r => 'M' + r.map(([lo, la]) => P(lo, la).map(v => v.toFixed(1)).join(',')).join('L') + 'Z').join('');
function listaOmasuyos(om) {
  OM = om.hojas.map(x => ({ c: HOJAS.get(x.h), p: x.p })).filter(x => x.c).sort((a, b) => b.p - a.p);
  const l = $('cc-om-lista'); l.replaceChildren();
  for (const { c, p } of OM) {
    const b = itemCarta(c, null); b.classList.add('cc-om-it');
    b.querySelector('.sec').replaceChildren(h('span', 'cc-bar'), h('span', null, `Omasuyos ${p.toLocaleString('es-BO')} % · ${c.dv}`));
    b.querySelector('.cc-bar').style.setProperty('--p', Math.max(3, p) + '%');
    b.onmouseenter = () => resaltar(c.h, true); b.onmouseleave = () => resaltar(c.h, false);
    l.append(b);
  }
  if (!OM.length) l.append(h('p', 'cc-vacio', 'No hay cartas registradas para Omasuyos.'));
  $('cc-badge').textContent = OM.length; $('cc-om-acc').hidden = !OM.length;
  $('cc-om-todas').textContent = 'COLOCAR LAS ' + OM.length;
  $('cc-om-todas').onclick = () => { OM.forEach(({ c }) => agregarCarta(c.h, false)); const bb = OM.reduce((a, { c }) => [Math.min(a[0], c.b[0]), Math.min(a[1], c.b[1]), Math.max(a[2], c.b[2]), Math.max(a[3], c.b[3])], [180, 90, -180, -90]); volar(...bb); };
  $('cc-om-quitar').onclick = () => OM.forEach(({ c }) => quitarCarta(c.h));
  miniOmasuyos();
}
// mapa chico de la provincia con las hojas: clic = colocar / quitar la carta
function miniOmasuyos() {
  const caja = $('cc-om-mapa'); if (!OM.length) return;
  const bb = OM.reduce((a, { c }) => [Math.min(a[0], c.b[0]), Math.min(a[1], c.b[1]), Math.max(a[2], c.b[2]), Math.max(a[3], c.b[3])], [180, 90, -180, -90]);
  const W = 300, H = 210, P = proyector(bb, W, H, 4);
  const s = el(null, 'svg', { viewBox: `0 0 ${W} ${H}`, class: 'cc-om-svg' });
  const gl = el(s, 'g', {});
  fetch('data/limite_omasuyos.geojson').then(r => r.json()).then(g => g.features.forEach(f => { const rs = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.flat() : f.geometry.coordinates; el(gl, 'path', { d: anillosD(rs, P), class: 'lim' }); })).catch(() => {});
  for (const { c } of OM) {
    const [x0, y0] = P(c.b[0], c.b[3]), [x1, y1] = P(c.b[2], c.b[1]);
    const g = el(s, 'g', { class: 'hoja', 'data-hoja': c.h });
    el(g, 'rect', { x: x0, y: y0, width: x1 - x0, height: y1 - y0 });
    const t = el(g, 'text', { x: (x0 + x1) / 2, y: (y0 + y1) / 2 - 3 }); t.textContent = c.h;
    const t2 = el(g, 'text', { x: (x0 + x1) / 2, y: (y0 + y1) / 2 + 9, class: 'n' }); t2.textContent = (c.n || '').slice(0, 16);
    el(g, 'title', {}).textContent = c.h + ' · ' + (c.n || '') + ' — clic para colocar o quitar';
    g.onclick = () => ACT.has(c.h) ? quitarCarta(c.h) : agregarCarta(c.h);
    g.onmouseenter = () => resaltar(c.h, true); g.onmouseleave = () => resaltar(c.h, false);
  }
  caja.replaceChildren(s); marcarMinis();
}
function marcarMinis() { document.querySelectorAll('.cc-om-svg .hoja, .cc-mini-svg .hj').forEach(g => g.classList.toggle('act', ACT.has(g.dataset.hoja))); }
// contorno temporal de la hoja en el mapa grande mientras el cursor está sobre ella en una lista
const gHi = el(null, 'g', { id: 'cc-hi' }); gHi.style.pointerEvents = 'none';
function resaltar(hoja, si) {
  gHi.replaceChildren(); if (!si) return; const c = HOJAS.get(hoja); if (!c) return;
  if (!gHi.isConnected) scene.append(gHi);
  const [ax, ay] = aEscena(c.b[0], c.b[3]), [bx, by] = aEscena(c.b[2], c.b[1]);
  el(gHi, 'rect', { x: ax, y: ay, width: bx - ax, height: by - ay, fill: '#B79A5B', 'fill-opacity': .18, stroke: '#B79A5B', 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke' });
}

const zoomPrevio = zoom;
zoom = function (f) { zoomPrevio(f); const g = gPin.firstChild; if (g) { const m = g.getAttribute('transform').replace(/scale\([^)]*\)/, `scale(${1 / scale})`); g.setAttribute('transform', m); } etiquetasIndice(); etiquetasDivisiones(); escalarUnidades(); };
$('cc-ver-indice').onchange = dibujarIndice;

/* ---------- ficha de una unidad (en la ficha de información del geovisor) ---------- */
function fichaUnidad(u) {
  const F = window.EMTE_FICHA; if (!F) return;
  const info = F.abrir(u.k === 'p' ? 'FICHA DE PUESTO MILITAR' : 'FICHA DE UNIDAD MILITAR', (u.sg ? u.sg + ' ' : '') + u.n, u.k === 'p' ? 'PUESTO MILITAR ADELANTADO' : (u.t || 'UNIDAD MILITAR'), [u.lon, u.lat]); if (!info) return;
  F.poner(info,
    F.chips([[u.dv ? 'DIVISIÓN ' + u.dv : null, 'no'], [u.hj ? 'CARTA ' + u.hj : null, 'med']]),
    F.bloque('1. IDENTIFICACIÓN', [['Denominación', u.n], ['Sigla', u.sg], ['Unidad', u.u], ['División (2024)', u.dv]]),
    F.bloque('2. UBICACIÓN', [['Localidad', u.loc], ['Municipio', u.mun], ['Provincia', u.prov], ['Departamento', u.dp], ...F.ubicacion(u.lon, u.lat)]),
    F.bloque('3. CARTOGRAFÍA', [['Carta 1:50.000', u.hj ? u.hj + (u.hn ? ' · ' + u.hn : '') : '']]),
    F.cercanos(u.lon, u.lat, null, '4. LO MÁS CERCANO'));
  if (u.hj && HOJAS.has(u.hj)) info.append(F.boton('VER LA CARTA ' + u.hj + ' EN EL MAPA', () => agregarCarta(u.hj)));
}
function irUnidad(u) { marcador(u); fichaUnidad(u); const d = .03; volar(u.lon - d, u.lat - d, u.lon + d, u.lat + d, 1); }

/* ---------- cascada ---------- */
function itemCarta(c, extra) {
  const b = h('button', 'cc-it'); b.type = 'button'; b.dataset.hoja = c.h; if (ACT.has(c.h)) b.classList.add('on');
  b.append(h('span', 'cod', c.h), h('span', 'nom', c.n || 'Sin nombre impreso'), h('span', 'ir', '➜'));
  b.append(h('span', 'sec', extra || `${c.lim[0]}–${c.lim[1]} · ${c.lim[2]}–${c.lim[3]} · UTM ${c.z}S${c.pdf ? ' · PDF original' : ''}`));
  b.title = 'Colocar o quitar la carta ' + c.h + ' en el mapa'; b.onclick = () => { if (ACT.has(c.h) && b.closest('.cc-menu')) quitarCarta(c.h); else agregarCarta(c.h); }; return b;
}
function itemUnidad(u) {
  const b = h('button', 'cc-it'); b.type = 'button';
  const ico = h('span', 'ico', (u.sg || '').replace(/\./g, '').slice(0, 4) || 'U'); ico.style.background = COLOR_TIPO(u.t);
  b.append(ico, h('span', 'nom', u.n), h('span', 'ir', '⌖'));
  b.append(h('span', 'sec', [u.u, u.loc, u.hj ? 'Carta ' + u.hj : ''].filter(Boolean).join(' · ')));
  b.title = 'Ir a ' + u.n; b.onclick = () => irUnidad(u); return b;
}
function sub(titulo, n, llenar) {
  const d = h('details', 'cc-sub'), s = h('summary'); s.append(h('span', null, titulo), h('span', 'cc-cnt')); s.lastChild.append(h('span', null, n));
  d.append(s); let hecho = false;
  d.addEventListener('toggle', () => { if (d.open && !hecho) { hecho = true; const l = h('div', 'cc-lista'); llenar(l); d.append(l); } });
  return d;
}
let MODO = 'dep', SEL = null;
panel.querySelectorAll('.cc-modo button').forEach(b => b.onclick = () => { MODO = b.dataset.m; SEL = null; panel.querySelectorAll('.cc-modo button').forEach(x => x.classList.toggle('on', x === b)); $('cc-busca').value = ''; construir(); });
function regiones() {   // departamentos o divisiones: {k, nombre, rs, color}
  if (MODO === 'dep') { const m = new Map(); D.departamentos.forEach(d => { if (!m.has(d.n)) m.set(d.n, { k: d.n, nombre: d.n, rs: [] }); m.get(d.n).rs.push(...d.r); }); return [...m.values()]; }
  return (DIVS || []).map(d => ({ k: d.k, nombre: d.n, rs: d.r, color: COLOR_DIV(d.k) }));
}
function cartasDe(k) { return D.hojas.filter(c => MODO === 'dep' ? c.dp.includes(k) : c.dv === k); }
function unidadesDe(k) { return D.unidades.filter(u => MODO === 'dep' ? u.dp === k : u.dv === k); }
function construir() {
  if (!D) return;
  if (MODO === 'div' && !DIVS) { $('cc-sel').replaceChildren(h('p', 'cc-vacio', 'Cargando divisiones…')); fetch('cartas/divisiones.json').then(r => r.json()).then(d => { DIVS = d.divisiones.sort((a, b) => ORDEN_DIV(a.k) - ORDEN_DIV(b.k)); construir(); }).catch(() => $('cc-sel').replaceChildren(h('p', 'cc-vacio', 'No se pudo cargar la capa de divisiones.'))); return; }
  miniBolivia(); ruta(); seleccion();
}
let MINI = null;
function miniBolivia() {
  const R = regiones(), W = 440, H = 300;
  const bb = [-69.7, -22.95, -57.4, -9.6], P = proyector(bb, W, H, 6);
  const s = el(null, 'svg', { viewBox: `0 0 ${W} ${H}`, class: 'cc-mini-svg' });
  for (const r of R) {
    const n = cartasDe(r.k).length, g = el(s, 'g', { class: 'rg' + (SEL === r.k ? ' sel' : ''), 'data-k': r.k });
    const p = el(g, 'path', { d: anillosD(r.rs, P), 'fill-rule': 'evenodd' });
    if (r.color) { p.style.setProperty('--c', r.color); g.classList.add('col'); }
    el(g, 'title', {}).textContent = `${r.k}${r.nombre !== r.k ? ' · ' + r.nombre : ''} — ${n} cartas`;
    g.onclick = () => { SEL = SEL === r.k ? null : r.k; construir(); if (SEL) enfocar(r); };
  }
  // hojas de la selección como cuadritos
  if (SEL) for (const c of cartasDe(SEL)) { const [x0, y0] = P(c.b[0], c.b[3]), [x1, y1] = P(c.b[2], c.b[1]); const r = el(s, 'rect', { x: x0, y: y0, width: Math.max(1, x1 - x0), height: Math.max(1, y1 - y0), class: 'hj', 'data-hoja': c.h }); el(r, 'title', {}).textContent = c.h + ' · ' + (c.n || ''); r.onclick = () => agregarCarta(c.h); }
  // etiquetas
  for (const r of R) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; let mayor = r.rs.reduce((a, b) => b.length > a.length ? b : a, []); mayor.forEach(([lo, la]) => { const [x, y] = P(lo, la); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    const t = el(s, 'text', { x: (x0 + x1) / 2, y: (y0 + y1) / 2, class: 'et' + (SEL === r.k ? ' sel' : '') }); t.textContent = r.k.replace('CMDO. UU. DD. EJTO.', 'CMDO.'); }
  $('cc-mini').replaceChildren(s); MINI = s; marcarMinis();
}
function enfocar(r) {
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90; r.rs.flat().forEach(([lo, la]) => { x0 = Math.min(x0, lo); x1 = Math.max(x1, lo); y0 = Math.min(y0, la); y1 = Math.max(y1, la); });
  if (MODO === 'dep') mostrarDepartamento(r.k); else { gDep.replaceChildren(); volar(x0, y0, x1, y1, .9); }
}
function ruta() {
  const r = $('cc-ruta'); r.replaceChildren();
  const b = h('button', 'cc-miga' + (SEL ? '' : ' on'), 'BOLIVIA'); b.type = 'button'; b.onclick = () => { SEL = null; gDep.replaceChildren(); construir(); volar(-69.7, -22.95, -57.4, -9.6, .95); }; r.append(b);
  if (SEL) { r.append(h('span', null, '›')); r.append(h('b', null, SEL)); }
}
function grupoCartas(titulo, color, cartas, abierto) {
  const d = h('details', 'cc-grupo'); d.open = !!abierto; const s = h('summary'), sw = h('span', 'cc-sw'); sw.style.background = color || '#12294A';
  s.append(sw, h('span', 'tt', titulo), h('span', 'n', cartas.length + ' cartas')); d.append(s);
  let hecho = false; const llenar = () => { if (hecho) return; hecho = true; const g = h('div', 'cc-chips'); cartas.forEach(c => g.append(chip(c))); d.append(g); };
  if (abierto) llenar(); d.addEventListener('toggle', () => d.open && llenar());
  return d;
}
function chip(c) {
  const b = h('button', 'cc-chip' + (ACT.has(c.h) ? ' on' : '')); b.type = 'button'; b.dataset.hoja = c.h;
  b.append(h('b', null, c.h), h('span', null, c.n || 'sin nombre')); b.title = `${c.h} · ${c.n || ''} · ${c.dv} · ${c.dp.join(' / ')} — clic para colocar o quitar`;
  b.onclick = () => ACT.has(c.h) ? quitarCarta(c.h) : agregarCarta(c.h);
  b.onmouseenter = () => resaltar(c.h, true); b.onmouseleave = () => resaltar(c.h, false);
  return b;
}
function seleccion() {
  const box = $('cc-sel'); box.replaceChildren();
  if (!SEL) {   // resumen de todas las regiones
    const R = regiones().map(r => ({ r, n: cartasDe(r.k).length })).filter(x => x.n).sort((a, b) => MODO === 'dep' ? a.r.k.localeCompare(b.r.k, 'es') : ORDEN_DIV(a.r.k) - ORDEN_DIV(b.r.k));
    const g = h('div', 'cc-tarjs');
    R.forEach(({ r, n }) => { const t = h('button', 'cc-tarj'); t.type = 'button'; const sw = h('span', 'cc-sw'); sw.style.background = r.color || '#12294A'; t.append(sw, h('b', null, r.k), h('small', null, n + ' cartas · ' + unidadesDe(r.k).length + ' unid.')); t.onclick = () => { SEL = r.k; construir(); enfocar(r); }; g.append(t); });
    box.append(h('h4', null, MODO === 'dep' ? 'ELIGE UN DEPARTAMENTO' : 'ELIGE UNA DIVISIÓN'), g); return;
  }
  const hj = cartasDe(SEL), un = unidadesDe(SEL);
  // cartas agrupadas: por división (modo departamento) o por departamento (modo división)
  const grupos = new Map(); hj.forEach(c => { const ks = MODO === 'dep' ? [c.dv] : c.dp; ks.forEach(k => { if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(c); }); });
  const orden = [...grupos.keys()].sort((a, b) => MODO === 'dep' ? ORDEN_DIV(a) - ORDEN_DIV(b) : a.localeCompare(b, 'es'));
  box.append(h('h4', null, `${hj.length} CARTAS`));
  orden.forEach((k, i) => box.append(grupoCartas(MODO === 'dep' ? k + (D.divisiones[k] ? ' · ' + D.divisiones[k] : '') : k, MODO === 'dep' ? COLOR_DIV(k) : '#12294A', grupos.get(k).sort((a, b) => a.h.localeCompare(b.h, 'es', { numeric: true })), orden.length <= 2 || i === 0)));
  if (un.length) {
    const d = h('details', 'cc-grupo'), s = h('summary'); s.append(h('span', 'tt', 'Unidades y puestos militares'), h('span', 'n', un.length)); d.append(s);
    let hecho = false; d.addEventListener('toggle', () => { if (!d.open || hecho) return; hecho = true; const l = h('div', 'cc-lista'); un.sort((a, b) => a.n.localeCompare(b.n, 'es')).forEach(u => l.append(itemUnidad(u))); d.append(l); });
    box.append(d);
  }
}
function buscar(q) {
  const t = norm(q.trim()); if (!t) { construir(); return; }
  const box = $('cc-sel'); box.replaceChildren();
  const hj = D.hojas.filter(c => norm(c.h + ' ' + c.n + ' ' + c.dv + ' ' + c.dp.join(' ')).includes(t)).slice(0, 80);
  const un = D.unidades.filter(u => norm([u.n, u.u, u.loc, u.mun, u.prov, u.dv, u.dp, u.sg, u.hj].join(' ')).includes(t)).slice(0, 60);
  if (hj.length) { box.append(h('h4', null, `CARTAS (${hj.length}${hj.length === 80 ? '+' : ''})`)); const g = h('div', 'cc-chips'); hj.forEach(c => g.append(chip(c))); box.append(g); }
  if (un.length) { box.append(h('h4', null, `UNIDADES Y PUESTOS (${un.length}${un.length === 60 ? '+' : ''})`)); const l = h('div', 'cc-lista'); un.forEach(u => l.append(itemUnidad(u))); box.append(l); }
  if (!hj.length && !un.length) box.append(h('p', 'cc-vacio', 'No se encontraron cartas ni unidades con ese texto.'));
}
let tBusca = 0; $('cc-busca').addEventListener('input', e => { clearTimeout(tBusca); tBusca = setTimeout(() => buscar(e.target.value), 150); });
function avisar(t) { const a = $('cc-aviso'); a.textContent = t; a.hidden = !t; }

/* ---------- arranque ---------- */
fetch('cartas/indice.json').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => {
  D = d; d.hojas.forEach(c => HOJAS.set(c.h, c));
  $('cc-k1').textContent = d.hojas.length.toLocaleString('es-BO'); $('cc-k2').textContent = new Set(d.departamentos.map(x => x.n)).size;
  $('cc-k3').textContent = new Set(d.hojas.map(c => c.dv)).size; $('cc-k4').textContent = d.unidades.length;
  $('cc-pie').textContent = 'Fuentes: ' + Object.values(d.fuentes || {}).join(' · ') + '.';
  construir(); try { prepararUnidades(); } catch (e) { console.error(e); }
  return fetch('cartas/omasuyos.json').then(r => r.json()).then(listaOmasuyos).catch(() => { $('cc-om-lista').replaceChildren(h('p', 'cc-vacio', 'No se pudo cargar la lista de cartas de Omasuyos.')); });
}).catch(err => {
  console.error('cartas', err);
  // invitados: las cartas IGM son de uso restringido (el servidor responde 403)
  const msg = () => { const p = h('div', 'cc-bloq'); p.append(h('b', null, '🔒 CARTAS IGM · SOLO USUARIOS REGISTRADOS'), h('span', null, 'Ingresa con tu usuario para ver y colocar las cartas.')); return p; };
  $('cc-om-lista').replaceChildren(msg()); $('cc-sel').replaceChildren(msg()); masBtn.disabled = true; $('cc-badge').textContent = '🔒';
});
fetch('/api/cartas/estado').then(r => r.json()).then(e => {
  disponible = !!e.disponible;
  if (!disponible) avisar(e.mensaje || 'Las imágenes de las cartas no están disponibles en este servidor.');
  else if (e.geotiff_completos < e.hojas - 5) avisar(`GeoTIFF completos preparados: ${e.geotiff_completos} de ${e.hojas}. Mientras se completan, la descarga entrega el GeoTIFF recortado al marco.`);
}).catch(() => { disponible = false; avisar('No se pudo consultar el servicio de cartas.'); });
});
