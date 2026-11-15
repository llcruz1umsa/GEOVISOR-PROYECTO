/* MOVIMIENTO FLUIDO DEL MAPA EN LA LAPTOP / PC (12-11-2026): el mismo método que la tablet (movil-fluido.js).
   Antes en la PC el mapa se volvía a dibujar entero a mitad del arrastre o del zoom con la rueda; ahora solo al soltar.
   (Texto original de la versión para tablet:)
   Agregado el 10-11-2026. Reemplaza la «fluidez» general por una afinada para pantallas táctiles:
   · El mapa queda siempre preparado en la tarjeta gráfica (no se vuelve a preparar al empezar cada arrastre).
   · Mientras el dedo se mueve, el mapa se desliza como una sola imagen y NO se redibujan las miles de líneas;
     se redibuja una sola vez al soltar (o, en arrastres o pellizcos muy largos, en el siguiente cuadro libre).
   · No cambia el estilo de las líneas al empezar/terminar (eso obligaba a repintar todo en cada toque).
*/
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => setTimeout(iniciar, 0));
  // 11-11-2026: como una aplicación, a PANTALLA COMPLETA (el navegador lo permite solo después del primer toque)
  function completa() { const R = document.documentElement; if (document.fullscreenElement || !R.requestFullscreen || window.GeoAndroid) return; try { const p = R.requestFullscreen({ navigationUI: 'hide' }); if (p && p.catch) p.catch(() => {}); } catch (e) {} }
  document.addEventListener('pointerup', completa, { once: true, capture: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) document.addEventListener('pointerup', completa, { once: true, capture: true }); });   // después de fluidez.js y gestos-tactiles.js

  function iniciar() {
    if (window.EMTE_FLUIDO) return; window.EMTE_FLUIDO = true;   // 12-11-2026: también lo usa el programa de PC (fluidez-pc.js); se aplica una sola vez
    const svg = document.querySelector('.map svg'), scene = document.getElementById('scene');
    if (!svg || !scene || typeof zoom !== 'function') return;

    const css = document.createElement('style');
    css.textContent = `
.map svg{touch-action:none}`;
    document.head.append(css);

    const capas = () => [svg, ...[...svg.parentElement.querySelectorAll(':scope > svg')].filter(e => e !== svg)];
    const ctmOrig = svg.getScreenCTM.bind(svg);
    let apl = null, M0 = null, cajas = [], fin = 0, activo = false, rafRedibujo = 0;

    // Capas listas en la tarjeta gráfica desde el principio (se vuelve a revisar si aparecen capas nuevas).
    function preparar() {
      const r = svg.getBoundingClientRect();
      cajas = capas().map(e => { const b = e.getBoundingClientRect(); return { e, igual: Math.abs(b.left - r.left) < 1 && Math.abs(b.top - r.top) < 1 && Math.abs(b.width - r.width) < 1 }; })
        .filter(c => c.igual);
      cajas.forEach(c => { c.e.style.transformOrigin = '0 0'; c.e.style.willChange = 'transform'; c.e.style.backfaceVisibility = 'hidden'; });
    }
    preparar();

    function empezar() {
      activo = true; apl = { s: scale, px: panX, py: panY }; document.documentElement.classList.add('mapa-gesto');
      preparar();
      M0 = ctmOrig(); M0.r = svg.getBoundingClientRect();
      svg.parentElement.classList.add('gesto-movil');
      svg.getScreenCTM = () => M0;
      scene.getScreenCTM = () => { const s = scale; return DOMMatrix.fromMatrix(M0).multiply(new DOMMatrix([s, 0, 0, s, 500 * (1 - s) + panX, 380 * (1 - s) + panY])); };
    }
    function quitarTransformes() { cajas.forEach(c => { c.e.style.transform = ''; }); delete svg.getScreenCTM; delete scene.getScreenCTM; }
    function mover() {
      const k = scale / apl.s;
      const ax = 500 * (1 - apl.s) + apl.px, ay = 380 * (1 - apl.s) + apl.py;
      const bx = 500 * (1 - scale) + panX, by = 380 * (1 - scale) + panY;
      const tx = bx - k * ax, ty = by - k * ay;
      const E = M0.e - M0.r.left, F = M0.f - M0.r.top;
      const cx = M0.a * tx + E * (1 - k), cy = M0.d * ty + F * (1 - k);
      const t = `translate3d(${cx}px,${cy}px,0) scale(${k})`;
      cajas.forEach(c => { c.e.style.transform = t; });
      // Solo en gestos muy largos se redibuja a mitad del gesto, y fuera del evento táctil (en el siguiente cuadro libre).
      if (!rafRedibujo && (k < .3 || k > 3.6 || Math.abs(cx) > M0.r.width * .7 || Math.abs(cy) > M0.r.height * .7))
        rafRedibujo = requestAnimationFrame(() => { rafRedibujo = 0; if (activo) { terminar(true); } });
    }
    function terminar(seguir) {
      if (!activo) return;
      activo = false; quitarTransformes();
      zoomBase(1);
      if (seguir) { empezar(); mover(); } else { svg.parentElement.classList.remove('gesto-movil'); document.documentElement.classList.remove('mapa-gesto'); }
    }
    window.vistaEnCuadro = function () {
      if (!activo) empezar();
      mover();
      clearTimeout(fin); fin = setTimeout(() => terminar(false), 180);
    };
    // Si un botón (+/−, ir a un lugar, buscar) llama a zoom() en medio de un gesto, se dibuja de una vez.
    const zoomBase = zoom;
    zoom = function (f) {
      if (activo) { activo = false; clearTimeout(fin); cancelAnimationFrame(rafRedibujo); rafRedibujo = 0; quitarTransformes(); svg.parentElement.classList.remove('gesto-movil'); document.documentElement.classList.remove('mapa-gesto'); }
      return zoomBase(f);
    };
    // Al girar la tablet o cambiar el tamaño, se vuelven a preparar las capas.
    window.addEventListener('resize', () => { if (!activo) preparar(); });
  }
})();
