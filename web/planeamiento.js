// Proyecto PLANEAMIENTO: descarga del proyecto QGIS y del calco (agregado por BYNS7).
document.addEventListener('DOMContentLoaded', () => {
  const aside = document.querySelector('aside');
  if (!aside) return;
  const css = document.createElement('style');
  css.textContent = `.plan-menu>summary{background:#070774;color:#fff;padding:14px;cursor:pointer;font-weight:600;letter-spacing:1px}
.plan-body{padding:14px;display:grid;gap:10px}.plan-body p{margin:0;font-size:12px}
.plan-cuenta{display:flex;gap:8px}.plan-cuenta div{flex:1;background:#f0f3ef;border-radius:8px;padding:8px;text-align:center;font-size:11px;color:#52695d}
.plan-cuenta b{display:block;font-size:18px;color:#070774}
.plan-btn{display:block;text-align:center;text-decoration:none;border:1px solid #070774;border-radius:6px;padding:10px;color:#070774;font-weight:600;font-size:12px}
.plan-btn.pri{background:#070774;color:#fff}.plan-btn:hover{background:#f1f2ff}.plan-btn.pri:hover{background:#12129a}
.plan-lista{max-height:220px;overflow:auto;border:1px solid #dfe5de;border-radius:6px}
.plan-lista table{width:100%;border-collapse:collapse;font-size:11px;font-variant-numeric:tabular-nums}
.plan-lista th,.plan-lista td{padding:5px 6px;border-bottom:1px solid #edf0ed;text-align:left}
.plan-lista th{position:sticky;top:0;background:#f5efdc;color:#7a6b40;font-weight:600}
.plan-bando{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:5px;vertical-align:middle}`;
  document.head.append(css);
  const COL = { Propio: '#0033cc', Enemigo: '#e00000', 'Obstáculo': '#00a030', Contaminado: '#e6c800', Negro: '#111' };
  const d = document.createElement('details');
  d.className = 'layer-menu plan-menu';
  d.innerHTML = `<summary>Proyecto PLANEAMIENTO</summary><div class="plan-body">
<p>Calco de operaciones con simbología militar, hecho en QGIS. El proyecto trae el panel de simbología (192 símbolos, líneas y zonas), la ficha con coordenadas y las herramientas para guardar shape y carta.</p>
<div class="plan-cuenta"><div><b id="plan-s">–</b>símbolos</div><div><b id="plan-l">–</b>líneas</div><div><b id="plan-z">–</b>zonas</div></div>
<a class="plan-btn pri" href="planeamiento/PLANEAMIENTO.zip" download>Descargar proyecto QGIS (ZIP)</a>
<a class="plan-btn" href="planeamiento/calco_planeamiento.geojson" download>Descargar calco (GeoJSON)</a>
<div class="plan-lista"><table><thead><tr><th>Figura</th><th>Latitud</th><th>Longitud</th></tr></thead><tbody id="plan-filas"><tr><td colspan="3">Cargando…</td></tr></tbody></table></div>
<p style="color:#7a8a80">Para abrirlo: descomprime el ZIP, abre PLANEAMIENTO.qgz en QGIS 3.34 o más nuevo y pulsa «Activar macros». Instrucciones completas en LEEME.txt.</p>
</div>`;
  aside.append(d);
  fetch('planeamiento/calco_planeamiento.geojson').then(r => r.json()).then(gj => {
    const n = c => gj.features.filter(f => f.properties.capa === c).length;
    document.getElementById('plan-s').textContent = n('Símbolos militares');
    document.getElementById('plan-l').textContent = n('Líneas tácticas');
    document.getElementById('plan-z').textContent = n('Zonas y áreas');
    const tb = document.getElementById('plan-filas'); tb.textContent = '';
    gj.features.forEach(f => {
      const g = f.geometry, pr = f.properties;
      let c = g.type === 'Point' ? g.coordinates : null;
      if (!c) { const pts = (g.type === 'LineString' ? g.coordinates : g.type === 'MultiLineString' ? g.coordinates.flat() : g.type === 'Polygon' ? g.coordinates[0] : g.coordinates.flat(2)); c = pts[Math.floor(pts.length / 2)]; }
      const tr = document.createElement('tr'), t1 = document.createElement('td'), sw = document.createElement('span');
      sw.className = 'plan-bando'; sw.style.background = COL[pr.bando] || '#0033cc';
      t1.append(sw, document.createTextNode((pr.nombre || pr.tipo || 'Figura') + (pr.escalon ? ' ' + pr.escalon : '')));
      const t2 = document.createElement('td'); t2.textContent = c[1].toFixed(5);
      const t3 = document.createElement('td'); t3.textContent = c[0].toFixed(5);
      tr.append(t1, t2, t3); tb.append(tr);
    });
  }).catch(() => { document.getElementById('plan-filas').innerHTML = '<tr><td colspan="3">No se pudo leer el calco.</td></tr>'; });
});
