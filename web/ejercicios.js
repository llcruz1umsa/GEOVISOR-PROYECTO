/* Ejercicios de planeamiento (BYNS7, 04-11-2026). Reemplaza el cuadro «Ejercicios» de guia-ocoka.js.
   · NUEVO: deja el geovisor en blanco para empezar otro ejercicio (con respaldo y «Deshacer»).
   · GUARDAR COMO / GUARDAR CAMBIOS: con datos del ejercicio (unidad, situación, fecha-hora, autor, nota) y miniatura.
     Con conexión se guarda en PostgreSQL (esquema planeamiento, compartido); sin conexión, en este navegador.
   · ABRIR: antes hace un RESPALDO AUTOMÁTICO de lo que hay en pantalla, y después ofrece «Deshacer apertura».
     Con PostgreSQL también reemplaza el calco compartido (antes solo se tomaba la copia del navegador).
   · VERSIONES: cada «Guardar cambios» conserva la versión anterior y se puede abrir cualquiera.
   · Datos (editar), Duplicar, Exportar (JSON o ZIP con calco GeoJSON, miniatura y resumen), Importar, Subir a PostgreSQL,
     buscador y orden. Las capas se reconocen por su nombre (sin los números que cambian) y se reponen cuando el mapa
     terminó de cargar, no tras una espera fija. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main > aside'); if (!aside) return;
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const esc = s => String(s ?? '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const lsj = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
const lss = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const espera = ms => new Promise(r => setTimeout(r, ms));
const nuevoId = () => 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const CALCO = 'planeamiento-calco-geovisor';
const K = { lista: 'emte-ej2-lista', resp: 'emte-ej2-respaldos', aplicar: 'emte-ej2-aplicar', actual: 'emte-ej2-actual', mig: 'emte-ej2-migrado' };
// lo que forma parte de un ejercicio: todo lo «emte-…» del geovisor menos los propios ejercicios y las preferencias de pantalla
const CLAVES = k => k.startsWith('emte-') && !/^emte-(ejercicios|ej2|ej-|arrastre|simbologia)/.test(k);
const SITU = ['', 'Ofensiva', 'Defensiva', 'Movimientos retrógrados', 'Seguridad', 'Reconocimiento', 'Otra'];
const MES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const dos = n => String(n).padStart(2, '0');
const dtgAhora = () => { const d = new Date(); return `${dos(d.getDate())}${dos(d.getHours())}${dos(d.getMinutes())}-${MES[d.getMonth()]}-${String(d.getFullYear()).slice(2)}`; };
const fecha = s => { if (!s) return ''; const d = new Date(s); return d.toLocaleDateString('es-BO') + ' ' + d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }); };
let USUARIO = ''; fetch('/api/sesion').then(r => r.ok ? r.json() : null).then(d => { if (d && d.usuario) USUARIO = d.usuario; }).catch(() => {});

/* ---------------- estilos ---------------- */
const css = h('style');
css.textContent = `
.ej2,.ej2 *,.ej2-ban,.ej2-ban *{text-transform:none!important;box-sizing:border-box}
.ej2 [hidden]{display:none!important}.ej2 ::placeholder{text-transform:none!important}
.ej2{display:grid;gap:9px;padding:8px 10px 12px;font:12px var(--tipo-texto,system-ui);color:#14233A}
.ej2-con{display:flex;align-items:center;gap:6px;font-size:10.5px;color:#5A6B80}.ej2-con i{width:8px;height:8px;border-radius:50%;background:#B7950B;flex:none}.ej2-con.si i{background:#1E8B4C}
.ej2-act{display:grid;grid-template-columns:1fr auto;gap:4px 8px;align-items:center;padding:9px 10px;border-radius:10px;background:linear-gradient(135deg,#0B1D33,#1C3A66);color:#fff}
.ej2-act small{grid-column:1/-1;color:#E2CB8E;font:800 9.5px var(--tipo-titulo,system-ui);letter-spacing:.12em}
.ej2-act b{font-size:12.5px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ej2-des{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #E7C76E;border-radius:10px;background:#FFF8E6;font-size:11px;color:#6B5212}
.ej2-des span{flex:1}
.ej2-top{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}
.ej2 button{padding:8px 9px;border:1px solid #D7DEE8;border-radius:8px;background:#fff;color:#12294A;font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.04em;cursor:pointer;line-height:1.15}
.ej2 button:hover{background:#EEF2F8}.ej2 button:disabled{opacity:.5;cursor:default}
.ej2 button.az{background:linear-gradient(135deg,#12294A,#0B1D33);color:#fff;border-color:#0B1D33}
.ej2 button.oro{background:linear-gradient(135deg,#B79A5B,#8A6D2F);color:#fff;border-color:#8A6D2F}
.ej2 button.x{color:#9B1C1C;border-color:#E8B7B7}
.ej2-form{display:grid;grid-template-columns:1fr 1fr;gap:7px;padding:10px;border:1px solid #D7DEE8;border-radius:10px;background:#F7F9FC}
.ej2-form[hidden]{display:none}
.ej2-form .t{grid-column:1/-1;font:800 10.5px var(--tipo-titulo,system-ui);letter-spacing:.1em;color:#0B1D33;border-bottom:2px solid #B79A5B;padding-bottom:3px}
.ej2-form label{display:flex;flex-direction:column;gap:3px;font-size:10.5px;font-weight:700;color:#3a4658}
.ej2-form label.w{grid-column:1/-1}
.ej2-form input,.ej2-form select,.ej2-form textarea,.ej2-bus input,.ej2-bus select{width:100%;padding:6px 8px;border:1px solid #CDD6E2;border-radius:7px;font:12px var(--tipo-texto,system-ui);color:#12294A;background:#fff}
.ej2-form textarea{min-height:52px;resize:vertical}
.ej2-form .dtg{display:flex;gap:4px}.ej2-form .dtg button{padding:4px 7px}
.ej2-form .pie{grid-column:1/-1;display:flex;gap:6px;align-items:center}.ej2-form .pie small{flex:1;color:#5A6B80;font-size:10px}
.ej2-bus{display:grid;grid-template-columns:1fr auto;gap:6px}
.ej2-it{display:grid;grid-template-columns:72px 1fr;gap:4px 10px;padding:9px;border:1px solid #E3E8EF;border-left:5px solid #B79A5B;border-radius:10px;background:#fff}
.ej2-it.abierto{border-left-color:#1E8B4C;box-shadow:0 0 0 2px #1E8B4C33}
.ej2-it .mi{grid-row:span 3;width:72px;height:52px;border-radius:7px;background:#EEF2F8 center/cover no-repeat;display:grid;place-items:center;font-size:20px;border:1px solid #DCE3EC}
.ej2-it .nm{display:flex;align-items:center;gap:6px;min-width:0}.ej2-it .nm b{font-size:12.5px;color:#0B1D33;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ej2-it .bd{flex:none;padding:1px 6px;border-radius:8px;background:#EEF2F8;color:#12294A;font:800 9px var(--tipo-titulo,system-ui)}
.ej2-it .bd.l{background:#FFF3D6;color:#7a5c12}
.ej2-it small{color:#5A6B80;font-size:10.5px;line-height:1.3}
.ej2-it .nt{grid-column:1/-1;font-size:11px;color:#3a4658;font-style:italic;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.ej2-it .bt{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:5px;margin-top:3px}.ej2-it .bt button{padding:5px 8px;font-size:9.5px}
.ej2-ver{grid-column:1/-1;display:grid;gap:4px;padding:7px;border-radius:8px;background:#F7F9FC;border:1px solid #E3E8EF}
.ej2-ver div{display:flex;align-items:center;gap:6px;font-size:10.5px}.ej2-ver div span{flex:1}.ej2-ver button{padding:3px 7px!important}
.ej2-vacio{padding:12px;border:1px dashed #CDD6E2;border-radius:9px;color:#5A6B80;font-size:11.5px;text-align:center}
.ej2-resp summary{cursor:pointer;font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.08em;color:#5A6B80;padding:4px 0}
.ej2-resp div{display:flex;align-items:center;gap:6px;padding:4px 0;border-top:1px solid #EEF1F5;font-size:10.5px}.ej2-resp div span{flex:1}.ej2-resp button{padding:3px 7px}
.ej2-ban{position:fixed;left:50%;top:78px;transform:translateX(-50%);z-index:95;display:flex;align-items:center;gap:12px;padding:10px 12px 10px 16px;border-radius:12px;background:#0B1D33;color:#fff;font:700 12px var(--tipo-texto,system-ui);box-shadow:0 12px 30px #0B1D3366;border:1px solid #B79A5B;max-width:calc(100vw - 32px)}
.ej2-ban button{padding:6px 11px;border-radius:7px;border:1px solid #E2CB8E;background:#B79A5B;color:#0B1D33;font:800 10.5px var(--tipo-titulo,system-ui);cursor:pointer}
.ej2-ban button.c{background:transparent;color:#fff;border-color:#ffffff55}
.ej2-ok{position:fixed;left:50%;top:84px;transform:translateX(-50%);z-index:96;padding:9px 18px;border-radius:20px;background:#1E8B4C;color:#fff;font:800 12px var(--tipo-titulo,system-ui);box-shadow:0 8px 20px #0003}
.ej2-ok.mal{background:#9B1C1C}`;
document.head.append(css);
function aviso(t, mal) { const a = h('div', 'ej2-ok' + (mal ? ' mal' : ''), t); document.body.append(a); setTimeout(() => a.remove(), mal ? 4500 : 2800); }

