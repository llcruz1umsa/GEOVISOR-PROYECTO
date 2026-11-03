/* Análisis del terreno ya calculado para TODA la provincia Omasuyos (agregado por BYNS7). Pestaña PLANEAMIENTO.
   Solo se cargan como capas: no hay que dibujar ni calcular nada.
   · COC · Calco de obstáculos combinados (PICB, 3) Obstáculos, pág. 21–24): un calco por tipo de fuerza
     (data/coc_mec.png, coc_inf.png, coc_aer.png: 0 sin restricción, 1 restringido, 2 severamente restringido, 255 fuera).
     Restringido = líneas diagonales; severamente restringido = líneas diagonales sombreadas; ríos invadeables = línea
     sólida amplia; vías de infiltración de la infantería sobre el calco de la fuerza montada.
   · TC · Terreno clave (PICB, 4) El terreno clave, pág. 24–26): data/terreno_clave_omasuyos.geojson, «K» morada dentro de
     una curva que sigue los contornos del terreno. Clic en una K para ver por qué es terreno clave.
   Los archivos se generan con 04_CARTAS_IGM_50000/11_RELIEVE/curvas_cartas/coc_tc_omasuyos.py. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main>aside'), mapa = document.querySelector('.map'), scene = document.getElementById('scene');
if (!aside || !mapa || !scene) return;
const NS = 'http://www.w3.org/2000/svg', D2R = Math.PI / 180;
const K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702;
const aEscena = (lon, lat) => [500 + (lon * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) + OY) * K];
const esca = () => (typeof scale === 'number' && scale > 0 ? scale : 1);
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const sel = (tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const dec = (n, d = 1) => n.toFixed(d).replace('.', ',');
const miles = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const MOR = '#7B2CBF';
const FUERZAS = { mec: 'Mecanizada / blindada', inf: 'Infantería (a pie)', aer: 'Helicópteros (movilidad aérea)' };
const CATS = { obs: 'Buena observación (alturas dominantes)', rio: 'Terreno elevado que domina un río', pueblo: 'Terreno elevado que domina un poblado',
  ciudad: 'Ciudades y centros de comunicaciones', puente: 'Puentes sobre ríos', cruce: 'Cruces de caminos', campo: 'Campos de aterrizaje en terreno escabroso' };
let S = { coc: '', op: 75, infil: false, tc: false, cats: Object.keys(CATS) };
try { const g = JSON.parse(localStorage.getItem('emte-capas-an') || 'null'); if (g) S = Object.assign(S, g, { coc: '', tc: false }); } catch (e) {}
const guardar = () => { try { localStorage.setItem('emte-capas-an', JSON.stringify(S)); } catch (e) {} };

/* ---------------- estilos ---------------- */
const css = h('style');
css.textContent = `
.ca-menu .ca-c,.ca-menu .ca-c *,.ca-info,.ca-info *,.lg-item,.lg-item *{text-transform:none!important}
.ca-menu .ca-c{padding:4px 10px 12px;font:12px var(--tipo-texto,system-ui);color:#14233A}
.ca-menu h4{display:flex;justify-content:space-between;align-items:baseline;margin:12px 0 6px;font:700 11px var(--tipo-titulo,system-ui);letter-spacing:.06em;color:#0B1D33;border-bottom:2px solid #B79A5B;padding-bottom:3px;text-transform:uppercase!important}
.ca-menu h4.tc{border-bottom-color:${MOR}}
.ca-menu h4 small{font:600 9.5px system-ui;letter-spacing:0;color:#5A6B80}
.ca-menu label.k{display:flex;align-items:center;gap:7px;margin:2px 0;padding:3px 4px;border-radius:5px;cursor:pointer;line-height:1.25}
.ca-menu label.k:hover{background:#f2f5fa}
.ca-menu label.k span{flex:1}.ca-menu label.k em{font-style:normal;font:600 10.5px system-ui;color:#5A6B80;white-space:nowrap}
.ca-menu label.sub{margin-left:18px;font-size:11.5px}
.ca-menu input[type=checkbox]{accent-color:#12294A;margin:0}
.ca-menu .tcl input{accent-color:${MOR}}
.ca-menu .f{display:flex;align-items:center;gap:6px;margin:6px 0 2px 4px;font-size:11px;color:#3a4658}
.ca-menu .nota{font-size:10.5px;color:#5A6B80;line-height:1.35;margin:6px 4px 0}
.ca-menu .sw{display:inline-block;width:16px;height:11px;border:1px solid #0003;border-radius:2px;flex:none}
.ca-info{position:absolute;left:16px;top:16px;z-index:12;width:min(330px,calc(100% - 32px));background:#fff;border:1px solid #CBD3DF;border-radius:8px;box-shadow:0 10px 26px rgba(11,29,51,.22);font:11.5px/1.4 var(--tipo-texto,system-ui);color:#14233A;overflow:hidden}
.ca-info[hidden]{display:none}
.ca-info b.t{display:flex;justify-content:space-between;align-items:center;padding:7px 11px;background:${MOR};color:#fff;font:700 11px var(--tipo-titulo,system-ui);letter-spacing:.06em}
.ca-info b.t button{border:0;background:none;color:#fff;font:700 15px system-ui;cursor:pointer;line-height:1}
.ca-info .c{padding:8px 11px 10px}.ca-info .c h5{margin:0 0 4px;font:700 12.5px system-ui;color:#0B1D33}
.ca-info .c small{display:block;color:#5A6B80;margin-bottom:6px}
.ca-info ul{margin:0;padding-left:16px}.ca-info li{margin:3px 0}
.lg-item div{display:flex;align-items:center;gap:8px;padding:2px 11px}
.lg-item i{width:26px;height:13px;flex:none;border:1px solid #0003;border-radius:2px}
.lg-item i.l{height:0;border:0;border-top:4px solid}
.lg-item .nt{display:block;font-size:9.5px;color:#5A6B80;padding:3px 11px 8px}
#ca-tc .ca-k{cursor:pointer}`;
document.head.append(css);

