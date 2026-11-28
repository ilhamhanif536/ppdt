/**
 * Cek postingan prestasi baru dari Instagram @darutthalibin via Apify (Free Tier)
 * Tanpa dependensi eksternal (Node.js 18+).
 *
 * Penggunaan:
 *   APIFY_TOKEN=apify_api_xxx node scripts/cek-ig-prestasi.mjs
 *   node scripts/cek-ig-prestasi.mjs --file path/to/apify-export.json  (uji lokal / impor manual)
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "src", "_data", "prestasi.json");
const IG_PROFILE_URL = "https://www.instagram.com/darutthalibin/";
const RESULTS_LIMIT = Number(process.env.IG_LIMIT || 10);

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function normalizeUrl(url = "") {
  const m = String(url).match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/i);
  return m ? `https://www.instagram.com/p/${m[1]}/` : String(url).trim();
}

function shortcodeOf(url = "") {
  const m = String(url).match(/instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+)/i);
  return m ? m[1] : "";
}

function shortcodeToDate(shortcode) {
  if (!shortcode) return new Date().toISOString().slice(0, 10);
  let mediaId = 0n;
  for (const ch of shortcode) {
    const idx = ALPHABET.indexOf(ch);
    if (idx === -1) return new Date().toISOString().slice(0, 10);
    mediaId = mediaId * 64n + BigInt(idx);
  }
  const tsMs = Number((mediaId >> 23n) + 1314220021721n);
  return new Date(tsMs).toISOString().slice(0, 10);
}

// Kriteria deteksi postingan prestasi santri (membuang ucapan hari besar, wisuda, skripsi, pengumuman)
const RE_PRESTASI =
  /(#santriberprestasi|\bprestasi\b|\bjuara\b|\bmedal|\bgold\b|\bsilver\b|\bbronze\b|\bbest\s+[a-z]+|\bduta\b|\btasmi|\bsanad\b|\blolos\s+pendanaan\b|\bpkm\b|\bpenghargaan\b|\bcompetition\b|\blomba\b|\bkejuaraan\b|\bolimpiade\b|\bmtq|\bterpilih\b)/i;

const RE_BUKAN_PRESTASI =
  /(hari santri|hari guru|maulid nabi|idul adha|idul fitri|bulan ramadhan|tahun baru islam|1 muharram|isra|rajab|nisfu sya|uas semester|uts semester|sidang skripsi|selamat wisuda|pendaftaran santri|koordinator santri putra|pahlawan nasional|gelar doktor|kelayakan naskah disertasi|dekan fakultas|asosiasi dosen)/i;

function isPrestasiPost(caption = "") {
  const text = caption.trim();
  if (!text) return false;
  if (RE_BUKAN_PRESTASI.test(text)) return false;
  return RE_PRESTASI.test(text);
}

function detectTingkat(text) {
  if (/internasional|international|al-azhar|kairo|mesir/i.test(text)) return "Internasional";
  if (/nasional|mtqmn|pkm-|indonesia/i.test(text)) return "Nasional";
  if (/provinsi|jawa timur|jatim/i.test(text)) return "Provinsi";
  if (/kabupaten|wilayah|bangkalan/i.test(text)) return "Kabupaten / Wilayah";
  if (/duta kampus|potra|potrè|universitas/i.test(text)) return "Universitas";
  if (/fakultas|prodi|psikologi|fkip/i.test(text)) return "Fakultas / Prodi";
  if (/tasmi|tahfidz|pondok pesantren darut thalibin/i.test(text)) return "Pesantren";
  return "Nasional (cek ulang)";
}

function detectKategori(text) {
  if (/tasmi|tahfidz|sanad|al-qur/i.test(text)) return "Keagamaan & Tahfidz";
  if (/mtq|baca kitab|bahasa arab|qiroatus|puisi bahasa arab|debat/i.test(text)) return "Keagamaan & Bahasa Arab";
  if (/duta|ketua|pengurus wilayah|public speaking|video profil/i.test(text)) return "Duta & Kepemimpinan";
  if (/pagar nusa|silat|futsal|badminton|olahraga|cup/i.test(text)) return "Olahraga & Bela Diri";
  return "Akademik & Karya Ilmiah";
}

function extractDraft(post) {
  const url = normalizeUrl(post.url || "");
  const sc = shortcodeOf(url);
  const tanggal = post.timestamp ? String(post.timestamp).slice(0, 10) : shortcodeToDate(sc);
  const tahun = Number(tanggal.slice(0, 4)) || new Date().getFullYear();
  const caption = String(post.caption || "").trim();

  // Coba ekstrak nama dari pola *Nama* atau "Nama"
  const cleanBody = caption
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\*\[[^\]]*\]\*/g, " ")
    .replace(/Follow Us on[\s\S]*/i, "")
    .trim();

  let nama = "[Cek nama santri di caption]";
  const starMatch = cleanBody.match(/\*([A-Za-zÀ-ÿ.'\s-]{3,60})\*/);
  const quoteMatch = cleanBody.match(/"([A-Za-zÀ-ÿ.'\s-]{3,60})"/);
  const candidate = (starMatch?.[1] || quoteMatch?.[1] || "").trim();
  if (candidate && !/selamat|sukses|assalam|keluarga|darut thalibin/i.test(candidate)) {
    nama = candidate;
  }

  // Ambil ringkasan inti caption (tanpa salam & footer) untuk memudahkan verifikasi
  const coreLines = cleanBody
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(
      (l) =>
        l &&
        !/^[_\-=—]{3,}$/.test(l) &&
        !/assalam|wassalam|الس|وَالس|semoga pencapaian|semoga prestasi|teruslah melangkah|keluarga besar pondok pesantren darut thalibin$/i.test(l)
    );
  const summary = coreLines.join(" ").replace(/\s+/g, " ").slice(0, 220);

  // Coba ekstrak capaian singkat
  let capaian = "[Cek peringkat/penghargaan di caption atau poster]";
  const capMatch = cleanBody.match(
    /(Juara\s+\d+[^.,\n]*|Gold Medal[^.,\n]*|Silver Medal[^.,\n]*|Bronze Medal[^.,\n]*|Best\s+[A-Za-z\s]+|Duta\s+[A-Za-z\s]+|Tasmi[’']?\s+Al-Qur[’']?an[^.,\n]*|Lolos\s+Pendanaan[^.,\n]*|Ijazah\s+Sanad[^.,\n]*)/i
  );
  if (capMatch) {
    capaian = capMatch[1].trim();
  }

  return {
    entry: {
      nama,
      capaian,
      kompetisi: summary || "[Lengkapi nama kompetisi & penyelenggara]",
      kategori: detectKategori(cleanBody),
      tingkat: detectTingkat(cleanBody),
      tahun,
      tanggal,
      sumberIg: url,
    },
    rawCaption: caption,
  };
}

async function fetchPostsFromApify(token) {
  const endpoint = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      addParentData: false,
      directUrls: [IG_PROFILE_URL],
      resultsLimit: RESULTS_LIMIT,
      resultsType: "posts",
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Apify API error (${res.status}): ${errText.slice(0, 300)}`);
  }
  const items = await res.json();
  if (!Array.isArray(items)) {
    throw new Error("Respons Apify tidak berupa array postingan.");
  }
  return items;
}

async function main() {
  const args = process.argv.slice(2);
  const fileIdx = args.indexOf("--file");
  const dryRun = args.includes("--dry-run");

  let posts = [];
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    const localPath = path.resolve(args[fileIdx + 1]);
    posts = JSON.parse(await readFile(localPath, "utf8"));
    console.log(`Membaca ${posts.length} postingan dari file lokal: ${localPath}`);
  } else {
    const token = process.env.APIFY_TOKEN;
    if (!token) {
      throw new Error("APIFY_TOKEN belum diatur di environment / GitHub Secrets.");
    }
    console.log(`Menarik ${RESULTS_LIMIT} postingan terbaru @darutthalibin via Apify...`);
    posts = await fetchPostsFromApify(token);
    console.log(`Berhasil menerima ${posts.length} postingan.`);
  }

  const existing = existsSync(DATA_FILE)
    ? JSON.parse(await readFile(DATA_FILE, "utf8"))
    : [];
  const existingUrls = new Set(existing.map((item) => normalizeUrl(item.sumberIg)));

  const seenNow = new Set();
  const newDrafts = [];

  for (const post of posts) {
    const url = normalizeUrl(post.url || "");
    if (!url || existingUrls.has(url) || seenNow.has(url)) continue;
    if (!isPrestasiPost(post.caption || "")) continue;
    seenNow.add(url);
    newDrafts.push(extractDraft(post));
  }

  if (!newDrafts.length) {
    console.log("Tidak ada postingan prestasi baru di Instagram.");
    return;
  }

  newDrafts.sort((a, b) => b.entry.tanggal.localeCompare(a.entry.tanggal));
  console.log(`Ditemukan ${newDrafts.length} postingan prestasi baru:`);
  for (const d of newDrafts) {
    console.log(`  - [${d.entry.tanggal}] ${d.entry.nama} — ${d.entry.capaian} (${d.entry.sumberIg})`);
  }

  const prBodyLines = [
    "## Draf Update Prestasi Santri dari Instagram `@darutthalibin`",
    "",
    `Ditemukan **${newDrafts.length} postingan prestasi baru** yang belum tercatat di \`src/_data/prestasi.json\`.`,
    "",
    "### Checklist Verifikasi Pengelola (sebelum klik Merge):",
    "- [ ] Cek ejaan **nama santri**, **peringkat/medali** (cek juga poster IG bila tidak tertulis di caption), **kompetisi**, dan **tingkat**.",
    "- [ ] Jika ada 1 postingan berisi 2 capaian, pecah menjadi 2 entri di `src/_data/prestasi.json`.",
    "- [ ] Jika postingan bukan prestasi santri, tutup (Close) PR ini tanpa merge.",
    "",
    "### Detail Caption Asli",
    "",
  ];

  for (const [i, d] of newDrafts.entries()) {
    prBodyLines.push(`#### ${i + 1}. ${d.entry.nama} (${d.entry.tanggal})`);
    prBodyLines.push(`- **Sumber IG:** ${d.entry.sumberIg}`);
    prBodyLines.push(`- **Draf Capaian:** ${d.entry.capaian}`);
    prBodyLines.push(`- **Tingkat / Kategori:** ${d.entry.tingkat} · ${d.entry.kategori}`);
    prBodyLines.push("");
    prBodyLines.push("<details><summary>Lihat caption asli Instagram</summary>");
    prBodyLines.push("");
    prBodyLines.push("```text");
    prBodyLines.push(d.rawCaption);
    prBodyLines.push("```");
    prBodyLines.push("</details>");
    prBodyLines.push("");
  }

  const prBodyPath = process.env.PR_BODY_FILE || "";
  if (prBodyPath) {
    await writeFile(prBodyPath, prBodyLines.join("\n"), "utf8");
  }

  if (dryRun) {
    console.log("(Mode --dry-run aktif: src/_data/prestasi.json tidak diubah.)");
    return;
  }

  const merged = [...newDrafts.map((d) => d.entry), ...existing];
  await writeFile(DATA_FILE, JSON.stringify(merged, null, 2) + "\n", "utf8");
  console.log(`Berhasil menambahkan ${newDrafts.length} draf ke src/_data/prestasi.json.`);
}

main().catch((err) => {
  console.error("Gagal menjalankan cek-ig-prestasi:", err.message);
  process.exit(1);
});
