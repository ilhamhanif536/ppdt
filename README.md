# Darut Thalibin Telang — Website Resmi (v2)

Website informatif statis untuk Pondok Pesantren Darut Thalibin Telang. Dibangun tanpa framework, tanpa dependensi npm — cepat, aman, dan mudah dirawat. Deploy ke Netlify.

## Yang baru di versi 2

- **Desain segar modern** — putih dominan dengan aksen hijau, font Plus Jakarta Sans, komponen dirapikan menyeluruh.
- **Pratinjau berbagi tautan** — `og-image.png` 1200×630 sehingga tampil rapi saat dibagikan ke WhatsApp/Facebook/X.
- **Structured data (JSON-LD)** — `EducationalOrganization` + `WebSite` untuk mesin pencari.
- **Halaman 404 kustom** dengan tombol kembali ke beranda.
- **Menu navigasi dirampingkan** dari 9 menjadi 6 (Beranda, Profil, Pendidikan, Kegiatan, Berita, Kontak). Halaman Prestasi, Koperasi, dan Organisasi tetap tersedia melalui kartu beranda, tautan silang, dan footer.
- **Cache busting otomatis** — CSS/JS diberi nama ber-hash (`site.a1b2c3d4.css`); perubahan tampilan selalu langsung terlihat tanpa masalah cache lama.
- **Peta lokasi** di halaman Kontak (embed Google Maps tanpa API key).
- **Tombol WhatsApp mengambang** — muncul otomatis begitu nomor WA diisi pada data pusat.
- **Slot Google Analytics 4** — aktif begitu ID pengukuran diisi.
- **Data pusat satu file** — kontak, organisasi, jadwal, pengumuman, media sosial diatur dari satu tempat.
- **Logo dibersihkan** dari artefak garis tepi & pojok hitam.

## Identitas lembaga

- Nama: **Darut Thalibin Telang**
- SK KEMENKUMHAM RI: **AHU-0015579.AH.04.Tahun 2018**
- NSP: **510235260222**

## Struktur proyek

```text
.
├── public/
│   ├── favicon.svg
│   ├── data/majmu/        # data teks Majmu' (tahlil, dzikir, dhuha, ratib) + SUMBER-DATA.md
│   └── images/            # logo, og-image, ikon (boleh diganti kapan saja)
├── scripts/
│   ├── build.mjs          # merakit halaman dari partials + data
│   ├── fetch-majmu-data.mjs # pembaru data doa/dzikir dari EQuran.id → public/data/majmu
│   ├── fetch-ratib-haddad.mjs # penarik & parser Ratib al-Haddad (Quran NU Online)
│   ├── verify.mjs         # verifikasi statis build & data (35 cek)
│   └── uji-render.mjs     # uji renderer pembaca tanpa browser (DOM-stub)
├── src/
│   ├── _data/
│   │   └── site-data.mjs  # ⭐ DATA PUSAT — edit file ini
│   ├── _includes/
│   │   ├── head.html      # <head> bersama (SEO, OG, GA4)
│   │   ├── header.html    # header + navigasi bersama
│   │   └── footer.html    # footer bersama + tombol WA
│   ├── assets/
│   │   ├── site.css       # seluruh gaya visual
│   │   ├── site.js        # menu mobile, tahun otomatis
│   │   ├── majmu.css      # gaya khusus bagian Majmu'
│   │   └── majmu.js       # pembaca Majmu' (fetch, cache, render teks)
│   ├── majmu/             # ⭐ Majmu' Digital (/majmu/ dan /majmu/baca/)
│   ├── 404/index.html     # halaman 404
│   ├── profil/index.html  # konten per halaman (tanpa <html> wrapper)
│   └── ...                # pendidikan, kegiatan, prestasi, berita,
│                          # koperasi, organisasi, kontak, index.html
├── netlify.toml           # build + header keamanan & cache
└── package.json
```

### Cara kerja build

1. Setiap halaman di `src/` berisi **komentar meta JSON** (title, description) lalu konten `<main>` saja.
2. `build.mjs` merakitnya dengan partial `head`, `header`, dan `footer`.
3. Token `{{ORGANISASI}}`, `{{JADWAL}}`, `{{KONTAK_ITEMS}}`, `{{MAP}}`, `{{PENGUMUMAN}}` diisi otomatis dari `site-data.mjs` — bagian yang datanya kosong **otomatis disembunyikan**.
4. CSS/JS diberi fingerprint hash (termasuk `majmu.css`/`majmu.js`), `sitemap.xml` dan `robots.txt` dibuat dari `SITE_URL`.

## Bagian Majmu' Digital (`/majmu/`)

Kumpulan bacaan kegiatan pondok: **QS Al-Kahfi, Yasin, Ar-Rahman, Al-Waqiah, Al-Mulk** (teks Arab, Latin, dan terjemah — tanpa audio agar tetap ringan), **tahlil & doa arwah**, **dzikir dan doa seputar shalat**, **panduan shalat Dhuha**, dan **Ratib al-Haddad** (status `draft_tashih`, menunggu tashih pengurus). Maulid Ad-Diba' menyusul setelah transkripsi dan tashih pengurus.

