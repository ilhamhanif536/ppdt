/**
 * Build script — Darut Thalibin Telang
 * Merakit halaman dari partials + data pusat, fingerprint aset, sitemap, robots.
 * Tanpa dependensi npm eksternal (Node.js 18+).
 */
import { cp, mkdir, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import siteData from "../src/_data/site-data.mjs";

const root = process.cwd();
const src = path.join(root, "src");
const out = path.join(root, "dist");

/* ---------------------------------- utils --------------------------------- */
const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const initialsOf = (nama = "") => {
  const parts = nama.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
};

const hash8 = (content) => crypto.createHash("md5").update(content).digest("hex").slice(0, 8);

/* ------------------------------ site URL ---------------------------------- */
const siteUrl = (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || "").replace(/\/+$/, "");
if (!siteUrl) {
  console.warn("WARNING: SITE_URL belum diatur. Canonical memakai placeholder — wajib diisi di Netlify sebelum produksi.");
}
const SITE_URL = siteUrl || "https://darutthalibin.web.id";

/* ------------------------------ partials ---------------------------------- */
const partial = async (name) => readFile(path.join(src, "_includes", name), "utf8");
const [headTpl, headerTpl, footerTpl] = await Promise.all([
  partial("head.html"), partial("header.html"), partial("footer.html"),
]);

/* ------------------------------ renderers --------------------------------- */
function renderNav(currentPath) {
  return siteData.menuUtama
    .map((item) => {
      const children = item.children || [];
      if (!children.length) {
        const isCurrent = item.path === currentPath;
        return `<a class="nav-link" href="${item.path}"${isCurrent ? ' aria-current="page"' : ""}>${esc(item.label)}</a>`;
      }
      const isCurrentGroup =
        item.path === currentPath || children.some((c) => c.path === currentPath);
      const caret = `<svg class="caret" viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const childLinks = children
        .map((c) => {
          const cur = c.path === currentPath;
          return `<a href="${c.path}"${cur ? ' aria-current="page"' : ""}><strong>${esc(c.label)}</strong>${c.desc ? `<span>${esc(c.desc)}</span>` : ""}</a>`;
        })
        .join("");
      return `<div class="nav-item has-sub${isCurrentGroup ? " current" : ""}"><button class="nav-link sub-toggle" type="button" aria-expanded="false" aria-haspopup="true">${esc(item.label)}${caret}</button><div class="sub-menu">${childLinks}</div></div>`;
    })
    .join("");
}

function renderSocialLinks() {
  const s = siteData.sosial || {};
  const items = [
    ["instagram", s.instagram, "Instagram"],
    ["facebook", s.facebook, "Facebook"],
    ["youtube", s.youtube, "YouTube"],
    ["tiktok", s.tiktok, "TikTok"],
  ].filter(([, url]) => url);
  if (!items.length) return "";
  return items
    .map(
      ([, url, label]) =>
        `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${label} resmi ${esc(siteData.namaPondok)}"><span>${label}</span></a>`
    )
    .join("");
}

function renderOrgSections() {
  const sections = (siteData.organisasi || []).filter((sec) => sec.anggota && sec.anggota.length);
  if (!sections.length) return "";
  return sections
    .map((sec) => {
      const cards = sec.anggota
        .map((a) => {
          const hasName = Boolean(a.nama && a.nama.trim());
          const initials = hasName ? initialsOf(a.nama) : "—";
          return `<article class="org-card${hasName ? "" : " org-card--pending"}">
            <div class="org-avatar" aria-hidden="true">${esc(initials)}</div>
            <h3>${esc(hasName ? a.nama : a.jabatan)}</h3>
            <p>${esc(hasName ? a.jabatan : "Akan diumumkan")}</p>
          </article>`;
        })
        .join("");
      return `<div class="org-section">
        <div class="org-head"><h2>${esc(sec.judul)}</h2><p>${esc(sec.keterangan || "")}</p></div>
        <div class="org-grid">${cards}</div>
      </div>`;
    })
    .join("");
}

function renderJadwal() {
  const list = siteData.jadwalKajian || [];
  if (!list.length) return "";
  // Kelompokkan berdasarkan "waktu" (mis. Ba'da Subuh / Ba'da Maghrib),
  // urutan mengikuti kemunculan pertama di data.
  const groups = [];
  const byWaktu = new Map();
  for (const j of list) {
    const key = j.waktu || "Jadwal Rutin";
    if (!byWaktu.has(key)) {
      const g = { waktu: key, rows: [] };
      byWaktu.set(key, g);
      groups.push(g);
    }
    byWaktu.get(key).rows.push(j);
  }
  const blocks = groups
    .map(
      (g) => `<div class="schedule-group">
        <h3 class="schedule-group-title">${esc(g.waktu)}</h3>
        <div class="schedule-table">
          ${g.rows
            .map((j) => {
              const alt = /alternatif/i.test(j.hari);
              return `<div class="schedule-row${alt ? " schedule-row--alt" : ""}">
                <span class="schedule-day">${esc(j.hari)}</span>
                <div class="schedule-main"><strong>${esc(j.materi)}</strong>${j.pemateri ? `<span>${esc(j.pemateri)}</span>` : ""}</div>
              </div>`;
            })
            .join("")}
        </div>
      </div>`
    )
    .join("");
  const note = siteData.jadwalCatatan
    ? `<p class="schedule-note">${esc(siteData.jadwalCatatan)}</p>`
    : "";
  return `<div class="schedule-groups">${blocks}</div>${note}`;
}

function renderKontakItems() {
  const k = siteData.kontak || {};
  const tel = k.telepon ? `tel:${String(k.telepon).replace(/[^+\d]/g, "")}` : "";
  const wa = k.whatsapp ? `https://wa.me/${String(k.whatsapp).replace(/\D/g, "")}` : "";
  const items = [];
  items.push(
    `<div class="contact-item"><div class="contact-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="1.7"/></svg></div><div><h3>Alamat</h3><p>${esc(k.alamat || "Alamat resmi akan diperbarui.")}</p>${
      k.petaQuery ? `<p class="contact-link"><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(k.petaQuery)}" target="_blank" rel="noopener">Lihat di Google Maps</a></p>` : ""
    }</div></div>`
  );
  if (tel)
    items.push(
      `<div class="contact-item"><div class="contact-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg></div><div><h3>Telepon</h3><p><a href="${esc(tel)}">${esc(k.telepon)}</a></p></div></div>`
    );
  if (wa)
    items.push(
      `<div class="contact-item"><div class="contact-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8.8 9.2c.3 2.4 3.6 5.7 6 6l1.3-1.3c.3-.3.2-.8-.1-1l-1.7-.9-.9.9c-1-.4-2-1.4-2.4-2.4l.9-.9-.9-1.7c-.2-.3-.7-.4-1-.1L8.8 9.2Z" fill="currentColor"/></svg></div><div><h3>WhatsApp</h3><p><a href="${esc(wa)}" target="_blank" rel="noopener">${esc(k.whatsapp)}</a></p></div></div>`
    );
  if (k.email)
    items.push(
      `<div class="contact-item"><div class="contact-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.7"/><path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div><h3>Email</h3><p><a href="mailto:${esc(k.email)}">${esc(k.email)}</a></p></div></div>`
    );
  items.push(
    `<div class="contact-item"><div class="contact-ico" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></div><div><h3>Jam Layanan</h3><p>${esc(k.jamLayanan || "Akan diumumkan.")}</p></div></div>`
  );
  return `<div class="contact-list">${items.join("")}</div>`;
}

