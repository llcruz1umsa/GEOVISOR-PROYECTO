"""Geovisor para CELULARES en la misma red Wi-Fi (laptop de Brayan, archivo local, no se sube a GitHub).
Igual que el modo sin conexión, pero escucha en la red local y muestra un código QR en /qr.
El celular debe estar conectado al MISMO Wi-Fi (o a la zona de acceso de la laptop).
La primera vez Windows pregunta por el firewall: marca «Redes privadas» y pulsa «Permitir acceso»."""
import runpy, socket, threading, webbrowser, psycopg
from flask import jsonify, render_template_string

def _sin_base(*a, **k):
    raise psycopg.OperationalError('Modo sin conexion: no se usa la base de datos.')
psycopg.connect = _sin_base

import planeamiento_api as _pa
_inst_plan = _pa.instalar_planeamiento
def _inst_con_salud(app, conectar_escritura):
    _inst_plan(app, conectar_escritura)
    from salud_edicion import instalar_salud
    instalar_salud(app, conectar_escritura)
_pa.instalar_planeamiento = _inst_con_salud

def ip_local():
    """IP de la laptop en la red local (no envía datos: solo elige la interfaz de salida)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1)); return s.getsockname()[0]
    except OSError:
        return socket.gethostbyname(socket.gethostname())
    finally:
        s.close()

g = runpy.run_path('servidor.py', run_name='geovisor_offline')
g['crear_administrador']()
app = g['app']
IP = ip_local()
URL = f'http://{IP}:5000'
app.config['TRUSTED_HOSTS'] = list(app.config.get('TRUSTED_HOSTS') or []) + [IP, f'{IP}:5000']

@app.get('/api/red')
def red():
    return jsonify(url=URL, ip=IP)

PAGINA = """<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Geovisor en el celular</title>
<style>body{margin:0;font-family:Segoe UI,system-ui,sans-serif;background:#0B1D33;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center}
.c{background:#fff;color:#0B1D33;border-radius:16px;padding:28px 34px;text-align:center;max-width:460px;box-shadow:0 20px 50px #0008;border-top:6px solid #B79A5B}
h1{font-size:20px;letter-spacing:.06em;margin:0 0 4px}small{color:#5A6B80}#qr{margin:18px auto;width:300px;height:300px}#qr img,#qr svg{width:300px;height:300px}
.u{font:700 22px Consolas,monospace;background:#F1F4F9;border-radius:8px;padding:8px 12px;margin:6px 0 14px;word-break:break-all}
ol{text-align:left;font-size:13.5px;line-height:1.55;color:#14233A;padding-left:20px}</style></head>
<body><div class="c"><h1>GEOVISOR OMASUYOS · EMTE</h1><small>Ingreso desde un celular en la misma red Wi-Fi</small>
<div id="qr">Generando el código…</div><div class="u">{{url}}</div>
<ol><li>Conecta el celular al <b>mismo Wi-Fi</b> que esta laptop (o a su zona de acceso).</li>
<li>Escanea el código con la cámara del celular.</li><li>Entra como <b>invitado</b> o con tu usuario.</li>
<li>Mantén esta laptop encendida y esta ventana del geovisor abierta.</li></ol>
<small>El GPS del celular no funciona por esta conexión (el navegador solo lo permite en conexiones seguras).</small></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
<script>try{const q=qrcode(0,'M');q.addData('{{url}}');q.make();document.getElementById('qr').innerHTML=q.createSvgTag({cellSize:6,margin:2,scalable:true});}
catch(e){document.getElementById('qr').innerHTML='<p style="color:#9B1C1C">No se pudo generar el QR (se necesita internet la primera vez). Escribe la dirección en el navegador del celular.</p>';}</script>
</body></html>"""

@app.get('/qr')
def qr():
    return render_template_string(PAGINA, url=URL)

print('\n' + '=' * 64)
print('  GEOVISOR PARA CELULARES (misma red Wi-Fi)')
print(f'  Dirección para el celular:  {URL}')
print('  Código QR en la laptop:     http://127.0.0.1:5000/qr')
print('  Si Windows pregunta por el firewall: «Redes privadas» → Permitir acceso.')
print('=' * 64 + '\n')
threading.Timer(2, lambda: webbrowser.open('http://127.0.0.1:5000/qr')).start()
app.run(host='0.0.0.0', port=5000, debug=False)
