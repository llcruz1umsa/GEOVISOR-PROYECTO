"""Calco de operaciones (proyecto PLANEAMIENTO) dentro del geovisor.

Guarda los símbolos militares, las líneas tácticas y las zonas en el esquema
«planeamiento» de PostgreSQL/PostGIS (EPSG:3857, mismas columnas que el
GeoPackage de QGIS), para que el geovisor y QGIS trabajen sobre los mismos datos.
Es la única parte del geovisor que escribe en la base, y solo en ese esquema:
las capas de «cartografia» y la red de «ruteo» siguen siendo de solo lectura.
"""
import json
import math
import re
from pathlib import Path

import psycopg
from flask import jsonify, request

ESQUEMA = 'planeamiento'
INICIAL = Path(__file__).resolve().parent / 'planeamiento_inicial.json'
BANDOS = {'Propio', 'Enemigo', 'Obstáculo', 'Contaminado', 'Negro'}
CLAVE_SIMBOLO = re.compile(r'^[a-z0-9_]{1,40}$')
ID = re.compile(r'^[A-Za-z0-9_-]{1,64}$')
LIMITE = 20037508.342789244
MAX_PUNTOS = 2000

CREAR = f"""
CREATE SCHEMA IF NOT EXISTS {ESQUEMA};
CREATE TABLE IF NOT EXISTS {ESQUEMA}.simbolos_militares (
 fid serial PRIMARY KEY,
 uid text NOT NULL UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text),
 simbolo varchar(40) NOT NULL DEFAULT 'unidad', bando varchar(20) NOT NULL DEFAULT 'Propio',
 escalon varchar(20), desig_izq varchar(60), desig_der varchar(60),
 texto_centro varchar(60), texto_abajo varchar(60), previsto integer DEFAULT 0,
 tamano double precision DEFAULT 700, rotacion double precision DEFAULT 0,
 obs text, opacidad integer DEFAULT 100, actualizado timestamptz DEFAULT now(),
 geom geometry(Point,3857));
CREATE TABLE IF NOT EXISTS {ESQUEMA}.lineas_tacticas (
 fid serial PRIMARY KEY,
 uid text NOT NULL UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text),
 tipo varchar(80) NOT NULL DEFAULT 'Límite', etiqueta varchar(80), fecha_hora varchar(40),
 bando varchar(20) NOT NULL DEFAULT 'Propio', obs text, opacidad integer DEFAULT 100,
 actualizado timestamptz DEFAULT now(), geom geometry(LineString,3857));
CREATE TABLE IF NOT EXISTS {ESQUEMA}.zonas_tacticas (
 fid serial PRIMARY KEY,
 uid text NOT NULL UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text),
 tipo varchar(80) NOT NULL DEFAULT 'Zona', etiqueta varchar(80), fecha_hora varchar(40),
 bando varchar(20) NOT NULL DEFAULT 'Propio', obs text, opacidad integer DEFAULT 100,
 actualizado timestamptz DEFAULT now(), geom geometry(Polygon,3857));
CREATE INDEX IF NOT EXISTS simbolos_militares_geom_idx ON {ESQUEMA}.simbolos_militares USING gist (geom);
CREATE INDEX IF NOT EXISTS lineas_tacticas_geom_idx ON {ESQUEMA}.lineas_tacticas USING gist (geom);
CREATE INDEX IF NOT EXISTS zonas_tacticas_geom_idx ON {ESQUEMA}.zonas_tacticas USING gist (geom);
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'editor_companero') THEN
  GRANT USAGE ON SCHEMA {ESQUEMA} TO editor_companero;
  GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA {ESQUEMA} TO editor_companero;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA {ESQUEMA} TO editor_companero;
 END IF;
END $$;
"""

LEER = f"""
SELECT 'p', uid, simbolo, bando, escalon, desig_izq, desig_der, texto_centro, texto_abajo,
       previsto, tamano, rotacion, opacidad, NULL, NULL, NULL, ST_AsText(geom)
  FROM {ESQUEMA}.simbolos_militares WHERE geom IS NOT NULL
UNION ALL
SELECT 'l', uid, NULL, bando, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, opacidad,
       tipo, etiqueta, fecha_hora, ST_AsText(ST_LineMerge(geom))
  FROM {ESQUEMA}.lineas_tacticas WHERE geom IS NOT NULL
UNION ALL
SELECT 'z', uid, NULL, bando, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, opacidad,
       tipo, etiqueta, fecha_hora, ST_AsText(ST_ExteriorRing(geom))
  FROM {ESQUEMA}.zonas_tacticas WHERE geom IS NOT NULL
"""


