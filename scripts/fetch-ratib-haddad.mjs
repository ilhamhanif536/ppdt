/**
 * ============================================================
 *  fetch-ratib-haddad.mjs
 *  Mengambil teks Ratib al-Haddad dari Quran NU Online
 *  (quran.nu.or.id) dan mengubahnya menjadi JSON terstruktur
 *  untuk halaman Majmu'.
 *
 *  Naskah acuan di situs sumber:
 *  "Majmû'ah Anwâriyyah, Maqrû-ât Yaumiyyah wa Usbû'iyyah"
 *  terbitan PP. al-Anwar, Sarang, Rembang.
 *
 *  Output: public/data/majmu/ratib-haddad.json
 *  Jalankan: node scripts/fetch-ratib-haddad.mjs
 *  Tanpa dependensi npm — memakai fetch bawaan Node 18+.
 *
 *  CATATAN PENTING: hasilnya ditandai status "draft_tashih".
 *  Wajib ditashih pengurus pondok terhadap naskah acuan sebelum
 *  disebarluaskan, lalu status diubah menjadi "terverifikasi".
 * ============================================================
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const SUMBER_URL = "https://quran.nu.or.id/wirid/ratib/ratib-al-haddad";
const OUT = path.join(process.cwd(), "public", "data", "majmu", "ratib-haddad.json");

const decodeEntity = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();

const bersih = (html) => decodeEntity(html.replace(/<[^>]+>/g, "").replace(/\s+/g, " "));

function ambilArtikel(html) {
  const m = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  if (!m) throw new Error("Elemen <article> tidak ditemukan — struktur halaman NU mungkin berubah.");
  return m[1];
}

function main() {
  return fetch(SUMBER_URL, { headers: { "User-Agent": "ppdt-majmu-builder/1.0" } })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} saat mengambil ${SUMBER_URL}`);
      return res.text();
    })
    .then((html) => {
      const artikel = ambilArtikel(html);

      // Ambil judul Arab (h3 pertama, mis. راتب الحدّاد)
      const judulArab = (artikel.match(/<h3[^>]*dir="rtl"[^>]*>([\s\S]*?)<\/h3>/) || [])[1];

      // Jalankan pemindaian berurutan: h3 penanda bagian dan triplet <p>
      const pola =
        /<h3[^>]*>([\s\S]*?)<\/h3>|<p class="fk[^"]*" dir="rtl">([\s\S]*?)<\/p>\s*<p class="mt-2 text-primary-600[^"]*">([\s\S]*?)<\/p>\s*<p class="mt-2 text-neutral-700[^"]*">([\s\S]*?)<\/p>/g;

      const bagian = [];
      let aktif = { judul: null, arab: null, items: [] };
      bagian.push(aktif);
      let cocok;
      while ((cocok = pola.exec(artikel)) !== null) {
        if (cocok[1] !== undefined) {
          const teksHeading = bersih(cocok[1]);
          // Lewati judul utama ratib; hanya bentuk ﴿...﴾ yang jadi penanda bagian
          if (/^﴿.*﴾$/.test(teksHeading)) {
            aktif = { judul: teksHeading.replace(/[﴿﴾]/g, "").trim(), arab: teksHeading, items: [] };
            bagian.push(aktif);
          }
          continue;
        }
        const arab = bersih(cocok[2]);
        const latin = bersih(cocok[3]);
        const terjemah = bersih(cocok[4]);
        const ulangMatch = arab.match(/[×x]\s*[٣3]/);
        aktif.items.push({
          id: aktif.items.length + 1,
          arab,
          latin,
          terjemah,
          ...(ulangMatch ? { ulang: 3 } : {}),
        });
      }

      const total = bagian.reduce((n, b) => n + b.items.length, 0);
      if (total !== 43) throw new Error(`Jumlah blok tidak sesuai: ${total} (diharapkan 43). Struktuk situs mungkin berubah.`);
      if (bagian.length !== 2) throw new Error(`Jumlah bagian tidak sesuai: ${bagian.length} (diharapkan 2).`);
      if (bagian.some((b) => b.items.some((it) => !it.arab || !it.latin || !it.terjemah)))
        throw new Error("Ada blok yang tidak lengkap (Arab/Latin/terjemah).");

      // Nomor id dibuat menerus antar-bagian
      let nomor = 0;
      bagian.forEach((b) => b.items.forEach((it) => (it.id = ++nomor)));

      const data = {
        judul: "Ratib al-Haddad",
        namaArab: judulArab ? bersih(judulArab) : "راتب الحدّاد",
        pemeliharaan:
          "File dibuat otomatis oleh scripts/fetch-ratib-haddad.mjs dari Quran NU Online. Jalankan ulang skrip untuk menyegarkan; suntingan manual akan tertimpa.",
        status: "draft_tashih",
        pengantar:
          "Ratib al-Haddad disusun oleh al-Habib Abdullah bin 'Alawi bin Muhammad al-Haddad (1044–1132 H) sebagai wirid perlindungan dan rahmat, dan diamalkan rutin ba'da Maghrib hari Minggu di lingkungan pondok.",
        sumber: {
          nama: "Quran NU Online — Ratib al-Haddad",
          url: SUMBER_URL,
          naskahAcuan:
            "Majmû'ah Anwâriyyah, Maqrû-ât Yaumiyyah wa Usbû'iyyah, PP. al-Anwar, Sarang, Rembang",
          penyalinPenerjemah: "Ahmad Mundzir",
          pentransliterasi: "Muhammad Aiz Luthfi",
          editor: "Mahbib Khoiron",
          diambil: new Date().toISOString().slice(0, 10),
        },
        catatanTashih:
          "Teks hasil penarikan otomatis dari situs sumber. Bandingkan huruf, harakat, dan jumlah pengulangan dengan naskah acuan pondok sebelum menandai status menjadi 'terverifikasi'.",
        bagian,
      };

      return mkdir(path.dirname(OUT), { recursive: true }).then(() =>
        writeFile(OUT, JSON.stringify(data, null, 2) + "\n", "utf8")
      );
    })
    .then(() => {
      console.log("✓ ratib-haddad.json diperbarui (43 bacaan, 2 bagian, status draft_tashih)");
      console.log("  Output:", OUT);
    });
}

main().catch((err) => {
  console.error("Gagal mengambil Ratib al-Haddad:", err.message);
  process.exit(1);
});
