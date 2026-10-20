/**
 * ============================================================
 *  DATA PUSAT WEBSITE DARUT THALIBIN TELANG
 * ============================================================
 *  Semua informasi yang bisa berubah ada di file INI saja.
 *  Tidak perlu menyentuh file HTML — cukup edit file ini,
 *  lalu jalankan "npm run build" (atau push ke GitHub agar
 *  Netlify membangun ulang otomatis).
 *
 *  Catatan ejaan: sesuaikan semua nama & nomor dengan
 *  dokumen resmi sebelum dipublikasikan.
 * ============================================================
 */

const siteData = {
  // ---------- Identitas ----------
  namaPondok: "Darut Thalibin Telang",
  namaPanjang: "Pondok Pesantren Darut Thalibin Telang",
  lokasiSingkat: "Telang · Kamal · Bangkalan",
  deskripsi:
    "Website resmi Darut Thalibin Telang, Kamal, Bangkalan. Informasi profil pondok, pendidikan, kegiatan santri, prestasi, berita, koperasi, dan organisasi.",
  skBadanHukum: "AHU-0015579.AH.04.Tahun 2018",
  nsp: "510235260222",

  // ---------- Kontak ----------
  // Isi dengan data resmi. Jika belum tersedia, biarkan string kosong ("")
  // dan bagian terkait otomatis disembunyikan dari website.
  kontak: {
    alamat:
      "Jln. Masjid Telang Indah, RT.02/RW.03, Desa Telang, Kecamatan Kamal, Kabupaten Bangkalan, Jawa Timur",
    telepon: "",            // contoh: "031-1234567"
    whatsapp: "",           // format internasional TANPA tanda + atau spasi, contoh: "6281234567890"
    email: "",              // contoh: "info@darutthalibin.id"
    jamLayanan: "Senin – Sabtu, 08.00 – 16.00 WIB",
    // Query peta untuk Google Maps (diubah setelah titik koordinat pasti dikonfirmasi)
    petaQuery: "Pondok Pesantren Darut Thalibin, Telang, Kamal, Bangkalan",
  },

  // ---------- Media sosial ----------
  // Biarkan "" jika belum ada. Contoh: "https://instagram.com/darutthalibin"
  sosial: {
    instagram: "https://instagram.com/darutthalibin",
    facebook: "",
    youtube: "https://instagram.com/@PPDTKamal",
    tiktok: "https://instagram.com/@darutthalibin",
  },

  // ---------- Google Analytics 4 ----------
  // Tempel ID pengukuran GA4 di sini, contoh: "G-XXXXXXXXXX".
  // Biarkan "" untuk menonaktifkan analytics.
  ga4Id: "",

  // ---------- Menu navigasi utama (sudah dirampingkan) ----------
  // Halaman Prestasi, Koperasi, dan Organisasi tetap tersedia
  // melalui kartu beranda, tautan silang, dan footer.
  menuUtama: [
    { label: "Beranda", path: "/" },
    { label: "Profil", path: "/profil/" },
    { label: "Pendidikan", path: "/pendidikan/" },
    { label: "Kegiatan", path: "/kegiatan/" },
    { label: "Berita", path: "/berita/" },
    { label: "Kontak", path: "/kontak/" },
  ],

  // ---------- Struktur organisasi ----------
  // Isi nama setelah data resmi diterima; bagian dengan array kosong
  // otomatis disembunyikan.
  organisasi: [
    {
      judul: "Yayasan",
      keterangan: "Struktur resmi yayasan akan diperbarui setelah data final diterima.",
      anggota: [
        { jabatan: "Ketua Yayasan", nama: "" },
      ],
    },
    {
      judul: "Pengasuh Pesantren",
      keterangan: "Profil pengasuh akan ditampilkan setelah dikonfirmasi.",
      anggota: [
        { jabatan: "Pengasuh Pesantren", nama: "" },
      ],
    },
    {
      judul: "Pengurus Putra",
      keterangan: "Sesuai struktur pengurus yang diberikan pengelola.",
      anggota: [
        { jabatan: "Koordinator Santri Putra", nama: "Muhammad Ridho A." },
        { jabatan: "Bidang Kesekretariatan", nama: "Ainul Muzammil" },
        { jabatan: "Bidang Keuangan", nama: "Muhammad Hanif" },
        { jabatan: "Bidang Kominfo", nama: "Agus Salim" },
      ],
    },
    {
      judul: "Pengurus Putri",
      keterangan: "Sesuai struktur pengurus yang diberikan pengelola.",
      anggota: [
        { jabatan: "Bidang Keuangan & Sarpras", nama: "Nurul Fadilah" },
        { jabatan: "Bidang Peribadatan & Kegiatan", nama: "Muslihah" },
        { jabatan: "Bidang Kebersihan & Keamanan", nama: "Putri Fadillah W." },
      ],
    },
  ],

  // ---------- Jadwal kajian rutin ----------
  jadwalKajian: [
    { hari: "Setiap Hari", waktu: "Ba'da Maghrib", materi: "Kajian kitab kuning bersama" },
    { hari: "Sabtu", waktu: "Ba'da Isya", materi: "Tahsin & tajwid" },
    { hari: "Ahad", waktu: "Ba'da Subuh", materi: "Kajian tematik keislaman" },
  ],

  // ---------- Pengumuman berjalan di beranda ----------
  pengumuman: [
    "Website resmi Darut Thalibin Telang resmi mengudara.",
    "Informasi penerimaan santri baru akan diumumkan melalui halaman Berita.",
  ],
};

export default siteData;