- **Teks surah:** diambil langsung dari [EQuran.id API v2](https://equran.id/apidev/v2) (gratis, tanpa API key, sumber Kemenag RI) saat halaman dibuka. Field audio pada respons dibuang sebelum disimpan di `localStorage` perangkat — kunjungan berikutnya tetap terbuka tanpa koneksi dengan jejak penyimpanan yang kecil. Tombol **Segarkan** mengambil versi terbaru.
- **Tahlil:** dataset JSON berlisensi MIT dari [hirumisann/Data-Islamic-Json](https://github.com/hirumisann/Data-Islamic-Json), dibundel di `public/data/majmu/tahlil.json`.
- **Dzikir:** dibuat otomatis dari EQuran.id Doa API melalui `npm run data:majmu` (hanya menulis ulang `dzikir-shalat.json`).
- **Dhuha:** `dhuha.json` dikurasi manual dan mendukung **beberapa versi doa** sekaligus (`doaList`), masing-masing dengan status `terverifikasi` atau `draft_tashih` untuk alur tashih pengurus. Skrip otomatis tidak menimpa file ini.
- **Ratib al-Haddad:** ditarik otomatis dari [Quran NU Online](https://quran.nu.or.id/wirid/ratib/ratib-al-haddad) melalui `npm run data:ratib` (parser HTML, situs sumber tanpa API publik) menjadi `ratib-haddad.json`: 43 bacaan dalam 2 bagian, 20 di antaranya ditandai dibaca 3×, lengkap Arab/Latin/terjemah dan atribusi naskah acuan. Status berkas `draft_tashih` sampai pengurus menashihnya.
- **Cara mengubah isi/struktur bacaan** dirinci di `docs/PANDUAN-EDIT-KONTEN.md` (menambah versi doa, menyusun ulang tahlil, mengganti surah, dan sebagainya — semuanya cukup lewat edit data).
- Preferensi tampilan (Latin, terjemah, ukuran teks Arab) dan penanda bacaan tersimpan di perangkat pengguna.
- Aset `majmu.css`/`majmu.js` juga di-fingerprint oleh `build.mjs`, jadi perubahan selalu ter-live tanpa masalah cache.
- **Akses lewat menu navigasi utama**, setara halaman Pendidikan/Kegiatan: item `Majmu'` ditambahkan di `menuUtama` (`site-data.mjs`), sehingga otomatis muncul di nav desktop dan menu garis tiga pada HP. Beranda sengaja tidak diubah; penanda menu tetap menyala saat pengunjung berada di halaman turunan `/majmu/baca/`.

## Mengisi data resmi (penting)

Buka **`src/_data/site-data.mjs`** dan isi:

| Kunci | Fungsi |
|---|---|
| `kontak.whatsapp` | Tombol WA mengambang + item kontak WA |
| `kontak.telepon` | Item kontak telepon |
| `kontak.email` | Item kontak email |
| `kontak.petaQuery` | Titik peta Google Maps di halaman Kontak |
| `sosial.instagram` dst. | Tautan media sosial di footer |
| `ga4Id` | Google Analytics 4 (contoh `G-XXXXXXXXXX`) |
| `organisasi[].anggota[].nama` | Nama pengurus di halaman Organisasi |
| `jadwalKajian` | Kartu jadwal di halaman Kegiatan |
| `pengumuman` | Strip pengumuman di beranda |

Setelah mengedit, jalankan `npm run build` (lokal/Codespaces) atau cukup push — Netlify membangun ulang otomatis.

## Menjalankan secara lokal / Codespaces

```bash
npm run build            # hasil di dist/
node scripts/verify.mjs  # 35 cek statis: struktur, data, rute, aturan tanpa audio
node scripts/uji-render.mjs # uji output renderer memakai bundle asli (tanpa browser)
npx --yes serve dist     # preview di port yang tampil
```

Node.js 18+. Tanpa dependensi npm tambahan.

## Deploy ke Netlify

1. Push repository ke GitHub.
2. Netlify → **Add new site → Import an existing project** → hubungkan repository.
3. Build command `npm run build`, publish directory `dist` (sudah terbaca dari `netlify.toml`).
4. **Wajib**: atur environment variable `SITE_URL` = domain kanonis, contoh `https://darutthalibin.web.id`.
5. Deploy, lalu periksa `/sitemap.xml`, `/robots.txt`, dan canonical pada source HTML.

## SEO & Google Search Console

- Setiap halaman memiliki title, meta description, canonical, Open Graph + Twitter Card, dan JSON-LD.
- Verifikasi kepemilikan di Search Console setelah domain aktif, kirim sitemap, lalu gunakan URL Inspection untuk pengindeksan awal.
- `og-image.png` (1200×630) dapat diganti kapan saja dengan nama file yang sama.

## Catatan konten

- Nama pengurus putra/putri mengikuti data yang diberikan pengelola; struktur yayasan dan pengasuh akan tampil otomatis setelah nama diisi di `site-data.mjs`.
- Ganti `public/images/logo-pondok.png` dengan versi resolusi lebih tinggi bila tersedia (nama file sama).
- Pastikan setiap nama, foto, dan data santri memiliki izin publikasi yang sesuai.
- Pengindeksan dan peringkat Google tidak dapat dijamin.

## Identitas visual

- Hijau utama `#2E9E6B`, hijau pekat `#0E3D2E`, emas `#C9A75B`.
- Font: Plus Jakarta Sans (Google Fonts).
- Ikon: SVG inline agar tetap tanpa dependensi.
