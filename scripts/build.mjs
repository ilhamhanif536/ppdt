import { cp, mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "dist");
await mkdir(out, { recursive: true });
await cp(path.join(root, "src"), out, { recursive: true });
await cp(path.join(root, "public"), out, { recursive: true });

const siteUrl = (process.env.SITE_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || "").replace(/\/+$/, "");
if (!siteUrl) {
  console.warn("WARNING: Set SITE_URL to your canonical HTTPS domain in Netlify environment variables before production deployment.");
}
const canonicalBase = siteUrl || "https://replace-with-your-domain.invalid";

async function replaceCanonical(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await replaceCanonical(full);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      const html = await readFile(full, "utf8");
      await writeFile(full, html.replaceAll("__SITE_URL__", canonicalBase), "utf8");
    }
  }
}
await replaceCanonical(out);

const pages = [
  "/", "/profil/", "/pendidikan/", "/kegiatan/", "/prestasi/", "/berita/", "/koperasi/", "/organisasi/", "/kontak/"
];
const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
pages.map((p) => `  <url><loc>${canonicalBase}${p}</loc><lastmod>${today}</lastmod></url>`).join("\n") +
`\n</urlset>\n`;
await writeFile(path.join(out, "sitemap.xml"), xml, "utf8");
const robots = `User-agent: *\nAllow: /\nSitemap: ${canonicalBase}/sitemap.xml\n`;
await writeFile(path.join(out, "robots.txt"), robots, "utf8");
console.log(`Built static site into dist/ using canonical base: ${canonicalBase}`);
