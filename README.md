# Darut Thalibin Telang — Website Resmi

Website informatif statis untuk Darut Thalibin Telang, disiapkan agar mudah diunggah ke GitHub dan dibuka melalui GitHub Codespaces, lalu dideploy ke Netlify.

## Identitas lembaga
- Nama: **Darut Thalibin Telang**
- Identitas formal: **SK KEMENKUMHAM RI No. AHU-0015579.AH.04.Tahun 2018**
- NSP: **510235260222**

Nomor di atas mengikuti informasi yang diberikan pengelola. Cocokkan kembali ejaan dan formatnya dengan dokumen resmi sebelum publikasi final.

## Struktur proyek
```text
.
├── public/
│   └── favicon.svg
├── scripts/
│   └── build.mjs
├── src/
│   ├── assets/
│   │   ├── site.css
│   │   └── site.js
│   ├── berita/index.html
│   ├── kegiatan/index.html
│   ├── kontak/index.html
│   ├── koperasi/index.html
│   ├── pendidikan/index.html
│   ├── prestasi/index.html
│   ├── profil/index.html
│   └── index.html
├── netlify.toml
├── package.json
└── README.md
```

## Membuka di GitHub Codespaces
1. Buat repository GitHub baru.
2. Unggah isi ZIP ini ke repository (bukan folder ZIP-nya).
3. Buka repository lalu pilih **Code → Codespaces → Create codespace on main**.
4. Di terminal Codespaces, jalankan:
   ```bash
   npm run build
   ```
5. Folder hasil build bernama `dist/`. Untuk preview, jalankan server statis, misalnya:
   ```bash
   npx --yes serve dist
   ```
   Jika diminta, buka port yang ditampilkan di panel **Ports**.

Proyek ini menggunakan Node.js 18+ dan tidak memerlukan dependency npm tambahan untuk build.

## Deploy ke Netlify
1. Push repository ke GitHub.
2. Di Netlify pilih **Add new site → Import an existing project**, lalu hubungkan repository.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Tambahkan custom domain melalui pengaturan domain Netlify dan ikuti instruksi DNS yang tampil untuk domain Anda.
6. Pilih satu versi domain kanonis, misalnya `https://domain-anda.id` atau `https://www.domain-anda.id`.
7. Atur environment variable Netlify:
   - Key: `SITE_URL`
   - Value: domain kanonis, contoh `https://domain-anda.id`
8. Deploy ulang dan periksa:
   - `/sitemap.xml`
   - `/robots.txt`
   - canonical URL di source HTML halaman.

Jangan kirim sitemap ke Google sebelum domain kanonis benar dan situs dapat diakses melalui HTTPS.

## SEO dan Google Search Console
- Setiap halaman memiliki title, meta description, canonical URL, dan metadata Open Graph.
- Sitemap dan robots.txt dibuat saat build berdasarkan `SITE_URL`.
- Setelah domain aktif, verifikasi kepemilikan di Google Search Console, kirim sitemap, lalu gunakan URL Inspection untuk meminta pengindeksan halaman utama dan halaman prioritas.
- Pengindeksan dan peringkat Google tidak dapat dijamin.

## Konten yang masih perlu diverifikasi
Website ini sengaja tidak mengarang:
- sejarah resmi, tahun berdiri, dan pendiri;
- rumusan visi-misi;
- nama pengasuh dan struktur pengurus;
- jadwal serta rincian program pendidikan;
- data prestasi dan berita aktual;
- nomor telepon, WhatsApp, email, dan tautan media sosial;
- foto asli bangunan, pengasuh, santri, dan kegiatan.

Ganti ilustrasi dan logo sementara dengan logo resmi serta foto yang diizinkan untuk dipublikasikan. Pastikan setiap nama, foto, dan informasi santri mendapat persetujuan yang sesuai.

## Fondasi pengembangan selanjutnya
- Website publik tetap statis agar cepat, sederhana, dan mudah dirawat.
- Halaman `/koperasi/` adalah fondasi informasi koperasi; katalog produk dapat ditambahkan setelah data produk dan status layanan dikonfirmasi.
- Integrasi Google Apps Script (GAS) harus menggunakan endpoint publik yang hanya mengembalikan data yang boleh dilihat umum. Jangan menaruh token, kredensial, data pribadi, atau akses administrasi dalam JavaScript publik.
- Sistem administrasi internal sebaiknya dipisahkan dari website informasi publik dan menerapkan autentikasi/otorisasi sesuai peran.

## Identitas visual
Warna utama: `#388e6e`. Logo buku dan bintang saat ini adalah placeholder, bukan logo resmi lembaga.


## Pembaruan konten
- Logo resmi berada di `public/images/logo-pondok.png`. Ganti file ini jika ada versi logo resmi dengan kualitas lebih tinggi, menggunakan nama file yang sama.
- Visi dan misi tersedia pada `src/profil/index.html`.
- Struktur organisasi tersedia pada `src/organisasi/index.html`. Nama pengasuh dan jajaran yayasan sengaja belum diisi.
- Jadwal kajian pada `src/kegiatan/index.html` ditranskripsikan dari materi sosialisasi yang diberikan dan perlu dikonfirmasi sebelum publikasi.
