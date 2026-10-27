# Panduan Mengubah Isi & Struktur Bacaan Majmu'

Panduan untuk pengurus/editor: cara menambah, mengganti, menyusun ulang, atau menghapus
bacaan **tanpa menyentuh kode program**, cukup dengan menyunting berkas JSON.
Setelah menyimpan, jalankan `npm run build` lalu commit & push seperti biasa.

---

## 1. Peta: di mana setiap konten tinggal

| Konten | Lokasi | Cara ubah | Perlu kode? |
|---|---|---|---|
| 5 surah (Al-Kahfi, Yasin, Ar-Rahman, Al-Waqiah, Al-Mulk) | Diambil live dari EQuran.id | Ganti kartu di `src/majmu/index.html` (pembaca bisa membuka surah nomor berapa pun, 1–114) | Tidak |
| Tahlil & doa arwah | `public/data/majmu/tahlil.json` | Edit JSON langsung | Tidak |
| Dzikir & doa seputar shalat | `public/data/majmu/dzikir-shalat.json` | Ubah daftar ID di `scripts/fetch-majmu-data.mjs`, lalu `npm run data:majmu` | Sedikit (satu baris ID) |
| Shalat Dhuha (niat, tata cara, doa) | `public/data/majmu/dhuha.json` | Edit JSON langsung — mendukung banyak versi doa | Tidak |
| Ratib al-Haddad (43 bacaan, 2 bagian) | `public/data/majmu/ratib-haddad.json` | Tarik ulang dengan `npm run data:ratib`, atau edit JSON langsung untuk tashih | Tidak (untuk tashih) |
| Urutan & judul kartu di daftar isi | `src/majmu/index.html` | Edit HTML | Tidak |

**Aturan emas:** berkas yang dibuat ulang otomatis adalah `dzikir-shalat.json`
(`npm run data:majmu`) dan `ratib-haddad.json` (`npm run data:ratib`). Berkas
`tahlil.json` dan `dhuha.json` dikurasi manual dan tidak akan ditimpa skrip.
Bila pengurus menyunting `ratib-haddad.json` untuk tashih, jalankan
`npm run data:ratib` akan menimpanya — karena itu selesaikan tashih dengan
mengubah `status` menjadi `terverifikasi` dan jangan tarik ulang tanpa alasan.

---

## 2. Aturan main JSON (agar build tidak gagal)