/* ---------------- servidor (PostgreSQL) o este navegador ---------------- */
let SERV = false;
const api = async (url, op = {}) => {
  const o = { cache: 'no-store', ...op }; if (op.json !== undefined) { o.method = o.method || 'PUT'; o.headers = { 'Content-Type': 'application/json' }; o.body = JSON.stringify(op.json); delete o.json; }
  const r = await fetch(url, o); let d = {}; try { d = await r.json(); } catch (e) {}
  if (!r.ok) { const e = new Error(d.error || 'Error ' + r.status); e.status = r.status; e.data = d; throw e; }
  return d;
};
const LOCAL = () => lsj(K.lista, []);
const guardarLocal = L => lss(K.lista, L);
// migración: los ejercicios del cuadro anterior pasan a la lista nueva
(function migrar() {
  if (localStorage.getItem(K.mig)) return;
  const viejos = lsj('emte-ejercicios', []); const L = LOCAL();
  viejos.forEach(E => { if (!E || !E.nombre || L.some(x => x.nombre === E.nombre)) return;
    L.push({ id: nuevoId(), nombre: E.nombre, unidad: '', situacion: '', dtg: '', autor: '', nota: '', miniatura: null, resumen: resumenDe({ ls: E.ls || {}, estado: E.estado || {} }), datos: { ls: E.ls || {}, estado: E.estado || {} }, version: 1, creado: E.fecha, actualizado: E.fecha, versiones: [], origen: 'local' }); });
  guardarLocal(L); localStorage.setItem(K.mig, '1');
})();

