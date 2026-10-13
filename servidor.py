"""Geovisor Omasuyos: servicio local de consulta, sin escrituras en PostgreSQL."""
import getpass
import math
from pathlib import Path
import psycopg
from psycopg import sql
from flask import Flask, jsonify, request, send_from_directory

WEB = Path(__file__).parent / 'web'
app = Flask(__name__, static_folder=str(WEB), static_url_path='')
from acceso_local import instalar_acceso, crear_administrador
instalar_acceso(app, WEB)
clave = None
ALIAS = {
 'vias_omasuyos': ['vias', 'vias_omasuyos'],
 'rios_omasuyos': ['rios', 'rios_omasuyos'],
 'cuerpos_agua_omasuyos': ['cuerpos_agua', 'cuerpos_agua_omasuyos'],
 'centros_educativos_omasuyos': ['centros_educativos', 'centros_educativos_omasuyos'],
 'centros_salud_omasuyos': ['centros_salud', 'establecimientos_salud', 'centros_salud_omasuyos'],
}
EDGES = "SELECT id, source, target, cost, reverse_cost FROM ruteo.vias_geovisor_nodadas WHERE categoria_vehicular AND source <> target"

def conectar():
 return psycopg.connect(host='localhost', port=5432, dbname='bgd_huarina',
  user='postgres', password=clave, connect_timeout=10,
  options='-c default_transaction_read_only=on -c statement_timeout=30000')

@app.get('/')
def inicio():
 return send_from_directory(WEB, 'index.html')

@app.get('/api/estado')
def estado():
 try:
  with conectar() as c:
   base, postgis, pgr = c.execute('SELECT current_database(), postgis_lib_version(), pgr_version()').fetchone()
  return jsonify(estado='Conexion correcta', base=base, postgis=postgis, pgrouting=pgr)
 except psycopg.Error:
  return jsonify(error='No se pudo consultar PostgreSQL. Revisa la consola.'), 503

@app.get('/api/capas/<nombre>')
def capa(nombre):
 if nombre not in ALIAS:
  return jsonify(error='Capa no permitida'), 404
 try:
  with conectar() as c:
   tablas = c.execute("SELECT f_table_name, f_geometry_column, type FROM public.geometry_columns WHERE f_table_schema='cartografia' AND f_table_name=ANY(%s)", (ALIAS[nombre],)).fetchall()
   if len(tablas) != 1:
    return jsonify(error='Tabla ausente o ambigua en cartografia. Ajusta ALIAS en servidor.py.'), 404
   tabla, geom, tipo = tablas[0]
   geometry = sql.SQL('ST_Transform({g},4326)').format(g=sql.Identifier(geom))
   if tipo in ('LINESTRING', 'POLYGON'):
    geometry = sql.SQL('ST_Multi({})').format(geometry)
   consulta = sql.SQL("SELECT jsonb_build_object('type','FeatureCollection','features',COALESCE(jsonb_agg(jsonb_build_object('type','Feature','properties',to_jsonb(t)-{key},'geometry',ST_AsGeoJSON({geometry})::jsonb)),'[]'::jsonb)) FROM {table} t WHERE {geom} IS NOT NULL").format(key=sql.Literal(geom), geometry=geometry, table=sql.Identifier('cartografia', tabla), geom=sql.Identifier(geom))
   data = c.execute(consulta).fetchone()[0]
  return jsonify(data)
 except psycopg.Error:
  return jsonify(error='No se pudo leer esta capa de PostgreSQL.'), 503

def punto(valor):
 if not isinstance(valor, list) or len(valor)!=2 or any(isinstance(v,bool) or not isinstance(v,(int,float)) or not math.isfinite(v) for v in valor):
  raise ValueError('Selecciona origen y destino en el mapa.')
 lon, lat = valor
 if not (-180<=lon<=180 and -85<=lat<=85):
  raise ValueError('Coordenadas fuera de rango.')
 return lon,lat

def ajustar_via(c, xy):
 return c.execute("""WITH p AS (
  SELECT ST_Transform(ST_SetSRID(ST_MakePoint(%s,%s),4326),32719) geom
 ), cercano AS (
  SELECT v.*, p.geom punto FROM ruteo.vias_geovisor_nodadas v CROSS JOIN p
  WHERE v.categoria_vehicular AND v.source<>v.target
    AND v.source IS NOT NULL AND v.target IS NOT NULL
    AND ST_DWithin(v.geom,p.geom,500)
  ORDER BY v.geom <-> p.geom, v.id LIMIT 1
 ), ajuste AS (
  SELECT *, ST_LineLocatePoint(geom,punto) fraccion FROM cercano
 )
 SELECT id,source,target,fraccion,ST_Distance(geom,punto),
  ST_AsGeoJSON(ST_Transform(ST_LineInterpolatePoint(geom,fraccion),4326))::jsonb
 FROM ajuste""", xy).fetchone()


