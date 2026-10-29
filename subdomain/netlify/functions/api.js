/**
 * PPDT — jembatan tunggal antara situs pondok dan Apps Script.
 *
 *   GET  /api?action=dashboard&t=<token>&bulan=YYYY-MM   → dasbor pengasuh
 *   POST /api   body {action, args:[...]}                → seluruh sistem
 *                                                          (login, presensi,
 *                                                           izin, keuangan,
 *                                                           portal santri)
 *
 * Browser TIDAK pernah memanggil script.google.com:
 *   - tidak ada masalah CORS
 *   - alamat Apps Script tidak muncul di halaman
 *   - kunci API hanya ada di environment variable Netlify
 *
 * Environment variables (Netlify → Site settings → Environment variables):
 *   GAS_URL = https://script.google.com/macros/s/XXXX/exec
 *   GAS_KEY = hasil PGT_setKunciApi()
 */

const AKSI_GET = ['dashboard', 'tes'];
const POLA_TOKEN = /^[a-f0-9]{16,40}$/;
const POLA_BULAN = /^\d{4}-\d{2}$/;
const POLA_AKSI = /^[A-Za-z][A-Za-z0-9_]{2,48}$/;
const BATAS_BADAN = 6 * 1024 * 1024; // batas Netlify Functions (foto bukti sudah dikecilkan di browser)

// pengaman sederhana per instance fungsi
const jejak = new Map();
const BATAS_PER_MENIT = 60;

function terlaluSering(ip) {
  const sekarang = Date.now();
  const c = jejak.get(ip) || { n: 0, mulai: sekarang };
  if (sekarang - c.mulai > 60000) { c.n = 0; c.mulai = sekarang; }
  c.n += 1;
  jejak.set(ip, c);
  if (jejak.size > 500) jejak.clear();
  return c.n > BATAS_PER_MENIT;
}

function balas(status, obj, extra) {
  return {
    statusCode: status,
    headers: Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer'
    }, extra || {}),
    body: JSON.stringify(obj)
  };
}

function alamatGas() {
  const url = process.env.GAS_URL;
  const key = process.env.GAS_KEY;
  if (!url || !key) return null;
  return { url, key };
}