/* ---------------- capturar lo que hay en pantalla ---------------- */
const norm = t => (t || '').replace(/\s+/g, ' ').replace(/[\s\d.,—–\-]+$/, '').trim().slice(0, 60);
function casillas() {
  return [...document.querySelectorAll('#layers input[type=checkbox], #apoyo-capas input[type=checkbox]')].map(cb => {
    const l = cb.closest('label'); const txt = (l?.textContent || '').replace(/\s+/g, ' ').trim();
    return { cb, id: cb.id || cb.name || cb.value && cb.value !== 'on' && cb.value || '', t: norm(txt), t0: txt.slice(0, 60) };
  });
}
function estadoVivo() {
  const A = window.EMTE_ANALISIS?.estado?.() || {};
  return { capas: casillas().map(c => [c.t, c.cb.checked, c.id]), base: document.querySelector('#basemap-options input:checked')?.value,
    pend: !!document.getElementById('pc-ver')?.checked, curvas: !!document.querySelector('.cn-ver')?.checked, ffaa: !!document.querySelector('.fa-ver')?.checked,
    coc: A.coc || '', tc: !!A.tc, cub: !!window.EMTE_HP_CUB_ON?.(), vista: typeof scale === 'number' ? { scale, panX, panY } : null };
}
function calcoLocal() { const o = {}; try { (JSON.parse(localStorage.getItem(CALCO) || '[]') || []).forEach(([id, f]) => { o[id] = f; }); } catch (e) {} return o; }
async function capturar() {
  const ls = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (CLAVES(k)) ls[k] = localStorage.getItem(k); }
  let calco = null;
  try { const d = await api('/api/planeamiento'); if (d && d.figuras) calco = d.figuras; } catch (e) {}
  return { formato: 2, ls, calco: calco || calcoLocal(), estado: estadoVivo() };
}
function resumenDe(D) {
  const ls = D.ls || {}, j = k => { try { return JSON.parse(ls[k] || 'null'); } catch (e) { return null; } };
  let calco = D.calco; if (!calco) { calco = {}; try { (JSON.parse(ls[CALCO] || '[]') || []).forEach(([id, f]) => calco[id] = f); } catch (e) {} }
  const F = Object.values(calco || {});
  const aa = j('emte-hp-aa'), tl = j('emte-hp-tl'), av = j('emte-av-puntos');
  return { simbolos: F.filter(f => !f.k).length, lineas: F.filter(f => f.k === 'l').length, zonas: F.filter(f => f.k === 'z').length,
    avenidas: aa?.rutas?.length || 0, tiempo: !!tl?.filas?.length, puntos: Array.isArray(av) ? av.length : 0,
    capas: (D.estado?.capas || []).filter(c => c[1]).length, coc: D.estado?.coc || '', tc: !!D.estado?.tc };
}
const txtResumen = r => [r.simbolos ? r.simbolos + ' símbolos' : '', r.lineas ? r.lineas + ' líneas' : '', r.zonas ? r.zonas + ' zonas' : '',
  r.avenidas ? r.avenidas + ' avenidas' : '', r.tiempo ? 'línea de tiempo' : '', r.puntos ? r.puntos + ' puntos de observación' : '',
  r.coc ? 'COC' : '', r.tc ? 'terreno clave' : '', r.capas ? r.capas + ' capas' : ''].filter(Boolean).join(' · ') || 'vacío';

/* miniatura: el mapa tal como se ve (teselas, imágenes y dibujos), 320 px de ancho */
async function miniatura() {
  try {
    const mapa = document.querySelector('.map'); if (!mapa) return null;
    const rm = mapa.getBoundingClientRect(); if (!rm.width) return null;
    const W = 320, H = Math.round(W * rm.height / rm.width), f = W / rm.width;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.fillStyle = '#e9ece4'; c.fillRect(0, 0, W, H);
    const cargar = src => new Promise(ok => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; setTimeout(() => ok(null), 3000); });
    const visible = el => { const cs = getComputedStyle(el); return el.getClientRects().length && cs.display !== 'none' && cs.visibility !== 'hidden'; };
    // 1) imágenes del mapa (satélite, pendientes, COC, área visible…)
    for (const el of mapa.querySelectorAll('svg image')) {
      if (!visible(el)) continue; const src = el.getAttribute('href') || el.getAttribute('xlink:href'); if (!src) continue;
      const r = el.getBoundingClientRect(); if (r.right < rm.left || r.left > rm.right || r.bottom < rm.top || r.top > rm.bottom) continue;
      const im = await cargar(src); if (!im) continue;
      c.globalAlpha = +(getComputedStyle(el).opacity || 1) * +(el.getAttribute('opacity') || 1);
      try { c.drawImage(im, (r.left - rm.left) * f, (r.top - rm.top) * f, r.width * f, r.height * f); } catch (e) {}
    }
    c.globalAlpha = 1;
    // 2) dibujos (calco, vías, ríos, límites…) con sus colores
    const PROPS = ['fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-dasharray', 'display', 'visibility', 'font-size', 'font-family', 'font-weight'];
    for (const svg of mapa.querySelectorAll('svg')) {
      if (svg.parentElement.closest('svg') || !visible(svg)) continue;
      const r = svg.getBoundingClientRect(); if (r.width < 50) continue;
      const orig = svg.querySelectorAll('*'); if (orig.length > 25000) continue;
      const cl = svg.cloneNode(true), copia = cl.querySelectorAll('*');
      orig.forEach((o, i) => { const d = copia[i]; if (!d) return; if (o.tagName === 'image' || o.tagName === 'foreignObject') { d.remove(); return; }
        if (!/^(path|line|polyline|polygon|circle|ellipse|rect|text|tspan|g)$/.test(o.tagName)) return;
        const cs = getComputedStyle(o); d.setAttribute('style', PROPS.map(p => `${p}:${cs.getPropertyValue(p)}`).join(';')); });
      cl.setAttribute('width', r.width); cl.setAttribute('height', r.height); cl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(cl)], { type: 'image/svg+xml' }));
      const im = await cargar(url); URL.revokeObjectURL(url);
      if (im) try { c.drawImage(im, (r.left - rm.left) * f, (r.top - rm.top) * f, r.width * f, r.height * f); } catch (e) {}
    }
    return cv.toDataURL('image/jpeg', .72);
  } catch (e) { return null; }
}

