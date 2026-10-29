/**
 * PPDT — pengganti google.script.run untuk situs di domain pondok.
 *
 * Aplikasi lama (index_real.html) memanggil server lewat
 *   google.script.run.withSuccessHandler(f).namaFungsi(a, b)
 *
 * Berkas ini menyediakan bentuk yang sama persis, tapi isinya:
 *   POST /api  {action:'namaFungsi', args:[a, b]}
 * sehingga aplikasi lama tetap jalan tanpa diubah satu baris pun.
 *
 * Kalau dibuka dari Apps Script asli (google.script.run sudah ada),
 * berkas ini tidak melakukan apa-apa.
 */
(function () {
  'use strict';

  if (window.google && window.google.script && window.google.script.run) return;

  var API = '/api';
  var BATAS_MS = 30000;

  function panggil(nama, args, st) {
    var kendali = new AbortController();
    var batas = setTimeout(function () { kendali.abort(); }, BATAS_MS);

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: nama,
        args: Array.prototype.slice.call(args)
      }),
      signal: kendali.signal
    })
      .then(function (r) {
        return r.text().then(function (t) {
          var d;
          try { d = JSON.parse(t); }
          catch (e) {
            throw new Error('Jawaban server bukan data (HTTP ' + r.status + ').');
          }
          return d;
        });
      })
      .then(function (d) {
        clearTimeout(batas);
        if (d && d.ok) {
          if (st.sukses) st.sukses(d.hasil);
          return;
        }
        var e = new Error((d && (d.pesan || d.error)) || 'Gagal memanggil server');
        e.detail = d;
        if (st.gagal) st.gagal(e);
        else if (window.console) console.error('[PPDT]', nama, e);
      })
      .catch(function (err) {
        clearTimeout(batas);
        var pesan = (err && err.name === 'AbortError')
          ? new Error('Server tidak menjawab dalam 30 detik. Coba lagi.')
          : err;
        if (st.gagal) st.gagal(pesan);
        else if (window.console) console.error('[PPDT]', nama, pesan);
      });
  }

  function runner(st) {
    // Proxy: setiap nama fungsi yang dipanggil otomatis jadi permintaan
    return new Proxy({}, {
      get: function (_, prop) {
        if (prop === 'withSuccessHandler') {
          return function (cb) { return runner(Object.assign({}, st, { sukses: cb })); };
        }
        if (prop === 'withFailureHandler') {
          return function (cb) { return runner(Object.assign({}, st, { gagal: cb })); };
        }
        if (prop === 'withUserObject') {
          return function (uo) { return runner(Object.assign({}, st, { userObject: uo })); };
        }
        if (prop === 'then') return undefined; // jangan dianggap Promise
        return function () { panggil(String(prop), arguments, st); };
      }
    });
  }

  window.google = window.google || {};
  window.google.script = {
    run: runner({}),
    host: {
      close: function () { /* tidak dipakai di luar Apps Script */ }
    },
    url: {
      getLocation: function (cb) {
        var q = new URLSearchParams(location.search);
        var o = { parameter: {} };
        q.forEach(function (v, k) { o.parameter[k] = v; });
        if (cb) cb(o);
        return o;
      }
    }
  };
})();
