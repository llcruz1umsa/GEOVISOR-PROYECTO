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
.fa-sec.fx-org .fa-fz,.fa-sec.fx-bus .fa-fz{display:none}
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

let F = null, sec = null, modo = 'org', ruta = [], bus = { q: '', fz: new Set(), cat: '', arma: '', om: false, centro: null, radio: 25 };
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
  tabs = h('div', 'fx-tabs'); [['org', '🏛 ORGANIGRAMA'], ['bus', '🔎 BUSCAR Y FILTRAR'], ['lis', '☰ LISTA']].forEach(([k, t]) => { const b = h('button', null, t); b.type = 'button'; b.dataset.k = k; b.onclick = () => { modo = k; pintar(); }; tabs.append(b); });
  cuerpo = h('div', 'fx-cuerpo');
  const op = sec.querySelector('.fa-op'); (op || sec.firstChild).after(tabs, cuerpo);
  pintar(); return true;
}
function pintar() {
  tabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === modo));
  sec.classList.toggle('fx-org', modo === 'org'); sec.classList.toggle('fx-bus', modo === 'bus');
  cuerpo.hidden = modo === 'lis'; cuerpo.replaceChildren();
  if (modo === 'org') organigrama(); else if (modo === 'bus') buscar();
}
const item = (f, extra) => {
  const p = f.properties, b = h('button', 'fx-it'); b.type = 'button';
  const ic = h('span'); ic.innerHTML = F.icono(p, 30); const t = h('span'); const n = h('b', null, p.sigla || p.nombre); if (p.om) n.append(h('span', 'fx-om', 'OMASUYOS')); t.append(n, h('small', null, [p.nombre !== p.sigla ? p.nombre : '', p.ubicacion].filter(Boolean).join(' · ')));
  b.append(ic, t, h('span', 'd', extra || '')); b.onclick = () => ir(f); return b;
};

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
