/* Vehículos de la EMTE en 3D (BYNS7, 04-11-2026). Modelos simplificados armados con three.js (assets/three.min.js,
   funciona sin internet), girando sobre fondo transparente. Lo usa rutas-tiempo.js al elegir un vehículo.
   window.EMTE_VEH3D.visor(contenedor) → { mostrar(id), detener() } */
(function () {
'use strict';
let cargando = null;
const cargarThree = () => window.THREE ? Promise.resolve() : (cargando || (cargando = new Promise((ok, mal) => { const s = document.createElement('script'); s.src = 'assets/three.min.js'; s.onload = ok; s.onerror = () => { cargando = null; mal(new Error('three.js')); }; document.head.append(s); })));

function modelo(id) {
  const T = window.THREE, G = new T.Group();
  const mat = (c, o = {}) => new T.MeshStandardMaterial({ color: c, roughness: o.r ?? .45, metalness: o.m ?? .25, emissive: o.e || 0x000000, emissiveIntensity: o.ei ?? 1 });
  const VIDRIO = mat(0x16202b, { r: .15, m: .6 }), NEGRO = mat(0x050505, { r: .85, m: .05 }), CROMO = mat(0xc9ced6, { r: .25, m: .9 });
  const FARO = mat(0xfff6d8, { e: 0xfff1c0, ei: .6, r: .2 }), STOP = mat(0xc0392b, { e: 0x8e1b10, ei: .5 });
  const camuflaje = () => {   // manchas verde oliva, verde oscuro, café y arena (textura propia)
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
    g.fillStyle = '#6b7046'; g.fillRect(0, 0, 256, 256);
    let sem = 7; const rnd = () => (sem = (sem * 9301 + 49297) % 233280) / 233280;
    for (const col of ['#a3946a', '#3f4a2a', '#5a4632', '#2c3320', '#8a8457']) for (let n = 0; n < 9; n++) {
      g.fillStyle = col; g.beginPath(); const cx = rnd() * 256, cy = rnd() * 256, r = 16 + rnd() * 30;
      for (let a = 0; a < 12; a++) { const t = a / 12 * Math.PI * 2, rr = r * (.6 + rnd() * .7); for (const [dx, dy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) { } a ? g.lineTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * .7) : g.moveTo(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * .7); }
      g.closePath(); g.fill(); }
    const tx = new T.CanvasTexture(cv); tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(.45, .45); if ('encoding' in tx) tx.encoding = T.sRGBEncoding;
    return new T.MeshStandardMaterial({ map: tx, roughness: .8, metalness: .05 });
  };
  // perfil lateral (x a lo largo, y arriba) extruido a lo ancho (z)
  const perfil = (pts, W, m, bev = .05) => { const s = new T.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y));
    const g = new T.ExtrudeGeometry(s, { depth: Math.max(.01, W - 2 * bev), bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 3, steps: 1 }); g.translate(0, 0, -(W - 2 * bev) / 2); const me = new T.Mesh(g, m); G.add(me); return me; };
  const caja = (x0, x1, y0, y1, W, m, z = 0) => { const me = new T.Mesh(new T.BoxGeometry(x1 - x0, y1 - y0, W), m); me.position.set((x0 + x1) / 2, (y0 + y1) / 2, z); G.add(me); return me; };
  const rueda = (x, r, W, doble) => { for (const s of [-1, 1]) { const z = s * (W / 2 - .14); const t = new T.Mesh(new T.CylinderGeometry(r, r, doble ? .52 : .3, 28), NEGRO); t.rotation.x = Math.PI / 2; t.position.set(x, r, z); G.add(t);
      const a = new T.Mesh(new T.CylinderGeometry(r * .55, r * .55, (doble ? .52 : .3) + .02, 20), CROMO); a.rotation.x = Math.PI / 2; a.position.set(x, r, z); G.add(a); } };
  const pilares = (xs, y0, y1, W, m) => xs.forEach(x => caja(x - .05, x + .05, y0, y1, W + .08, m));
  const luces = (xF, yF, xR, yR, W) => { for (const s of [-1, 1]) { caja(xF - .04, xF + .03, yF - .09, yF + .09, .32, FARO, s * (W / 2 - .3)); caja(xR - .03, xR + .04, yR - .12, yR + .12, .22, STOP, s * (W / 2 - .2)); } };
  if (id === 'kinglong') {   // minibús tipo Coaster
    const W = 2.05, B = mat(0xd9d3c4, { r: .3, m: .55 });   // champán / plateado
    perfil([[0, .35], [0, 2.55], [6.55, 2.6], [6.95, 1.75], [7, 1.1], [7, .35]], W, B);
    perfil([[.12, 1.5], [.12, 2.3], [6.69, 2.3], [6.95, 1.75], [6.97, 1.5]], W + .04, VIDRIO, .02);
    pilares([1.5, 2.7, 3.9, 5.1, 6.2], 1.5, 2.3, W, B); caja(.05, 6.98, .35, .95, W + .05, mat(0x8f8a7e, { r: .35, m: .5 })); caja(.05, 6.98, .95, 1.05, W + .06, mat(0x5a4a3a));
    caja(6.95, 7.1, .35, .6, W - .1, CROMO); rueda(1.4, .42, W); rueda(5.7, .42, W); luces(7, .85, 0, 1.1, W);
  } else if (id === 'noah') {   // Toyota Town Ace Noah: dos tonos
    const W = 1.72, B = camuflaje();   // camuflada
    perfil([[0, .38], [0, 1.85], [.15, 1.95], [3.2, 1.95], [3.95, 1.2], [4.55, 1.05], [4.6, .8], [4.6, .38]], W, B);
    perfil([[0, .36], [0, .5], [4.6, .5], [4.6, .36]], W + .03, NEGRO, .02);   // estribo
    perfil([[.08, 1.25], [.08, 1.82], [3.3, 1.85], [3.9, 1.25]], W + .04, VIDRIO, .02);
    pilares([1.2, 2.3], 1.25, 1.84, W, B); caja(4.55, 4.66, .4, .62, W - .1, CROMO); rueda(.8, .32, W); rueda(3.7, .32, W); luces(4.6, .95, 0, 1.05, W);
  } else if (id === 'surf') {   // Toyota Hilux Surf 4x4
    const W = 1.76, B = mat(0x1e4a2e, { r: .3, m: .55 });   // verde oscuro
    perfil([[0, .5], [0, 1.75], [.1, 1.82], [3, 1.82], [3.55, 1.3], [4.6, 1.2], [4.7, .95], [4.7, .5]], W, B);
    perfil([[0, .48], [0, .88], [4.7, .88], [4.7, .48]], W + .03, mat(0xaeb3ba, { r: .3, m: .6 }), .02);
    perfil([[.08, 1.32], [.08, 1.75], [3.05, 1.77], [3.5, 1.32]], W + .04, VIDRIO, .02);
    pilares([1.15, 2.1], 1.32, 1.76, W, B);
    const rep = new T.Mesh(new T.CylinderGeometry(.38, .38, .26, 24), NEGRO); rep.rotation.z = Math.PI / 2; rep.position.set(-.16, 1.08, 0); G.add(rep);
    for (const x of [.6, 2.4]) caja(x - .04, x + .04, 1.86, 1.94, W - .2, NEGRO); caja(.4, 2.7, 1.92, 1.96, .06, NEGRO, W / 2 - .15); caja(.4, 2.7, 1.92, 1.96, .06, NEGRO, -W / 2 + .15);
    caja(4.65, 4.78, .5, .75, W - .1, NEGRO); rueda(.85, .4, W); rueda(3.75, .4, W); luces(4.7, 1.05, 0, 1.2, W);
  } else if (id === 'iveco') {   // camión Iveco EuroCargo del Ejército: cabina frontal y carrocería metálica alta, todo verde
    const W = 2.35, VERDE = mat(0x4f6a4c, { r: .5, m: .3 }), VERDE2 = mat(0x3f573d, { r: .55, m: .3 }), BALIZA = mat(0x3a4dff, { e: 0x2233ff, ei: .8, r: .2 });
    // cabina (frente plano, apenas inclinado)
    perfil([[6.25, .75], [6.25, 2.85], [8.05, 2.9], [8.2, 2.6], [8.25, 1.05], [8.25, .75]], W, VERDE, .08);
    perfil([[8.06, 1.85], [8.1, 2.62], [8.04, 2.8], [8.3, 2.8], [8.3, 1.85]], W - .25, VIDRIO, .02);   // parabrisas
    perfil([[7.15, 1.85], [7.15, 2.6], [7.95, 2.65], [7.98, 1.85]], W + .04, VIDRIO, .02);   // ventanas laterales
    caja(8.2, 8.35, .55, 1.0, W, NEGRO); caja(8.24, 8.3, 1.25, 1.75, W - .5, VERDE2);   // parachoques y parrilla
    for (const s of [-1, 1]) { caja(7.55, 7.6, 2.0, 2.55, .06, NEGRO, s * (W / 2 + .35)); caja(7.4, 7.6, 2.5, 2.55, .06, NEGRO, s * (W / 2 + .2));   // espejos
      const b = new T.Mesh(new T.SphereGeometry(.13, 16, 12), BALIZA); b.position.set(7.95, 3.0, s * (W / 2 - .2)); G.add(b); }
    // carrocería metálica alta con nervios verticales y barandas en el techo
    caja(.2, 6.15, .55, .95, W - .5, NEGRO);   // chasis
    caja(.15, 6.15, 1.0, 3.15, W, VERDE);
    for (let x = .35; x < 6.1; x += .55) caja(x - .05, x + .05, 1.0, 3.15, W + .08, VERDE2);
    caja(.12, 6.18, .98, 1.08, W + .1, VERDE2); caja(.12, 6.18, 3.07, 3.17, W + .1, VERDE2);
    for (let x = .5; x < 6.1; x += 1.0) { const arco = new T.Mesh(new T.TorusGeometry(W / 2 - .05, .025, 6, 20, Math.PI), NEGRO); arco.rotation.y = Math.PI / 2; arco.position.set(x, 3.15, 0); arco.scale.y = .35; G.add(arco); }
    for (const s of [-1, 1]) caja(.3, 6.0, 3.47, 3.5, .04, NEGRO, s * .7);
    const rep = new T.Mesh(new T.CylinderGeometry(.48, .48, .28, 24), NEGRO); rep.rotation.x = Math.PI / 2; rep.position.set(4.6, .55, W / 2 - .25); rep.rotation.z = Math.PI / 2; rep.rotation.x = 0; G.add(rep);   // rueda de auxilio bajo la carrocería
    rueda(1.9, .52, W, true); rueda(7.3, .52, W); luces(8.32, .82, .12, 1.15, W);
  } else if (id === 'lc78') {   // Toyota Land Cruiser 78 ambulancia
    const W = 1.9, B = mat(0xf4f5f6, { r: .35 }), ROJO = mat(0xc0392b, { r: .4 });
    perfil([[3.2, .55], [3.2, 1.95], [4.2, 1.95], [4.45, 1.45], [5.2, 1.35], [5.2, .55]], W, B);
    perfil([[0, .55], [0, 2.38], [3.28, 2.38], [3.28, .55]], W + .1, B, .06);
    perfil([[3.3, 1.47], [3.3, 1.88], [4.2, 1.9], [4.42, 1.47]], W + .04, VIDRIO, .02);
    caja(.02, 5.18, 1.12, 1.3, W + .14, ROJO);
    for (const s of [-1, 1]) { caja(1.45, 1.75, 1.45, 2.1, .02, ROJO, s * (W / 2 + .07)); caja(1.27, 1.93, 1.62, 1.92, .02, ROJO, s * (W / 2 + .07)); }
    caja(3.4, 3.85, 1.98, 2.1, .9, mat(0xff2a2a, { e: 0xff0000, ei: .7 }), -.0); caja(3.85, 4.15, 1.98, 2.1, .9, mat(0x2a6bff, { e: 0x0033ff, ei: .7 }));
    caja(5.15, 5.28, .55, .8, W - .1, NEGRO); rueda(.95, .4, W); rueda(4.4, .4, W); luces(5.2, 1.1, 0, 1.4, W);
  } else {   // Bus Blue Bird All American (negro)
    const W = 2.42, B = mat(0x3d5a36, { r: .45, m: .3 });   // TOPO BUS verde
    perfil([[0, .5], [0, 3], [10.2, 3.05], [10.45, 2.1], [11, 1.7], [11, .5]], W, B, .07);
    perfil([[.15, 1.85], [.15, 2.65], [10.29, 2.7], [10.44, 2.15], [10.44, 1.85]], W + .04, mat(0x0b0f14, { r: .1, m: .7 }), .02);
    pilares([1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.2, 8.2, 9.2], 1.85, 2.66, W, B); caja(.05, 10.98, 1.6, 1.7, W + .05, CROMO);
    caja(10.95, 11.12, .5, .8, W, NEGRO); caja(-.12, .05, .5, .8, W, NEGRO); rueda(2.2, .5, W, true); rueda(8.7, .5, W); luces(11, 1.15, 0, 1.4, W);
  }
  // centrar: base en y = 0, centro en x y z
  const bx = new T.Box3().setFromObject(G), c = bx.getCenter(new T.Vector3());
  G.children.forEach(m => { m.position.x -= c.x; m.position.z -= c.z; });
  return G;
}