1. Teks Arab diletakkan di antara tanda kutip dua: `"arab": "نص عربي"`.
2. Setiap pasangan `kunci: nilai` dipisah koma, **kecuali entri terakhir** dalam satu objek.
3. Jangan menghapus tanda kurung kurawal `{ }` dan kurung siku `[ ]`.
4. Tanda kutip di dalam teks ditulis `\"` atau cukup hindari.
5. Sebelum build, cek valid atau tidaknya:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('public/data/majmu/dhuha.json'))" && echo "JSON valid"
   ```
6. Satu entri rusak membuat halaman terkait gagal dimuat — uji di browser setelah build.

---

## 3. Contoh kasus: mengganti/menambah versi doa setelah shalat Dhuha

`dhuha.json` memiliki array `doaList`. Setiap entri adalah satu versi doa.
**Urutan tampil di website = urutan entri di array ini.**

### 3.1 Menambah versi baru

Salin templat ini ke dalam `doaList` (perhatikan tanda koma antar entri):

```json
{
  "id": "dhuha-3",
  "nama": "Doa Setelah Shalat Dhuha — versi dari kitab/acuan pondok",
  "arab": "TULIS TEKS ARAB DI SINI",
  "latin": "Tulisan latin di sini",
  "terjemah": "Terjemah bahasa Indonesia di sini",
  "tentang": "Keterangan singkat: riwayat, sumber kitab, atau catatan amalan pondok.",
  "sumber": "Nama kitab/cetakan acuan atau URL sumber",
  "lisensi": "Mis. internal pondok / CC BY-SA / atribusi tertentu",
  "status": "draft_tashih"
}
```

Wajib:
- `id` unik di file itu (pola bebas, mis. `dhuha-3`).
- `status` diisi salah satu:
  - `"draft_tashih"` → muncul lencana emas **"Perlu tashih pengurus"**.
  - `"terverifikasi"` → muncul lencana hijau **"Terverifikasi"**.

### 3.2 Mengganti versi yang ada

Timpa isi field `arab`, `latin`, `terjemah` pada entri yang dimaksud.
Bila teks baru sudah diperiksa pengurus, naikkan statusnya menjadi `"terverifikasi"`.

### 3.3 Menyusun urutan / menghapus

- Pindahkan seluruh blok `{ ... }` untuk mengubah urutan.
- Hapus seluruh blok entri (beserta koma pengiringnya) untuk menghilangkan versi.
- Minimal sisakan satu entri agar halaman tidak kosong.

### 3.4 Mengubah niat & tata cara

- Field `niat` adalah satu objek: ubah `arab`/`latin`/`terjemah`/`catatan`.
- Field `tataCara` adalah array kalimat: tambah `"kalimat baru",` atau hapus barisnya.

---

## 4. Mengubah susunan Tahlil (`tahlil.json`)

Struktur ringkas:

```json
{
  "source": "https://islam.nu.or.id/...",
  "based_on": "Majmu' Syarif",
  "result": [
    {
      "id": 1,
      "title": "Pengantar Al-Fatihah",
      "arabic": "نص عربي...",
      "translation": "Terjemah..."
    }
  ]
}
```

- **Menambah bacaan:** tambah objek baru di array `result` dengan `id` lanjutan yang belum dipakai.
- **Menyisipkan di tengah:** letakkan objek di posisi yang diinginkan; nomor `id` tidak harus urut,
  namun sebaiknya rapikan penomoran setelahnya agar mudah dirujuk.
- **Menghapus:** hapus blok objeknya.
- **Mengubah teks:** cukup ubah `arabic` atau `translation`.
- Field `source` dan `based_on` sebaiknya dipertahankan sebagai atribusi lisensi MIT.

---

## 5. Mengubah koleksi dzikir & doa shalat

Berkas `dzikir-shalat.json` dibuat ulang oleh skrip, jadi **jangan mengedit berkas hasilnya langsung**
(perubahan akan hilang saat skrip dijalankan). Alih yang benar:

1. Buka `scripts/fetch-majmu-data.mjs`.
2. Ubah daftar ID pada dua baris ini (ID dilihat dari dokumentasi EQuran.id Doa API, total 227 doa):
   ```js
   const ID_DZIKIR = [204, 205, 206, 207, 208, 209, 210];
   const ID_DOA_SHALAT = [222, 223, 224, 225, 226, 227];
   ```
3. Jalankan:
   ```bash
   npm run data:majmu
   ```
4. Periksa `dzikir-shalat.json` ikut berubah, lalu build.

Bila pengurus ingin mengunci teks tertentu agar tidak terpengaruh pembaruan API,
salin entri terkait ke file manual tersendiri dan minta developer menambahkannya ke renderer
(perubahan kecil di `majmu.js`).

---

## 6. Mengubah surah yang ditampilkan

Pembaca (`/majmu/baca/`) menerima nomor surah apa pun dari 1 sampai 114 lewat parameter
`?surah=N`, misalnya `/majmu/baca/?surah=18` untuk Al-Kahfi. Untuk menampilkan surah baru
di daftar isi:

1. Buka `src/majmu/index.html`.
2. Salin satu blok kartu surah yang sudah ada, ubah:
   - tautan `href="/majmu/baca/?surah=18"`,
   - nomor gaya Arab, nama Arab, nama Latin, jumlah ayat, tempat turun, dan deskripsi singkat.
3. Build. Tidak perlu mengubah `majmu.js`.

---

## 7. Mengelola Ratib al-Haddad (`ratib-haddad.json`)

Berkas ini ditarik otomatis dari halaman
[Ratib al-Haddad Quran NU Online](https://quran.nu.or.id/wirid/ratib/ratib-al-haddad)
oleh `scripts/fetch-ratib-haddad.mjs` (Quran NU Online tidak punya API publik,
jadi skrip membaca struktur HTML-nya).

Struktur berkas:

```jsonc
{
  "judul": "Ratib al-Haddad",
  "namaArab": "راتب الحدّاد",
  "status": "draft_tashih",        // ubah ke "terverifikasi" setelah tashih
  "sumber": { …atribusi lengkap… },
  "bagian": [
    { "judul": null, "arab": null, "items": [ …35 bacaan wirid… ] },
    { "judul": "الدعـــاء", "arab": "﴿الدعـــاء﴾", "items": [ …8 bacaan doa… ] }
  ]
}
```

Setiap item: `id` (nomor urut menerus 1–43), `arab`, `latin`, `terjemah`, dan
opsional `ulang: 3` bila bacaan diulang tiga kali (ditandai 20 item).

**Cara tashih tanpa menyentuh kode:**

1. Buka `public/data/majmu/ratib-haddad.json`.
2. Bandingkan setiap `arab`, `latin`, dan `terjemah` dengan naskah acuan pondok;
   perbaiki langsung di JSON (hormati aturan main JSON di bagian 2).
3. Pastikan penanda `ulang` sesuai jumlah pengulangan naskah.
4. Bila semua sudah cocok, ubah `status` tingkat berkas menjadi `terverifikasi`.
   Catatan peringatan kuning di halaman baca akan hilang dengan sendirinya.
5. `npm run build`, uji `/majmu/baca/?ratib`, lalu commit & push.

**Menyegarkan dari sumber:** `npm run data:ratib` menulis ulang seluruh berkas
dan mengembalikan status ke `draft_tashih` — jangan dijalankan bila hasil tashih
pengurus belum dipindahkan ke naskah sumber. Bila skrip gagal dengan pesan
"Jumlah blok tidak sesuai", struktur halaman situs sumber telah berubah;
minta bantuan teknis untuk menyesuaikan pola parser.

---

## 8. Alur setelah mengedit

```bash
# 1. Pastikan JSON valid (contoh untuk dhuha)
node -e "JSON.parse(require('fs').readFileSync('public/data/majmu/dhuha.json'))" && echo OK