/* ---------------- poner un ejercicio en pantalla ---------------- */
async function escribir(D) {
  const ls = { ...(D.ls || {}) }; let calco = D.calco;
  if (!calco) { calco = {}; try { (JSON.parse(ls[CALCO] || '[]') || []).forEach(([id, f]) => calco[id] = f); } catch (e) {} }
  delete ls[CALCO];
  for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (CLAVES(k)) localStorage.removeItem(k); }
  for (const [k, v] of Object.entries(ls)) if (CLAVES(k)) try { localStorage.setItem(k, v); } catch (e) {}
  try { localStorage.setItem(CALCO, JSON.stringify(Object.entries(calco))); } catch (e) {}
  try { await api('/api/planeamiento/reemplazar', { method: 'POST', json: { figuras: calco } }); }
  catch (e) {
    if (e.status === 404) {   // servidor sin reiniciar: se reemplaza figura por figura con las rutas de siempre
      let viejo = null; try { viejo = (await api('/api/planeamiento')).figuras; } catch (_) {}
      if (viejo) {
        for (const id of Object.keys(viejo)) if (!calco[id]) await api('/api/planeamiento/' + encodeURIComponent(id), { method: 'DELETE' }).catch(() => {});
        for (const [id, o] of Object.entries(calco)) await api('/api/planeamiento/' + encodeURIComponent(id), { json: o }).catch(() => {});
      }
    } else if (e.status && e.status !== 403 && e.status !== 503) throw e;   // sin base: queda en el navegador
  }
}
async function respaldar(motivo) {
  const datos = await capturar(), L = lsj(K.resp, []);
  L.unshift({ id: nuevoId(), fecha: new Date().toISOString(), motivo, actual: lsj(K.actual, null), resumen: resumenDe(datos), datos });
  while (L.length && !lss(K.resp, L.slice(0, 5))) L.pop();
  return !!L.length;
}
async function abrir(D, info, opciones = {}) {
  const { respaldo = true, motivo } = opciones;
  aviso('Abriendo «' + info.nombre + '»…');
  if (respaldo && !(await respaldar(motivo || 'Antes de abrir «' + info.nombre + '»'))) { if (!confirm('No hay espacio para el respaldo automático. ¿Abrir igual (sin poder deshacer)?')) return; }
  try { await escribir(D); } catch (e) { aviso('No se pudo abrir: ' + e.message, true); return; }
  lss(K.aplicar, { estado: D.estado || {}, nombre: info.nombre, deshacer: respaldo, nuevo: !!opciones.nuevo });
  if (info.actual === null) localStorage.removeItem(K.actual); else if (info.actual) lss(K.actual, info.actual);
  location.reload();
}
async function aplicarPendiente() {
  const P = lsj(K.aplicar, null); if (!P) return; localStorage.removeItem(K.aplicar);
  // espera a que las capas terminen de cargar (cantidad de casillas estable), máx. 25 s
  let ant = -1, quieto = 0;
  for (let i = 0; i < 62 && quieto < 3; i++) { await espera(400); const n = casillas().length; quieto = n > 0 && n === ant && window.EMTE_ANALISIS ? quieto + 1 : 0; ant = n; }
  const S = P.estado || {};
  try { if (S.base) document.querySelector(`#basemap-options input[value="${S.base}"]`)?.click(); } catch (e) {}
  const cs = casillas();
  if (P.nuevo) cs.forEach(c => { if (c.cb.checked) c.cb.click(); });
  (S.capas || []).forEach(([t, v, id]) => { const n = norm(t), c = (id && cs.find(x => x.id === id)) || cs.find(x => x.t === n) || cs.find(x => x.t0 === t); if (c && c.cb.checked !== !!v) c.cb.click(); });
  const poner = (sel, v) => { const c = document.querySelector(sel); if (c && c.checked !== !!v) c.click(); };
  poner('#pc-ver', S.pend); poner('.cn-ver', S.curvas); poner('.fa-ver', S.ffaa);
  try { window.EMTE_ANALISIS?.coc(S.coc || ''); window.EMTE_ANALISIS?.tc(!!S.tc); if (S.cub || window.EMTE_HP_CUB_ON?.()) window.EMTE_HP_CUB?.(!!S.cub); } catch (e) {}
  if (S.vista && typeof zoom === 'function') { scale = S.vista.scale; panX = S.vista.panX; panY = S.vista.panY; zoom(1); }
  banner(P.nuevo ? 'Ejercicio nuevo, en blanco' : 'Ejercicio «' + P.nombre + '» abierto', P.deshacer);
}
function banner(texto, conDeshacer) {
  document.querySelector('.ej2-ban')?.remove();
  const b = h('div', 'ej2-ban'); b.append(h('span', null, '✔ ' + texto));
  if (conDeshacer && lsj(K.resp, []).length) { const d = h('button', null, '↶ DESHACER'); d.type = 'button'; d.onclick = () => { b.remove(); deshacer(); }; b.append(d); }
  const x = h('button', 'c', '×'); x.type = 'button'; x.onclick = () => b.remove(); b.append(x);
  document.body.append(b); setTimeout(() => b.remove(), 30000);
}
function deshacer(i = 0) {
  const L = lsj(K.resp, []), R = L[i]; if (!R) { aviso('No hay respaldo para deshacer.', true); return; }
  L.splice(i, 1); lss(K.resp, L);
  abrir(R.datos, { nombre: 'estado anterior', actual: R.actual || null }, { motivo: 'Antes de deshacer (' + R.motivo + ')' });
}

/* ---------------- guardar ---------------- */
async function leerCompleto(E) {
  if (E.origen === 'servidor') return api('/api/ejercicios/' + encodeURIComponent(E.id));
  return LOCAL().find(x => x.id === E.id);
}
async function guardar(meta, id, { confirmar = true } = {}) {
  const todos = await listaTodos();
  const mismo = todos.find(x => x.nombre.toLowerCase() === meta.nombre.toLowerCase() && x.id !== id);
  if (mismo) { if (!confirm(`Ya existe «${mismo.nombre}». ¿Guardar lo que tienes ahora en ese ejercicio? (su versión anterior queda en Versiones)`)) return null; id = mismo.id; }
  const previo = id && todos.find(x => x.id === id);
  if (previo && confirmar && !mismo && !confirm(`¿Guardar lo que tienes ahora en «${previo.nombre}»? La versión anterior queda en Versiones.`)) return null;
  aviso('Guardando…');
  const datos = await capturar(), mini = await miniatura(), resumen = resumenDe(datos);
  id = id || nuevoId();
  const cuerpo = { ...meta, autor: meta.autor || USUARIO, datos, miniatura: mini, resumen };
  const enServidor = SERV && (!previo || previo.origen === 'servidor');
  if (enServidor) {
    try { const r = await api('/api/ejercicios/' + encodeURIComponent(id), { json: cuerpo });
      lss(K.actual, { id, nombre: meta.nombre, origen: 'servidor', version: r.version }); aviso('✔ «' + meta.nombre + '» guardado en PostgreSQL'); listar(); return id; }
    catch (e) { if (e.status !== 503 && e.status !== 403) { aviso(e.message, true); return null; } aviso('Sin conexión con PostgreSQL: se guarda en este navegador', true); }
  }
  const L = LOCAL(), i = L.findIndex(x => x.id === id), ahora = new Date().toISOString();
  if (i >= 0) { const v = L[i]; v.versiones = [{ version: v.version, nombre: v.nombre, autor: v.autor, guardado: v.actualizado, resumen: v.resumen, datos: v.datos }, ...(v.versiones || [])].slice(0, 10);
    Object.assign(v, cuerpo, { version: (v.version || 1) + 1, actualizado: ahora, origen: 'local' }); }
  else L.unshift({ id, ...cuerpo, version: 1, creado: ahora, actualizado: ahora, versiones: [], origen: 'local' });
  let ok = guardarLocal(L);
  while (!ok && L.some(x => x.versiones?.length)) { L.forEach(x => x.versiones && x.versiones.pop()); ok = guardarLocal(L); }   // sin espacio: se recortan versiones antiguas
  if (!ok) { aviso('No hay espacio en este navegador: exporta y borra ejercicios antiguos', true); return null; }
  lss(K.actual, { id, nombre: meta.nombre, origen: 'local', version: L.find(x => x.id === id).version }); aviso('✔ «' + meta.nombre + '» guardado en este navegador'); listar(); return id;
}