function renderMap() {
  const q = siteData.kontak?.petaQuery;
  if (!q) return "";
  return `<div class="map-wrap">
    <iframe title="Peta lokasi ${esc(siteData.namaPondok)}" src="https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
    <p class="small map-note">Titik pada peta menunjukkan area pondok; koordinat pasti akan diperbarui setelah diverifikasi.</p>
  </div>`;
}

function renderWaFloat() {
  const wa = String(siteData.kontak?.whatsapp || "").replace(/\D/g, "");
  if (!wa) return "";
  const text = encodeURIComponent("Assalamu'alaikum, saya ingin bertanya tentang Pondok Pesantren Darut Thalibin Telang.");
  return `<a class="wa-float" href="https://wa.me/${wa}?text=${text}" target="_blank" rel="noopener" aria-label="Hubungi kami melalui WhatsApp">
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.7-1.2A9 9 0 1 0 12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.8 9.2c.3 2.4 3.6 5.7 6 6l1.3-1.3c.3-.3.2-.8-.1-1l-1.7-.9-.9.9c-1-.4-2-1.4-2.4-2.4l.9-.9-.9-1.7c-.2-.3-.7-.4-1-.1L8.8 9.2Z" fill="currentColor"/></svg>
  </a>`;
}

function renderGa4() {
  const id = (siteData.ga4Id || "").trim();
  if (!id) return "";
  return `\n<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(id)}"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${esc(id)}');</script>`;
}

