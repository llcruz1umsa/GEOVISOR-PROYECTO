document.addEventListener('DOMContentLoaded', () => {
  const aside = document.querySelector('main > aside');
  if (!aside) return;
  const items = [
    ['Una unidad', 'Símbolo básico para representar una unidad.', '<rect x="27" y="20" width="46" height="27"/>'],
    ['Una instalación, SPAC o puesto', 'Denominación utilizada en la tabla del documento.', '<circle cx="50" cy="34" r="18"/>'],
    ['Un puesto comando', 'Símbolo básico de puesto comando.', '<path d="M28 60V13H73V40H28"/>'],
    ['Un puesto de observación', 'Símbolo básico de puesto de observación.', '<path d="M50 13L72 51H28Z"/>'],
    ['Ubicación o vigencia futura o propuesta', 'Variante con contorno discontinuo.', '<rect x="22" y="18" width="56" height="32" stroke-dasharray="6 4"/>'],
    ['Simulado', 'El documento presenta un trazo discontinuo adicional sobre otro símbolo.', '<rect x="30" y="29" width="40" height="25"/><path d="M19 34L50 12L81 34" stroke-dasharray="6 4"/>']
  ];
  const style = document.createElement('style');
  style.textContent = '.symbol-reference{margin:20px 0;border:1px solid #b28405;border-radius:10px;overflow:hidden}.symbol-reference>summary{padding:14px;background:#070774;color:white;font-weight:600;font-size:12px}.symbol-reference-content{padding:10px}.symbol-reference-content p{font-size:11px;margin:7px 0}.symbol-reference-content input{width:100%;padding:9px;border:1px solid #c9cddd;border-radius:6px;font:12px system-ui}.symbol-reference-card{margin:9px 0;padding:10px;border:1px solid #e3e5ed;border-radius:8px;background:#fafaff}.symbol-reference-card[hidden]{display:none}.symbol-reference-card svg{display:block;width:100px;height:70px;margin:auto;color:#070774}.symbol-reference-card h4{font-size:12px;margin:5px 0;color:#070774}.symbol-reference-card a,.symbol-reference-content>a{color:#070774;font-size:11px}.symbol-reference-count{display:block;font-size:11px;color:#596077;padding-top:8px}';
  document.head.append(style);
  const map = document.querySelector('.map');
  const floatStyle = document.createElement('style');
  floatStyle.textContent = '.symbol-reference-card button{display:block;margin-top:9px;padding:7px 9px;background:#070774;color:white;font-size:11px}.symbol-study-float{position:absolute;z-index:25;width:230px;max-width:100%;max-height:100%;overflow:auto;background:#fffffff5;border:1px solid #b28405;border-radius:10px;box-shadow:0 6px 24px #0004;color:#070774}.symbol-study-handle{display:block;width:100%;border:0;border-radius:9px 9px 0 0;background:#070774;color:white;padding:9px 35px 9px 10px;text-align:left;font-size:11px;cursor:move;touch-action:none}.symbol-study-handle:hover{background:#19198b}.symbol-study-close{position:absolute;right:4px;top:3px;padding:3px 7px;border:0;background:transparent;color:white;font-size:19px}.symbol-study-content{padding:10px}.map .symbol-study-content svg{display:block;width:100px;height:70px;margin:auto;cursor:default;touch-action:auto}.symbol-study-content h4{margin:4px 0;font-size:13px}.symbol-study-content p{font-size:11px;margin:7px 0}.symbol-study-content a{font-size:11px;color:#070774}';
  floatStyle.textContent += '.symbol-study-float{width:100px;background:transparent;border:0;border-radius:0;box-shadow:none;overflow:visible}.symbol-study-handle{width:100px;height:70px;padding:0;background:transparent;color:#070774;border-radius:5px}.symbol-study-handle:hover{background:transparent}.symbol-study-handle:focus-visible{outline:2px solid #b28405}.map .symbol-study-handle svg{width:100px;height:70px;cursor:move;filter:drop-shadow(0 0 2px white) drop-shadow(0 1px 1px white)}.symbol-study-content{position:relative;width:230px;max-width:100%;background:#fffffff5;border:1px solid #b28405;border-radius:9px;box-shadow:0 6px 24px #0004;padding:28px 10px 10px}.symbol-study-content[hidden]{display:none}.symbol-study-float.is-open{width:230px}.symbol-study-close{color:#070774;top:3px;right:4px}.symbol-study-hide{padding:6px;margin-top:9px;font-size:11px}';
  document.head.append(floatStyle);
  const floats = new Set();
  function keepInside(floating, x, y) {
    floating.style.left = Math.max(0, Math.min(x, map.clientWidth - floating.offsetWidth)) + 'px';
    floating.style.top = Math.max(0, Math.min(y, map.clientHeight - floating.offsetHeight)) + 'px';
  }
  if (map && typeof ResizeObserver !== 'undefined') new ResizeObserver(() => {
    for (const floating of floats) keepInside(floating, floating.offsetLeft, floating.offsetTop);
  }).observe(map);
  function showStudy(name, description, svg, opener) {
    if (!map) return;
    const floating = document.createElement('section');
    floating.className = 'symbol-study-float'; floating.setAttribute('aria-label', 'Ficha de estudio: ' + name);
    const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'symbol-study-handle';
    handle.append(svg.cloneNode(true)); handle.setAttribute('aria-label', 'Mostrar información: ' + name); handle.setAttribute('aria-expanded', 'false'); handle.title = 'Clic: información. Arrastrar: mover. Flechas: mover con teclado.';
    const close = document.createElement('button'); close.type = 'button'; close.className = 'symbol-study-close'; close.textContent = '×'; close.setAttribute('aria-label', 'Cerrar ficha de ' + name);
    const content = document.createElement('div'); content.className = 'symbol-study-content'; content.hidden = true;
    const heading = document.createElement('h4'); heading.textContent = name;
    const text = document.createElement('p'); text.textContent = description;
    const link = document.createElement('a'); link.href = 'assets/reglamento-simbologia.pdf#page=3'; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Consultar página 3 del documento';
    const hide = document.createElement('button'); hide.type = 'button'; hide.className = 'symbol-study-hide'; hide.textContent = 'Ocultar información';
    content.append(close, heading, text, link, hide); floating.append(handle, content); map.append(floating); floats.add(floating);
    keepInside(floating, (map.clientWidth - floating.offsetWidth) / 2 + floats.size * 8, 90 + floats.size * 8);
    const remove = () => { floats.delete(floating); floating.remove(); opener.focus(); };
    close.addEventListener('click', remove);
    let dragged = false;
    function toggleInfo(open) {
      content.hidden = !open; floating.classList.toggle('is-open', open); handle.setAttribute('aria-expanded', String(open));
      keepInside(floating, floating.offsetLeft, floating.offsetTop);
    }
    handle.addEventListener('click', () => { if (dragged) { dragged = false; return; } toggleInfo(content.hidden); });
    hide.addEventListener('click', () => { toggleInfo(false); handle.focus(); });
    floating.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); if (!content.hidden) { toggleInfo(false); handle.focus(); } else remove(); } });
    for (const type of ['pointerdown', 'click', 'dblclick', 'wheel']) floating.addEventListener(type, event => event.stopPropagation());
    let drag = null;
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragged = false;
      drag = {id:event.pointerId,x:event.clientX,y:event.clientY,left:floating.offsetLeft,top:floating.offsetTop};
      handle.setPointerCapture(event.pointerId); event.preventDefault(); handle.focus();
    });
    handle.addEventListener('pointermove', event => {
      if (drag && event.pointerId === drag.id) {
        if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 4) dragged = true;
        if (dragged) keepInside(floating, drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
      }
    });
    for (const type of ['pointerup','pointercancel','lostpointercapture']) handle.addEventListener(type, () => { drag = null; });
    handle.addEventListener('keydown', event => {
      const direction = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
      if (!direction) return;
      event.preventDefault(); event.stopPropagation(); const step = event.shiftKey ? 30 : 10;
      keepInside(floating, floating.offsetLeft + direction[0] * step, floating.offsetTop + direction[1] * step);
    });
    handle.focus();
  }
  const panel = document.createElement('details');
  panel.className = 'symbol-reference';
  panel.innerHTML = '<summary>◈ Consulta de simbología</summary><div class="symbol-reference-content"><p>Catálogo educativo · Símbolos básicos · Página 3</p><input type="search" aria-label="Buscar símbolo básico" placeholder="Buscar un símbolo…"><span class="symbol-reference-count" role="status"></span><div class="symbol-reference-list"></div><a href="assets/reglamento-simbologia.pdf#page=3" target="_blank" rel="noopener">Consultar el documento original (PDF)</a><p>Representaciones vectoriales de referencia. Comprueba el dibujo original en la página indicada.</p></div>';
  const list = panel.querySelector('.symbol-reference-list');
  for (const [name, description, drawing] of items) {
    const card = document.createElement('article');
    card.className = 'symbol-reference-card';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 70');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = '<g fill="none" stroke="currentColor" stroke-width="2">' + drawing + '</g>';
    const title = document.createElement('h4'); title.textContent = name;
    const text = document.createElement('p'); text.textContent = description;
    const link = document.createElement('a');
    link.href = 'assets/reglamento-simbologia.pdf#page=3'; link.target = '_blank'; link.rel = 'noopener'; link.textContent = 'Referencia: página 3';
    const show = document.createElement('button'); show.type = 'button'; show.textContent = 'Mostrar símbolo sobre el mapa';
    show.addEventListener('click', () => showStudy(name, description, svg, show));
    card.append(svg, title, text, link, show); list.append(card);
  }
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const search = panel.querySelector('input');
  function filter() {
    let count = 0;
    for (const card of list.children) {
      card.hidden = !normalize(card.textContent).includes(normalize(search.value.trim()));
      if (!card.hidden) count++;
    }
    panel.querySelector('.symbol-reference-count').textContent = count ? `${count} símbolos disponibles` : 'No se encontraron símbolos.';
  }
  search.addEventListener('input', filter); filter(); aside.append(panel);
});