def cortes_para_ruta(a, b, siguiente_nodo):
 # Two temporary vertices exist only in this query, never in database tables.
 cortes={}
 nodos=[]
 for row in (a,b):
  edge,source,target,fraction,*_=row
  cuts=cortes.setdefault(edge,[(0.0,source),(1.0,target)])
  existing=next((node for f,node in cuts if abs(f-fraction)<1e-10),None)
  if existing is None:
   existing=siguiente_nodo;siguiente_nodo+=1;cuts.append((fraction,existing))
  nodos.append(existing)
 return {edge:sorted(cuts) for edge,cuts in cortes.items()},nodos


def grafo_consulta(c, cortes):
 # Every edge gets its own block of four IDs: at most three pieces per edge.
 excluded=sql.SQL(',').join(sql.Literal(int(edge)) for edge in cortes)
 queries=[sql.SQL("SELECT id*4 AS id,id AS id_original,source,target,estado,geom FROM ruteo.vias_geovisor_nodadas WHERE categoria_vehicular AND source<>target AND id NOT IN ({})").format(excluded)]
 for edge,cuts in cortes.items():
  for index,((start,source),(end,target)) in enumerate(zip(cuts,cuts[1:]),1):
   queries.append(sql.SQL("SELECT id*4+{index} AS id,id AS id_original,{source}::bigint AS source,{target}::bigint AS target,estado,ST_LineSubstring(geom,{start}::double precision,{end}::double precision) AS geom FROM ruteo.vias_geovisor_nodadas WHERE id={edge}").format(index=sql.Literal(index),source=sql.Literal(int(source)),target=sql.Literal(int(target)),start=sql.Literal(float(start)),end=sql.Literal(float(end)),edge=sql.Literal(int(edge))))
 raw=sql.SQL(' UNION ALL ').join(queries)
 return sql.SQL('SELECT *,ST_Length(geom) AS cost,ST_Length(geom) AS reverse_cost FROM ({}) partes').format(raw).as_string(c)

@app.post('/api/ruta')
def ruta():
 try:
  data=request.get_json(silent=True)
  if not isinstance(data,dict):
   raise ValueError('Solicitud de ruta no válida.')
  origen=punto(data.get('origen')); destino=punto(data.get('destino'))
  with conectar() as c:
   a,b=ajustar_via(c,origen),ajustar_via(c,destino)
   if not a or not b:
    raise ValueError('Marca cada punto a menos de 500 metros de una vía vehicular.')
   next_node=c.execute('SELECT COALESCE(MAX(GREATEST(source,target)),0)+1 FROM ruteo.vias_geovisor_nodadas').fetchone()[0]
   cortes,(start_node,end_node)=cortes_para_ruta(a,b,next_node)
   if start_node==end_node:
    raise ValueError('Ambos puntos corresponden a la misma ubicación sobre la vía. Elige puntos más separados.')
   graph=grafo_consulta(c,cortes)
   edges='SELECT id,source,target,cost,reverse_cost FROM ('+graph+') red'
   query=sql.SQL("""WITH red AS ({graph})
    SELECT ST_AsGeoJSON(ST_Transform(CASE WHEN d.node=v.source THEN v.geom ELSE ST_Reverse(v.geom) END,4326))::jsonb,v.cost,v.estado
    FROM pgr_dijkstra(%s,%s::bigint,%s::bigint,false) d
    JOIN red v ON v.id=d.edge ORDER BY d.path_seq""").format(graph=sql.SQL(graph))
   rows=c.execute(query,(edges,start_node,end_node)).fetchall()
   if not rows:
    raise ValueError('No hay conexión entre las vías más cercanas a esos puntos en la red actual. Revisa las uniones de los tramos.')
  return jsonify(type='FeatureCollection',features=[dict(type='Feature',geometry=r[0],properties=dict(distancia_m=r[1],estado=r[2])) for r in rows],distancia_m=sum(r[1] for r in rows),origen_nodo=a[5]['coordinates'],destino_nodo=b[5]['coordinates'],ajuste_origen_m=a[4],ajuste_destino_m=b[4],origen_tramo=a[0],destino_tramo=b[0],advertencia='Ruta preliminar por distancia entre puntos ajustados a las vías. Red bidireccional. No verifica acceso, transitabilidad ni obras. No incluye accesos fuera de la red.')
 except ValueError as e:
  return jsonify(error=str(e)),400
 except psycopg.Error:
  app.logger.exception('Fallo en cálculo de ruta')
  return jsonify(error='No se pudo consultar la red. Revisa la consola y la tabla ruteo.vias_geovisor_nodadas.'),503

if __name__=='__main__':
 crear_administrador()
 clave=getpass.getpass('Contrasena de PostgreSQL: ')
 try:
  with conectar() as c:
   c.execute('SELECT 1')
 except psycopg.Error:
  print('No se pudo conectar. Comprueba PostgreSQL y la contrasena.')
  raise SystemExit(1)
 print('Conexion verificada. Abre http://127.0.0.1:5000')
 app.run(host='127.0.0.1',port=5000,debug=False)
