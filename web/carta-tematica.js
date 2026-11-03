/* Carta temática (agregado por BYNS7, 02-11-2026). Herramientas › Guardar › «CARTA TEMÁTICA».
   Hoja A4 o A3, horizontal o vertical, con todos los elementos de una carta temática a partir del recuadro de Guardar:
     rótulo (institución, título, subtítulo, logos), mapa con marco y coordenadas UTM, mapa de ubicación,
     escala numérica y gráfica, norte y convergencia, leyenda (se eligen sus elementos), datos técnicos,
     cuadro de responsabilidad, número de carta, notas y clasificación.
   En la vista previa el mapa se mueve arrastrándolo y se acerca o aleja con la rueda o los botones + / −
   (se mueve el mapa del geovisor debajo del recuadro y se vuelve a dibujar). Se descarga en PDF, JPG o PNG. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const NS = 'http://www.w3.org/2000/svg', K = 65759.1401421867, R = 6378137, D2R = Math.PI / 180;
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const miles = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const dec = (n, d = 1) => n.toFixed(d).replace('.', ',');
const esc = s => String(s ?? '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const FUENTE = 'Bahnschrift,Segoe UI,Arial,sans-serif';

/* ---------- diseño de la hoja (mm) ---------- */
const DIS = {
  H: { W: 297, H: 210, mapa: { x: 15, y: 35, w: 196, h: 155 }, notaY: 201 },
  V: { W: 210, H: 297, mapa: { x: 14, y: 35, w: 182, h: 162 }, notaY: 288 }
};
const aspectoMapa = o => DIS[o].mapa.w / DIS[o].mapa.h;

/* ---------- ventana ---------- */
const css = h('style');
css.textContent = `
.ct-fondo{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:#0B1D33b3}
.ct-fondo[hidden]{display:none}
.ct-dlg{width:min(1240px,97vw);height:min(800px,95vh);display:grid;grid-template-columns:330px 1fr;grid-template-rows:auto 1fr auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px #0008;font:12px var(--tipo-texto,system-ui);color:#14233A}
.ct-cab{grid-column:1/-1;display:flex;align-items:center;gap:10px;padding:10px 16px;background:#0B1D33;color:#fff;border-bottom:3px solid #B79A5B;font:800 13px var(--tipo-titulo,system-ui);letter-spacing:.1em}
.ct-cab button{margin-left:auto;border:0;background:none;color:#fff;font-size:22px;cursor:pointer}
.ct-form{overflow:auto;padding:10px 14px 14px;border-right:1px solid #E3E8EF;background:#F8FAFC}
.ct-form h4{margin:12px 0 6px;font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.12em;color:#8A6D2F}
.ct-form h4:first-child{margin-top:2px}
.ct-form label{display:grid!important;gap:3px;margin:0 0 7px!important;padding:0!important;border:0!important;font:700 10px var(--tipo-titulo,system-ui);letter-spacing:.06em;color:#3A4A60}
.ct-form input[type=text],.ct-form select,.ct-form textarea{width:100%;box-sizing:border-box;padding:6px 8px;border:1px solid #CDD6E2;border-radius:6px;font:12px var(--tipo-texto,system-ui);background:#fff;text-transform:none}
.ct-form textarea{resize:vertical;min-height:44px}
.ct-form .ct-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ct-form .ct-chk{display:flex!important;align-items:center;gap:7px;margin:0 0 5px!important;font:600 11.5px var(--tipo-texto,system-ui)!important;letter-spacing:0!important;color:#14233A!important}
.ct-ley{display:grid;gap:2px;max-height:210px;overflow:auto;padding:6px 8px;border:1px solid #E3E8EF;border-radius:8px;background:#fff}
.ct-ley .ct-chk{font-size:11px!important;margin:0!important}
.ct-ley i{flex:none;width:12px;height:9px;border-radius:2px;border:1px solid #0002}
.ct-ley-acc{display:flex;gap:10px;margin:4px 0 0;font-size:10.5px}.ct-ley-acc a{color:#12294A;cursor:pointer;text-decoration:underline}
.ct-prev{position:relative;overflow:auto;display:grid;place-items:center;padding:18px;background:#5A6B80}
.ct-prev svg{max-width:100%;max-height:100%;width:auto;height:auto;background:#fff;box-shadow:0 8px 30px #0006;touch-action:none}
.ct-prev svg .ct-hit{cursor:grab}.ct-prev.moviendo svg .ct-hit{cursor:grabbing}
.ct-prev svg text{text-transform:none}
.ct-ctrl{position:absolute;top:12px;left:12px;display:flex;align-items:center;gap:6px;z-index:2}
.ct-ctrl button{width:32px;height:32px;border:0;border-radius:8px;background:#fff;color:#12294A;font:800 18px var(--tipo-titulo,system-ui);cursor:pointer;box-shadow:0 2px 8px #0004}
.ct-ctrl button:hover{background:#B79A5B;color:#fff}
.ct-ctrl span{padding:5px 10px;border-radius:14px;background:#0B1D33cc;color:#fff;font:700 10.5px var(--tipo-titulo,system-ui);letter-spacing:.04em}
.ct-prev .ct-cargando{position:absolute;top:12px;right:12px;padding:5px 12px;border-radius:14px;background:#B79A5B;color:#0B1D33;font:800 11px var(--tipo-titulo,system-ui);z-index:2}
.ct-pie{grid-column:1/-1;display:flex;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid #E3E8EF;background:#fff}
.ct-pie select{padding:6px 8px;border:1px solid #CDD6E2;border-radius:6px;font:12px var(--tipo-texto,system-ui)}
.ct-pie .msg{flex:1;color:#1E5B3A;font-size:11.5px}.ct-pie .msg.mal{color:#9B1C1C}
.ct-pie button{padding:9px 16px;border:1px solid #12294A;border-radius:7px;background:#fff;color:#12294A;font:800 11px var(--tipo-titulo,system-ui);letter-spacing:.06em;cursor:pointer}
.ct-pie button.pri{background:#12294A;color:#fff}.ct-pie button.pri:hover{background:#B79A5B;border-color:#B79A5B}
.ct-pie button:disabled{opacity:.5;cursor:wait}
@media(max-width:820px){.ct-dlg{grid-template-columns:1fr;grid-template-rows:auto 40% 1fr auto}.ct-form{border-right:0;border-bottom:1px solid #E3E8EF}}`;
document.head.append(css);

