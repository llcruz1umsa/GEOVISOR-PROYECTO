/* Panel por pestañas, planeamiento en cascada y textos en mayúsculas (agregado por BYNS7, 27-10-2026).
   · El panel lateral se divide en pestañas: MAPA BASE · CAPAS · HERRAMIENTAS · RUTAS · PLANEAMIENTO · CARTAS.
     Al entrar a una pestaña aparece su cuadro (título + qué contiene) y solo su contenido.
   · Calco de PLANEAMIENTO: catálogo en cascada FUERZAS PROPIAS / ENEMIGO / TAREAS TÁCTICAS / OBSTÁCULOS Y OTROS,
     sin el grupo «1. Símbolos básicos».
   · Capas: el grupo «Relieve» pasa dentro de «Apoyo al planeamiento».
   · Todo el texto del geovisor en mayúsculas. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main > aside'); if (!aside) return;
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

/* ---------- 1. mayúsculas en todo el geovisor ---------- */
const css = h('style');
css.textContent = `
body,button,input,select,textarea,.map svg text{text-transform:uppercase}
input::placeholder,textarea::placeholder{text-transform:uppercase}
input[type=email],input[type=password],input[type=url]{text-transform:none}

/* ---------- 2. pestañas del panel ---------- */
aside.pp-listo{padding-top:0!important}
.pp-barra{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;margin:0 -12px 12px;padding:12px 12px 10px;background:#0B1D33;border-bottom:3px solid #B79A5B;box-shadow:0 4px 12px #0B1D3333}
.pp-tab{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 2px 7px;border:1px solid #ffffff22;border-radius:8px;background:#ffffff0d;color:#dfe5f2;font:700 9.5px/1.1 var(--tipo-texto,system-ui);letter-spacing:.06em;cursor:pointer;transition:background .15s,transform .15s}
.pp-tab svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.pp-tab[hidden]{display:none}
.pp-tab:hover{background:#ffffff22;transform:translateY(-1px)}
.pp-tab[aria-selected=true]{background:#B79A5B;border-color:#E2CB8E;color:#0B1D33;box-shadow:inset 0 -3px #8a6d2c}
.pp-tab:focus-visible{outline:2px solid #E2CB8E;outline-offset:2px}
.pp-cuadro{display:flex;gap:11px;align-items:flex-start;margin:0 0 12px;padding:12px 13px;border-radius:10px;background:linear-gradient(135deg,#12294A,#0B1D33);color:#fff;box-shadow:0 6px 16px #0B1D3326;animation:pp-entra .28s ease}
.pp-cuadro .ic{flex:none;display:grid;place-items:center;width:40px;height:40px;border-radius:9px;background:#B79A5B;color:#0B1D33}
.pp-cuadro .ic svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.pp-cuadro b{display:block;font:800 13px var(--tipo-titulo,system-ui);letter-spacing:.1em;color:#E2CB8E}
.pp-cuadro small{display:block;margin-top:3px;font-size:10.5px;line-height:1.35;color:#d5dcea}
@keyframes pp-entra{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
aside .pp-oculto{display:none!important}
aside.pp-listo > details.pp-sec > summary{display:none}
aside.pp-listo > details.pp-sec{margin-top:0;animation:pp-entra .28s ease}

/* ---------- 3. planeamiento en cascada ---------- */
#calco-cat details.pp-sup{border-top:0;margin:0 0 6px;border-radius:8px;overflow:hidden;border:1px solid #c9d1de}
#calco-cat details.pp-sup > summary{position:static;padding:11px 12px;background:#0B1D33!important;color:#fff!important;font:800 12px var(--tipo-titulo,system-ui);letter-spacing:.08em;display:flex;align-items:center;gap:8px;cursor:pointer}
#calco-cat details.pp-sup > summary::-webkit-details-marker{display:none}
#calco-cat details.pp-sup > summary::before{content:'▸';color:#E2CB8E;transition:transform .15s}
#calco-cat details.pp-sup[open] > summary::before{transform:rotate(90deg)}
#calco-cat details.pp-sup > summary i{width:12px;height:12px;border-radius:3px;flex:none;border:1.5px solid #fff}
#calco-cat details.pp-sup > summary small{margin-left:auto;color:#E2CB8E;font-weight:600}
#calco-cat details.pp-sup > details{border-top:1px solid #e5e9e3;margin-left:10px}
#calco-cat details.pp-sup > details > summary{top:0}
#calco-cat{max-height:none!important}

/* ---------- 4. Relieve dentro de Apoyo al planeamiento ---------- */
#layers details.pp-sub{margin:6px 0 4px 10px;border-left:3px solid #B79A5B;border-radius:0 8px 8px 0}
`;
document.head.append(css);

