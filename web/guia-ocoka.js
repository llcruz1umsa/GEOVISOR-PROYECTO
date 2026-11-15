/* Planeamiento didáctico (agregado por BYNS7, 02-11-2026).
   7. GUÍA OCOKA: los aspectos militares del terreno en orden (Observación · Cubierta y encubrimiento · Obstáculos ·
      Terreno clave · Avenidas de aproximación) y la Línea de tiempo. Cada paso abre su herramienta y se marca ✔
      cuando está hecho; al final, «Resumen del análisis» reúne los resultados (y se puede pasar a la carta temática).
   8. AYUDA BAJO PEDIDO: ⓘ en cada cuadro de Planeamiento; solo si se toca, explica en dos líneas qué es y cómo se usa.
   9. EJERCICIOS: guardar todo el trabajo con un nombre (capas, calco, avenidas, línea de tiempo, vista del mapa…),
      volver a abrirlo y pasarlo a otra computadora como archivo. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main > aside'); if (!aside) return;
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const esc = s => String(s ?? '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const lsj = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const lss = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const dec = (n, d = 1) => (+n).toFixed(d).replace('.', ',');
const espera = ms => new Promise(r => setTimeout(r, ms));

const css = h('style');
css.textContent = `
.og-guia{grid-column:1/-1;padding:11px 11px 10px;border-radius:14px;background:linear-gradient(150deg,#0B1D33 0%,#1C3A66 70%,#2B4F80 100%);color:#fff;box-shadow:0 8px 22px #0B1D3340;position:relative;overflow:hidden}
.og-cont{padding:8px 10px 12px}
.og-guia::after{content:'';position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,#B79A5B55,transparent 70%)}
.og-cab{display:flex;align-items:center;gap:8px;margin:0 0 8px}
.og-cab b{font:800 11px var(--tipo-titulo,system-ui);letter-spacing:.12em;color:#E2CB8E}
.og-cab small{margin-left:auto;font:800 10px var(--tipo-titulo,system-ui);color:#fff;background:#ffffff1f;border-radius:10px;padding:2px 8px}
.og-prog{height:5px;border-radius:3px;background:#ffffff22;margin:0 0 9px;overflow:hidden}.og-prog span{display:block;height:100%;background:linear-gradient(90deg,#B79A5B,#E2CB8E);transition:width .4s}
.og-pasos{display:grid;gap:5px;position:relative;z-index:1}
.og-paso{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:9px;padding:6px 8px;border-radius:10px;background:#ffffff12;cursor:pointer;transition:background .15s,transform .15s}
.og-paso:hover{background:#ffffff26;transform:translateX(2px)}
.og-paso .n{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:#ffffff26;font:800 11px var(--tipo-titulo,system-ui);color:#E2CB8E;border:1.5px solid #E2CB8E88}
.og-paso.hecho .n{background:#1E8B4C;border-color:#7DDBA0;color:#fff}
.og-paso .t{font:700 11px/1.2 var(--tipo-titulo,system-ui);letter-spacing:.03em}.og-paso .t small{display:block;font:600 9.5px var(--tipo-texto,system-ui);letter-spacing:0;color:#C9D4E5;text-transform:none}
.og-paso .ok{width:22px;height:22px;border-radius:6px;border:1.5px solid #ffffff55;display:grid;place-items:center;font-size:12px;color:#7DDBA0;background:transparent}
.og-paso.hecho .ok{background:#1E8B4C33;border-color:#7DDBA0}
.og-acc{display:grid;grid-template-columns:1fr auto;gap:6px;margin-top:9px;position:relative;z-index:1}
.og-acc button{padding:8px 10px;border:0;border-radius:9px;background:linear-gradient(135deg,#B79A5B,#8A6D2F);color:#fff;font:800 10.5px var(--tipo-titulo,system-ui);letter-spacing:.06em;cursor:pointer}
.og-acc button.sec{background:#ffffff1f}
.pp-cel .og-i{position:absolute;right:7px;bottom:7px;width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#EEF2F8;color:#12294A;font:800 11px Georgia,serif;font-style:italic;opacity:.8}
.pp-cel .og-i:hover{background:#B79A5B;color:#fff;opacity:1}
.og-pop{position:fixed;z-index:80;width:250px;padding:11px 12px;border-radius:12px;background:#0B1D33;color:#fff;font:12px/1.4 var(--tipo-texto,system-ui);box-shadow:0 12px 30px #0008;border:1px solid #B79A5B;animation:og-in .15s ease}
.og-pop b{display:block;margin:0 0 4px;color:#E2CB8E;font:800 10.5px var(--tipo-titulo,system-ui);letter-spacing:.08em}
.og-pop .uso{display:block;margin-top:6px;padding-top:6px;border-top:1px solid #ffffff22;color:#C9D4E5;font-size:11px}
@keyframes og-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.og-pop,.og-pop *,.og-dlg .cu,.og-dlg .cu *,.og-dlg .acc .msg,.ej-it small,.ej-vacio{text-transform:none!important}
.og-fondo{position:fixed;inset:0;z-index:72;display:grid;place-items:center;background:#0B1D33b3}
.og-dlg{width:min(720px,94vw);max-height:90vh;display:flex;flex-direction:column;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 24px 70px #000a;font:12.5px var(--tipo-texto,system-ui);color:#14233A}
.og-dlg .cab{display:flex;align-items:center;padding:12px 16px;background:linear-gradient(135deg,#0B1D33,#1C3A66);color:#fff;border-bottom:3px solid #B79A5B;font:800 13px var(--tipo-titulo,system-ui);letter-spacing:.1em}
.og-dlg .cab button{margin-left:auto;border:0;background:#ffffff22;width:30px;height:30px;border-radius:50%;color:#fff;font-size:18px;cursor:pointer}
.og-dlg .cu{overflow:auto;padding:14px 16px;display:grid;gap:10px}
.og-r{display:grid;grid-template-columns:34px 1fr;gap:10px;padding:10px 12px;border-radius:10px;background:#F8FAFC;border-left:4px solid var(--c,#B79A5B)}
.og-r .n{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--c,#B79A5B);color:#fff;font:800 13px var(--tipo-titulo,system-ui)}
.og-r b{display:block;margin:0 0 3px;font:800 11px var(--tipo-titulo,system-ui);letter-spacing:.08em;color:#0B1D33}
.og-r ul{margin:2px 0 0;padding-left:17px}.og-r .pend{color:#9B1C1C;font-style:italic}
.og-dlg .acc{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;border-top:1px solid #E3E8EF;background:#F8FAFC}
.og-dlg .acc button{padding:9px 14px;border:1px solid #12294A;border-radius:8px;background:#fff;color:#12294A;font:800 11px var(--tipo-titulo,system-ui);letter-spacing:.05em;cursor:pointer}
.og-dlg .acc .pri{background:#12294A;color:#fff}
.og-dlg .acc .msg{flex:1;align-self:center;color:#1E5B3A;font-size:11.5px}
.ej-c{display:grid;gap:8px;padding:8px 10px 12px}
.ej-nuevo{display:grid;grid-template-columns:1fr auto;gap:6px}
.ej-nuevo input{padding:7px 9px;border:1px solid #CDD6E2;border-radius:7px;font:12px var(--tipo-texto,system-ui);text-transform:none}
.ej-b{padding:8px 11px;border:0;border-radius:8px;background:linear-gradient(135deg,#12294A,#0B1D33);color:#fff;font:800 10.5px var(--tipo-titulo,system-ui);letter-spacing:.05em;cursor:pointer}
.ej-b.oro{background:linear-gradient(135deg,#B79A5B,#8A6D2F)}.ej-b.cla{background:#fff;color:#12294A;border:1px solid #D7DEE8}
.ej-it{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;padding:9px 10px;border:1px solid #E3E8EF;border-left:5px solid #B79A5B;border-radius:10px;background:#fff}
.ej-it .ic{grid-row:span 2;display:grid;place-items:center;width:34px;height:34px;border-radius:9px;background:#EEF2F8;font-size:17px}
.ej-it b{font-size:12px;color:#0B1D33}.ej-it small{color:#5A6B80;font-size:10.5px}
.ej-it .bt{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}
.ej-it .bt button{padding:5px 9px;border:1px solid #D7DEE8;border-radius:7px;background:#fff;font:800 9.5px var(--tipo-titulo,system-ui);letter-spacing:.05em;color:#12294A;cursor:pointer}
.ej-it .bt button.pri{background:#12294A;color:#fff;border-color:#12294A}.ej-it .bt button.x{color:#9B1C1C;border-color:#E8B7B7}
.ej-vacio{padding:10px;border:1px dashed #CDD6E2;border-radius:9px;color:#5A6B80;font-size:11.5px;text-align:center}
.ej-ok{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:90;padding:9px 18px;border-radius:20px;background:#1E8B4C;color:#fff;font:800 12px var(--tipo-titulo,system-ui);box-shadow:0 8px 24px #0005}`;
document.head.append(css);

/* ---------- utilidades para abrir herramientas ---------- */
function abrirCuadro(re) {
  window.EMTE_PESTANA?.('plan');
  setTimeout(() => { const c = [...document.querySelectorAll('.pp-grilla .pp-cel')].find(x => re.test(x.querySelector('b')?.textContent || '')); c && c.click(); }, 120);
}
function abrirHerramienta(re) {
  window.EMTE_PESTANA?.('herr');
  setTimeout(() => { const c = [...document.querySelectorAll('.visual-card')].find(x => re.test(x.textContent)); if (c && !c.classList.contains('chosen')) c.click(); }, 150);
}

