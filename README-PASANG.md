# Redesign Website PPDT — Paket Pemasangan (LENGKAP)

Hasil redesign **seluruh halaman** website Pondok Pesantren Darut Thalibin Telang
dengan gaya **"Hijau Modern"** — identitas warna asli dipertahankan:
hijau `#2E9E6B`, hijau tua `#0E3D2E`, emas `#C9A75B`, font Plus Jakarta Sans.

> Paket ini adalah **salinan lengkap repository** (26 file): semua file yang
> berubah **dan** file pendukung yang tetap (head.html, package.json,
> netlify.toml, logo, favicon, og-image). Tinggal salin semuanya ke repo,
> commit, push — selesai.

## Ringkasan Perubahan

| Bagian | Perubahan |
|---|---|
| `src/assets/site.css` | **Ditulis ulang total** — design system baru: hero berfoto, bar statistik, header sticky + dropdown, kartu, timeline, jadwal, footer gelap, responsif & animasi reveal |
| `src/assets/site.js` | Ditulis ulang — sticky header, menu mobile, dropdown klik/sentuh, animasi reveal saat scroll, tahun footer |
| `src/_includes/header.html` | Header baru dengan tombol menu + ikon burger/close |
| `src/_includes/footer.html` | Footer gelap 4 kolom (brand + legal + sosmed, Jelajahi, Informasi, Alamat) |
| `src/index.html` | Beranda baru: hero berfoto + kartu mengambang, bar statistik, tentang pondok, 2 jalur + 3 program pendidikan, kajian rutin, kabar terbaru, CTA |
| `src/*/index.html` (8 halaman) | Restyle menyeluruh (page-hero hijau tua, breadcrumb, kartu, timeline) — konten data asli dipertahankan |
| `scripts/build.mjs` | Navigasi mendukung **dropdown** (menu dengan `children`); renderer marquee **dihapus**; **fix: URL canonical & sitemap dobel-slash** (`web.id//` → `web.id/`) |
| `src/_data/site-data.mjs` | Menu "Tentang" berisi anak: Profil, Organisasi, Prestasi; data pengumuman (marquee) dihapus sesuai permintaan |
| `public/images/hero-pondok.jpg` | **Baru** — foto hero beranda (ilustrasi, ganti dengan foto asli pondok bila ada) |
| `public/images/gedung-pondok.jpg` | **Baru** — foto gedung di section Tentang (ilustrasi, ganti dengan foto asli) |

Catatan penting:
- **Teks berjalan (marquee) beserta ikon megafon sudah dihapus total** sesuai permintaan.
- Angka bar statistik hanya memakai data faktual (tahun SK, 2 jalur, 3 program, kajian harian) — tidak ada angka yang dikarang.
- Kedua foto baru adalah **gambar ilustrasi**; sangat disarankan menggantinya dengan foto asli pondok (nama file sama, otomatis terpasang).
- Sudah diverifikasi: build lokal sukses (10 halaman), dropdown & menu mobile diuji via browser, tidak ada marquee.

## Cara Memasang — Opsi A: Lewat GitHub (utama, auto-deploy Netlify)

1. Salin **seluruh isi** folder ini ke repository kamu (root repo),
   timpa file lama dengan path yang sama.
2. Commit dan push ke GitHub:
   ```bash
   git add .
   git commit -m "Redesign tampilan: Hijau Modern, seluruh halaman"
   git push
   ```
3. Netlify otomatis membangun ulang (`npm run build` → folder `dist/`).

## Cara Memasang — Opsi B: Tanpa Git (drag & drop)

Gunakan file **`ppdt-website-siap-upload.zip`** (terpisah):
1. Ekstrak → dapat folder website statis yang sudah jadi.
2. Buka https://app.netlify.com/drop
3. Seret folder hasil ekstrak ke halaman tersebut — website langsung online.

> Opsi B menimpa situs tanpa riwayat git; untuk jangka panjang tetap
> gunakan Opsi A agar mudah update berikutnya.

## Uji Lokal

```bash
npm run build        # hasil masuk folder dist/
npx serve dist       # atau buka dist/index.html via server lokal
```

## Mengubah Konten ke Depan

Semua data dinamis tetap terpusat di **`src/_data/site-data.mjs`**:
- Kontak (WhatsApp, telepon, email) — bagian terkait otomatis muncul saat diisi.
- Jadwal kajian → otomatis tampil di beranda & halaman Kegiatan.
- Struktur organisasi → otomatis tampil di halaman Organisasi.
- Menu navigasi → ubah `menuUtama`; item dengan `children` otomatis jadi dropdown.

## Checklist Setelah Deploy

- [ ] Beranda desktop: dropdown "Tentang" muncul saat di-hover.
- [ ] HP: menu hamburger membuka, grup "Tentang" bisa dibuka.
- [ ] Ganti `public/images/hero-pondok.jpg` & `gedung-pondok.jpg` dengan foto asli.
- [ ] Isi nomor WhatsApp di `site-data.mjs` agar tombol WA mengambang aktif.
- [ ] Netlify: pastikan environment variable `SITE_URL` terisi (mis. `https://darutthalibin.web.id`).