/* ---------------- panel ---------------- */
const sec = h('details', 'layer-menu coc-menu ca-menu');
sec.innerHTML = `<summary>Análisis del terreno · Omasuyos</summary><div class="ca-c">
<h4>COC · Obstáculos combinados <small>PICB pág. 21–24</small></h4>
${Object.entries(FUERZAS).map(([k, v]) => `<label class="k"><input type="checkbox" data-fz="${k}"><span>${v}</span><em id="ca-p-${k}"></em></label>`).join('')}
<label class="k sub"><input type="checkbox" id="ca-in"><span>Vías de infiltración de la infantería</span></label>
<div class="f">Opacidad <input type="range" id="ca-op" min="20" max="100" style="flex:1;accent-color:#12294A"></div>
<h4 class="tc">TC · Terreno clave <small>PICB pág. 24–26</small></h4>
<label class="k tcl"><input type="checkbox" id="ca-tc-on"><span><b>Terreno clave (K)</b></span><em id="ca-tc-n"></em></label>
<div id="ca-cats"></div>
<p class="nota">Calculado para toda la provincia sobre el modelo digital del terreno. Toque una K en el mapa para ver por qué es terreno clave. El terreno decisivo lo designa el comandante.</p>
</div>`;
const $ = id => document.getElementById(id);
function colocar() { const ap = aside.querySelector('.ap-menu') || aside.querySelector('.pc-menu'); if (ap && ap.nextElementSibling !== sec) ap.after(sec); else if (!sec.isConnected) aside.append(sec); }
colocar(); setTimeout(colocar, 16000);
for (const t of ['pointerdown', 'click', 'wheel']) sec.addEventListener(t, e => e.stopPropagation());

/* ---------------- capas SVG ---------------- */
const gC = sel('g', { id: 'ca-coc', 'pointer-events': 'none' }), gR = sel('g', { 'pointer-events': 'none' }), gT = sel('g', { id: 'ca-tc' });
function poner(g) { if (!g.isConnected) { const ref = document.getElementById('topo-municipios-nombres'); ref ? ref.before(g) : scene.append(g); } }
const path = pts => pts.map((p, i) => { const [x, y] = aEscena(p[0], p[1]); return (i ? 'L' : 'M') + x.toFixed(3) + ' ' + y.toFixed(3); }).join('');
if (typeof zoom === 'function') { const zp = zoom; zoom = function (...a) { const r = zp.apply(this, a); gT.querySelectorAll('.ca-k').forEach(t => t.setAttribute('transform', `translate(${t.dataset.x} ${t.dataset.y}) scale(${1 / scale})`)); return r; }; }