function visor(cont) {
  let R = null, esc, cam, grupo = null, sombra = null, id = null, raf = 0, t0 = 0, vivo = true;
  const tam = () => [cont.clientWidth || 260, cont.clientHeight || 170];
  function iniciar() {
    const T = window.THREE, [w, h] = tam();
    R = new T.WebGLRenderer({ alpha: true, antialias: true }); R.setClearColor(0x000000, 0); R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.setSize(w, h);
    if ('outputEncoding' in R) R.outputEncoding = T.sRGBEncoding;
    cont.append(R.domElement); R.domElement.style.display = 'block';
    esc = new T.Scene(); cam = new T.PerspectiveCamera(28, w / h, .1, 200);
    esc.add(new T.HemisphereLight(0xffffff, 0x303a45, .75));
    const d1 = new T.DirectionalLight(0xffffff, .9); d1.position.set(6, 9, 7); esc.add(d1);
    const d2 = new T.DirectionalLight(0xdfe8ff, .45); d2.position.set(-7, 4, -5); esc.add(d2);
    // sombra suave en el suelo (sin fondo)
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    gr.addColorStop(0, 'rgba(0,0,0,.38)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    sombra = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false })); sombra.rotation.x = -Math.PI / 2; sombra.position.y = .005; esc.add(sombra);
    new ResizeObserver(() => { if (!R) return; const [w2, h2] = tam(); R.setSize(w2, h2); cam.aspect = w2 / h2; cam.updateProjectionMatrix(); if (grupo) encuadrar(); }).observe(cont);
  }
  function encuadrar() {
    const T = window.THREE, bx = new T.Box3().setFromObject(grupo), s = bx.getSize(new T.Vector3()), L = Math.max(s.x, s.z), H = s.y;
    sombra.scale.set(L * 1.25, Math.max(s.x, s.z) * .75, 1);
    // distancia para que entre a lo ancho (gira: se usa la diagonal) y a lo alto, con margen
    const D = Math.hypot(s.x, s.z), tv = Math.tan(T.MathUtils.degToRad(cam.fov / 2)), th = tv * cam.aspect;
    const dist = Math.max(D * .5 / th, H * .75 / tv) + D * .12;
    cam.position.set(0, H * .5 + dist * .3, dist); cam.lookAt(0, H * .45, 0); cam.userData.ok = true;
  }
  function animar(t) {
    if (!vivo) return; raf = requestAnimationFrame(animar);
    if (!cont.isConnected || !cont.offsetParent) return;
    if (document.documentElement.classList.contains('mapa-gesto') || document.body.classList.contains('ap-moviendo')) return;   // 12-11-2026: no compite con el mapa mientras se mueve
    const dt = t0 ? Math.min(.05, (t - t0) / 1000) : 0; t0 = t;
    if (grupo) grupo.rotation.y += dt * .7;
    R.render(esc, cam);
  }
  return {
    async mostrar(nuevo) {
      id = nuevo; await cargarThree(); if (id !== nuevo) return;
      if (!R) iniciar();
      if (grupo) { esc.remove(grupo); grupo.traverse(o => { o.geometry && o.geometry.dispose(); }); }
      grupo = modelo(nuevo); grupo.rotation.y = -.6; esc.add(grupo); encuadrar();
      vivo = true; cancelAnimationFrame(raf); t0 = 0; raf = requestAnimationFrame(animar);
    },
    detener() { vivo = false; cancelAnimationFrame(raf); }
  };
}
window.EMTE_VEH3D = { visor, cargarThree, modelo };
})();