/** Memanggil Apps Script dan merapikan jawabannya. */
async function panggilGas(tujuan, metode, isiBadan, kunci) {
  const kendali = new AbortController();
  const batas = setTimeout(function () { kendali.abort(); }, 20000);

  const url = tujuan.url +
    (tujuan.url.indexOf('?') === -1 ? '?' : '&') +
    'key=' + encodeURIComponent(kunci) +
    '&asal=' + encodeURIComponent('situs');

  try {
    const opsi = {
      method: metode,
      redirect: 'follow',
      signal: kendali.signal,
      headers: { 'Accept': 'application/json' }
    };
    if (metode === 'POST') {
      opsi.headers['Content-Type'] = 'application/json';
      opsi.body = isiBadan;
    }

    const resp = await fetch(url, opsi);
    clearTimeout(batas);
    const teks = await resp.text();

    // Jangan pernah meneruskan halaman Google (login/izin) ke browser.
    if (teks.trim().slice(0, 1) === '<') {
      return {
        status: 502,
        isi: {
          ok: false,
          error: 'balasan_bukan_json',
          pesan: 'Apps Script mengembalikan halaman, bukan data. Pastikan deployment: Execute as = Me, Who has access = Anyone.'
        }
      };
    }

    let data;
    try { data = JSON.parse(teks); }
    catch (e) { return { status: 502, isi: { ok: false, error: 'json_rusak', pesan: teks.slice(0, 200) } }; }

    return { status: 200, isi: data };

  } catch (err) {
    clearTimeout(batas);
    const habis = err && err.name === 'AbortError';
    return {
      status: habis ? 504 : 502,
      isi: {
        ok: false,
        error: habis ? 'gas_terlalu_lama' : 'gas_gagal',
        pesan: habis ? 'Apps Script tidak menjawab dalam 20 detik.' : String((err && err.message) || err)
      }
    };
  }
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { Allow: 'GET, POST, OPTIONS' }, body: '' };
  }

  const ip = (event.headers['x-forwarded-for'] || 'lokal').split(',')[0].trim();
  if (terlaluSering(ip)) {
    return balas(429, { ok: false, error: 'terlalu_banyak_permintaan', pesan: 'Coba lagi sebentar lagi.' });
  }

  const tujuan = alamatGas();
  if (!tujuan) {
    return balas(500, {
      ok: false,
      error: 'belum_dikonfigurasi',
      pesan: 'GAS_URL / GAS_KEY belum diisi di Netlify (Site settings → Environment variables).'
    });
  }

  /* ------------------------------- GET -------------------------------- */
  if (event.httpMethod === 'GET') {
    const q = event.queryStringParameters || {};
    const aksi = String(q.action || 'dashboard');

    if (AKSI_GET.indexOf(aksi) === -1) {
      return balas(400, { ok: false, error: 'aksi_tidak_dikenal', pesan: aksi });
    }

    if (aksi === 'tes') {
      const r = await panggilGas(tujuan, 'GET', null, tujuan.key);
      return balas(r.status, r.isi);
    }

    const token = String(q.t || '');
    const bulan = String(q.bulan || '');
    if (!POLA_TOKEN.test(token)) {
      return balas(401, { ok: false, error: 'token_tidak_valid', pesan: 'Tautan tidak lengkap atau sudah rusak.' });
    }
    if (bulan && !POLA_BULAN.test(bulan)) {
      return balas(400, { ok: false, error: 'bulan_tidak_valid', pesan: 'Format bulan: 2026-11' });
    }

    const urlDashboard = tujuan.url +
      (tujuan.url.indexOf('?') === -1 ? '?' : '&') +
      'action=dashboard&key=' + encodeURIComponent(tujuan.key) +
      '&t=' + encodeURIComponent(token) + (bulan ? '&bulan=' + encodeURIComponent(bulan) : '');

    // Dasbor punya pintu sendiri di Apps Script (PGT_api), bukan doPost.
    const kendali = new AbortController();
    const batas = setTimeout(function () { kendali.abort(); }, 20000);
    try {
      const resp = await fetch(urlDashboard, { redirect: 'follow', signal: kendali.signal });
      clearTimeout(batas);
      const teks = await resp.text();
      if (teks.trim().slice(0, 1) === '<') {
        return balas(502, { ok: false, error: 'balasan_bukan_json', pesan: 'Apps Script mengembalikan halaman, bukan data.' });
      }
      let data;
      try { data = JSON.parse(teks); } catch (e) { return balas(502, { ok: false, error: 'json_rusak' }); }
      return balas(200, data, { 'Cache-Control': 'public, max-age=30, s-maxage=60' });
    } catch (err) {
      clearTimeout(batas);
      return balas(502, { ok: false, error: 'gas_gagal', pesan: String((err && err.message) || err) });
    }
  }

  /* ------------------------------- POST ------------------------------- */
  if (event.httpMethod === 'POST') {
    const isi = event.body || '';
    if (!isi) return balas(400, { ok: false, error: 'badan_kosong' });
    if (isi.length > BATAS_BADAN) return balas(413, { ok: false, error: 'badan_terlalu_besar' });

    let permintaan;
    try { permintaan = JSON.parse(isi); }
    catch (e) { return balas(400, { ok: false, error: 'json_rusak' }); }

    const aksi = String((permintaan && permintaan.action) || '');
    if (!POLA_AKSI.test(aksi)) {
      return balas(400, { ok: false, error: 'aksi_tidak_valid', pesan: aksi });
    }

    const isiBersih = JSON.stringify({
      action: aksi,
      args: Array.isArray(permintaan.args) ? permintaan.args : []
    });

    const r = await panggilGas(tujuan, 'POST', isiBersih, tujuan.key);
    return balas(r.status, r.isi);
  }

  return balas(405, { ok: false, error: 'metode_tidak_diizinkan' });
};