class DatoInvalido(ValueError):
    pass


def _texto(valor, largo):
    if valor is None:
        return ''
    if not isinstance(valor, (str, int, float)) or isinstance(valor, bool):
        raise DatoInvalido('Texto no válido.')
    return str(valor).strip()[:largo]


def _numero(valor, minimo, maximo, defecto):
    if valor is None or valor == '':
        return defecto
    if isinstance(valor, bool) or not isinstance(valor, (int, float)) or not math.isfinite(valor):
        raise DatoInvalido('Número no válido.')
    return min(maximo, max(minimo, float(valor)))


def _coord(valor):
    v = _numero(valor, -LIMITE, LIMITE, None)
    if v is None:
        raise DatoInvalido('Coordenada no válida.')
    return round(v, 2)


def _bando(valor):
    return valor if valor in BANDOS else 'Propio'


def validar(o):
    """Convierte la figura enviada por el navegador en (tabla, columnas, wkt)."""
    if not isinstance(o, dict):
        raise DatoInvalido('Figura no válida.')
    k = o.get('k')
    if k in ('l', 'z'):
        p = o.get('p')
        if not isinstance(p, list) or len(p) % 2 or len(p) > MAX_PUNTOS * 2:
            raise DatoInvalido('Vértices no válidos.')
        xy = [(_coord(p[i]), _coord(p[i + 1])) for i in range(0, len(p), 2)]
        if k == 'z':
            if len(xy) < 3:
                raise DatoInvalido('Una zona necesita al menos 3 vértices.')
            anillo = xy + [xy[0]]
            wkt = 'POLYGON((%s))' % ','.join('%r %r' % q for q in anillo)
        else:
            if len(xy) < 2:
                raise DatoInvalido('Una línea necesita al menos 2 puntos.')
            wkt = 'LINESTRING(%s)' % ','.join('%r %r' % q for q in xy)
        cols = {'tipo': _texto(o.get('tipo'), 80) or ('Zona' if k == 'z' else 'Límite'),
                'etiqueta': _texto(o.get('et'), 80), 'fecha_hora': _texto(o.get('fh'), 40),
                'bando': _bando(o.get('bando')), 'opacidad': int(_numero(o.get('op'), 0, 100, 100))}
        return ('zonas_tacticas' if k == 'z' else 'lineas_tacticas'), cols, wkt
    clave = o.get('key')
    if not isinstance(clave, str) or not CLAVE_SIMBOLO.match(clave):
        raise DatoInvalido('Símbolo no válido.')
    wkt = 'POINT(%r %r)' % (_coord(o.get('x')), _coord(o.get('y')))
    cols = {'simbolo': clave, 'bando': _bando(o.get('bando')), 'escalon': _texto(o.get('esc'), 20),
            'desig_izq': _texto(o.get('izq'), 60), 'desig_der': _texto(o.get('der'), 60),
            'texto_centro': _texto(o.get('cen'), 60), 'texto_abajo': _texto(o.get('aba'), 60),
            'previsto': 1 if o.get('prev') else 0, 'tamano': round(_numero(o.get('tam'), 20, 200000, 700), 1),
            'rotacion': round(_numero(o.get('rot'), -360, 360, 0) % 360, 1),
            'opacidad': int(_numero(o.get('op'), 0, 100, 100))}
    return 'simbolos_militares', cols, wkt


def _puntos(wkt):
    nums = re.findall(r'-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?', wkt or '')
    return [round(float(n), 2) for n in nums]


