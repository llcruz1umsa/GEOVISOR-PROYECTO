/* Curvas de nivel de las cartas IGM 1:50.000 (agregado por BYNS7, 02-11-2026).
   Las 8 hojas que cubren Omasuyos (5845-I a IV, 5846-II a IV, 5945-IV) unidas en una sola capa y recortadas
   a la provincia: data/curvas_cartas_omasuyos.json (equidistancia 20 m, maestras cada 100 m).
   El shape completo (UTM 19 S) está en 07_EXPORTACIONES/CURVAS_NIVEL_OMASUYOS_IGM.
   Sección en PLANEAMIENTO: mostrar, intermedias y cotas de las maestras. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main > aside'), scene = document.getElementById('scene');
if (!aside || !scene) return;
const NS = 'http://www.w3.org/2000/svg', K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702, D2R = Math.PI / 180;
const aEscena = (lon, lat) => [500 + (lon * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) + OY) * K];
const COL = { maestra: '#7A4A1C', intermedia: '#B98A5A' };
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

const css = h('style');
css.textContent = `
.cn-menu .cn-c{display:grid;gap:7px;padding:8px 10px 10px}
.cn-menu .cn-c label{display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer}
.cn-menu .cn-ley{display:grid;gap:4px;padding:6px 8px;border:1px solid #E3E8EF;border-radius:8px;background:#FBFAF7;font-size:11.5px}
.cn-menu .cn-ley div{display:flex;align-items:center;gap:8px}
.cn-menu .cn-ley i{display:inline-block;width:26px;border-top:3px solid ${COL.maestra}}
.cn-menu .cn-ley i.int{border-top:1.5px solid ${COL.intermedia}}
.cn-menu .cn-dato{font-size:11px;color:#5A6B80}
#curvas-cartas text{font:600 10.5px var(--tipo-texto,system-ui);fill:${COL.maestra};paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round;pointer-events:none}`;
document.head.append(css);

const sec = h('details', 'layer-menu hp-menu cn-menu');
sec.innerHTML = `<summary>Curvas de nivel · cartas IGM 1:50.000</summary><div class="cn-c">
<label><input type="checkbox" class="cn-ver"> Mostrar en el mapa</label>
<label><input type="checkbox" class="cn-int" checked> Intermedias (cada 20 m)</label>
<label><input type="checkbox" class="cn-cot" checked> Cotas de las maestras</label>
<div class="cn-ley"><div><i></i>Maestra · cada 100 m</div><div><i class="int"></i>Intermedia · cada 20 m</div></div>
<div class="cn-dato"></div></div>`;
const pc = aside.querySelector(':scope > .pc-menu');
pc ? pc.after(sec) : aside.append(sec);
const $ = s => sec.querySelector(s), dato = $('.cn-dato');

let D = null, cargando = null, g = null, gInt = null, gMae = null, gTxt = null;
const on = () => $('.cn-ver').checked;
function cargar() {
  if (cargando) return cargando;
  dato.textContent = 'Cargando…';
  cargando = fetch('data/curvas_cartas_omasuyos.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => { D = d; construir(); })
    .catch(e => { cargando = null; dato.textContent = 'No se pudieron cargar las curvas.'; throw e; });
  return cargando;
}
function construir() {
  g = document.createElementNS(NS, 'g'); g.id = 'curvas-cartas'; g.setAttribute('pointer-events', 'none');
  gInt = document.createElementNS(NS, 'g'); gMae = document.createElementNS(NS, 'g'); gTxt = document.createElementNS(NS, 'g');
  g.append(gInt, gMae, gTxt);
  let n = 0, zmin = 1 / 0, zmax = -1 / 0;
  for (const [z, tipo, lineas] of D.curvas) {
    let d = ''; const mae = tipo === 'maestra';
    for (const l of lineas) {
      let lon = 0, lat = 0, mejor = null, largo = 0;
      for (let i = 0; i < l.length; i += 2) {
        lon += l[i]; lat += l[i + 1];
        const [x, y] = aEscena(lon / 1e5, lat / 1e5);
        d += (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2);
        if (mae && i === (l.length >> 2) * 2) mejor = [x, y];
      }
      largo = l.length / 2; n++;
      if (mae && mejor && largo >= 25) { const t = document.createElementNS(NS, 'text'); t.textContent = Math.round(z); t.dataset.x = mejor[0]; t.dataset.y = mejor[1]; t.setAttribute('text-anchor', 'middle'); t.setAttribute('dy', '.35em'); gTxt.append(t); }
    }
    zmin = Math.min(zmin, z); zmax = Math.max(zmax, z);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', COL[tipo] || COL.intermedia);
    p.setAttribute('stroke-width', mae ? '1.4' : '.7'); p.setAttribute('stroke-opacity', mae ? '.95' : '.8'); p.setAttribute('vector-effect', 'non-scaling-stroke');
    p.dataset.nombre = 'Curva ' + Math.round(z) + ' m'; p.dataset.info = (mae ? 'Maestra' : 'Intermedia') + ' · cartas IGM 1:50.000';
    (mae ? gMae : gInt).append(p);
  }
  dato.textContent = `${n.toLocaleString('es-BO')} curvas · ${Math.round(zmin).toLocaleString('es-BO')} – ${Math.round(zmax).toLocaleString('es-BO')} m`;
}
const escala = () => (typeof scale === 'number' && scale > 0 ? scale : 1);
function rotulos() {
  if (!gTxt) return;
  const s = escala(), ver = $('.cn-cot').checked && s >= 2;
  gTxt.style.display = ver ? '' : 'none'; if (!ver) return;
  for (const t of gTxt.children) t.setAttribute('transform', `translate(${t.dataset.x} ${t.dataset.y}) scale(${1 / s})`);
}
function poner() {
  if (!on()) { g && g.remove(); refrescar(); return; }
  cargar().then(() => {
    if (!on()) return;
    if (!g.isConnected) { const ref = document.getElementById('rivers') || document.getElementById('roads-casing'); ref ? ref.before(g) : scene.append(g); }
    gInt.style.display = $('.cn-int').checked ? '' : 'none';
    rotulos(); refrescar();
  }).catch(() => {});
}
function refrescar() { try { window.EMTE_SIMB_REFRESCAR?.(); } catch (e) {} }
$('.cn-ver').onchange = poner; $('.cn-int').onchange = poner; $('.cn-cot').onchange = poner;
if (typeof zoom === 'function') { const zPrev = zoom; zoom = function (...a) { const r = zPrev.apply(this, a); if (g && g.isConnected) rotulos(); return r; }; }

// leyenda (simbología y PDF)
window.EMTE_LEYENDAS_EXTRA = window.EMTE_LEYENDAS_EXTRA || [];
window.EMTE_LEYENDAS_EXTRA.push(() => {
  if (!on() || !g || !g.isConnected) return [];
  const it = [{ nombre: 'Curva de nivel maestra (100 m)', tipo: 'sim', s: `<path d="M-9 0H9" stroke="${COL.maestra}" stroke-width="2.6"/>` }];
  if ($('.cn-int').checked) it.push({ nombre: 'Curva de nivel intermedia (20 m)', tipo: 'sim', s: `<path d="M-9 0H9" stroke="${COL.intermedia}" stroke-width="1.4"/>` });
  return it;
});
// ELIMINAR › «Apagar todas las capas» también apaga las curvas
document.addEventListener('click', e => { if (e.target.closest?.('.lm-dlg .si') && document.querySelector('.lm-dlg .lm-cap')?.checked && on()) { $('.cn-ver').checked = false; poner(); } });
window.EMTE_CURVAS_CARTAS = { mostrar: v => { $('.cn-ver').checked = v !== false; poner(); } };
});
