/* DOBLE CLIC EN UN CUADRO = AGRANDAR / ACHICAR (11-11-2026).
   Cualquier cuadro flotante del geovisor (fichas, tarjetas, leyendas, ventanas de herramientas, perfil, cartas…)
   se agranda con un doble clic (o doble toque en la tablet), con otro se achica y con otro vuelve a su tamaño,
   como una imagen. Mayús + doble clic lo devuelve a su lugar original. Con Ctrl + rueda del ratón se ajusta poco a poco. No afecta al mapa ni a los campos de texto. */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';
  var NIVELES = [1, 1.4, 0.75], W = function () { return innerWidth; }, H = function () { return innerHeight; };
  var css = document.createElement('style');
  css.textContent = '.cz-zoom{transition:scale .18s ease-out}.cz-aviso{position:fixed;z-index:2147483000;padding:6px 12px;border-radius:14px;background:rgba(11,29,51,.92);border:1px solid #B79A5B;color:#E2CB8E;font:700 12px system-ui;pointer-events:none;animation:cz-sale 1.3s ease-in forwards}@keyframes cz-sale{0%,60%{opacity:1}to{opacity:0}}';
  document.head.appendChild(css);
  function caja(el) {
    if (window.EMTE_VENTANA_DE) { var v = window.EMTE_VENTANA_DE(el); if (v) { var rv = v.getBoundingClientRect(); if (!(rv.width > W() * .85 && rv.height > H() * .85)) return v; } }
    for (var e = el; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
      if (e.closest && e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
      if (e.matches && e.matches('.map, main, main > aside, header, .pp-barra, #sigta-carga')) return null;
      var s = getComputedStyle(e);
      if (s.position !== 'fixed' && s.position !== 'absolute') continue;
      var r = e.getBoundingClientRect();
      if (r.width < 120 || r.height < 50) continue;
      if (r.width > W() * .85 && r.height > H() * .85) return null;    // fondo de una ventana: no se agranda
      var fondo = s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent' || s.backgroundImage !== 'none';
      if (fondo) return e;
    }
    return null;
  }
  function aplicar(e, k, x, y) {
    e.classList.add('cz-zoom');
    e.style.scale = ''; var r = e.getBoundingClientRect();   // «scale» se suma al movimiento (translate) y a la forma propia del cuadro
    // si al agrandar no cabe en la pantalla, se agranda solo hasta donde cabe
    if (k > 1) k = Math.max(1, Math.min(k, (W() - 16) / r.width, (H() - 16) / r.height));
    var ox = r.left + r.width / 2 < W() / 2 ? 'left' : 'right', oy = r.top + r.height / 2 < H() / 2 ? 'top' : 'bottom';
    e.style.transformOrigin = ox + ' ' + oy;
    e.style.scale = k === 1 ? '' : k.toFixed(3);
    e.__czK = k;
    var a = document.createElement('div'); a.className = 'cz-aviso'; a.textContent = Math.round(k * 100) + ' %  ·  doble clic para cambiar';
    a.style.left = Math.min(W() - 210, Math.max(8, x - 90)) + 'px'; a.style.top = Math.max(8, y - 44) + 'px'; document.body.appendChild(a); setTimeout(function () { a.remove(); }, 1400);
  }
  document.addEventListener('dblclick', function (ev) {
    var t = ev.target; if (!t || !t.closest) return;
    if (t.closest('input, textarea, select, [contenteditable=true], .map svg')) return;
    var e = caja(t); if (!e) return;
    var i = NIVELES.indexOf(e.__czN == null ? 1 : NIVELES[e.__czN]); e.__czN = ((e.__czN || 0) + 1) % NIVELES.length;
    try { var sel = getSelection(); if (sel) sel.removeAllRanges(); } catch (x) {}
    aplicar(e, NIVELES[e.__czN], ev.clientX, ev.clientY); void i;
  });
  document.addEventListener('wheel', function (ev) {
    if (!ev.ctrlKey) return; var t = ev.target; if (!t || !t.closest || t.closest('.map svg')) return;
    var e = caja(t); if (!e) return; ev.preventDefault();
    aplicar(e, Math.max(.5, Math.min(2.2, (e.__czK || 1) * (ev.deltaY < 0 ? 1.1 : 1 / 1.1))), ev.clientX, ev.clientY);
  }, { passive: false });
});
