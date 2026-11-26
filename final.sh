#!/bin/bash
# JALANKAN DI CODESPACES - ROOT REPO ilhamhanif536/ppdt (branch main)
# Sudah live di Cloudflare, jadi kita update main langsung (auto-deploy)
set -e
git checkout main
git pull origin main

echo "1. Update public/_headers (web utama)"
mkdir -p public
cat > public/_headers <<'EOF'
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=86400, must-revalidate

/data/*
  Cache-Control: public, max-age=3600, must-revalidate
EOF

echo "2. Patch scripts/build.mjs"
cp scripts/build.mjs scripts/build.mjs.bak
python3 << 'PY'
import pathlib
p = pathlib.Path('scripts/build.mjs')
t = p.read_text()
old = 'if (existsSync(path.join(root, "public", "data"))) {\n  await cp(path.join(root, "public", "data"), path.join(out, "data"), { recursive: true });\n}'
new = old + '\n// Cloudflare Pages: copy _headers\nif (existsSync(path.join(root, "public", "_headers"))) {\n  await cp(path.join(root, "public", "_headers"), path.join(out, "_headers"));\n}'
if old in t and 'public", "_headers"' not in t:
    p.write_text(t.replace(old, new))
    print("✓ build.mjs patched")
else:
    print("✓ build.mjs sudah ada / skip")
PY

echo "3. Update subdomain/functions/api.js"
mkdir -p subdomain/functions
cat > subdomain/functions/api.js <<'EOF'
/**
 * PPDT — Cloudflare Pages Functions
 * Migrasi dari netlify/functions/api.js
 */
