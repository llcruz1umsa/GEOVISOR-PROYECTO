/* Fuerzas Armadas · datos 2024 (agregado por BYNS7, 30-10-2026). SOLO USUARIOS REGISTRADOS.
   Al final de la pestaña PLANEAMIENTO: todo el contenido de EJERCITO_2024.gdb y UU.MOD, dividido por fuerzas
   (Ejército, Armada, Fuerza Aérea, Comando en Jefe), con las figuras del catálogo del calco (planeamiento/simbolos.json).
   Datos: planeamiento/fuerzas_armadas.json. La carpeta /planeamiento/ no se entrega a invitados (acceso_local.py). */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const scene = document.getElementById('scene'); if (!scene) return;
const NS = 'http://www.w3.org/2000/svg', K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702, D2R = Math.PI / 180;
const aEscena = (lon, lat) => [500 + (lon * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) + OY) * K];
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const AZUL = '#0033cc';
const FUERZAS = [['EJERCITO', 'Ejército', '#2e6b2e'], ['ARMADA', 'Armada Boliviana', '#0b3d91'], ['FUERZA AEREA', 'Fuerza Aérea Boliviana', '#3a8fd6'], ['COMANDO EN JEFE', 'Comando en Jefe de las FF.AA.', '#7a1f1f']];
const POR_DEFECTO = new Set(['Grandes Unidades de Combate (divisiones)', 'Unidades de combate (regimientos y batallones)', 'Distritos y áreas navales', 'Unidades navales', 'Grupos aéreos', 'Comando General', 'Comandos Estratégicos Operacionales (CEO)']);
let D = null, SV = null, activo = false, soloOm = false; const vis = new Set(POR_DEFECTO);

/* ---------- figuras (catálogo del calco, coordenadas 0–200) ---------- */
const dentro = k => (SV[k] || '').replace(/^<(rect|circle)[^>]*\/>/, '');
const texto = (t, y = 112, fs = 34) => `<text x="100" y="${y}" font-family="Arial" font-weight="bold" font-size="${t.length > 3 ? Math.round(fs * 3.2 / t.length) : fs}" text-anchor="middle" fill="currentColor" stroke="none">${esc(t)}</text>`;
function figura(sim, e) {
  let s;
  if (sim.startsWith('i:')) s = SV.instalacion + texto(sim.slice(2), 111, 30);
  else if (sim === 'i+arm') s = SV.instalacion + `<g transform="translate(100 100) scale(.8) translate(-100 -100)">${dentro('u_arm')}</g>`;
  else if (sim.startsWith('pc:')) s = SV.puesto_comando + texto(sim.slice(3));
  else if (sim === 'pc+arm') s = SV.puesto_comando + dentro('u_arm');
  else if (sim.startsWith('t:')) s = SV.unidad + texto(sim.slice(2));
  else if (sim === 'jur') s = `<path d="M20 150L70 60 130 120 180 40" fill="none" stroke="currentColor" stroke-width="8"/>`;
  else s = SV.unidad + sim.split('+').filter(x => x !== 'div' && x !== 'unidad').map(x => dentro('u_' + x)).join('');
  if (e && sim !== 'jur') s += `<text x="100" y="47" font-family="Arial" font-weight="bold" font-size="30" text-anchor="middle" fill="currentColor" stroke="none" letter-spacing="2">${e}</text>`;
  if (e && sim === 'jur') s += `<text x="100" y="190" font-family="Arial" font-weight="bold" font-size="40" text-anchor="middle" fill="currentColor">${e}</text>`;
  return s;
}
const icono = (p, px = 36) => `<svg viewBox="0 0 200 200" width="${px}" height="${px}" style="color:${AZUL}" aria-hidden="true">${figura(p.sim, p.esc)}</svg>`;

