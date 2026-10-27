/**
 * ============================================================
 *  fetch-majmu-data.mjs
 *  Mengambil data kurasi dari EQuran.id Doa API (gratis, tanpa
 *  API key) dan menyimpannya sebagai JSON lokal agar halaman
 *  Majmu' tetap cepat dan bisa dibuka saat offline.
 *
 *  Cakupan skrip ini HANYA:
 *    public/data/majmu/dzikir-shalat.json
 *
 *  File dhuha.json TIDAK dibuat ulang di sini — file itu dikurasi
 *  manual (mendukung banyak versi doa + status tashih), sehingga
 *  aman dari penimpanan saat skrip dijalankan.
 *
 *  Jalankan: node scripts/fetch-majmu-data.mjs
 *  Tidak ada dependensi npm — memakai fetch bawaan Node 18+.
 * ============================================================
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const API_DOA = "https://equran.id/api/doa";
const OUT_DIR = path.join(process.cwd(), "public", "data", "majmu");

// ID yang dikurasi dari 227 doa yang tersedia di EQuran.id.
const ID_DZIKIR = [204, 205, 206, 207, 208, 209, 210]; // Lafal Dzikir dan Keutamaannya
const ID_DOA_SHALAT = [222, 223, 224, 225, 226, 227]; // Beberapa Doa Terkait Shalat (227 = Doa Setelah Shalat Dhuha)

const attr = {
  sumber: "EQuran.id Doa API (https://equran.id/apidev) — data bersumber Kementerian Agama RI",
  diambil: new Date().toISOString().slice(0, 10),
  catatan:
    "File ini dibuat otomatis oleh scripts/fetch-majmu-data.mjs. Perubahan manual akan tertimpa saat skrip dijalankan ulang — untuk kurasi permanen, sunting daftar ID di skrip atau pindahkan entri ke file manual seperti dhuha.json.",
};

const ringkas = (doa) => ({
  id: doa.id,
  nama: doa.nama,
  arab: doa.ar,
  latin: doa.tr,
  terjemah: doa.idn,
  tentang: doa.tentang || "",
});

async function main() {
  console.log("Mengambil daftar doa dari", API_DOA);
  const res = await fetch(API_DOA);
  if (!res.ok) throw new Error(`Gagal mengambil API: HTTP ${res.status}`);
  const semua = (await res.json()).data;
  const peta = new Map(semua.map((d) => [d.id, d]));

  const wajibAda = [...ID_DZIKIR, ...ID_DOA_SHALAT];
  const hilang = wajibAda.filter((id) => !peta.has(id));
  if (hilang.length) throw new Error("ID doa tidak ditemukan di API: " + hilang.join(", "));

  await mkdir(OUT_DIR, { recursive: true });

  // ---------- Dzikir & doa terkait shalat ----------
  const dzikir = {
    judul: "Dzikir dan Doa Seputar Shalat",
    ...attr,
    grup: [
      {
        judul: "Lafal Dzikir dan Keutamaannya",
        keterangan: "Dzikir ringan yang dianjurkan dibaca, terutama setelah shalat fardhu.",
        items: ID_DZIKIR.map((id) => ringkas(peta.get(id))),
      },
      {
        judul: "Beberapa Doa Terkait Shalat",
        keterangan: "Doa-doa pada situasi shalat tertentu, termasuk doa setelah shalat Dhuha (versi ringkas, id 227). Versi panjang dikelola manual di dhuha.json.",
        items: ID_DOA_SHALAT.map((id) => ringkas(peta.get(id))),
      },
    ],
  };
  await writeFile(
    path.join(OUT_DIR, "dzikir-shalat.json"),
    JSON.stringify(dzikir, null, 2) + "\n",
    "utf8"
  );
  console.log("✓ dzikir-shalat.json (" + wajibAda.length + " doa, 2 grup)");
  console.log("ℹ dhuha.json tidak disentuh (file kurasi manual).");
  console.log("Selesai. Data tersimpan di", OUT_DIR);
}

main().catch((err) => {
  console.error("Gagal memperbarui data Majmu':", err.message);
  process.exit(1);
});
