# Panduan Implementasi Majmu' Digital ke Website PPDT

Panduan langkah demi langkah memasang bagian **Majmu' Digital** (`/majmu/`) ke repository
[ilhamhanif536/ppdt](https://github.com/ilhamhanif536/ppdt) hingga online di Netlify.
Tidak ada teknologi baru: tetap tanpa framework, tanpa dependensi npm, tanpa biaya API.

> Versi ini **tanpa fitur audio** — fokus pada pembaca teks yang ringan. Field audio dari
> API dibuang sebelum teks disimpan di perangkat pengunjung.

---

## 1. Ringkasan yang dipasang

| Jenis | Berkas | Keterangan |
|---|---|---|
| Baru | `src/majmu/index.html` | Halaman daftar isi Majmu' |
| Baru | `src/majmu/baca/index.html` | Halaman pembaca (surah, tahlil, dzikir, dhuha, ratib) |
| Baru | `src/assets/majmu.css` | Gaya khusus Majmu' (tema hijau yang sama) |
| Baru | `src/assets/majmu.js` | Logika: ambil data, cache, render teks |
| Baru | `public/data/majmu/tahlil.json` | 44 bacaan tahlil (lisensi MIT, sumber NU Online) |
| Baru | `public/data/majmu/dzikir-shalat.json` | 13 dzikir & doa seputar shalat |
| Baru | `public/data/majmu/dhuha.json` | Niat, tata cara, doa shalat Dhuha |
| Baru | `public/data/majmu/SUMBER-DATA.md` | Catatan atribusi & lisensi data |
| Baru | `scripts/fetch-majmu-data.mjs` | Pembaru data doa: `npm run data:majmu` |
| Baru | `scripts/fetch-ratib-haddad.mjs` | Penarik & parser Ratib al-Haddad dari Quran NU Online: `npm run data:ratib` |
| Baru | `public/data/majmu/ratib-haddad.json` | 43 bacaan Ratib (2 bagian, status `draft_tashih`) |
| Baru | `scripts/verify.mjs` | Verifikasi statis build & data (35 cek) |
| Baru | `scripts/uji-render.mjs` | Uji renderer tanpa browser (DOM-stub + bundle asli) |
| Baru | `docs/gambaran-majmu.html` | Dokumen gambaran alur (internal, tidak ikut ter-build) |
| Diubah | `scripts/build.mjs` | Menyalin `public/data` + fingerprint aset Majmu' + dukungan menu aktif di halaman turunan |
| Diubah | `package.json` | Tambah satu perintah `data:majmu` |
| Diubah | `src/_data/site-data.mjs` | Tambah item menu **Majmu'** di `menuUtama` (otomatis tampil di nav desktop & menu garis tiga HP) |
| Diubah | `src/assets/site.css` | Penyesuaian jarak menu agar 7 item tetap nyaman di layar menengah |
| Diubah | `src/_includes/footer.html` | Tambah tautan Majmu' di footer |
| Diubah | `README.md` | Dokumentasi fitur baru |

> **Beranda (`src/index.html`) sengaja tidak diubah.** Majmu' adalah halaman mandiri
> setara Pendidikan/Kegiatan yang diakses lewat menu navigasi, bukan bagian yang dipajang di beranda.

**Tidak ada satu pun berkas lama yang dihapus.** Perubahan pada berkas lama hanya penambahan.

---

## 2. Opsi A — Pasang lewat Git di komputer/CodeSpaces (disarankan)

Cocok bila Anda biasa mengedit lewat VS Code, GitHub Desktop, atau Codespaces.

### 2.1 Siapkan repo terbaru

```bash
# Jika belum punya salinan lokal:
git clone https://github.com/ilhamhanif536/ppdt.git
cd ppdt

# Jika sudah ada, pastikan sejajar dengan GitHub:
git checkout main
git pull
```

### 2.2 Salin paket perubahan

1. Unduh **`ppdt-majmu-paket-pasang.zip`** (disediakan terpisah di workspace).
2. Ekstrak **tepat di folder root repo** `ppdt/` — struktur foldernya sudah sama,
   jadi cukup timpa (`merge/replace`) bila ditanya.
3. Pastikan identitas git terisi (cukup sekali per komputer):
   ```bash
   git config user.name "ilhamhanif536"
   git config user.email "email-akun-github@contoh.com"
   ```

### 2.3 Uji build secara lokal

```bash
npm run build
```

Harus muncul `Build OK → dist/ (12 halaman)`. Buka hasilnya:

```bash
npx --yes serve dist
```

Periksa alamat `/majmu/` dan `/majmu/baca/?surah=36` di browser.

### 2.4 Commit dan push

```bash
git add src/majmu src/assets/majmu.css src/assets/majmu.js \
        public/data scripts/build.mjs scripts/fetch-majmu-data.mjs \
        package.json src/_data/site-data.mjs src/assets/site.css \
        src/_includes/footer.html README.md docs dist
git commit -m "Tambah fitur Majmu' Digital: 5 surah, tahlil, dzikir, dan panduan Dhuha (tanpa audio)"
git push origin main
```

> Catatan: folder `dist/` memang dilacak di repo ini, jadi ikut di-commit agar isi repo
> konsisten. Namun sumber kebenaran tetap berkas di `src/` — Netlify membangun ulang
> `dist/` sendiri setiap kali ada push.

---

## 3. Opsi B — Unggah lewat situs GitHub (tanpa perintah Git)

1. Buka https://github.com/ilhamhanif536/ppdt di browser, masuk ke branch `main`.
2. Klik **Add file → Upload files**.
3. Ekstrak paket zip, lalu **seret seluruh folder & berkas** ke halaman unggah
   (browser Chrome/Edge mempertahankan struktur folder saat menyeret folder).
4. Pada bagian bawah, isi pesan commit:
   `Tambah fitur Majmu' Digital (tanpa audio)` lalu **Commit changes**.
5. Ulangi untuk folder `dist/` bila ingin repo tetap menyimpan hasil build terbaru
   (tidak wajib — Netlify membangun sendiri).

Kelemahan opsi ini: tidak ada uji build lokal sebelum tayang. Jika build Netlify gagal,
lihat bagian 6.

---

## 4. Opsi C — Push langsung dari workspace Arena (lanjutan)

Workspace ini sudah berisi seluruh perubahan dalam keadaan siap commit, namun tidak
memiliki kredensial GitHub Anda. Bila ingin push dari sini:

1. Buat **Personal Access Token** di GitHub:
   Settings → Developer settings → Personal access tokens → Tokens (classic) →
   Generate new token, centang scope **`repo`**, salin tokennya.
2. Jalankan di terminal workspace (ganti `TOKEN_ANDA`):
   ```bash
   cd /home/user/ppdt
   git config user.name "ilhamhanif536"
   git config user.email "email-akun-github@contoh.com"
   git add -A
   git commit -m "Tambah fitur Majmu' Digital (tanpa audio)"
   git push https://ilhamhanif536:TOKEN_ANDA@github.com/ilhamhanif536/ppdt.git main
   ```
3. **Hapus token setelah selesai** dan jangan menempelkannya di file mana pun.
   Untuk pemakaian rutin, Opsi A jauh lebih aman.

---

## 5. Opsi D — Preview instan tanpa Git (Netlify Drop)

Untuk mencoba di URL Netlify sementara tanpa menyentuh repo:

1. Paket **`ppdt-dist-siap-deploy.zip`** (isi folder `dist/` hasil build).
2. Buka https://app.netlify.com/drop
3. Seret berkas zip (atau folder hasil ekstraknya) ke halaman tersebut — situs langsung online.

Sifatnya sementara dan tidak terhubung repo; website resmi tetap diperbarui lewat Opsi A/B.

---

## 6. Yang terjadi di Netlify & pengaturan yang diperlukan

Begitu push masuk ke branch `main`:

1. Netlify membaca `netlify.toml` → menjalankan `npm run build` → mempublikasikan folder `dist/`.
2. Build biasanya selesai ±30 detik. Pantau di menu **Deploys**; status harus `Published`.
3. Pastikan environment variable sudah terisi (Site configuration → Environment variables):
   - `SITE_URL` = domain kanonis, contoh `https://darutthalibin.web.id`
   Tanpa variabel ini build tetap sukses, tapi canonical & sitemap memakai placeholder.

Jika build gagal: buka log deploy, 90% kasus pertama adalah kesalahan sintaks di berkas
yang baru diedit. Jalankan `npm run build` di lokal untuk melihat pesan error yang sama.

---

## 7. Verifikasi setelah tayang

Ganti `domainanda` sesuai domain Netlify/website, lalu cek satu per satu:

- [ ] `https://domainanda/majmu/` — daftar isi tampil, 8 kartu aktif + 1 kartu "Dalam penyiapan" (Maulid Diba')
- [ ] `https://domainanda/majmu/baca/?surah=18` — Al-Kahfi: 110 ayat (bacaan hari Jumat)
- [ ] `https://domainanda/majmu/baca/?surah=36` — Yasin: 83 ayat, Arab + Latin + terjemah
- [ ] `https://domainanda/majmu/baca/?surah=55` (Ar-Rahman), `?surah=56` (Al-Waqiah), `?surah=67` (Al-Mulk)
- [ ] `https://domainanda/majmu/baca/?tahlil` — 44 bacaan
- [ ] `https://domainanda/majmu/baca/?dzikir` — 2 grup, 13 doa
- [ ] `https://domainanda/majmu/baca/?dhuha` — niat, tata cara, doa
- [ ] `https://domainanda/majmu/baca/?ratib` — Ratib al-Haddad: 43 bacaan, 2 bagian, 20 lencana "dibaca 3×", catatan tashih kuning tampil (status masih `draft_tashih`)
- [ ] `https://domainanda/data/majmu/tahlil.json` — berkas data dapat diakses (tampil JSON)
- [ ] `https://domainanda/data/majmu/ratib-haddad.json` — berkas data Ratib dapat diakses
- [ ] Lokal: `node scripts/verify.mjs` dan `node scripts/uji-render.mjs` seluruhnya lolos
- [ ] Menu navigasi memuat item **Majmu'** (desktop) dan muncul saat tombol garis tiga ditekan (HP)
- [ ] Menu Majmu' menandai aktif (highlight) saat berada di `/majmu/` maupun `/majmu/baca/`
- [ ] Beranda tampil sama seperti sebelumnya — tanpa bagian Majmu'
- [ ] Footer memuat tautan Majmu'
- [ ] View-source halaman pembaca memuat `majmu.[hash].css` dan `majmu.[hash].js`
- [ ] Uji ringan: buka Yasin sekali, matikan internet, muat ulang — teks tetap muncul dari cache
- [ ] Tidak ada permintaan berkas MP3/audio di tab Network browser (konfirmasi fitur audio benar-benar nonaktif)
- [ ] `https://domainanda/sitemap.xml` memuat dua URL baru: `/majmu/` dan `/majmu/baca/`

---

## 8. Perawatan setelah implementasi

| Kebutuhan | Cara |
|---|---|
| Memperbarui teks dzikir/doa dari sumber | Jalankan `npm run data:majmu`, lalu commit perubahan di `public/data/majmu/` |
| Mengubah susunan tahlil | Edit `public/data/majmu/tahlil.json` (mengikuti struktur id/title/arabic/translation) |
| Mengubah teks panduan Dhuha | Edit `public/data/majmu/dhuha.json` |
| Menyegarkan teks Ratib al-Haddad | `npm run data:ratib` (menarik ulang dari Quran NU Online; status kembali ke `draft_tashih`) |
| Menashih Ratib al-Haddad | Edit `public/data/majmu/ratib-haddad.json`, ubah `status` ke `terverifikasi` — lihat bagian 7 PANDUAN-EDIT-KONTEN |
| Menambah/menyembunyikan kartu di daftar isi | Edit `src/majmu/index.html` |
| Menyiapkan Maulid Diba' | Tambah JSON baru di `public/data/majmu/`, tambah renderer di `majmu.js` setelah teks ditashih pengurus |
| Mengubah warna/gaya | Cukup `src/assets/majmu.css` — token warna memakai variabel yang sama dengan `site.css` |

Setiap perubahan cukup di-commit & push; Netlify membangun ulang otomatis.

---

## 9. Jika ingin kembali ke versi sebelumnya

- **Lewat Netlify (tercepat):** menu **Deploys → deploy sebelumnya → Publish deploy**.
- **Lewat Git:** `git revert <hash-commit-majmu>` lalu push — riwayat tetap utuh.

---

## 10. Checklist ringkas

1. [ ] Ekstrak paket di root repo terbaru
2. [ ] `npm run build` sukses (12 halaman)
3. [ ] Cek `/majmu/` di preview lokal
4. [ ] Commit dengan pesan jelas, push ke `main`
5. [ ] Deploy Netlify `Published`, `SITE_URL` terisi
6. [ ] Jalankan verifikasi bagian 7
7. [ ] Minta pengurus meninjau niat & tata cara Dhuha sebelum disebarluaskan
