"""Consulta de cartas IGM 1:50.000: imágenes georreferenciadas y descargas.

Las cartas no van en el repositorio (ocupan varios GB). El servidor las lee de la carpeta
09_CARTAS_TOPOGRAFICAS_DIGITALES del proyecto INDICE_CARTAS_IGM_50000, indicada con la
variable de entorno GEOVISOR_CARTAS o, si no existe, en la ruta por defecto de abajo.
  jpg/CARTA_<hoja>.jpg (+ .jgw/.wld)            hoja completa georreferenciada (UTM WGS 84)
  georreferenciadas_completas/CARTA_<hoja>_UTM<z>S_completa.tif   GeoTIFF de la hoja completa
  georreferenciadas/CARTA_<hoja>_*UTM<z>S.tif    GeoTIFF recortado al marco (respaldo)
  pdf/<archivo>.pdf                              PDF original entregado por el IGM (si existe)
Solo lectura: no escribe nada en esa carpeta ni en PostgreSQL.
"""
import glob
import io
import json
import os
import re
import struct
from pathlib import Path

from flask import abort, jsonify, send_file

# Dentro de la carpeta PROYECTO GEOVISOR (ruta relativa: sigue funcionando si se mueve la carpeta completa).
DEFECTO = str(Path(__file__).resolve().parent.parent / '04_CARTAS_IGM_50000' / '09_CARTAS_TOPOGRAFICAS_DIGITALES')
HOJA = re.compile(r'^\d{4}-(?:I|II|III|IV)$')


def carpeta():
    return Path(os.environ.get('GEOVISOR_CARTAS') or DEFECTO)


def _limpio(texto):
    t = re.sub(r'[^A-Za-z0-9]+', '_', texto.encode('ascii', 'ignore').decode()).strip('_')
    return t[:60]


def _dimensiones_jpeg(datos):
    i = 2
    while i < len(datos) - 9:
        if datos[i] != 0xFF:
            i += 1
            continue
        marca = datos[i + 1]
        if marca in (0xD8, 0x01) or 0xD0 <= marca <= 0xD7:
            i += 2
            continue
        largo = struct.unpack('>H', datos[i + 2:i + 4])[0]
        if marca in (0xC0, 0xC1, 0xC2):
            alto, ancho = struct.unpack('>HH', datos[i + 5:i + 9])
            return ancho, alto, datos[i + 9]
        i += 2 + largo
    raise ValueError('JPEG sin dimensiones')


def pdf_desde_jpeg(datos, metros_px, titulo):
    """PDF de una página con la imagen JPEG sin recomprimir, a escala 1:50.000."""
    ancho, alto, comp = _dimensiones_jpeg(datos)
    pt = metros_px / 50000 * 1000 / 25.4 * 72  # puntos por píxel a escala 1:50.000
    w, h = ancho * pt, alto * pt
    color = {1: '/DeviceGray', 3: '/DeviceRGB', 4: '/DeviceCMYK'}.get(comp, '/DeviceRGB')
    contenido = ('q %.3f 0 0 %.3f 0 0 cm /Carta Do Q' % (w, h)).encode()
    titulo = titulo.replace('\\', '').replace('(', '[').replace(')', ']').encode('latin-1', 'replace')
    objetos = [
        b'<< /Type /Catalog /Pages 2 0 R >>',
        b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        ('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.3f %.3f] /Resources << /XObject << /Carta 4 0 R >> >> /Contents 5 0 R >>' % (w, h)).encode(),
        ('<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace %s /BitsPerComponent 8 /Filter /DCTDecode /Length %d >>\nstream\n'
         % (ancho, alto, color, len(datos))).encode() + datos + b'\nendstream',
        ('<< /Length %d >>\nstream\n' % len(contenido)).encode() + contenido + b'\nendstream',
        b'<< /Title (' + titulo + b') /Producer (Geovisor EMTE - Consulta de cartas) >>',
    ]
    salida = io.BytesIO()
    salida.write(b'%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')
    posiciones = []
    for n, obj in enumerate(objetos, 1):
        posiciones.append(salida.tell())
        salida.write(b'%d 0 obj\n' % n + obj + b'\nendobj\n')
    xref = salida.tell()
    salida.write(b'xref\n0 %d\n0000000000 65535 f \n' % (len(objetos) + 1))
    for p in posiciones:
        salida.write(b'%010d 00000 n \n' % p)
    salida.write(b'trailer\n<< /Size %d /Root 1 0 R /Info %d 0 R >>\nstartxref\n%d\n%%%%EOF\n' % (len(objetos) + 1, len(objetos), xref))
    salida.seek(0)
    return salida


