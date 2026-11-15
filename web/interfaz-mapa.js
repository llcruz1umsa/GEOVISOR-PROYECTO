/* Interfaz del mapa (agregado por BYNS7, 02-11-2026).
   · Pestañas de la cabecera: se quita «Celular»; las demás llevan icono, subrayado dorado animado y onda al pulsar.
   · Rosa de los vientos: flecha de norte formal (estilo carta militar) con limbo graduado.
   · Simbología: botón × para cerrarla por completo.
   · Buscador: queda como una lupa; se despliega al pulsarla (o con «/» o Ctrl+K) y se recoge al salir.
   · Escala numérica: se recoge en una píldora con la escala; el aviso «Escala aplicada» se borra solo.
   · Coordenadas: cada valor con su unidad (Este/Norte en metros, latitud/longitud, altitud en m s.n.m.).
   · Vista general: clic o arrastre para mover el mapa, rueda para acercar, «ver toda» y plegar.
   Para volver al aspecto anterior basta quitar el <script src="interfaz-mapa.js">. */
document.addEventListener('DOMContentLoaded', () => {
'use strict';
const map = document.querySelector('.map'); if (!map) return;
const $ = (s, r = document) => r.querySelector(s);
const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const leer = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };

const css = document.createElement('style'); css.id = 'interfaz-mapa';
css.textContent = `
/* ---- pestañas de la cabecera ---- */
.institution-tabs{gap:4px !important}
.institution-tabs button{position:relative !important;overflow:hidden !important;display:inline-flex !important;align-items:center;gap:7px;border-radius:10px !important;padding:8px 13px !important;transition:color .2s,background .25s,transform .2s,box-shadow .25s !important;box-shadow:none !important}
.institution-tabs button .im-ico{width:15px;height:15px;flex:none;color:#E2CB8E;transition:transform .35s cubic-bezier(.3,1.6,.5,1)}
.institution-tabs button::after{content:'';position:absolute;left:14%;right:14%;bottom:3px;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,#E2CB8E,transparent);transform:scaleX(0);transition:transform .3s ease}
.institution-tabs button:hover{background:rgba(226,203,142,.12) !important;transform:translateY(-2px) !important;box-shadow:0 6px 16px rgba(0,0,0,.25) !important}
.institution-tabs button:hover::after,.institution-tabs button[aria-selected=true]::after{transform:scaleX(1)}
.institution-tabs button:hover .im-ico{transform:scale(1.2) rotate(-8deg)}
.institution-tabs button[aria-selected=true]{background:linear-gradient(180deg,rgba(226,203,142,.22),rgba(226,203,142,.08)) !important;color:#fff !important;box-shadow:inset 0 0 0 1px rgba(226,203,142,.45) !important;transform:none !important}
.institution-tabs button:focus-visible{outline:2px solid #E2CB8E;outline-offset:2px}
.im-onda{position:absolute;border-radius:50%;background:rgba(226,203,142,.45);transform:scale(0);animation:im-onda .6s ease-out forwards;pointer-events:none}
@keyframes im-onda{to{transform:scale(4);opacity:0}}
.institution-tab-panel:not([hidden]){animation:im-baja .28s ease-out}
@keyframes im-baja{from{opacity:0;transform:translateY(-8px)}}
/* ---- rosa de los vientos formal ---- */
.map .map-compass{width:84px !important;height:84px !important;padding:0 !important;border-radius:50% !important;background:none !important;box-shadow:none !important;filter:drop-shadow(0 6px 14px rgba(0,0,0,.35)) !important;pointer-events:auto !important;cursor:help}
.map .map-compass svg{width:84px !important;height:84px !important}
.map .map-compass svg text,.map .map-compass svg path{stroke:none;stroke-width:0}
.map .map-compass svg circle{stroke-width:revert-layer}
.map .map-compass .im-flecha{transition:transform .5s cubic-bezier(.3,1.5,.5,1);transform-origin:50px 50px}
.map .map-compass:hover .im-flecha{transform:scale(1.06)}
/* ---- simbología: cabecera con × ---- */
.lg-dock > .sim-card::before{display:none !important;content:none !important}
.map .sim-card .im-simcab{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 !important;padding:6px 7px 6px 11px;background:linear-gradient(90deg,#0B1D33,#1C3A66);border-bottom:2px solid #B79A5B;color:#fff;font:700 10.5px var(--tipo-titulo,system-ui);letter-spacing:.12em}
.im-x{width:24px;height:24px;flex:none;border:1px solid #E2CB8E66;border-radius:7px;background:transparent;color:#fff;font:600 15px/1 system-ui;cursor:pointer;display:grid;place-items:center;padding:0;transition:background .2s,transform .2s,color .2s}
.im-x:hover{background:#B42330;border-color:#B42330;transform:rotate(90deg)}
.map .sim-card:not([hidden]){animation:im-aparece .25s ease-out}
@keyframes im-aparece{from{opacity:0;transform:translateY(-6px) scale(.98)}}
/* ---- buscador: solo lupa ---- */
.map .search{transition:width .35s cubic-bezier(.3,1.2,.5,1),box-shadow .25s,border-radius .3s,padding .3s !important}
.map .search.im-lupa{width:46px !important;height:46px !important;padding:0 !important;padding-left:0 !important;border-radius:50% !important;color:transparent !important;cursor:pointer;background-position:center !important;background-color:#0B1D33 !important;border:1px solid #B79A5B !important;box-shadow:0 6px 18px rgba(0,0,0,.3) !important}
.map .search.im-lupa::placeholder{color:transparent !important}
.map .search.im-lupa:hover{transform:scale(1.08);box-shadow:0 0 0 4px #B79A5B44,0 8px 20px rgba(0,0,0,.35) !important}
.map .im-lupa-ayuda{position:absolute;z-index:3;padding:5px 10px;border-radius:9px;background:#0B1D33ee;color:#E2CB8E;font:700 10px var(--tipo-titulo,system-ui);letter-spacing:.08em;white-space:nowrap;pointer-events:none;opacity:0;transform:translateX(-6px);transition:opacity .2s,transform .2s}
.map .im-lupa-ayuda.ver{opacity:1;transform:none}
.map .im-lupa-ayuda kbd{font:600 9.5px system-ui;color:#fff;border:1px solid #ffffff44;border-radius:4px;padding:0 4px;margin-left:4px}
/* ---- escala plegable ---- */
.map .map-scale .scale-heading{gap:6px !important}
.map .map-scale .im-x{width:20px;height:20px;font-size:13px;margin-left:auto}
.map .map-scale .scale-heading .scale-info-button{margin-left:0}
.map .map-scale.im-recogida{padding:7px 12px !important;cursor:pointer;border-top-width:1px !important;border-radius:20px !important;transition:transform .2s}
.map .map-scale.im-recogida:hover{transform:translateY(-2px)}
.map .map-scale.im-recogida > :not(.scale-value){display:none !important}
.map .map-scale.im-recogida .scale-value{font-size:14px !important;display:flex;align-items:center;gap:7px}
.map .map-scale.im-recogida .scale-value::before{content:'';width:15px;height:6px;border:1.5px solid #E2CB8E;background:linear-gradient(90deg,#E2CB8E 50%,transparent 50%);border-radius:1px}
.map .scale-message{transition:opacity .4s}
/* ---- coordenadas con unidades ---- */
.map .bottom.topo-coord{gap:4px 6px !important;padding:6px 10px !important;max-width:calc(100% - 560px) !important}
.map .topo-coord .im-c{display:inline-flex;flex-direction:column;align-items:flex-start;padding:2px 9px;border-left:1px solid #ffffff1f;line-height:1.2}
.map .topo-coord .im-c:first-child{border-left:0}
.map .topo-coord .im-c i{font:700 8.5px var(--tipo-titulo,system-ui);font-style:normal;letter-spacing:.09em;color:#E2CB8E;white-space:nowrap}
.map .topo-coord .im-c em{font:600 12.5px var(--tipo-texto,system-ui);font-style:normal;color:#fff;white-space:nowrap;font-variant-numeric:tabular-nums}
.map .topo-coord .im-c em small{text-transform:none !important;font-size:10px;color:#C9D4E5 !important;margin-left:3px;font-weight:500}
.map .topo-coord .im-c.im-alt em{color:#9FE3B0}
/* ---- vista general ---- */
.map .overview{pointer-events:auto !important;cursor:crosshair;transition:height .35s ease,box-shadow .25s,transform .25s}
.map .overview:hover{box-shadow:0 0 0 3px #B79A5B55,0 14px 32px rgba(0,0,0,.4) !important}
.map .overview .overview-title{display:flex;align-items:center;gap:6px;cursor:default;padding:4px 5px 4px 8px !important}
.map .overview .overview-title span{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.map .overview .im-ob{width:20px;height:20px;flex:none;border:1px solid #E2CB8E55;border-radius:6px;background:transparent;color:#E2CB8E;font:700 12px/1 system-ui;display:grid;place-items:center;padding:0;cursor:pointer;transition:background .2s}
.map .overview .im-ob:hover{background:#B79A5B;color:#0B1D33}
.map .overview.im-plegada{height:27px !important}
.map .overview.im-plegada > svg{display:none}
.map .overview .im-pos{position:absolute;left:6px;bottom:5px;z-index:2;padding:2px 6px;border-radius:6px;background:#0B1D33cc;color:#E2CB8E;font:600 9px system-ui;pointer-events:none;opacity:0;transition:opacity .2s}
.map .overview:hover .im-pos{opacity:1}
.map .overview.im-arrastra{cursor:grabbing}
`;
document.head.append(css);

/* ================= 1) PESTAÑAS DE LA CABECERA ================= */
const ICO = {
  geo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  local: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  fuentes: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  est: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
};
const icono = k => `<svg class="im-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO[k]}</svg>`;
function pestanas() {
  const nav = $('.institution-tabs'); if (!nav) return;
  nav.querySelectorAll('button').forEach(b => {
    const t = b.textContent.trim();
    if (/celular/i.test(t)) { b.remove(); return; }
    if (b.dataset.im) return; b.dataset.im = '1';
    const k = /informaci/i.test(t) ? 'geo' : /local/i.test(t) ? 'local' : /fuentes/i.test(t) ? 'fuentes' : /estad/i.test(t) ? 'est' : null;
    if (k) b.insertAdjacentHTML('afterbegin', icono(k));
    b.addEventListener('pointerdown', e => {
      const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), o = document.createElement('span');
      o.className = 'im-onda'; o.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.append(o); setTimeout(() => o.remove(), 650);
    });
  });
}
pestanas();
const nav = $('.institution-tabs'); if (nav) new MutationObserver(pestanas).observe(nav, { childList: true });

