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
    whatsapp: "6285816175603",           // format internasional TANPA tanda + atau spasi, contoh: "6281234567890"
    email: "darutthalibin410@gmail.com",              // contoh: "info@darutthalibin.id"
    jamLayanan: "Senin – Sabtu, 08.00 – 16.00 WIB",
    // Query peta untuk Google Maps (diubah setelah titik koordinat pasti dikonfirmasi)
    petaQuery: "Pondok Pesantren Darut Thalibin, Telang, Kamal, Bangkalan",
  },

  // ---------- Media sosial ----------
  // Biarkan "" jika belum ada. Contoh: "https://instagram.com/darutthalibin"
  sosial: {
    instagram: "https://instagram.com/darutthalibin",
    facebook: "",
    youtube: "https://youtube.com/@PPDTKamal",
    tiktok: "https://tiktok.com/@darutthalibin",
  },

  // ---------- Google Analytics 4 ----------
  // Tempel ID pengukuran GA4 di sini, contoh: "G-XXXXXXXXXX".
  // Biarkan "" untuk menonaktifkan analytics.
  ga4Id: "G-V4ZHMTRSST",

  // ---------- Menu navigasi utama (dengan grup dropdown "Tentang") ----------
  // Item tanpa "children" tampil sebagai tautan biasa; item dengan "children"
  // tampil sebagai dropdown di desktop dan grup yang bisa dibuka di mobile.
  menuUtama: [
    { label: "Beranda", path: "/" },
    {
      label: "Tentang",
      path: "/profil/",
      children: [
        { label: "Profil Pondok", path: "/profil/", desc: "Gambaran umum, visi-misi, dan identitas resmi" },
        { label: "Struktur Organisasi", path: "/organisasi/", desc: "Yayasan, pengasuh, dan pengurus putra-putri" },
        { label: "Prestasi Santri", path: "/prestasi/", desc: "Arsip pencapaian santri terverifikasi" },
      ],
    },
    { label: "Pendidikan", path: "/pendidikan/" },
    { label: "Kegiatan", path: "/kegiatan/" },
    { label: "Berita", path: "/berita/" },
    { label: "Kontak", path: "/kontak/" },
  ],

  // ---------- Struktur organisasi ----------
  // Sumber: poster resmi "STRUKTUR ORGANISASI PP. DARUT THALIBIN 2026".
  // Anggota dengan nama kosong otomatis tampil sebagai "Akan diumumkan".
  organisasi: [
    {
      judul: "Yayasan",
      keterangan: "Struktur resmi Yayasan PP. Darut Thalibin periode 2026.",
      anggota: [
        { jabatan: "Dewan Pembina Yayasan", nama: "Drs. KH. Mohammad Dja'far Al-Habary, M.Pdi & Ir. KH. Mondir Rohfi'i" },
        { jabatan: "Ketua Yayasan", nama: "Ir. KH. Taufiqurrahman Hasbullah, M.Kes" },
        { jabatan: "Sekretaris Yayasan", nama: "Ach. Khozaimi, S.Kom., M.Kom" },
        { jabatan: "Bendahara Yayasan", nama: "Nasihul Abror, S.AS" },
      ],
    },
    {
      judul: "Devisi",
      keterangan: "Devisi pelaksana program pondok pesantren.",
      anggota: [
        { jabatan: "Devisi SDM & Kurikulum", nama: "Auhadillah Azizi, S.Psi., M.Pi" },
        { jabatan: "Devisi Sarana Prasarana & Pemberdayaan Ekonomi", nama: "Dr. Ulfatun Nahdhiyah" },
        { jabatan: "Devisi Humas", nama: "Shofiyun Nahdidah, S.Ag., M.H.I" },
      ],
    },
    {
      judul: "Pondok Putra",
      keterangan: "Koordinator dan staf pembinaan santri putra.",
      anggota: [
        { jabatan: "Koordinator Pondok Putra", nama: "Muhammad Ridho Alfisyahri" },
        { jabatan: "Kesekretariatan", nama: "Aimul Muzammil" },
        { jabatan: "Keuangan", nama: "Muhammad Hanif" },
        { jabatan: "Kominfo", nama: "Agus Salin" },
        { jabatan: "Keamanan", nama: "" },
        { jabatan: "Kebersihan", nama: "" },
        { jabatan: "Humas", nama: "" },
        { jabatan: "Pendidikan", nama: "" },
      ],
    },
    {
      judul: "Seksi Usaha / Kepontren",
      keterangan: "Pengelola usaha dan operasional kepontren.",
      anggota: [
        { jabatan: "Seksi Usaha / Kepontren", nama: "Aimul Muzammil" },
      ],
    },
    {
      judul: "Pondok Putri",
      keterangan: "Koordinator dan staf pembinaan santri putri.",
      anggota: [
        { jabatan: "Koordinator Pondok Putri", nama: "" },
        { jabatan: "Kesekretariatan & Keuangan", nama: "Nurul Fadilah" },
        { jabatan: "Keamanan", nama: "Imroatun Mufida" },
        { jabatan: "Kebersihan", nama: "Putri Fadilla Wulandari" },
        { jabatan: "Kominfo", nama: "Indah Wulandari" },
        { jabatan: "Kegiatan & Peribadatan", nama: "Muslihah" },
      ],
    },
  ],

  // ---------- Jadwal kajian rutin ----------
  jadwalKajian: [
    { hari: "Setiap Hari", waktu: "Ba'da Maghrib", materi: "Kajian kitab kuning bersama" },
    { hari: "Sabtu", waktu: "Ba'da Isya", materi: "Tahsin & tajwid" },
    { hari: "Ahad", waktu: "Ba'da Subuh", materi: "Kajian tematik keislaman" },
  ],
};

export default siteData;