/* ---------- navegación por cuadros ----------
   Inicio: los 6 cuadros principales. Al entrar a uno desaparecen los demás, aparece «← INICIO» y su contenido
   también se muestra en cuadros (grupos de capas, catálogo del calco, fuerzas…). Dentro de un cuadro, «← SECCIÓN». */
const ICO = {
  base: '<svg viewBox="0 0 24 24"><path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/></svg>',
  capas: '<svg viewBox="0 0 24 24"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  herr: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/></svg>',
  rutas: '<svg viewBox="0 0 24 24"><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5"/></svg>',
  plan: '<svg viewBox="0 0 24 24"><path d="M4 20V4h11l-2 4 2 4H4"/><path d="M4 20h16"/></svg>',
  cartas: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>'
};
// Iconos de los cuadros interiores (por nombre)
const SUBICO = [
  [/avenida/i, '<svg viewBox="0 0 24 24"><path d="M3 19c4-1 7-4 9-9"/><path d="M8 20c4-2 8-6 10-12"/><path d="M14 6l5-2-1 5"/></svg>'],
  [/situaci[oó]n modificado/i, '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M6 15l4-5 3 3 5-6"/><path d="M6 8h3"/></svg>'],
  [/campos de tiro|observaci[oó]n y campos/i, '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>'],
  [/cubierta/i, '<svg viewBox="0 0 24 24"><path d="M12 3l3 5h-2l3 5h-2l3 5H7l3-5H8l3-5H9z"/><path d="M12 18v3"/></svg>'],
  [/luz y clima/i, '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'],
  [/marcha/i, '<svg viewBox="0 0 24 24"><rect x="2" y="9" width="6" height="5" rx="1"/><rect x="9" y="9" width="6" height="5" rx="1"/><rect x="16" y="9" width="6" height="5" rx="1"/><path d="M2 18h20"/></svg>'],
  [/l[ií]nea de tiempo/i, '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'],
  [/[aá]reas de inter[eé]s/i, '<svg viewBox="0 0 24 24"><path d="M4 6l7-2 9 4-2 10-9 2-5-6z" stroke-dasharray="3 2"/><circle cx="12" cy="11" r="2"/></svg>'],
  [/orden de operaciones/i, '<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 15h7M9 19h4"/></svg>'],
  [/servicio|institu/i, '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>'],
  [/poblaci|vivienda/i, '<svg viewBox="0 0 24 24"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>'],
  [/vial|v[ií]as/i, '<svg viewBox="0 0 24 24"><path d="M8 3L5 21M16 3l3 18M12 5v3M12 11v3M12 17v3"/></svg>'],
  [/hidrogr/i, '<svg viewBox="0 0 24 24"><path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/></svg>'],
  [/l[ií]mite/i, '<svg viewBox="0 0 24 24"><path d="M4 6l5-2 6 3 5-2v13l-5 2-6-3-5 2z" stroke-dasharray="3 2"/></svg>'],
  [/campo/i, '<svg viewBox="0 0 24 24"><path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/></svg>'],
  [/pendiente/i, '<svg viewBox="0 0 24 24"><path d="M3 20h18L3 6z"/><path d="M8 20a5 5 0 0 0-2-4"/></svg>'],
  [/an[aá]lisis del terreno|obst[aá]culos combinados|terreno clave/i, '<svg viewBox="0 0 24 24"><path d="M3 20l6-10 4 6 3-4 5 8z"/><path d="M14 4l3 3-3 3M17 7H9"/></svg>'],
  [/apoyo|relieve/i, '<svg viewBox="0 0 24 24"><path d="M2 20l7-12 4 6 3-4 6 10z"/></svg>'],
  [/calco/i, '<svg viewBox="0 0 24 24"><path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/></svg>'],
  [/^fichas$/i, '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="8" height="7" rx="1" style="color:#0033cc"/><path d="M17 3.5l3.5 3.5-3.5 3.5-3.5-3.5z" style="color:#e00000"/><path d="M4 15h7M4 19h5"/><path d="M15 14l5 6M20 14l-5 6"/></svg>'],
  [/^ffaa$/i, '<svg viewBox="0 0 24 24"><path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z"/></svg>'],
  [/fuerzas propias/i, '<svg viewBox="0 0 24 24" style="color:#0033cc"><rect x="3" y="6" width="18" height="12"/><path d="M3 6l18 12M3 18L21 6"/></svg>'],
  [/enemigo/i, '<svg viewBox="0 0 24 24" style="color:#e00000"><path d="M12 3l9 9-9 9-9-9z"/><path d="M8 8l8 8M8 16l8-8"/></svg>'],
  [/tareas/i, '<svg viewBox="0 0 24 24" style="color:#2f7f86"><path d="M4 18c5-1 9-5 11-11"/><path d="M11 6l4 1 1 4"/></svg>'],
  [/obst[aá]culo/i, '<svg viewBox="0 0 24 24" style="color:#00a030"><path d="M4 18l4-8 4 8 4-8 4 8"/></svg>'],
  [/ej[eé]rcito/i, '<svg viewBox="0 0 24 24" style="color:#2e6b2e"><path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6L12 16.3 6.6 19.3l1.3-6L3.3 9.2l6.1-.6z"/></svg>'],
  [/armada/i, '<svg viewBox="0 0 24 24" style="color:#0b3d91"><circle cx="12" cy="5" r="2"/><path d="M12 7v13M8 10h8M5 14c1 4 4 6 7 6s6-2 7-6"/></svg>'],
  [/a[eé]rea/i, '<svg viewBox="0 0 24 24" style="color:#3a8fd6"><path d="M2 13l10-3 10 3M12 4v16M9 20h6"/></svg>'],
  [/comando en jefe|ceo/i, '<svg viewBox="0 0 24 24" style="color:#7a1f1f"><rect x="6" y="4" width="14" height="9"/><path d="M6 13v8"/></svg>'],
  [/carta/i, ICO.cartas],
  [/unidades militares/i, '<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>']
];
const subIco = t => (SUBICO.find(([r]) => r.test(t)) || [0, ICO.capas])[1];
const PESTANAS = [
  { id: 'base', t: 'Mapa base', d: 'Elige el fondo del mapa: satélite 2026 sin internet, estándar, relieve o sin fondo.', es: e => /^Tipo de mapa/i.test(sum(e)) },
  { id: 'capas', t: 'Capas', d: 'Elige un grupo para encender o apagar su información.', es: e => /^Capas del mapa/i.test(sum(e)) || e.classList.contains('lod-opcion') },
  { id: 'herr', t: 'Herramientas', d: 'Medir, perfil del terreno, coordenadas, imprimir la carta, exportar y análisis del terreno.', es: e => /^Herramientas/i.test(sum(e)) },
  { id: 'rutas', t: 'Rutas', d: 'Calcula la ruta y el tiempo de viaje entre dos puntos por la red vial.', es: e => e.classList.contains('route-panel') },
  { id: 'plan', t: 'Planeamiento', d: 'Calco militar, catálogo de símbolos y Fuerzas Armadas. Elige un cuadro o busca un símbolo.', es: e => e.matches('.calco-menu,.pc-menu,.ap-menu,.coc-menu,.tc-menu,.hp-menu') },
  { id: 'cartas', t: 'Cartas', d: 'Cartas topográficas IGM de Omasuyos y unidades militares.', es: e => e.classList.contains('cc-menu') }
];
function sum(e) { return (e.querySelector(':scope > summary')?.textContent || '').trim(); }
const nombreSum = d => { const s = d.querySelector(':scope > summary'); if (!s) return ''; const c = s.cloneNode(true); c.querySelectorAll('small,a,input,span,i').forEach(x => x.remove()); return c.textContent.replace(/\s+/g, ' ').trim(); };
const barra = h('div', 'pp-barra'); barra.setAttribute('role', 'tablist'); barra.setAttribute('aria-label', 'Secciones del panel');
const nav = h('div', 'pp-nav'); const atras = h('button', 'pp-atras'); atras.type = 'button'; const navT = h('b'); nav.append(atras, navT);
const cuadro = h('div', 'pp-cuadro'); cuadro.setAttribute('role', 'note');
const grilla = h('div', 'pp-grilla');
let actual = null, sub = null;
const botones = {};
css.textContent += `
aside.pp-listo{padding-top:0!important}
aside.pp-inicio .pp-barra{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding:14px 12px 16px}
aside.pp-inicio .pp-tab{padding:18px 6px 14px;gap:9px;font-size:11px;border-radius:12px}
aside.pp-inicio .pp-tab svg{width:30px;height:30px}
.pp-barra[hidden],.pp-nav[hidden],.pp-cuadro[hidden],.pp-grilla[hidden]{display:none!important}
.pp-nav{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;margin:0 -12px 12px;padding:10px 12px;background:#0B1D33;border-bottom:3px solid #B79A5B;box-shadow:0 4px 12px #0B1D3333}
.pp-atras{display:flex;align-items:center;gap:6px;flex:none;padding:7px 11px 7px 8px;border:1px solid #B79A5B;border-radius:18px;background:#ffffff12;color:#E2CB8E;font:800 11px var(--tipo-titulo,system-ui);letter-spacing:.06em;cursor:pointer}
.pp-atras::before{content:'';width:9px;height:9px;border-left:2.5px solid currentColor;border-bottom:2.5px solid currentColor;transform:rotate(45deg);margin-left:3px}
.pp-atras:hover{background:#B79A5B;color:#0B1D33}
.pp-nav b{min-width:0;color:#fff;font:800 12px var(--tipo-titulo,system-ui);letter-spacing:.08em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pp-grilla{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:0 0 12px;animation:pp-entra .28s ease}
.pp-cel{display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:7px;min-height:104px;padding:13px 6px 10px;border:1px solid #D7DEE8;border-radius:12px;background:#fff;color:#12294A;text-align:center;cursor:pointer;box-shadow:0 2px 8px #0B1D3312;transition:transform .15s,box-shadow .15s,border-color .15s}
.pp-cel:hover{transform:translateY(-2px);border-color:#B79A5B;box-shadow:0 8px 18px #0B1D3322}
.pp-cel .ic{display:grid;place-items:center;width:42px;height:42px;border-radius:11px;background:#EEF2F8;color:#12294A}
.pp-cel .ic svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
.pp-cel b{font:800 10.5px/1.2 var(--tipo-titulo,system-ui);letter-spacing:.05em}
.pp-cel small{font-size:9.5px;color:#64737b;line-height:1.2}
.pp-cel small.on{color:#1E8B4C;font-weight:700}
aside .pp-sinsum > summary{display:none!important}
aside.pp-listo .fa-sec > .fa-cab{display:none}
aside.pp-listo .fa-sec{border:0;margin-top:0}
aside .pp-sola{margin:0!important;border-radius:10px}
`;
// Subdivisiones de cada sección: [{k, t, d, mostrar()}]; «fijos» se ven en el nivel de cuadros.
function divisiones(id) {
  if (id === 'capas') {
    const L = document.getElementById('layers'); if (!L) return null;
    const gs = [...L.querySelectorAll(':scope > details')];
    return { contenedor: L, partes: gs.map(d => ({ k: nombreSum(d), t: nombreSum(d), els: [d], d: (() => { const n = d.querySelectorAll('input[type=checkbox]:checked').length; return n ? n + (n === 1 ? ' capa encendida' : ' capas encendidas') : 'apagado'; })(), on: !!d.querySelector('input[type=checkbox]:checked') })),
      todos: gs, fijos: [...aside.querySelectorAll(':scope > .lod-opcion')], otros: [...L.children].filter(e => e.tagName !== 'DETAILS') };
  }
  if (id === 'plan') {
    const B = document.querySelector('.calco-menu .calco-body');
    if (!B) {   // invitados: sin calco, solo las secciones de análisis
      const ex = [...aside.querySelectorAll(':scope > .pc-menu, :scope > .ap-menu, :scope > .coc-menu, :scope > .tc-menu, :scope > .hp-menu')]; if (ex.length < 2) return null;
      return { contenedor: null, partes: ex.map(e => ({ k: 'x:' + nombreSum(e), t: nombreSum(e).replace(/\s*·.*$/, ''), d: (nombreSum(e).match(/·\s*(.*)$/) || [])[1] || '', els: [e] })), todos: ex, fijos: [] };
    }
    const cat = document.getElementById('calco-cat'), fa = B.querySelector('.fa-sec'), q = document.getElementById('calco-q');
    const calco = [...B.children].filter(e => e !== cat && e !== fa && e !== q);
    const partes = []; void calco;   // 02-11-2026: sin cuadro «Calco» (guardar va en Herramientas › Guardar; borrar en ELIMINAR)
    const sups = cat ? [...cat.querySelectorAll(':scope > details.pp-sup')] : [];
    // 02-11-2026: Fuerzas propias, Enemigo, Tareas tácticas y Obstáculos van juntos en un solo cuadro «Fichas»
    const suma = xs => xs.reduce((a, d) => a + (parseInt((d.querySelector(':scope > summary small')?.textContent || '').replace(/\D/g, '')) || 0), 0);
    if (sups.length) partes.push({ k: 'fichas', t: 'Fichas', d: suma(sups) + ' símbolos', els: [cat] });
    const fzs = fa ? [...fa.querySelectorAll(':scope > details.fa-fz')] : [];
    // 02-11-2026: Ejército, Armada, Fuerza Aérea y Comando en Jefe juntos en un solo cuadro «FFAA»
    if (fzs.length) partes.push({ k: 'ffaa', t: 'FFAA', d: suma(fzs) + ' elementos 🔒', els: [fa] });
    // secciones de análisis que otros módulos agregan a esta pestaña (pendientes MDT, apoyo al planeamiento, COC/TC)
    const menu = B.closest('.calco-menu'), extras = [...aside.querySelectorAll(':scope > .pc-menu, :scope > .ap-menu, :scope > .coc-menu, :scope > .tc-menu, :scope > .hp-menu')];
    extras.forEach(e => partes.splice(extras.indexOf(e), 0, { k: 'x:' + nombreSum(e), t: nombreSum(e).replace(/\s*·.*$/, ''), d: (nombreSum(e).match(/·\s*(.*)$/) || [])[1] || '', els: [e], fuera: true }));
    return { contenedor: B, menu, partes, todos: [...B.children, ...extras, menu], fijos: q ? [q] : [], buscar: q && q.value.trim() ? [cat] : null };
  }
  if (id === 'cartas') {
    const cs = [...aside.querySelectorAll(':scope > .cc-menu')]; if (cs.length < 2) return null;
    return { contenedor: null, partes: cs.map(d => ({ k: nombreSum(d), t: nombreSum(d), d: d.querySelector(':scope > summary span')?.textContent || '', els: [d] })), todos: cs, fijos: [] };
  }
  return null;
}
let pintando = false;
function pintar() {
  pintando = true;
  const hay = new Set();
  for (const e of aside.children) { const id = pestanaDe(e); if (!id) continue; hay.add(id); e.classList.toggle('pp-oculto', id !== actual); if (e.tagName === 'DETAILS') { e.classList.add('pp-sec'); if (id === actual) e.open = true; } }
  PESTANAS.forEach(p => { const b = botones[p.id]; b.hidden = !hay.has(p.id); });
  if (actual && !hay.has(actual)) { actual = null; sub = null; }
  aside.classList.toggle('pp-inicio', !actual);
  barra.hidden = !!actual; nav.hidden = !actual; cuadro.hidden = !actual; grilla.hidden = true;
  aside.querySelectorAll('.pp-sinsum').forEach(e => e.classList.remove('pp-sinsum', 'pp-sola'));
  if (!actual) { pintando = false; return; }
  const P = PESTANAS.find(x => x.id === actual), D = divisiones(actual);
  let parte = D && sub ? D.partes.find(x => x.k === sub) : null; if (sub && !parte) sub = null;
  atras.textContent = parte ? P.t : 'Inicio'; atras.setAttribute('aria-label', parte ? 'Volver a ' + P.t : 'Volver al inicio');
  navT.textContent = parte ? parte.t : P.t;
  cuadro.innerHTML = parte ? `<span class="ic">${subIco(parte.t)}</span><span><b>${parte.t}</b><small>${parte.d || ''}</small></span>` : `<span class="ic">${ICO[P.id]}</span><span><b>${P.t}</b><small>${P.d}</small></span>`;
  if (D) {
    const ver = new Set(), buscando = !parte && D.buscar;
    if (parte) parte.els.forEach(e => ver.add(e)); else if (buscando) { D.buscar.forEach(e => ver.add(e)); D.fijos.forEach(e => ver.add(e)); } else D.fijos.forEach(e => ver.add(e));
    (D.otros || []).forEach(e => ver.add(e));
    if (D.menu && (!parte || !parte.fuera)) ver.add(D.menu);
    D.todos.forEach(e => e.classList.toggle('pp-oculto', !ver.has(e)));
    D.fijos.forEach(e => e.classList.toggle('pp-oculto', !ver.has(e)));
    D.partes.forEach(x => (x.hermanos || []).forEach(s => s.classList.remove('pp-oculto')));
    if (parte) {
      if (parte.solo) { parte.hermanos.forEach(s => s.classList.toggle('pp-oculto', s !== parte.solo)); parte.solo.open = true; parte.solo.classList.add('pp-sinsum'); }
      parte.els.forEach(e => { if (e.tagName === 'DETAILS') { e.open = true; e.classList.add('pp-sinsum', 'pp-sola'); } });
    } else if (!buscando) {
      grilla.replaceChildren(...D.partes.map(x => { const b = h('button', 'pp-cel'); b.type = 'button';
        b.innerHTML = `<span class="ic">${subIco(x.t)}</span><b>${x.t}</b>` + (x.d ? `<small class="${x.on ? 'on' : ''}">${x.d}</small>` : '');
        b.onclick = () => { sub = x.k; pintar(); aside.scrollTop = 0; }; return b; }));
      grilla.hidden = false;
      const ref = D.contenedor || aside; if (D.contenedor) { const sec = D.contenedor.closest('aside > *'); sec.before(grilla); } else cuadro.after(grilla);
    }
  }
  cuadro.style.animation = 'none'; void cuadro.offsetWidth; cuadro.style.animation = '';
  obs.takeRecords(); pintando = false;
}
function pestanaDe(e) { if (e === barra || e === cuadro || e === nav || e === grilla || e.tagName === 'STYLE' || e.tagName === 'SCRIPT') return null; const p = PESTANAS.find(p => p.es(e)); return p ? p.id : 'herr'; }
PESTANAS.forEach(p => {
  const b = h('button', 'pp-tab'); b.type = 'button'; b.setAttribute('role', 'tab'); b.innerHTML = ICO[p.id] + `<span>${p.t}</span>`; b.title = p.d;
  b.onclick = () => { actual = p.id; sub = null; pintar(); aside.scrollTop = 0; };
  botones[p.id] = b; barra.append(b);
});
atras.onclick = () => { if (sub) sub = null; else actual = null; pintar(); aside.scrollTop = 0; };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && actual && aside.contains(document.activeElement) && document.activeElement.tagName !== 'INPUT') atras.click(); });
aside.prepend(barra, nav, cuadro); aside.classList.add('pp-listo');
// Las secciones y grupos que otros módulos agregan después también se reparten en su cuadro.
let pend = 0;
const obs = new MutationObserver(() => { if (pintando) return; cancelAnimationFrame(pend); pend = requestAnimationFrame(() => { if (!sub) pintar(); else { pintando = true; obs.takeRecords(); pintando = false; } }); });
obs.observe(aside, { childList: true });
const vigilar = () => { const L = document.getElementById('layers'), cat = document.getElementById('calco-cat'), B = document.querySelector('.calco-menu .calco-body');
  [L, cat, B].forEach(x => { if (x && !x.dataset.ppObs) { x.dataset.ppObs = '1'; obs.observe(x, { childList: true }); } }); };