/* ================= 2) ROSA DE LOS VIENTOS FORMAL ================= */
function rosa() {
  const c = $('.map-compass'); if (!c || c.dataset.im) return; c.dataset.im = '1';
  let marcas = '';
  for (let a = 0; a < 360; a += 10) {
    if (a % 90 === 0) continue;   // en los cardinales van las letras
    const l = a % 30 === 0 ? 5 : 3, r = Math.PI * a / 180, sn = Math.sin(r), k = -Math.cos(r);
    marcas += `<path d="M${(50 + 43 * sn).toFixed(2)} ${(50 + 43 * k).toFixed(2)}L${(50 + (43 - l) * sn).toFixed(2)} ${(50 + (43 - l) * k).toFixed(2)}" style="stroke:#C9D4E5;stroke-opacity:${a % 30 ? .5 : .9};stroke-width:${a % 30 ? .8 : 1.2}px"/>`;
  }
  const letra = (x, y, t, c = '#C9D4E5', f = 8.5) => `<text x="${x}" y="${y}" font-family="Georgia,'Times New Roman',serif" font-size="${f}" font-weight="700" fill="${c}" text-anchor="middle" dominant-baseline="central">${t}</text>`;
  c.innerHTML = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><radialGradient id="im-fondo" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#1C3A66"/><stop offset="1" stop-color="#0B1D33"/></radialGradient></defs>
    <circle cx="50" cy="50" r="48" fill="url(#im-fondo)" stroke="#B79A5B" stroke-width="2.2"/>
    <circle cx="50" cy="50" r="44" fill="none" stroke="#E2CB8E" stroke-opacity=".35" stroke-width=".6"/>
    ${marcas}
    ${letra(50, 12.5, 'N', '#E2CB8E', 12)}${letra(87, 50.5, 'E')}${letra(50, 87.5, 'S')}${letra(13, 50.5, 'O')}
    <g class="im-flecha">
      <path d="M50 21L58 52L50 47Z" fill="#FFFFFF"/><path d="M50 21L42 52L50 47Z" fill="#E2CB8E"/>
      <path d="M50 79L55 53L50 56L45 53Z" style="fill:#0B1D33;stroke:#C9D4E5;stroke-width:1.1px;stroke-linejoin:round"/>
      <circle cx="50" cy="50" r="2.6" fill="#0B1D33" stroke="#E2CB8E" stroke-width="1.2"/>
    </g>
  </svg>`;
  c.title = 'Norte geográfico (NG) · el mapa está orientado al norte';
  c.setAttribute('aria-label', 'Flecha de norte: norte geográfico hacia arriba');
}
rosa();

/* ================= 3) SIMBOLOGÍA CON × ================= */
function simbologia() {
  const card = $('.map .sim-card'), btn = $('.map .sim-btn'); if (!card || !btn) return false;
  const poner = () => {
    if (card.querySelector(':scope > .im-simcab')) return;
    const cab = document.createElement('div'); cab.className = 'im-simcab';
    cab.innerHTML = '<span>SIMBOLOGÍA DEL MAPA</span><button type="button" class="im-x" title="Cerrar la simbología" aria-label="Cerrar la simbología">×</button>';
    cab.querySelector('button').onclick = e => { e.stopPropagation(); if (!card.hidden) btn.click(); };
    card.prepend(cab);
  };
  poner(); new MutationObserver(poner).observe(card, { childList: true });
  return true;
}
if (!simbologia()) { const o = new MutationObserver(() => { if (simbologia()) o.disconnect(); }); o.observe(map, { childList: true }); setTimeout(() => o.disconnect(), 30000); }

/* ================= 4) BUSCADOR: SOLO LUPA ================= */
const bus = $('#search');
if (bus) {
  const sug = $('#suggestions'), ayuda = document.createElement('div');
  ayuda.className = 'im-lupa-ayuda'; ayuda.innerHTML = 'BUSCAR LUGAR O COORDENADA <kbd>/</kbd>'; map.append(ayuda);
  const recoger = () => { bus.classList.add('im-lupa'); bus.title = 'Buscar lugares, vías, salud, educación o coordenadas (tecla /)'; };
  const abrir = () => { if (!bus.classList.contains('im-lupa')) return; bus.classList.remove('im-lupa'); ayuda.classList.remove('ver'); bus.title = ''; };
  const sitio = () => { ayuda.style.left = (bus.offsetLeft + 56) + 'px'; ayuda.style.top = (bus.offsetTop + 13) + 'px'; };
  recoger();
  bus.addEventListener('pointerdown', abrir);
  bus.addEventListener('focus', abrir);
  bus.addEventListener('mouseenter', () => { if (bus.classList.contains('im-lupa')) { sitio(); ayuda.classList.add('ver'); } });
  bus.addEventListener('mouseleave', () => ayuda.classList.remove('ver'));
  bus.addEventListener('blur', () => setTimeout(() => {
    if (document.activeElement === bus) return;
    if (sug && !sug.hidden && sug.matches(':hover')) return;
    recoger();
  }, 220));
  bus.addEventListener('keydown', e => { if (e.key === 'Escape') { bus.value = ''; bus.dispatchEvent(new Event('input', { bubbles: true })); bus.blur(); } });
  document.addEventListener('keydown', e => {
    const t = e.target, escribe = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if ((e.key === '/' && !escribe) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); abrir(); bus.focus(); }
  });
}

/* ================= 5) ESCALA PLEGABLE ================= */
function escala() {
  const box = $('.map .map-scale'); if (!box || box.dataset.im) return; box.dataset.im = '1';
  const cab = box.querySelector('.scale-heading'), x = document.createElement('button');
  x.type = 'button'; x.className = 'im-x'; x.textContent = '×'; x.title = 'Recoger la escala'; x.setAttribute('aria-label', 'Recoger la escala');
  cab && cab.append(x);
  const fijar = v => { box.classList.toggle('im-recogida', v); box.title = v ? 'Escala numérica · clic para abrir' : 'Escala aproximada en el centro del mapa'; guardar('emte-escala-recogida', v ? '1' : '0'); };
  x.addEventListener('click', e => { e.stopPropagation(); fijar(true); });
  box.addEventListener('click', e => { if (box.classList.contains('im-recogida') && !box.dataset.arrastrado) { e.stopPropagation(); fijar(false); } }, true);
  fijar(leer('emte-escala-recogida') === '1');
  // el aviso «Escala aplicada» se borra solo
  const msg = box.querySelector('.scale-message'); let t;
  if (msg) new MutationObserver(() => {
    if (!msg.textContent) return; clearTimeout(t); msg.style.opacity = '1';
    t = setTimeout(() => { msg.style.opacity = '0'; setTimeout(() => { msg.textContent = ''; msg.style.opacity = ''; }, 400); }, 2600);
  }).observe(msg, { childList: true, characterData: true, subtree: true });
}
escala();

/* ================= 6) COORDENADAS CON UNIDADES ================= */
const barra = $('.map .bottom');
const celda = (cls, et, val, tit) => `<span class="im-c ${cls}" title="${tit}"><i>${et}</i><em>${val}</em></span>`;
function coordenadas() {
  if (!barra || barra.dataset.imOk === '1') return;
  const ps = barra.querySelector('.topo-pista');
  if (ps) { barra.dataset.imOk = '1'; ps.title = 'UTM WGS 84 zona 19 Sur en metros · latitud y longitud en grados · altitud en metros sobre el nivel medio del mar'; ps.textContent = '⌖ Mueve el cursor · UTM (m) · Lat/Long · Altitud (m s.n.m.)'; return; }
  const sp = [...barra.children].filter(s => !s.classList.contains('im-c'));
  if (!sp.length) return;
  barra.dataset.imOk = '1';
  sp.forEach(s => {
    let html = '';
    const b = s.querySelector('b'), et = b ? b.textContent.trim().toUpperCase() : '', val = (b ? s.textContent.slice(b.textContent.length) : s.textContent).trim();
    let m;
    if (et === 'UTM' && (m = val.match(/^(\d+)\s*([NS])\s+(.+?)\s*E\s*·\s*(.+?)\s*N$/))) {
      html += celda('', 'UTM · ZONA', `${m[1]} ${m[2] === 'S' ? 'Sur' : 'Norte'}`, 'Proyección UTM, datum WGS 84')
        + celda('', 'ESTE (X)', `${m[3]}<small>m</small>`, 'Coordenada Este: metros hacia el este dentro de la zona UTM')
        + celda('', 'NORTE (Y)', `${m[4]}<small>m</small>`, 'Coordenada Norte: metros desde el ecuador (con falso norte de 10 000 000 m en el hemisferio sur)');
    } else if (et === 'GEO' && (m = val.match(/^(.+?[NS])\s+(.+?[EO])$/))) {
      html += celda('', 'LATITUD', m[1], 'Latitud en grados, minutos y segundos (S = sur del ecuador)')
        + celda('', 'LONGITUD', m[2], 'Longitud en grados, minutos y segundos (O = oeste de Greenwich)');
    } else if (et === 'ALT' && (m = val.match(/^([\d.,\s]+)\s*m$/i))) {
      html += celda('im-alt', 'ALTITUD', `${m[1].trim()}<small>m s.n.m.</small>`, 'Altura en metros sobre el nivel medio del mar (m s.n.m.), tomada del modelo digital de elevación');
    } else return;
    s.insertAdjacentHTML('beforebegin', html); s.remove();
  });
}
if (barra) {
  new MutationObserver(() => { barra.dataset.imOk = ''; coordenadas(); }).observe(barra, { childList: true });
  coordenadas();
  barra.title = 'Coordenadas del cursor · clic para copiar las coordenadas UTM';
}

/* ================= 7) VISTA GENERAL INTERACTIVA ================= */
function vistaGeneral() {
  const ov = $('.map .overview'); if (!ov || ov.dataset.im) return !!ov; ov.dataset.im = '1';
  const tit = ov.querySelector('.overview-title'), mini = ov.querySelector(':scope > svg'), scene = document.getElementById('scene');
  ov.setAttribute('role', 'group'); ov.setAttribute('aria-label', 'Vista general: clic o arrastre para mover el mapa');
  if (tit) {
    const txt = tit.textContent; tit.textContent = '';
    const s = document.createElement('span'); s.textContent = txt; tit.append(s);
    const b1 = document.createElement('button'), b2 = document.createElement('button');
    b1.type = b2.type = 'button'; b1.className = b2.className = 'im-ob';
    b1.textContent = '⤢'; b1.title = 'Ver toda la provincia';
    b2.textContent = '–'; b2.title = 'Plegar la vista general';
    tit.append(b1, b2);
    b1.onclick = e => { e.stopPropagation(); verToda(); };
    b2.onclick = e => { e.stopPropagation(); const v = !ov.classList.contains('im-plegada'); ov.classList.toggle('im-plegada', v); b2.textContent = v ? '+' : '–'; b2.title = v ? 'Desplegar la vista general' : 'Plegar la vista general'; guardar('emte-vista-plegada', v ? '1' : '0'); };
    if (leer('emte-vista-plegada') === '1') b2.click();
  }
  const pos = document.createElement('div'); pos.className = 'im-pos'; pos.textContent = 'Clic o arrastra para moverte'; ov.append(pos);
  const aLocal = (x, y) => { const m = mini.getScreenCTM(); return m ? new DOMPoint(x, y).matrixTransform(m.inverse()) : null; };
  let anim = 0;
  function centrar(cx, cy, suave) {
    cancelAnimationFrame(anim);
    const fx = panX, fy = panY, tx = (500 - cx) * scale, ty = (380 - cy) * scale;
    if (!suave) { panX = tx; panY = ty; zoom(1); return; }
    const t0 = performance.now(), d = 320;
    const paso = t => { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); panX = fx + (tx - fx) * e; panY = fy + (ty - fy) * e; zoom(1); if (k < 1) anim = requestAnimationFrame(paso); };
    anim = requestAnimationFrame(paso);
  }
  function verToda() {
    const vb = mini.viewBox.baseVal, main = scene.ownerSVGElement, m = scene.getScreenCTM(), r = main.getBoundingClientRect();
    if (!vb || !vb.width || !m || !r.width) return;
    const ppu = Math.hypot(m.a, m.b), obj = Math.min(r.width / vb.width, r.height / vb.height) * .95;
    const nuevo = Math.max(.008, Math.min(480, scale * obj / ppu)), cx = vb.x + vb.width / 2, cy = vb.y + vb.height / 2;
    panX = (500 - cx) * nuevo; panY = (380 - cy) * nuevo; zoom(nuevo / scale);
  }
  let arr = null;
  ov.addEventListener('pointerdown', e => {
    if (e.button || e.target.closest('.overview-title') || ov.classList.contains('im-plegada')) return;
    e.preventDefault(); e.stopPropagation();
    const p = aLocal(e.clientX, e.clientY); if (!p) return;
    arr = { id: e.pointerId, mov: false }; ov.setPointerCapture(e.pointerId);
    centrar(p.x, p.y, true);
  }, true);
  ov.addEventListener('pointermove', e => {
    if (!arr || e.pointerId !== arr.id) return;
    e.stopPropagation(); arr.mov = true; ov.classList.add('im-arrastra');
    const p = aLocal(e.clientX, e.clientY); if (p) centrar(p.x, p.y, false);
  }, true);
  const fin = e => { if (!arr || e.pointerId !== arr.id) return; e.stopPropagation(); arr = null; ov.classList.remove('im-arrastra'); };
  ov.addEventListener('pointerup', fin, true); ov.addEventListener('pointercancel', fin, true);
  ov.addEventListener('click', e => { if (!e.target.closest('.overview-title')) e.stopPropagation(); }, true);
  ov.addEventListener('wheel', e => { e.preventDefault(); e.stopPropagation(); zoom(e.deltaY < 0 ? 1.25 : .8); }, { passive: false });
  return true;
}
if (!vistaGeneral()) { const o = new MutationObserver(() => { if (vistaGeneral()) o.disconnect(); }); o.observe(map, { childList: true }); setTimeout(() => o.disconnect(), 30000); }
});
