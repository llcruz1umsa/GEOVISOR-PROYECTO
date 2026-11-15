/* Rutas con tiempo estimado (BYNS7; vehículos de la EMTE con visor 3D y 3 opciones, 04-11-2026).
   Calcula la ruta en el propio navegador sobre la capa de vías (funciona sin conexión y sin PostGIS).
   · VEHÍCULO (perfil Toyota Noah, velocidad máxima 175–180 km/h): en cada tramo va a la MENOR velocidad entre la
     máxima del vehículo y la que permite la vía (clase, superficie y estado). Da 3 opciones clasificadas por eficiencia:
       1 MÁS RÁPIDA (menor tiempo) · 2 MÁS CORTA (menor distancia) · 3 MÁS SEGURA (prefiere vías principales y pavimento,
       evita tierra, ripio y tramos en mal estado). Si dos coinciden, se avisa.
   · A PIE: usa toda la red a 4,5 km/h. Valores de referencia, no oficiales. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const NS = 'http://www.w3.org/2000/svg', K = 65759.1401421867, OX = 1.199706713376768, OY = 0.2830464015276702, D2R = Math.PI / 180;
// 04-11-2026: VEHÍCULOS DE LA EMTE. La velocidad la manda la VÍA que toma cada tramo, ajustada al vehículo:
// en carretera y caminos = velocidad de referencia de la vía × (velocidad media del vehículo / 90); en calles = su velocidad
// mínima (circulación urbana); nunca pasa su máxima. Los 4x4 van mejor en tierra, ripio y tramos malos; los pesados, peor.
const VEH = [
  { id: 'kinglong', n: 'MINIBÚS KING LONG', real: 'Minibús King Long (tipo Coaster)', uso: 'Transporte de personal', max: 110, med: 80, min: 30 },
  { id: 'noah', n: 'TOYOTA TOWN ACE NOAH', real: 'Toyota Town Ace Noah', uso: 'Vagoneta de pasajeros', max: 160, med: 90, min: 30 },
  { id: 'surf', n: 'TOYOTA HILUX SURF', real: 'Toyota Hilux Surf', uso: 'Vagoneta 4x4', max: 160, med: 90, min: 30, t4: 1 },
  { id: 'iveco', n: 'CAMIÓN IVECO EUROCARGO', real: 'Camión Iveco EuroCargo', uso: 'Transporte de tropa y carga (Ejército de Bolivia)', max: 100, med: 70, min: 20, pesado: 1, alto: 1 },
  { id: 'lc78', n: 'AMBULANCIA', real: 'Toyota Land Cruiser 78', uso: 'Ambulancia 4x4', max: 140, med: 80, min: 30, t4: 1 },
  { id: 'bluebird', n: 'TOPO BUS', real: 'Bus Blue Bird All American', uso: 'Bus de transporte de personal', max: 105, med: 70, min: 25, pesado: 1 }
];
const VIA = { 'Carretera RVF': 90, 'Carretera principal (no RVF)': 70, 'Camino secundario': 60, 'Camino terciario': 45, 'Camino vecinal': 30, 'Calle': 25, 'Camino de herradura / brecha': 0, 'Sendero / peatonal': 0 };
const A_PIE = 4.5;
let VA = (() => { try { return VEH.find(v => v.id === localStorage.getItem('emte-rt-veh')) || VEH[1]; } catch (e) { return VEH[1]; } })();
function velocidad(p, modo) {
  if (/intransitable/i.test(p.estado || '')) return 0;
  if (modo === 'pie') return A_PIE;
  const V = VA, tv = p.tipo_via || '', s = String(p.superficie || ''), e = String(p.estado || '');
  let v = VIA[tv]; if (tv === 'Camino de herradura / brecha' && V.t4) v = 15;   // brechas: solo 4x4
  if (!v) return 0;
  if (/solo veh[ií]culos altos|4x4/i.test(e) && !(V.t4 || V.alto)) return 0;   // tramos solo para vehículos altos / 4x4
  v = tv === 'Calle' ? V.min : v * V.med / 90;
  if (/tierra|sin pavimentar/i.test(s)) v = Math.min(v, V.t4 ? 50 : V.pesado ? 30 : 40);
  else if (/ripio/i.test(s)) v = Math.min(v, V.t4 ? 60 : V.pesado ? 40 : 50);
  else if (/adoqu|empedr/i.test(s)) v = Math.min(v, V.pesado ? 20 : 25);
  if (/construcci/i.test(e)) v *= .6;
  else if (/muy malo|horrible/i.test(e)) v *= V.t4 ? .55 : .4;
  else if (/malo/i.test(e)) v *= V.t4 ? .75 : .6;
  else if (/regular/i.test(e)) v *= V.t4 ? .9 : .8;
  return Math.min(v, V.max);
}
// penalidad de la opción MÁS SEGURA: vías menores, sin pavimento o en mal estado «cuestan» más
function riesgo(p) {
  let f = { 'Carretera RVF': 1, 'Carretera principal (no RVF)': 1.1, 'Camino secundario': 1.6, 'Camino terciario': 2.2, 'Camino vecinal': 3, 'Calle': 1.8 }[p.tipo_via] || 3;
  const s = String(p.superficie || ''), e = String(p.estado || '');
  if (/tierra|sin pavimentar|ripio/i.test(s)) f *= 1.6; else if (/sin dato/i.test(s) || !s) f *= 1.2;
  if (/malo|construcci/i.test(e)) f *= 2;
  return f;
}
const pavimento = p => /asfalto|hormig|pavimento/i.test(String(p.superficie || ''));
const km = (a, b) => { const dl = (b[1] - a[1]) * D2R, dn = (b[0] - a[0]) * D2R, q = Math.sin(dl / 2) ** 2 + Math.cos(a[1] * D2R) * Math.cos(b[1] * D2R) * Math.sin(dn / 2) ** 2; return 2 * 6371.0088 * Math.asin(Math.sqrt(q)); };
const llave = c => c[0].toFixed(6) + ',' + c[1].toFixed(6);

/* ---------- grafo ---------- */
let G = null;
function grafo() {
  if (G) return G;
  const id = new Map(), XY = [], ady = [];
  const nodo = c => { const k = llave(c); let i = id.get(k); if (i == null) { i = XY.length; id.set(k, i); XY.push([+c[0], +c[1]]); ady.push([]); } return i; };
  const abc = fi => /Carretera/i.test(roadFeatures[fi].properties.tipo_via || '') && /ABC/i.test(roadFeatures[fi].properties.observacion || '');
  roadFeatures.forEach((f, fi) => {
    const densa = abc(fi);
    for (const l of f.geometry.coordinates) for (let i = 1; i < l.length; i++) {
      let pts = [l[i - 1], l[i]];
      if (densa) { const L = km(l[i - 1], l[i]), n = Math.ceil(L / .04); pts = []; for (let k = 0; k <= n; k++) pts.push([l[i - 1][0] + (l[i][0] - l[i - 1][0]) * k / n, l[i - 1][1] + (l[i][1] - l[i - 1][1]) * k / n]); }
      for (let k = 1; k < pts.length; k++) { const a = nodo(pts[k - 1]), b = nodo(pts[k]); if (a === b) continue; const d = km(XY[a], XY[b]); ady[a].push([b, d, fi]); ady[b].push([a, d, fi]); }
    }
  });
  // celdas para buscar el nodo más cercano
  const celdas = new Map(), T = .01;
  XY.forEach((c, i) => { const k = Math.floor(c[0] / T) + ',' + Math.floor(c[1] / T); (celdas.get(k) || celdas.set(k, []).get(k)).push(i); });
  // La Red Vial Fundamental viene de la ABC y no comparte nodos con los caminos de OSM:
  // se unen sus vértices con el nodo de otra vía más cercano (hasta 60 m) y los extremos sueltos (hasta 25 m).
  const esRVF = abc;
  const rvf = new Uint8Array(XY.length); ady.forEach((l, i) => { if (l.some(([, , fi]) => esRVF(fi))) rvf[i] = 1; });
  const unir = (i, lim, cond) => {
    const c = XY[i], cx = Math.floor(c[0] / T), cy = Math.floor(c[1] / T); let best = -1, dm = lim;
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) for (const j of celdas.get(x + ',' + y) || []) {
      if (j === i || !cond(j)) continue; const d = km(c, XY[j]); if (d < dm) { dm = d; best = j; }
    }
    if (best >= 0 && !ady[i].some(([v]) => v === best)) { const fi = ady[best][0] ? ady[best][0][2] : ady[i][0][2]; ady[i].push([best, dm, fi]); ady[best].push([i, dm, fi]); return 1; }
    return 0;
  };
  let uniones = 0; const n0 = XY.length;
  for (let i = 0; i < n0; i++) if (!rvf[i]) uniones += unir(i, .04, j => rvf[j]);
  for (let i = 0; i < n0; i++) if (ady[i].length === 1) uniones += unir(i, .025, j => !ady[i].some(([v]) => v === j) && j !== ady[i][0][0]);
  G = { XY, ady, celdas, T, uniones };
  return G;
}
function cercano(pt, modo) {
  const { XY, ady, celdas, T } = grafo(); let best = -1, dm = Infinity;
  const cx = Math.floor(pt[0] / T), cy = Math.floor(pt[1] / T);
  for (let r = 0; r <= 3 && best < 0; r++) for (let x = cx - r; x <= cx + r; x++) for (let y = cy - r; y <= cy + r; y++) {
    for (const i of celdas.get(x + ',' + y) || []) {
      if (!ady[i].some(([, , fi]) => velocidad(roadFeatures[fi].properties, modo) > 0)) continue;
      const d = km(pt, XY[i]); if (d < dm) { dm = d; best = i; }
    }
  }
  return best < 0 ? null : [best, dm];
}
function dijkstra(s, t, modo, criterio = 'tiempo') {   // criterio: tiempo · distancia · seguridad
  const { XY, ady } = grafo(), n = XY.length, dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), pf = new Int32Array(n).fill(-1);
  const H = [[0, s]]; dist[s] = 0;
  const push = x => { H.push(x); let i = H.length - 1; while (i) { const p = (i - 1) >> 1; if (H[p][0] <= H[i][0]) break; [H[p], H[i]] = [H[i], H[p]]; i = p; } };
  const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === i) break; [H[m], H[i]] = [H[i], H[m]]; i = m; } } return top; };
  while (H.length) {
    const [d, u] = pop(); if (d > dist[u]) continue; if (u === t) break;
    for (const [v, L, fi] of ady[u]) { const p = roadFeatures[fi].properties, vel = velocidad(p, modo); if (!vel) continue;
      const c = criterio === 'distancia' ? L : criterio === 'seguridad' ? L / vel * riesgo(p) : L / vel;
      const nd = d + c; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; pf[v] = fi; push([nd, v]); } }
  }
  if (!isFinite(dist[t])) return null;
  const nodos = [], tramos = []; for (let v = t; v !== -1; v = prev[v]) { nodos.push(v); if (prev[v] !== -1) tramos.push([prev[v], v, pf[v]]); }
  nodos.reverse(); tramos.reverse();
  let km_ = 0, horas = 0, pav = 0, princ = 0; const por = new Map();   // por clase de vía: [km, horas]
  for (const [a, b, fi] of tramos) { const p = roadFeatures[fi].properties, L = km(XY[a], XY[b]); const hh = L / velocidad(p, modo); km_ += L; horas += hh; if (pavimento(p)) pav += L; if (/Carretera/i.test(p.tipo_via || '')) princ += L; const q = por.get(p.tipo_via) || [0, 0]; q[0] += L; q[1] += hh; por.set(p.tipo_via, q); }
  return { nodos, tramos, km: km_, horas, pav, princ, por, firma: nodos.length + ':' + nodos[Math.floor(nodos.length / 2)] };
}