const usuario = () => (document.querySelector('.session-actions span')?.textContent || '').replace(/·.*$/, '').trim();
const BASE = { inst: 'EJÉRCITO DE BOLIVIA · ESCUELA MILITAR DE TOPOGRAFÍA DEL EJÉRCITO', tit: 'PROVINCIA OMASUYOS – LA PAZ', sub: '', num: '', clas: '', autor: '', rev: '', apr: '', notas: '', fuente: '', papel: 'A4', orient: 'H', fmt: 'pdf', cuad: true, ubic: true, ley: true, resp: true, leyOff: [] };
let D = { ...BASE }; try { Object.assign(D, JSON.parse(localStorage.getItem('emte-carta') || '{}')); } catch (e) {}
if (!Array.isArray(D.leyOff)) D.leyOff = [];
const fondo = h('div', 'ct-fondo'); fondo.hidden = true;
fondo.innerHTML = `<div class="ct-dlg" role="dialog" aria-modal="true" aria-label="Carta temática">
<div class="ct-cab">CARTA TEMÁTICA<button type="button" class="ct-x" aria-label="Cerrar">×</button></div>
<form class="ct-form" autocomplete="off">
<h4>HOJA</h4>
<div class="ct-2"><label>TAMAÑO<select name="papel"><option value="A4">A4</option><option value="A3">A3</option></select></label>
<label>ORIENTACIÓN<select name="orient"><option value="H">HORIZONTAL</option><option value="V">VERTICAL</option></select></label></div>
<h4>RÓTULO</h4>
<label>INSTITUCIÓN<input type="text" name="inst" maxlength="90"></label>
<label>TÍTULO<input type="text" name="tit" maxlength="70"></label>
<label>SUBTÍTULO / PROPÓSITO<input type="text" name="sub" maxlength="100" placeholder="EJ.: CARTA DE SITUACIÓN – EJERCICIO DE CAMPO"></label>
<div class="ct-2"><label>CARTA N.º<input type="text" name="num" maxlength="20" placeholder="EJ.: 01/2026"></label>
<label>CLASIFICACIÓN<select name="clas"><option value="">SIN CLASIFICACIÓN</option><option>USO OFICIAL</option><option>RESERVADO</option><option>CONFIDENCIAL</option><option>SECRETO</option></select></label></div>
<h4>LEYENDA</h4>
<label class="ct-chk"><input type="checkbox" name="ley"> Mostrar leyenda</label>
<div class="ct-ley" id="ct-ley"></div>
<div class="ct-ley-acc"><a data-l="todo">Marcar todo</a><a data-l="nada">Quitar todo</a></div>
<h4>CONTENIDO</h4>
<label class="ct-chk"><input type="checkbox" name="cuad"> Coordenadas UTM en el marco</label>
<label class="ct-chk"><input type="checkbox" name="ubic"> Mapa de ubicación</label>
<label class="ct-chk"><input type="checkbox" name="resp"> Cuadro de responsabilidad</label>
<h4>RESPONSABILIDAD</h4>
<label>ELABORÓ<input type="text" name="autor" maxlength="60"></label>
<label>REVISÓ<input type="text" name="rev" maxlength="60"></label>
<label>APROBÓ<input type="text" name="apr" maxlength="60"></label>
<h4>NOTAS Y FUENTES</h4>
<label>NOTAS<textarea name="notas" maxlength="220"></textarea></label>
<label>FUENTE DE LOS DATOS<input type="text" name="fuente" maxlength="140" placeholder="Se completa con las capas del geovisor"></label>
</form>
<div class="ct-prev"><div class="ct-ctrl"><button type="button" data-z="1.5" aria-label="Acercar el mapa">+</button><button type="button" data-z="0.667" aria-label="Alejar el mapa">−</button><span>ARRASTRA EL MAPA PARA MOVERLO · RUEDA PARA ACERCAR</span></div><span class="ct-cargando" hidden>Actualizando el mapa…</span></div>
<div class="ct-pie"><span class="msg" role="status"></span><select name="fmt" aria-label="Formato"><option value="pdf">PDF</option><option value="jpg">JPG</option><option value="png">PNG</option></select>
<button type="button" class="ct-cer">CERRAR</button><button type="button" class="pri ct-ok">⬇ DESCARGAR CARTA</button></div></div>`;
document.body.append(fondo);
const F = fondo.querySelector('.ct-form'), prev = fondo.querySelector('.ct-prev'), msg = fondo.querySelector('.ct-pie .msg'), fmt = fondo.querySelector('[name=fmt]'), cargando = fondo.querySelector('.ct-cargando'), leyBox = fondo.querySelector('#ct-ley');
const aviso = (t, mal) => { msg.textContent = t; msg.classList.toggle('mal', !!mal); };
function aForm() { for (const [k, v] of Object.entries(D)) { const e = F.elements[k] || (k === 'fmt' ? fmt : null); if (!e || !e.tagName) continue; if (e.type === 'checkbox') e.checked = !!v; else e.value = v; } }
function guardarD() { try { localStorage.setItem('emte-carta', JSON.stringify(D)); } catch (e) {} }
function deForm() { for (const e of F.elements) if (e.name) D[e.name] = e.type === 'checkbox' ? e.checked : e.value; D.fmt = fmt.value; guardarD(); }
let tPrev = 0;
F.addEventListener('input', e => { if (e.target.closest('#ct-ley')) return; clearTimeout(tPrev); tPrev = setTimeout(() => { deForm(); pintar(); }, 200); });
F.addEventListener('change', e => {
  if (e.target.closest('#ct-ley')) { const n = e.target.value; D.leyOff = D.leyOff.filter(x => x !== n); if (!e.target.checked) D.leyOff.push(n); guardarD(); pintar(); return; }
  const antes = D.orient + D.papel; deForm();
  if (D.orient + D.papel !== antes) prepararMapa(true); else pintar();
});
fondo.querySelectorAll('.ct-ley-acc a').forEach(a => a.onclick = () => { D.leyOff = a.dataset.l === 'nada' ? itemsLey().map(q => q.nombre) : []; guardarD(); listaLey(); pintar(); });
fmt.onchange = deForm;
const cerrar = () => { fondo.hidden = true; };
fondo.querySelector('.ct-x').onclick = cerrar; fondo.querySelector('.ct-cer').onclick = cerrar;
fondo.addEventListener('click', e => { if (e.target === fondo) cerrar(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !fondo.hidden) cerrar(); });