/* ---------------- leyendas (se apilan en la columna de leyendas) ---------------- */
const leyC = h('section', 'lg-item ca-ley-coc'); leyC.hidden = true;
const leyT = h('section', 'lg-item ca-ley-tc'); leyT.hidden = true;
mapa.append(leyC, leyT);
const info = h('div', 'ca-info'); info.hidden = true; mapa.append(info);
for (const el of [info]) for (const t of ['pointerdown', 'click', 'wheel']) el.addEventListener(t, e => e.stopPropagation());

/* ---------------- datos ---------------- */
const j = u => fetch(u).then(r => { if (!r.ok) throw new Error(u); return r.json(); });
let META = null, RIOS = null, TC = null; const CL = {};
const meta = () => META ? Promise.resolve(META) : j('data/coc_omasuyos.json').then(m => {
  META = m; Object.entries(m.fuerzas).forEach(([k, f]) => { $('ca-p-' + k).textContent = dec(f.pct[1] + f.pct[2]) + ' % restr.'; }); return m; });
function clases(fz) {
  if (CL[fz]) return CL[fz];
  return CL[fz] = new Promise((ok, mal) => { const im = new Image(); im.onload = () => {
    const W = im.naturalWidth, H = im.naturalHeight, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const cx = cv.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0);
    const px = cx.getImageData(0, 0, W, H).data, C = new Uint8Array(W * H); for (let k = 0, o = 0; k < C.length; k++, o += 4) C[k] = px[o];
    ok({ W, H, C }); }; im.onerror = mal; im.src = 'data/coc_' + fz + '.png'; }).catch(e => { delete CL[fz]; throw e; });
}