function renderJsonld() {
  const k = siteData.kontak || {};
  const sameAs = Object.values(siteData.sosial || {}).filter(Boolean);
  const org = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: siteData.namaPanjang,
    alternateName: siteData.namaPondok,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/images/logo-pondok.png`,
    image: `${SITE_URL}/images/og-image.png`,
    description: siteData.deskripsi,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jln. Masjid Telang Indah, RT.02/RW.03, Desa Telang",
      addressLocality: "Kamal",
      addressRegion: "Jawa Timur",
      addressCountry: "ID",
    },
    identifier: `NSP ${siteData.nsp}`,
  };
  if (sameAs.length) org.sameAs = sameAs;
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteData.namaPanjang,
    url: `${SITE_URL}/`,
    inLanguage: "id-ID",
  };
  return JSON.stringify([org, website]).replace(/</g, "\\u003c");
}

/* --------------------------- page collection ------------------------------ */
async function collectPages(dir, prefix = "") {
  const found = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name === "assets") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await collectPages(full, `${prefix}/${entry.name}`)));
    } else if (entry.isFile() && entry.name === "index.html") {
      let route = prefix ? `${prefix}/` : "/";
      if (route === "/404/") route = "/404"; // halaman 404 keluaran tunggal
      found.push({ file: full, route });
    }
  }
  return found;
}

function parseMeta(html, file) {
  const m = html.match(/^\s*<!--\s*(\{[\s\S]*?\})\s*-->/);
  if (!m) throw new Error(`Meta JSON tidak ditemukan di awal file: ${file}`);
  try {
    return JSON.parse(m[1]);
  } catch (e) {
    throw new Error(`Meta JSON tidak valid di ${file}: ${e.message}`);
  }
}

const RENDERERS = {
  ORGANISASI: renderOrgSections,
  JADWAL: renderJadwal,
  KONTAK_ITEMS: renderKontakItems,
  MAP: renderMap,
  SOCIAL_LINKS: renderSocialLinks,
};

/* --------------------------------- build ---------------------------------- */
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(src, "assets"), path.join(out, "assets"), { recursive: true });
// public/images/* → dist/images/*  dan  public/favicon.svg → dist/favicon.svg
if (existsSync(path.join(root, "public", "images"))) {
  await cp(path.join(root, "public", "images"), path.join(out, "images"), { recursive: true });
}
if (existsSync(path.join(root, "public", "favicon.svg"))) {
  await cp(path.join(root, "public", "favicon.svg"), path.join(out, "favicon.svg"));
}

// fingerprint CSS & JS
const css = await readFile(path.join(out, "assets", "site.css"), "utf8");
const js = await readFile(path.join(out, "assets", "site.js"), "utf8");
const cssHash = hash8(css);
const jsHash = hash8(js);
const CSS_FILE = `/assets/site.${cssHash}.css`;
const JS_FILE = `/assets/site.${jsHash}.js`;
await writeFile(path.join(out, "assets", `site.${cssHash}.css`), css, "utf8");
await writeFile(path.join(out, "assets", `site.${jsHash}.js`), js, "utf8");
await rm(path.join(out, "assets", "site.css"));
await rm(path.join(out, "assets", "site.js"));

const pages = await collectPages(src);
if (!pages.some((p) => p.route === "/")) throw new Error("Halaman beranda (src/index.html) tidak ditemukan.");
if (!pages.some((p) => p.route === "/404")) console.warn("Peringatan: halaman 404 (src/404/index.html) tidak ditemukan.");

for (const page of pages) {
  const raw = await readFile(page.file, "utf8");
  const meta = parseMeta(raw, path.relative(src, page.file));
  const body = raw.replace(/^\s*<!--\s*\{[\s\S]*?\}\s*-->/, "").trim();

  let content = body;
  for (const [token, fn] of Object.entries(RENDERERS)) {
    content = content.replaceAll(`{{${token}}}`, fn());
  }

  const nav = renderNav(page.route);
  const waFloat = renderWaFloat();
  const ga4 = renderGa4();
  const jsonld = renderJsonld();

  const socialLinks = renderSocialLinks();
  const alamatFooter = siteData.kontak?.alamat ? esc(siteData.kontak.alamat) : esc(siteData.lokasiSingkat);
  const petaQueryEnc = encodeURIComponent(siteData.kontak?.petaQuery || siteData.namaPanjang);

  const html = `<!doctype html>
<html lang="id">
<head>
${headTpl}
</head>
<body>
${headerTpl}
<main id="main">
${content}
</main>
${footerTpl}`;

  const final = html
    .replaceAll("{{PAGE_TITLE}}", esc(meta.title))
    .replaceAll("{{PAGE_DESCRIPTION}}", esc(meta.description))
    .replaceAll("{{PAGE_PATH}}", esc(page.route))
    .replaceAll("{{SITE_URL}}", SITE_URL)
    .replaceAll("{{SITE_NAME}}", esc(siteData.namaPondok))
    .replaceAll("{{SITE_NAME_LONG}}", esc(siteData.namaPanjang))
    .replaceAll("{{SITE_LOKASI}}", esc(siteData.lokasiSingkat))
    .replaceAll("{{SK_BADAN}}", esc(siteData.skBadanHukum))
    .replaceAll("{{NSP}}", esc(siteData.nsp))
    .replaceAll("{{ALAMAT_FOOTER}}", alamatFooter)
    .replaceAll("{{PETA_QUERY_ENC}}", petaQueryEnc)
    .replaceAll("{{SOCIAL_LINKS}}", socialLinks)
    .replaceAll("{{WA_FLOAT}}", waFloat)
    .replaceAll("{{GA4}}", ga4)
    .replaceAll("{{JSONLD}}", jsonld)
    .replaceAll("{{NAV_ITEMS}}", nav)
    .replaceAll("{{CSS_FILE}}", CSS_FILE)
    .replaceAll("{{JS_FILE}}", JS_FILE);

  // route → path keluaran
  let destRel;
  if (page.route === "/") destRel = "index.html";
  else if (page.route === "/404") destRel = "404.html";
  else destRel = `${page.route.slice(1)}/index.html`;

  const dest = path.join(out, destRel);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, final, "utf8");
}

/* ------------------------------ sitemap & robots --------------------------- */
const sitemapRoutes = pages.filter((p) => p.route !== "/404").map((p) => p.route);
const today = new Date().toISOString().slice(0, 10);
const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  sitemapRoutes
    .map((r) => `  <url><loc>${SITE_URL}${r === "/" ? "/" : r}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${r === "/" ? "1.0" : "0.7"}</priority></url>`)
    .join("\n") +
  `\n</urlset>\n`;
await writeFile(path.join(out, "sitemap.xml"), xml, "utf8");
await writeFile(
  path.join(out, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
  "utf8"
);

console.log(`Build OK → dist/ (${pages.length} halaman) · CSS ${CSS_FILE} · JS ${JS_FILE}`);
if (!siteUrl) console.warn("Pengingat: set environment variable SITE_URL di Netlify.");