/* ---------- datos del mapa ---------- */
let M = null;   // {img, rect, ley}
let LIMITE = null;
const cargarLimite = () => LIMITE ? Promise.resolve(LIMITE) : fetch('data/limite_omasuyos.geojson').then(r => r.json()).then(d => LIMITE = d).catch(() => null);
const LOGOS = {};
async function logos() { const T = window.EMTE_TOPO; for (const k of ['ejercito_bolivia', 'emte']) if (!LOGOS[k]) LOGOS[k] = T?.incrustar ? await T.incrustar(`assets/logos/${k}.png`) : null; }
const espera = ms => new Promise(r => setTimeout(r, ms));
function itemsLey() { const it = (M && M.ley ? M.ley : []).slice(); it.push({ nombre: 'Límite del área de la carta', tipo: 'marco', color: '#0B1D33' }); return it; }
function listaLey() {
  leyBox.replaceChildren();
  itemsLey().forEach(q => {
    const l = h('label', 'ct-chk'), cb = h('input'); cb.type = 'checkbox'; cb.value = q.nombre; cb.checked = !D.leyOff.includes(q.nombre);
    const i = h('i'); i.style.background = q.tipo === 'marco' ? '#fff' : (q.color || '#12294A'); if (q.tipo === 'marco') i.style.border = '1.5px solid #0B1D33';
    if (q.tipo === 'sim') { i.innerHTML = `<svg viewBox="-11 -11 22 22" width="12" height="12">${q.s}</svg>`; i.style.background = 'none'; i.style.border = '0'; i.style.height = '12px'; }
    l.append(cb, i, document.createTextNode(q.nombre)); leyBox.append(l);
  });
}
let generacion = 0;
async function capturar() {
  const G = window.EMTE_GUARDAR, T = window.EMTE_TOPO, n = ++generacion;
  cargando.hidden = false;
  try {
    await espera(450);   // deja cargar las teselas del mapa base
    const rect = G.escenaDelMarco(); const img = await G.imagenMarco(D.papel === 'A3' ? 2600 : 1900);
    if (n !== generacion) return;
    M = { img, rect, ley: (T.leyenda ? T.leyenda() : []) };
  } catch (e) { console.error(e); aviso('No se pudo preparar el mapa del recuadro.', true); }
  if (n === generacion) { cargando.hidden = true; listaLey(); pintar(); }
}
async function prepararMapa(ajustar) {
  const G = window.EMTE_GUARDAR; if (!G) return;
  if (ajustar && G.aspecto) G.aspecto(aspectoMapa(D.orient));   // el recuadro toma la forma del marco de la hoja: el mapa sale alto
  await capturar();
}
async function abrir() {
  const G = window.EMTE_GUARDAR, T = window.EMTE_TOPO;
  if (!G || !T || !G.escenaDelMarco()) return;
  if (!D.autor) D.autor = usuario();
  aForm(); fondo.hidden = false; aviso('');
  await Promise.all([logos(), cargarLimite()]);
  await prepararMapa(true);
}