# 2. Build ulang
npm run build

# 3. Jalankan verifikasi statis & uji render tanpa browser
node scripts/verify.mjs
node scripts/uji-render.mjs

# 4. Uji lokal
npx --yes serve dist
#    buka /majmu/baca/?dhuha (atau rute terkait, mis. ?ratib) dan periksa tampilannya

# 5. Commit & push — Netlify membangun ulang otomatis
git add public/data src
git commit -m "Pembaruan konten Majmu': ..."
git push
```

## 9. Kesalahan yang sering terjadi

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Halaman pembaca kosong / "Data belum bisa dimuat" | JSON tidak valid (koma kurang/lebih) | Jalankan cek JSON di poin 7.1 |
| Perubahan dzikir hilang setelah `npm run data:majmu` | Mengedit berkas hasil, bukan skrip | Ubah daftar ID di skrip (bagian 5) |
| Lencana/catatan "Perlu tashih" tidak hilang | Field `status` masih `draft_tashih` | Ubah ke `terverifikasi` setelah tashih (lihat bagian 7 untuk Ratib) |
| Hasil tashih Ratib hilang | Menjalankan `npm run data:ratib` setelah menyunting | Skrip menulis ulang berkas; selesaikan tashih lalu ubah status, jangan tarik ulang |
| `npm run data:ratib` gagal "Jumlah blok tidak sesuai" | Struktur HTML situs sumber berubah | Minta bantuan teknis menyesuaikan pola parser di `scripts/fetch-ratib-haddad.mjs` |
| Teks Arab tampil terpotong | Ada tanda kutip `"` di dalam teks tanpa `\` | Ganti menjadi `\"` atau gunakan tanda kutip Arab |
| Build sukses tapi situs lama | Cache/Netlify belum deploy baru | Pastikan sudah push; cek menu Deploys Netlify |

## 10. Prinsip verifikasi teks agama

- Teks dari API (Kemenag via EQuran.id) dan dataset berlisensi boleh langsung tayang dengan atribusi.
- Teks hasil transkripsi/penarikan otomatis dari sumber terbuka **selalu** mulai dari
  `draft_tashih`, dan baru ditandai `terverifikasi` setelah dibandingkan dengan naskah
  acuan oleh pengurus/ustadz pondok. Inilah status Ratib al-Haddad saat ini.
- Pola status yang sama akan dipakai untuk Maulid Ad-Diba' saat ditambahkan.
