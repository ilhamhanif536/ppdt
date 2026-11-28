# Koperasi Konsumen Darut Thalibin Telang Bangkalan

Website resmi subdomain **`koperasi.darutthalibin.web.id`** (Fase 2 — Profil, Katalog 5 KBLI + Keranjang WhatsApp, & Pendaftaran Anggota Online).

## Struktur Folder

```text
koperasi/
├── public/                      # Direktori publish langsung Cloudflare (static assets)
│   ├── index.html               # Beranda profil kelembagaan, visi-misi, 5 KBLI, simpanan, pengurus & pengawas
│   ├── katalog/index.html       # Katalog produk 5 KBLI + pencarian + keranjang pesanan WhatsApp
│   ├── keanggotaan/index.html   # Informasi simpanan & formulir pendaftaran anggota online (kirim WA / Email)
│   ├── data/
│   │   ├── config.json          # Pengaturan pusat (kontak WA/email, besaran simpanan)
│   │   └── produk.json          # Daftar produk katalog 5 KBLI (mudah diedit tanpa ubah HTML)
│   ├── assets/
│   │   ├── koperasi.css         # Stylesheet bersama halaman Fase 2
│   │   ├── koperasi.js          # Logika katalog, keranjang, & form anggota
│   │   └── logo-koperasi*.png   # Logo resmi terkompresi & favicon
│   └── _headers                 # Header keamanan & cache untuk Cloudflare
├── wrangler.jsonc               # Konfigurasi deploy Cloudflare Workers Static Assets
└── README.md                    # Panduan deploy & pengelolaan data
```

## Cara Mengubah Produk, Harga, atau Kontak (Tanpa Koding!)

1. **Edit Produk / Harga / Stok Katalog:**
   Buka file `koperasi/public/data/produk.json` di GitHub → klik ikon pensil (Edit) → ubah `nama`, `harga`, `status`, atau ubah `"contoh": true` menjadi `false` setelah produk resmi dijual → Commit ke branch `main`.
2. **Edit Nomor WA / Email / Besaran Simpanan:**
   Buka file `koperasi/public/data/config.json` di GitHub → ubah bagian `kontak` atau `simpanan` → Commit ke branch `main`.
3. Cloudflare otomatis mempublikasikan perubahan ke `https://koperasi.darutthalibin.web.id/` dalam ~30–60 detik.

## Konfigurasi Cloudflare

- **Root / Output Directory:** `koperasi/public` (atau `koperasi` dengan `wrangler.jsonc` yang menunjuk `./public`).
- **Build command:** *(kosongkan — situs statis murni tanpa build step)*
- **Custom domain:** `koperasi.darutthalibin.web.id`