/* ---------------- panel ---------------- */
const sec = aside.querySelector('details.ej-menu'); if (!sec) return;
const sum = sec.querySelector(':scope > summary'); if (sum) sum.textContent = 'Ejercicios · nuevo, guardar y abrir';
// 10-11-2026: «Ejercicios» pasó de PLANEAMIENTO a HERRAMIENTAS: una tarjeta más en la grilla de herramientas
// que abre (o cierra) el cuadro de ejercicios debajo de ella.
(function tarjetaEjercicios() {
  const st = h('style'); st.textContent = 'aside details.ej-menu:not(.ej-abierto){display:none!important}aside details.ej-menu.ej-abierto{margin-top:10px}aside details.ej-menu.ej-abierto>summary{display:flex!important}';
  document.head.append(st);
  const pon = () => {
    const ref = document.querySelector('[data-tool="distance"]'), grilla = ref && ref.parentElement; if (!grilla) return false;
    if (grilla.querySelector('.ej-tarjeta')) return true;
    const b = h('button', 'visual-card ej-tarjeta'); b.type = 'button'; b.title = 'Guardar todo el trabajo del mapa como ejercicio y volver a abrirlo';
    b.innerHTML = '<span class="tool-picture"><svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="12" fill="#edf1e8"/><rect x="14" y="12" width="32" height="40" rx="3" fill="#fff" stroke="#070774" stroke-width="3"/><path d="M20 22H40M20 29H40M20 36H32" stroke="#bd9a4b" stroke-width="3"/><circle cx="44" cy="44" r="10" fill="#070774"/><path d="M39 44h10M44 39v10" stroke="#fff" stroke-width="3"/></svg></span><span>EJERCICIOS</span>';
    b.onclick = () => { const si = !sec.classList.contains('ej-abierto'); sec.classList.toggle('ej-abierto', si); b.classList.toggle('chosen', si); if (si) { sec.open = true; setTimeout(() => sec.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); } };
    grilla.append(b); return true;
  };
  if (!pon()) { let n = 0; const t = setInterval(() => { if (pon() || ++n > 40) clearInterval(t); }, 250); }
})();
const viejo = sec.querySelector(':scope > .ej-c');
const raiz = h('div', 'ej-c ej2'); viejo ? viejo.replaceWith(raiz) : sec.append(raiz);
for (const t of ['pointerdown', 'click', 'wheel']) raiz.addEventListener(t, e => e.stopPropagation());
raiz.innerHTML = `<div class="ej2-con"><i></i><span>Comprobando conexión…</span></div>
<div class="ej2-act" hidden><small>EJERCICIO ABIERTO</small><b></b><button type="button" class="oro ej2-gc">💾 GUARDAR CAMBIOS</button></div>
<div class="ej2-des" hidden><span></span><button type="button" class="ej2-dh">↶ DESHACER</button></div>
<div class="ej2-top"><button type="button" class="az ej2-nuevo">➕ NUEVO</button><button type="button" class="oro ej2-gcomo">💾 GUARDAR COMO…</button><button type="button" class="ej2-imp">📂 IMPORTAR</button></div>
<div class="ej2-form" hidden><div class="t">DATOS DEL EJERCICIO</div>
<label class="w">Nombre *<input class="f-nombre" maxlength="80" placeholder="Ej.: Ejercicio Achacachi 03"></label>
<label>Unidad<input class="f-unidad" maxlength="80" placeholder="Ej.: RI-1 «Colorados»"></label>
<label>Situación<select class="f-situacion">${SITU.map(s => `<option value="${s}">${s || '—'}</option>`).join('')}</select></label>
<label>Fecha-hora (GDH)<span class="dtg"><input class="f-dtg" maxlength="40" placeholder="160500-MAR-26"><button type="button" class="f-ahora" title="Poner la fecha-hora actual">AHORA</button></span></label>
<label>Autor<input class="f-autor" maxlength="80"></label>
<label class="w">Nota / misión<textarea class="f-nota" maxlength="2000" placeholder="Misión, intención del comandante, observaciones…"></textarea></label>
<div class="pie"><small class="f-donde"></small><button type="button" class="f-cancel">CANCELAR</button><button type="button" class="oro f-ok">💾 GUARDAR</button></div></div>
<div class="ej2-bus"><input type="search" class="ej2-q" placeholder="Buscar por nombre, unidad o nota…"><select class="ej2-ord"><option value="r">Recientes</option><option value="n">Nombre A–Z</option><option value="c">Creación</option></select></div>
<div class="ej2-lista"></div>
<details class="ej2-resp"><summary>RESPALDOS AUTOMÁTICOS</summary><div class="ej2-rl"></div></details>
<input type="file" class="ej2-file" accept=".json,application/json" hidden>`;
const $ = s => raiz.querySelector(s), form = $('.ej2-form');
let modoForm = null;   // {tipo:'nuevo'|'datos', E}
function abrirForm(tipo, E) {
  modoForm = { tipo, E }; form.hidden = false;
  $('.ej2-form .t').textContent = tipo === 'datos' ? 'DATOS DE «' + E.nombre + '»' : 'GUARDAR COMO EJERCICIO NUEVO';
  const v = E || { nombre: '', unidad: '', situacion: '', dtg: dtgAhora(), autor: USUARIO, nota: '' };
  ['nombre', 'unidad', 'situacion', 'dtg', 'autor', 'nota'].forEach(k => { $('.f-' + k).value = v[k] || ''; });
  $('.f-donde').textContent = tipo === 'datos' ? 'Solo cambian los datos; el contenido no se toca.' : (SERV ? 'Se guarda en PostgreSQL (compartido).' : 'Se guarda en este navegador (sin conexión).');
  $('.f-ok').textContent = tipo === 'datos' ? '✔ APLICAR' : '💾 GUARDAR';
  $('.f-nombre').focus();
}
const leerForm = () => Object.fromEntries(['nombre', 'unidad', 'situacion', 'dtg', 'autor', 'nota'].map(k => [k, $('.f-' + k).value.trim()]));
$('.f-ahora').onclick = () => { $('.f-dtg').value = dtgAhora(); };
$('.f-cancel').onclick = () => { form.hidden = true; modoForm = null; };
$('.f-ok').onclick = async () => {
  const m = leerForm(); if (!m.nombre) { aviso('Escribe un nombre para el ejercicio', true); $('.f-nombre').focus(); return; }
  const md = modoForm; if (!md) return;
  if (md.tipo === 'datos') {
    const E = md.E;
    if (E.origen === 'servidor') { try { await api('/api/ejercicios/' + encodeURIComponent(E.id), { method: 'PATCH', json: m }); } catch (e) { aviso(e.message, true); return; } }
    else { const L = LOCAL(), x = L.find(y => y.id === E.id); if (x) { Object.assign(x, m, { actualizado: new Date().toISOString() }); guardarLocal(L); } }
    const ac = lsj(K.actual, null); if (ac && ac.id === E.id) { ac.nombre = m.nombre; lss(K.actual, ac); }
    form.hidden = true; aviso('✔ Datos actualizados'); listar(); return;
  }
  const id = await guardar(m, null, { confirmar: false }); if (id) { form.hidden = true; modoForm = null; }
};
$('.ej2-gcomo').onclick = () => form.hidden || modoForm?.tipo !== 'nuevo' ? abrirForm('nuevo') : (form.hidden = true);
$('.ej2-gc').onclick = async () => {
  const ac = lsj(K.actual, null); if (!ac) return;
  const E = (await listaTodos()).find(x => x.id === ac.id); if (!E) { aviso('Ese ejercicio ya no existe: usa «Guardar como…»', true); localStorage.removeItem(K.actual); listar(); return; }
  guardar({ nombre: E.nombre, unidad: E.unidad, situacion: E.situacion, dtg: E.dtg, autor: E.autor, nota: E.nota }, E.id);
};
$('.ej2-nuevo').onclick = () => {
  if (!confirm('EJERCICIO NUEVO\n\nSe limpia el calco, las avenidas, la línea de tiempo, el área visible, el análisis y las capas encendidas.\nAntes se hace un respaldo automático: podrás DESHACER.\n\n¿Empezar un ejercicio nuevo?')) return;
  abrir({ ls: {}, calco: {}, estado: { capas: [] } }, { nombre: 'nuevo', actual: null }, { motivo: 'Antes de «Nuevo»', nuevo: true });
};
$('.ej2-dh').onclick = () => deshacer(0);
$('.ej2-imp').onclick = () => $('.ej2-file').click();
$('.ej2-file').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  let E; try { E = JSON.parse(await f.text()); } catch (er) { aviso('Ese archivo no es un ejercicio del geovisor', true); return; }
  if (!E || E.tipo !== 'ejercicio-geovisor-emte') { aviso('Ese archivo no es un ejercicio del geovisor', true); return; }
  const D = E.datos || { ls: E.ls || {}, estado: E.estado || {} };
  const todos = await listaTodos(); let nombre = E.nombre || 'Ejercicio importado'; while (todos.some(x => x.nombre.toLowerCase() === nombre.toLowerCase())) nombre += ' (importado)';
  const cuerpo = { nombre, unidad: E.unidad || '', situacion: E.situacion || '', dtg: E.dtg || '', autor: E.autor || '', nota: E.nota || '', miniatura: E.miniatura || null, resumen: resumenDe(D), datos: D };
  if (await subir(cuerpo, nuevoId())) aviso('✔ «' + nombre + '» importado');
};
async function subir(cuerpo, id) {   // guarda un ejercicio ya armado (importar, duplicar, subir a PostgreSQL)
  if (SERV) { try { await api('/api/ejercicios/' + encodeURIComponent(id), { json: cuerpo }); listar(); return true; } catch (e) { if (e.status !== 503 && e.status !== 403) { aviso(e.message, true); return false; } } }
  const L = LOCAL(), ahora = new Date().toISOString(); L.unshift({ id, ...cuerpo, version: 1, creado: ahora, actualizado: ahora, versiones: [], origen: 'local' });
  if (!guardarLocal(L)) { aviso('No hay espacio en este navegador', true); return false; } listar(); return true;
}
$('.ej2-q').oninput = () => pintar(); $('.ej2-ord').onchange = () => pintar();

