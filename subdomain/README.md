# Sistem PPDT — situs untuk sistem.darutthalibin.web.id

Folder ini BUKAN Apps Script. Ini situs statis + satu fungsi serverless yang
menyajikan seluruh sistem di domain pondok, tanpa banner Apps Script.

```
public/index.html            pintu masuk (pilih portal / dasbor)
public/app/index.html        portal santri + administrasi (aplikasi lama)
public/app/gas-client.js     pengganti google.script.run → POST /api
public/dasbor/index.html     dasbor pengasuh (hanya baca)
netlify/functions/api.js     jembatan GET+POST ke Apps Script
netlify.toml                 publish/functions + header keamanan
dev-server.js                coba lokal: node dev-server.js
```

## Deploy

1. Netlify → Add new site → Import from Git → repo ini
   - Base directory : `subdomain`
   - Build command  : *(kosong)*
   - Publish        : `public`
2. Environment variables:
   - `GAS_URL` = `https://script.google.com/macros/s/XXXX/exec`
   - `GAS_KEY` = hasil `PGT_setKunciApi()`
3. Domain: `sistem.darutthalibin.web.id`
4. Cloudflare: CNAME `sistem` → `<site>.netlify.app`, **DNS only**

Langkah lengkap: `../panduan-subdomain.md`
Jembatan Apps Script: `../Api_Bridge.gs`

## Cara masuk (satu pintu)

Halaman depan `/` hanya punya **satu kolom**: nama lengkap atau username. Setelah
ditekan Masuk, server yang menentukan portalnya:

| Yang login | Mendarat di |
|---|---|
| Admin / pengurus | dasbor admin `/app/` (+ tombol mengapung **Absensi V2** → `/pengurus/`) |
| Santri | portal santri di `/app/` (layar santri) |
| Pengasuh / yayasan | dasbor hanya-baca `/dasbor/` (lewat tautan `?t=` atau kode di halaman depan) |

Tidak ada halaman pilih-portal. Tombol Absensi V2 membawa nama + token sesi, jadi
pengurus tidak perlu login dua kali.
