# -*- coding: utf-8 -*-
"""Genera el VISOR DE CAMPO: una copia completa del geovisor en UN SOLO ARCHIVO .html que funciona
sin internet y sin servidor (se abre con doble clic en una laptop o desde «Archivos» en una tableta).

Contiene: todas las capas (data/), FFAA y símbolos de planeamiento (planeamiento/), índice de cartas (cartas/),
el modelo de elevación y la imagen satelital 2026 (tiles/sentinel2026). Las funciones que necesitan el
servidor (PostgreSQL, guardar en la base, imágenes de cartas IGM, edición de salud) se desactivan solas.

USO RESTRINGIDO: el archivo incluye la información militar (FFAA, planeamiento). Entréguelo solo a personal autorizado.

Uso:  python generar_visor_campo.py            -> CAMPO/GEOVISOR_OMASUYOS_CAMPO.html
      python generar_visor_campo.py --ligero   -> sin viviendas ni pendientes de alta resolución (archivo más liviano)
(BYNS7 · 05-11-2026)"""
import base64, json, mimetypes, os, re, sys, time
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
WEB = RAIZ / 'web'
SALIDA = RAIZ / 'CAMPO' / ('GEOVISOR_OMASUYOS_CAMPO_LIGERO.html' if '--ligero' in sys.argv else 'GEOVISOR_OMASUYOS_CAMPO.html')
LIGERO = '--ligero' in sys.argv

# carpetas y archivos que se incrustan como datos
CARPETAS = ['data', 'planeamiento', 'cartas', 'tiles/sentinel2026', 'assets/tema', 'assets/logos', 'assets/escudos', 'assets/salud', 'assets/fonts']
SUELTOS = ['assets/three.min.js', 'assets/logo-emte-256.png', 'assets/logo-ejercito-256.png', 'tiles/planet2026/info.json']
EXCLUIR = re.compile(r'\.(zip|pdf|m4a|bak.*)$', re.I)
EXCLUIR_LIGERO = {'data/viviendas_omasuyos.json', 'data/viviendas_hexagonos.json', 'data/pendientes_glo30.png'}
TEXTO = {'.json', '.geojson', '.js', '.css', '.svg', '.txt', '.html'}
for ext, mt in [('.webp', 'image/webp'), ('.geojson', 'application/geo+json'), ('.otf', 'font/otf'), ('.bin', 'application/octet-stream')]:
    mimetypes.add_type(mt, ext)

def recolectar():
    rutas = []
    for c in CARPETAS:
        d = WEB / c
        if d.is_dir():
            rutas += [p for p in d.rglob('*') if p.is_file()]
    rutas += [WEB / s for s in SUELTOS if (WEB / s).is_file()]
    out = {}
    for p in sorted(set(rutas)):
        rel = p.relative_to(WEB).as_posix()
        if EXCLUIR.search(rel) or (LIGERO and rel in EXCLUIR_LIGERO):
            continue
        out[rel] = p
    return out

def js_str(t):
    # cadena JS segura dentro de <script>: sin '<' literal (evita </script>, <!-- y <script)
    return json.dumps(t, ensure_ascii=False).replace('<', '\\u003c').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')

def dato_uri(p):
    mt = mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
    return f'data:{mt};base64,' + base64.b64encode(p.read_bytes()).decode()

def incrustar_urls_css(texto):
    """url('assets/...') dentro de CSS (también el CSS que arma el JS) -> data URI."""
    def rep(m):
        ruta = m.group(2)
        p = WEB / ruta
        return f'url("{dato_uri(p)}")' if p.is_file() and p.stat().st_size < 400_000 else m.group(0)
    texto = re.sub(r'''url\((['"]?)((?:assets|data)/[^'")]+)\1\)''', rep, texto)
    # rutas de imágenes escritas dentro del código (innerHTML, plantillas): también se incrustan
    def rep2(m):
        p = WEB / m.group(2)
        return m.group(1) + dato_uri(p) if p.is_file() and p.stat().st_size < 400_000 else m.group(0)
    return re.sub(r'''(["'`(=])(assets/[A-Za-z0-9_./-]+\.(?:png|jpg|jpeg|svg|webp))''', rep2, texto)

