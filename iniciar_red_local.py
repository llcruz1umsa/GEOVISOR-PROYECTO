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

def ip_tailscale():
    """Dirección de esta laptop en Tailscale (100.64.0.0/10), si Tailscale está activo; si no, None."""
    import ipaddress, subprocess, os
    red = ipaddress.ip_network('100.64.0.0/10')
    for exe in ('tailscale', os.path.join(os.environ.get('ProgramFiles', r'C:\Program Files'), 'Tailscale', 'tailscale.exe')):
        try:
            r = subprocess.run([exe, 'ip', '-4'], capture_output=True, text=True, timeout=5, creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
            for linea in r.stdout.split():
                if ipaddress.ip_address(linea.strip()) in red: return linea.strip()
        except Exception:
            pass
    try:
        for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
            if ipaddress.ip_address(ip) in red: return ip
    except Exception:
        pass
    return None

g = runpy.run_path('servidor.py', run_name='geovisor_offline')
g['crear_administrador']()
app = g['app']
IP = ip_local()
URL = f'http://{IP}:5000'
TS = ip_tailscale()
URL_TS = f'http://{TS}:5000' if TS else None
app.config['TRUSTED_HOSTS'] = list(app.config.get('TRUSTED_HOSTS') or []) + [IP, f'{IP}:5000'] + ([TS, f'{TS}:5000'] if TS else [])

@app.get('/api/red')
def red():
    return jsonify(url=URL, ip=IP, url_tailscale=URL_TS)

PAGINA = """<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Geovisor en el celular</title>
<style>body{margin:0;font-family:Segoe UI,system-ui,sans-serif;background:#0B1D33;color:#fff;display:flex;min-height:100vh;align-items:center;justify-content:center}
.c{background:#fff;color:#0B1D33;border-radius:16px;padding:28px 34px;text-align:center;max-width:460px;box-shadow:0 20px 50px #0008;border-top:6px solid #B79A5B}
h1{font-size:20px;letter-spacing:.06em;margin:0 0 4px}small{color:#5A6B80}.qr{margin:12px auto;width:250px;height:250px}.qr svg{width:250px;height:250px}
.dos{display:flex;gap:26px;flex-wrap:wrap;justify-content:center}.dos>div{flex:1;min-width:250px}h2{font-size:14px;letter-spacing:.06em;margin:16px 0 0;color:#12294A}
.c{max-width:640px!important}
.u{font:700 22px Consolas,monospace;background:#F1F4F9;border-radius:8px;padding:8px 12px;margin:6px 0 14px;word-break:break-all}
ol{text-align:left;font-size:13.5px;line-height:1.55;color:#14233A;padding-left:20px}</style></head>
<body><div class="c"><h1>GEOVISOR OMASUYOS · EMTE</h1><small>Ingreso desde celulares y tablets</small>
<div class="dos"><div><h2>EN EL MISMO WI-FI</h2><div class="qr" data-u="{{url}}">Generando…</div><div class="u">{{url}}</div></div>
{% if url_ts %}<div><h2>DESDE CUALQUIER LUGAR (TAILSCALE)</h2><div class="qr" data-u="{{url_ts}}">Generando…</div><div class="u">{{url_ts}}</div></div>{% endif %}</div>
<ol><li><b>Mismo Wi-Fi:</b> conecta el celular al mismo Wi-Fi que esta laptop y escanea el primer código.</li>
<li><b>Desde otro lugar:</b> instala la app <b>Tailscale</b> en el celular o tablet (Play Store / App Store), entra con la misma cuenta
(o acepta la invitación) y escanea el código <b>TAILSCALE</b>.{% if not url_ts %} <i>(Tailscale no está activo en esta laptop: ábrelo y reinicia este programa.)</i>{% endif %}</li>
<li>Entra con tu <b>usuario</b> (o como invitado).</li>
<li>Mantén esta laptop encendida, sin suspender, y esta ventana del geovisor abierta.</li></ol>
<small>El GPS del celular no funciona por esta conexión (el navegador solo lo permite en conexiones seguras).</small></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
<script>document.querySelectorAll('.qr').forEach(d=>{try{const q=qrcode(0,'M');q.addData(d.dataset.u);q.make();d.innerHTML=q.createSvgTag({cellSize:6,margin:2,scalable:true});}
catch(e){d.innerHTML='<p style="color:#9B1C1C">No se pudo generar el QR (se necesita internet). Escribe la dirección en el navegador.</p>';}});</script>
</body></html>"""

@app.get('/qr')
def qr():
    return render_template_string(PAGINA, url=URL, url_ts=URL_TS)

print('\n' + '=' * 64)
print('  GEOVISOR PARA CELULARES Y TABLETS')
print(f'  En el mismo Wi-Fi:          {URL}')
print(f'  Desde cualquier lugar:      {URL_TS}   (Tailscale)' if URL_TS else '  Desde cualquier lugar:      Tailscale no está activo en esta laptop')
print('  Código QR en la laptop:     http://127.0.0.1:5000/qr')
print('  Si Windows pregunta por el firewall: «Redes privadas» → Permitir acceso.')
print('=' * 64 + '\n')
threading.Timer(2, lambda: webbrowser.open('http://127.0.0.1:5000/qr')).start()
app.run(host='0.0.0.0', port=5000, debug=False)
