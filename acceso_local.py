"""Administrador local. Credenciales fuera de web; sesiones revocables en memoria."""
import getpass,json,secrets,time,os
from pathlib import Path
from flask import request,session,redirect,jsonify,render_template_string
from werkzeug.security import generate_password_hash,check_password_hash
CONFIG=Path(__file__).resolve().parent/'acceso_geovisor.json'
def crear_administrador():
 if CONFIG.exists():return
 print('\nCREAR ACCESO AL GEOVISOR (distinto de PostgreSQL)')
 usuario=input('Nombre de usuario [admin]: ').strip() or 'admin'
 if not usuario or len(usuario)>64:raise ValueError('Usuario no válido.')
 while True:
  password=getpass.getpass('Nueva contrasena del geovisor (minimo 10 caracteres): ')
  if len(password)<10:print('Escribe al menos 10 caracteres.');continue
  if password!=getpass.getpass('Repite la contrasena del geovisor: '):print('No coinciden. Intenta nuevamente.');continue
  break
 with CONFIG.open('x',encoding='utf-8') as f:json.dump({'usuario':usuario,'hash':generate_password_hash(password)},f)
 try:os.chmod(CONFIG,0o600)
 except OSError:pass
 print('Cuenta creada. Usa ese usuario y contrasena para entrar al mapa.\n')
def instalar_acceso(app,web):
 app.secret_key=secrets.token_hex(32)
 app.config.update(SESSION_COOKIE_HTTPONLY=True,SESSION_COOKIE_SAMESITE='Strict',MAX_CONTENT_LENGTH=1024*1024,TRUSTED_HOSTS=['127.0.0.1','localhost','laptop-h1cc8due.tail6736e0.ts.net'])
 sesiones={};intentos={};dummy=generate_password_hash(secrets.token_hex(16))
 def token():
  if 'csrf' not in session:session['csrf']=secrets.token_urlsafe(32)
  return session['csrf']
 def valido_csrf():
  value=request.form.get('csrf') or request.headers.get('X-CSRF-Token','')
  return bool(value) and secrets.compare_digest(value,session.get('csrf',''))
 def autentico():
  sid=session.get('sid');now=time.time()
  for key,entry in list(sesiones.items()):
   if entry['expira']<=now:sesiones.pop(key,None)
  return sesiones.get(sid)
 @app.before_request
 def proteger():
  public=request.path in ('/login','/assets/logo-ejercito.png','/assets/logo-emte.png','/assets/fondo-acceso.png','/assets/himno-emte.m4a')
  if public:return
  if not autentico():
   if request.path.startswith('/api/'):return jsonify(error='Tu sesión terminó. Vuelve a iniciar sesión.'),401
   return redirect('/login')
  if request.method not in ('GET','HEAD','OPTIONS') and not valido_csrf():return jsonify(error='Solicitud no válida. Actualiza la página.'),403
 @app.after_request
 def cabeceras(response):
  response.headers['Cache-Control']='no-store'
  response.headers['X-Content-Type-Options']='nosniff'
  response.headers['X-Frame-Options']='DENY'
  response.headers['Referrer-Policy']='strict-origin-when-cross-origin'
  return response
 @app.route('/login',methods=['GET','POST'])
 def login():
  if autentico():return redirect('/')
  error='';code=200
  if request.method=='POST':
   if not valido_csrf():error='La página venció. Intenta de nuevo.';code=403
   elif not CONFIG.exists():error='Crea primero la cuenta en la ventana del servidor.';code=503
   else:
    key=request.remote_addr or 'local';now=time.monotonic();failed=[t for t in intentos.get(key,[]) if now-t<60];intentos[key]=failed
    if len(failed)>=5:error='Demasiados intentos. Espera un minuto.';code=429
    else:
     config=json.loads(CONFIG.read_text(encoding='utf-8'));usuario=request.form.get('usuario','').strip();pw=request.form.get('password','')
     cuentas={config['usuario']:config['hash']}
     cuentas.update(config.get('usuarios',{}))
     correct=check_password_hash(cuentas.get(usuario,dummy),pw)
     if correct and usuario in cuentas:
      old=session.get('sid');sesiones.pop(old,None);session.clear();sid=secrets.token_urlsafe(32);sesiones[sid]={'usuario':usuario,'expira':time.time()+8*3600};session['sid']=sid;token();intentos.pop(key,None);return redirect('/')
     failed.append(now);error='Usuario o contraseña incorrectos.';code=401
  return render_template_string((web/'login.html').read_text(encoding='utf-8'),csrf=token(),error=error),code
 @app.get('/api/sesion')
 def estado_sesion():return jsonify(usuario=autentico()['usuario'],csrf=token())
 @app.post('/logout')
 def salir():
  sesiones.pop(session.get('sid'),None);session.clear();return redirect('/login')