/* ---------- 7. guía OCOKA ---------- */
const AA = () => lsj('emte-hp-aa', null), TL = () => lsj('emte-hp-tl', null);
const filasAV = () => [...document.querySelectorAll('.av-panel .av-filas tr')];
const PASOS = [
  { k: 'o', l: 'O', t: 'Observación y campos de tiro', s: 'Área visible desde tus puestos', c: '#1F5AA6', ir: () => abrirHerramienta(/Área visible/i), hecho: () => filasAV().length > 0 },
  { k: 'c', l: 'C', t: 'Cubierta y encubrimiento', s: 'Protección contra la vista y el fuego', c: '#2E7D52', ir: () => abrirCuadro(/^Cubierta/i), hecho: () => !!window.EMTE_HP_CUB_ON?.() },
  { k: 'ob', l: 'O', t: 'Obstáculos', s: 'Pendientes MDT y COC', c: '#C0392B', ir: () => abrirCuadro(/^Pendientes/i), hecho: () => !!document.getElementById('pc-ver')?.checked || !!window.EMTE_ANALISIS?.estado?.().coc },
  { k: 'k', l: 'K', t: 'Terreno clave', s: 'Lo que da ventaja a quien lo ocupa', c: '#6A3D9A', ir: () => abrirCuadro(/^An[aá]lisis del terreno/i), hecho: () => !!window.EMTE_ANALISIS?.estado?.().tc },
  { k: 'a', l: 'A', t: 'Avenidas de aproximación', s: '3 rutas evaluadas', c: '#0033cc', ir: () => abrirCuadro(/^Avenidas/i), hecho: () => !!AA()?.rutas?.length },
  { k: 't', l: '⏱', t: 'Línea de tiempo', s: 'Regla 1/3 – 2/3', c: '#8A6D2F', ir: () => abrirCuadro(/^L[ií]nea de tiempo/i), hecho: () => !!TL()?.filas?.length }
];
let manual = lsj('emte-ocoka-manual', {});
const hecho = p => { try { return !!manual[p.k] || p.hecho(); } catch (e) { return !!manual[p.k]; } };
function bloqueGuia() {
  const b = h('div', 'og-guia');
  const n = PASOS.filter(hecho).length;
  b.innerHTML = `<div class="og-cab"><b>🧭 GUÍA DEL TERRENO · OCOKA</b><small>${n} / ${PASOS.length}</small></div><div class="og-prog"><span style="width:${n / PASOS.length * 100}%"></span></div>`;
  const l = h('div', 'og-pasos');
  PASOS.forEach((p, i) => {
    const d = h('div', 'og-paso' + (hecho(p) ? ' hecho' : '')), nn = h('span', 'n', hecho(p) ? '✔' : String(i + 1)), t = h('span', 't'), ok = h('button', 'ok', hecho(p) ? '✔' : '');
    t.append(document.createTextNode(p.t.toUpperCase()), h('small', null, p.s)); ok.type = 'button'; ok.title = 'Marcar o desmarcar como hecho';
    ok.onclick = e => { e.stopPropagation(); manual[p.k] = !manual[p.k]; lss('emte-ocoka-manual', manual); refrescar(); };
    d.append(nn, t, ok); d.onclick = () => p.ir(); d.title = 'Abrir: ' + p.t; l.append(d);
  });
  const acc = h('div', 'og-acc'), r = h('button', null, '📋 RESUMEN DEL ANÁLISIS'), z = h('button', 'sec', '↺'); r.type = z.type = 'button';
  r.onclick = resumen; z.title = 'Reiniciar las marcas manuales'; z.onclick = () => { manual = {}; lss('emte-ocoka-manual', manual); refrescar(); };
  acc.append(r, z); b.append(l, acc); return b;
}
// 04-11-2026: la guía es un cuadro más de Planeamiento («Guía del terreno · OCOKA»), ya no un bloque fijo arriba de los cuadros
let SEC_OG = null;
function seccionGuia() {
  if (SEC_OG && SEC_OG.isConnected) return SEC_OG;
  SEC_OG = h('details', 'layer-menu hp-menu og-menu'); SEC_OG.innerHTML = '<summary>Guía del terreno · OCOKA paso a paso</summary>'; SEC_OG.append(h('div', 'og-cont'));
  const ref = aside.querySelector(':scope > .pc-menu, :scope > .ap-menu, :scope > .coc-menu, :scope > .hp-menu'); ref ? ref.before(SEC_OG) : aside.append(SEC_OG);
  for (const t of ['pointerdown', 'click', 'wheel']) SEC_OG.addEventListener(t, e => e.stopPropagation());
  return SEC_OG;
}
seccionGuia();   // el cuadro existe desde el inicio, así aparece en la grilla de Planeamiento
function refrescar() {
  const cont = seccionGuia().querySelector('.og-cont'); cont.replaceChildren(bloqueGuia());
  const g = document.querySelector('.pp-grilla'); if (g) { g.querySelector(':scope > .og-guia')?.remove(); if (!g.hidden) ayuda(g); }
}
async function resumen() {
  const fondo = h('div', 'og-fondo'), d = h('div', 'og-dlg');
  d.innerHTML = '<div class="cab">📋 RESUMEN DEL ANÁLISIS DEL TERRENO<button type="button" aria-label="Cerrar">×</button></div>';
  const cu = h('div', 'cu'), acc = h('div', 'acc'); d.append(cu, acc); fondo.append(d); document.body.append(fondo);
  const cerrar = () => fondo.remove(); d.querySelector('.cab button').onclick = cerrar; fondo.addEventListener('click', e => { if (e.target === fondo) cerrar(); });
  const T = [], bloque = (p, items) => { const r = h('div', 'og-r'); r.style.setProperty('--c', p.c); r.append(h('span', 'n', p.l)); const c = h('div'); c.append(h('b', null, p.t.toUpperCase()));
    if (!items.length) c.append(h('div', 'pend', 'Pendiente: todavía no se analizó. Toca el paso en la guía para hacerlo.')); else { const u = h('ul'); items.forEach(x => u.append(h('li', null, x))); c.append(u); }
    r.append(c); cu.append(r); T.push(p.t.toUpperCase() + ': ' + (items.length ? items.join('; ') : 'pendiente')); };
  // O
  const av = filasAV().map(tr => { const td = tr.querySelectorAll('td'); return td.length > 4 ? `Punto ${td[0].textContent.trim()}: ${td[4].textContent.trim()}` : null; }).filter(Boolean);
  bloque(PASOS[0], av);
  // C
  let cub = []; if (window.EMTE_HP_CUB_ON?.()) { try { const m = await fetch('data/cubierta_omasuyos.json').then(r => r.json()); cub = Object.values(m.clases || {}).map(c => `${c.nombre}: ${dec(c.km2)} km² (encubrimiento ${String(c.encubrimiento).toLowerCase()}, cubierta ${String(c.cubierta).toLowerCase()})`); } catch (e) {} }
  bloque(PASOS[1], cub);
  // O (obstáculos)
  const ob = []; if (document.getElementById('pc-ver')?.checked) document.querySelectorAll('.pc-menu table tr').forEach(tr => { const n = tr.querySelector('td.n b')?.textContent, p = tr.querySelector('td.p')?.textContent.trim(); if (n && p) ob.push(`${n}: ${p} del área`); });
  const A = window.EMTE_ANALISIS?.estado?.(); if (A?.coc) ob.push('COC calculado para fuerza ' + (A.coc === 'mec' ? 'mecanizada' : A.coc === 'inf' ? 'de infantería' : A.coc));
  bloque(PASOS[2], ob);
  // K
  let tk = []; if (A?.tc) { try { const g = await fetch('data/terreno_clave_omasuyos.geojson').then(r => r.json()); const fs = g.features || []; tk = [`${fs.length} elementos de terreno clave`, ...fs.slice().sort((a, b) => (b.properties.dom || 0) - (a.properties.dom || 0)).slice(0, 5).map(f => f.properties.nombre)]; } catch (e) {} }
  bloque(PASOS[3], tk);
  // A
  const aa = AA(); bloque(PASOS[4], aa?.rutas?.length ? aa.rutas.map((R, i) => `AA-${i + 1} ${R.rol}${R.tipo ? (R.tipo === 'verde' ? ' (solo sin restricción)' : ' (admite restringido)') : ''}: ${R.cat}, ${R.puntaje} pts, ${dec(R.km)} km, ${R.horas >= 1 ? dec(R.horas) + ' h' : Math.round(R.horas * 60) + ' min'}`) : []);
  // T
  const tl = TL(); bloque(PASOS[5], tl?.filas?.length ? [`Recepción ${String(tl.rec || '').replace('T', ' ')} · Hora H ${String(tl.H || '').replace('T', ' ')}`, ...tl.filas.slice(-1).map(f => `${f.t}: ${dec(f.h)} h`)] : []);
  const msg = h('span', 'msg');
  const b1 = h('button', 'pri', '📄 PASAR A LA CARTA TEMÁTICA'); b1.type = 'button';
  b1.onclick = () => { const c = lsj('emte-carta', {}); c.notas = ('Análisis OCOKA — ' + T.map(x => x.replace(/: pendiente$/, ': –')).join(' · ')).slice(0, 220); lss('emte-carta', c); msg.textContent = '✔ Se agregó a las notas de la carta temática (Herramientas › Guardar › Carta).'; };
  const b2 = h('button', null, '⧉ COPIAR'); b2.type = 'button'; b2.onclick = () => { navigator.clipboard?.writeText(T.join('\n')).then(() => msg.textContent = '✔ Copiado.').catch(() => msg.textContent = 'No se pudo copiar.'); };
  acc.append(msg, b2, b1);
}

