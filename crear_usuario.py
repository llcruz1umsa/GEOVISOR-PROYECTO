"""Crea cuentas individuales sin cambiar la cuenta principal ni su contraseña."""
import getpass
import json
import os
import tempfile
from pathlib import Path
from datetime import datetime
from werkzeug.security import generate_password_hash
from acceso_local import CONFIG

def agregar(usuario, password):
    if not CONFIG.exists():
        raise ValueError('Primero inicia el geovisor y crea la cuenta principal.')
    config = json.loads(CONFIG.read_text(encoding='utf-8'))
    if not usuario or len(usuario) > 64 or any(c.isspace() for c in usuario):
        raise ValueError('El usuario debe tener entre 1 y 64 caracteres, sin espacios.')
    if len(password) < 10:
        raise ValueError('La contraseña debe tener al menos 10 caracteres.')
    usuarios = config.setdefault('usuarios', {})
    existentes = [config['usuario'], *usuarios]
    if usuario.casefold() in [u.casefold() for u in existentes]:
        raise ValueError('Ese usuario ya existe. Elige otro nombre.')
    usuarios[usuario] = generate_password_hash(password)
    backup = CONFIG.with_name('acceso_geovisor_respaldo_' + datetime.now().strftime('%Y%m%d_%H%M%S_%f') + '.json')
    with backup.open('xb') as f:
        f.write(CONFIG.read_bytes())
    os.chmod(backup, 0o600)
    fd, temporal = tempfile.mkstemp(prefix='acceso_', suffix='.tmp', dir=CONFIG.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        os.chmod(temporal, 0o600)
        os.replace(temporal, CONFIG)
    finally:
        if os.path.exists(temporal):
            os.unlink(temporal)

def main():
    print('\nCREAR USUARIO DEL GEOVISOR')
    print('Las contraseñas no muestran caracteres mientras se escriben.')
    try:
        usuario = input('Nombre del nuevo usuario: ').strip()
        password = getpass.getpass('Contraseña nueva (mínimo 10 caracteres): ')
        if password != getpass.getpass('Repite la contraseña: '):
            raise ValueError('Las contraseñas no coinciden. Ejecuta el programa otra vez.')
        agregar(usuario, password)
        print('\nUsuario creado: ' + usuario)
        print('Tu cuenta principal se conserva. Reinicia el servidor del geovisor.')
    except (ValueError, OSError, KeyError) as error:
        print('\nNo se creó el usuario: ' + str(error))
        return 1
    return 0

if __name__ == '__main__':
    raise SystemExit(main())
