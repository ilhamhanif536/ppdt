/**
 * ============================================================
 *  verify.mjs — verifikasi statis hasil build & data Majmu'
 *  Jalankan SETELAH `npm run build`: node scripts/verify.mjs
 *  Tanpa dependensi; keluar dengan kode 1 bila ada cek gagal.
 * ============================================================
 */
import { readFile, access } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
let gagal = 0;
let lolos = 0;

function cek(nama, ok, detail = "") {
  if (ok) {
    lolos++;
    console.log(`  ✓ ${nama}${detail ? " — " + detail : ""}`);
  } else {
    gagal++;
    console.error(`  ✗ GAGAL: ${nama}${detail ? " — " + detail : ""}`);
  }
}

async function ada(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function baca(p) {
  return readFile(p, "utf8");
}

console.log("\n=== 1. Struktur hasil build ===");
cek("dist/ ada", await ada(dist));
for (const hal of ["index.html", "pendidikan/index.html", "kegiatan/index.html", "majmu/index.html", "majmu/baca/index.html"]) {
  cek(`halaman ${hal}`, await ada(path.join(dist, hal)));
}

console.log("\n=== 2. Data Majmu' valid & lengkap ===");
const dataDir = path.join(dist, "data", "majmu");
for (const f of ["tahlil.json", "dzikir-shalat.json", "dhuha.json", "ratib-haddad.json"]) {
  cek(`data ${f}`, await ada(path.join(dataDir, f)));
}

const ratib = JSON.parse(await baca(path.join(dataDir, "ratib-haddad.json")));
const total = ratib.bagian.reduce((n, b) => n + b.items.length, 0);
const ulang = ratib.bagian.flatMap((b) => b.items).filter((i) => i.ulang === 3).length;
cek("Ratib: 43 bacaan", total === 43, `ditemukan ${total}`);
cek("Ratib: 2 bagian (35 wirid + 8 doa)", ratib.bagian.length === 2 && ratib.bagian[0].items.length === 35 && ratib.bagian[1].items.length === 8);
cek("Ratib: 20 penanda ulang 3×", ulang === 20, `ditemukan ${ulang}`);
cek("Ratib: status draft_tashih", ratib.status === "draft_tashih");
cek("Ratib: heading bagian doa", !!ratib.bagian[1].arab && ratib.bagian[1].arab.includes("الدع"));
cek("Ratib: id berkelanjutan 1–43", ratib.bagian.flatMap((b) => b.items).every((i, idx) => i.id === idx + 1));
cek("Ratib: tidak ada field kosong", ratib.bagian.every((b) => b.items.every((i) => i.arab && i.latin && i.terjemah)));
cek("Ratib: tanpa entitas HTML tersisa", !/&#|&[a-z]+;/.test(JSON.stringify(ratib)));
cek("Ratib: atribusi sumber lengkap", ["url", "naskahAcuan", "penyalinPenerjemah", "pentransliterasi", "editor"].every((k) => !!ratib.sumber?.[k]));

const dhuha = JSON.parse(await baca(path.join(dataDir, "dhuha.json")));
const doaList = dhuha.doaList || [];
cek("Dhuha: 2 versi doa", doaList.length === 2, `ditemukan ${doaList.length}`);
cek("Dhuha: status entri valid", doaList.every((d) => ["draft_tashih", "terverifikasi"].includes(d.status)));

for (const f of ["tahlil.json", "dzikir-shalat.json"]) {
  const j = JSON.parse(await baca(path.join(dataDir, f)));
  cek(`${f}: JSON parse OK & berisi data`, !!j && (Array.isArray(j) ? j.length : Object.keys(j).length) > 0);
}

console.log("\n=== 3. Rute & tampilan ===");
const majmuJs = (await baca(path.join(dist, "majmu", "baca", "index.html")));
const jsHref = majmuJs.match(/[^"]*majmu\.[a-f0-9]+\.js/)?.[0];
const cssHref = majmuJs.match(/[^"]*majmu\.[a-f0-9]+\.css/)?.[0];
cek("pembaca memuat JS & CSS berhash", !!jsHref && !!cssHref, `${jsHref || "?"} / ${cssHref || "?"}`);
if (jsHref) cek("berkas JS berhash ada", await ada(path.join(dist, jsHref.replace(/^\//, ""))));
if (cssHref) cek("berkas CSS berhash ada", await ada(path.join(dist, cssHref.replace(/^\//, ""))));
const jsKode = jsHref ? await baca(path.join(dist, jsHref.replace(/^\//, ""))) : "";
cek("rute ?ratib terdaftar", jsKode.includes('"ratib"') && jsKode.includes("renderRatib"));
cek("penanda 'dibaca 3×' dirender", jsKode.includes("mj-ulang"));
cek("catatan tashih dirender", jsKode.includes("mj-tashih-note"));

const kartuHtml = await baca(path.join(dist, "majmu", "index.html"));
cek("kartu Ratib aktif (link ?ratib)", kartuHtml.includes('href="/majmu/baca/?ratib"'));
cek("hanya 1 kartu 'Dalam penyiapan' (Maulid Diba)", (kartuHtml.match(/Dalam penyiapan/g) || []).length === 1);
cek("kartu Al-Kahfi terpasang", kartuHtml.includes("?surah=18"));

console.log("\n=== 4. Aturan tetap ===");
const semua = [];
kumpulkan.json = [];
async function kumpulkan(dir) {
  const { readdir } = await import("node:fs/promises");
  for (const entri of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entri.name);
    if (entri.isDirectory()) await kumpulkan(p);
    else if (/\.(html|js|css|json)$/.test(entri.name)) {
      const isi = await baca(p);
      semua.push(isi);
      if (entri.name.endsWith(".json")) kumpulkan.json.push(true);
      else kumpulkan.json.push(false);
    }
  }
}
await kumpulkan(dist);
const gabung = semua.join("\n");
// "audio" boleh muncul di komentar/kode yang justru MENGHAPUS field audio.
// Yang dilarang: berkas audio, elemen <audio>, objek Audio(), atau data audio di JSON.
const jsonGabung = semua
  .filter((_, i) => kumpulkan.json[i])
  .join("\n");
cek("tanpa berkas/elemen/pemutar audio", !/\.mp3|\.m4a|\.aac|\.ogg|\.wav|<audio|new Audio\(|Audio\(|murottal|qari/i.test(gabung));
cek("JSON tanpa field audio", !/"audio|audioFull|audioSecondary"/.test(jsonGabung));
cek("tanpa kelas mj-band", !/mj-band/.test(gabung));

console.log(`\n${gagal === 0 ? "✅" : "❌"} Selesai: ${lolos} cek lolos, ${gagal} gagal\n`);
process.exit(gagal ? 1 : 0);