/* ---------------- COC ---------------- */
let url = null, nPint = 0;
function pintarCOC() {
  const fz = S.coc, n = ++nPint; leyendaCOC();
  if (!fz) { gC.remove(); gR.remove(); return; }
  Promise.all([meta(), clases(fz), S.infil && fz !== 'inf' ? clases('inf') : null]).then(([m, A, B]) => {
    if (n !== nPint) return;
    const { W, H, C } = A, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'), im = ctx.createImageData(W, H), px = im.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x, c = C[k]; if (c === 0 || c === 255) continue; const o = k * 4, dg = (x + y) % 7;
      if (c === 1) { if (dg === 0) { px[o] = 120; px[o + 1] = 80; px[o + 2] = 0; px[o + 3] = 255; } }
      else if (dg <= 1) { px[o] = 110; px[o + 1] = 0; px[o + 2] = 0; px[o + 3] = 255; } else { px[o] = 150; px[o + 1] = 20; px[o + 2] = 20; px[o + 3] = 80; }
      if (B && c === 2 && B.C[k] < 2 && x % 5 === 0 && y % 5 === 0) { px[o] = 0; px[o + 1] = 140; px[o + 2] = 60; px[o + 3] = 255; }
    }
    ctx.putImageData(im, 0, 0);
    cv.toBlob(b => {
      if (n !== nPint) return;
      const nuevo = URL.createObjectURL(b), [ax, ay] = aEscena(m.nw[0], m.nw[1]), [bx, by] = aEscena(m.se[0], m.se[1]);
      gC.replaceChildren(sel('image', { x: ax, y: ay, width: bx - ax, height: by - ay, preserveAspectRatio: 'none', href: nuevo, opacity: S.op / 100 }));
      if (url) URL.revokeObjectURL(url); url = nuevo; poner(gC); rios(fz);
    }, 'image/png');
  }).catch(() => { leyC.innerHTML = '<b class="t">COC</b><span class="nt">No se pudieron cargar los datos del calco.</span>'; leyC.hidden = false; });
}
function rios(fz) {   // ríos invadeables (efecto severamente restringido): línea sólida amplia
  gR.replaceChildren(); if (!META || META.fuerzas[fz].efectos.rio !== 2) { gR.remove(); return; }
  (RIOS ? Promise.resolve(RIOS) : j('data/rios_omasuyos.geojson').then(r => (RIOS = r.features))).then(F => {
    if (S.coc !== fz) return;
    F.forEach(f => { if (!/^R[ií]o/i.test(f.properties.tipo || '')) return; const g = f.geometry, L = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
      L.forEach(l => gR.append(sel('path', { d: path(l), fill: 'none', stroke: '#0B3D91', 'stroke-width': 4, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }))); });
    gC.after(gR);
  });
}
function leyendaCOC() {
  const fz = S.coc; if (!fz) { leyC.hidden = true; return; }
  const f = META && META.fuerzas[fz], km = i => f ? ` <em style="margin-left:auto;font-style:normal;color:#5A6B80">${dec(f.pct[i])} %</em>` : '';
  leyC.innerHTML = `<b class="t">COC · ${esc(FUERZAS[fz])}</b>
<div><i style="background:#fff"></i><span>Sin restricción (sin marca)</span>${km(0)}</div>
<div><i style="background:repeating-linear-gradient(135deg,#785000 0 1.5px,#fff 1.5px 6px)"></i><span>Restringido · líneas diagonales</span>${km(1)}</div>
<div><i style="background:repeating-linear-gradient(135deg,#6E0000 0 2.5px,#e8c8c8 2.5px 6px)"></i><span>Severamente restringido · líneas diagonales sombreadas</span>${km(2)}</div>` +
    (f && f.efectos.rio === 2 ? '<div><i class="l" style="border-top-color:#0B3D91"></i><span>Río invadeable · línea sólida amplia</span></div>' : '') +
    (S.infil && fz !== 'inf' ? '<div><i style="background:radial-gradient(#008C3C 1.5px,transparent 2px) 0 0/6px 6px"></i><span>Vía de infiltración para infantería</span></div>' : '') +
    `<span class="nt">Toda Omasuyos · clima normal / seco. Declive: ${f && f.efectos.pr != null ? `restringido desde ${f.efectos.pr} %, severamente desde ${f.efectos.ps} %` : 'no restringe'}. Las clasificaciones no son absolutas.</span>`;
  leyC.hidden = false;
}

