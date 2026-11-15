/* Panel más dinámico (agregado por BYNS7, 02-11-2026). Se suma a panel-pestanas.js sin cambiarlo:
   · cuadros agrupados por tema (Planeamiento: Terreno · Maniobra · Simbología militar · Fuerzas Armadas);
   · interruptor 👁 en cada cuadro que es una capa: enciende o apaga sin entrar, y el cuadro se marca cuando está encendido;
   · barra «EN EL MAPA» con lo encendido en esa pestaña (× para apagar);
   · buscador de cuadros cuando hay muchos;
   · en la pantalla de inicio, cada pestaña muestra cuántas capas tiene encendidas. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const aside = document.querySelector('main > aside'); if (!aside) return;
const h = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const css = h('style');
css.textContent = `
.pp-grilla .pd-grupo{grid-column:1/-1;display:flex;align-items:center;gap:8px;margin:6px 2px -2px;font:800 10px var(--tipo-titulo,system-ui);letter-spacing:.14em;color:#8A6D2F}
.pp-grilla .pd-grupo::after{content:'';flex:1;height:1px;background:linear-gradient(90deg,#B79A5B88,transparent)}
.pp-grilla .pd-grupo:first-child{margin-top:0}
.pp-grilla .pd-busca{grid-column:1/-1;width:100%;box-sizing:border-box;padding:8px 11px;border:1px solid #D7DEE8;border-radius:10px;font:12px var(--tipo-texto,system-ui);background:#fff}
.pp-grilla .pd-busca:focus{outline:2px solid #B79A5B;outline-offset:1px}
.pp-grilla .pd-act{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:5px;padding:8px 9px;border:1px solid #E7DCC2;border-radius:10px;background:#FBF8F0}
.pp-grilla .pd-act > b{font:800 9.5px var(--tipo-titulo,system-ui);letter-spacing:.12em;color:#8A6D2F;margin-right:2px}
.pp-grilla .pd-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 4px 3px 9px;border-radius:14px;background:#12294A;color:#fff;font:700 10px var(--tipo-titulo,system-ui);letter-spacing:.04em;cursor:pointer}
.pp-grilla .pd-chip i{font-style:normal;display:grid;place-items:center;width:16px;height:16px;border-radius:50%;background:#ffffff26;font-size:12px}
.pp-grilla .pd-chip:hover i{background:#C0392B}
.pp-grilla .pd-act .pd-todo{margin-left:auto;font:700 9.5px var(--tipo-titulo,system-ui);color:#9B1C1C;cursor:pointer;text-decoration:underline}
.pp-cel{position:relative}
.pp-cel .pd-ojo{position:absolute;top:7px;right:7px;display:grid;place-items:center;width:26px;height:26px;border-radius:50%;border:1px solid #D7DEE8;background:#fff;color:#8796A8;transition:all .15s}
.pp-cel .pd-ojo svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.pp-cel .pd-ojo:hover{border-color:#12294A;color:#12294A;transform:scale(1.08)}
.pp-cel.pd-on{border-color:#B79A5B;background:linear-gradient(180deg,#FBF8F0,#fff)}
.pp-cel.pd-on .ic{background:#B79A5B;color:#fff}
.pp-cel.pd-on .pd-ojo{background:#12294A;border-color:#12294A;color:#fff}
.pp-cel.pd-on::after{content:'EN EL MAPA';position:absolute;left:8px;top:8px;font:800 7.5px var(--tipo-titulo,system-ui);letter-spacing:.1em;color:#1E8B4C}
.pp-cel.pd-oculto{display:none!important}
.pp-tab{position:relative}
.pp-tab .pd-n{position:absolute;top:6px;right:6px;min-width:18px;height:18px;padding:0 5px;box-sizing:border-box;border-radius:9px;background:#B79A5B;color:#0B1D33;font:800 10px/18px var(--tipo-titulo,system-ui);text-align:center}
@keyframes pd-pulso{0%{box-shadow:0 0 0 0 #B79A5B88}100%{box-shadow:0 0 0 10px #B79A5B00}}
.pp-cel.pd-recien{animation:pd-pulso .6s ease}`;
document.head.append(css);
const OJO = '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const OJO_NO = '<svg viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6"/></svg>';

/* ---------- capas que se encienden desde un cuadro ---------- */
const chk = sel => document.querySelector(sel);
const casilla = sel => ({ on: () => !!chk(sel)?.checked, poner: v => { const c = chk(sel); if (c && c.checked !== v) c.click(); } });
const recuerdo = new Map();
function grupoCasillas(raiz, k) {   // grupo de varias capas: se apagan todas y al encender vuelven las que estaban
  const principales = () => [...(typeof raiz === 'function' ? raiz() : raiz)?.querySelectorAll('input[type=checkbox]') || []].filter(cb => { const l = cb.closest('label'); return l && l.parentElement && l.parentElement.matches('details') && !l.parentElement.classList.contains('vv-usos'); });
  return {
    on: () => principales().some(c => c.checked || c.indeterminate),
    poner: v => {
      const P = principales();
      if (!v) { recuerdo.set(k, P.filter(c => c.checked || c.indeterminate).map(c => P.indexOf(c))); P.forEach(c => { if (c.checked || c.indeterminate) { c.indeterminate = false; c.checked = true; c.click(); } }); }
      else { const r = recuerdo.get(k); (r && r.length ? r.map(i => P[i]) : P.slice(0, 1)).forEach(c => c && !c.checked && c.click()); }
    }
  };
}
const CAPAS_PLAN = [
  [/^Pendientes/i, casilla('#pc-ver')],
  [/^Curvas de nivel/i, casilla('.cn-ver')],
  [/^Cubierta/i, { on: () => !!window.EMTE_HP_CUB_ON?.(), poner: v => window.EMTE_HP_CUB?.(v) }],
  [/^An[aá]lisis del terreno/i, { on: () => { const s = window.EMTE_ANALISIS?.estado?.(); return !!(s && (s.coc || s.tc)); }, poner: v => { const A = window.EMTE_ANALISIS; if (!A) return; if (v) A.coc(recuerdo.get('coc') || 'mec'); else { recuerdo.set('coc', A.estado().coc || 'mec'); A.coc(''); A.tc(false); } } }],
  [/^Avenidas/i, { on: () => { const g = document.getElementById('hp-aa'); return !!(g && g.childElementCount > 1 && g.style.display !== 'none'); }, poner: v => { const g = document.getElementById('hp-aa'); if (g && g.childElementCount > 1) { g.style.display = v ? '' : 'none'; window.EMTE_SIMB_REFRESCAR?.(); } }, solo: () => (document.getElementById('hp-aa')?.childElementCount || 0) > 1 }],
  [/^Apoyo al planeamiento/i, grupoCasillas(() => document.getElementById('apoyo-capas'), 'apoyo')],
  [/^(FFAA|EJ[EÉ]RCITO|ARMADA|FUERZA A[EÉ]REA|COMANDO EN JEFE)/i, casilla('.fa-sec .fa-ver')]
];
function capaDe(titulo) {
  const r = CAPAS_PLAN.find(([re]) => re.test(titulo)); if (r) return r[1];
  const g = [...document.querySelectorAll('#layers > details')].find(d => norm(d.querySelector(':scope > summary')?.textContent).startsWith(norm(titulo)));
  return g ? grupoCasillas(g, 'capas:' + titulo) : null;
}
const GRUPOS = [
  ['ANÁLISIS GUIADO', /^Gu[ií]a del terreno/i],
  ['TERRENO', /^(Pendientes|Apoyo al planeamiento|An[aá]lisis del terreno|Curvas de nivel|Cubierta)/i],
  ['MANIOBRA Y TIEMPO', /^(Avenidas|L[ií]nea de tiempo)/i],
  ['SIMBOLOGÍA Y FUERZAS', /^(Fichas|FFAA|Fuerzas propias|Enemigo|Tareas t[aá]cticas|Obst[aá]culos)/i],
  ['FUERZAS ARMADAS', /^(EJ[EÉ]RCITO|ARMADA|FUERZA A[EÉ]REA|COMANDO EN JEFE)/i]
];

