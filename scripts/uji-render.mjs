/**
 * ============================================================
 *  uji-render.mjs — uji renderer pembaca tanpa browser
 *  Memuat bundle majmu.*.js hasil build di dalam DOM-stub
 *  (Node vm), melayani fetch dari dist/data/majmu, lalu
 *  memeriksa HTML hasil render setiap rute lokal.
 *  Jalankan: node scripts/uji-render.mjs
 * ============================================================
 */
import vm from "node:vm";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

function elemenStub() {
  return {
    innerHTML: "",
    textContent: "",
    style: { setProperty() {}, display: "" },
    classList: { toggle() {}, add() {}, remove() {} },
    dataset: {},
    addEventListener() {},
    setAttribute() {},
    getAttribute() { return ""; },
    querySelector() { return elemenStub(); },
    querySelectorAll() { return []; },
    closest() { return null; },
  };
}

async function jalankanRute(query) {
  const app = elemenStub();
  const isi = elemenStub();
  app.querySelector = (sel) => (sel === "[data-isi]" ? isi : sel === "[data-toolbar-title]" ? elemenStub() : elemenStub());
  app.querySelectorAll = () => [];
  app.classList = { toggle() {} };
  app.style = { setProperty() {} };

  const documentStub = {
    title: "",
    querySelector: (sel) => (sel === "[data-majmu-app]" ? app : null),
  };
  const localStorageStub = {
    _m: new Map(),
    getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
    setItem(k, v) { this._m.set(k, String(v)); },
  };
  const fetchStub = async (url) => {
    const nama = url.split("/").pop();
    const p = path.join(dist, "data", "majmu", nama);
    return { ok: true, status: 200, json: async () => JSON.parse(await readFile(p, "utf8")) };
  };

  const berkas = (await readdir(path.join(dist, "assets"))).find((f) => /^majmu\.[a-f0-9]+\.js$/.test(f));
  const kode = await readFile(path.join(dist, "assets", berkas), "utf8");
  const ctx = {
    window: {},
    location: { search: query },
    document: documentStub,
    localStorage: localStorageStub,
    navigator: {},
    URLSearchParams,
    fetch: fetchStub,
    setTimeout,
    console,
  };
  vm.createContext(ctx);
  await vm.runInContext(kode, ctx);
  // muat() berjalan async di akhir IIFE; beri microtask selesai
  await new Promise((r) => setTimeout(r, 30));
  return isi.innerHTML;
}

let gagal = 0;
function cek(nama, ok, detail = "") {
  if (ok) console.log(`  ✓ ${nama}${detail ? " — " + detail : ""}`);
  else {
    gagal++;
    console.error(`  ✗ GAGAL: ${nama}${detail ? " — " + detail : ""}`);
  }
}

console.log("\n=== Uji render rute ?ratib ===");
const html = await jalankanRute("?ratib");
cek("judul Ratib al-Haddad muncul", html.includes("Ratib al-Haddad"));
cek("43 kartu bacaan <article>", (html.match(/<article class="mj-ayah">/g) || []).length === 43);
cek("2 penanda bagian (Rangkaian Wirid + الدعاء)", html.includes("Rangkaian Wirid") && html.includes("الدع"));
cek("20 lencana 'dibaca 3×'", (html.match(/dibaca 3×/g) || []).length === 20);
cek("catatan tashih draft tampil", html.includes("mj-tashih-note") && html.includes("menunggu tashih"));
cek("kartu sumber & atribusi tampil", html.includes("mj-sumber") && html.includes("Quran NU Online") && html.includes("Ahmad Mundzir") && html.includes("Muhammad Aiz Luthfi") && html.includes("Mahbib Khoiron"));
cek("tanpa bocoran undefined/[object Object]", !/undefined|\[object Object\]/.test(html));
cek("semua teks Arab punya dir=rtl", (html.match(/<p class="mj-arabic" lang="ar" dir="rtl">/g) || []).length === 43);
const nomor = [...html.matchAll(/<span class="mj-ayah-badge">(\d+)<\/span>/g)].map((m) => +m[1]);
cek("nomor urut 1–43", nomor.length === 43 && nomor[0] === 1 && nomor[42] === 43);

console.log("\n=== Uji regresi rute ?dhuha ===");
const htmlDhuha = await jalankanRute("?dhuha");
cek("judul Dhuha tampil", htmlDhuha.includes("Dhuha"));
cek("2 versi doa dirender", (htmlDhuha.match(/mj-pill/g) || []).length >= 2);
cek("tanpa bocoran undefined", !/undefined|\[object Object\]/.test(htmlDhuha));

console.log("\n=== Uji rute tidak dikenal ===");
const htmlAsing = await jalankanRute("?ngawur");
cek("rute asing menampilkan pesan galat", htmlAsing.includes("tidak dikenal") || htmlAsing.includes("Data belum bisa dimuat"));

console.log(`\n${gagal === 0 ? "✅" : "❌"} Uji render: ${gagal === 0 ? "semua lolos" : gagal + " gagal"}\n`);
process.exit(gagal ? 1 : 0);