CARGADOR = r"""
/* ===== VISOR DE CAMPO: cargador sin servidor ===== */
(function () {
  'use strict';
  const R = window.__CAMPO_DATOS, URLS = new Map();
  window.__CAMPO = true;
  window.__campoModulo = k => { if (!R[k]) return; const u = URL.createObjectURL(new Blob([R[k].d], { type: 'text/javascript;charset=utf-8' })); document.write('<script src="' + u + '"><\/script>'); };
  const clave = u => {
    let s = String(u == null ? '' : u);
    try { s = decodeURIComponent(new URL(s, location.href).pathname); } catch (e) {}
    const m = s.match(/(?:^|\/)((?:data|planeamiento|cartas|tiles|assets)\/.*)$/);
    return m ? m[1] : (s.startsWith('/api/') ? s : null);
  };
  const bytes = b64 => { const t = atob(b64), a = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) a[i] = t.charCodeAt(i); return a; };
  const blobDe = k => { const e = R[k]; return new Blob([e.b ? bytes(e.d) : e.d], { type: e.m }); };
  const urlDe = k => { if (!URLS.has(k)) URLS.set(k, URL.createObjectURL(blobDe(k))); return URLS.get(k); };
  const API = {
    '/api/sesion': { usuario: 'MODO CAMPO', rol: 'usuario', csrf: 'campo' }
  };
  const fetchOriginal = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (u, op) {
    const url = u && u.url ? u.url : u, k = clave(url);
    if (k && k.startsWith('/api/')) {
      const base = k.replace(/\?.*$/, '');
      if (API[base]) return Promise.resolve(new Response(JSON.stringify(API[base]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      return Promise.resolve(new Response(JSON.stringify({ error: 'VISOR DE CAMPO · SIN SERVIDOR · capas desde la copia incluida' }), { status: 503, headers: { 'Content-Type': 'application/json' } }));
    }
    if (k && R[k]) return Promise.resolve(new Response(blobDe(k), { status: 200, headers: { 'Content-Type': R[k].m } }));
    if (k) return Promise.resolve(new Response('', { status: 404 }));
    return fetchOriginal ? fetchOriginal(u, op) : Promise.reject(new Error('sin red'));
  };
  // imágenes, teselas y scripts que se piden por atributo src / href
  const cambia = v => { const k = clave(v); return k && R[k] ? urlDe(k) : v; };
  for (const C of [HTMLImageElement, HTMLScriptElement, HTMLSourceElement, HTMLAudioElement].filter(Boolean)) {
    const d = Object.getOwnPropertyDescriptor(C.prototype, 'src'); if (!d || !d.set) continue;
    Object.defineProperty(C.prototype, 'src', { get: d.get, set(v) { d.set.call(this, cambia(v)); }, configurable: true });
  }
  const sa = Element.prototype.setAttribute, saNS = Element.prototype.setAttributeNS;
  Element.prototype.setAttribute = function (n, v) { return sa.call(this, n, (n === 'src' || n === 'href' || n === 'xlink:href') ? cambia(v) : v); };
  Element.prototype.setAttributeNS = function (ns, n, v) { return saNS.call(this, ns, n, (n === 'href' || n === 'xlink:href') ? cambia(v) : v); };
  // los <img>/<image> que ya vienen en el HTML
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img[src],image[href]').forEach(e => { const a = e.tagName === 'img' || e.tagName === 'IMG' ? 'src' : 'href', v = e.getAttribute(a), n = cambia(v); if (n !== v) e.setAttribute(a, n); });
    const b = document.createElement('div'); b.className = 'campo-banda';
    b.textContent = 'VISOR DE CAMPO · SIN SERVIDOR · USO RESTRINGIDO · datos del ' + (window.__CAMPO_FECHA || '');
    document.body.append(b);
  });
  // los enlaces a /login o /logout no aplican sin servidor
  document.addEventListener('submit', e => { const f = e.target; if (f && /\/(logout|login)/.test(f.action || '')) { e.preventDefault(); alert('Visor de campo: no hay sesión que cerrar.'); } }, true);
})();
"""
CSS_CAMPO = """.campo-banda{position:fixed;left:50%;bottom:0;transform:translateX(-50%);z-index:99;padding:2px 10px;border-radius:8px 8px 0 0;background:#9B1C1C;color:#fff;font:700 9px system-ui;letter-spacing:.08em;pointer-events:none;white-space:nowrap}
.session-actions form{display:none!important}"""

