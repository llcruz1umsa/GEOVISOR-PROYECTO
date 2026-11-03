"""Actualización de datos de los establecimientos de salud desde el geovisor.

- Rutas protegidas por la sesión del geovisor y el token CSRF (acceso_local.py),
  y además por una CONTRASEÑA DE EDICIÓN propia (hash en edicion_salud.json).
- Guarda siempre en datos_salud/ediciones.json (+ fotos en datos_salud/fotos/)
  y deja un historial en datos_salud/historial.jsonl.
- Si la base de datos está disponible, copia cada actualización al esquema
  propio «salud_ediciones» (no modifica el esquema cartografia).

Para activarlo en servidor.py basta con:
    from salud_edicion import instalar_salud
    instalar_salud(app, conectar_escritura)
"""
import base64
import json
import os
import threading
import time
from datetime import datetime
from pathlib import Path

from flask import jsonify, request, send_file, session
from werkzeug.security import check_password_hash

BASE = Path(__file__).resolve().parent
DIR = BASE / 'datos_salud'
FOTOS = DIR / 'fotos'
EDICIONES = DIR / 'ediciones.json'
HISTORIAL = DIR / 'historial.jsonl'
CLAVE = BASE / 'edicion_salud.json'

# campo -> longitud máxima
CAMPOS = {
    'nombre': 120, 'categoria': 80, 'tipo': 120, 'nivel': 40, 'subsector': 120,
    'dependencia': 200, 'area_red': 120, 'codigo_snis': 30,
    'emergencia': 30, 'internacion': 30, 'horario': 60, 'laboratorio': 30,
    'especialidades': 400, 'servicios': 600, 'atencion': 120, 'camas': 10,
    'quirofano': 120, 'sala_partos': 120, 'personal': 300,
    'municipio': 80, 'comunidad': 120, 'direccion': 200, 'altitud': 20, 'acceso': 300,
    'telefono': 60, 'responsable': 120, 'web': 300, 'correo': 120,
    'ambulancias_municipio': 60, 'ambulancias_propias': 60, 'hospital_referencia': 120,
}
SIN_MAYUSCULAS = {'web', 'correo'}          # enlaces y correos se guardan tal cual
MAX_FOTO = 700 * 1024                       # bytes ya decodificados

_lock = threading.Lock()
_intentos = {}


def _leer():
    try:
        return json.loads(EDICIONES.read_text(encoding='utf-8'))
    except (FileNotFoundError, ValueError):
        return {}


def _escribir(datos):
    DIR.mkdir(exist_ok=True)
    tmp = EDICIONES.with_suffix('.tmp')
    tmp.write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding='utf-8')
    os.replace(tmp, EDICIONES)


def _limpiar(campo, valor):
    if valor is None:
        return ''
    texto = ' '.join(str(valor).split())[:CAMPOS[campo]]
    return texto if campo in SIN_MAYUSCULAS else texto.upper()


def _copiar_a_base(conectar, id_salud, registro, foto):
    crear = """
    CREATE SCHEMA IF NOT EXISTS salud_ediciones;
    CREATE TABLE IF NOT EXISTS salud_ediciones.actualizaciones (
      id_salud integer PRIMARY KEY,
      datos jsonb NOT NULL,
      foto bytea,
      actualizado_por varchar(120),
      actualizado timestamptz DEFAULT now());
    CREATE TABLE IF NOT EXISTS salud_ediciones.historial (
      id serial PRIMARY KEY, id_salud integer, datos jsonb,
      actualizado_por varchar(120), actualizado timestamptz DEFAULT now());"""
    with conectar() as c:
        c.execute(crear)
        datos = json.dumps({k: v for k, v in registro.items() if k in CAMPOS}, ensure_ascii=False)
        c.execute("""INSERT INTO salud_ediciones.actualizaciones (id_salud, datos, foto, actualizado_por, actualizado)
                     VALUES (%s, %s::jsonb, %s, %s, now())
                     ON CONFLICT (id_salud) DO UPDATE SET datos=EXCLUDED.datos,
                       foto=COALESCE(EXCLUDED.foto, salud_ediciones.actualizaciones.foto),
                       actualizado_por=EXCLUDED.actualizado_por, actualizado=now()""",
                  (id_salud, datos, foto, registro.get('actualizado_por')))
        c.execute("INSERT INTO salud_ediciones.historial (id_salud, datos, actualizado_por) VALUES (%s, %s::jsonb, %s)",
                  (id_salud, datos, registro.get('actualizado_por')))