/* ---------- 8. ayuda bajo pedido ---------- */
const AYUDA = [
  [/^Gu[ií]a del terreno/i, 'Los aspectos militares del terreno en orden (OCOKA): observación, cubierta, obstáculos, terreno clave y avenidas, más la línea de tiempo.', 'Toca cada paso para abrir su herramienta; al final pulsa RESUMEN DEL ANÁLISIS.'],
  [/^Pendientes/i, 'Clasifica el terreno según su pendiente: verde sin restricción, amarillo restringido, rojo severamente restringido.', 'Enciéndela con 👁; ajusta los límites (30 % y 60 %) dentro del cuadro.'],
  [/^Apoyo al planeamiento/i, 'Capas de apoyo: comunidades, posibles zonas de aterrizaje y fuentes de agua.', 'Entra y enciende solo las que necesites para tu misión.'],
  [/^Curvas de nivel/i, 'Curvas de nivel de las cartas IGM 1:50.000: intermedias cada 20 m y maestras cada 100 m.', 'Acerca el mapa para ver las cotas de las maestras.'],
  [/^An[aá]lisis del terreno/i, 'COC (obstáculos combinados) y TC (terreno clave) de toda la provincia.', 'Elige la fuerza (mecanizada o infantería) y enciende el terreno clave.'],
  [/^Cubierta/i, 'Cubierta (protección contra el fuego) y encubrimiento (protección contra la vista), desde la imagen satelital 2026.', 'Enciéndela y compárala con las avenidas.'],
  [/^Avenidas/i, 'Calcula 3 avenidas entre la partida y el objetivo: 2 solo por terreno verde y 1 que admite terreno restringido.', 'Marca ① partida y ② objetivo, luego CALCULAR.'],
  [/^L[ií]nea de tiempo/i, 'Reparte el tiempo disponible: 1/3 para el comandante y 2/3 para las unidades subordinadas.', 'Pon la hora de recepción y la hora H.'],
  [/^Fichas/i, 'Catálogo de símbolos militares para el calco, con fichas de aprendizaje, armador y modo práctica.', 'Toca un símbolo y luego el mapa; ⓘ abre su ficha.'],
  [/^FFAA/i, 'Unidades y jurisdicciones de las Fuerzas Armadas (datos 2024), en organigrama, búsqueda y lista.', 'Toca una unidad para ir a ella y ver su ficha.'],
  [/^Ejercicios/i, 'Guarda todo tu trabajo con un nombre y vuelve a abrirlo cuando quieras, en esta u otra computadora.', 'Escribe el nombre y pulsa GUARDAR; EXPORTAR crea un archivo.'],
  [/^Servicios/i, 'Salud, educación y otros servicios de la provincia.', 'Tócalos en el mapa para ver su ficha.'],
  [/^Poblaci[oó]n/i, 'Viviendas y construcciones 2026 y comunidades.', 'Acerca el mapa para ver cada construcción.'],
  [/^Red vial/i, 'Carreteras, caminos y sendas por categoría.', 'Apaga las categorías que no necesites.'],
  [/^Hidrograf/i, 'Ríos, quebradas, lagos y lagunas.', 'Útil para identificar obstáculos y fuentes de agua.'],
  [/^L[ií]mites/i, 'Límites municipales y legales.', 'Toca un municipio para ver su ficha.']
];
let pop = null;
function cerrarPop() { pop && pop.remove(); pop = null; }
document.addEventListener('click', e => { if (pop && !e.target.closest('.og-pop, .og-i')) cerrarPop(); }, true);
function ayuda(g) {
  g.querySelectorAll(':scope > .pp-cel').forEach(c => {
    if (c.querySelector('.og-i')) return; const t = c.querySelector('b')?.textContent.trim() || '', a = AYUDA.find(([re]) => re.test(t)); if (!a) return;
    const i = h('span', 'og-i', 'i'); i.setAttribute('role', 'button'); i.title = '¿Qué es?';
    i.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); if (pop && pop.dataset.t === t) { cerrarPop(); return; } cerrarPop();
      pop = h('div', 'og-pop'); pop.dataset.t = t; pop.append(h('b', null, t.toUpperCase()), document.createTextNode(a[1]), h('span', 'uso', '👉 ' + a[2]));
      document.body.append(pop); const r = i.getBoundingClientRect(); pop.style.left = Math.min(innerWidth - 262, Math.max(8, r.left - 230)) + 'px'; pop.style.top = Math.min(innerHeight - pop.offsetHeight - 8, r.bottom + 6) + 'px'; });
    c.append(i);
  });
}