/* ---------- decorar la grilla cada vez que panel-pestanas.js la vuelve a armar ---------- */
let grilla = null, decorando = false, filtro = '';
const titulo = c => (c.querySelector('b')?.textContent || '').trim();
function decorar() {
  if (!grilla || decorando || grilla.hidden) return;
  const cels = [...grilla.querySelectorAll(':scope > .pp-cel')]; if (!cels.length || grilla.querySelector(':scope > .pd-marca')) { estados(); return; }
  decorando = true;
  const marca = h('span', 'pd-marca'); marca.hidden = true;
  // agrupar (solo si al menos dos grupos tienen cuadros)
  const asign = cels.map(c => ({ c, g: (GRUPOS.find(([, re]) => re.test(titulo(c))) || ['OTROS'])[0] }));
  const usados = [...new Set(asign.map(a => a.g))];
  const frag = [marca];
  if (cels.length > 6) { const q = h('input', 'pd-busca'); q.type = 'search'; q.placeholder = 'Buscar en esta pestaña…'; q.value = filtro; q.oninput = () => { filtro = q.value; filtrar(); }; frag.push(q); }
  frag.push(Object.assign(h('div', 'pd-act'), { hidden: true }));
  if (usados.length >= 2) {
    for (const [nom] of [...GRUPOS, ['OTROS']]) { const xs = asign.filter(a => a.g === nom); if (!xs.length) continue; const gh = h('div', 'pd-grupo', nom); gh.dataset.g = nom; frag.push(gh); xs.forEach(a => { a.c.dataset.g = nom; frag.push(a.c); }); }
  } else frag.push(...cels);
  grilla.replaceChildren(...frag);
  // interruptores
  for (const c of cels) {
    const capa = capaDe(titulo(c)); if (!capa) continue;
    c._pd = capa;
    const o = h('span', 'pd-ojo'); o.setAttribute('role', 'switch'); o.tabIndex = 0;
    const accion = e => { e.stopPropagation(); e.preventDefault(); const v = !capa.on(); try { capa.poner(v); } catch (err) { console.error(err); } c.classList.add('pd-recien'); setTimeout(() => c.classList.remove('pd-recien'), 650); setTimeout(estados, 120); setTimeout(estados, 900); };
    o.addEventListener('click', accion); o.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') accion(e); });
    c.append(o);
  }
  if (filtro) filtrar();
  decorando = false; estados();
}
function filtrar() {
  const t = norm(filtro.trim());
  grilla.querySelectorAll(':scope > .pp-cel').forEach(c => c.classList.toggle('pd-oculto', !!t && !norm(c.textContent).includes(t)));
  grilla.querySelectorAll(':scope > .pd-grupo').forEach(g => g.hidden = !!t && ![...grilla.querySelectorAll(`:scope > .pp-cel[data-g="${g.dataset.g}"]`)].some(c => !c.classList.contains('pd-oculto')));
}
function estados() {
  if (!grilla || grilla.hidden) { contarPestanas(); return; }
  const act = grilla.querySelector(':scope > .pd-act'), on = [];
  grilla.querySelectorAll(':scope > .pp-cel').forEach(c => {
    const capa = c._pd; if (!capa) return;
    const o = c.querySelector('.pd-ojo'), v = !!capa.on(), visible = !capa.solo || capa.solo();
    if (o) { o.hidden = !visible; o.innerHTML = v ? OJO : OJO_NO; o.title = v ? 'Apagar en el mapa' : 'Mostrar en el mapa'; o.setAttribute('aria-checked', String(v)); }
    c.classList.toggle('pd-on', v); if (v && !on.some(x => x._pd === capa)) on.push(c);
  });
  if (act) {
    act.hidden = !on.length; act.replaceChildren();
    if (on.length) {
      act.append(h('b', null, 'EN EL MAPA'));
      on.forEach(c => { const ch = h('span', 'pd-chip'); ch.append(document.createTextNode(titulo(c).replace(/\s*·.*$/, '')), h('i', null, '×')); ch.title = 'Apagar'; ch.onclick = () => { c._pd.poner(false); setTimeout(estados, 150); }; act.append(ch); });
      if (on.length > 1) { const t = h('span', 'pd-todo', 'APAGAR TODO'); t.onclick = () => { on.forEach(c => c._pd.poner(false)); setTimeout(estados, 200); }; act.append(t); }
    }
  }
  contarPestanas();
}
// número de capas encendidas en cada pestaña (pantalla de inicio)
function contarPestanas() {
  const n = {
    'Capas': [...document.querySelectorAll('#layers input[type=checkbox]')].filter(cb => { const l = cb.closest('label'); return l && l.parentElement?.matches('details.layer-group') && !l.parentElement.classList.contains('vv-usos') && (cb.checked || cb.indeterminate); }).length,
    'Planeamiento': CAPAS_PLAN.filter(([, c], i, A) => A.findIndex(([, d]) => d === c) === i).filter(([, c]) => { try { return c.on(); } catch (e) { return false; } }).length
  };
  document.querySelectorAll('.pp-tab').forEach(b => {
    const t = (b.textContent || '').replace(/\d+$/, '').trim(), k = Object.keys(n).find(x => norm(t).startsWith(norm(x)));
    let s = b.querySelector('.pd-n'); if (!k) { s && s.remove(); return; }
    if (!n[k]) { s && s.remove(); return; }
    if (!s) { s = h('span', 'pd-n'); b.append(s); } s.textContent = n[k];
  });
}

function enganchar() {
  const g = aside.querySelector('.pp-grilla'); if (!g) return false;
  grilla = g;
  new MutationObserver(() => { if (!decorando) requestAnimationFrame(decorar); }).observe(g, { childList: true });
  new MutationObserver(() => requestAnimationFrame(decorar)).observe(g, { attributes: true, attributeFilter: ['hidden'] });
  decorar(); return true;
}
let n = 0; (function esperar() { if (!enganchar() && ++n < 80) setTimeout(esperar, 250); })();
document.addEventListener('change', () => setTimeout(estados, 60), true);
document.addEventListener('click', e => { if (e.target.closest?.('.pp-atras, .pp-tab, .lm-dlg .si, .ca-menu, .coc-menu, .hp-menu')) setTimeout(estados, 300); }, true);
setInterval(() => { if (!document.hidden) estados(); }, 2500);
});