/* ---------------- exportar ---------------- */
function bajar(nombre, blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
const archivo = n => (n || 'ejercicio').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'ejercicio';
const paraArchivo = E => ({ tipo: 'ejercicio-geovisor-emte', version: 2, nombre: E.nombre, unidad: E.unidad, situacion: E.situacion, dtg: E.dtg, autor: E.autor, nota: E.nota, creado: E.creado, actualizado: E.actualizado, resumen: E.resumen, miniatura: E.miniatura, datos: E.datos });
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return b => { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = t[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }; })();
function zip(files) {   // ZIP sin compresión
  const enc = new TextEncoder(), partes = [], central = []; let off = 0;
  files.forEach(([nombre, datos]) => {
    const n = enc.encode(nombre), d = typeof datos === 'string' ? enc.encode(datos) : datos, crc = CRC(d);
    const loc = new DataView(new ArrayBuffer(30)); loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true); loc.setUint32(14, crc, true); loc.setUint32(18, d.length, true); loc.setUint32(22, d.length, true); loc.setUint16(26, n.length, true);
    const cen = new DataView(new ArrayBuffer(46)); cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true); cen.setUint32(16, crc, true); cen.setUint32(20, d.length, true); cen.setUint32(24, d.length, true); cen.setUint16(28, n.length, true); cen.setUint32(42, off, true);
    partes.push(new Uint8Array(loc.buffer), n, d); central.push(new Uint8Array(cen.buffer), n); off += 30 + n.length + d.length;
  });
  const tam = central.reduce((a, b) => a + b.length, 0), fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, files.length, true); fin.setUint16(10, files.length, true); fin.setUint32(12, tam, true); fin.setUint32(16, off, true);
  return new Blob([...partes, ...central, new Uint8Array(fin.buffer)], { type: 'application/zip' });
}
function geojson(D) {
  let calco = D.calco; if (!calco) { calco = {}; try { (JSON.parse(D.ls?.[CALCO] || '[]') || []).forEach(([id, f]) => calco[id] = f); } catch (e) {} }
  const R = 6378137, ll = (x, y) => [+(x / R * 180 / Math.PI).toFixed(7), +((2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI).toFixed(7)];
  const features = Object.entries(calco).map(([id, o]) => {
    if (!o.k) return { type: 'Feature', id, geometry: { type: 'Point', coordinates: ll(o.x, o.y) }, properties: { capa: 'Símbolos', simbolo: o.key, bando: o.bando, escalon: o.esc || '', desig_izq: o.izq || '', desig_der: o.der || '', texto: o.cen || '', previsto: o.prev ? 1 : 0, tamano_m: o.tam, rotacion: o.rot || 0 } };
    const P = []; for (let i = 0; i < o.p.length; i += 2) P.push(ll(o.p[i], o.p[i + 1]));
    return { type: 'Feature', id, geometry: o.k === 'z' ? { type: 'Polygon', coordinates: [P.concat([P[0]])] } : { type: 'LineString', coordinates: P }, properties: { capa: o.k === 'z' ? 'Zonas y áreas' : 'Líneas tácticas', tipo: o.tipo, etiqueta: o.et || '', fecha_hora: o.fh || '', bando: o.bando } };
  });
  return JSON.stringify({ type: 'FeatureCollection', name: 'calco', crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } }, features });
}
async function exportar(E0, tipo) {
  const E = await leerCompleto(E0).catch(() => null); if (!E || !E.datos) { aviso('No se pudo leer el ejercicio', true); return; }
  const base = 'ejercicio_' + archivo(E.nombre);
  if (tipo === 'json') { bajar(base + '.json', new Blob([JSON.stringify(paraArchivo(E))], { type: 'application/json' })); return; }
  const r = resumenDe(E.datos), aa = (() => { try { return JSON.parse(E.datos.ls?.['emte-hp-aa'] || 'null'); } catch (e) { return null; } })();
  const leeme = [`EJERCICIO: ${E.nombre}`, `Unidad: ${E.unidad || '—'}`, `Situación: ${E.situacion || '—'}`, `Fecha-hora (GDH): ${E.dtg || '—'}`, `Autor: ${E.autor || '—'}`,
    `Creado: ${fecha(E.creado)} · Última versión (v${E.version || 1}): ${fecha(E.actualizado)}`, '', 'NOTA / MISIÓN', E.nota || '—', '', 'CONTENIDO', txtResumen(r),
    ...(aa?.rutas?.length ? ['', 'AVENIDAS DE APROXIMACIÓN', ...aa.rutas.map((R, i) => `AA-${i + 1} ${R.rol || ''}: ${R.cat || ''}${R.km ? ', ' + String(R.km).replace('.', ',') + ' km' : ''}`)] : []),
    '', 'ARCHIVOS', 'ejercicio.json — ejercicio completo: se abre en el geovisor con IMPORTAR.', 'calco.geojson — símbolos, líneas y zonas del calco (WGS 84); se abre en QGIS.', 'miniatura.jpg — vista del mapa al guardar.'].join('\r\n');
  const files = [['ejercicio.json', JSON.stringify(paraArchivo(E))], ['calco.geojson', geojson(E.datos)], ['LEEME.txt', leeme]];
  if (E.miniatura) { const b = atob(E.miniatura.split(',')[1]), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); files.push(['miniatura.jpg', u]); }
  bajar(base + '.zip', zip(files));
}

