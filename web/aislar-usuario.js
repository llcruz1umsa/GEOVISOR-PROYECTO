/* CADA USUARIO VE SOLO LO SUYO (11-11-2026). Se carga ANTES que todo el geovisor.
   Lo que el geovisor guarda en este aparato (avenidas, ejercicios locales, calco sin servidor, preferencias…)
   queda separado por usuario: si en la misma PC o tablet entra otra persona, no ve lo que dibujó la anterior.
   El usuario lo deja anotado la pantalla de inicio al ingresar («geo-usuario-actual»). */
(function () {
  'use strict';
  var S = window.Storage && Storage.prototype; if (!S) return;
  var L; try { L = window.localStorage; } catch (e) { return; }
  var g = S.getItem, st = S.setItem, rm = S.removeItem, ky = S.key, cl = S.clear, dl = Object.getOwnPropertyDescriptor(S, 'length');
  var u = null; try { u = g.call(L, 'geo-usuario-actual'); } catch (e) {}
  if (!u) return;
  var P = 'u:' + u + ':', FIJAS = /^(geo-usuario-actual|geo-dueno-legado|geovisor_|u:)/;
  var propia = function (k) { return !FIJAS.test(k); };
  function todas() { var n = dl.get.call(L), out = []; for (var i = 0; i < n; i++) out.push(ky.call(L, i)); return out; }
  // lo que había antes de separar por usuario pasa al primer usuario que entra en este aparato
  try {
    if (!g.call(L, 'geo-dueno-legado')) {
      st.call(L, 'geo-dueno-legado', u);
      todas().forEach(function (k) { if (k && propia(k)) { if (g.call(L, P + k) == null) st.call(L, P + k, g.call(L, k)); rm.call(L, k); } });
    }
  } catch (e) {}
  var mia = function (k) { return k != null && k.indexOf(P) === 0; };
  S.getItem = function (k) { return this === L && propia(String(k)) ? g.call(L, P + k) : g.call(this, k); };
  S.setItem = function (k, v) { return this === L && propia(String(k)) ? st.call(L, P + k, v) : st.call(this, k, v); };
  S.removeItem = function (k) { return this === L && propia(String(k)) ? rm.call(L, P + k) : rm.call(this, k); };
  S.key = function (i) { if (this !== L) return ky.call(this, i); var m = todas().filter(mia); return i < m.length ? m[i].slice(P.length) : null; };
  S.clear = function () { if (this !== L) return cl.call(this); todas().filter(mia).forEach(function (k) { rm.call(L, k); }); };
  Object.defineProperty(S, 'length', { configurable: true, get: function () { return this === L ? todas().filter(mia).length : dl.get.call(this); } });
})();
