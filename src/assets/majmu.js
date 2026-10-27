/* ============================================================
   MAJMU.JS — Majmu' Darut Thalibin Telang
   Tanpa dependensi, tanpa audio (fokus pada pembaca teks yang
   ringan). Teks surah diambil dari EQuran.id API v2 (gratis,
   tanpa API key), field audio dibuang lalu sisanya disimpan di
   localStorage; tahlil, dzikir, dan dhuha dibaca dari JSON lokal
   (/data/majmu).
   ============================================================ */
(function () {
  "use strict";

  var API_V2 = "https://equran.id/api/v2";
  var DATA = "/data/majmu";
  var LS = {
    prefs: "ppdt:majmu:prefs",
    surah: function (n) { return "ppdt:majmu:surah:" + n; },
    lanjut: "ppdt:majmu:lanjut",
  };

  /* ---------------- utilitas ---------------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function stripHtml(s) { return String(s || "").replace(/<[^>]*>/g, ""); }
  function storeGet(key) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch (e) { return null; }
  }
  function storeSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* kuota penuh / mode privat */ }
  }
  function tanggal(iso) {
    try { return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); }
    catch (e) { return iso; }
  }

  var prefs = Object.assign(
    { latin: true, terjemah: true, arSize: "sedang" },
    storeGet(LS.prefs) || {}
  );
  function simpanPrefs() { storeSet(LS.prefs, prefs); }

  /* ============================================================
     BERANDA /majmu/ — kartu "lanjutkan membaca"
     ============================================================ */
  var homeEl = document.querySelector("[data-majmu-home]");
  if (homeEl) {
    var lanjut = storeGet(LS.lanjut);
    if (lanjut && lanjut.url) {
      var box = homeEl.querySelector("[data-lanjut]");
      if (box) {
        box.querySelector("[data-lanjut-label]").textContent = lanjut.label;
        box.querySelector("[data-lanjut-detail]").textContent = "Lanjutkan bacaan Anda";
        box.href = lanjut.url;
        box.hidden = false;
      }
    }
  }

  /* ============================================================
     PEMBACA /majmu/baca/
     ============================================================ */
  var app = document.querySelector("[data-majmu-app]");
  if (!app) return;

  var params = new URLSearchParams(location.search);
  var jenis = params.has("surah") ? "surah"
    : params.has("tahlil") ? "tahlil"
    : params.has("dzikir") ? "dzikir"
    : params.has("dhuha") ? "dhuha"
    : params.has("ratib") ? "ratib" : null;
  var nomorSurah = parseInt(params.get("surah"), 10);

  var isiEl = app.querySelector("[data-isi]");
  var toolbarTitle = app.querySelector("[data-toolbar-title]");

  /* ---------------- preferensi tampilan ---------------- */
  function terapkanPrefs() {
    app.classList.toggle("no-latin", !prefs.latin);
    app.classList.toggle("no-terjemah", !prefs.terjemah);
    app.style.setProperty("--mj-ar-size",
      prefs.arSize === "kecil" ? "1.55rem" : prefs.arSize === "besar" ? "2.2rem" : "1.85rem");
    app.querySelectorAll("[data-toggle-latin]").forEach(function (b) { b.classList.toggle("is-on", prefs.latin); });
    app.querySelectorAll("[data-toggle-terjemah]").forEach(function (b) { b.classList.toggle("is-on", prefs.terjemah); });
    app.querySelectorAll("[data-size]").forEach(function (b) { b.classList.toggle("is-on", b.dataset.size === prefs.arSize); });
    simpanPrefs();
  }
  app.querySelector("[data-toggle-latin]").addEventListener("click", function () {
    prefs.latin = !prefs.latin; terapkanPrefs();
  });
  app.querySelector("[data-toggle-terjemah]").addEventListener("click", function () {
    prefs.terjemah = !prefs.terjemah; terapkanPrefs();
  });
  app.querySelectorAll("[data-size]").forEach(function (b) {
    b.addEventListener("click", function () { prefs.arSize = b.dataset.size; terapkanPrefs(); });
  });
  terapkanPrefs();

  /* ---------------- status memuat / galat ---------------- */
  function statusMemuat(pesan) {
    isiEl.innerHTML = '<div class="mj-status"><div class="mj-spin" aria-hidden="true"></div><h2>Memuat…</h2><p>' + esc(pesan) + "</p></div>";
  }
  function statusGalat(pesan, adaRetry) {
    isiEl.innerHTML = '<div class="mj-status"><h2>Data belum bisa dimuat</h2><p>' + esc(pesan) +
      '</p><div class="hero-actions" style="justify-content:center">' +
      (adaRetry ? '<button class="button" type="button" data-retry>Coba lagi</button>' : "") +
      ' <a class="button secondary" href="/majmu/">Kembali ke daftar isi</a></div></div>';
    var r = isiEl.querySelector("[data-retry]");
    if (r) r.addEventListener("click", muat);
  }

  /* ---------------- komponen kartu ayah/bacaan ---------------- */
  function tombolShare(teks) {
    return '<button class="mj-icon-btn" type="button" data-share="' + encodeURIComponent(teks) +
      '" aria-label="Bagikan teks ini"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="18" cy="5" r="2.6" stroke="currentColor" stroke-width="1.8"/><circle cx="6" cy="12" r="2.6" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="19" r="2.6" stroke="currentColor" stroke-width="1.8"/><path d="m8.4 10.7 7.2-4.2M8.4 13.3l7.2 4.2" stroke="currentColor" stroke-width="1.8"/></svg></button>';
  }
  isiEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-share]");
    if (!b) return;
    var teks = decodeURIComponent(b.dataset.share);
    if (navigator.share) navigator.share({ title: "Majmu' Darut Thalibin", text: teks }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(teks).then(function () {
      var lama = b.getAttribute("aria-label");
      b.setAttribute("aria-label", "Tersalin!");
      setTimeout(function () { b.setAttribute("aria-label", lama); }, 1600);
    });
  });

  /* ---------------- render: SURAH ---------------- */
  function renderSurah(data, dariCache, ts) {
    toolbarTitle.textContent = data.namaLatin;
    document.title = "QS " + data.namaLatin + " — Majmu' Darut Thalibin";
    app.querySelector("[data-refresh]").style.display = "";

    var html = '<header class="mj-surah-head">' +
      '<div class="mj-ar-name">' + esc(data.nama) + "</div>" +
      "<h1>QS " + esc(data.namaLatin) + "</h1>" +
      "<p>" + esc(data.arti) + "</p>" +
      '<div class="mj-surah-meta"><span>' + esc(data.tempatTurun) + "</span><span>" +
      data.jumlahAyat + " ayat</span><span>Surah ke-" + data.nomor + "</span></div></header>" +
      '<div class="mj-bismillah">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</div>';

    html += data.ayat.map(function (a) {
      var teksShare = "QS " + data.namaLatin + " [" + data.nomor + ":" + a.nomorAyat + "]\n" +
        a.teksArab + '\n"' + a.teksIndonesia + '"';
      return '<article class="mj-ayah">' +
        '<div class="mj-ayah-head"><span class="mj-ayah-badge">' + a.nomorAyat + "</span>" +
        '<span class="mj-ayah-title">Ayat ' + a.nomorAyat + "</span>" +
        '<span class="mj-ayah-actions">' + tombolShare(teksShare) + "</span></div>" +
        '<p class="mj-arabic" lang="ar" dir="rtl">' + esc(a.teksArab) + "</p>" +
        '<p class="mj-latin" lang="la">' + esc(a.teksLatin) + "</p>" +
        '<p class="mj-terjemah">' + esc(a.teksIndonesia) + "</p></article>";
    }).join("");

    if (dariCache) {
      html += '<p class="mj-cache-note">✓ Membaca salinan tersimpan (diperbarui ' + esc(tanggal(ts)) +
        '). Tekan "Segarkan" untuk mengambil versi terbaru.</p>';
    }
    html += kartuSumber([
      ['Teks Arab, Latin, dan terjemah — <a href="https://equran.id/apidev/v2" target="_blank" rel="noopener">EQuran.id API v2</a> (data Kementerian Agama RI)'],
    ]);
    isiEl.innerHTML = html;

    storeSet(LS.lanjut, {
      url: location.pathname + "?surah=" + nomorSurah,
      label: "QS " + data.namaLatin,
    });
  }

  async function muatSurah(paksaSegar) {
    var cache = storeGet(LS.surah(nomorSurah));
    if (cache && !paksaSegar) {
      renderSurah(cache.data, true, cache.ts);
      return;
    }
    statusMemuat("Mengambil teks surah dari EQuran.id…");
    try {
      var res = await fetch(API_V2 + "/surat/" + nomorSurah);
      if (!res.ok) throw new Error("HTTP " + res.status);
      var json = await res.json();
      if (!json.data || !json.data.ayat) throw new Error("Struktur data tidak sesuai");
      // Buang field audio agar salinan di perangkat jauh lebih ringan
      var data = json.data;
      delete data.audioFull;
      data.ayat.forEach(function (a) { delete a.audio; });
      storeSet(LS.surah(nomorSurah), { ts: new Date().toISOString(), data: data });
      renderSurah(data, false);
    } catch (err) {
      if (cache) { renderSurah(cache.data, true, cache.ts); return; } // fallback offline
      statusGalat("Periksa koneksi internet Anda, lalu coba lagi. Salinan tersimpan akan dipakai otomatis bila sudah pernah dibuka.", true);
    }
  }
  app.querySelector("[data-refresh]").addEventListener("click", function () {
    if (jenis === "surah") muatSurah(true);
  });

  /* ---------------- render: TAHLIL ---------------- */
  function renderTahlil(d) {
    toolbarTitle.textContent = "Tahlil & Doa Arwah";
    document.title = "Tahlil & Doa Arwah — Majmu' Darut Thalibin";
    var html = '<header class="mj-surah-head"><div class="mj-ar-name">التَّهْلِيلُ</div>' +
      "<h1>Tahlil &amp; Doa Arwah</h1><p>Susunan bacaan tahlil lengkap, Arab dan terjemah.</p>" +
      '<div class="mj-surah-meta"><span>' + d.result.length + " bacaan</span><span>Berbasis Majmu' Syarif</span></div></header>";
    html += d.result.map(function (it) {
      return '<div class="mj-group-head"><h2>' + esc(it.title) + '</h2><span class="mj-line"></span>' +
        '<span class="mj-ayah-badge">' + it.id + "</span></div>" +
        '<article class="mj-ayah"><p class="mj-arabic" lang="ar" dir="rtl">' + esc(it.arabic) + "</p>" +
        '<p class="mj-terjemah">' + esc(it.translation) + "</p>" +
        '<span class="mj-ayah-actions" style="margin-left:auto;margin-top:12px">' +
        tombolShare(it.title + "\n" + it.arabic + "\n" + it.translation) + "</span></article>";
    }).join("");
    html += kartuSumber([
      ['Dataset tahlil — <a href="https://github.com/hirumisann/Data-Islamic-Json" target="_blank" rel="noopener">hirumisann/Data-Islamic-Json</a> (lisensi MIT), bersumber <a href="https://islam.nu.or.id/post/read/107344/susunan-bacaan-tahlil-doa-arwah-lengkap-dan-terjemahannya" target="_blank" rel="noopener">islam.nu.or.id</a>'],
    ]);
    isiEl.innerHTML = html;
  }

  /* ---------------- render: DZIKIR & DOA SHALAT ---------------- */
  function renderDzikir(d) {
    toolbarTitle.textContent = "Dzikir & Doa Seputar Shalat";
    document.title = d.judul + " — Majmu' Darut Thalibin";
    var html = '<header class="mj-surah-head"><div class="mj-ar-name">الذِّكْرُ وَالدُّعَاءُ</div>' +
      "<h1>" + esc(d.judul) + "</h1><p>Dzikir setelah shalat dan doa-doa terkait shalat, lengkap Arab, Latin, dan terjemah.</p></header>";
    d.grup.forEach(function (g) {
      html += '<div class="mj-group-head"><h2>' + esc(g.judul) + "</h2><span class=\"mj-line\"></span></div>";
      if (g.keterangan) html += '<p class="mj-group-desc">' + esc(g.keterangan) + "</p>";
      html += g.items.map(function (it, i) {
        return '<article class="mj-ayah"><div class="mj-ayah-head"><span class="mj-ayah-badge">' + (i + 1) + "</span>" +
          '<span class="mj-ayah-title">' + esc(it.nama) + "</span>" +
          '<span class="mj-ayah-actions">' + tombolShare(it.nama + "\n" + it.arab + "\n" + it.terjemah) + "</span></div>" +
          '<p class="mj-arabic" lang="ar" dir="rtl">' + esc(it.arab) + "</p>" +
          (it.latin ? '<p class="mj-latin" lang="la">' + esc(it.latin) + "</p>" : "") +
          '<p class="mj-terjemah">' + esc(it.terjemah) + "</p>" +
          (it.tentang ? '<p class="mj-tentang">' + esc(stripHtml(it.tentang)) + "</p>" : "") +
          "</article>";
      }).join("");
    });
    html += kartuSumber([
      ['Doa & dzikir — <a href="https://equran.id/apidev" target="_blank" rel="noopener">EQuran.id Doa API</a> (data Kementerian Agama RI)'],
    ]);
    isiEl.innerHTML = html;
  }

  /* ---------------- render: DHUHA ---------------- */
  function renderDhuha(d) {
    toolbarTitle.textContent = "Shalat Dhuha";
    document.title = "Shalat Sunnah Dhuha — Majmu' Darut Thalibin";
    var html = '<header class="mj-surah-head"><div class="mj-ar-name">صَلَاةُ الضُّحَى</div>' +
      "<h1>" + esc(d.judul) + "</h1><p>Niat, tata cara, dan pilihan doa setelah shalat Dhuha.</p></header>" +
      '<div class="mj-prose"><h2>Pengantar</h2><p>' + esc(d.pengantar) + "</p>" +
      "<h2>Niat</h2><div class=\"mj-niat-box\"><p class=\"mj-arabic\" lang=\"ar\" dir=\"rtl\">" + esc(d.niat.arab) + "</p>" +
      '<p class="mj-latin" lang="la">' + esc(d.niat.latin) + "</p>" +
      '<p class="mj-terjemah">' + esc(d.niat.terjemah) + "</p></div>" +
      (d.niat.catatan ? '<p class="small">' + esc(d.niat.catatan) + "</p>" : "") +
      "<h2>Tata cara ringkas</h2><ol>" + d.tataCara.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ol></div>";

    // doaList: boleh berisi beberapa versi; urutan tampil mengikuti urutan array
    var daftar = Array.isArray(d.doaList) && d.doaList.length ? d.doaList : (d.doa ? [d.doa] : []);
    daftar.forEach(function (doa, idx) {
      var pill = doa.status === "terverifikasi"
        ? '<span class="mj-pill ok">Terverifikasi</span>'
        : '<span class="mj-pill draft">Perlu tashih pengurus</span>';
      html += '<div class="mj-group-head"><h2>' + esc(doa.nama || ("Doa versi " + (idx + 1))) + "</h2>" + pill + '<span class="mj-line"></span></div>' +
        '<article class="mj-ayah"><p class="mj-arabic" lang="ar" dir="rtl">' + esc(doa.arab) + "</p>" +
        (doa.latin ? '<p class="mj-latin" lang="la">' + esc(doa.latin) + "</p>" : "") +
        '<p class="mj-terjemah">' + esc(doa.terjemah) + "</p>" +
        (doa.tentang ? '<p class="mj-tentang">' + esc(stripHtml(doa.tentang)) + "</p>" : "") +
        (doa.sumber ? '<p class="small mj-sumber-kecil">Sumber: ' + esc(doa.sumber) + (doa.lisensi ? " · " + esc(doa.lisensi) : "") + "</p>" : "") +
        '<span class="mj-ayah-actions" style="margin-left:auto;margin-top:12px">' +
        tombolShare((doa.nama || "Doa setelah shalat Dhuha") + "\n" + doa.arab + "\n" + doa.terjemah) + "</span></article>";
    });

    html += kartuSumber([
      ["Doa ringkas & dzikir — <a href=\"https://equran.id/apidev\" target=\"_blank\" rel=\"noopener\">EQuran.id Doa API</a>"],
      ["Niat & tata cara disusun dan diverifikasi pengurus pondok; versi doa tambahan dikurasi manual di <code>dhuha.json</code>"],
    ]);
    isiEl.innerHTML = html;
  }

  /* ---------------- render: RATIB AL-HADDAD ---------------- */
  function renderRatib(d) {
    toolbarTitle.textContent = "Ratib al-Haddad";
    document.title = "Ratib al-Haddad — Majmu' Darut Thalibin";
    var total = d.bagian.reduce(function (n, b) { return n + b.items.length; }, 0);
    var html = '<header class="mj-surah-head"><div class="mj-ar-name">' + esc(d.namaArab) + "</div>" +
      "<h1>" + esc(d.judul) + "</h1><p>Wirid dan doa tersusun, lengkap Arab, Latin, dan terjemah.</p>" +
      '<div class="mj-surah-meta"><span>' + total + " bacaan</span><span>" + d.bagian.length + " bagian</span>" +
      '<span>Rutin ba\'da Maghrib hari Minggu</span></div></header>';

    if (d.status === "draft_tashih") {
      html += '<p class="mj-tashih-note">⚠ Teks ini hasil penarikan otomatis dari Quran NU Online dan <strong>masih menunggu tashih pengurus pondok</strong> dibandingkan naskah acuan. Jangan disebarluaskan sebagai versi final sebelum statusnya berubah menjadi "terverifikasi".</p>';
    }
    if (d.pengantar) html += '<p class="mj-group-desc">' + esc(d.pengantar) + "</p>";

    d.bagian.forEach(function (bag, idxBag) {
      var judulBag = bag.judul || (idxBag === 0 ? "Rangkaian Wirid" : "Bagian " + (idxBag + 1));
      html += '<div class="mj-group-head"><h2>' + esc(judulBag) + (bag.arab ? ' <span dir="rtl" lang="ar">' + esc(bag.arab) + "</span>" : "") + '</h2><span class="mj-line"></span></div>';
      bag.items.forEach(function (it) {
        var ulang = it.ulang ? '<span class="mj-ulang">dibaca ' + it.ulang + "×</span>" : "";
        html += '<article class="mj-ayah"><div class="mj-ayah-head"><span class="mj-ayah-badge">' + it.id + "</span>" +
          '<span class="mj-ayah-actions">' + ulang + tombolShare((d.judul + " no. " + it.id) + "\n" + it.arab + "\n" + it.terjemah) + "</span></div>" +
          '<p class="mj-arabic" lang="ar" dir="rtl">' + esc(it.arab) + "</p>" +
          (it.latin ? '<p class="mj-latin" lang="la">' + esc(it.latin) + "</p>" : "") +
          '<p class="mj-terjemah">' + esc(it.terjemah) + "</p></article>";
      });
    });

    var s = d.sumber || {};
    html += kartuSumber([
      ['Teks Arab, Latin, dan terjemah — <a href="' + esc(s.url || "https://quran.nu.or.id/wirid/ratib/ratib-al-haddad") + '" target="_blank" rel="noopener">Quran NU Online</a>'],
      ["Naskah acuan: " + esc(s.naskahAcuan || "Majmû'ah Anwâriyyah, PP. al-Anwar, Sarang, Rembang")],
      ["Penyalin & penerjemah: " + esc(s.penyalinPenerjemah || "Ahmad Mundzir") + " · transliterasi: " + esc(s.pentransliterasi || "Muhammad Aiz Luthfi") + " · editor: " + esc(s.editor || "Mahbib Khoiron")],
    ]);
    isiEl.innerHTML = html;
  }

  function kartuSumber(daftar) {
    return '<aside class="mj-sumber"><h2>Sumber data</h2><ul>' +
      daftar.map(function (s) { return "<li>• " + s[0] + "</li>"; }).join("") +
      "</ul></aside>";
  }

  /* ---------------- pemuat umum ---------------- */
  async function muat() {
    // Sembunyikan kontrol khusus-surah bila bukan surah
    var khususSurah = app.querySelectorAll("[data-only-surah]");
    if (jenis === "surah") {
      statusMemuat("Menyiapkan pembaca…");
      if (!nomorSurah || nomorSurah < 1 || nomorSurah > 114) return statusGalat("Nomor surah tidak dikenal.");
      await muatSurah(false);
    } else {
      khususSurah.forEach(function (el) { el.style.display = "none"; });
      var file, renderer;
      if (jenis === "tahlil") { file = "tahlil.json"; renderer = renderTahlil; statusMemuat("Memuat susunan tahlil…"); }
      else if (jenis === "dzikir") { file = "dzikir-shalat.json"; renderer = renderDzikir; statusMemuat("Memuat dzikir & doa…"); }
      else if (jenis === "dhuha") { file = "dhuha.json"; renderer = renderDhuha; statusMemuat("Memuat panduan shalat Dhuha…"); }
      else if (jenis === "ratib") { file = "ratib-haddad.json"; renderer = renderRatib; statusMemuat("Memuat Ratib al-Haddad…"); }
      else return statusGalat("Halaman yang Anda tuju tidak dikenal.");
      try {
        var res = await fetch(DATA + "/" + file);
        if (!res.ok) throw new Error("HTTP " + res.status);
        renderer(await res.json());
      } catch (err) {
        statusGalat("Berkas data lokal tidak dapat dibuka (" + err.message + ").", true);
      }
    }
  }
  muat();
})();