const AKSI_GET = ['dashboard', 'tes', 'alamat'];
const POLA_TOKEN = /^[a-f0-9]{16,40}$/;
const POLA_BULAN = /^\d{4}-\d{2}$/;
const POLA_AKSI = /^[A-Za-z][A-Za-z0-9_]{2,48}$/;
const BATAS_BADAN = 6 * 1024 * 1024;
const jejak = new Map();
const BATAS_PER_MENIT = 60;
function terlaluSering(ip) {
  const sekarang = Date.now();
  const c = jejak.get(ip) || { n: 0, mulai: sekarang };
  if (sekarang - c.mulai > 60000) { c.n = 0; c.mulai = sekarang; }
  c.n += 1; jejak.set(ip, c);
  if (jejak.size > 500) jejak.clear();
  return c.n > BATAS_PER_MENIT;
}
function jsonResponse(status, obj, extraHeaders) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', ...(extraHeaders||{}) }});
}
function alamatGas(env) { return env.GAS_URL && env.GAS_KEY ? { url: env.GAS_URL, key: env.GAS_KEY } : null; }
async function panggilGas(tujuan, metode, isiBadan, kunci) {
  const kendali = new AbortController(); const batas = setTimeout(()=>kendali.abort(),20000);
  const url = tujuan.url + (tujuan.url.includes('?')?'&':'?') + 'key='+encodeURIComponent(kunci)+'&asal=situs';
  try {
    const opsi = { method: metode, redirect: 'follow', signal: kendali.signal, headers: { 'Accept': 'application/json' } };
    if (metode==='POST') { opsi.headers['Content-Type']='application/json'; opsi.body=isiBadan; }
    const resp = await fetch(url, opsi); clearTimeout(batas);
    const teks = await resp.text();
    if (teks.trim()[0]==='<') return { status:502, isi:{ ok:false, error:'balasan_bukan_json', pesan:'Apps Script deployment salah. Execute as Me, Anyone.' }};
    try { return { status:200, isi: JSON.parse(teks) }; } catch(e){ return { status:502, isi:{ ok:false, error:'json_rusak', pesan:teks.slice(0,200) }}}
  } catch(err){ clearTimeout(batas); const habis=err?.name==='AbortError'; return { status:habis?504:502, isi:{ ok:false, error:habis?'gas_terlalu_lama':'gas_gagal', pesan:habis?'Timeout 20s':String(err.message||err)}}}
}
export async function onRequest(context){
  const { request, env } = context; const urlObj = new URL(request.url);
  if (request.method==='OPTIONS') return new Response('',{status:204, headers:{ Allow:'GET, POST, OPTIONS'}});
  const ip = request.headers.get('cf-connecting-ip') || (request.headers.get('x-forwarded-for')||'lokal').split(',')[0].trim();
  if (terlaluSering(ip)) return jsonResponse(429,{ ok:false, error:'terlalu_banyak_permintaan'});
  const tujuan = alamatGas(env); if (!tujuan) return jsonResponse(500,{ ok:false, error:'belum_dikonfigurasi', pesan:'GAS_URL/GAS_KEY belum diisi di Cloudflare'});
  if (request.method==='GET'){
    const aksi = String(urlObj.searchParams.get('action')||'dashboard');
    if (!AKSI_GET.includes(aksi)) return jsonResponse(400,{ ok:false, error:'aksi_tidak_dikenal'});
    if (aksi==='alamat') return jsonResponse(200,{ ok:true, url: env.GAS_URL});
    if (aksi==='tes'){ const r=await panggilGas(tujuan,'GET',null,tujuan.key); return jsonResponse(r.status,r.isi); }
    const token=String(urlObj.searchParams.get('t')||''), bulan=String(urlObj.searchParams.get('bulan')||'');
    if (!POLA_TOKEN.test(token)) return jsonResponse(401,{ ok:false, error:'token_tidak_valid'});
    if (bulan && !POLA_BULAN.test(bulan)) return jsonResponse(400,{ ok:false, error:'bulan_tidak_valid'});
    const urlDashboard = tujuan.url + (tujuan.url.includes('?')?'&':'?') + 'action=dashboard&key='+encodeURIComponent(tujuan.key)+'&t='+encodeURIComponent(token)+(bulan?'&bulan='+encodeURIComponent(bulan):'');
    const k=new AbortController(), b=setTimeout(()=>k.abort(),20000);
    try{ const resp=await fetch(urlDashboard,{redirect:'follow', signal:k.signal}); clearTimeout(b); const teks=await resp.text(); if(teks.trim()[0]==='<') return jsonResponse(502,{ok:false, error:'balasan_bukan_json'}); return jsonResponse(200, JSON.parse(teks), {'Cache-Control':'public, max-age=30, s-maxage=60'}); }catch(e){ clearTimeout(b); return jsonResponse(502,{ok:false, error:'gas_gagal', pesan:String(e.message||e)})}
  }
  if (request.method==='POST'){
    const isi=await request.text(); if(!isi) return jsonResponse(400,{ok:false, error:'badan_kosong'}); if(isi.length>BATAS_BADAN) return jsonResponse(413,{ok:false, error:'badan_terlalu_besar'});
    let p; try{ p=JSON.parse(isi)}catch{ return jsonResponse(400,{ok:false, error:'json_rusak'})}
    const aksi=String(p.action||''); if(!POLA_AKSI.test(aksi)) return jsonResponse(400,{ok:false, error:'aksi_tidak_valid'});
    const r=await panggilGas(tujuan,'POST', JSON.stringify({action:aksi, args:Array.isArray(p.args)?p.args:[]}), tujuan.key);
    return jsonResponse(r.status,r.isi);
  }
  return jsonResponse(405,{ ok:false, error:'metode_tidak_diizinkan'});
}
EOF

echo "4. Update subdomain/public/_headers"
cat > subdomain/public/_headers <<'EOF'
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'

/index.html
  Cache-Control: public, max-age=0, must-revalidate

/api
  Cache-Control: no-store
EOF

echo ""
echo "Test build..."
npm run build
ls -lh dist/_headers && echo "✓ dist/_headers OK"

echo ""
git add public/_headers scripts/build.mjs subdomain/functions/api.js subdomain/public/_headers
git status
git commit -m "Update kode untuk Cloudflare Pages (headers + functions/api)"
git push origin main
echo ""
echo "Selesai — Cloudflare akan auto-deploy dalam 1-2 menit. Cek di Pages > Deployments"