def _verificar_clave(cuerpo):
    """Devuelve None si la contraseña de edición es correcta; si no, (respuesta, código)."""
    quien = session.get('sid') or request.remote_addr or 'local'
    ahora = time.monotonic()
    fallos = [t for t in _intentos.get(quien, []) if ahora - t < 60]
    _intentos[quien] = fallos
    if len(fallos) >= 5:
        return jsonify(error='DEMASIADOS INTENTOS. ESPERA UN MINUTO.'), 429
    if not CLAVE.exists():
        return jsonify(error='FALTA CONFIGURAR LA CONTRASEÑA DE EDICIÓN EN EL SERVIDOR.'), 503
    try:
        hash_ = json.loads(CLAVE.read_text(encoding='utf-8'))['hash']
        ok = check_password_hash(hash_, str(cuerpo.get('clave', '')))
    except (ValueError, KeyError):
        return jsonify(error='EL ARCHIVO DE LA CONTRASEÑA DE EDICIÓN ESTÁ DAÑADO.'), 500
    if not ok:
        fallos.append(ahora)
        return jsonify(error='CONTRASEÑA DE EDICIÓN INCORRECTA.'), 403
    _intentos.pop(quien, None)
    return None


def _historial():
    """Lista de cambios (cada uno con su número de línea «n»)."""
    out = []
    try:
        with HISTORIAL.open(encoding='utf-8') as h:
            for n, linea in enumerate(h):
                try:
                    r = json.loads(linea); r['n'] = n; out.append(r)
                except ValueError:
                    pass
    except FileNotFoundError:
        pass
    return out