def fila_a_figura(r):
    k, uid = r[0], r[1]
    p = _puntos(r[16])
    if k == 'p':
        if len(p) < 2:
            return uid, None
        return uid, {'key': r[2] or 'unidad', 'bando': r[3] or 'Propio', 'esc': r[4] or '', 'izq': r[5] or '',
                     'der': r[6] or '', 'cen': r[7] or '', 'aba': r[8] or '', 'prev': 1 if r[9] else 0,
                     'tam': float(r[10] or 700), 'rot': float(r[11] or 0), 'op': 100 if r[12] is None else int(r[12]),
                     'x': p[0], 'y': p[1]}
    if k == 'z' and len(p) >= 4 and p[:2] == p[-2:]:
        p = p[:-2]
    if len(p) < (6 if k == 'z' else 4):
        return uid, None
    return uid, {'k': k, 'tipo': r[13] or '', 'et': r[14] or '', 'fh': r[15] or '', 'bando': r[3] or 'Propio',
                 'op': 100 if r[12] is None else int(r[12]), 'p': p}


def instalar_planeamiento(app, conectar_escritura):
    """Registra /api/planeamiento. conectar_escritura() abre una conexión sin modo de solo lectura."""
    estado = {'listo': False}

    def preparar(c):
        if estado['listo']:
            return
        existia = c.execute("SELECT to_regclass(%s) IS NOT NULL", (ESQUEMA + '.simbolos_militares',)).fetchone()[0]
        c.execute(CREAR)
        if not existia and INICIAL.exists():
            datos = json.loads(INICIAL.read_text(encoding='utf-8'))
            for uid, o in datos.items():
                tabla, cols, wkt = validar(o)
                _insertar(c, tabla, uid, cols, wkt)
        c.commit()
        estado['listo'] = True

    def _insertar(c, tabla, uid, cols, wkt):
        nombres = list(cols)
        valores = [cols[n] for n in nombres]
        if uid:
            nombres.insert(0, 'uid'); valores.insert(0, uid)
        lista = ', '.join(nombres)
        marcas = ', '.join(['%s'] * len(nombres))
        actualizar = ', '.join(f'{n} = EXCLUDED.{n}' for n in nombres if n != 'uid')
        c.execute(f"INSERT INTO {ESQUEMA}.{tabla} ({lista}, geom, actualizado) "
                  f"VALUES ({marcas}, ST_GeomFromText(%s, 3857), now()) "
                  f"ON CONFLICT (uid) DO UPDATE SET {actualizar}, geom = EXCLUDED.geom, actualizado = now()",
                  valores + [wkt])

    @app.get('/api/planeamiento')
    def planeamiento_leer():
        try:
            with conectar_escritura() as c:
                preparar(c)
                figuras = {}
                for r in c.execute(LEER).fetchall():
                    uid, o = fila_a_figura(r)
                    if o:
                        figuras[uid] = o
            return jsonify(figuras=figuras)
        except psycopg.Error:
            app.logger.exception('Fallo al leer el calco')
            return jsonify(error='No se pudo leer el calco en PostgreSQL. Revisa la consola del servidor.'), 503

    @app.put('/api/planeamiento/<uid>')
    def planeamiento_guardar(uid):
        if not ID.match(uid):
            return jsonify(error='Identificador no válido.'), 400
        try:
            tabla, cols, wkt = validar(request.get_json(silent=True))
            with conectar_escritura() as c:
                preparar(c)
                for otra in ('simbolos_militares', 'lineas_tacticas', 'zonas_tacticas'):
                    if otra != tabla:
                        c.execute(f'DELETE FROM {ESQUEMA}.{otra} WHERE uid = %s', (uid,))
                _insertar(c, tabla, uid, cols, wkt)
            return jsonify(ok=True)
        except DatoInvalido as e:
            return jsonify(error=str(e)), 400
        except psycopg.Error:
            app.logger.exception('Fallo al guardar una figura del calco')
            return jsonify(error='No se pudo guardar en PostgreSQL.'), 503

    @app.delete('/api/planeamiento/<uid>')
    def planeamiento_borrar(uid):
        if not ID.match(uid):
            return jsonify(error='Identificador no válido.'), 400
        try:
            with conectar_escritura() as c:
                preparar(c)
                for tabla in ('simbolos_militares', 'lineas_tacticas', 'zonas_tacticas'):
                    c.execute(f'DELETE FROM {ESQUEMA}.{tabla} WHERE uid = %s', (uid,))
            return jsonify(ok=True)
        except psycopg.Error:
            app.logger.exception('Fallo al borrar una figura del calco')
            return jsonify(error='No se pudo borrar en PostgreSQL.'), 503