/* ---------- mapa ---------- */
const g = document.createElementNS(NS, 'g'); g.id = 'topo-fuerzas';
const css = h('style');
css.textContent = `#topo-fuerzas .fa-s{cursor:pointer}#topo-fuerzas .fa-s:hover{filter:drop-shadow(0 0 4px #B79A5B)}#topo-fuerzas path.fa-j{cursor:pointer}
.fa-sec{margin-top:6px;border:1px solid #c9d1de;border-radius:10px;overflow:hidden;background:#fff}
.fa-cab{padding:11px 12px;background:linear-gradient(135deg,#12294A,#0B1D33);color:#fff}
.fa-cab b{display:block;font:800 12.5px var(--tipo-titulo,system-ui);letter-spacing:.08em;color:#E2CB8E}
.fa-cab small{display:block;margin-top:3px;font-size:10px;color:#d5dcea;line-height:1.35}
.fa-op{display:grid;gap:4px;padding:8px 12px;border-bottom:1px solid #e5e9e3;background:#F8FAFC}
.fa-todo{display:grid;grid-template-columns:1.6fr 1fr;gap:6px;margin-top:4px}
.fa-todo button{padding:8px 6px;border:1px solid #0B1D33;border-radius:8px;background:linear-gradient(135deg,#12294A,#0B1D33);color:#fff;font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.05em;cursor:pointer;line-height:1.2}
.fa-todo button small{display:block;font-weight:600;color:#E2CB8E;letter-spacing:0}
.fa-todo .fa-menos{background:#fff;color:#9B1C1C;border-color:#E8B7B7}
.fa-op label{display:flex!important;gap:8px;align-items:center;font-size:11.5px!important;font-weight:600;color:#12294A}
.fa-fz{border-top:1px solid #e5e9e3}
.fa-fz>summary{display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;font:800 12px var(--tipo-titulo,system-ui);letter-spacing:.08em;color:#fff!important;background:#0B1D33!important;list-style:none}
.fa-fz>summary::-webkit-details-marker{display:none}
.fa-fz>summary::before{content:'▸';color:#E2CB8E;transition:transform .15s}.fa-fz[open]>summary::before{transform:rotate(90deg)}
.fa-fz>summary i{width:12px;height:12px;border-radius:3px;border:1.5px solid #fff;flex:none}
.fa-fz>summary small,.fa-cat>summary small{margin-left:auto;color:#B79A5B;font-weight:600;letter-spacing:0}
.fa-cat{border-top:1px solid #e5e9e3;margin-left:8px}
.fa-cat>summary{display:flex;align-items:center;gap:7px;padding:8px 10px;cursor:pointer;font-size:11.5px;font-weight:700;color:#2A3D57;background:#F8FAFC!important}
.fa-cat>summary input{flex:none;margin:0}
.fa-cat>summary svg{flex:none}
.fa-sub{margin-left:12px;border-top:1px dashed #e5e9e3}
.fa-sub>summary{padding:6px 10px;font-size:11px;font-weight:700;color:#5A6B80;cursor:pointer}
.fa-it{display:flex;width:100%;gap:9px;align-items:center;text-align:left;border:0;border-top:1px solid #eef1ed;padding:4px 10px;font-size:11.5px;background:#fff;color:#182d38;cursor:pointer}
.fa-it:hover{background:#eef3fb}.fa-it svg{flex:none;background:#eef1e8;border-radius:4px}
.fa-it span{min-width:0;overflow-wrap:anywhere;line-height:1.25}.fa-it small{display:block;color:#64737b;font-size:10px}
.fa-it.om span::after{content:' · OMASUYOS';color:#B79A5B;font-size:9.5px;font-weight:700}`;
document.head.append(css);
function ruta(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates; let d = '';
  for (const p of polys) for (const r of p) d += 'M' + r.map(c => aEscena(c[0], c[1]).map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
  return d;
}
// 10-11-2026: «Solo los de Omasuyos» muestra TODO lo de las FF.AA. que está en la provincia (unidades, puestos
// militares, institutos, IGM, unidades navales y jurisdicciones), sin importar las categorías marcadas.
const visible = f => soloOm ? !!f.properties.om : vis.has(f.properties.cat);
// ¿el elemento está en Omasuyos o la toca? (punto dentro del límite, o polígonos que se cruzan)
function dentroAnillo(pt, r) { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
const poligonos = g => g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
const dentroGeom = (pt, g) => poligonos(g).some(p => dentroAnillo(pt, p[0]) && !p.slice(1).some(h => dentroAnillo(pt, h)));
function marcarOmasuyos(lim) {
  const anillosLim = poligonos(lim).map(p => p[0]);
  for (const f of D.features) {
    if (f.properties.om) continue; const g = f.geometry; let si = false;
    if (g.type === 'Point') si = dentroGeom(g.coordinates, lim);
    else { si = poligonos(g).some(p => p[0].some((c, i) => i % 5 === 0 && dentroGeom(c, lim))) || anillosLim.some(r => r.some((c, i) => i % 7 === 0 && dentroGeom(c, g))); }
    if (si) f.properties.om = true;
  }
}
function etiquetasLimite(f, k) {   // símbolo de escalón (XX, III) sobre la línea de límite, como en el calco
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const anillo = polys.map(p => p[0]).sort((a, b) => b.length - a.length)[0]; if (!anillo || anillo.length < 8) return;
  for (const q of [.12, .37, .62, .87]) {
    const c = anillo[Math.floor(anillo.length * q)], [x, y] = aEscena(c[0], c[1]);
    const t = document.createElementNS(NS, 'text'); t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('font-size', 13 * k);
    t.setAttribute('font-weight', 800); t.setAttribute('font-family', 'Arial'); t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'middle');
    t.setAttribute('fill', AZUL); t.setAttribute('stroke', '#fff'); t.setAttribute('stroke-width', 3 * k); t.setAttribute('paint-order', 'stroke'); t.setAttribute('pointer-events', 'none');
    t.textContent = f.properties.esc; g.append(t);
  }
}
function dibujar() {
  g.replaceChildren(); if (!activo || !D) { g.remove(); return; }
  const k = 1 / scale;
  for (const f of D.features) {
    if (f.geometry.type === 'Point' || !visible(f)) continue;
    const div = f.properties.esc === 'XX', e = document.createElementNS(NS, 'path');
    e.setAttribute('d', ruta(f.geometry)); e.setAttribute('class', 'fa-j'); e.setAttribute('fill', AZUL); e.setAttribute('fill-opacity', '.03'); e.setAttribute('fill-rule', 'evenodd');
    e.setAttribute('stroke', AZUL); e.setAttribute('stroke-width', div ? 3 : 1.8); e.setAttribute('vector-effect', 'non-scaling-stroke');
    e.innerHTML = `<title>${esc(f.properties.sigla)}</title>`; e.addEventListener('click', ev => { ev.stopPropagation(); ficha(f); }); g.append(e);
    etiquetasLimite(f, k);
  }
  for (const f of D.features) {
    if (f.geometry.type !== 'Point' || !visible(f)) continue;
    const p = f.properties, [x, y] = aEscena(...f.geometry.coordinates), m = document.createElementNS(NS, 'g');
    m.setAttribute('class', 'fa-s'); m.dataset.x = x; m.dataset.y = y; m.setAttribute('transform', `translate(${x} ${y}) scale(${k})`); m.style.color = AZUL;
    m.innerHTML = `<g transform="translate(-19 -19) scale(.19)">${figura(p.sim, p.esc)}</g>` + (scale >= 2.5 ? `<text x="21" y="4" font-family="Bahnschrift,system-ui,sans-serif" font-size="11" font-weight="700" fill="#0B1D33" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(p.sigla)}</text>` : '') + `<title>${esc(p.sigla)} · ${esc(p.nombre || p.cat)}</title>`;
    m.addEventListener('click', ev => { ev.stopPropagation(); ficha(f); }); g.append(m);
  }
  const ref = document.getElementById('topo-municipios-nombres'); ref ? ref.before(g) : scene.append(g);
}
function centro(f) {
  if (f.geometry.type === 'Point') return f.geometry.coordinates;
  let sx = 0, sy = 0, n = 0; const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) for (const c of p[0]) { sx += c[0]; sy += c[1]; n++; } return [sx / n, sy / n];
}
const ETQ = [['codigo', 'Código'], ['sigla', 'Nombre abreviado'], ['nombre', 'Nombre completo'], ['arma', 'Arma'], ['ubicacion', 'Ubicación'], ['provincia', 'Provincia'], ['guc', 'Gran Unidad / dependencia superior'], ['depende', 'Unidad de la que depende'], ['brigada', 'Brigada aérea'], ['dependencia', 'Dependencia'], ['nota', 'Nota']];
function ficha(f) {
  const F = window.EMTE_FICHA; if (!F) return;
  const p = f.properties, pol = f.geometry.type !== 'Point', c = pol ? null : f.geometry.coordinates, fz = FUERZAS.find(x => x[0] === p.fuerza);
  const info = F.abrir(pol ? 'FICHA DE JURISDICCIÓN MILITAR' : 'FICHA MILITAR', p.sigla, (fz ? fz[1] : p.fuerza) + ' · ' + p.cat, c); if (!info) return;
  const ic = F.el('div', 'fs-ico'); ic.innerHTML = icono(p, 54); info.append(ic);
  const bloques = [F.chips([['🔒 USO RESTRINGIDO', 'no'], [p.om ? 'EN OMASUYOS' : null, 'si']]),
    F.bloque('1. IDENTIFICACIÓN', ETQ.map(([k, t]) => [t, p[k]]))];
  if (p.responsabilidad || p.convenio || p.situacion) bloques.push(F.bloque('2. MISIÓN Y SITUACIÓN', [['Responsabilidad', p.responsabilidad], ['Convenio', p.convenio], ['Situación de las instalaciones', p.situacion]]));
  if (pol) bloques.push(F.bloque('2. ÁREA', [['Superficie de la jurisdicción', p.area_km2 != null ? p.area_km2.toLocaleString('es-BO') + ' km²' : null], ['Toca Omasuyos', p.om ? 'Sí' : 'No']]));
  else bloques.push(F.bloque('3. UBICACIÓN', F.ubicacion(c[0], c[1])));
  bloques.push(F.bloque('4. FUENTE', [['Fuente', p.fuente]]));
  F.poner(info, ...bloques);
}

