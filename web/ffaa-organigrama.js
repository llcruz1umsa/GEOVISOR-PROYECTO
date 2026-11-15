/* FFAA más didáctico (agregado por BYNS7, 02-11-2026). Planeamiento › FFAA.
   5. ORGANIGRAMA: árbol que se despliega Comando en Jefe → Fuerza → categoría → grupo → unidad, con contadores y
      colores de cada fuerza; al tocar una unidad el mapa va hasta ella, abre su ficha y resalta su jurisdicción.
   6. BUSCAR Y FILTRAR: texto, fuerza, categoría, arma y «solo Omasuyos»; y «cerca de un punto»: se marca un punto
      en el mapa y se listan las unidades dentro del radio elegido, ordenadas por distancia.
   La lista original queda en la pestaña LISTA. Solo usuarios registrados. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const NS = 'http://www.w3.org/2000/svg', K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702, D2R = Math.PI / 180;
const aEscena = (lon, lat) => [500 + (lon * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2)) + OY) * K];
const deEscena = (x, y) => [((x - 500) / K - OX) / D2R, (2 * Math.atan(Math.exp((380 - y) / K - OY)) - Math.PI / 2) / D2R];
const km = (a, b) => { const R = 6371, dLa = (b[1] - a[1]) * D2R, dLo = (b[0] - a[0]) * D2R, s = Math.sin(dLa / 2) ** 2 + Math.cos(a[1] * D2R) * Math.cos(b[1] * D2R) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); };
const dec = (n, d = 1) => n.toFixed(d).replace('.', ',');

const css = h('style');
css.textContent = `
.fx-tabs{display:grid;grid-template-columns:repeat(3,1fr);margin:8px 10px 6px;border:1px solid #12294A;border-radius:9px;overflow:hidden}
.fx-tabs button{padding:8px 4px;border:0;background:#fff;color:#12294A;font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.06em;cursor:pointer}
.fx-tabs button.on{background:linear-gradient(135deg,#12294A,#0B1D33);color:#E2CB8E}
.fa-sec.fx-org .fa-fz,.fa-sec.fx-bus .fa-fz,.fa-sec.fx-dep .fa-fz{display:none}
.fx-tabs{grid-template-columns:repeat(2,1fr)!important}.fx-tabs button{font-size:9px!important;letter-spacing:.03em!important;padding:8px 2px!important}
.fx-dcab{padding:2px 0 6px}
.fx-tipos{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 8px}.fx-tipos button{all:unset;cursor:pointer;font-size:10.5px;color:#33414a;background:#f2f3fb;border:1px solid #e1e4ef;border-radius:12px;padding:3px 8px}.fx-tipos button:hover{border-color:#B79A5B;background:#FBF8F0}.fx-tipos b{color:#070774}
.fx-dvh{margin:6px 6px 2px;font:800 9.5px var(--tipo-titulo,system-ui);letter-spacing:.08em;color:#8A6D2F;text-transform:uppercase}
.cc-tarj small.fx-pz{color:#8A6D2F;font-weight:600}
.fx-exp .cc-modo{grid-template-columns:repeat(3,1fr)}.fx-exp .cc-modo button{font-size:9.5px;letter-spacing:.03em}
.fx-tp{grid-template-columns:auto 1fr}.fx-tpi{grid-row:span 2;display:grid;place-items:center;width:36px;height:36px;border-radius:8px;background:color-mix(in srgb,var(--c) 14%,#fff);border:1.5px solid var(--c)}
.fx-ayuda{margin:2px 2px 8px;font-size:11px;color:#5d6b75;line-height:1.4}
.fx-exp .cc-cab h3{text-transform:uppercase}.fx-exp .fx-exfz{margin-top:9px}.fx-exp .fx-exfz button{font-size:9.5px}
.fx-exp .cc-mini-svg .fx-pt{pointer-events:none;stroke:#fff;stroke-width:.4}
.fx-exp .cc-it svg{flex:none;background:#eef1e8;border-radius:4px}.fx-exp .cc-sub>summary>span:first-child{flex:1;min-width:0}.fx-dcab .cc-busca{box-sizing:border-box;text-transform:none}
.fx-dcue.cc-cuerpo{overflow:visible;padding:4px 0 8px}
.fx-dcue .cc-it svg{flex:none;background:#eef1e8;border-radius:4px}
.fx-dcue .cc-div{border-left-color:var(--c,#b28405)}
.fx-dcue .cc-dep>summary .fx-dot,.fx-dcue .cc-div>summary .fx-dot{width:10px;height:10px;border-radius:50%;flex:none;background:var(--c)}
.fx-dcue .cc-res h4{display:flex;align-items:center;gap:6px}
.fx-dcue summary>span:not(.cc-cnt){flex:1;min-width:0}.fx-dcue .cc-cnt{flex-wrap:wrap;justify-content:flex-end}
.fx-dcue .cc-dep>summary{flex-wrap:wrap;row-gap:5px}.fx-dcue .cc-dep>summary .cc-cnt{flex-basis:100%;margin-left:18px;justify-content:flex-start}
.fx-dcue .cc-sub>summary small,.fx-dcue .cc-div>summary small{display:block;font-weight:500;color:#6a7680;font-size:10.5px;letter-spacing:.2px}
.fx-cuerpo{padding:4px 10px 12px}
.fx-miga{display:flex;flex-wrap:wrap;align-items:center;gap:5px;margin:2px 0 10px;font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.05em;color:#5A6B80}
.fx-miga a{color:#12294A;cursor:pointer;text-decoration:underline}.fx-miga b{color:#8A6D2F}
.fx-raiz{display:flex;align-items:center;gap:10px;margin:0 auto;padding:10px 12px;border-radius:12px;background:linear-gradient(135deg,#7a1f1f,#4a1010);color:#fff;cursor:pointer;box-shadow:0 6px 16px #7a1f1f44}
.fx-raiz b{font:800 11.5px var(--tipo-titulo,system-ui);letter-spacing:.06em}.fx-raiz small{display:block;opacity:.8;font-size:10px}
.fx-raiz svg,.fx-nodo svg{flex:none;background:#ffffffe6;border-radius:8px;padding:2px}
.fx-con{position:relative;height:18px}.fx-con::before{content:'';position:absolute;left:50%;top:0;height:9px;border-left:2px solid #B79A5B}
.fx-con::after{content:'';position:absolute;left:16.6%;right:16.6%;top:9px;border-top:2px solid #B79A5B}
.fx-hijos{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.fx-nodo{position:relative;display:grid;justify-items:center;gap:4px;padding:12px 6px 9px;border-radius:12px;color:#fff;text-align:center;cursor:pointer;box-shadow:0 5px 14px #0B1D3333;transition:transform .12s}
.fx-nodo::before{content:'';position:absolute;top:-9px;left:50%;height:9px;border-left:2px solid #B79A5B}
.fx-nodo:hover{transform:translateY(-2px)}.fx-nodo.on{outline:3px solid #B79A5B;outline-offset:2px}
.fx-nodo b{font:800 10.5px/1.15 var(--tipo-titulo,system-ui);letter-spacing:.04em}.fx-nodo small{font:700 15px var(--tipo-titulo,system-ui);color:#E2CB8E}
.fx-cats{display:grid;gap:6px;margin-top:12px}
.fx-cat{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;padding:8px 10px;border:1px solid #E3E8EF;border-left:5px solid var(--c);border-radius:10px;background:#fff;cursor:pointer;transition:all .12s}
.fx-cat:hover{background:#FBF8F0;border-color:#B79A5B}.fx-cat.on{background:#F3F6FB;box-shadow:inset 0 0 0 1px var(--c)}
.fx-cat span{font-size:11.5px;font-weight:700;color:#14233A}.fx-cat em{font-style:normal;font:800 11px var(--tipo-titulo,system-ui);color:#fff;background:var(--c);border-radius:10px;padding:2px 8px}
.fx-sub{margin:4px 0 4px 18px;padding-left:10px;border-left:2px dashed #B79A5B}
.fx-gr{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}
.fx-gr button{padding:4px 9px;border:1px solid #D7DEE8;border-radius:14px;background:#fff;font:700 10.5px var(--tipo-texto,system-ui);color:#14233A;cursor:pointer}
.fx-gr button.on{background:#12294A;color:#fff;border-color:#12294A}
.fx-it{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;width:100%;padding:5px 8px;border:0;border-radius:8px;background:transparent;text-align:left;cursor:pointer;font:11.5px var(--tipo-texto,system-ui);color:#14233A}
.fx-it:hover{background:#EEF3FB}.fx-it b{display:block;font-size:11.5px}.fx-it small{display:block;color:#64737b;font-size:10px;text-transform:none}
.fx-it .d{font:800 10px var(--tipo-titulo,system-ui);color:#8A6D2F;white-space:nowrap}
.fx-om{color:#B79A5B;font-size:9px;font-weight:800;margin-left:4px}
.fx-filtros{display:grid;gap:7px;padding:9px;border-radius:10px;background:#F8FAFC;border:1px solid #E3E8EF}
.fx-filtros input[type=search],.fx-filtros select{width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #CDD6E2;border-radius:6px;font:12px var(--tipo-texto,system-ui);text-transform:none}
.fx-fz{display:flex;flex-wrap:wrap;gap:5px}
.fx-fz button{display:flex;align-items:center;gap:5px;padding:4px 9px;border:1px solid #D7DEE8;border-radius:14px;background:#fff;font:700 10px var(--tipo-titulo,system-ui);color:#14233A;cursor:pointer}
.fx-fz button i{width:9px;height:9px;border-radius:50%;background:var(--c)}.fx-fz button.on{background:var(--c);color:#fff;border-color:var(--c)}.fx-fz button.on i{background:#fff}
.fx-2{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.fx-radio{display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center;padding:8px;border-radius:10px;background:linear-gradient(135deg,#FBF8F0,#fff);border:1px solid #E7DCC2}
.fx-radio button{padding:7px 10px;border:0;border-radius:8px;background:linear-gradient(135deg,#B79A5B,#8A6D2F);color:#fff;font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.05em;cursor:pointer}
.fx-radio button.sec{background:#fff;color:#9B1C1C;border:1px solid #E8B7B7}
.fx-n{margin:8px 2px 4px;font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.1em;color:#5A6B80}
.fx-lista{display:grid;gap:1px;max-height:420px;overflow:auto}
.map.fx-elegir svg{cursor:crosshair!important}`;
document.head.append(css);

let F = null, sec = null, modo = 'dep', ruta = [], bus = { q: '', fz: new Set(), cat: '', arma: '', om: false, centro: null, radio: 25 };
const colorFz = id => (F.FUERZAS.find(x => x[0] === id) || [0, 0, '#12294A'])[2];
const nomFz = id => (F.FUERZAS.find(x => x[0] === id) || [0, id])[1];
const feats = () => F.D.features;
/* jurisdicción resaltada y círculo de búsqueda en el mapa */
const g = document.createElementNS(NS, 'g'); g.id = 'fx-mapa'; g.style.pointerEvents = 'none';
const scene = document.getElementById('scene');
function ponerG() { if (!g.isConnected) scene.append(g); }
function resaltar(f) {
  g.querySelectorAll('.fx-j').forEach(e => e.remove());
  const p = f.properties; if (f.geometry.type !== 'Point') return;
  const j = feats().find(x => x.geometry.type !== 'Point' && x.properties.sigla === p.sigla); if (!j) return;
  const polys = j.geometry.type === 'Polygon' ? [j.geometry.coordinates] : j.geometry.coordinates; let d = '';
  for (const pl of polys) for (const r of pl) d += 'M' + r.map(c => aEscena(c[0], c[1]).map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
  const e = document.createElementNS(NS, 'path'); e.setAttribute('class', 'fx-j'); e.setAttribute('d', d); e.setAttribute('fill', '#B79A5B'); e.setAttribute('fill-opacity', '.12');
  e.setAttribute('fill-rule', 'evenodd'); e.setAttribute('stroke', '#B79A5B'); e.setAttribute('stroke-width', 3); e.setAttribute('stroke-dasharray', '9 5'); e.setAttribute('vector-effect', 'non-scaling-stroke');
  ponerG(); g.prepend(e);
}
function ir(f) { F.ir(f); resaltar(f); }
function circulo() {
  g.querySelectorAll('.fx-c').forEach(e => e.remove()); if (!bus.centro) return;
  const [lo, la] = bus.centro, pts = []; for (let k = 0; k <= 72; k++) { const a = k / 72 * 2 * Math.PI, dLa = bus.radio / 111.32 * Math.cos(a), dLo = bus.radio / (111.32 * Math.cos(la * D2R)) * Math.sin(a); pts.push(aEscena(lo + dLo, la + dLa)); }
  const c = document.createElementNS(NS, 'path'); c.setAttribute('class', 'fx-c'); c.setAttribute('d', 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z');
  c.setAttribute('fill', '#12294A'); c.setAttribute('fill-opacity', '.06'); c.setAttribute('stroke', '#12294A'); c.setAttribute('stroke-width', 2.5); c.setAttribute('stroke-dasharray', '6 4'); c.setAttribute('vector-effect', 'non-scaling-stroke');
  const [x, y] = aEscena(lo, la), m = document.createElementNS(NS, 'circle'); m.setAttribute('class', 'fx-c'); m.setAttribute('cx', x); m.setAttribute('cy', y); m.setAttribute('r', 4 / (typeof scale === 'number' ? scale : 1)); m.setAttribute('fill', '#B79A5B'); m.setAttribute('stroke', '#0B1D33'); m.setAttribute('stroke-width', 1.5); m.setAttribute('vector-effect', 'non-scaling-stroke');
  ponerG(); g.append(c, m);
}

/* ---------- interfaz ---------- */
let cuerpo = null, tabs = null;
function montar() {
  if (!window.EMTE_FFAA) return false;
  sec = document.querySelector('.fa-sec'); if (!sec) return false;
  if (sec.querySelector('.fx-tabs')) return true;
  F = window.EMTE_FFAA;
  tabs = h('div', 'fx-tabs'); [['dep', '🗺 DEPARTAMENTOS'], ['org', '🏛 ORGANIGRAMA'], ['bus', '🔎 FILTROS'], ['lis', '☰ LISTA']].forEach(([k, t]) => { const b = h('button', null, t); b.type = 'button'; b.dataset.k = k; b.onclick = () => { modo = k; pintar(); }; tabs.append(b); });
  cuerpo = h('div', 'fx-cuerpo');
  const op = sec.querySelector('.fa-op'); (op || sec.firstChild).after(tabs, cuerpo);
  pintar(); setTimeout(completarPuestos, 1500); return true;
}
function pintar() {
  tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === modo));
  sec.classList.toggle('fx-org', modo === 'org'); sec.classList.toggle('fx-bus', modo === 'bus'); sec.classList.toggle('fx-dep', modo === 'dep');
  cuerpo.hidden = modo === 'lis'; cuerpo.replaceChildren();
  if (modo === 'dep') departamentos(); else if (modo === 'org') organigrama(); else if (modo === 'bus') buscar();
}
const item = (f, extra) => {
  const p = f.properties, b = h('button', 'fx-it'); b.type = 'button';
  const ic = h('span'); ic.innerHTML = F.icono(p, 30); const t = h('span'); const n = h('b', null, p.sigla || p.nombre); if (p.om) n.append(h('span', 'fx-om', 'OMASUYOS')); t.append(n, h('small', null, [p.nombre !== p.sigla ? p.nombre : '', p.ubicacion].filter(Boolean).join(' · ')));
  b.append(ic, t, h('span', 'd', extra || '')); b.onclick = () => ir(f); return b;
};

