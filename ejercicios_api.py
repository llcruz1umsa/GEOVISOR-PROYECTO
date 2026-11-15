"""Ejercicios de planeamiento guardados en PostgreSQL (agregado por BYNS7, 04-11-2026).

Cada ejercicio guarda todo el trabajo del geovisor (calco, avenidas, línea de tiempo, área visible,
capas encendidas, vista del mapa...) con sus datos (unidad, situación, fecha-hora, autor, nota) y una
miniatura. Cada vez que se guardan cambios, la versión anterior pasa a «ejercicios_versiones», así se
puede volver atrás. Todo vive en el esquema «planeamiento», el mismo del calco, y se comparte con
quien use el geovisor conectado a la misma base.

Rutas:
  GET    /api/ejercicios                       lista (sin los datos pesados)
  GET    /api/ejercicios/<id>                  ejercicio completo
  PUT    /api/ejercicios/<id>                  crear o guardar cambios (la versión anterior se conserva)
  PATCH  /api/ejercicios/<id>                  cambiar solo los datos (nombre, unidad, nota...)
  DELETE /api/ejercicios/<id>                  borrar (con sus versiones)
  GET    /api/ejercicios/<id>/versiones        versiones anteriores
  GET    /api/ejercicios/<id>/versiones/<n>    una versión completa
  POST   /api/planeamiento/reemplazar          reemplaza TODO el calco en una sola transacción
"""
import json
import re

import psycopg
from flask import jsonify, request

from planeamiento_api import ESQUEMA, CREAR as CREAR_CALCO, ID, DatoInvalido, validar

MAX_DATOS = 25 * 1024 * 1024          # 25 MB por ejercicio
MAX_MINI = 400 * 1024                 # miniatura (data URL JPEG)
MAX_VERSIONES = 30                    # versiones que se conservan por ejercicio
SITUACIONES = {'', 'Ofensiva', 'Defensiva', 'Movimientos retrógrados', 'Seguridad', 'Reconocimiento', 'Otra'}

CREAR = f"""
CREATE TABLE IF NOT EXISTS {ESQUEMA}.ejercicios (
 id text PRIMARY KEY, nombre varchar(80) NOT NULL, unidad varchar(80), situacion varchar(40),
 dtg varchar(40), autor varchar(80), nota text, miniatura text, resumen jsonb, datos jsonb NOT NULL,
 version integer NOT NULL DEFAULT 1, creado timestamptz DEFAULT now(), actualizado timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS {ESQUEMA}.ejercicios_versiones (
 fid serial PRIMARY KEY, ejercicio_id text NOT NULL REFERENCES {ESQUEMA}.ejercicios(id) ON DELETE CASCADE,
 version integer NOT NULL, nombre varchar(80), autor varchar(80), resumen jsonb, miniatura text, datos jsonb NOT NULL,
 guardado timestamptz DEFAULT now());
CREATE INDEX IF NOT EXISTS ejercicios_versiones_idx ON {ESQUEMA}.ejercicios_versiones (ejercicio_id, version);
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'editor_companero') THEN
  GRANT SELECT, INSERT, UPDATE, DELETE ON {ESQUEMA}.ejercicios, {ESQUEMA}.ejercicios_versiones TO editor_companero;
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA {ESQUEMA} TO editor_companero;
 END IF;
END $$;
"""
META = ('nombre', 'unidad', 'situacion', 'dtg', 'autor', 'nota')
LARGO = {'nombre': 80, 'unidad': 80, 'situacion': 40, 'dtg': 40, 'autor': 80, 'nota': 2000}


def _meta(b, parcial=False):
    out = {}
    for k in META:
        if parcial and k not in b:
            continue
        v = b.get(k)
        if v is not None and not isinstance(v, str):
            raise DatoInvalido('Dato no válido: ' + k)
        out[k] = (v or '').strip()[:LARGO[k]]
    if 'situacion' in out and out['situacion'] not in SITUACIONES:
        out['situacion'] = 'Otra'
    if not parcial and not out['nombre']:
        raise DatoInvalido('El ejercicio necesita un nombre.')
    if parcial and 'nombre' in out and not out['nombre']:
        raise DatoInvalido('El nombre no puede quedar vacío.')
    return out


def _mini(v):
    if not v:
        return None
    if not isinstance(v, str) or not re.match(r'^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$', v) or len(v) > MAX_MINI:
        return None
    return v


def _fila(r, completo=False):
    o = {'id': r[0], 'nombre': r[1], 'unidad': r[2] or '', 'situacion': r[3] or '', 'dtg': r[4] or '', 'autor': r[5] or '',
         'nota': r[6] or '', 'miniatura': r[7], 'resumen': r[8] or {}, 'version': r[9],
         'creado': r[10].isoformat() if r[10] else None, 'actualizado': r[11].isoformat() if r[11] else None,
         'nversiones': r[12] if len(r) > 12 else 0, 'origen': 'servidor'}
    return o


