# Koperasi Konsumen Darut Thalibin Telang Bangkalan

Website resmi subdomain **`koperasi.darutthalibin.web.id`** (Fase 1 — Profil Kelembagaan & Ketentuan Keanggotaan).

## Struktur Folder

```text
koperasi/
├── public/
│   ├── index.html     # Halaman utama profil, visi-misi, 5 KBLI, simpanan, pengurus & pengawas
│   └── _headers       # Header keamanan & cache untuk Cloudflare
├── wrangler.jsonc     # Konfigurasi deploy Cloudflare Workers Static Assets
└── README.md          # Panduan deploy subdomain
```

## Cara Deploy ke `koperasi.darutthalibin.web.id` (Cloudflare)

1. Buka **Cloudflare Dashboard → Workers & Pages → Create → Import a repository**.
2. Pilih repositori **`ilhamhanif536/ppdt`**.
3. Atur konfigurasi build:
   - **Project name:** `koperasi-darutthalibin`
   - **Production branch:** `main`
   - **Build command:** *(kosongkan saja — situs statis murni)*
   - **Deploy command:** `npx wrangler deploy`
   - **Root directory:** `koperasi`
4. Klik **Deploy**.
5. Setelah live, buka tab **Settings → Domains & Routes → Add Custom Domain**, lalu masukkan:
   - **`koperasi.darutthalibin.web.id`**
   Cloudflare akan otomatis menambahkan DNS & SSL HTTPS.
