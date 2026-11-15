/* PANTALLA DE CARGA «SIGTA» (programa de escritorio, tablet/celular y versión web) · 11-11-2026.
   Mientras se descargan los botones y herramientas del geovisor se muestra una animación de acercamiento, del más
   grande al más pequeño:  MUNDO → BOLIVIA → PROVINCIA OMASUYOS → SIGTA,  con una barra de carga real.
   Imágenes: assets/carga/1_mundo.jpg, 2_bolivia.jpg, 3_omasuyos.jpg y 4_sigta.jpg.
   Nunca deja la pantalla tapada: si algo falla o tarda, se quita sola; también se puede tocar «OMITIR». */
(function () {
  'use strict';
  if (window.__sigtaCarga) return; window.__sigtaCarga = true;
  var html = document.documentElement;
  html.classList.add('geo-cargando');
  var BASE = 'assets/carga/';
  // foco = punto (en % de la imagen) hacia donde se acerca la cámara para pasar a la siguiente escena
  var ETAPAS = [
    { img: '1_mundo.jpg', foco: [29, 67], t: 2800, a: 'ENLACE SATELITAL ESTABLECIDO', b: 'LOCALIZANDO OBJETIVO · AMÉRICA DEL SUR' },
    { img: '2_bolivia.jpg', foco: [36.5, 50], t: 2800, a: 'OBJETIVO: BOLIVIA', b: 'LAT 16°42′ S · LON 64°40′ O' },
    { img: '3_omasuyos.jpg', foco: [59, 51], t: 3300, a: 'SECTOR: PROVINCIA OMASUYOS', b: 'DEPARTAMENTO DE LA PAZ · LAGO TITICACA' },
    { img: '4_sigta.jpg', foco: [50, 50], t: 3000, logo: true, a: 'SIGTA EN LÍNEA', b: 'PREPARANDO CAPAS Y HERRAMIENTAS' }
  ];
  var st = document.createElement('style');
  st.textContent =
    'html.geo-cargando{background:#031234!important}' +
    'html.geo-cargando body{visibility:hidden!important}' +
    'html.geo-saliendo body{animation:geo-aparece .35s ease-out}' +
    '@keyframes geo-aparece{from{opacity:0}to{opacity:1}}' +
    '#sigta-carga{position:fixed;inset:0;z-index:2147483647;overflow:hidden;background:#031234;color:#fff;visibility:visible;' +
      'font-family:Bahnschrift,"Arial Narrow","Roboto Condensed",Arial,sans-serif;user-select:none;-webkit-user-select:none;touch-action:none}' +
    '#sigta-carga.fin{animation:sc-fin .5s ease-in forwards;pointer-events:none}' +
    '#sigta-carga .sc-esc{position:absolute;inset:0}' +
    '#sigta-carga .sc-esc.tiembla{animation:sc-tiembla .32s linear}' +
    '#sigta-carga img.sc-i{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;will-change:transform,opacity;backface-visibility:hidden}' +
    '#sigta-carga img.sc-i.on{opacity:1;animation:sc-entra .9s cubic-bezier(.2,.8,.2,1) both,sc-empuje 4.2s linear .9s forwards}' +
    '#sigta-carga img.sc-i.logo.on{animation:sc-golpe .85s cubic-bezier(.15,.9,.25,1) both,sc-late 2.6s ease-in-out .85s infinite}' +
    '#sigta-carga img.sc-i.sale{animation:sc-sale .8s cubic-bezier(.6,0,.9,.4) both}' +
    '@media (orientation:portrait){#sigta-carga img.sc-i.logo{object-fit:contain}}' +
    '#sigta-carga .sc-flash{position:absolute;inset:0;pointer-events:none;opacity:0;background:radial-gradient(circle at var(--fx,50%) var(--fy,50%),#fff 0,#ffd257 14%,#ffb30055 38%,transparent 70%)}' +
    '#sigta-carga .sc-flash.on{animation:sc-flash .8s ease-out}' +
    '#sigta-carga .sc-scan{position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.16) 0 1px,transparent 1px 3px);mix-blend-mode:multiply;opacity:.55}' +
    '#sigta-carga .sc-scan::after{content:"";position:absolute;left:0;right:0;height:18%;top:-20%;background:linear-gradient(180deg,transparent,rgba(255,196,60,.10),transparent);animation:sc-barrido 2.4s linear infinite}' +
    '#sigta-carga .sc-vin{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 55%,rgba(1,8,26,.75) 100%)}' +
    '#sigta-carga .sc-esq{position:absolute;width:34px;height:34px;border:2px solid #f4b21b;opacity:.9;pointer-events:none}' +
    '#sigta-carga .sc-esq.a{left:16px;top:16px;border-right:0;border-bottom:0}#sigta-carga .sc-esq.b{right:16px;top:16px;border-left:0;border-bottom:0}' +
    '#sigta-carga .sc-esq.c{left:16px;bottom:16px;border-right:0;border-top:0}#sigta-carga .sc-esq.d{right:16px;bottom:16px;border-left:0;border-top:0}' +
    '#sigta-carga .sc-txt{position:absolute;left:clamp(26px,4vw,64px);top:clamp(26px,5vh,58px);text-shadow:0 2px 8px #000,0 0 14px #000c;pointer-events:none}' +
    '#sigta-carga .sc-txt p{margin:0;white-space:nowrap;overflow:hidden;font-style:italic;font-weight:700;letter-spacing:.14em}' +
    '#sigta-carga .sc-txt .a{font-size:clamp(13px,1.9vw,24px);color:#fff}#sigta-carga .sc-txt .a::before{content:"▸ ";color:#f4b21b}' +
    '#sigta-carga .sc-txt .b{margin-top:5px;font-size:clamp(10px,1.2vw,15px);color:#f4b21b;font-weight:600}' +
    '#sigta-carga .sc-txt p.escribe{animation:sc-escribe .9s steps(26,end) both}' +
    '#sigta-carga .sc-pie{position:absolute;left:50%;bottom:clamp(20px,5.5vh,58px);transform:translateX(-50%);width:min(760px,84vw);text-align:center;pointer-events:none}' +
    '#sigta-carga .sc-rot{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:9px;font:italic 700 clamp(11px,1.35vw,17px)/1 Bahnschrift,"Arial Narrow",Arial,sans-serif;letter-spacing:.42em;color:#eef2ff;text-shadow:0 2px 6px #000}' +
    '#sigta-carga .sc-rot::before,#sigta-carga .sc-rot::after{content:"";height:2px;width:clamp(26px,6vw,70px);background:#f4b21b}' +
    '#sigta-carga .sc-fila{display:flex;align-items:center;gap:12px}' +
    '#sigta-carga .sc-fila small{flex:none;width:44px;font:italic 700 clamp(11px,1.2vw,15px)/1 Bahnschrift,Arial,sans-serif;color:#fff;text-shadow:0 1px 4px #000}' +
    '#sigta-carga .sc-via{flex:1;height:clamp(16px,2.4vh,24px);padding:3px;border:2px solid #f4b21b;background:rgba(2,10,34,.82);transform:skewX(-22deg);box-shadow:0 0 14px #f4b21b66,inset 0 0 10px #000}' +
    '#sigta-carga .sc-via i{display:block;height:100%;width:0;background:repeating-linear-gradient(115deg,#ffd84a 0 12px,#f09a00 12px 24px);background-size:200% 100%;box-shadow:0 0 12px #ffc22e;animation:sc-franjas .7s linear infinite}' +
    '#sigta-carga .sc-pct{display:inline-block;margin-top:9px;padding:5px 22px;border:2px solid #f4b21b;background:rgba(2,10,34,.86);transform:skewX(-22deg);font:italic 700 clamp(14px,1.8vw,22px)/1 Bahnschrift,Arial,sans-serif;letter-spacing:.06em;box-shadow:0 0 12px #f4b21b55}' +
    '#sigta-carga .sc-pct span{display:inline-block;transform:skewX(22deg);min-width:3.2em}' +
    '#sigta-carga .sc-omitir{position:absolute;right:clamp(26px,4vw,64px);top:clamp(24px,5vh,56px);padding:8px 16px;border:1px solid #f4b21b;background:rgba(2,10,34,.7);color:#f4b21b;' +
      'font:italic 700 12px/1 Bahnschrift,Arial,sans-serif;letter-spacing:.2em;cursor:pointer;opacity:0;transition:opacity .3s;transform:skewX(-14deg)}' +
    '#sigta-carga .sc-omitir.ver{opacity:.95}' +
    '@keyframes sc-entra{from{opacity:0;transform:scale(1.28);filter:blur(6px) brightness(1.7)}to{opacity:1;transform:scale(1);filter:none}}' +
    '@keyframes sc-empuje{from{transform:scale(1)}to{transform:scale(1.12)}}' +
    '@keyframes sc-sale{from{opacity:1;transform:scale(1.06);filter:none}to{opacity:0;transform:scale(3.4);filter:blur(5px) brightness(1.6)}}' +
    '@keyframes sc-golpe{0%{opacity:0;transform:scale(2.3);filter:blur(12px) brightness(2.2)}60%{opacity:1;transform:scale(.97);filter:blur(0) brightness(1.25)}100%{opacity:1;transform:scale(1);filter:none}}' +
    '@keyframes sc-late{0%,100%{filter:brightness(1)}50%{filter:brightness(1.14)}}' +
    '@keyframes sc-flash{0%{opacity:0}18%{opacity:.85}100%{opacity:0}}' +
    '@keyframes sc-tiembla{0%,100%{transform:translate(0,0)}15%{transform:translate(-7px,3px)}30%{transform:translate(6px,-4px)}45%{transform:translate(-4px,-2px)}60%{transform:translate(4px,3px)}80%{transform:translate(-2px,1px)}}' +
    '@keyframes sc-barrido{to{top:110%}}' +
    '@keyframes sc-franjas{to{background-position:-48px 0}}' +
    '@keyframes sc-escribe{from{max-width:0}to{max-width:100vw}}' +
    '@keyframes sc-fin{to{opacity:0;transform:scale(1.08);filter:brightness(1.6)}}' +
    '@media (prefers-reduced-motion:reduce){#sigta-carga img.sc-i.on,#sigta-carga img.sc-i.logo.on,#sigta-carga img.sc-i.sale,#sigta-carga .sc-esc.tiembla{animation-duration:.01s}#sigta-carga .sc-scan::after{animation:none}}';
  (document.head || html).appendChild(st);

  var caja = document.createElement('div'); caja.id = 'sigta-carga'; caja.setAttribute('role', 'status'); caja.setAttribute('aria-label', 'Cargando el sistema SIGTA');
  caja.innerHTML = '<div class="sc-esc"></div><div class="sc-flash"></div><div class="sc-vin"></div><div class="sc-scan"></div>' +
    '<i class="sc-esq a"></i><i class="sc-esq b"></i><i class="sc-esq c"></i><i class="sc-esq d"></i>' +
    '<div class="sc-txt"><p class="a"></p><p class="b"></p></div>' +
    '<div class="sc-pie"><div class="sc-rot">CARGANDO SISTEMA…</div><div class="sc-fila"><small>0%</small><div class="sc-via"><i></i></div><small>100%</small></div><div class="sc-pct"><span>0%</span></div></div>' +
    '<button type="button" class="sc-omitir">OMITIR ▸▸</button>';
  html.appendChild(caja);   // fuera de <body>: el cuerpo queda oculto hasta que el geovisor esté armado
  var esc = caja.querySelector('.sc-esc'), flash = caja.querySelector('.sc-flash'), tA = caja.querySelector('.sc-txt .a'), tB = caja.querySelector('.sc-txt .b'),
    barra = caja.querySelector('.sc-via i'), pct = caja.querySelector('.sc-pct span'), omitir = caja.querySelector('.sc-omitir');

  // imágenes: se piden todas de una vez; cada escena espera (un poco) a que la suya esté lista
  ETAPAS.forEach(function (e) {
    var im = new Image(); im.className = 'sc-i' + (e.logo ? ' logo' : ''); im.alt = ''; im.decoding = 'async'; im.draggable = false;
    im.style.objectPosition = e.foco[0] + '% ' + e.foco[1] + '%'; im.style.transformOrigin = e.foco[0] + '% ' + e.foco[1] + '%';
    im.onload = function () { e.lista = true; }; im.onerror = function () { e.lista = true; e.falla = true; };
    im.src = BASE + e.img; e.el = im; esc.appendChild(im);
  });

  var cargado = false, terminado = false, etapa = -1, tEtapa = 0, t0 = Date.now(), prog = 0, secuenciaLista = false;
  var TOTAL = ETAPAS.reduce(function (s, e) { return s + e.t; }, 0);
  function reanimar(el, clase) { el.classList.remove(clase); void el.offsetWidth; el.classList.add(clase); }
  function ponerEtapa(n) {
    var ant = ETAPAS[etapa], e = ETAPAS[n]; etapa = n; tEtapa = Date.now();
    if (ant) { ant.el.classList.remove('on'); ant.el.classList.add('sale'); flash.style.setProperty('--fx', ant.foco[0] + '%'); flash.style.setProperty('--fy', ant.foco[1] + '%'); reanimar(flash, 'on'); }
    if (!e.falla) e.el.classList.add('on');
    if (e.logo) setTimeout(function () { reanimar(esc, 'tiembla'); }, 450);
    tA.textContent = e.a; tB.textContent = e.b; reanimar(tA, 'escribe'); reanimar(tB, 'escribe');
  }
  function salir() {
    if (terminado) return; terminado = true; clearInterval(reloj);
    barra.style.width = '100%'; pct.textContent = '100%';
    html.classList.remove('geo-cargando'); html.classList.add('geo-saliendo'); caja.classList.add('fin');
    setTimeout(function () { html.classList.remove('geo-saliendo'); caja.remove(); st.textContent = ''; }, 600);
  }
  var reloj = setInterval(function () {
    var ahora = Date.now(), e = ETAPAS[etapa], sig = ETAPAS[etapa + 1];
    if (etapa < 0) { if (ETAPAS[0].lista || ahora - t0 > 2500) ponerEtapa(0); }
    else if (sig && ahora - tEtapa >= e.t && (sig.lista || ahora - tEtapa > e.t + 3000)) ponerEtapa(etapa + 1);
    else if (!sig && ahora - tEtapa >= e.t) secuenciaLista = true;
    // barra: avanza con la animación y llega al 100 % cuando el geovisor terminó de armarse
    e = ETAPAS[etapa];
    var avance = etapa < 0 ? 0 : (ETAPAS.slice(0, etapa).reduce(function (s, x) { return s + x.t; }, 0) + Math.min(e.t, ahora - tEtapa)) / TOTAL;
    var meta = cargado ? (secuenciaLista ? 100 : avance * 96) : Math.min(93, avance * 90 + Math.min(3, (ahora - t0) / 6000));
    prog += Math.max(0, meta - prog) * .14; if (meta - prog < .6) prog = meta;
    barra.style.width = prog.toFixed(1) + '%'; pct.textContent = Math.round(prog) + '%';
    if (cargado && secuenciaLista && prog >= 99.5) salir();
    if (ahora - t0 > 40000) salir();   // por si algo tarda demasiado: nunca deja la pantalla tapada
  }, 40);
  function yaCargo() { cargado = true; omitir.classList.add('ver'); }
  // cuando terminan de cargar todos los archivos, se espera a que los últimos ajustes del diseño se apliquen
  if (document.readyState === 'complete') setTimeout(yaCargo, 350);
  else window.addEventListener('load', function () { setTimeout(yaCargo, 350); });
  setTimeout(yaCargo, 20000);
  omitir.addEventListener('click', function () { if (cargado) salir(); });
  document.addEventListener('keydown', function (ev) { if (cargado && !terminado && (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ')) salir(); });
})();