def instalar_ejercicios(app, conectar_escritura):
    estado = {'listo': False}

    def preparar(c):
        if not estado['listo']:
            c.execute(CREAR_CALCO)
            c.execute(CREAR)
            c.commit()
            estado['listo'] = True

    def falla(msg):
        app.logger.exception(msg)
        return jsonify(error=msg + ' Revisa la consola del servidor.'), 503

    @app.get('/api/ejercicios')
    def ejercicios_lista():
        try:
            with conectar_escritura() as c:
                preparar(c)
                filas = c.execute(f"""SELECT e.id, e.nombre, e.unidad, e.situacion, e.dtg, e.autor, e.nota, e.miniatura, e.resumen,
                       e.version, e.creado, e.actualizado,
                       (SELECT count(*) FROM {ESQUEMA}.ejercicios_versiones v WHERE v.ejercicio_id = e.id)
                  FROM {ESQUEMA}.ejercicios e ORDER BY e.actualizado DESC""").fetchall()
            return jsonify(ejercicios=[_fila(r) for r in filas])
        except psycopg.Error:
            return falla('No se pudieron leer los ejercicios en PostgreSQL.')

    @app.get('/api/ejercicios/<eid>')
    def ejercicio_leer(eid):
        if not ID.match(eid):
            return jsonify(error='Identificador no válido.'), 400
        try:
            with conectar_escritura() as c:
                preparar(c)
                r = c.execute(f"""SELECT id, nombre, unidad, situacion, dtg, autor, nota, miniatura, resumen, version, creado, actualizado,
                       (SELECT count(*) FROM {ESQUEMA}.ejercicios_versiones v WHERE v.ejercicio_id = id), datos
                  FROM {ESQUEMA}.ejercicios WHERE id = %s""", (eid,)).fetchone()
            if not r:
                return jsonify(error='Ese ejercicio ya no existe.'), 404
            o = _fila(r); o['datos'] = r[13]
            return jsonify(o)
        except psycopg.Error:
            return falla('No se pudo leer el ejercicio.')

    @app.put('/api/ejercicios/<eid>')
    def ejercicio_guardar(eid):
        if not ID.match(eid):
            return jsonify(error='Identificador no válido.'), 400
        if (request.content_length or 0) > MAX_DATOS:
            return jsonify(error='El ejercicio es demasiado grande para guardarlo.'), 413
        b = request.get_json(silent=True)
        try:
            if not isinstance(b, dict) or not isinstance(b.get('datos'), dict):
                raise DatoInvalido('Ejercicio no válido.')
            m = _meta(b)
            resumen = b.get('resumen') if isinstance(b.get('resumen'), dict) else {}
            with conectar_escritura() as c:
                preparar(c)
                with c.transaction():
                    viejo = c.execute(f"SELECT version, nombre, autor, resumen, miniatura, datos FROM {ESQUEMA}.ejercicios WHERE id = %s FOR UPDATE", (eid,)).fetchone()
                    otro = c.execute(f"SELECT id FROM {ESQUEMA}.ejercicios WHERE lower(nombre) = lower(%s) AND id <> %s", (m['nombre'], eid)).fetchone()
                    if otro:
                        return jsonify(error=f"Ya existe otro ejercicio llamado «{m['nombre']}».", id=otro[0]), 409
                    if viejo:
                        c.execute(f"""INSERT INTO {ESQUEMA}.ejercicios_versiones (ejercicio_id, version, nombre, autor, resumen, miniatura, datos)
                                      VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                                  (eid, viejo[0], viejo[1], viejo[2], json.dumps(viejo[3] or {}), viejo[4], json.dumps(viejo[5])))
                        c.execute(f"""DELETE FROM {ESQUEMA}.ejercicios_versiones WHERE ejercicio_id = %s AND fid NOT IN
                                      (SELECT fid FROM {ESQUEMA}.ejercicios_versiones WHERE ejercicio_id = %s ORDER BY version DESC LIMIT %s)""",
                                  (eid, eid, MAX_VERSIONES))
                        c.execute(f"""UPDATE {ESQUEMA}.ejercicios SET nombre=%s, unidad=%s, situacion=%s, dtg=%s, autor=%s, nota=%s,
                                      miniatura=%s, resumen=%s, datos=%s, version=version+1, actualizado=now() WHERE id=%s""",
                                  (m['nombre'], m['unidad'], m['situacion'], m['dtg'], m['autor'], m['nota'], _mini(b.get('miniatura')),
                                   json.dumps(resumen), json.dumps(b['datos']), eid))
                        version = viejo[0] + 1
                    else:
                        c.execute(f"""INSERT INTO {ESQUEMA}.ejercicios (id, nombre, unidad, situacion, dtg, autor, nota, miniatura, resumen, datos)
                                      VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                                  (eid, m['nombre'], m['unidad'], m['situacion'], m['dtg'], m['autor'], m['nota'], _mini(b.get('miniatura')),
                                   json.dumps(resumen), json.dumps(b['datos'])))
                        version = 1
            return jsonify(ok=True, version=version)
        except DatoInvalido as e:
            return jsonify(error=str(e)), 400
        except psycopg.Error:
            return falla('No se pudo guardar el ejercicio en PostgreSQL.')

    @app.patch('/api/ejercicios/<eid>')
    def ejercicio_datos(eid):
        if not ID.match(eid):
            return jsonify(error='Identificador no válido.'), 400
        b = request.get_json(silent=True)
        try:
            if not isinstance(b, dict):
                raise DatoInvalido('Datos no válidos.')
            m = _meta(b, parcial=True)
            if not m:
                return jsonify(ok=True)
            with conectar_escritura() as c:
                preparar(c)
                if 'nombre' in m and c.execute(f"SELECT 1 FROM {ESQUEMA}.ejercicios WHERE lower(nombre) = lower(%s) AND id <> %s", (m['nombre'], eid)).fetchone():
                    return jsonify(error=f"Ya existe otro ejercicio llamado «{m['nombre']}»."), 409
                sets = ', '.join(f'{k} = %s' for k in m)
                n = c.execute(f"UPDATE {ESQUEMA}.ejercicios SET {sets}, actualizado = now() WHERE id = %s", list(m.values()) + [eid]).rowcount
            return (jsonify(ok=True), 200) if n else (jsonify(error='Ese ejercicio ya no existe.'), 404)
        except DatoInvalido as e:
            return jsonify(error=str(e)), 400
        except psycopg.Error:
            return falla('No se pudieron cambiar los datos del ejercicio.')

    @app.delete('/api/ejercicios/<eid>')
    def ejercicio_borrar(eid):
        if not ID.match(eid):
            return jsonify(error='Identificador no válido.'), 400
        try:
            with conectar_escritura() as c:
                preparar(c)
                c.execute(f"DELETE FROM {ESQUEMA}.ejercicios WHERE id = %s", (eid,))
            return jsonify(ok=True)
        except psycopg.Error:
            return falla('No se pudo borrar el ejercicio.')

    @app.get('/api/ejercicios/<eid>/versiones')
    def ejercicio_versiones(eid):
        if not ID.match(eid):
            return jsonify(error='Identificador no válido.'), 400
        try:
            with conectar_escritura() as c:
                preparar(c)
                filas = c.execute(f"""SELECT version, nombre, autor, resumen, guardado FROM {ESQUEMA}.ejercicios_versiones
                                      WHERE ejercicio_id = %s ORDER BY version DESC""", (eid,)).fetchall()
            return jsonify(versiones=[{'version': r[0], 'nombre': r[1], 'autor': r[2] or '', 'resumen': r[3] or {},
                                       'guardado': r[4].isoformat() if r[4] else None} for r in filas])
        except psycopg.Error:
            return falla('No se pudieron leer las versiones.')

    @app.get('/api/ejercicios/<eid>/versiones/<int:n>')
    def ejercicio_version(eid, n):
        if not ID.match(eid):
            return jsonify(error='Identificador no válido.'), 400
        try:
            with conectar_escritura() as c:
                preparar(c)
                r = c.execute(f"""SELECT version, nombre, autor, resumen, miniatura, datos, guardado FROM {ESQUEMA}.ejercicios_versiones
                                  WHERE ejercicio_id = %s AND version = %s""", (eid, n)).fetchone()
            if not r:
                return jsonify(error='Esa versión ya no existe.'), 404
            return jsonify(version=r[0], nombre=r[1], autor=r[2] or '', resumen=r[3] or {}, miniatura=r[4], datos=r[5],
                           guardado=r[6].isoformat() if r[6] else None)
        except psycopg.Error:
            return falla('No se pudo leer la versión.')

    @app.post('/api/planeamiento/reemplazar')
    def calco_reemplazar():
        """Pone en la base exactamente las figuras recibidas (abrir un ejercicio, deshacer, nuevo)."""
        b = request.get_json(silent=True)
        try:
            figuras = b.get('figuras') if isinstance(b, dict) else None
            if not isinstance(figuras, dict) or len(figuras) > 5000:
                raise DatoInvalido('Calco no válido.')
            filas = []
            for uid, o in figuras.items():
                if not isinstance(uid, str) or not ID.match(uid):
                    raise DatoInvalido('Identificador no válido.')
                filas.append((uid,) + validar(o))
            with conectar_escritura() as c:
                preparar(c)
                with c.transaction():
                    for t in ('simbolos_militares', 'lineas_tacticas', 'zonas_tacticas'):
                        c.execute(f'DELETE FROM {ESQUEMA}.{t}')
                    for uid, tabla, cols, wkt in filas:
                        nombres = ['uid'] + list(cols)
                        c.execute(f"INSERT INTO {ESQUEMA}.{tabla} ({', '.join(nombres)}, geom, actualizado) "
                                  f"VALUES ({', '.join(['%s'] * len(nombres))}, ST_GeomFromText(%s, 3857), now())",
                                  [uid] + [cols[n] for n in cols] + [wkt])
            return jsonify(ok=True, figuras=len(filas))
        except DatoInvalido as e:
            return jsonify(error=str(e)), 400
        except psycopg.Error:
            return falla('No se pudo reemplazar el calco en PostgreSQL.')
