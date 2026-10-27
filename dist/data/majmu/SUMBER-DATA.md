# Sumber Data Majmu'

Folder ini berisi data teks yang dibundel langsung bersama website agar halaman
Majmu' tetap cepat dan dapat dibuka tanpa koneksi internet (setelah kunjungan pertama).

## Berkas

| Berkas | Isi | Cara pemeliharaan | Sumber & lisensi |
|---|---|---|---|
| `tahlil.json` | Susunan bacaan tahlil & doa arwah (44 bacaan, Arab + terjemah) | **Manual** — edit langsung | [hirumisann/Data-Islamic-Json](https://github.com/hirumisann/Data-Islamic-Json) (MIT), bersumber [islam.nu.or.id](https://islam.nu.or.id/post/read/107344/susunan-bacaan-tahlil-doa-arwah-lengkap-dan-terjemahannya) berdasarkan Majmu' Syarif |
| `dzikir-shalat.json` | 13 dzikir & doa seputar shalat (2 grup) | **Otomatis** — diperbarui `npm run data:majmu`; sunting daftar ID di `scripts/fetch-majmu-data.mjs` untuk mengubah isi | [EQuran.id Doa API](https://equran.id/apidev), data Kementerian Agama RI |
| `dhuha.json` | Niat, tata cara, dan **beberapa versi** doa setelah shalat Dhuha | **Manual** — tidak ditimpa skrip; tambah versi cukup dengan menambah entri di `doaList` | Versi ringkas: EQuran.id (id 227). Versi panjang: [Wikibuku](https://id.wikibooks.org/wiki/Doa_Shalat_Dhuha_Lengkap) (CC BY-SA 3.0), ditandai `draft_tashih` |
| `ratib-haddad.json` | Ratib al-Haddad: 43 bacaan dalam 2 bagian (35 rangkaian wirid + 8 doa), Arab/Latin/terjemah, 20 bacaan ditandai dibaca 3× | **Otomatis** — diperbarui `npm run data:ratib` (skrip `scripts/fetch-ratib-haddad.mjs` membaca HTML Quran NU Online). Suntingan manual akan tertimpa; perbaiki naskah di sumber atau buat berkas manual terpisah bila perlu | [Quran NU Online — Ratib al-Haddad](https://quran.nu.or.id/wirid/ratib/ratib-al-haddad), naskah acuan *Majmû'ah Anwâriyyah* PP. al-Anwar Sarang; penyalin Ahmad Mundzir, transliterasi Muhammad Aiz Luthfi, editor Mahbib Khoiron. **Seluruh berkas berstatus `draft_tashih`** |

## Status verifikasi (`status` pada entri doa)

- `terverifikasi` — teks dari sumber data resmi/terverifikasi, siap dipublikasikan.
- `draft_tashih` — transkripsi sumber terbuka yang **wajib ditashih pengurus pondok**
  dibandingkan naskah acuan sebelum disebarluaskan. Di halaman baca, entri ini
  diberi lencana emas "Perlu tashih pengurus". Ubah menjadi `terverifikasi`
  setelah pemeriksaan selesai.

## Pembaruan data

```bash
npm run data:majmu     # menulis ulang dzikir-shalat.json (EQuran.id Doa API)
npm run data:ratib     # menulis ulang ratib-haddad.json (scrape HTML Quran NU Online)
```

Catatan untuk `data:ratib`: situs Quran NU Online tidak menyediakan API publik,
sehingga skrip mem-parse HTML halaman secara terstruktur. Skrip berhenti dengan
pesan galat bila jumlah blok tidak lagi 43 atau ada blok yang tidak lengkap —
itu pertanda struktur situs berubah dan pola parser di
`scripts/fetch-ratib-haddad.mjs` perlu disesuaikan.

Teks Quran pada halaman surah diambil langsung dari
[EQuran.id API v2](https://equran.id/apidev/v2) saat halaman dibuka, lalu
disimpan di perangkat pengunjung (localStorage) — field audio dibuang agar
salinan tetap ringan.

## Catatan verifikasi

- **Ratib al-Haddad** sudah tersedia hasil penarikan otomatis dari Quran NU
  Online, namun seluruh entrinya masih `draft_tashih`. Pengurus pondok wajib
  membandingkan huruf, harakat, dan jumlah pengulangan dengan naskah acuan
  sebelum mengubah `status` tingkat berkas menjadi `terverifikasi`.
- **Maulid ad-Diba'** belum menyertakan data teks; akan disusun per rawi
  beserta mahalul qiyam melalui alur tashih yang sama.