/* ---------- mover y acercar el mapa del geovisor desde la vista previa ---------- */
const sceneEl = document.getElementById('scene');
const centro = () => [500 - panX / scale, 380 - panY / scale];
const ponerCentro = (x, y) => { panX = (500 - x) * scale; panY = (380 - y) * scale; zoom(1); };
function moverPx(dx, dy) {   // desplaza el contenido del recuadro dx, dy píxeles de pantalla
  const a = sceneEl.getScreenCTM()?.a || 1, [x, y] = centro(); ponerCentro(x - dx / a, y - dy / a);
}
function acercar(f) {   // acerca o aleja manteniendo el centro del recuadro
  const G = window.EMTE_GUARDAR, r = G.escenaDelMarco(); if (!r) return;
  const P = new DOMPoint(r.r.left + r.r.width / 2, r.r.top + r.r.height / 2), aEsc = () => P.matrixTransform(sceneEl.getScreenCTM().inverse());
  const q = aEsc(), [x, y] = centro(); scale = Math.max(.05, Math.min(480, scale * f)); ponerCentro(x, y);
  const q2 = aEsc(), [x2, y2] = centro(); ponerCentro(x2 + (q.x - q2.x), y2 + (q.y - q2.y));
}
let tCap = 0;
const recapturar = () => { clearTimeout(tCap); cargando.hidden = false; tCap = setTimeout(capturar, 350); };
fondo.querySelectorAll('.ct-ctrl button').forEach(b => b.onclick = () => { acercar(+b.dataset.z); recapturar(); });
let arr = null;
prev.addEventListener('pointerdown', e => {
  const hit = e.target.closest?.('.ct-hit'); if (!hit || !M) return;
  const s = prev.querySelector('svg'), g = s.querySelector('.ct-mapimg');
  arr = { x: e.clientX, y: e.clientY, k: s.getScreenCTM().a, g, id: e.pointerId }; prev.classList.add('moviendo');
  hit.setPointerCapture(e.pointerId); e.preventDefault();
});
prev.addEventListener('pointermove', e => {
  if (!arr || e.pointerId !== arr.id) return;
  arr.dx = (e.clientX - arr.x) / arr.k; arr.dy = (e.clientY - arr.y) / arr.k;   // en mm de la hoja
  arr.g && arr.g.setAttribute('transform', `translate(${arr.dx} ${arr.dy})`);
});
const soltar = e => {
  if (!arr || (e && e.pointerId !== arr.id)) return;
  const { dx = 0, dy = 0 } = arr; arr = null; prev.classList.remove('moviendo');
  if (!dx && !dy) return;
  const fw = MAPA_MM.fw || 1, pxPorMm = M.rect.r.width / fw;
  moverPx(dx * pxPorMm, dy * pxPorMm); recapturar();
};
prev.addEventListener('pointerup', soltar); prev.addEventListener('pointercancel', soltar);
prev.addEventListener('wheel', e => { if (!e.target.closest?.('.ct-hit')) return; e.preventDefault(); acercar(e.deltaY < 0 ? 1.25 : .8); recapturar(); }, { passive: false });