/* ---------- interfaz: se integra al panel «Ruta por distancia» existente ---------- */
const panel = document.querySelector('.route-panel'), btn = document.getElementById('calculate-route'), res = document.getElementById('route-result'), grupo = document.getElementById('route');
if (!panel || !btn || !res || !grupo) return;
const h2 = panel.querySelector('h2'); if (h2) h2.textContent = 'Ruta y tiempo estimado';
const css = document.createElement('style');
css.textContent = `.rt-modo{display:flex;gap:6px;margin:6px 0}.rt-modo button{flex:1;padding:6px 4px;border:1px solid #cfd6e6;border-radius:6px;background:#f4f6fb;color:#0b1f6b;font-weight:700;font-size:11px;cursor:pointer}
.rt-modo button.on{background:#0b1f6b;color:#fff;border-color:#0b1f6b}
.rt-veh{margin:0 0 6px;border:1px solid #e1e4ee;border-radius:9px;background:#fff;overflow:hidden}
.rt-veh[hidden]{display:none}
.rt-lista{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:6px;background:#f4f6fb}
.rt-lista button{padding:5px 3px;border:1px solid #cfd6e6;border-radius:6px;background:#fff;color:#0b1f6b;font:800 9.5px var(--tipo-titulo,system-ui);letter-spacing:.03em;cursor:pointer;line-height:1.15}
.rt-lista button small{display:block;font:600 8.5px var(--tipo-texto,system-ui);color:#6b7187;letter-spacing:0;text-transform:none}
.rt-lista button.on{background:#0b1f6b;color:#fff;border-color:#0b1f6b}.rt-lista button.on small{color:#cfd8f5}
.rt-3d{position:relative;height:135px}
.rt-nm{text-align:center;padding:0 8px 6px}
.rt-nm b{display:block;font:900 15px var(--tipo-titulo,system-ui);letter-spacing:.14em;color:#0b1f6b}
.rt-nm small{display:block;font:600 10px var(--tipo-texto,system-ui);color:#5A6B80;text-transform:none!important}
.rt-vel{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #eef0f5;text-align:center}
.rt-vel div{padding:4px 2px}.rt-vel b{display:block;font-size:12.5px;color:#0b1f6b}.rt-vel span{font-size:8.5px;letter-spacing:.06em;color:#6b7187}
.rt-op{margin-top:6px;border:1px solid #e1e4ee;border-left:6px solid var(--c);border-radius:8px;overflow:hidden;font-size:11.5px;background:#fff;cursor:pointer}
.rt-op.on{box-shadow:0 0 0 2px var(--c)}
.rt-ojo{border:0;border-radius:50%;width:24px;height:24px;flex:none;background:#fff;color:#0b1f6b;font-size:12px;cursor:pointer;line-height:1}.rt-ojo.off{background:#ffffff40;color:#fff}
.rt-op .cb{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#0b1f6b;color:#fff}
.rt-op .cb b{font-size:11.5px;letter-spacing:.04em}.rt-op .cb em{margin-left:auto;font-style:normal;font-size:9.5px;font-weight:800;padding:2px 7px;border-radius:9px;background:var(--c);color:#fff}
.rt-op .kp{display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center}.rt-op .kp div{padding:5px 2px;border-right:1px solid #eef0f5}.rt-op .kp div:last-child{border:0}
.rt-op .kp b{display:block;font-size:14px;color:#0b1f6b}.rt-op .kp span{font-size:9px;letter-spacing:.05em;color:#6b7187}
.rt-op .rt-kp4{grid-template-columns:1fr 1fr}.rt-op .rt-kp4 div{border-bottom:1px solid #eef0f5}.rt-op .rt-kp4 div:nth-child(2n){border-right:0}.rt-op .rt-kp4 div:nth-child(n+3){border-bottom:0}.rt-op .rt-kp4 .vh b{font-size:12.5px}.rt-op .rt-kp4 .vh span{text-transform:none}
.rt-op p{margin:0;padding:4px 8px 6px;font-size:10px;color:#3a4658;border-top:1px solid #eef0f5}
.rt-op table{width:100%;border-collapse:collapse}.rt-op td:not(:first-child){text-align:right;white-space:nowrap}.rt-op td{padding:2px 6px;border-top:1px solid #f1f3f7;font-size:10.5px}.rt-op td:last-child{text-align:right;white-space:nowrap}
.rt-nota{margin:6px 0 0;font-size:10px;color:#6b7187;line-height:1.35}`;
document.head.append(css);
let modo = 'vehiculo';
const sel = document.createElement('div'); sel.className = 'rt-modo';
sel.innerHTML = '<button type="button" data-m="vehiculo" class="on">🚙 Vehículo</button><button type="button" data-m="pie">🚶 A pie</button>';
const veh = document.createElement('div'); veh.className = 'rt-veh';
veh.innerHTML = `<div class="rt-lista">${VEH.map(v => `<button type="button" data-v="${v.id}">${v.n}<small>${v.n === 'AMBULANCIA' || v.n === 'TOPO BUS' ? v.real.replace(/ \(.*\)$/, '') : v.uso}</small></button>`).join('')}</div>
<div class="rt-3d"></div><div class="rt-nm"><b></b><small></small></div><div class="rt-vel"></div>`;
const caja3d = veh.querySelector('.rt-3d'); let visor = null;
function elegirVeh(v) {
  VA = v; try { localStorage.setItem('emte-rt-veh', v.id); } catch (e) {}
  veh.querySelectorAll('.rt-lista button').forEach(b => b.classList.toggle('on', b.dataset.v === v.id));
  veh.querySelector('.rt-nm b').textContent = v.n; veh.querySelector('.rt-nm small').textContent = v.real + ' · ' + v.uso;
  veh.querySelector('.rt-vel').innerHTML = `<div><b>${v.max} km/h</b><span>VEL. MÁXIMA</span></div><div><b>${v.med} km/h</b><span>VEL. MEDIA</span></div><div><b>${v.min} km/h</b><span>VEL. MÍNIMA</span></div>`;
  if (window.EMTE_VEH3D) { visor = visor || window.EMTE_VEH3D.visor(caja3d); visor.mostrar(v.id).catch(() => { veh.querySelector('.rt-nm small').textContent += ' (no se pudo cargar el 3D)'; }); }
  if (RES && modo === 'vehiculo') btn.onclick();   // recalcula con el vehículo nuevo
}
veh.querySelectorAll('.rt-lista button').forEach(b => b.onclick = () => elegirVeh(VEH.find(v => v.id === b.dataset.v)));
sel.querySelectorAll('button').forEach(b => b.onclick = () => { modo = b.dataset.m; sel.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); veh.hidden = modo !== 'vehiculo'; if (modo === 'vehiculo') elegirVeh(VA); else visor?.detener(); });
btn.before(sel, veh);
setTimeout(() => elegirVeh(VA), 0);
const small = [...panel.querySelectorAll('small')].find(x => !x.closest('.rt-veh, .rt-modo')); if (small) small.textContent = 'Vehículo: 3 opciones (más rápida, más corta y más segura); el tiempo se calcula según la vía que toma cada tramo. No considera tráfico, clima ni bloqueos.';
function puntosMarcados() {
  const out = {};
  grupo.querySelectorAll(':scope > g').forEach(g => {
    const t = g.querySelector('title')?.textContent || '', m = /translate\(([-\d.e]+)[ ,]+([-\d.e]+)\)/.exec(g.getAttribute('transform') || ''); if (!m) return;
    const x = +m[1], y = +m[2], lon = ((x - 500) / K - OX) / D2R, lat = (2 * Math.atan(Math.exp((380 - y) / K - OY)) - Math.PI / 2) / D2R;
    if (/Origen/i.test(t)) out.o = [lon, lat]; else if (/Destino/i.test(t)) out.d = [lon, lat];
  });
  return out;
}
const fmtT = hh => { const m = Math.round(hh * 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' min'; };
const fmtK = k => k.toFixed(k < 10 ? 2 : 1).replace('.', ',') + ' km';
const aEsc = c => [500 + (c[0] * D2R + OX) * K, 380 - (Math.log(Math.tan(Math.PI / 4 + c[1] * D2R / 2)) + OY) * K];
const OPC = [
  { k: 'tiempo', t: 'MÁS RÁPIDA', c: '#1F51FF', d: 'Menor tiempo de viaje: aprovecha las carreteras donde el Noah puede ir más rápido.' },
  { k: 'distancia', t: 'MÁS CORTA', c: '#E67E22', d: 'Menor distancia por la red: menos kilómetros y combustible, aunque pueda ir por caminos más lentos.' },
  { k: 'seguridad', t: 'MÁS SEGURA', c: '#1E8B4C', d: 'Prefiere carreteras y pavimento; evita caminos vecinales, tierra, ripio y tramos en mal estado.' }
];
let RES = null, elegida = 0, VIS = [true, true, true];   // VIS: qué opciones se ven en el mapa
function dibujar() {
  grupo.querySelectorAll('path.rt').forEach(p => p.remove()); if (!RES) return;
  const { XY } = grafo(), { o, d, a, b, rutas } = RES;
  const linea = (coords, color, w, dash, op = 1) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('class', 'rt'); p.setAttribute('d', 'M' + coords.map(c => aEsc(c).join(',')).join('L')); p.setAttribute('fill', 'none'); p.setAttribute('stroke', color); p.setAttribute('stroke-width', w); p.setAttribute('stroke-opacity', op); p.setAttribute('stroke-linejoin', 'round'); p.setAttribute('stroke-linecap', 'round'); p.setAttribute('vector-effect', 'non-scaling-stroke'); if (dash) p.setAttribute('stroke-dasharray', dash); grupo.prepend(p); };
  // primero las no elegidas (debajo), al final la elegida (encima)
  const orden = rutas.map((r, i) => i).filter(i => rutas[i] && VIS[i] && i !== elegida).concat(rutas[elegida] && VIS[elegida] ? [elegida] : []);
  orden.slice().reverse().forEach(i => { const r = rutas[i], cs = r.nodos.map(n => XY[n]), on = i === elegida; linea(cs, OPC[i].c, on ? 5 : 3.5, on ? null : '8 5', on ? 1 : .75); if (on) linea(cs, '#fff', 9); });
  linea([o, XY[a]], '#1F51FF', 3, '4 4'); linea([XY[b], d], '#1F51FF', 3, '4 4');
}
// datos de cada opción: solo longitud, tiempo aproximado, velocidad media y vehículo empleado
const datos = (km, hh, vn, vr) => `<div class="kp rt-kp4"><div><b>${fmtK(km)}</b><span>DISTANCIA</span></div><div><b>≈ ${fmtT(hh)}</b><span>TIEMPO APROXIMADO</span></div><div><b>${hh ? Math.round(km / hh) : 0} km/h</b><span>VELOCIDAD MEDIA</span></div><div class="vh"><b>${vn}</b><span>${vr && vr.toUpperCase() !== String(vn).toUpperCase() ? 'VEHÍCULO: ' + vr.toUpperCase() : 'VEHÍCULO EMPLEADO'}</span></div></div>`;
function tarjetas() {
  const { rutas, acceso, o, d } = RES, tAcc = acceso / A_PIE; res.replaceChildren();
  const validas = rutas.filter(Boolean), minT = Math.min(...validas.map(r => r.horas)), minK = Math.min(...validas.map(r => r.km));
  rutas.forEach((r, i) => {
    if (!r) return; const O = OPC[i], igual = rutas.slice(0, i).findIndex(x => x && x.firma === r.firma);
    const card = document.createElement('div'); card.className = 'rt-op' + (i === elegida ? ' on' : ''); card.style.setProperty('--c', O.c);
    const tTot = r.horas + tAcc;
    card.innerHTML = `<div class="cb"><button type="button" class="rt-ojo${VIS[i] ? '' : ' off'}" title="${VIS[i] ? 'Apagar' : 'Encender'} esta opción en el mapa">${VIS[i] ? '👁' : '⊘'}</button><b>${i + 1} · ${O.t}</b><em>${igual >= 0 ? 'IGUAL A LA ' + OPC[igual].t : r.horas <= minT + 1e-9 ? 'MENOR TIEMPO' : r.km <= minK + 1e-9 ? 'MENOR DISTANCIA' : (r.horas - minT) * 60 < 1 ? 'CASI EL MISMO TIEMPO' : '+' + fmtT(r.horas - minT)}</em></div>
${datos(r.km + acceso, tTot, VA.n, VA.real)}`;
    card.querySelector('.rt-ojo').onclick = e => { e.stopPropagation(); VIS[i] = !VIS[i]; tarjetas(); dibujar(); };
    if (!VIS[i]) card.style.opacity = .55;
    card.onclick = () => { if (elegida === i && VIS[i]) return; elegida = i; VIS[i] = true; tarjetas(); dibujar(); };
    res.append(card);
  });
  const n = document.createElement('p'); n.className = 'rt-nota';
  n.textContent = 'Toca una opción para resaltarla en el mapa; con 👁 / ⊘ la enciendes o la apagas. Tiempo calculado según la vía que toma, sin tráfico, clima ni bloqueos.';
  res.append(n);
  if (window.EMTE_EXPORTAR) { const { XY } = grafo(), r = rutas[elegida], cs = [o, ...r.nodos.map(i => XY[i]), d], caja = document.createElement('div'); caja.style.cssText = 'display:flex;gap:6px;margin-top:6px';
    const bt = window.EMTE_EXPORTAR.botonGPS(`⤓ Exportar opción ${elegida + 1} a GPS (GPX / KML)`, () => ({ titulo: 'Ruta ' + OPC[elegida].t.toLowerCase() + ' ' + fmtK(r.km), puntos: [{ nombre: 'Origen', lat: o[1], lon: o[0] }, { nombre: 'Destino', lat: d[1], lon: d[0] }], lineas: [{ nombre: OPC[elegida].t + ' · ' + fmtK(r.km) + ' · ' + fmtT(r.horas), desc: 'Geovisor Omasuyos · ' + VA.n + ' (' + VA.real + ') · tiempo según la vía', coords: cs, grupo: 'Ruta' }] }));
    bt.style.cssText = 'flex:1;padding:7px;border:1px solid #0b1f6b;border-radius:6px;background:#fff;color:#0b1f6b;font-weight:700;font-size:11px;cursor:pointer'; caja.append(bt); res.append(caja); }
}
btn.onclick = () => {
  if (typeof roadFeatures === 'undefined' || !roadFeatures.length) { res.textContent = 'Las vías aún se están cargando.'; return; }
  const { o, d } = puntosMarcados(); if (!o || !d) { res.textContent = 'Marca el origen y el destino en el mapa.'; return; }
  res.textContent = 'Calculando…';
  setTimeout(() => {
    const a = cercano(o, modo), b = cercano(d, modo);
    if (!a || !b) { res.textContent = 'No hay una vía ' + (modo === 'pie' ? '' : 'vehicular ') + 'a menos de 3 km de uno de los puntos.'; return; }
    const rutas = modo === 'pie' ? [dijkstra(a[0], b[0], 'pie', 'tiempo')] : OPC.map(O => dijkstra(a[0], b[0], modo, O.k));
    if (!rutas[0]) { RES = null; dibujar(); res.textContent = 'No se encontró una ruta conectada por la red' + (modo === 'pie' ? '.' : ' vehicular. Prueba el modo A PIE.'); return; }
    RES = { o, d, a: a[0], b: b[0], rutas, acceso: a[1] + b[1] }; elegida = 0; VIS = [true, true, true];
    if (modo === 'pie') { const r = rutas[0], tAcc = RES.acceso / A_PIE;
      res.innerHTML = `<div class="rt-op on" style="--c:#1F51FF"><div class="cb"><b>A PIE</b></div>${datos(r.km + RES.acceso, r.horas + tAcc, 'A PIE', 'Marcha a pie, sin vehículo')}</div>`; }
    else tarjetas();
    dibujar();
  }, 20);
};
});