/* ---------- 9. ejercicios ---------- */
const CLAVES = k => (k.startsWith('emte-') && !/^emte-(ejercicios|ej-aplicar|simbologia)$/.test(k)) || k === 'planeamiento-calco-geovisor';
function estadoVivo() {
  const capas = [...document.querySelectorAll('#layers input[type=checkbox], #apoyo-capas input[type=checkbox]')].map(cb => { const l = cb.closest('label'); return l ? [(l.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), cb.checked] : null; }).filter(Boolean);
  const A = window.EMTE_ANALISIS?.estado?.() || {};
  return { capas, base: document.querySelector('#basemap-options input:checked')?.value, pend: !!document.getElementById('pc-ver')?.checked, curvas: !!document.querySelector('.cn-ver')?.checked, ffaa: !!document.querySelector('.fa-ver')?.checked, coc: A.coc || '', tc: !!A.tc, cub: !!window.EMTE_HP_CUB_ON?.(), vista: { scale, panX, panY } };
}
function capturar(nombre) {
  const ls = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (CLAVES(k)) ls[k] = localStorage.getItem(k); }
  const calco = (() => { try { return JSON.parse(ls['planeamiento-calco-geovisor'] || '[]').length; } catch (e) { return 0; } })();
  return { tipo: 'ejercicio-geovisor-emte', version: 1, nombre, fecha: new Date().toISOString(), resumen: { calco, avenidas: !!AA()?.rutas?.length, tiempo: !!TL()?.filas?.length }, ls, estado: estadoVivo() };
}
const LISTA = () => lsj('emte-ejercicios', []);
function aviso(t) { const a = h('div', 'ej-ok', t); document.body.append(a); setTimeout(() => a.remove(), 2600); }
function abrirEj(E) {
  if (!confirmarAbrir(E)) return;
  for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (CLAVES(k)) localStorage.removeItem(k); }
  for (const [k, v] of Object.entries(E.ls || {})) try { localStorage.setItem(k, v); } catch (e) {}
  lss('emte-ej-aplicar', { estado: E.estado, nombre: E.nombre });
  location.reload();
}
function confirmarAbrir(E) { return window.confirm ? true : true; }
async function aplicarPendiente() {
  const P = lsj('emte-ej-aplicar', null); if (!P) return; localStorage.removeItem('emte-ej-aplicar');
  await espera(3500); const S = P.estado || {};
  try { if (S.base) document.querySelector(`#basemap-options input[value="${S.base}"]`)?.click(); } catch (e) {}
  const cbs = [...document.querySelectorAll('#layers input[type=checkbox], #apoyo-capas input[type=checkbox]')].map(cb => [(cb.closest('label')?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), cb]);
  (S.capas || []).forEach(([t, v]) => { const c = cbs.find(x => x[0] === t); if (c && c[1].checked !== v) c[1].click(); });
  const poner = (sel, v) => { const c = document.querySelector(sel); if (c && c.checked !== !!v) c.click(); };
  poner('#pc-ver', S.pend); poner('.cn-ver', S.curvas); poner('.fa-ver', S.ffaa);
  try { if (S.coc) window.EMTE_ANALISIS?.coc(S.coc); if (S.tc) window.EMTE_ANALISIS?.tc(true); if (S.cub) window.EMTE_HP_CUB?.(true); } catch (e) {}
  if (S.vista && typeof zoom === 'function') { scale = S.vista.scale; panX = S.vista.panX; panY = S.vista.panY; zoom(1); }
  aviso('✔ Ejercicio «' + (P.nombre || '') + '» abierto');
}
aplicarPendiente();
function descargarEj(E) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(E)], { type: 'application/json' })); a.download = 'ejercicio_' + E.nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_') + '.json'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
const sec = h('details', 'layer-menu hp-menu ej-menu');
sec.innerHTML = '<summary>Ejercicios · guardar y abrir</summary><div class="ej-c"><div class="ej-nuevo"><input type="text" maxlength="60" placeholder="Nombre del ejercicio (ej.: Ejercicio Achacachi 03)"><button type="button" class="ej-b oro">💾 GUARDAR</button></div><div class="ej-lista"></div><div style="display:flex;gap:6px"><button type="button" class="ej-b cla ej-imp">📂 IMPORTAR ARCHIVO</button><input type="file" accept=".json,application/json" hidden></div></div>';
aside.append(sec);
const inN = sec.querySelector('.ej-nuevo input'), lista = sec.querySelector('.ej-lista'), file = sec.querySelector('input[type=file]');
function listar() {
  const L = LISTA(); lista.replaceChildren();
  if (!L.length) { lista.append(h('div', 'ej-vacio', 'Todavía no guardaste ejercicios.')); return; }
  L.forEach((E, i) => {
    const d = h('div', 'ej-it'), f = new Date(E.fecha), r = E.resumen || {};
    d.append(h('span', 'ic', '🗺'), h('b', null, E.nombre), h('small', null, `${f.toLocaleDateString('es-BO')} ${f.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })} · ${r.calco || 0} símbolos${r.avenidas ? ' · avenidas' : ''}${r.tiempo ? ' · línea de tiempo' : ''}`));
    const bt = h('div', 'bt'), b = (t, fn, c) => { const x = h('button', c || null, t); x.type = 'button'; x.onclick = fn; bt.append(x); };
    b('▶ ABRIR', () => { if (confirm('Abrir «' + E.nombre + '»: reemplaza lo que tienes ahora en el geovisor. ¿Continuar?')) abrirEj(E); }, 'pri');
    b('⟳ ACTUALIZAR', () => { const L2 = LISTA(); L2[i] = capturar(E.nombre); if (lss('emte-ejercicios', L2)) { listar(); aviso('✔ Ejercicio actualizado'); } });
    b('⬇ EXPORTAR', () => descargarEj(E));
    b('🗑 BORRAR', () => { if (!confirm('¿Borrar «' + E.nombre + '»?')) return; const L2 = LISTA(); L2.splice(i, 1); lss('emte-ejercicios', L2); listar(); }, 'x');
    d.append(bt); lista.append(d);
  });
}
sec.querySelector('.ej-nuevo button').onclick = () => {
  const n = inN.value.trim() || 'Ejercicio ' + new Date().toLocaleDateString('es-BO'); const L = LISTA().filter(E => E.nombre !== n);
  L.unshift(capturar(n)); if (!lss('emte-ejercicios', L)) { aviso('No hay espacio para guardar: exporta y borra ejercicios antiguos'); return; }
  inN.value = ''; listar(); aviso('✔ Ejercicio «' + n + '» guardado');
};
sec.querySelector('.ej-imp').onclick = () => file.click();
file.onchange = async () => { const f = file.files[0]; if (!f) return; try { const E = JSON.parse(await f.text()); if (E.tipo !== 'ejercicio-geovisor-emte') throw new Error(); const L = LISTA().filter(x => x.nombre !== E.nombre); L.unshift(E); lss('emte-ejercicios', L); listar(); aviso('✔ Ejercicio «' + E.nombre + '» importado'); } catch (e) { aviso('Ese archivo no es un ejercicio del geovisor'); } file.value = ''; };
listar();

/* ---------- enganche con la grilla de Planeamiento ---------- */
let n = 0;
(function esperar() {
  const g = document.querySelector('.pp-grilla'); if (!g) { if (++n < 80) setTimeout(esperar, 250); return; }
  let pend = false;
  new MutationObserver(() => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; if (!g.hidden && g.querySelector(':scope > .pp-cel:not(:has(.og-i))')) refrescar(); }); }).observe(g, { childList: true });
  new MutationObserver(() => refrescar()).observe(g, { attributes: true, attributeFilter: ['hidden'] });
  refrescar();
  document.addEventListener('change', () => setTimeout(refrescar, 300), true);
  setInterval(() => { if (!document.hidden) { const gg = document.querySelector('.og-menu .og-guia'); if (gg) { const nn = PASOS.filter(hecho).length; if (gg.querySelector('.og-cab small')?.textContent !== `${nn} / ${PASOS.length}`) refrescar(); } } }, 3000);
})();
window.EMTE_OCOKA = { resumen, capturar, abrirEj };
});
