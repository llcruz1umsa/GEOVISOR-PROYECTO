/* Población y viviendas (agregado por BYNS7). Datos del proyecto QGIS «proyectofinal»:
   · VIVIENDAS_OMASUYOS_2026: 98.867 construcciones (Google Open Buildings v3 + OpenStreetMap), clasificadas por uso.
     Se dibujan al acercar el mapa (solo las celdas visibles) y cada una tiene su ficha.
   · Densidad de viviendas: hexágonos de 0,216 km² con el número de viviendas.
   Archivos: data/viviendas_omasuyos.json y data/viviendas_hexagonos.json */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const mapa = document.querySelector('.map'), scene = document.getElementById('scene'); if (!mapa || !scene) return;
const svg = scene.ownerSVGElement, NS = 'http://www.w3.org/2000/svg', K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702, D2R = Math.PI / 180;
const aEscena = (lon, lat) => [500 + (lon * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) + OY) * K];
const deEscena = (x, y) => [((x - 500) / K - OX) / D2R, (2 * Math.atan(Math.exp((380 - y) / K - OY)) - Math.PI / 2) / D2R];
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const miles = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const ESCALA_MIN = 2.2, MAX_POL = 45000;
const HEX = ['#FDE9C9', '#FBD08B', '#F6A94E', '#E5792A', '#C4521A', '#8C2D04'];   // secuencial (un solo tono)
const HEXN = ['1–10', '11–25', '26–50', '51–100', '101–200', 'más de 200'];
let D = null, cargando = null, activa = false, ocultos = new Set(), HX = null, hexActiva = false;
const cache = new Map();   // celda → [cadena d por uso]
const gV = document.createElementNS(NS, 'g'); gV.id = 'topo-viviendas';
const gH = document.createElementNS(NS, 'g'); gH.id = 'topo-viviendas-hex';

const css = h('style');
css.textContent = `#topo-viviendas path{cursor:pointer}#topo-viviendas-hex path{cursor:pointer}
.vv-aviso{position:absolute;left:50%;top:62px;transform:translateX(-50%);z-index:8;padding:6px 14px;border-radius:16px;background:#0B1D33e6;color:#fff;font:12px var(--tipo-texto,system-ui);pointer-events:none}
.vv-aviso[hidden]{display:none}`;
document.head.append(css);
const aviso = h('div', 'vv-aviso'); aviso.hidden = true; mapa.append(aviso);