/* ---------- pestaña al final de PLANEAMIENTO ---------- */
function panel() {
  const body = document.querySelector('.calco-menu .calco-body'); if (!body || body.querySelector('.fa-sec')) return !!body;
  const sec = h('section', 'fa-sec');
  sec.innerHTML = `<div class="fa-cab"><b>FUERZAS ARMADAS · DATOS 2024 🔒</b><small>${D.features.length} elementos de EJERCITO_2024.gdb y UU.MOD, divididos por fuerza. Toca un elemento para ubicarlo y ver su ficha.</small></div>
  <div class="fa-op"><label><input type="checkbox" class="fa-ver"> Mostrar en el mapa</label><label><input type="checkbox" class="fa-om"> Solo los de Omasuyos</label><div class="fa-todo"><button type="button" class="fa-mas">＋ AGREGAR TODOS AL MAPA <small></small></button><button type="button" class="fa-menos">QUITAR TODOS</button></div></div>`;
  const ver = sec.querySelector('.fa-ver'), om = sec.querySelector('.fa-om');
  ver.onchange = () => { activo = ver.checked; dibujar(); };
  om.onchange = () => {
    soloOm = om.checked; rotTodos(); sec.querySelectorAll('.fa-it').forEach(b => { b.hidden = soloOm && !b.classList.contains('om'); }); contar();
    if (soloOm && !ver.checked) { ver.checked = true; activo = true; }   // al activarlo se ve en el mapa de una vez
    dibujar();
    if (soloOm && window.EMTE_TOPO?.volar) window.EMTE_TOPO.volar(-69.02, -16.28, -68.46, -15.74);
  };
  const contadores = [], cbs = {};
  // agregar / quitar TODOS los elementos (todas las fuerzas y categorías) de una vez
  const mas = sec.querySelector('.fa-mas'), menos = sec.querySelector('.fa-menos'), nTodos = () => D.features.filter(f => !soloOm || f.properties.om).length;
  const rotTodos = () => { mas.querySelector('small').textContent = nTodos() + ' elementos' + (soloOm ? ' de Omasuyos' : ''); };
  mas.onclick = () => {
    D.features.forEach(f => vis.add(f.properties.cat)); Object.values(cbs).forEach(c => { c.checked = true; });
    ver.checked = true; activo = true; dibujar();
    const P = D.features.filter(visible).map(centro).filter(c => c && isFinite(c[0]));
    if (P.length && window.EMTE_TOPO?.volar) { const lo = P.map(c => c[0]), la = P.map(c => c[1]); window.EMTE_TOPO.volar(Math.min(...lo), Math.min(...la), Math.max(...lo), Math.max(...la)); }
  };
  menos.onclick = () => { vis.clear(); Object.values(cbs).forEach(c => { c.checked = false; }); ver.checked = false; activo = false; dibujar(); };
  setTimeout(rotTodos, 0);
  // API para el organigrama y la búsqueda de FFAA (ffaa-organigrama.js)
  window.EMTE_FFAA = { D, icono, FUERZAS, centro,
    todos: () => mas.click(), quitarTodos: () => menos.click(),
    mostrar: v => { if (ver.checked !== !!v) { ver.checked = !!v; activo = !!v; dibujar(); } },
    ir: f => { const cat = f.properties.cat; if (!vis.has(cat)) { vis.add(cat); if (cbs[cat]) cbs[cat].checked = true; } if (!ver.checked) { ver.checked = true; activo = true; } dibujar();
      const [lo, la] = centro(f); if (f.geometry.type === 'Point') window.EMTE_FICHA?.centrar(lo, la); ficha(f); } };
  function contar() { contadores.forEach(([el, fs]) => { el.textContent = fs.filter(f => !soloOm || f.properties.om).length; }); }
  for (const [id, nombre, col] of FUERZAS) {
    const fsF = D.features.filter(f => f.properties.fuerza === id); if (!fsF.length) continue;
    const dF = h('details', 'fa-fz'), sF = h('summary'), dot = h('i'); dot.style.background = col; const nF = h('small');
    sF.append(dot, document.createTextNode(nombre.toUpperCase()), nF); dF.append(sF); contadores.push([nF, fsF]);
    const cats = [...new Set(fsF.map(f => f.properties.cat))];
    cats.sort((a, b) => (a === 'Comando General' ? -1 : b === 'Comando General' ? 1 : 0));
    for (const cat of cats) {
      const fs = fsF.filter(f => f.properties.cat === cat), dC = h('details', 'fa-cat'), sC = h('summary'), cb = h('input'), nC = h('small');
      cb.type = 'checkbox'; cb.checked = vis.has(cat); cb.title = 'Mostrar esta categoría en el mapa'; cbs[cat] = cb;
      cb.onchange = () => { cb.checked ? vis.add(cat) : vis.delete(cat); if (cb.checked && !ver.checked) { ver.checked = true; activo = true; } dibujar(); };
      const muestra = h('span'); muestra.innerHTML = icono(fs[0].properties, 24);
      sC.append(cb, muestra, document.createTextNode(cat), nC); dC.append(sC); contadores.push([nC, fs]);
      const grupos = [...new Set(fs.map(f => f.properties.grupo).filter(Boolean))];
      const item = f => {
        const p = f.properties, b = h('button', 'fa-it' + (p.om ? ' om' : '')); b.type = 'button';
        b.innerHTML = icono(p, 34) + `<span>${esc(p.sigla)}<small>${esc(p.ubicacion || p.nombre || '')}</small></span>`;
        b.onclick = () => { if (!vis.has(cat)) { vis.add(cat); cb.checked = true; } if (!ver.checked) { ver.checked = true; activo = true; } dibujar();
          const [lo, la] = centro(f); if (f.geometry.type === 'Point') window.EMTE_FICHA?.centrar(lo, la); ficha(f); };
        return b;
      };
      if (grupos.length > 1 && fs.length > 8) {
        grupos.sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
        for (const gr of grupos) { const dG = h('details', 'fa-sub'), sG = h('summary'); const fg = fs.filter(f => f.properties.grupo === gr);
          sG.textContent = `${gr} (${fg.length})`; dG.append(sG, ...fg.map(item)); dC.append(dG); }
        const sin = fs.filter(f => !f.properties.grupo); if (sin.length) dC.append(...sin.map(item));
      } else dC.append(...fs.map(item));
      dF.append(dC);
    }
    sec.append(dF);
  }
  contar(); body.append(sec); return true;
}
Promise.all([fetch('planeamiento/simbolos.json').then(r => r.ok ? r.json() : Promise.reject()), fetch('planeamiento/fuerzas_armadas.json').then(r => r.ok ? r.json() : Promise.reject())])
  .then(([s, d]) => fetch('data/limite_omasuyos.geojson').then(r => r.json()).then(l => { D = d; try { marcarOmasuyos(l.features[0].geometry); } catch (e) {} }, () => {}).then(() => [s, d]))
  .then(([s, d]) => { SV = s.svg; D = d; window.EMTE_FUERZAS_ARMADAS = d; let n = 0; (function esperar() { if (!panel() && ++n < 80) setTimeout(esperar, 250); })(); })
  .catch(() => {});
const zoomAnterior = zoom;
zoom = function (f) { zoomAnterior(f); if (activo) { const k = 1 / scale; g.querySelectorAll('.fa-s').forEach(m => m.setAttribute('transform', `translate(${m.dataset.x} ${m.dataset.y}) scale(${k})`)); clearTimeout(zoom._fa); zoom._fa = setTimeout(dibujar, 160); } };
window.EMTE_LEYENDA_MILITAR = () => {
  if (!activo || !D) return [];
  const vistos = new Map();
  for (const f of D.features) if (visible(f)) { const p = f.properties, key = p.sim + '|' + (p.esc || ''); if (!vistos.has(key)) vistos.set(key, p); }
  return [...vistos.values()].map(p => ({ nombre: p.sim === 'jur' ? 'Límite de ' + p.cat.replace('Jurisdicción de las ', '') : (p.cat.startsWith('Unidades de combate') ? p.sigla.split(/[- "]/)[0] + ' · ' + (p.arma || 'unidad') : p.cat), tipo: 'sim', s: `<g transform="translate(-11 -11) scale(.11)" style="color:${AZUL}">${figura(p.sim, p.esc)}</g>` }));
};
});