def main():
    t0 = time.time()
    html = (WEB / 'index.html').read_text(encoding='utf-8')
    datos = recolectar()
    partes, total = [], 0
    for rel, p in datos.items():
        ext = p.suffix.lower(); mt = mimetypes.guess_type(p.name)[0] or 'application/octet-stream'
        if ext in TEXTO:
            txt = p.read_text(encoding='utf-8', errors='replace')
            partes.append(json.dumps(rel) + ':{"m":' + json.dumps(mt + ';charset=utf-8') + ',"d":' + js_str(txt) + '}')
        else:
            partes.append(json.dumps(rel) + ':{"m":' + json.dumps(mt) + ',"b":1,"d":"' + base64.b64encode(p.read_bytes()).decode() + '"}')
        total += p.stat().st_size
    registro = 'window.__CAMPO_DATOS={' + ',\n'.join(partes) + '};window.__CAMPO_FECHA=' + json.dumps(time.strftime('%d/%m/%Y')) + ';'

    modulos = []
    def js_inline(m):
        src = m.group(1)
        p = WEB / src.split('?')[0]
        if not p.is_file():
            return ''
        modulos.append(json.dumps('modulo/' + src) + ':{"m":"text/javascript;charset=utf-8","d":' + js_str(incrustar_urls_css(p.read_text(encoding='utf-8'))) + '}')
        return f'<script>__campoModulo({json.dumps("modulo/" + src)})</script>'
    html = re.sub(r'<script\s+src="([^"]+)"\s*>\s*</script>', js_inline, html)

    def css_inline(m):
        p = WEB / m.group(1)
        return f'<style>{incrustar_urls_css(p.read_text(encoding="utf-8"))}</style>' if p.is_file() else ''
    html = re.sub(r'<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>', css_inline, html)
    html = re.sub(r'<link[^>]*href="([^"]+\.css)"[^>]*rel="stylesheet"[^>]*>', css_inline, html)
    # imágenes fijas del HTML (logos del encabezado)
    html = re.sub(r'src="(assets/[^"]+)"', lambda m: f'src="{dato_uri(WEB / m.group(1))}"' if (WEB / m.group(1)).is_file() else m.group(0), html)
    registro = registro[:-1] if False else registro
    mods = 'Object.assign(window.__CAMPO_DATOS,{' + ',\n'.join(modulos) + '});'
    cab = '<meta charset="utf-8">\n' + f'<script>{registro}</script>\n<script>{mods}</script>\n<script>{CARGADOR}</script>\n<style>{CSS_CAMPO}</style>\n'
    i = html.find('<head>')
    html = html[:i + 6] + '\n' + cab + html[i + 6:] if i >= 0 else cab + html
    html = html.replace('<title>', '<title>CAMPO · ', 1)
    SALIDA.parent.mkdir(parents=True, exist_ok=True)
    SALIDA.write_text(html, encoding='utf-8')
    print(f'Listo: {SALIDA}  ({SALIDA.stat().st_size / 1e6:.1f} MB · {len(datos)} archivos de datos, {total / 1e6:.1f} MB originales · {time.time() - t0:.0f} s)')

if __name__ == '__main__':
    main()