function cargar() {
  if (D) return Promise.resolve(D);
  if (!cargando) cargando = fetch('data/viviendas_omasuyos.json').then(r => r.json()).then(d => { D = d; window.EMTE_VIVIENDAS = d; return d; });
  return cargando;
}
function celda(k) {
  let c = cache.get(k); if (c) return c;
  const [ix, iy] = k.split(',').map(Number), x0 = ix * D.tile - 180, y0 = iy * D.tile - 90;
  c = D.usos.map(() => []);
  for (const f of D.tiles[k]) {
    const q = f[f.length - 1]; let s = '';
    for (let i = 0; i < q.length; i += 2) { const [x, y] = aEscena(x0 + q[i] / 1e6, y0 + q[i + 1] / 1e6); s += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2); }
    c[f[0]].push(s + 'Z');
  }
  c = c.map(a => a.join('')); cache.set(k, c); return c;
}
function vista() {
  const m = scene.getScreenCTM(), r = svg.getBoundingClientRect(); if (!m) return null;
  const inv = m.inverse(), a = new DOMPoint(r.left, r.top).matrixTransform(inv), b = new DOMPoint(r.right, r.bottom).matrixTransform(inv);
  const [lo0, la1] = deEscena(a.x, a.y), [lo1, la0] = deEscena(b.x, b.y); return [lo0, la0, lo1, la1];
}
function dibujar() {
  gV.replaceChildren(); aviso.hidden = true;
  if (!activa || !D) { gV.remove(); return; }
  if (scale < ESCALA_MIN) { aviso.textContent = 'Acerca el mapa para ver las viviendas y construcciones'; aviso.hidden = false; gV.remove(); return; }
  const v = vista(); if (!v) return;
  const T = D.tile, ix0 = Math.floor((v[0] + 180) / T) - 1, ix1 = Math.floor((v[2] + 180) / T) + 1, iy0 = Math.floor((v[1] + 90) / T) - 1, iy1 = Math.floor((v[3] + 90) / T) + 1;
  const ks = []; let n = 0;
  for (let x = ix0; x <= ix1; x++) for (let y = iy0; y <= iy1; y++) { const k = x + ',' + y; if (D.tiles[k]) { ks.push(k); n += D.tiles[k].length; } }
  if (n > MAX_POL) { aviso.textContent = `Hay ${miles(n)} construcciones en esta vista: acerca un poco más el mapa`; aviso.hidden = false; gV.remove(); return; }
  const partes = D.usos.map(() => []);
  for (const k of ks) celda(k).forEach((s, i) => { if (s) partes[i].push(s); });
  partes.forEach((p, i) => {
    if (!p.length || ocultos.has(i)) return;
    const e = document.createElementNS(NS, 'path'); e.setAttribute('d', p.join('')); e.setAttribute('fill', D.colores[i]); e.setAttribute('fill-opacity', '.9');
    e.setAttribute('stroke', '#5A3A1E'); e.setAttribute('stroke-opacity', '.45'); e.setAttribute('stroke-width', '.6'); e.setAttribute('vector-effect', 'non-scaling-stroke'); e.dataset.uso = i;
    gV.append(e);
  });
  const ref = document.getElementById('topo-municipios-nombres'); ref ? ref.before(gV) : scene.append(gV);
}
function dentro(pt, q, x0, y0) {
  let r = false; const x = pt[0], y = pt[1];
  for (let i = 0, j = q.length - 2; i < q.length; j = i, i += 2) { const xi = x0 + q[i] / 1e6, yi = y0 + q[i + 1] / 1e6, xj = x0 + q[j] / 1e6, yj = y0 + q[j + 1] / 1e6; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) r = !r; }
  return r;
}
let abajo = null;
svg.addEventListener('pointerdown', e => { abajo = [e.clientX, e.clientY]; }, true);
// El mapa captura el puntero al arrastrar, así que el clic llega al <svg>: se resuelve aquí por coordenadas.
const libre = t => t === svg || t === scene || gV.contains(t) || gH.contains(t) || !t.closest('g[id]') || /^(topo-municipios|topo-limites|basemap|water|bounds|grid)/.test(t.closest('g[id]')?.id || '');
svg.addEventListener('click', e => {
  if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 5 || !libre(e.target)) return;
  if (activa && D && scale >= ESCALA_MIN && clicVivienda(e)) { e.stopPropagation(); return; }
  if (hexActiva && HX && clicHex(e)) e.stopPropagation();
}, true);
function clicVivienda(e) {
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(scene.getScreenCTM().inverse()), ll = deEscena(p.x, p.y), T = D.tile;
  const ix = Math.floor((ll[0] + 180) / T), iy = Math.floor((ll[1] + 90) / T);
  for (let x = ix - 1; x <= ix + 1; x++) for (let y = iy - 1; y <= iy + 1; y++) {
    const fs = D.tiles[x + ',' + y]; if (!fs) continue; const x0 = x * T - 180, y0 = y * T - 90;
    for (const f of fs) if (!ocultos.has(f[0]) && dentro(ll, f[f.length - 1], x0, y0)) { ficha(f, x0, y0); return true; }
  }
  return false;
}
function ficha(f, x0, y0) {
  const F = window.EMTE_FICHA; if (!F) return;
  const q = f[f.length - 1]; let cx = 0, cy = 0; for (let i = 0; i < q.length; i += 2) { cx += q[i]; cy += q[i + 1]; }
  const n = q.length / 2, lon = x0 + cx / n / 1e6, lat = y0 + cy / n / 1e6;
  const uso = D.usos[f[0]], conf = ['Baja (0,65–0,70)', 'Media (0,70–0,75)', 'Alta (≥ 0,75)'][f[3]];
  const info = F.abrir('FICHA DE CONSTRUCCIÓN', f[7] || uso, uso, [lon, lat]); if (!info) return;
  const sw = F.el('div', 'fs-ico'); sw.innerHTML = `<svg viewBox="-11 -11 22 22" style="width:30px;height:30px"><rect x="-8" y="-6" width="16" height="12" rx="2" fill="${D.colores[f[0]]}" stroke="#5A3A1E" stroke-width="1"/></svg>`; info.append(sw);
  F.poner(info,
    F.chips([[uso.toUpperCase(), 'no'], [miles(f[4]) + ' M²', 'no'], [conf ? 'CONFIANZA ' + conf.split(' ')[0].toUpperCase() : null, f[3] === 2 ? 'si' : f[3] === 1 ? 'med' : 'no']]),
    F.bloque('1. IDENTIFICACIÓN', [['Nombre', f[7]], ['Uso', uso], ['Tamaño', D.tamanos[f[1]]], ['Área de la huella', miles(f[4]) + ' m²'], ['Municipio', D.municipios[f[2]]]]),
    F.bloque('2. CLASIFICACIÓN', [['Cómo se clasificó', D.metodos[f[5]]], ['Confianza del modelo', conf, 'probabilidad de que sea una construcción real (Google Open Buildings)']]),
    F.bloque('3. UBICACIÓN (CENTRO)', F.ubicacion(lon, lat)),
    F.cercanos(lon, lat, null, '4. LO MÁS CERCANO'),
    F.bloque('5. FUENTE', [['Fuente', D.fuentes[f[6]]], ['Datos', 'Huella detectada con inteligencia artificial en imágenes satelitales (hasta ~2022); las casas más nuevas pueden faltar.']]));
}
/* ---------- hexágonos de densidad ---------- */
function dibujarHex() {
  gH.replaceChildren(); if (!hexActiva || !HX) { gH.remove(); return; }
  const por = HEX.map(() => []);
  for (const f of HX.features) { const p = f.properties; por[p.nivel - 1].push('M' + f.geometry.coordinates[0].map(c => aEscena(c[0], c[1]).map(v => v.toFixed(1)).join(' ')).join('L') + 'Z'); }
  por.forEach((p, i) => { if (!p.length) return; const e = document.createElementNS(NS, 'path'); e.setAttribute('d', p.join('')); e.setAttribute('fill', HEX[i]); e.setAttribute('fill-opacity', '.78'); e.setAttribute('stroke', '#fff'); e.setAttribute('stroke-width', '.4'); e.setAttribute('vector-effect', 'non-scaling-stroke'); e.dataset.n = i; gH.append(e); });
  const ref = document.getElementById('rivers'); ref && ref.parentNode === scene ? ref.before(gH) : scene.append(gH);
}
function clicHex(e) {
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(scene.getScreenCTM().inverse()), ll = deEscena(p.x, p.y);
  for (const f of HX.features) { const r = f.geometry.coordinates[0]; let ins = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { if ((r[i][1] > ll[1]) !== (r[j][1] > ll[1]) && ll[0] < (r[j][0] - r[i][0]) * (ll[1] - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) ins = !ins; }
    if (ins) { const F = window.EMTE_FICHA, q = f.properties; if (!F) return; const info = F.abrir('FICHA DE DENSIDAD DE VIVIENDAS', miles(q.n) + ' viviendas', 'Hexágono de 0,216 km² · ' + q.clase.replace(/^\d+\s*–\s*/, ''), ll);
      F.poner(info, F.bloque('1. CONTEO', [['Viviendas', miles(q.n)], ['Todas las construcciones', miles(q.c)], ['Densidad', miles(q.d) + ' viviendas por km²'], ['Clase', q.clase], ['Municipio', q.mun]]), F.bloque('2. FUENTE', [['Fuente', HX.fuente]])); return true; } }
  return false;
}
function ponerHex(on) {
  hexActiva = on; if (!on) { gH.remove(); return; }
  if (HX) dibujarHex(); else fetch('data/viviendas_hexagonos.json').then(r => r.json()).then(d => { HX = d; dibujarHex(); }).catch(() => {});
}
function poner(on) {
  activa = on; if (!on) { gV.remove(); aviso.hidden = true; return; }
  aviso.textContent = 'Cargando 98.867 construcciones…'; aviso.hidden = false;
  cargar().then(() => { dibujar(); refrescarConteos(); }).catch(() => { aviso.textContent = 'No se pudo cargar data/viviendas_omasuyos.json'; });
}
/* ---------- Capas › Población y viviendas ---------- */
let filasUso = null;
function refrescarConteos() {
  if (!D || !filasUso) return; const n = D.usos.map(() => 0);
  for (const k in D.tiles) for (const f of D.tiles[k]) n[f[0]]++;
  filasUso.forEach((s, i) => { s.textContent = miles(n[i]); });
}
function casilla() {
  const capas = document.getElementById('layers'); if (!capas || capas.querySelector('.vv-grupo')) return;
  const gr = h('details', 'layer-group vv-grupo'); gr.innerHTML = '<summary>Población y viviendas</summary>';
  const l1 = h('label'), c1 = h('input'), d1 = h('span', 'dot sim-dot'); c1.type = 'checkbox'; d1.dataset.sim = '1';
  d1.innerHTML = '<svg class="sim-ico" viewBox="-11 -11 22 22" width="20" height="20"><rect x="-8" y="-3" width="7" height="8" fill="#E8A33D" stroke="#5A3A1E" stroke-width=".8"/><rect x="1" y="-7" width="7" height="12" fill="#E8A33D" stroke="#5A3A1E" stroke-width=".8"/></svg>';
  l1.append(c1, d1, document.createTextNode('Viviendas y construcciones 2026')); gr.append(l1);
  const sub = h('details', 'layer-group vv-usos'); sub.style.margin = '0 8px 8px'; sub.innerHTML = '<summary>Usos de las construcciones</summary>'; filasUso = [];
  ['Vivienda', 'Construcción auxiliar', 'Educación', 'Salud', 'Religioso', 'Comercio / servicios', 'Gobierno / institucional', 'Deportivo', 'Militar'].forEach((u, i) => {
    const col = ['#E8A33D', '#BDB3A3', '#1F78B4', '#E31A1C', '#6A3D9A', '#FF7F00', '#33A02C', '#B2DF8A', '#3B5323'][i];
    const r = h('label'), c = h('input'), s = h('span', 'dot'), n = h('span', null, '—'); c.type = 'checkbox'; c.checked = true; r.style.cssText = 'font-size:11px;padding:6px 8px';
    s.style.cssText = `background:${col};border-radius:2px`; n.style.cssText = 'margin-left:auto;color:#64737b;font-size:10px'; filasUso.push(n);
    r.append(c, s, h('span', null, u), n); sub.append(r);
    c.onchange = () => { c.checked ? ocultos.delete(i) : ocultos.add(i); dibujar(); capas.dispatchEvent(new Event('change', { bubbles: true })); };
  });
  gr.append(sub);
  const l2 = h('label'), c2 = h('input'), d2 = h('span', 'dot'); c2.type = 'checkbox'; d2.style.background = `linear-gradient(90deg,${HEX[0]},${HEX[2]},${HEX[5]})`;
  l2.append(c2, d2, document.createTextNode('Densidad de viviendas (hexágonos)')); gr.append(l2);
  const ref = [...capas.querySelectorAll(':scope > details')].find(d => /Servicios/i.test(d.querySelector('summary')?.textContent || ''));
  ref ? ref.after(gr) : capas.append(gr);
  c1.onchange = () => { poner(c1.checked); capas.dispatchEvent(new Event('change', { bubbles: true })); };
  c2.onchange = () => { ponerHex(c2.checked); capas.dispatchEvent(new Event('change', { bubbles: true })); };
}
if (document.getElementById('layers')?.children.length) casilla();
else { const ob = new MutationObserver(() => { if (document.getElementById('layers')?.children.length) { ob.disconnect(); casilla(); } }); ob.observe(document.body, { childList: true, subtree: true }); }
const zoomAnterior = zoom;
zoom = function (f) { zoomAnterior(f); if (activa && D) { clearTimeout(zoom._vv); zoom._vv = setTimeout(dibujar, 140); } };
window.EMTE_LEYENDA_VIVIENDAS = (q) => [
  ...(activa && D && q !== 'hex' ? D.usos.map((u, i) => ocultos.has(i) ? null : { nombre: u, tipo: 'area', color: D.colores[i] }).filter(Boolean) : []),
  ...(hexActiva && q !== 'viv' ? HEX.map((c, i) => ({ nombre: 'Viviendas por hexágono: ' + HEXN[i], tipo: 'area', color: c })) : [])];
});