vigilar(); setTimeout(vigilar, 1500); setTimeout(vigilar, 5000);
document.addEventListener('input', e => { if (e.target.id === 'calco-q') pintar(); });
document.addEventListener('change', e => { if (actual === 'capas' && !sub && aside.contains(e.target)) pintar(); });
pintar();
window.EMTE_PESTANA = id => { if (botones[id]) { actual = id; sub = null; pintar(); } };

/* ---------- planeamiento ---------- */
function planeamiento() {
  const menu = aside.querySelector('.calco-menu'); if (!menu) return false;
  const s = menu.querySelector(':scope > summary'); if (s && s.textContent !== 'PLANEAMIENTO') s.textContent = 'PLANEAMIENTO';
  const cat = document.getElementById('calco-cat'); if (!cat || cat.dataset.pp) return true;
  const grupos = [...cat.querySelectorAll(':scope > details')]; if (grupos.length < 10) return true;
  const nombre = d => (d.querySelector(':scope > summary')?.firstChild?.textContent || '').trim();
  const num = d => { const m = nombre(d).match(/^(\d+)\./); return m ? +m[1] : null; };
  const SUP = [
    { t: 'Fuerzas propias', c: '#1f6fd1', f: n => [2, 3, 4, 5, 6, 7, 8, 10, 17, 18].includes(n) },
    { t: 'Enemigo', c: '#ff1f1f', f: n => [11, 12, 13, 14, 15, 16, 19].includes(n) },
    { t: 'Tareas tácticas', c: '#45999f', f: (n, d) => /^Tareas tácticas/i.test(nombre(d)) },
    { t: 'Obstáculos y otros', c: '#2e9b3e', f: n => [9, 20, 21, 22].includes(n) }
  ];
  if (!grupos.some(d => num(d) === 22)) return true;
  cat.dataset.pp = '1';
  grupos.filter(d => num(d) === 1).forEach(d => d.remove());   // «1. Símbolos básicos» eliminado
  SUP.forEach((S, i) => {
    const hijos = grupos.filter(d => d.isConnected && S.f(num(d), d)); if (!hijos.length) return;
    const sup = h('details', 'pp-sup'); sup.open = i === 0;
    const sm = h('summary'); const dot = h('i'); dot.style.background = S.c; sm.append(dot, document.createTextNode(S.t));
    const n = hijos.reduce((a, d) => a + d.querySelectorAll('.calco-it').length, 0); sm.append(h('small', null, n + ' símbolos'));
    sup.append(sm); cat.append(sup);
    hijos.forEach(d => { d.open = false; sup.append(d); const t = d.querySelector(':scope > summary')?.firstChild; if (t) t.textContent = t.textContent.replace(/^\d+\.\s*/, '').replace(/^Enemigo:\s*/i, '').replace(/^Tareas tácticas\s*[–-]\s*/i, '').replace(/^(.)/, c => c.toUpperCase()) + ' '; });
  });
  return true;
}
let nP = 0;
(function esperar() { if (planeamiento() && document.getElementById('calco-cat')?.dataset.pp) return; if (++nP < 120) setTimeout(esperar, 250); })();

/* ---------- Relieve dentro de Apoyo al planeamiento ---------- */
function relieve() {
  const capas = document.getElementById('layers'); if (!capas) return false;
  const top = [...capas.querySelectorAll(':scope > details')];
  const rel = top.find(d => /^Relieve/i.test(sum(d))), apo = [...capas.querySelectorAll('details')].find(d => /^Apoyo al planeamiento/i.test(sum(d)));
  if (!rel || !apo) return false;
  rel.classList.add('pp-sub'); apo.append(rel); return true;
}
let nR = 0;
(function esperarR() { if (relieve() || ++nR > 120) return; setTimeout(esperarR, 250); })();
});
