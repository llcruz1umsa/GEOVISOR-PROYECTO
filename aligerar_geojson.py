"""Aligera las capas GeoJSON de web/data: coordenadas a 6 decimales (~0,1 m), sin puntos repetidos y JSON compacto.
Uso (desde esta carpeta): python aligerar_geojson.py web/data/vias_omasuyos.geojson web/data/rios_omasuyos.geojson ...
Vuelve a ejecutarlo si regeneras las copias GeoJSON desde PostgreSQL o QGIS."""
import json,sys,os
def red(c):
    if isinstance(c[0],(int,float)): return [round(c[0],6),round(c[1],6)]
    out=[red(x) for x in c]
    if out and isinstance(out[0][0],(int,float)):  # lista de puntos: quitar repetidos consecutivos
        q=[out[0]]
        for p in out[1:]:
            if p!=q[-1]: q.append(p)
        # anillos: conservar cierre; líneas: al menos 2 puntos
        if len(q)<2: q=out[:2]
        out=q
    return out
for ruta in sys.argv[1:]:
    antes=os.path.getsize(ruta)
    d=json.load(open(ruta,encoding='utf-8'))
    for f in d['features']:
        g=f.get('geometry')
        if g and g.get('coordinates') is not None: g['coordinates']=red(g['coordinates'])
    tmp=ruta+'.tmp'
    with open(tmp,'w',encoding='utf-8') as fh: json.dump(d,fh,ensure_ascii=False,separators=(',',':'))
    os.replace(tmp,ruta)
    print(f'{os.path.basename(ruta)}: {antes/1e6:.2f} MB -> {os.path.getsize(ruta)/1e6:.2f} MB')