def instalar_salud(app, conectar_escritura=None):

    @app.get('/api/salud/ediciones')
    def salud_ediciones():
        datos = _leer()
        for k, v in datos.items():
            if v.get('_foto'):
                v['foto'] = f"/api/salud/foto/{k}?v={v.get('_foto')}"
        return jsonify(datos)

    @app.get('/api/salud/foto/<int:id_salud>')
    def salud_foto(id_salud):
        ruta = FOTOS / f'{id_salud}.jpg'
        if not ruta.exists():
            return jsonify(error='Sin foto'), 404
        return send_file(ruta, mimetype='image/jpeg')

    @app.get('/api/salud/historial/<int:id_salud>')
    def salud_historial(id_salud):
        h = [r for r in _historial() if r.get('id_salud') == id_salud]
        deshechos = {r.get('deshace') for r in h if r.get('tipo') == 'DESHACER'}
        for r in h:
            r['deshecho'] = r['n'] in deshechos
        return jsonify(list(reversed(h))[:50])

    @app.post('/api/salud/deshacer')
    def salud_deshacer():
        cuerpo = request.get_json(silent=True) or {}
        fallo = _verificar_clave(cuerpo)
        if fallo:
            return fallo
        try:
            id_salud = int(cuerpo.get('id_salud')); n = int(cuerpo.get('n'))
        except (TypeError, ValueError):
            return jsonify(error='DATOS NO VÁLIDOS.'), 400
        por = ' '.join(str(cuerpo.get('actualizado_por', '')).split()).upper()[:120]
        if len(por) < 3:
            return jsonify(error='ESCRIBE QUIÉN DESHACE EL CAMBIO (GRADO Y NOMBRE).'), 400
        with _lock:
            h = [r for r in _historial() if r.get('id_salud') == id_salud]
            deshechos = {r.get('deshace') for r in h if r.get('tipo') == 'DESHACER'}
            vigentes = [r for r in h if r.get('tipo') != 'DESHACER' and r['n'] not in deshechos]
            if not vigentes or vigentes[-1]['n'] != n:
                return jsonify(error='SOLO SE PUEDE DESHACER EL ÚLTIMO CAMBIO VIGENTE DE ESTE ESTABLECIMIENTO.'), 400
            ult = vigentes[-1]
            if 'antes' not in ult:
                return jsonify(error='ESTE CAMBIO ES ANTERIOR AL HISTORIAL DETALLADO: NO TIENE LOS DATOS PREVIOS.'), 400
            datos = _leer(); registro = datos.get(str(id_salud), {})
            actual = {k: registro.get(k) for k in ult['antes']}
            for k, v in ult['antes'].items():
                if v is None:
                    registro.pop(k, None)
                else:
                    registro[k] = v
            registro['actualizado_por'] = por
            registro['actualizado'] = datetime.now().strftime('%d/%m/%Y %H:%M')
            datos[str(id_salud)] = registro
            _escribir(datos)
            with HISTORIAL.open('a', encoding='utf-8') as fh:
                fh.write(json.dumps({'id_salud': id_salud, 'fecha': registro['actualizado'], 'por': por, 'tipo': 'DESHACER',
                                     'deshace': n, 'campos': {k: (v if v is not None else '') for k, v in ult['antes'].items()},
                                     'antes': actual}, ensure_ascii=False) + '\n')
        if conectar_escritura:
            try:
                _copiar_a_base(conectar_escritura, id_salud, registro, None)
            except Exception:
                pass
        return jsonify(ok=True, actualizado=registro['actualizado'])

    @app.post('/api/salud/actualizar')
    def salud_actualizar():
        # 1) contraseña de edición, con límite de intentos
        clave_ok = False
        quien = session.get('sid') or request.remote_addr or 'local'
        ahora = time.monotonic()
        fallos = [t for t in _intentos.get(quien, []) if ahora - t < 60]
        _intentos[quien] = fallos
        if len(fallos) >= 5:
            return jsonify(error='DEMASIADOS INTENTOS. ESPERA UN MINUTO.'), 429
        if not CLAVE.exists():
            return jsonify(error='FALTA CONFIGURAR LA CONTRASEÑA DE EDICIÓN EN EL SERVIDOR.'), 503
        cuerpo = request.get_json(silent=True) or {}
        try:
            hash_ = json.loads(CLAVE.read_text(encoding='utf-8'))['hash']
            clave_ok = check_password_hash(hash_, str(cuerpo.get('clave', '')))
        except (ValueError, KeyError):
            return jsonify(error='EL ARCHIVO DE LA CONTRASEÑA DE EDICIÓN ESTÁ DAÑADO.'), 500
        if not clave_ok:
            fallos.append(ahora)
            return jsonify(error='CONTRASEÑA DE EDICIÓN INCORRECTA.'), 403   # 401 haría que sesion.js cierre la sesión
        _intentos.pop(quien, None)

        # 2) validar datos
        try:
            id_salud = int(cuerpo.get('id_salud'))
            assert 0 < id_salud < 1_000_000
        except (TypeError, ValueError, AssertionError):
            return jsonify(error='ESTABLECIMIENTO NO VÁLIDO.'), 400
        por = ' '.join(str(cuerpo.get('actualizado_por', '')).split()).upper()[:120]
        if len(por) < 3:
            return jsonify(error='ESCRIBE QUIÉN REALIZA LA ACTUALIZACIÓN (GRADO Y NOMBRE).'), 400
        campos = cuerpo.get('campos') or {}
        if not isinstance(campos, dict):
            return jsonify(error='DATOS NO VÁLIDOS.'), 400
        nuevos = {k: _limpiar(k, v) for k, v in campos.items() if k in CAMPOS}

        foto = None
        if cuerpo.get('foto'):
            texto = str(cuerpo['foto'])
            if texto.startswith('data:image/jpeg;base64,'):
                texto = texto.split(',', 1)[1]
            try:
                foto = base64.b64decode(texto, validate=True)
            except ValueError:
                return jsonify(error='LA IMAGEN NO ES VÁLIDA.'), 400
            if not foto.startswith(b'\xff\xd8') or len(foto) > MAX_FOTO:
                return jsonify(error='LA IMAGEN DEBE SER JPG DE MENOS DE 700 KB.'), 400

        # 3) guardar en archivo
        with _lock:
            datos = _leer()
            registro = datos.get(str(id_salud), {})
            # valores anteriores de lo que cambia (None = dato original de la capa) para poder deshacer
            antes = {k: registro.get(k) for k, v in nuevos.items() if registro.get(k) != v}
            registro.update(nuevos)
            registro['actualizado_por'] = por
            registro['actualizado'] = datetime.now().strftime('%d/%m/%Y %H:%M')
            obs = ' '.join(str(cuerpo.get('observacion', '')).split()).upper()[:300]
            if obs:
                registro['observacion_actualizacion'] = obs
            if foto:
                FOTOS.mkdir(parents=True, exist_ok=True)
                (FOTOS / f'{id_salud}.jpg').write_bytes(foto)
                registro['_foto'] = int(time.time())
            elif cuerpo.get('quitar_foto'):
                try:
                    (FOTOS / f'{id_salud}.jpg').unlink()
                except FileNotFoundError:
                    pass
                registro.pop('_foto', None)
            datos[str(id_salud)] = registro
            _escribir(datos)
            with HISTORIAL.open('a', encoding='utf-8') as h:
                h.write(json.dumps({'id_salud': id_salud, 'fecha': registro['actualizado'], 'por': por,
                                    'campos': nuevos, 'antes': antes, 'foto': bool(foto), 'quitar_foto': bool(cuerpo.get('quitar_foto')),
                                    'observacion': obs}, ensure_ascii=False) + '\n')

        # 4) copiar a la base de datos, si está disponible
        base = 'SIN CONEXIÓN (SE GUARDÓ EN EL ARCHIVO DEL GEOVISOR)'
        if conectar_escritura:
            try:
                _copiar_a_base(conectar_escritura, id_salud, registro, foto)
                base = 'ACTUALIZADA'
            except Exception:
                pass
        return jsonify(ok=True, base=base, actualizado=registro['actualizado'])