/* ---------------- TC ---------------- */
function cargarTC() { return TC ? Promise.resolve(TC) : j('data/terreno_clave_omasuyos.geojson').then(t => (TC = t)); }
function pintarTC() {
  leyendaTC(); if (!S.tc) { gT.remove(); info.hidden = true; return; }
  cargarTC().then(t => {
    if (!S.tc) return; gT.replaceChildren(); const z = esca(); let n = 0;
    t.features.forEach(f => {
      const p = f.properties; if (!p.cats.some(c => S.cats.includes(c))) return; n++;
      gT.append(sel('path', { d: path(f.geometry.coordinates[0]) + 'Z', fill: MOR, 'fill-opacity': .08, stroke: MOR, 'stroke-width': 2.2, 'vector-effect': 'non-scaling-stroke', 'pointer-events': 'none' }));
      const [x, y] = aEscena(p.lon, p.lat), m = sel('g', { class: 'ca-k' }); m.dataset.x = x; m.dataset.y = y; m.setAttribute('transform', `translate(${x} ${y}) scale(${1 / z})`);
      m.innerHTML = `<title>K${p.id} · ${esc(p.nombre)}</title><circle r="13" fill="#fff" fill-opacity=".92" stroke="${MOR}" stroke-width="2.4"/><text y="6.2" text-anchor="middle" font-size="17" font-weight="900" font-family="Arial,system-ui" fill="${MOR}">K</text>` +
        `<text y="25" text-anchor="middle" font-size="9.5" font-weight="800" font-family="system-ui" fill="${MOR}" stroke="#fff" stroke-width="3" paint-order="stroke">K${p.id}</text>`;
      m.addEventListener('click', e => { e.stopPropagation(); ficha(p); });
      gT.append(m);
    });
    $('ca-tc-n').textContent = n + ' K'; poner(gT);
  });
}
function ficha(p) {
  const T = window.EMTE_TOPO, u = T ? T.textos(p.lat, p.lon) : null;
  info.innerHTML = `<b class="t"><span>TERRENO CLAVE · K${p.id}</span><button type="button" title="Cerrar">×</button></b><div class="c"><h5>${esc(p.nombre)}</h5>
<small>${u ? esc(u.utm) : p.lat.toFixed(5) + ', ' + p.lon.toFixed(5)}${p.z ? ' · ' + miles(p.z) + ' m s.n.m.' : ''}${p.dom ? ' · domina ' + miles(p.dom) + ' m' : ''}</small>
<ul>${p.motivos.map(m => `<li>${esc(m)}</li>`).join('')}</ul></div>`;
  info.querySelector('button').onclick = () => { info.hidden = true; }; info.hidden = false;
}
function leyendaTC() {
  if (!S.tc) { leyT.hidden = true; return; }
  leyT.innerHTML = `<b class="t">TC · Terreno clave</b>
<div><svg width="26" height="26" viewBox="-14 -14 28 28" style="flex:none"><circle r="12" fill="#fff" stroke="${MOR}" stroke-width="2.2"/><text y="5.6" text-anchor="middle" font-size="15" font-weight="900" font-family="Arial" fill="${MOR}">K</text></svg><span>Terreno clave («K» en morado)</span></div>
<div><i style="border:2px solid ${MOR};background:${MOR}22;border-radius:7px"></i><span>Curva que sigue los contornos del terreno</span></div>
<span class="nt">Toda Omasuyos. Toque una K para ver el motivo. ${S.cats.length < Object.keys(CATS).length ? 'Categorías: ' + S.cats.length + ' de ' + Object.keys(CATS).length + '.' : ''}</span>`;
  leyT.hidden = false;
}

/* ---------------- controles ---------------- */
const cats = $('ca-cats');
cargarTC().then(t => {
  const cuenta = {}; t.features.forEach(f => f.properties.cats.forEach(c => cuenta[c] = (cuenta[c] || 0) + 1));
  Object.entries(CATS).forEach(([k, v]) => {
    const l = h('label', 'k sub tcl'); l.innerHTML = `<input type="checkbox" data-cat="${k}"${S.cats.includes(k) ? ' checked' : ''}><span>${v}</span><em>${cuenta[k] || 0}</em>`;
    l.querySelector('input').onchange = e => { S.cats = Object.keys(CATS).filter(c => c === k ? e.target.checked : S.cats.includes(c)); if (e.target.checked && !S.tc) { S.tc = true; $('ca-tc-on').checked = true; } guardar(); pintarTC(); };
    cats.append(l);
  });
}).catch(() => { cats.textContent = 'No se encontró data/terreno_clave_omasuyos.geojson.'; });
sec.querySelectorAll('[data-fz]').forEach(cb => cb.onchange = () => {
  S.coc = cb.checked ? cb.dataset.fz : ''; sec.querySelectorAll('[data-fz]').forEach(o => { if (o !== cb) o.checked = false; });
  $('ca-in').disabled = S.coc === 'inf'; guardar(); pintarCOC();
});
$('ca-in').checked = S.infil; $('ca-in').onchange = e => { S.infil = e.target.checked; if (S.infil && !S.coc) { S.coc = 'mec'; sec.querySelector('[data-fz="mec"]').checked = true; } guardar(); pintarCOC(); };
$('ca-op').value = S.op; $('ca-op').oninput = e => { S.op = +e.target.value; gC.querySelector('image')?.setAttribute('opacity', S.op / 100); guardar(); };
$('ca-tc-on').onchange = e => { S.tc = e.target.checked; guardar(); pintarTC(); };
meta().catch(() => {});
window.EMTE_ANALISIS = { estado: () => S, coc: fz => { S.coc = fz || ''; sec.querySelectorAll('[data-fz]').forEach(o => o.checked = o.dataset.fz === S.coc); pintarCOC(); }, tc: on => { S.tc = !!on; $('ca-tc-on').checked = S.tc; pintarTC(); } };
});
