/**
 * Server contoh untuk mencoba SELURUH situs di komputer sendiri, tanpa Netlify.
 *
 *   node dev-server.js          → http://localhost:8080
 *
 *   /            halaman pintu masuk
 *   /app/        portal santri & administrasi (memakai data contoh? tidak — API tiruan)
 *   /dasbor/     dasbor pengasuh (memakai public/demo-data.json)
 *   GET  /api    dasbor pengasuh (tiruan)
 *   POST /api    seluruh sistem (tiruan — menjawab "belum tersambung")
 *
 * Yang ditiru hanya bentuk jawabannya. Untuk data sungguhan, jalankan lewat
 * Netlify dengan GAS_URL & GAS_KEY terisi.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const PUB = path.join(__dirname, 'public');
const demo = JSON.parse(fs.readFileSync(path.join(PUB, 'demo-data.json'), 'utf8'));
const demoPg = JSON.parse(fs.readFileSync(path.join(PUB, 'demo-pengurus.json'), 'utf8'));

const TIPE = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const NB = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

function bulanLain(b, geser) {
  const th = Number(b.slice(0, 4)), bl = Number(b.slice(5, 7));
  const d = new Date(th, bl - 1 + geser, 1);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
}

function dataDasbor(bulan) {
  const data = JSON.parse(JSON.stringify(demo));
  if (!bulan || bulan === data.periode.bulan) return data;

  const th = Number(bulan.slice(0, 4)), bl = Number(bulan.slice(5, 7));
  data.periode = {
    bulan: bulan,
    label: NB[bl - 1] + ' ' + th,
    awal: bulan + '-01',
    akhir: bulan + '-30',
    berjalan: false,
    sebelumnya: bulanLain(bulan, -1),
    berikutnya: bulanLain(bulan, 1)
  };
  data.kpi = { persen: 0, hadir: 0, total: 0, alpha: 0, izin: 0,
    santri: data.kpi.santri, putra: data.kpi.putra, putri: data.kpi.putri };
  data.perAktivitas = []; data.tren = []; data.alert = []; data.terendah = []; data.izin = [];
  data.catat = { persen: 0, beres: 0, wajib: 0 };
  return data;
}

function kirimJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');

  /* ------------------------------- API tiruan ------------------------------ */
  if (u.pathname === '/api') {
    if (req.method === 'GET') {
      const aksi = u.searchParams.get('action') || 'dashboard';
      if (aksi === 'tes') return kirimJson(res, 200, { ok: true, pesan: 'API tiruan hidup' });
      return kirimJson(res, 200, dataDasbor(u.searchParams.get('bulan')));
    }
    if (req.method === 'POST') {
      let badan = '';
      req.on('data', (c) => { badan += c; });
      req.on('end', () => {
        let permintaan = {};
        try { permintaan = JSON.parse(badan || '{}'); } catch (e) {}
        const aksi = permintaan.action;
        const args = permintaan.args || [];
        const p = args[0] || {};

        // jawaban tiruan supaya tampilan bisa dicoba tanpa Apps Script
        const tiruan = {
          loginUser: { success: true, accountType: 'ADMIN', nama: 'Ridho', username: 'ridho',
            aksesGender: 'Putra', role: 'KETUA_UMUM', sessionToken: 'sesi-demo' },
          ABWEB_saya: { success: true, message: 'Masuk sebagai Ridho',
            data: { nama: 'Ridho', role: 'KETUA_UMUM', aksesGender: 'Putra' } },
          ABWEB_hariIni: { success: true, message: '4 sesi diperiksa', data: demoPg.hari },
          ABWEB_keuangan: { success: true, message: 'contoh', data: demoPg.keuangan },
          ABWEB_catat: { success: true, message: 'Mode contoh: ' + ((p.nama || []).length) + ' nama akan dicatat.' },
          ABWEB_tutup: { success: true, message: 'Mode contoh: sesi akan ditutup (tidak ada data yang berubah).' },
          ABWEB_izin: { success: true, message: 'Mode contoh: izin akan dicatat.' },
          ABWEB_validasi: { success: true, message: 'Mode contoh: hari akan disahkan.' }
        };

        if (tiruan[aksi]) return kirimJson(res, 200, { ok: true, aksi: aksi, hasil: tiruan[aksi] });

        kirimJson(res, 200, {
          ok: true,
          aksi: aksi,
          hasil: { success: false,
            message: 'Mode contoh di laptop: ' + aksi +
              ' belum tersambung ke Apps Script. Isi GAS_URL & GAS_KEY lalu jalankan lewat Netlify.' }
        });
      });
      return;
    }
    return kirimJson(res, 405, { ok: false, error: 'metode_tidak_diizinkan' });
  }

  /* -------------------------------- berkas -------------------------------- */
  let file = u.pathname;
  if (file.endsWith('/')) file += 'index.html';
  const full = path.join(PUB, path.normalize(file).replace(/^(\.\.[\/\\])+/, ''));

  fs.readFile(full, (err, isi) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Tidak ada'); }
    res.writeHead(200, { 'Content-Type': TIPE[path.extname(full)] || 'application/octet-stream' });
    // halaman dasbor: isi token contoh otomatis supaya bisa langsung dilihat
    if (path.basename(full) === 'index.html' && file.indexOf('/dasbor') === 0) {
      isi = String(isi).replace('<head>',
        '<head><script>try{localStorage.setItem("ppdt_token","demotoken1234567890")}catch(e){}</script>');
    }
    res.end(isi);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Situs contoh jalan:');
  console.log('  http://localhost:' + PORT + '/            pintu masuk');
  console.log('  http://localhost:' + PORT + '/app/        portal & administrasi');
  console.log('  http://localhost:' + PORT + '/pengurus/   layar pengurus V2 (data contoh)');
  console.log('  http://localhost:' + PORT + '/dasbor/     dasbor pengasuh (data contoh)');
});