/* ---------- composición de la hoja ---------- */
let MAPA_MM = {};
function hoja() {
  const L0 = DIS[D.orient] || DIS.H, W = L0.W, H = L0.H, vert = D.orient === 'V';
  const s = document.createElementNS(NS, 'svg');
  s.setAttribute('xmlns', NS); s.setAttribute('viewBox', `0 0 ${W} ${H}`); s.setAttribute('font-family', FUENTE);
  let o = '';
  const T = (x, y, t, at = '') => { o += `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" ${/\bfill=/.test(at) ? '' : 'fill="#0B1D33" '}${at}>${esc(t)}</text>`; };
  const L = (x1, y1, x2, y2, at) => { o += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" ${at}/>`; };
  const corta = (t, n) => t.length > n ? t.slice(0, n - 1) + '…' : t;
  o += `<rect width="${W}" height="${H}" fill="#fff"/>`;
  o += `<rect x="5" y="5" width="${W - 10}" height="${H - 10}" fill="none" stroke="#0B1D33" stroke-width=".8"/><rect x="6.4" y="6.4" width="${W - 12.8}" height="${H - 12.8}" fill="none" stroke="#0B1D33" stroke-width=".25"/>`;
  if (D.clas) { T(W / 2, 3.9, D.clas, 'text-anchor="middle" font-size="3" font-weight="700" fill="#9B1C1C" letter-spacing=".6"'); T(W / 2, H - 1.6, D.clas, 'text-anchor="middle" font-size="3" font-weight="700" fill="#9B1C1C" letter-spacing=".6"'); }
  // rótulo
  if (LOGOS.ejercito_bolivia) o += `<image href="${LOGOS.ejercito_bolivia}" x="9" y="8" width="19" height="19" preserveAspectRatio="xMidYMid meet"/>`;
  if (LOGOS.emte) o += `<image href="${LOGOS.emte}" x="${W - 28}" y="8" width="19" height="19" preserveAspectRatio="xMidYMid meet"/>`;
  T(W / 2, 12.3, corta(D.inst.toUpperCase(), vert ? 70 : 95), `text-anchor="middle" font-size="${vert ? 2.5 : 2.9}" letter-spacing=".4" fill="#5A6B80"`);
  T(W / 2, 20.2, corta((D.tit || 'CARTA TEMÁTICA').toUpperCase(), vert ? 42 : 60), `text-anchor="middle" font-size="${vert ? 5.4 : 6.2}" font-weight="700" letter-spacing=".5"`);
  if (D.sub) T(W / 2, 25.6, corta(D.sub.toUpperCase(), vert ? 75 : 105), 'text-anchor="middle" font-size="3.1" fill="#1C3A66" letter-spacing=".3"');
  L(32, 28.6, W - 32, 28.6, 'stroke="#B79A5B" stroke-width=".6"');
  // mapa
  const caja = L0.mapa, r = M && M.rect, asp = r ? r.r.width / r.r.height : caja.w / caja.h;
  let fw = caja.w, fh = fw / asp; if (fh > caja.h) { fh = caja.h; fw = fh * asp; }
  const fx = caja.x + (caja.w - fw) / 2, fy = caja.y + (caja.h - fh) / 2; MAPA_MM = { fx, fy, fw, fh };
  o += `<defs><clipPath id="ct-clip"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}"/></clipPath></defs>`;
  o += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="#E9EDF2"/>`;
  o += `<g clip-path="url(#ct-clip)"><g class="ct-mapimg">`;
  if (M && M.img) o += `<image href="${M.img}" x="${fx}" y="${fy}" width="${fw}" height="${fh}" preserveAspectRatio="none"/>`;
  const TP = window.EMTE_TOPO;
  let zona = 19, sur = true, iv = 0, latC = -16, lonC = -68.7, G = null;
  if (r && TP) { [lonC, latC] = TP.deEscena(r.x + r.w / 2, r.y + r.h / 2); G = TP.lineasUTM(r, vert ? 6 : 7); zona = G.zona; sur = G.sur; iv = G.iv; }
  const aH = ([x, y]) => [fx + (x - r.x) / r.w * fw, fy + (y - r.y) / r.h * fh];
  if (G && D.cuad) { o += '<g fill="none" stroke="#0B1D33" stroke-width=".18" stroke-opacity=".7">'; [...G.ver, ...G.hor].forEach(l => { o += `<path d="M${l.pts.map(p => aH(p).map(v => v.toFixed(2)).join(' ')).join('L')}"/>`; }); o += '</g>'; }
  o += '</g></g>';
  if (G && D.cuad) {
    const ch = 'font-size="2.3"';
    G.ver.forEach(l => { const ph = l.pts.map(aH), a = TP.cruce(ph, 1, fy), b = TP.cruce(ph, 1, fy + fh);
      if (a && a[0] > fx + 4 && a[0] < fx + fw - 4) T(a[0], fy - 1.2, TP.etiqueta(l.v, iv), `text-anchor="middle" ${ch}`);
      if (b && b[0] > fx + 4 && b[0] < fx + fw - 4) T(b[0], fy + fh + 3.2, TP.etiqueta(l.v, iv), `text-anchor="middle" ${ch}`); });
    G.hor.forEach(l => { const ph = l.pts.map(aH), a = TP.cruce(ph, 0, fx), b = TP.cruce(ph, 0, fx + fw);
      if (a && a[1] > fy + 4 && a[1] < fy + fh - 4) T(fx - 1.1, a[1] + .8, TP.etiqueta(l.v, iv), `text-anchor="end" ${ch}`);
      if (b && b[1] > fy + 4 && b[1] < fy + fh - 4) T(fx + fw + 1.1, b[1] + .8, TP.etiqueta(l.v, iv), `text-anchor="start" ${ch}`); });
  }
  o += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="none" stroke="#0B1D33" stroke-width=".7"/>`;
  o += `<rect class="ct-hit" x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="transparent"/>`;
  // notas
  const notas = (D.notas || '').replace(/\s+/g, ' ').trim();
  T(11, L0.notaY, notas ? 'NOTAS: ' + corta(notas, vert ? 105 : 150) : 'Geovisor EMTE · Provincia Omasuyos, La Paz – Bolivia', 'font-size="2.1" fill="#3A4A60"');
  if (D.cuad && iv) T(W - 11, L0.notaY, 'Coordenadas del marco en ' + (iv >= 1000 ? 'kilómetros' : 'metros') + ' UTM, cada ' + miles(iv) + ' m', 'font-size="2" fill="#5A6B80" text-anchor="end"');

  /* bloques de información */
  const bloque = (col, titulo, alto) => { o += `<rect x="${col.x}" y="${col.y}" width="${col.w}" height="${alto}" fill="none" stroke="#0B1D33" stroke-width=".3"/><rect x="${col.x}" y="${col.y}" width="${col.w}" height="4.6" fill="#0B1D33"/>`; T(col.x + 2, col.y + 3.25, titulo, 'font-size="2.5" font-weight="700" fill="#fff" letter-spacing=".5"'); const y0 = col.y + 4.6; col.y += alto + 2; return y0; };
  const ubicacion = (col, alto) => {
    const y0 = bloque(col, 'MAPA DE UBICACIÓN', alto), ih = alto - 6.5, iw = col.w - 4, cx = col.x;
    const feats = (LIMITE && LIMITE.features) || []; let b = [180, 90, -180, -90];
    const amp = (lo, la) => { b = [Math.min(b[0], lo), Math.min(b[1], la), Math.max(b[2], lo), Math.max(b[3], la)]; };
    feats.forEach(f => (f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.flat() : f.geometry.coordinates).forEach(rg => rg.forEach(([lo, la]) => amp(lo, la))));
    let ext = null; if (r && TP) { const [a0, a1] = TP.deEscena(r.x, r.y), [b0, b1] = TP.deEscena(r.x + r.w, r.y + r.h); ext = [a0, b1, b0, a1]; amp(a0, a1); amp(b0, b1); }
    if (b[0] >= b[2]) return;
    const pad = .04, k = Math.cos(((b[1] + b[3]) / 2) * D2R), wd = (b[2] - b[0]) * k * (1 + 2 * pad), hd = (b[3] - b[1]) * (1 + 2 * pad), f = Math.min(iw / wd, ih / hd);
    const ox = cx + 2 + (iw - wd * f) / 2, oy = y0 + 1 + (ih - hd * f) / 2;
    const P = (lo, la) => [ox + ((lo - b[0]) * k + (b[2] - b[0]) * k * pad) * f, oy + ((b[3] - la) + (b[3] - b[1]) * pad) * f];
    o += `<rect x="${cx + 2}" y="${y0 + 1}" width="${iw}" height="${ih}" fill="#DCE8F2"/>`;
    feats.forEach(fe => { const rs = fe.geometry.type === 'MultiPolygon' ? fe.geometry.coordinates.flat() : fe.geometry.coordinates; o += `<path d="${rs.map(rg => 'M' + rg.map(([lo, la]) => P(lo, la).map(v => v.toFixed(2)).join(' ')).join('L') + 'Z').join('')}" fill="#E8EFD9" stroke="#5B7B1C" stroke-width=".3" fill-rule="evenodd"/>`; });
    if (ext) { const [p0, p1] = [P(ext[0], ext[3]), P(ext[2], ext[1])]; o += `<rect x="${p0[0].toFixed(2)}" y="${p0[1].toFixed(2)}" width="${(p1[0] - p0[0]).toFixed(2)}" height="${(p1[1] - p0[1]).toFixed(2)}" fill="#C0392B22" stroke="#C0392B" stroke-width=".5"/>`; }
    T(cx + col.w / 2, y0 + alto - 5.4, 'Provincia Omasuyos · La Paz · Bolivia', 'text-anchor="middle" font-size="1.9" fill="#3A4A60"');
  };
  const escalaNorte = (col, alto) => {
    const y0 = bloque(col, 'ESCALA Y NORTE', alto), cx = col.x, cw = col.w, mit = cx + cw * .62;
    if (!r) return;
    const mPorU = R * Math.cos(latC * D2R) / K, metrosAncho = r.w * mPorU, den = metrosAncho / (fw / 1000);
    const red = den > 20000 ? 1000 : den > 2000 ? 100 : 10, denR = Math.round(den / red) * red;
    T((cx + mit) / 2, y0 + 6.5, '1 : ' + miles(denR), 'text-anchor="middle" font-size="4.2" font-weight="700"');
    const mmPorM = fw / metrosAncho, maxM = (mit - cx - 7) / mmPorM, pb = 10 ** Math.floor(Math.log10(maxM)), largo = [5, 2, 1].map(q => q * pb).find(v => v <= maxM), bw = largo * mmPorM, bx = cx + (mit - cx - bw) / 2;
    for (let i = 0; i < 4; i++) o += `<rect x="${(bx + i * bw / 4).toFixed(2)}" y="${y0 + 9}" width="${(bw / 4).toFixed(2)}" height="1.5" fill="${i % 2 ? '#fff' : '#0B1D33'}" stroke="#0B1D33" stroke-width=".2"/>`;
    const fl = v => v >= 1000 ? dec(v / 1000, v % 1000 ? 1 : 0) + ' km' : miles(v) + ' m';
    T(bx, y0 + 13.6, '0', 'text-anchor="middle" font-size="2"'); T(bx + bw / 2, y0 + 13.6, fl(largo / 2).replace(/ k?m$/, ''), 'text-anchor="middle" font-size="2"'); T(bx + bw, y0 + 13.6, fl(largo), 'text-anchor="middle" font-size="2"');
    T((cx + mit) / 2, y0 + 18.3, 'Válida impresa en ' + D.papel + ' al 100 %', 'text-anchor="middle" font-size="1.8" fill="#5A6B80"');
    L(mit, y0 + 1.5, mit, y0 + 19, 'stroke="#D7DEE8" stroke-width=".25"');
    const nx = (mit + cx + cw) / 2, ny = y0 + 10.5;
    o += `<path d="M${nx} ${ny - 7}L${nx + 3} ${ny + 5}L${nx} ${ny + 3}Z" fill="#0B1D33"/><path d="M${nx} ${ny - 7}L${nx - 3} ${ny + 5}L${nx} ${ny + 3}Z" fill="#fff" stroke="#0B1D33" stroke-width=".3"/>`;
    T(nx, ny - 8.2, 'N', 'text-anchor="middle" font-size="3.2" font-weight="700"');
    const conv = Math.atan(Math.tan((lonC - ((zona - 1) * 6 - 177)) * D2R) * Math.sin(latC * D2R)) / D2R;
    T(nx, ny + 8.6, 'Conv. ' + dec(conv, 2) + '°', 'text-anchor="middle" font-size="1.8" fill="#5A6B80"');
  };
  const leyenda = (col, alto) => {
    const y0 = bloque(col, 'LEYENDA', alto), cx = col.x, cw = col.w;
    const it = itemsLey().filter(q => !D.leyOff.includes(q.nombre));
    if (!it.length) { T(cx + 2, y0 + 5, 'Sin elementos elegidos', 'font-size="2" fill="#8796A8"'); return; }
    const filas = Math.max(1, Math.floor((alto - 6) / 3.6)), dosCol = it.length > filas && cw > 55, colW = dosCol ? cw / 2 : cw, max = dosCol ? 20 : Math.round(cw / 1.9);
    const caben = dosCol ? filas * 2 : filas;
    it.slice(0, caben).forEach((q, n) => {
      const c = dosCol ? Math.floor(n / filas) : 0, fila = dosCol ? n % filas : n, x = cx + 1.8 + c * colW, yy = y0 + 4 + fila * 3.6, ym = yy - .9;
      if (q.tipo === 'sim') o += `<g transform="translate(${x + 2.5} ${ym}) scale(.17)">${q.s}</g>`;
      else if (q.tipo === 'linea') L(x, ym, x + 5, ym, `stroke="${q.color}" stroke-width=".8"`);
      else if (q.tipo === 'area') o += `<rect x="${x}" y="${ym - 1.3}" width="5" height="2.6" fill="${q.color}" fill-opacity=".4" stroke="${q.color}" stroke-width=".3"/>`;
      else if (q.tipo === 'marco') o += `<rect x="${x}" y="${ym - 1.3}" width="5" height="2.6" fill="none" stroke="#0B1D33" stroke-width=".5"/>`;
      else if (q.tipo === 'cuad') o += `<path d="M${x} ${ym - 1.3}h5M${x} ${ym + 1.3}h5M${x + 1.2} ${ym - 1.8}v3.6M${x + 3.8} ${ym - 1.8}v3.6" stroke="${q.color}" stroke-width=".2" fill="none"/>`;
      else o += `<circle cx="${x + 2.5}" cy="${ym}" r="1.1" fill="${q.color}" stroke="#fff" stroke-width=".2"/>`;
      T(x + 6.5, yy, corta(q.nombre, max), 'font-size="2.1"');
    });
    if (it.length > caben) T(cx + cw - 2, y0 + alto - 5.6, `y ${it.length - caben} más…`, 'text-anchor="end" font-size="1.8" fill="#5A6B80"');
  };
  const datos = (col, alto) => {
    const y0 = bloque(col, 'DATOS TÉCNICOS', alto), cx = col.x;
    const ctr = TP && r ? TP.textos(latC, lonC).utm : '—', hoy = new Date();
    const fuente = D.fuente || 'Capas del Geovisor EMTE; ' + ((document.querySelector('.basemap-credit')?.textContent || 'sin mapa base').trim());
    const n = Math.round(col.w / 1.55);
    [['Datum', 'WGS 84'], ['Proyección', `UTM zona ${zona} ${sur ? 'Sur' : 'Norte'}`], ['Centro', ctr], ['Fecha', hoy.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })], ['Fuente', fuente]].forEach(([k, v], i) => {
      T(cx + 2, y0 + 3.6 + i * 3.1, k, 'font-size="1.9" fill="#5A6B80"'); T(cx + 15, y0 + 3.6 + i * 3.1, corta(v, n - 10), 'font-size="2" font-weight="600"');
    });
  };
  const responsabilidad = (col, alto) => {
    const y0 = bloque(col, 'RESPONSABILIDAD' + (D.num ? ' · CARTA N.º ' + D.num : ''), alto), cx = col.x, cw = col.w;
    [['ELABORÓ', D.autor], ['REVISÓ', D.rev], ['APROBÓ', D.apr]].forEach(([k, v], i) => {
      const yy = y0 + 5 + i * 5;
      T(cx + 2, yy, k, 'font-size="1.9" font-weight="700" fill="#5A6B80" letter-spacing=".3"'); T(cx + 15, yy, corta((v || '').toUpperCase(), Math.round(cw / 2.4)), 'font-size="2.1" font-weight="600"');
      L(cx + cw - 16, yy + .6, cx + cw - 2, yy + .6, 'stroke="#8796A8" stroke-width=".2"');
      if (!i) T(cx + cw - 9, y0 + 3.3, 'FIRMA', 'text-anchor="middle" font-size="1.5" fill="#8796A8"');
    });
  };
  if (!vert) {   // horizontal: columna a la derecha del mapa
    const col = { x: 219, w: W - 9 - 219, y: 33 }, fin = H - 13, altoDatos = 22, altoResp = D.resp ? 21 : 0;
    if (D.ubic) ubicacion(col, 40);
    escalaNorte(col, 25);
    if (D.ley) leyenda(col, Math.max(16, fin - col.y - altoDatos - 2 - (altoResp ? altoResp + 2 : 0)));
    else col.y = fin - altoDatos - (altoResp ? altoResp + 2 : 0);
    datos(col, altoDatos); if (D.resp) responsabilidad(col, altoResp);
  } else {       // vertical: tres columnas debajo del mapa
    const top = 202, fin = 284, gap = 3, cw = (W - 20 - 2 * gap) / 3;
    const c1 = { x: 10, w: cw, y: top }, c2 = { x: 10 + cw + gap, w: cw, y: top }, c3 = { x: 10 + 2 * (cw + gap), w: cw, y: top };
    if (D.ubic) ubicacion(c1, fin - top - 27); escalaNorte(c1, 25);
    if (D.ley) leyenda(c2, fin - top); else { datos(c2, 22); }
    if (D.ley) datos(c3, 22); if (D.resp) responsabilidad(c3, 21);
  }
  s.innerHTML = o;
  return s;
}
function pintar() { if (fondo.hidden) return; const viejo = prev.querySelector('svg'); const s = hoja(); viejo ? viejo.replaceWith(s) : prev.append(s); }