/* ---------------- lista ---------------- */
let CACHE = [];
async function listaTodos() {
  let serv = [];
  try { serv = (await api('/api/ejercicios')).ejercicios || []; SERV = true; } catch (e) { SERV = false; }
  const loc = LOCAL().map(x => ({ ...x, nversiones: (x.versiones || []).length, origen: 'local' }));
  CACHE = [...serv, ...loc]; return CACHE;
}
async function listar() { await listaTodos(); pintar(); }
function pintar() {
  const con = $('.ej2-con'); con.classList.toggle('si', SERV);
  con.querySelector('span').textContent = SERV ? 'Conectado a PostgreSQL: los ejercicios se comparten con quien use la misma base.' : 'Sin conexión con PostgreSQL: los ejercicios se guardan en este navegador.';
  const ac = lsj(K.actual, null), act = $('.ej2-act'); act.hidden = !ac; if (ac) act.querySelector('b').textContent = ac.nombre + (ac.version ? ' · v' + ac.version : '');
  const R = lsj(K.resp, []), des = $('.ej2-des'); des.hidden = !R.length;
  if (R.length) des.querySelector('span').textContent = `↶ Volver a como estaba ${R[0].motivo.charAt(0).toLowerCase() + R[0].motivo.slice(1)} (${fecha(R[0].fecha)})`;
  const rl = $('.ej2-rl'); rl.replaceChildren(); $('.ej2-resp').hidden = !R.length;
  R.forEach((r, i) => { const d = h('div'); d.append(h('span', null, `${fecha(r.fecha)} · ${r.motivo} · ${txtResumen(r.resumen || {})}`)); const b = h('button', null, 'RESTAURAR'); b.type = 'button'; b.onclick = () => { if (confirm('¿Volver a ese estado? (lo actual queda en un respaldo nuevo)')) deshacer(i); }; d.append(b); rl.append(d); });
  const q = $('.ej2-q').value.trim().toLowerCase(), ord = $('.ej2-ord').value;
  let L = CACHE.filter(E => !q || [E.nombre, E.unidad, E.situacion, E.nota, E.autor, E.dtg].join(' ').toLowerCase().includes(q));
  L.sort((a, b) => ord === 'n' ? a.nombre.localeCompare(b.nombre, 'es') : ord === 'c' ? String(b.creado).localeCompare(String(a.creado)) : String(b.actualizado).localeCompare(String(a.actualizado)));
  const lista = $('.ej2-lista'); lista.replaceChildren();
  if (!L.length) { lista.append(h('div', 'ej2-vacio', CACHE.length ? 'Ningún ejercicio coincide con la búsqueda.' : 'Todavía no hay ejercicios. Trabaja en el mapa y pulsa «GUARDAR COMO…».')); return; }
  L.forEach(E => lista.append(tarjeta(E, ac)));
}
function tarjeta(E, ac) {
  const d = h('div', 'ej2-it' + (ac && ac.id === E.id ? ' abierto' : '')), r = E.resumen || {};
  const mi = h('div', 'mi'); if (E.miniatura) mi.style.backgroundImage = `url("${E.miniatura}")`; else mi.textContent = '🗺';
  const nm = h('div', 'nm'); nm.append(h('b', null, E.nombre), h('span', 'bd' + (E.origen === 'local' ? ' l' : ''), E.origen === 'local' ? '💻 navegador' : '🗄 PostgreSQL'), h('span', 'bd', 'v' + (E.version || 1)));
  d.append(mi, nm, h('small', null, [E.unidad, E.situacion, E.dtg].filter(Boolean).join(' · ') || 'Sin datos de unidad'),
    h('small', null, `${fecha(E.actualizado)}${E.autor ? ' · ' + E.autor : ''} · ${txtResumen(r)}`));
  if (E.nota) d.append(h('div', 'nt', E.nota));
  const bt = h('div', 'bt'), b = (t, fn, c, tt) => { const x = h('button', c || null, t); x.type = 'button'; if (tt) x.title = tt; x.onclick = fn; bt.append(x); return x; };
  b('▶ ABRIR', async () => {
    if (!confirm(`Abrir «${E.nombre}».\n\nLo que tienes ahora en el geovisor se guarda en un respaldo automático y podrás DESHACER la apertura.\n\n¿Continuar?`)) return;
    const F = await leerCompleto(E).catch(e => { aviso(e.message, true); return null; }); if (!F) return;
    abrir(F.datos, { nombre: E.nombre, actual: { id: E.id, nombre: E.nombre, origen: E.origen, version: F.version } });
  }, 'az', 'Abre el ejercicio (con respaldo y deshacer)');
  b('💾 GUARDAR CAMBIOS', () => guardar({ nombre: E.nombre, unidad: E.unidad, situacion: E.situacion, dtg: E.dtg, autor: E.autor, nota: E.nota }, E.id), null, 'Guarda lo que tienes en pantalla en este ejercicio; la versión anterior queda en Versiones');
  b('✎ DATOS', () => abrirForm('datos', E), null, 'Cambiar nombre, unidad, situación, fecha-hora, autor o nota');
  b('⧉ DUPLICAR', async () => {
    const F = await leerCompleto(E).catch(() => null); if (!F) return; let n = E.nombre + ' (copia)'; while (CACHE.some(x => x.nombre.toLowerCase() === n.toLowerCase())) n += ' (copia)';
    if (await subir({ nombre: n, unidad: F.unidad, situacion: F.situacion, dtg: F.dtg, autor: USUARIO || F.autor, nota: F.nota, miniatura: F.miniatura, resumen: F.resumen, datos: F.datos }, nuevoId())) aviso('✔ Copia creada: «' + n + '»');
  });
  const bv = b(`🕘 VERSIONES (${E.nversiones || 0})`, () => versiones(E, d, bv)); bv.disabled = !E.nversiones;
  b('⬇ JSON', () => exportar(E, 'json'), null, 'Archivo para abrir en otra computadora (IMPORTAR)');
  b('⬇ ZIP', () => exportar(E, 'zip'), null, 'Ejercicio + calco en GeoJSON (QGIS) + miniatura + resumen');
  if (E.origen === 'local' && SERV) b('⬆ SUBIR A POSTGRESQL', async () => {
    const F = LOCAL().find(x => x.id === E.id); if (!F) return;
    try { await api('/api/ejercicios/' + encodeURIComponent(E.id), { json: { nombre: F.nombre, unidad: F.unidad, situacion: F.situacion, dtg: F.dtg, autor: F.autor, nota: F.nota, miniatura: F.miniatura, resumen: F.resumen, datos: F.datos } }); }
    catch (e) { aviso(e.message, true); return; }
    guardarLocal(LOCAL().filter(x => x.id !== E.id)); const a2 = lsj(K.actual, null); if (a2 && a2.id === E.id) { a2.origen = 'servidor'; lss(K.actual, a2); }
    aviso('✔ «' + E.nombre + '» subido a PostgreSQL'); listar();
  }, null, 'Pasa este ejercicio a la base compartida');
  b('🗑', async () => {
    if (!confirm(`¿Borrar «${E.nombre}» y todas sus versiones?\n\nSugerencia: antes exporta un ZIP o JSON como copia.`)) return;
    if (E.origen === 'servidor') { try { await api('/api/ejercicios/' + encodeURIComponent(E.id), { method: 'DELETE' }); } catch (e) { aviso(e.message, true); return; } }
    else guardarLocal(LOCAL().filter(x => x.id !== E.id));
    const a2 = lsj(K.actual, null); if (a2 && a2.id === E.id) localStorage.removeItem(K.actual);
    aviso('Ejercicio borrado'); listar();
  }, 'x', 'Borrar');
  d.append(bt); return d;
}
async function versiones(E, d, boton) {
  const ya = d.querySelector('.ej2-ver'); if (ya) { ya.remove(); return; }
  const box = h('div', 'ej2-ver', 'Cargando versiones…'); d.append(box);
  let V = [];
  if (E.origen === 'servidor') { try { V = (await api(`/api/ejercicios/${encodeURIComponent(E.id)}/versiones`)).versiones || []; } catch (e) { box.textContent = e.message; return; } }
  else V = (LOCAL().find(x => x.id === E.id)?.versiones || []);
  box.replaceChildren(); if (!V.length) { box.textContent = 'Sin versiones anteriores.'; return; }
  V.forEach(v => {
    const f = h('div'); f.append(h('span', null, `v${v.version} · ${fecha(v.guardado)}${v.autor ? ' · ' + v.autor : ''} · ${txtResumen(v.resumen || {})}`));
    const ab = h('button', null, '▶ ABRIR'); ab.type = 'button';
    ab.onclick = async () => {
      if (!confirm(`¿Abrir la versión ${v.version} de «${E.nombre}»? Lo actual queda en un respaldo y podrás deshacer.`)) return;
      let datos = v.datos;
      if (!datos) { try { datos = (await api(`/api/ejercicios/${encodeURIComponent(E.id)}/versiones/${v.version}`)).datos; } catch (e) { aviso(e.message, true); return; } }
      abrir(datos, { nombre: `${E.nombre} (versión ${v.version})`, actual: { id: E.id, nombre: E.nombre, origen: E.origen, version: E.version } });
    };
    f.append(ab); box.append(f);
  });
}
listar();
setInterval(() => { if (!document.hidden && sec.open !== false && raiz.isConnected && raiz.offsetParent) listar(); }, 60000);
aplicarPendiente();
window.EMTE_EJERCICIOS = { listar, deshacer, nuevo: () => $('.ej2-nuevo').click() };
});
