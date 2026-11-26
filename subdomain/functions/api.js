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