/* ---------- descarga ---------- */
async function descargar() {
  const b = fondo.querySelector('.ct-ok'); if (b.disabled) return;
  deForm(); b.disabled = true; aviso('Dibujando la carta…');
  try {
    const L0 = DIS[D.orient] || DIS.H, k = D.papel === 'A3' ? 420 / 297 : 1, mmW = L0.W * k, mmH = L0.H * k, ppp = D.papel === 'A3' ? 150 : 200;
    const Wp = Math.round(mmW / 25.4 * ppp), Hp = Math.round(mmH / 25.4 * ppp);
    const s = hoja(); s.querySelector('.ct-hit')?.remove(); s.setAttribute('width', Wp); s.setAttribute('height', Hp);
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(s)], { type: 'image/svg+xml' }));
    const img = await new Promise((ok, mal) => { const i = new Image(); i.onload = () => ok(i); i.onerror = mal; i.src = url; });
    const cv = document.createElement('canvas'); cv.width = Wp; cv.height = Hp; const c = cv.getContext('2d');
    c.fillStyle = '#fff'; c.fillRect(0, 0, Wp, Hp); c.drawImage(img, 0, 0, Wp, Hp); URL.revokeObjectURL(url);
    const nombre = ((D.tit || 'CARTA') + (D.num ? '_' + D.num : '') + '_' + new Date().toISOString().slice(0, 10)).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_').replace(/_+/g, '_');
    let blob; const ext = D.fmt;
    if (D.fmt === 'png') blob = await new Promise(r => cv.toBlob(r, 'image/png'));
    else {
      const jpg = await new Promise(r => cv.toBlob(r, 'image/jpeg', .92));
      blob = D.fmt === 'jpg' ? jpg : window.EMTE_TOPO.pdfDesdeJPEG(new Uint8Array(await jpg.arrayBuffer()), Wp, Hp, +(mmW / 25.4 * 72).toFixed(2), +(mmH / 25.4 * 72).toFixed(2), D.tit || 'Carta');
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre + '.' + ext; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    aviso(`✔ ${nombre}.${ext} (${D.papel} ${D.orient === 'V' ? 'vertical' : 'horizontal'}, ${Wp} × ${Hp} px)`);
  } catch (e) { console.error(e); aviso('No se pudo generar la carta. Vuelve a intentarlo.', true); }
  finally { b.disabled = false; }
}
fondo.querySelector('.ct-ok').onclick = descargar;
window.EMTE_CARTA = { abrir };
});