/* 4. DEPARTAMENTOS Y DIVISIONES (mismo diseño que Cartas): departamento › fuerza › división › unidades, con buscador */
let DEPS = null; const DEPDE = new Map(), dvst = { modo: 'dep', q: '' };
const cargarDeps = () => DEPS ? Promise.resolve(DEPS) : fetch('cartas/indice.json').then(r => r.ok ? r.json() : null).then(d => (DEPS = { dep: (d && d.departamentos) || [], div: (d && d.divisiones) || {} })).catch(() => (DEPS = { dep: [], div: {} }));
const enAnillos = (p, rs) => { let c = false; for (const r of rs) for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if ((yi > p[1]) !== (yj > p[1]) && p[0] < (xj - xi) * (p[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
function depDe(f) {
  if (DEPDE.has(f)) return DEPDE.get(f);
  const c = F.centro(f); let n = 'SIN DEPARTAMENTO';
  if (c && isFinite(c[0])) {
    for (const d of DEPS.dep) if (enAnillos(c, d.r)) { n = d.n; break; }
    if (n === 'SIN DEPARTAMENTO') {   // puestos de frontera, bases en lagos/ríos: el departamento más cercano
      let m = Infinity; for (const d of DEPS.dep) for (const r of d.r) for (const q of r) { const e = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2; if (e < m) { m = e; n = d.n; } }
    }
  }
  DEPDE.set(f, n); return n;
}
function divDe(f) {
  const p = f.properties;
  if (p.grupo) return /^DIV\.\s*MEC/i.test(p.grupo) ? p.grupo.replace(/^DIV\.\s*MEC/i, 'DIV. MEC') : p.grupo;
  if (/Grandes Unidades|Jurisdicción de las divisiones/i.test(p.cat) || (p.fuerza === 'ARMADA' && /Distritos/i.test(p.cat))) return p.sigla;
  return p.cat;
}
const ORDDIV = d => /MEC/.test(d) ? 100 : /^DIV/.test(d) ? +((d.match(/\d+/) || [999])[0]) : /^DN/.test(d) ? 300 + +((d.match(/\d+/) || [0])[0]) : /^AN/.test(d) ? 320 + +((d.match(/\d+/) || [0])[0]) : /BRIGADA/.test(d) ? 400 : /CMDO/.test(d) ? 200 : 500;
const ordenDiv = (a, b) => ORDDIV(a) - ORDDIV(b) || a.localeCompare(b, 'es', { numeric: true });
const corto = id => ({ 'EJERCITO': 'EJ', 'ARMADA': 'ARM', 'FUERZA AEREA': 'FAB', 'COMANDO EN JEFE': 'CJ' }[id] || id);
function itemD(f, extra) {
  const p = f.properties, b = h('button', 'cc-it'); b.type = 'button';
  const ic = h('span'); ic.innerHTML = F.icono(p, 24);
  b.append(ic, h('span', 'nom', (p.sigla || p.nombre) + (p.om ? ' · OMASUYOS' : '')), h('span', 'ir', '⌖'));
  b.append(h('span', 'sec', [p.nombre !== p.sigla ? p.nombre : '', p.ubicacion, f.geometry.type !== 'Point' ? 'área de jurisdicción' : '', extra].filter(Boolean).join(' · ')));
  b.title = 'Ir a ' + (p.sigla || p.nombre); b.onclick = () => ir(f); return b;
}
function bloque(cls, titulo, chico, cuentas, col, llenar) {   // <details> como los de Cartas: se llena al abrirse
  const d = h('details', cls), s = h('summary'); if (col) { d.style.setProperty('--c', col); s.append(h('i', 'fx-dot')); }
  const t = h('span'); t.append(document.createTextNode(titulo)); if (chico) t.append(h('small', null, chico)); s.append(t);
  const cn = h('span', 'cc-cnt'); cuentas.forEach(x => cn.append(h('span', null, x))); s.append(cn); d.append(s);
  let lleno = false; d.addEventListener('toggle', () => { if (d.open && !lleno) { lleno = true; llenar(d); } }); return d;
}
const porCat = (a, b) => (a.properties.cat || '').localeCompare(b.properties.cat || '', 'es') || String(a.properties.sigla || '').localeCompare(String(b.properties.sigla || ''), 'es', { numeric: true });
/* 4b. EXPLORAR FUERZAS ARMADAS: mismo modelo que «Explorar cartas IGM» (ventana con KPIs, buscador,
   DEPARTAMENTOS | DIVISIONES DEL EJÉRCITO, mapa de Bolivia para elegir, tarjetas y grupos por fuerza). */
const PALETA_DIV = { 'DIV-1': '#1F5AA6', 'DIV-2': '#B03A2E', 'DIV-3': '#2E7D52', 'DIV-4': '#C77C0E', 'DIV-5': '#6F4A9B', 'DIV-6': '#13818A',
  'DIV-7': '#94522B', 'DIV-8': '#5B7B1C', 'DIV-9': '#B0245F', 'DIV-10': '#34557F', 'DIV. MEC-1': '#7D6418', 'CMDO. UU. DD. EJTO.': '#56657A' };
let DIVP = null; const DIVDE = new Map();
const cargarDivP = () => DIVP ? Promise.resolve(DIVP) : fetch('cartas/divisiones.json').then(r => r.json()).then(d => (DIVP = d.divisiones.sort((a, b) => ORDDIV(a.k) - ORDDIV(b.k)))).catch(() => (DIVP = []));
function divTerr(f) {   // división del Ejército en cuyo territorio está la unidad (cualquier fuerza)
  if (DIVDE.has(f)) return DIVDE.get(f);
  const c = F.centro(f); let n = null;
  if (c && isFinite(c[0])) { for (const d of DIVP) if (enAnillos(c, d.r)) { n = d.k; break; }
    if (!n) { let m = Infinity; for (const d of DIVP) for (const r of d.r) for (const q of r) { const e = (q[0] - c[0]) ** 2 + (q[1] - c[1]) ** 2; if (e < m) { m = e; n = d.k; } } } }
  DIVDE.set(f, n || 'SIN DIVISIÓN'); return DIVDE.get(f);
}
/* PUESTOS MILITARES COMPLETOS: se suman a la capa FFAA los puestos del listado de Cartas IGM que faltaban,
   con la simbología existente de cada tipo, y se corrige la ubicación cuando la capa los ponía fuera de su departamento. */
const ES_PUESTO = /^Puestos militares|PPMMPP/;
const TIPO_P = { 'PUESTO MILITAR ADELANTADO': 'Puestos militares adelantados', 'PUESTO MILITAR P.M.S.': 'Puestos militares de seguridad', 'PUESTO MILITAR DE CONTROL FRONTERIZO': 'Puestos militares de control', 'PUESTO MILITAR P.M.P.': 'Otros puestos militares (PPMMPP)' };
const COL_P = { 'Puestos militares adelantados': '#B42330', 'Puestos militares de seguridad': '#2F6B4F', 'Puestos militares de control': '#C26A00', 'Otros puestos militares (PPMMPP)': '#6F4A9B' };
const CORTO_P = { 'Puestos militares adelantados': 'PMA', 'Puestos militares de seguridad': 'PMS', 'Puestos militares de control': 'PMC', 'Otros puestos militares (PPMMPP)': 'PPMMPP' };
const NN = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(PMS|PMA|PMCF|PMC|PMP|ABT|FANEXA)+/, '');
const bigr = t => { const m = new Set(); for (let i = 0; i < t.length - 1; i++) m.add(t.slice(i, i + 2)); return m; };
const dice = (a, b) => { const A = bigr(a), B = bigr(b); if (!A.size || !B.size) return 0; let c = 0; A.forEach(x => B.has(x) && c++); return 2 * c / (A.size + B.size); };
const kmLL = (a, b) => Math.hypot((a[0] - b[0]) * Math.cos(a[1] * D2R), a[1] - b[1]) * 111.2;
let PZ = null;
function completarPuestos() {
  if (PZ) return PZ;
  return (PZ = Promise.all([fetch('cartas/indice.json').then(r => r.ok ? r.json() : null).catch(() => null), cargarDeps()]).then(([d]) => {
    if (!d || !d.unidades) return;
    const base = feats(), P = base.filter(f => f.geometry.type === 'Point' && ES_PUESTO.test(f.properties.cat)), usados = new Set(), nuevos = [];
    const molde = {}; P.forEach(f => { if (!molde[f.properties.cat]) molde[f.properties.cat] = f.properties; });
    const depPt = c => { for (const x of DEPS.dep) if (enAnillos(c, x.r)) return x.n; return null; };
    let movidos = 0;
    for (const u of d.unidades) {
      const cat = TIPO_P[u.t]; if (!cat || !isFinite(u.lon)) continue;
      const c = [u.lon, u.lat], n = NN(u.n); let best = null, bs = 0;
      for (const f of P) { if (usados.has(f)) continue; const p = f.properties, s = Math.max(NN(p.sigla) && n.length > 3 && (NN(p.sigla).includes(n) || n.includes(NN(p.sigla))) ? 1 : 0, dice(n, NN(p.sigla)), dice(n, NN(p.nombre)));
        const dd = kmLL(c, f.geometry.coordinates); if (dd > 120) continue; const sc = s - dd / 400; if (s >= .72 && sc > bs) { bs = sc; best = f; } }
      if (best) {   // ya estaba: se completa y, si la capa lo ubicaba en otro departamento, se usa la ubicación del listado
        usados.add(best); const p = best.properties;
        if (!p.ubicacion && u.loc) p.ubicacion = u.loc; if (!p.provincia && u.prov) p.provincia = u.prov; if (!p.depende && u.u) p.depende = u.u;
        if (u.hj && !p.nota) p.nota = 'Carta IGM ' + u.hj + (u.hn ? ' «' + u.hn + '»' : '');
        // la ubicación de la geodatabase EJERCITO_2024.gdb es la oficial: no se mueve
        continue;
      }
      continue;   // 05-11-2026: los puestos que faltaban ya están en fuerzas_armadas.json y en EJERCITO_2024_ACTUALIZADA.gdb
      // no duplicar: ya existe un puesto con nombre parecido a menos de 1 km (o cualquiera a menos de 250 m)
      if (P.concat(nuevos).some(f => { const dd = kmLL(c, f.geometry.coordinates), q = f.properties, sn = Math.max(dice(n, NN(q.sigla)), dice(n, NN(q.nombre))); return dd < .25 || (dd < 1 && sn >= .55) || (dd < 3 && sn >= .9); })) continue;
      const m = molde[cat] || { sim: 'i:' + (CORTO_P[cat] || 'PM') }, dv = /^DIV\.\s*MEC/i.test(u.dv || '') ? 'DIV. MEC-1' : u.dv;
      nuevos.push({ type: 'Feature', geometry: { type: 'Point', coordinates: c }, properties: {
        fuerza: 'EJERCITO', cat, sim: m.sim, esc: m.esc, sigla: (cat === 'Puestos militares de seguridad' ? 'PMS. ' : '') + u.n, nombre: (u.sg ? u.sg + ' ' : '') + u.n,
        ubicacion: u.loc || '', provincia: u.prov || '', depende: u.u || '', guc: dv || '', grupo: dv || '', om: norm(u.prov) === 'omasuyos',
        nota: u.hj ? 'Carta IGM ' + u.hj + (u.hn ? ' «' + u.hn + '»' : '') : '', fuente: 'Listado de unidades y puestos de las Cartas IGM (no figura en EJERCITO_2024.gdb)' } });
    }
    base.push(...nuevos); DEPDE.clear(); DIVDE.clear();
    PZ.info = { nuevos: nuevos.length, movidos };
    if (!nuevos.length) return;
    const ver = sec && sec.querySelector('.fa-ver'); if (ver && ver.checked) { ver.checked = false; ver.dispatchEvent(new Event('change', { bubbles: true })); ver.checked = true; ver.dispatchEvent(new Event('change', { bubbles: true })); }
    const kb = sec && sec.querySelector('.fa-mas small'); if (kb) kb.textContent = base.length + ' elementos';
  }));
}
const ex = { modo: 'dep', sel: null, fz: new Set(), q: '' };
let EXP = null;
function explorador() {
  if (EXP) return EXP;
  EXP = h('section', 'institution-tab-panel cc-panel fx-exp'); EXP.hidden = true; EXP.setAttribute('role', 'dialog'); EXP.setAttribute('aria-label', 'Explorar Fuerzas Armadas');
  EXP.innerHTML = `<button type="button" class="institution-tab-close" aria-label="Cerrar explorar Fuerzas Armadas">×</button>
<div class="cc-cab"><h3>EXPLORAR FUERZAS ARMADAS</h3>
<div class="cc-kpi2 fx-k"></div>
<input type="search" class="cc-busca fx-q" placeholder="Buscar unidad (RI-21), nombre, localidad, división o departamento…" aria-label="Buscar unidades">
<div class="cc-modo" role="tablist"><button type="button" data-m="dep">DEPARTAMENTOS</button><button type="button" data-m="div">DIVISIONES DEL EJÉRCITO</button><button type="button" data-m="pto">PUESTOS MILITARES</button></div>
<div class="fx-fz fx-exfz"></div>
<div class="cc-opc"><label><input type="checkbox" class="fx-ver"> Unidades en el mapa</label><label><input type="checkbox" class="fx-om2"> Solo Omasuyos</label></div></div>
<div class="cc-cuerpo"><div class="cc-mini fx-mini"></div><div class="cc-ruta fx-ruta"></div><div class="fx-sel"><p class="cc-vacio">Cargando…</p></div></div>
`;
  document.body.append(EXP);
  const $q = s => EXP.querySelector(s);
  $q('.institution-tab-close').onclick = () => abrirExp(false);
  document.querySelector('.institution-tabs')?.addEventListener('click', e => { if (e.target.closest('[role=tab]')) abrirExp(false); });
  EXP.querySelectorAll('.cc-modo button').forEach(b => b.onclick = () => { ex.modo = b.dataset.m; ex.sel = null; ex.q = ''; $q('.fx-q').value = ''; construirExp(); });
  const fzb = $q('.fx-exfz'); F.FUERZAS.forEach(([id, nombre, col]) => { const b = h('button'); b.type = 'button'; b.dataset.k = id; b.style.setProperty('--c', col); b.append(h('i'), document.createTextNode(nombre)); b.title = 'Mostrar solo ' + nombre + ' (puedes elegir varias)';
    b.onclick = () => { ex.fz.has(id) ? ex.fz.delete(id) : ex.fz.add(id); construirExp(); }; fzb.append(b); });
  const verP = sec.querySelector('.fa-ver'), omP = sec.querySelector('.fa-om'), ver = $q('.fx-ver'), om = $q('.fx-om2');
  ver.onchange = () => { if (verP && verP.checked !== ver.checked) { verP.checked = ver.checked; verP.dispatchEvent(new Event('change', { bubbles: true })); } };
  om.onchange = () => { if (omP && omP.checked !== om.checked) { omP.checked = om.checked; omP.dispatchEvent(new Event('change', { bubbles: true })); } construirExp(); };
  let tq = 0; $q('.fx-q').addEventListener('input', e => { clearTimeout(tq); tq = setTimeout(() => { ex.q = e.target.value; construirExp(); }, 150); });
  for (const t of ['pointerdown', 'keydown', 'wheel']) EXP.addEventListener(t, e => e.stopPropagation());
  return EXP;
}
function abrirExp(si) {
  const P = explorador();
  if (si) { const a = document.querySelector('main > aside'), r = a && !a.hidden ? a.getBoundingClientRect() : null;
    if (r && innerWidth > 900) { P.style.setProperty('left', (r.right + 12) + 'px', 'important'); P.style.setProperty('right', 'auto', 'important'); } }
  P.hidden = !si; sec.querySelectorAll('.fx-abrir').forEach(b => b.classList.toggle('on', si));
  if (si) { P.querySelector('.fx-ver').checked = !!sec.querySelector('.fa-ver')?.checked; P.querySelector('.fx-om2').checked = !!sec.querySelector('.fa-om')?.checked;
    P.querySelector('.fx-sel').replaceChildren(h('p', 'cc-vacio', 'Cargando departamentos y divisiones…'));
    Promise.all([cargarDeps(), cargarDivP()]).then(completarPuestos).then(construirExp); setTimeout(() => P.querySelector('.fx-q').focus(), 50); }
}
const unidadesExp = () => feats().filter(f => (ex.modo !== 'pto' || ES_PUESTO.test(f.properties.cat)) && (!EXP.querySelector('.fx-om2').checked || f.properties.om) && (!ex.fz.size || ex.fz.has(f.properties.fuerza)));
const regionDe = f => ex.modo === 'div' ? divTerr(f) : depDe(f);
function regionesExp() {
  if (ex.modo !== 'div') { const m = new Map(); DEPS.dep.forEach(d => { if (!m.has(d.n)) m.set(d.n, { k: d.n, nombre: d.n, rs: [] }); m.get(d.n).rs.push(...d.r); }); return [...m.values()]; }
  return DIVP.map(d => ({ k: d.k, nombre: d.n, rs: d.r, color: PALETA_DIV[d.k] || '#56657A' }));
}
const cuentaFz = xs => F.FUERZAS.map(([id]) => [id, xs.filter(f => f.properties.fuerza === id).length]).filter(x => x[1]).map(([id, n]) => corto(id) + ' ' + n).join(' · ');
function construirExp() {
  if (!EXP || EXP.hidden || !DEPS || !DIVP) return;
  const $q = s => EXP.querySelector(s), L = unidadesExp();
  EXP.querySelectorAll('.cc-modo button').forEach(b => b.classList.toggle('on', b.dataset.m === ex.modo));
  EXP.querySelectorAll('.fx-exfz button').forEach(b => b.classList.toggle('on', ex.fz.has(b.dataset.k)));
  const T = feats();
  $q('.fx-k').innerHTML = `<span><b>${L.length}</b> UNIDADES Y ELEMENTOS</span><span><b>${new Set(T.map(f => f.properties.fuerza)).size}</b> FUERZAS</span><span><b>${new Set(DEPS.dep.map(d => d.n)).size}</b> DEPARTAMENTOS</span><span><b>${T.filter(f => ES_PUESTO.test(f.properties.cat)).length}</b> PUESTOS MILITARES</span><span><b>${DIVP.length}</b> DIVISIONES</span>`;
  // mapa de Bolivia para elegir
  const R = regionesExp(), W = 440, H = 300, bb = [-69.7, -22.95, -57.4, -9.6], cx = Math.cos(16.3 * D2R);
  const sx = (W - 12) / ((bb[2] - bb[0]) * cx), sy = (H - 12) / (bb[3] - bb[1]), k = Math.min(sx, sy), ox = (W - (bb[2] - bb[0]) * cx * k) / 2, oy = (H - (bb[3] - bb[1]) * k) / 2;
  const P = (lo, la) => [ox + (lo - bb[0]) * cx * k, oy + (bb[3] - la) * k];
  const sv = document.createElementNS(NS, 'svg'); sv.setAttribute('viewBox', `0 0 ${W} ${H}`); sv.setAttribute('class', 'cc-mini-svg');
  const mk = (par, t, at) => { const e = document.createElementNS(NS, t); for (const a in at) e.setAttribute(a, at[a]); par.append(e); return e; };
  const anillos = rs => rs.map(r => 'M' + r.map(([lo, la]) => P(lo, la).map(v => v.toFixed(1)).join(',')).join('L') + 'Z').join('');
  for (const r of R) { const n = L.filter(f => regionDe(f) === r.k).length, gr = mk(sv, 'g', { class: 'rg' + (ex.sel === r.k ? ' sel' : '') });
    const p = mk(gr, 'path', { d: anillos(r.rs), 'fill-rule': 'evenodd' }); if (r.color) { p.style.setProperty('--c', r.color); gr.classList.add('col'); }
    mk(gr, 'title', {}).textContent = `${r.k}${r.nombre !== r.k ? ' · ' + r.nombre : ''} — ${n} unidades`;
    gr.onclick = () => { ex.sel = ex.sel === r.k ? null : r.k; ex.q = ''; $q('.fx-q').value = ''; construirExp(); }; }
  for (const f of L) { const c = F.centro(f); if (!c || !isFinite(c[0])) continue; const [x, y] = P(c[0], c[1]);
    const enSel = !ex.sel || (ex.sel.startsWith('T:') ? f.properties.cat === ex.sel.slice(2) : regionDe(f) === ex.sel);
    const d = mk(sv, 'circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: ex.sel && enSel ? 2.6 : ex.modo === 'pto' ? 2.1 : 1.7, class: 'fx-pt' }); d.style.fill = ex.modo === 'pto' ? (COL_P[f.properties.cat] || '#12294A') : colorFz(f.properties.fuerza);
    if (!enSel) d.style.opacity = .2; }
  for (const r of R) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; r.rs.reduce((a, b) => b.length > a.length ? b : a, []).forEach(([lo, la]) => { const [x, y] = P(lo, la); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    mk(sv, 'text', { x: (x0 + x1) / 2, y: (y0 + y1) / 2, class: 'et' + (ex.sel === r.k ? ' sel' : '') }).textContent = r.k.replace('CMDO. UU. DD. EJTO.', 'CMDO.'); }
  $q('.fx-mini').replaceChildren(sv);
  // migas
  const ru = $q('.fx-ruta'); ru.replaceChildren(); const b0 = h('button', 'cc-miga' + (ex.sel ? '' : ' on'), 'BOLIVIA'); b0.type = 'button'; b0.onclick = () => { ex.sel = null; construirExp(); }; ru.append(b0);
  if (ex.sel) ru.append(h('span', null, '›'), h('b', null, ex.sel.replace(/^T:/, '')));
  const box = $q('.fx-sel'); box.replaceChildren();
  const t = norm(ex.q.trim());
  if (t) {   // buscador: resultados agrupados por fuerza
    const r = L.filter(f => { const p = f.properties; return norm([p.sigla, p.nombre, p.ubicacion, p.cat, p.grupo, p.depende, p.arma, depDe(f), divDe(f), divTerr(f), DEPS.div[divDe(f)]].join(' ')).includes(t); });
    if (!r.length) box.append(h('p', 'cc-vacio', 'No se encontraron unidades con ese texto.'));
    else box.append(h('h4', null, `${r.length} UNIDADES ENCONTRADAS`));
    F.FUERZAS.forEach(([id, nombre, col]) => { const xs = r.filter(f => f.properties.fuerza === id).sort(porCat); if (!xs.length) return;
      box.append(grupoExp(nombre, col, xs.length + ' unid.', true, d => { const l = h('div', 'cc-lista'); xs.slice(0, 200).forEach(f => l.append(itemD(f, depDe(f) + ' · ' + divDe(f)))); d.append(l); })); });
    return;
  }
  if (ex.modo === 'pto' && !ex.sel) {   // tarjetas por tipo de puesto (con su símbolo) y por departamento
    const gt = h('div', 'cc-tarjs');
    Object.keys(COL_P).forEach(cat => { const xs = L.filter(f => f.properties.cat === cat); if (!xs.length) return;
      const c = h('button', 'cc-tarj fx-tp'); c.type = 'button'; const ic = h('span', 'fx-tpi'); ic.innerHTML = F.icono(xs[0].properties, 30); ic.style.setProperty('--c', COL_P[cat]);
      c.append(ic, h('b', null, cat.replace('Puestos militares ', 'Puestos ').toUpperCase()), h('small', null, xs.length + ' puestos · ' + new Set(xs.map(depDe)).size + ' departamentos'));
      c.onclick = () => { ex.sel = 'T:' + cat; construirExp(); }; gt.append(c); });
    box.append(h('h4', null, `${L.length} PUESTOS MILITARES · ELIGE UN TIPO`), gt);
  }
  if (ex.sel && ex.sel.startsWith('T:')) {   // un tipo de puesto: por departamento › división › puestos
    const cat = ex.sel.slice(2), xs = L.filter(f => f.properties.cat === cat);
    box.append(h('h4', null, `${xs.length} ${cat.toUpperCase()}`));
    [...new Set(xs.map(depDe))].sort((a, b) => a.localeCompare(b, 'es')).forEach((dn, i) => { const us = xs.filter(f => depDe(f) === dn).sort((a, b) => ordenDiv(divDe(a), divDe(b)) || String(a.properties.sigla).localeCompare(String(b.properties.sigla), 'es'));
      box.append(grupoExp(dn, COL_P[cat], us.length + ' puestos', i === 0, d => { const l = h('div', 'cc-lista'); let ult = null;
        us.forEach(f => { const dv = divDe(f); if (dv !== ult) { ult = dv; l.append(h('div', 'fx-dvh', dv + (DEPS.div[dv] ? ' · ' + DEPS.div[dv] : ''))); }
          const p = f.properties; l.append(itemD(f, [p.depende && p.depende !== p.sigla ? 'Depende de ' + p.depende : '', p.nota].filter(Boolean).join(' · '))); });
        d.append(l); })); });
    return;
  }
  if (!ex.sel) {   // tarjetas de todas las regiones
    const g = h('div', 'cc-tarjs');
    R.map(r => ({ r, xs: L.filter(f => regionDe(f) === r.k) })).filter(x => x.xs.length).sort((a, b) => ex.modo === 'dep' ? a.r.k.localeCompare(b.r.k, 'es') : 0).forEach(({ r, xs }) => {
      const c = h('button', 'cc-tarj'); c.type = 'button'; const sw = h('span', 'cc-sw'); sw.style.background = r.color || '#12294A';
      const nc = re => xs.filter(f => re.test(f.properties.cat)).length; c.append(sw, h('b', null, r.k), h('small', null, xs.length + ' unid. · ' + cuentaFz(xs)), h('small', 'fx-pz', ['PMA ' + nc(/adelantados/), 'PMS ' + nc(/seguridad/), 'PMC ' + nc(/de control/), 'PPMMPP ' + nc(/PPMMPP/)].filter(t => !/ 0$/.test(t)).join(' · '))); c.title = r.nombre; c.onclick = () => { ex.sel = r.k; construirExp(); }; g.append(c); });
    box.append(h('h4', null, ex.modo === 'div' ? 'ELIGE UNA DIVISIÓN' : ex.modo === 'pto' ? 'O ELIGE UN DEPARTAMENTO' : 'ELIGE UN DEPARTAMENTO'), g); return;
  }
  // región elegida: resumen por tipo y, por fuerza › tipo de unidad (puestos adelantados, de seguridad…) › unidades
  const xs = L.filter(f => regionDe(f) === ex.sel);
  box.append(h('h4', null, `${xs.length} UNIDADES Y ELEMENTOS${ex.modo === 'div' && DEPS.div[ex.sel] ? ' · ' + DEPS.div[ex.sel] : ''}`));
  const res = h('div', 'fx-tipos'); const cats = new Map(); xs.forEach(f => { const c = f.properties.cat; cats.set(c, (cats.get(c) || 0) + 1); });
  [...cats].sort((a, b) => ordenCat(a[0]) - ordenCat(b[0])).forEach(([c, n]) => { const b = h('button', null); b.type = 'button'; b.append(h('b', null, n), document.createTextNode(' ' + c)); b.title = 'Ver ' + c;
    b.onclick = () => { const d = box.querySelector(`.cc-sub[data-cat="${CSS.escape(c)}"]`); if (d) { d.closest('.cc-grupo').open = true; d.open = true; d.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }; res.append(b); });
  box.append(res);
  F.FUERZAS.forEach(([id, nombre, col]) => { const fz = xs.filter(f => f.properties.fuerza === id); if (!fz.length) return;
    box.append(grupoExp(nombre, col, fz.length + ' unid.', true, d => {
      const grupos = new Map(); fz.forEach(f => { const k = f.properties.cat; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(f); });
      [...grupos.keys()].sort((a, b) => ordenCat(a) - ordenCat(b)).forEach(k => { const us = grupos.get(k).sort((a, b) => ordenDiv(divDe(a), divDe(b)) || String(a.properties.sigla || a.properties.nombre).localeCompare(String(b.properties.sigla || b.properties.nombre), 'es', { numeric: true }));
        const s = h('details', 'cc-sub'), sm = h('summary'); s.dataset.cat = k; sm.append(h('span', null, k), h('span', 'cc-cnt')); sm.lastChild.append(h('span', null, us.length)); s.append(sm);
        let hecho = false; s.addEventListener('toggle', () => { if (!s.open || hecho) return; hecho = true; const l = h('div', 'cc-lista');
          let ult = null; us.forEach(f => { const dv = divDe(f); if (dv !== ult && !/división|divisiones|Distritos/i.test(k)) { ult = dv; l.append(h('div', 'fx-dvh', dv + (DEPS.div[dv] ? ' · ' + DEPS.div[dv] : ''))); }
            const p = f.properties; l.append(itemD(f, [p.depende && p.depende !== p.sigla ? 'Depende de ' + p.depende : '', p.arma].filter(Boolean).join(' · '))); });
          s.append(l); });
        d.append(s); });
    })); });
}
const ORDCAT = ['Puestos militares adelantados', 'Puestos militares de seguridad', 'Puestos militares de control', 'Otros puestos militares (PPMMPP)', 'Unidades de combate (regimientos y batallones)', 'Jurisdicción de las unidades', 'Grandes Unidades de Combate (divisiones)', 'Jurisdicción de las divisiones', 'Unidades dependientes de los departamentos', 'Institutos militares', 'Instituto Geográfico Militar (IGM)', 'Comando General', 'Distritos y áreas navales', 'Unidades navales', 'Grupos aéreos', 'Comandos Estratégicos Operacionales (CEO)'];
const ordenCat = c => { const i = ORDCAT.indexOf(c); return i < 0 ? 99 : i; };
function grupoExp(titulo, color, n, abierto, llenar) {
  const d = h('details', 'cc-grupo'), s = h('summary'), sw = h('span', 'cc-sw'); sw.style.background = color;
  s.append(sw, h('span', 'tt', titulo.toUpperCase()), h('span', 'n', n)); d.append(s);
  let hecho = false; const ll = () => { if (hecho) return; hecho = true; llenar(d); };
  d.open = !!abierto; if (abierto) ll(); d.addEventListener('toggle', () => d.open && ll()); return d;
}
function departamentos() {   // pestaña DEPARTAMENTOS del panel FFAA: abre el explorador y ofrece búsqueda rápida
  const cab = h('div', 'fx-dcab');
  const b = h('button', 'cc-mas fx-abrir' + (EXP && !EXP.hidden ? ' on' : ''), 'EXPLORAR FUERZAS ARMADAS ➜'); b.type = 'button';
  b.onclick = () => abrirExp(!(EXP && !EXP.hidden));
  cab.append(h('p', 'fx-ayuda', 'Unidades organizadas por departamento y por división del Ejército, clasificadas por fuerza, con mapa de Bolivia y buscador.'), b);
  cuerpo.append(cab);
}
window.EMTE_FFAA_EXPLORAR = abrirExp;

/* 5. organigrama */
function organigrama() {
  const miga = h('div', 'fx-miga'), raizA = h('a', null, 'FF.AA.'); raizA.onclick = () => { ruta = []; pintar(); }; miga.append(raizA);
  ruta.forEach((r, i) => { miga.append(document.createTextNode('›')); const a = i < ruta.length - 1 ? h('a', null, r.t) : h('b', null, r.t); if (a.tagName === 'A') a.onclick = () => { ruta = ruta.slice(0, i + 1); pintar(); }; miga.append(a); });
  cuerpo.append(miga);
  const cj = feats().filter(f => f.properties.fuerza === 'COMANDO EN JEFE');
  const raiz = h('div', 'fx-raiz'); raiz.innerHTML = F.icono(cj[0]?.properties || { sim: 'unidad' }, 34); const rt = h('div'); rt.append(h('b', null, 'COMANDO EN JEFE DE LAS FF.AA.'), h('small', null, cj.length + ' elementos · toca para verlos')); raiz.append(rt);
  raiz.onclick = () => { ruta = [{ t: 'COMANDO EN JEFE', fz: 'COMANDO EN JEFE' }]; pintar(); };
  cuerpo.append(raiz, h('div', 'fx-con'));
  const hijos = h('div', 'fx-hijos');
  F.FUERZAS.filter(x => x[0] !== 'COMANDO EN JEFE').forEach(([id, nombre, col]) => {
    const fs = feats().filter(f => f.properties.fuerza === id), n = h('div', 'fx-nodo' + (ruta[0]?.fz === id ? ' on' : '')); n.style.background = `linear-gradient(160deg,${col},#0B1D33)`;
    const ic = h('span'); ic.innerHTML = F.icono(fs.find(f => f.geometry.type === 'Point')?.properties || { sim: 'unidad' }, 30);
    n.append(ic, h('b', null, nombre.toUpperCase()), h('small', null, fs.length)); n.onclick = () => { ruta = [{ t: nombre.toUpperCase(), fz: id }]; pintar(); }; hijos.append(n);
  });
  cuerpo.append(hijos);
  if (!ruta.length) return;
  const fz = ruta[0].fz, col = colorFz(fz), fsF = feats().filter(f => f.properties.fuerza === fz);
  const cats = [...new Set(fsF.map(f => f.properties.cat))];
  const lista = h('div', 'fx-cats');
  cats.forEach(cat => {
    const fs = fsF.filter(f => f.properties.cat === cat), on = ruta[1]?.cat === cat, c = h('div', 'fx-cat' + (on ? ' on' : '')); c.style.setProperty('--c', col);
    const ic = h('span'); ic.innerHTML = F.icono(fs[0].properties, 30); c.append(ic, h('span', null, cat), h('em', null, fs.length));
    c.onclick = () => { ruta = on ? ruta.slice(0, 1) : [ruta[0], { t: cat.toUpperCase(), cat }]; pintar(); };
    lista.append(c);
    if (!on) return;
    const sub = h('div', 'fx-sub'), grupos = [...new Set(fs.map(f => f.properties.grupo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    let grSel = ruta[2]?.gr || null;
    if (grupos.length > 1) { const gr = h('div', 'fx-gr'); [['', 'TODOS'], ...grupos.map(x => [x, x])].forEach(([v, t]) => { const b = h('button', (grSel || '') === v ? 'on' : null, t + (v ? ' (' + fs.filter(f => f.properties.grupo === v).length + ')' : '')); b.type = 'button'; b.onclick = e => { e.stopPropagation(); ruta = [ruta[0], ruta[1], ...(v ? [{ t: v, gr: v }] : [])]; pintar(); }; gr.append(b); }); sub.append(gr); }
    const l = h('div', 'fx-lista'); fs.filter(f => !grSel || f.properties.grupo === grSel).forEach(f => l.append(item(f, f.geometry.type !== 'Point' ? 'ÁREA' : ''))); sub.append(l);
    lista.append(sub);
  });
  if (fz === 'COMANDO EN JEFE') { const l = h('div', 'fx-lista'); fsF.forEach(f => l.append(item(f))); cuerpo.append(h('div', 'fx-n', 'ELEMENTOS DEL COMANDO EN JEFE'), l); }
  else cuerpo.append(h('div', 'fx-n', 'CATEGORÍAS DE ' + ruta[0].t), lista);
}

/* 6. buscar y filtrar */
let eligiendo = false;
function buscar() {
  const fl = h('div', 'fx-filtros');
  const q = h('input'); q.type = 'search'; q.placeholder = 'Buscar sigla, nombre o lugar…'; q.value = bus.q; q.oninput = () => { bus.q = q.value; resultados(); };
  const fzb = h('div', 'fx-fz'); F.FUERZAS.forEach(([id, n, col]) => { const b = h('button', bus.fz.has(id) ? 'on' : null); b.type = 'button'; b.style.setProperty('--c', col); b.append(h('i'), document.createTextNode(n.replace(/ de las FF\.AA\.| Boliviana/g, '').toUpperCase())); b.onclick = () => { bus.fz.has(id) ? bus.fz.delete(id) : bus.fz.add(id); b.classList.toggle('on'); llenarCats(); resultados(); }; fzb.append(b); });
  const cat = h('select'), arma = h('select'), dos = h('div', 'fx-2');
  function llenarCats() { const v = bus.cat; cat.replaceChildren(new Option('Todas las categorías', '')); [...new Set(feats().filter(f => !bus.fz.size || bus.fz.has(f.properties.fuerza)).map(f => f.properties.cat))].sort().forEach(c => cat.append(new Option(c, c))); cat.value = [...cat.options].some(o => o.value === v) ? v : ''; bus.cat = cat.value; }
  llenarCats(); cat.onchange = () => { bus.cat = cat.value; resultados(); };
  arma.append(new Option('Todas las armas', '')); [...new Set(feats().map(f => f.properties.arma).filter(Boolean))].sort().forEach(a => arma.append(new Option(a.charAt(0) + a.slice(1).toLowerCase(), a))); arma.value = bus.arma; arma.onchange = () => { bus.arma = arma.value; resultados(); };
  dos.append(cat, arma);
  const om = h('label'); om.style.cssText = 'display:flex!important;gap:7px;align-items:center;font-size:11.5px;font-weight:600;padding:0!important;border:0!important'; const cb = h('input'); cb.type = 'checkbox'; cb.checked = bus.om; cb.onchange = () => { bus.om = cb.checked; resultados(); }; om.append(cb, document.createTextNode('Solo los de Omasuyos'));
  const rad = h('div', 'fx-radio'), rTxt = h('div'); rTxt.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;flex-wrap:wrap';
  const rSel = h('select'); [5, 10, 25, 50, 100, 200].forEach(v => rSel.append(new Option(v + ' km', v))); rSel.value = bus.radio; rSel.style.cssText = 'width:auto;padding:4px 6px'; rSel.onchange = () => { bus.radio = +rSel.value; circulo(); resultados(); };
  rTxt.append(document.createTextNode(bus.centro ? '📍 Cerca del punto marcado, radio' : '📍 Cerca de un punto, radio'), rSel);
  const bP = h('button', null, bus.centro ? 'OTRO PUNTO' : 'MARCAR PUNTO'); bP.type = 'button'; bP.onclick = elegirPunto;
  rad.append(rTxt, bP);
  if (bus.centro) { const bq = h('button', 'sec', 'QUITAR'); bq.type = 'button'; bq.onclick = () => { bus.centro = null; circulo(); pintar(); }; rad.append(h('span'), bq); }
  fl.append(q, fzb, dos, om, rad); cuerpo.append(fl);
  const n = h('div', 'fx-n'), lista = h('div', 'fx-lista'); cuerpo.append(n, lista);
  function resultados() {
    const t = norm(bus.q.trim());
    let r = feats().filter(f => { const p = f.properties; return (!bus.fz.size || bus.fz.has(p.fuerza)) && (!bus.cat || p.cat === bus.cat) && (!bus.arma || p.arma === bus.arma) && (!bus.om || p.om) && (!t || norm([p.sigla, p.nombre, p.ubicacion, p.guc, p.depende, p.cat].join(' ')).includes(t)); });
    let dist = null; if (bus.centro) { dist = new Map(r.map(f => [f, km(bus.centro, F.centro(f))])); r = r.filter(f => dist.get(f) <= bus.radio).sort((a, b) => dist.get(a) - dist.get(b)); }
    n.textContent = `${r.length} RESULTADO${r.length === 1 ? '' : 'S'}` + (r.length > 200 ? ' · SE MUESTRAN 200' : '');
    lista.replaceChildren(...r.slice(0, 200).map(f => item(f, dist ? dec(dist.get(f)) + ' km' : f.geometry.type !== 'Point' ? 'ÁREA' : '')));
  }
  resultados();
}
function elegirPunto() {
  const mapa = document.querySelector('.map'), svg = scene.ownerSVGElement; if (eligiendo) return; eligiendo = true; mapa.classList.add('fx-elegir');
  const av = document.querySelector('.hp-aviso'); if (av) { av.textContent = 'Toca el mapa para marcar el punto · Esc para cancelar'; av.hidden = false; }
  let abajo = null;
  const pd = e => { abajo = [e.clientX, e.clientY]; };
  const fin = () => { eligiendo = false; mapa.classList.remove('fx-elegir'); svg.removeEventListener('pointerdown', pd, true); svg.removeEventListener('click', cl, true); document.removeEventListener('keydown', ke); if (av) av.hidden = true; };
  const cl = e => { if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 5) return; e.stopPropagation(); e.preventDefault();
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(scene.getScreenCTM().inverse()); bus.centro = deEscena(p.x, p.y); fin(); circulo(); F.mostrar(true); modo = 'bus'; pintar(); };
  const ke = e => { if (e.key === 'Escape') fin(); };
  svg.addEventListener('pointerdown', pd, true); svg.addEventListener('click', cl, true); document.addEventListener('keydown', ke);
}
if (typeof zoom === 'function') { const zPrev = zoom; zoom = function (...a) { const r = zPrev.apply(this, a); const m = g.querySelector('circle.fx-c'); if (m) m.setAttribute('r', 4 / scale); return r; }; }
let n = 0; (function esperar() { if (!montar() && ++n < 120) setTimeout(esperar, 250); })();
window.EMTE_FFAA_UI = { ir, pintar };
});