def instalar_cartas(app, web):
    indice_ruta = Path(web) / 'cartas' / 'indice.json'
    hojas = {}
    if indice_ruta.exists():
        hojas = {h['h']: h for h in json.loads(indice_ruta.read_text(encoding='utf-8'))['hojas']}

    def hoja_valida(hoja):
        if not HOJA.match(hoja) or (hojas and hoja not in hojas):
            abort(404)
        return hojas.get(hoja, {})

    def nombre_archivo(hoja, ext):
        n = _limpio(hojas.get(hoja, {}).get('n', ''))
        return 'CARTA_%s%s.%s' % (hoja, '_' + n if n else '', ext)

    @app.get('/api/cartas/estado')
    def cartas_estado():
        base = carpeta()
        ok = (base / 'jpg').is_dir()
        completas = len(glob.glob(str(base / 'georreferenciadas_completas' / '*_completa.tif'))) if ok else 0
        return jsonify(disponible=ok, hojas=len(hojas), geotiff_completos=completas,
                       mensaje=None if ok else 'Las imágenes de las cartas no están en este servidor. Copia la carpeta 09_CARTAS_TOPOGRAFICAS_DIGITALES e indícala en GEOVISOR_CARTAS.')

    @app.get('/api/cartas/<hoja>/imagen')
    def cartas_imagen(hoja):
        hoja_valida(hoja)
        ruta = carpeta() / 'jpg' / ('CARTA_%s.jpg' % hoja)
        if not ruta.is_file():
            return jsonify(error='No se encontró la imagen de la carta %s en el servidor.' % hoja), 404
        return send_file(ruta, mimetype='image/jpeg', conditional=True)

    @app.get('/api/cartas/<hoja>/pdf')
    def cartas_pdf(hoja):
        info = hoja_valida(hoja)
        base = carpeta()
        if info.get('pdf'):
            original = base / 'pdf' / Path(info['pdf']).name
            if original.is_file():
                return send_file(original, mimetype='application/pdf', as_attachment=True, download_name=nombre_archivo(hoja, 'pdf'))
        ruta = base / 'jpg' / ('CARTA_%s.jpg' % hoja)
        if not ruta.is_file():
            return jsonify(error='No se encontró la carta %s en el servidor.' % hoja), 404
        metros = float((info.get('img') or {}).get('a') or 5.0)
        titulo = 'Carta IGM 1:50.000 %s %s' % (hoja, info.get('n', ''))
        return send_file(pdf_desde_jpeg(ruta.read_bytes(), metros, titulo), mimetype='application/pdf',
                         as_attachment=True, download_name=nombre_archivo(hoja, 'pdf'))

    @app.get('/api/cartas/<hoja>/tif')
    def cartas_tif(hoja):
        hoja_valida(hoja)
        base = carpeta()
        completas = glob.glob(str(base / 'georreferenciadas_completas' / ('CARTA_%s_UTM*S_completa.tif' % hoja)))
        if completas:
            return send_file(completas[0], mimetype='image/tiff', as_attachment=True, download_name=nombre_archivo(hoja, 'tif'))
        recortadas = glob.glob(str(base / 'georreferenciadas' / ('CARTA_%s_*UTM*S.tif' % hoja))) + \
            glob.glob(str(base / 'georreferenciadas' / ('CARTA_%s_UTM*S.tif' % hoja)))
        if recortadas:
            return send_file(recortadas[0], mimetype='image/tiff', as_attachment=True, download_name=nombre_archivo(hoja, 'tif'))
        return jsonify(error='No se encontró el GeoTIFF de la carta %s en el servidor.' % hoja), 404
