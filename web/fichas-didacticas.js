/* Fichas didácticas (agregado por BYNS7, 02-11-2026). Planeamiento › FICHAS (catálogo de símbolos del calco).
   1. Ficha de aprendizaje: ⓘ en cada símbolo → símbolo grande, qué representa, colores, cómo se completa,
      página del reglamento, «Colocar en el mapa» y ★ favorito. Las tareas tácticas traen propósito, efectos y condiciones.
   2. Armador de símbolos: afiliación → tipo → arma → escalón, con vista previa; coloca el símbolo con su escalón.
   (El modo práctica se quitó a pedido el 02-11-2026.)
   4. Vista en cuadrícula o lista, recientes y favoritos arriba del catálogo.
   Solo usuarios registrados (el catálogo es parte del calco). */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const esc = s => String(s ?? '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem('emte-fichas-' + k)) ?? d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem('emte-fichas-' + k, JSON.stringify(v)); } catch (e) {} } };
const REGL = 'assets/reglamento-simbologia.pdf';
const PAG = { '1': 3, '2': 4, '3': 5, '4': 6, '5': 19, '6': 20, '7': 24, '8': 14, '9': 12, '10': 13, '11': 25, '12': 25, '13': 25, '14': 25, '15': 25, '16': 25, '17': 10, '18': 10, '19': 26, '20': 12, '21': 2, '22': 3 };
const pag = cat => PAG[(String(cat).match(/^(\d+)\./) || [])[1]] || 2;
const COLOR = { Propio: '#0033cc', Enemigo: '#e00000', 'Obstáculo': '#00a030', Contaminado: '#c9a800', Negro: '#111111' };
const QUE = {
  '1': 'Marcos básicos. La forma del marco dice QUÉ es: rectángulo = unidad, círculo = instalación, rectángulo con asta = puesto de comando, triángulo = puesto de observación.',
  '2': 'Armas. El signo que va DENTRO del marco indica el arma de la unidad: X = infantería, diagonal = caballería, punto = artillería, E = ingeniería, rayo = comunicaciones, óvalo = blindados.',
  '3': 'Especialidades. Se dibujan dentro del marco, solas o junto al signo del arma, para mostrar una capacidad particular de la unidad.',
  '4': 'Servicios. Unidades de apoyo logístico (abastecimiento, sanidad, transporte, mantenimiento…), con su signo dentro del marco.',
  '5': 'Instalaciones y puestos. Lugares fijos (depósitos, puestos, SPAC) que se ubican sobre el terreno con el marco de instalación.',
  '6': 'Unidades combinadas. Dos o más signos dentro del mismo marco: el arma principal más la especialidad o el medio (por ejemplo, infantería mecanizada).',
  '7': 'Puestos de comando. El asta señala con exactitud el lugar del puesto; el marco indica la unidad a la que pertenece.',
  '8': 'Puntos de control. Puntos de referencia de la maniobra (puntos de contacto, de coordinación, de partida…) que todas las unidades usan para coordinarse.',
  '9': 'Minas y trampas. Obstáculos artificiales: campos minados, minas aisladas y trampas explosivas.',
  '10': 'Fortificaciones. Obras de protección del terreno: trincheras, refugios, posiciones preparadas.',
  '11': 'Enemigo. Los mismos conceptos que los símbolos propios, pero con el marco del enemigo y en ROJO, para distinguirlos de un vistazo.',
  '17': 'Líneas tácticas. Se trazan sobre el mapa para ordenar la maniobra: límites, líneas de partida, de seguridad, de detención…',
  '18': 'Zonas y áreas. Superficies con una función en la operación: zonas de reunión, áreas de responsabilidad, objetivos.',
  '19': 'Líneas y zonas del enemigo, en rojo.', '20': 'Obstáculos, en verde: lo que detiene, retarda o canaliza el movimiento.',
  '21': 'Áreas contaminadas, en amarillo (QBRN).', '22': 'Obras y poblaciones, en negro.'
};
const que = cat => { const n = (String(cat).match(/^(\d+)\./) || [])[1]; return QUE[n] || (+n >= 11 && +n <= 16 ? QUE['11'] + ' ' + (QUE[String(n - 10)] || '') : /tareas/i.test(cat) ? 'Tarea táctica: verbo que ordena QUÉ debe hacer la unidad. El símbolo se dibuja sobre el calco en el lugar donde se cumple la tarea.' : 'Símbolo del reglamento de símbolos convencionales militares.'); };
const ESC = [['', 'Sin escalón'], ['▲', '▲ Equipo'], ['●', '● Escuadra'], ['●●', '●● Sección'], ['I', 'I Compañía / Escuadrón / Batería'], ['II', 'II Batallón / Grupo'], ['III', 'III Regimiento'], ['X', 'X Brigada'], ['XX', 'XX División'], ['XXX', 'XXX Cuerpo de Ejército']];
const NOMESC = { '▲': 'Equipo', '●': 'Escuadra', '●●': 'Sección', 'I': 'Compañía', 'II': 'Batallón', 'III': 'Regimiento', 'X': 'Brigada', 'XX': 'División', 'XXX': 'Cuerpo de Ejército' };

/* ---------- estilos ---------- */
const css = h('style');
css.textContent = `
.ff-bar{display:grid;grid-template-columns:1fr auto;gap:6px;margin:8px 0 6px}
.ff-btn{display:flex;align-items:center;justify-content:center;gap:7px;padding:10px 8px;border:0;border-radius:10px;color:#fff;font:800 10.5px var(--tipo-titulo,system-ui);letter-spacing:.06em;cursor:pointer;box-shadow:0 3px 10px #0B1D3333;transition:transform .12s,box-shadow .12s}
.ff-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px #0B1D3344}
.ff-btn.arm{background:linear-gradient(135deg,#1F5AA6,#12294A)}.ff-btn.pra{background:linear-gradient(135deg,#B79A5B,#8A6D2F)}
.ff-btn.vis{background:#fff;color:#12294A;border:1px solid #D7DEE8;box-shadow:none;padding:10px 12px}
.ff-tira{margin:4px 0 8px;padding:7px 8px;border-radius:10px;background:#F8FAFC;border:1px solid #E3E8EF}
.ff-tira b{display:block;margin:0 0 5px;font:800 9.5px var(--tipo-titulo,system-ui);letter-spacing:.12em;color:#8A6D2F}
.ff-tira .ch{display:flex;flex-wrap:wrap;gap:5px}
.ff-ch{display:inline-flex;align-items:center;gap:5px;max-width:100%;padding:3px 9px 3px 3px;border:1px solid #D7DEE8;border-radius:16px;background:#fff;font-size:10.5px;color:#14233A;cursor:pointer}
.ff-ch:hover{border-color:#B79A5B;background:#FBF8F0}.ff-ch svg{width:22px;height:22px;flex:none;border-radius:50%;background:#EEF2F8}
.ff-ch span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}
.calco-it{position:relative}
.calco-it .ff-i{position:absolute;right:6px;top:50%;transform:translateY(-50%);width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#EEF2F8;color:#12294A;font:800 11px Georgia,serif;font-style:italic;opacity:.75;transition:all .12s}
.calco-it:hover .ff-i{opacity:1}.calco-it .ff-i:hover{background:#B79A5B;color:#fff;transform:translateY(-50%) scale(1.12)}
.calco-it .ff-star{position:absolute;right:30px;top:50%;transform:translateY(-50%);color:#B79A5B;font-size:12px}
#calco-cat.ff-cuad details[open]{padding-bottom:6px}
#calco-cat.ff-cuad .calco-it{display:inline-flex!important;flex-direction:column;align-items:center;justify-content:flex-start;width:calc(33.33% - 6px);margin:3px;min-height:92px;padding:8px 4px 6px!important;border:1px solid #E3E8EF!important;border-radius:10px!important;text-align:center;vertical-align:top;font-size:10px!important;line-height:1.2;transition:transform .12s,box-shadow .12s}
#calco-cat.ff-cuad .calco-it:hover{transform:translateY(-2px);box-shadow:0 6px 14px #0B1D3322;border-color:#B79A5B!important}
#calco-cat.ff-cuad .calco-it svg{width:46px!important;height:46px!important}
#calco-cat.ff-cuad .calco-it .ff-i{top:6px;right:6px;transform:none;width:17px;height:17px;font-size:10px}#calco-cat.ff-cuad .calco-it .ff-i:hover{transform:scale(1.12)}
#calco-cat.ff-cuad .calco-it .ff-star{top:5px;left:7px;right:auto;transform:none}
.ff-dlg .ff-cuerpo,.ff-dlg .ff-cuerpo *,.ff-ch span{text-transform:none!important}
.ff-fondo{position:fixed;inset:0;z-index:72;display:grid;place-items:center;background:#0B1D33b3;animation:ff-in .18s ease}
.ff-fondo[hidden]{display:none}
@keyframes ff-in{from{opacity:0}to{opacity:1}}
.ff-dlg{width:min(680px,94vw);max-height:92vh;display:flex;flex-direction:column;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 24px 70px #000a;font:12.5px var(--tipo-texto,system-ui);color:#14233A;animation:ff-sube .22s ease}
@keyframes ff-sube{from{transform:translateY(14px)}to{transform:none}}
.ff-cab{display:flex;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(135deg,#0B1D33,#1C3A66);color:#fff;border-bottom:3px solid #B79A5B}
.ff-cab b{font:800 13px var(--tipo-titulo,system-ui);letter-spacing:.1em}.ff-cab small{opacity:.75;font-size:11px}
.ff-cab button{margin-left:auto;border:0;background:#ffffff22;width:30px;height:30px;border-radius:50%;color:#fff;font-size:18px;cursor:pointer}
.ff-cuerpo{overflow:auto;padding:16px}
.ff-ficha{display:grid;grid-template-columns:200px 1fr;gap:18px}
.ff-sim{display:grid;place-items:center;aspect-ratio:1;border-radius:14px;background:radial-gradient(circle at 50% 40%,#fff,#EEF2F8);border:1px solid #E3E8EF}
.ff-sim svg{width:82%;height:82%}
.ff-ficha h3{margin:0 0 6px;font:800 17px var(--tipo-titulo,system-ui);color:#0B1D33;text-transform:none}
.ff-chips{display:flex;flex-wrap:wrap;gap:5px;margin:0 0 10px}
.ff-chip{padding:3px 9px;border-radius:12px;font:700 10px var(--tipo-titulo,system-ui);letter-spacing:.05em;color:#fff}
.ff-sec{margin:10px 0 0;padding:9px 11px;border-radius:9px;background:#F8FAFC;border-left:4px solid #B79A5B}
.ff-sec b{display:block;margin:0 0 4px;font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.1em;color:#8A6D2F}
.ff-sec ul{margin:0;padding-left:17px}.ff-sec li{margin:2px 0}
.ff-acc{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;border-top:1px solid #E3E8EF;background:#F8FAFC}
.ff-acc button,.ff-acc a{padding:9px 14px;border:1px solid #12294A;border-radius:8px;background:#fff;color:#12294A;font:800 11px var(--tipo-titulo,system-ui);letter-spacing:.05em;cursor:pointer;text-decoration:none}
.ff-acc .pri{background:#12294A;color:#fff}.ff-acc .pri:hover{background:#B79A5B;border-color:#B79A5B}
.ff-acc .oro{border-color:#B79A5B;color:#8A6D2F}.ff-acc .oro.on{background:#B79A5B;color:#fff}
.ff-pasos{display:grid;gap:12px}
.ff-paso b{display:flex;align-items:center;gap:8px;margin:0 0 6px;font:800 10.5px var(--tipo-titulo,system-ui);letter-spacing:.1em;color:#12294A}
.ff-paso b i{display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#B79A5B;color:#fff;font-style:normal;font-size:11px}
.ff-op{display:flex;flex-wrap:wrap;gap:6px}
.ff-op button{display:flex;align-items:center;gap:6px;padding:6px 10px;border:1px solid #D7DEE8;border-radius:9px;background:#fff;font:600 11.5px var(--tipo-texto,system-ui);color:#14233A;cursor:pointer}
.ff-op button svg{width:28px;height:28px}
.ff-op button.on{border-color:#12294A;background:#12294A;color:#fff;box-shadow:0 3px 10px #12294A55}
.ff-arm{display:grid;grid-template-columns:1fr 210px;gap:16px}
.ff-prev{position:sticky;top:0;display:grid;gap:8px;align-content:start;text-align:center}
.ff-prev .ff-sim{width:210px}
.ff-prev p{margin:0;font:800 13px var(--tipo-titulo,system-ui);color:#0B1D33}
.ff-q{display:grid;gap:14px;justify-items:center;text-align:center}
.ff-q .ff-sim{width:190px}
.ff-q .pr{font:800 14px var(--tipo-titulo,system-ui);color:#0B1D33}
.ff-res{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
.ff-res button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:8px 10px;border:2px solid #D7DEE8;border-radius:11px;background:#fff;font:700 12px var(--tipo-texto,system-ui);color:#14233A;cursor:pointer;transition:all .12s}
.ff-res button:hover{border-color:#12294A}.ff-res button svg{width:56px;height:56px}
.ff-res button.bien{border-color:#1E8B4C;background:#E6F4EC}.ff-res button.mal{border-color:#C0392B;background:#FBEAEA}
.ff-barra{width:100%;height:8px;border-radius:4px;background:#E3E8EF;overflow:hidden}.ff-barra span{display:block;height:100%;background:linear-gradient(90deg,#B79A5B,#1E8B4C);transition:width .3s}
.ff-pt{display:flex;justify-content:space-between;width:100%;font:800 11px var(--tipo-titulo,system-ui);color:#5A6B80;letter-spacing:.06em}
.ff-final{font:800 34px var(--tipo-titulo,system-ui);color:#0B1D33}
.ff-err{display:grid;gap:6px;width:100%;text-align:left}.ff-err div{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:8px;background:#FBEAEA}.ff-err svg{width:36px;height:36px;flex:none}
.ff-sel{padding:6px 8px;border:1px solid #CDD6E2;border-radius:6px;font:12px var(--tipo-texto,system-ui)}
@media(max-width:620px){.ff-ficha,.ff-arm{grid-template-columns:1fr}.ff-sim,.ff-prev .ff-sim{width:150px;margin:auto}.ff-res{grid-template-columns:1fr}}`;
document.head.append(css);

/* ---------- datos ---------- */
let CAT = null, SVG = {}, TT = {};
Promise.all([fetch('planeamiento/simbolos.json').then(r => r.ok ? r.json() : null).catch(() => null), fetch('planeamiento/tareas_tacticas.json').then(r => r.ok ? r.json() : null).catch(() => null)])
  .then(([s, t]) => { if (!s) return; CAT = s.cat; SVG = s.svg; (t?.tareas || []).forEach(x => TT[x.key] = x); iniciar(); });
const info = k => CAT && CAT.find(c => c.key === k);
const icono = (k, color) => `<svg viewBox="0 0 200 200" style="color:${color || COLOR[info(k)?.bando] || '#0033cc'}">${SVG[k] || ''}</svg>`;

/* ---------- ventana genérica ---------- */
const fondo = h('div', 'ff-fondo'); fondo.hidden = true; document.body.append(fondo);
fondo.addEventListener('click', e => { if (e.target === fondo) cerrar(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !fondo.hidden) cerrar(); });
function ventana(titulo, sub, cuerpo, acciones) {
  fondo.replaceChildren(); const d = h('div', 'ff-dlg'), cab = h('div', 'ff-cab'), x = h('button', null, '×'); x.type = 'button'; x.onclick = cerrar;
  const t = h('div'); t.append(h('b', null, titulo)); if (sub) { t.append(h('br'), h('small', null, sub)); } cab.append(t, x);
  const c = h('div', 'ff-cuerpo'); c.append(cuerpo); d.append(cab, c); if (acciones) d.append(acciones); fondo.append(d); fondo.hidden = false; return d;
}
function cerrar() { fondo.hidden = true; fondo.replaceChildren(); }
const boton = (t, fn, cls) => { const b = h('button', cls || null, t); b.type = 'button'; b.onclick = fn; return b; };

/* ---------- recientes y favoritos ---------- */
let REC = LS.get('rec', []), FAV = LS.get('fav', []);
function usar(k) { REC = [k, ...REC.filter(x => x !== k)].slice(0, 8); LS.set('rec', REC); tiras(); }
function favorito(k) { FAV = FAV.includes(k) ? FAV.filter(x => x !== k) : [k, ...FAV]; LS.set('fav', FAV); tiras(); marcar(); }
function colocar(k) { const b = document.querySelector(`#calco-cat .calco-it[data-key="${CSS.escape(k)}"]`); if (b) { b.click(); usar(k); } }

/* ---------- 1. ficha de aprendizaje ---------- */
function ficha(k) {
  const c = info(k); if (!c) return;
  const tt = TT[k], col = COLOR[c.bando] || '#0033cc', cuerpo = h('div', 'ff-ficha');
  const sim = h('div', 'ff-sim'); sim.innerHTML = icono(k, col);
  const der = h('div'); der.append(h('h3', null, c.nombre));
  const chips = h('div', 'ff-chips'), ch = (t, bg) => { const s = h('span', 'ff-chip', t); s.style.background = bg; chips.append(s); };
  ch(c.cat.replace(/^\d+\.\s*/, ''), '#12294A'); ch(c.bando.toUpperCase(), col); der.append(chips);
  const sec = (tit, contenido) => { const s = h('div', 'ff-sec'); s.append(h('b', null, tit)); if (Array.isArray(contenido)) { const u = h('ul'); contenido.forEach(x => u.append(h('li', null, x))); s.append(u); } else s.append(document.createTextNode(contenido)); der.append(s); };
  if (tt) { sec('PROPÓSITO', cap(tt.prop)); if (tt.efecto?.length) sec('EFECTOS QUE BUSCA', tt.efecto.map(cap)); if (tt.cond?.length) sec('CONDICIONES', tt.cond.map(cap)); }
  else sec('¿QUÉ REPRESENTA?', que(c.cat));
  sec('COLOR', `${c.bando === 'Enemigo' ? 'Rojo: fuerzas enemigas.' : c.bando === 'Propio' ? 'Azul: fuerzas propias.' : c.bando + '.'} El color permite distinguir de un vistazo a quién pertenece el símbolo.`);
  if (!tt && !/^(1[7-9]|2[0-2])\./.test(c.cat)) sec('CÓMO SE COMPLETA EN EL CALCO', ['Escalón arriba del marco (● escuadra … I compañía, II batallón, III regimiento, X brigada, XX división).', 'Designación de la unidad a la izquierda y de la unidad superior a la derecha.', '«Previsto»: el marco se dibuja con línea discontinua cuando la unidad o instalación aún no está en el lugar.']);
  cuerpo.append(sim, der);
  const acc = h('div', 'ff-acc');
  acc.append(boton('📍 COLOCAR EN EL MAPA', () => { cerrar(); colocar(k); }, 'pri'));
  const fv = boton(FAV.includes(k) ? '★ EN FAVORITOS' : '☆ AGREGAR A FAVORITOS', () => { favorito(k); fv.textContent = FAV.includes(k) ? '★ EN FAVORITOS' : '☆ AGREGAR A FAVORITOS'; fv.classList.toggle('on', FAV.includes(k)); }, 'oro' + (FAV.includes(k) ? ' on' : ''));
  const a = h('a', null, '📖 REGLAMENTO · PÁG. ' + pag(c.cat)); a.href = REGL + '#page=' + pag(c.cat); a.target = '_blank'; a.rel = 'noopener';
  acc.append(fv, a);
  ventana('FICHA DE APRENDIZAJE', c.cat, cuerpo, acc);
}
const cap = s => { s = String(s || '').toLowerCase().replace(/\beno\b\.?/g, 'enemigo').replace(/combamte/g, 'combate'); return s.charAt(0).toUpperCase() + s.slice(1); };

/* ---------- 2. armador de símbolos ---------- */
function armador() {
  const S = Object.assign({ af: 'Propio', tipo: 'unidad', arma: 'inf', esc: 'I' }, LS.get('arm', {}));
  const ARMAS = ['inf', 'cab', 'art', 'ing', 'com', 'arm', 'avi', 'ave'].filter(a => SVG['u_' + a]);
  const nomArma = a => (info('u_' + a)?.nombre || a).replace(/^unidad (de|del) /i, '').toLowerCase();
  const TIPOS = { Propio: [['unidad', 'Unidad'], ['instalacion', 'Instalación'], ['puesto_comando', 'Puesto de comando'], ['puesto_observacion', 'Puesto de observación']], Enemigo: [['unidad', 'Unidad'], ['instalacion', 'Instalación'], ['puesto_observacion', 'Puesto de observación']] };
  const clave = () => {   // símbolo del catálogo que se coloca
    if (S.tipo === 'unidad') return (S.af === 'Enemigo' ? 'eno_u_' : 'u_') + S.arma;
    return S.af === 'Enemigo' ? { instalacion: 'eno_instalacion', puesto_observacion: 'eno_po' }[S.tipo] || 'eno_unidad' : S.tipo;
  };
  const cuerpo = h('div', 'ff-arm'), pasos = h('div', 'ff-pasos'), prev = h('div', 'ff-prev'), sim = h('div', 'ff-sim'), nom = h('p');
  prev.append(sim, nom); cuerpo.append(pasos, prev);
  function paso(n, titulo, ops) { const d = h('div', 'ff-paso'), b = h('b'); b.append(h('i', null, n), document.createTextNode(titulo)); const o = h('div', 'ff-op'); ops.forEach(x => o.append(x)); d.append(b, o); return d; }
  const op = (txt, on, fn, svg) => { const b = h('button', on ? 'on' : null); b.type = 'button'; if (svg) b.innerHTML = svg; b.append(document.createTextNode(txt)); b.onclick = () => { fn(); pintar(); }; return b; };
  function nombre() {
    const e = NOMESC[S.esc] || '', t = S.tipo === 'unidad' ? (e ? e + ' de ' : 'Unidad de ') + nomArma(S.arma) : (TIPOS[S.af].find(x => x[0] === S.tipo) || [0, ''])[1];
    return t.charAt(0).toUpperCase() + t.slice(1) + (S.af === 'Enemigo' ? ' (enemiga)' : ' (propia)');
  }
  function pintar() {
    if (!TIPOS[S.af].some(x => x[0] === S.tipo)) S.tipo = 'unidad'; LS.set('arm', S);
    const col = COLOR[S.af], k = clave();
    pasos.replaceChildren(
      paso(1, 'AFILIACIÓN', ['Propio', 'Enemigo'].map(a => op(a === 'Propio' ? 'Propia (azul)' : 'Enemiga (rojo)', S.af === a, () => S.af = a, icono(a === 'Propio' ? 'unidad' : 'eno_unidad', COLOR[a])))),
      paso(2, 'TIPO', TIPOS[S.af].map(([t, n]) => op(n, S.tipo === t, () => S.tipo = t, icono(S.af === 'Enemigo' ? { unidad: 'eno_unidad', instalacion: 'eno_instalacion', puesto_observacion: 'eno_po' }[t] : t, col)))),
      ...(S.tipo === 'unidad' ? [paso(3, 'ARMA', ARMAS.map(a => op(nomArma(a), S.arma === a, () => S.arma = a, icono((S.af === 'Enemigo' ? 'eno_u_' : 'u_') + a, col))))] : []),
      paso(S.tipo === 'unidad' ? 4 : 3, 'ESCALÓN', ESC.map(([v, t]) => op(t, S.esc === v, () => S.esc = v))));
    sim.innerHTML = `<svg viewBox="0 -20 200 220" style="color:${col}">${SVG[k] || ''}${S.esc ? `<text x="100" y="${S.af === 'Enemigo' ? 18 : 44}" font-family="Arial" font-weight="bold" font-size="30" text-anchor="middle" fill="currentColor" letter-spacing="2">${esc(S.esc)}</text>` : ''}</svg>`;
    nom.textContent = nombre();
  }
  pintar();
  const acc = h('div', 'ff-acc');
  acc.append(boton('📍 COLOCAR EN EL MAPA', () => {
    const k = clave(), e = S.esc; cerrar(); colocar(k);
    // al colocar, el calco abre su editor: se le pone el escalón elegido
    const t0 = Date.now(), antes = document.querySelectorAll('#calco-capa *').length;
    (function vigilar() {
      const sel = document.getElementById('ce-esc'), ed = sel && sel.closest('[hidden]') === null;
      if (sel && ed && document.querySelectorAll('#calco-capa *').length !== antes) { if (e && sel.value !== e) { sel.value = e; sel.dispatchEvent(new Event('change')); } return; }
      if (Date.now() - t0 < 60000) setTimeout(vigilar, 250);
    })();
  }, 'pri'), boton('ℹ VER FICHA DEL SÍMBOLO', () => ficha(clave())));
  ventana('ARMADOR DE SÍMBOLOS', 'Arma el símbolo paso a paso y míralo en vivo', cuerpo, acc);
}

/* ---------- 3. modo práctica ---------- */
function practica(grupo) {
  const grupos = [...new Set(CAT.map(c => c.cat))];
  const cuerpo = h('div', 'ff-q'), acc = h('div', 'ff-acc');
  const sel = h('select', 'ff-sel'); sel.append(new Option('Todos los símbolos', '')); grupos.forEach(g => sel.append(new Option(g.replace(/^\d+\.\s*/, ''), g))); sel.value = grupo || LS.get('pg', '');
  const ini = boton('▶ EMPEZAR', () => { LS.set('pg', sel.value); juego(sel.value); }, 'pri');
  cuerpo.append(h('div', 'pr', 'Elige qué grupo quieres practicar'), sel, h('div', null, '10 preguntas. Unas muestran el símbolo y preguntan el nombre; otras dan el nombre y piden el símbolo.'));
  acc.append(ini); ventana('MODO PRÁCTICA', 'Símbolos convencionales militares', cuerpo, acc);
  function juego(g, soloEstos) {
    const pool = (soloEstos || CAT.filter(c => !g || c.cat === g)).filter(c => SVG[c.key]);
    if (pool.length < 2) return;
    const N = Math.min(10, soloEstos ? soloEstos.length : 10), pregs = [], errores = []; let i = 0, bien = 0;
    const mezcla = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
    const base = mezcla(pool); for (let n = 0; n < N; n++) pregs.push(base[n % base.length]);
    function una() {
      const c = pregs[i], modo = Math.random() < .5 ? 'nombre' : 'simbolo';
      const otros = mezcla((pool.length >= 4 ? pool : CAT.filter(x => SVG[x.key])).filter(x => x.key !== c.key && x.nombre !== c.nombre)).slice(0, 3);
      const ops = mezcla([c, ...otros]);
      const q = h('div', 'ff-q'), pt = h('div', 'ff-pt'); pt.append(h('span', null, `PREGUNTA ${i + 1} DE ${N}`), h('span', null, `✔ ${bien}`));
      const br = h('div', 'ff-barra'), sp = h('span'); sp.style.width = (i / N * 100) + '%'; br.append(sp); q.append(pt, br);
      if (modo === 'nombre') { const s = h('div', 'ff-sim'); s.innerHTML = icono(c.key); q.append(s, h('div', 'pr', '¿Qué símbolo es?')); }
      else q.append(h('div', 'pr', '¿Cuál es el símbolo de: ' + c.nombre + '?'));
      const res = h('div', 'ff-res');
      ops.forEach(o => { const b = h('button'); b.type = 'button'; if (modo === 'nombre') b.textContent = o.nombre; else b.innerHTML = icono(o.key);
        b.onclick = () => { res.querySelectorAll('button').forEach(x => x.disabled = true); const ok = o.key === c.key; b.classList.add(ok ? 'bien' : 'mal');
          if (ok) bien++; else { errores.push(c); [...res.children][ops.indexOf(c)].classList.add('bien'); }
          setTimeout(() => { i++; i < N ? una() : fin(); }, ok ? 650 : 1500); };
        res.append(b); });
      q.append(res); const d = ventana('MODO PRÁCTICA', g ? g.replace(/^\d+\.\s*/, '') : 'Todos los símbolos', q, null);
    }
    function fin() {
      const q = h('div', 'ff-q'), pct = Math.round(bien / N * 100);
      q.append(h('div', 'ff-final', `${bien} / ${N}`), h('div', 'pr', pct >= 90 ? '¡Excelente! Dominas este grupo.' : pct >= 60 ? 'Bien. Repasa los que fallaste.' : 'Sigue practicando: revisa las fichas de aprendizaje.'));
      const br = h('div', 'ff-barra'), sp = h('span'); sp.style.width = pct + '%'; br.append(sp); q.append(br);
      if (errores.length) { const e = h('div', 'ff-err'); errores.forEach(c => { const r = h('div'); r.innerHTML = icono(c.key); r.append(h('span', null, c.nombre)); r.onclick = () => ficha(c.key); r.style.cursor = 'pointer'; e.append(r); }); q.append(h('div', 'pr', 'PARA REPASAR'), e); }
      const a = h('div', 'ff-acc'); a.append(boton('↻ OTRA VEZ', () => juego(g), 'pri')); if (errores.length) a.append(boton('✎ PRACTICAR SOLO LOS ERRORES', () => juego(g, errores.slice())));
      ventana('RESULTADO', g ? g.replace(/^\d+\.\s*/, '') : 'Todos los símbolos', q, a);
    }
    una();
  }
}

/* ---------- 4. barra, recientes, favoritos y vista ---------- */
let barra = null;
function tiras() {
  if (!barra) return;
  barra.querySelectorAll('.ff-tira').forEach(t => t.remove());
  for (const [tit, lista] of [['★ FAVORITOS', FAV], ['🕘 RECIENTES', REC]]) {
    const ks = lista.filter(k => info(k)); if (!ks.length) continue;
    const t = h('div', 'ff-tira'), c = h('div', 'ch'); t.append(h('b', null, tit), c);
    ks.forEach(k => { const b = h('span', 'ff-ch'); b.innerHTML = icono(k); b.append(h('span', null, info(k).nombre)); b.title = 'Colocar · clic derecho: ver la ficha'; b.onclick = () => colocar(k); b.oncontextmenu = e => { e.preventDefault(); ficha(k); }; c.append(b); });
    barra.append(t);
  }
}
function marcar() { document.querySelectorAll('#calco-cat .calco-it[data-key]').forEach(b => { let s = b.querySelector('.ff-star'); if (FAV.includes(b.dataset.key)) { if (!s) { s = h('span', 'ff-star', '★'); b.append(s); } } else s && s.remove(); }); }
function decorar() {
  const cat = document.getElementById('calco-cat'); if (!cat) return false;
  if (!barra || !barra.isConnected) {
    barra = h('div', 'ff-barra-w');
    const fila = h('div', 'ff-bar');
    const vis = boton(LS.get('vista', 'cuad') === 'cuad' ? '☰' : '▦', () => { const v = cat.classList.toggle('ff-cuad'); LS.set('vista', v ? 'cuad' : 'lista'); vis.textContent = v ? '☰' : '▦'; vis.title = v ? 'Ver en lista' : 'Ver en cuadrícula'; }, 'ff-btn vis');
    vis.title = 'Cambiar vista';
    fila.append(boton('🧩 ARMADOR DE SÍMBOLOS', armador, 'ff-btn arm'), vis);
    barra.append(fila); cat.prepend(barra); tiras();
    cat.classList.toggle('ff-cuad', LS.get('vista', 'cuad') === 'cuad');
  }
  cat.querySelectorAll('.calco-it[data-key]').forEach(b => {
    if (b.querySelector('.ff-i') || !info(b.dataset.key)) return;
    const i = h('span', 'ff-i', 'i'); i.title = 'Ficha de aprendizaje'; i.setAttribute('role', 'button');
    i.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); ficha(b.dataset.key); });
    i.addEventListener('pointerdown', e => e.stopPropagation());
    b.append(i);
  });
  marcar(); return true;
}
document.addEventListener('click', e => { const b = e.target.closest?.('#calco-cat .calco-it[data-key]'); if (b && !e.target.closest('.ff-i') && info(b.dataset.key)) usar(b.dataset.key); }, true);
function iniciar() { let n = 0; (function esperar() { decorar(); if (++n < 80) setTimeout(esperar, n < 20 ? 250 : 1000); })(); }
window.EMTE_FICHAS = { ficha, armador, practica };
});
