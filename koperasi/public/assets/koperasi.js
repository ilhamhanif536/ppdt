/* ============================================================
   KOPERASI.JS — Interaksi Portal Koperasi Darut Thalibin (Fase 2)
   Tanpa dependensi eksternal — ringan, responsif, berbasis JSON.
   ============================================================ */
(() => {
  const DEFAULT_CONFIG = {
    namaResmi: "Koperasi Konsumen Darut Thalibin Telang Bangkalan",
    kontak: {
      whatsapp: "628179284789",
      teleponDisplay: "0817-9284-789",
      email: "kopontrendttb@gmail.com",
      jamLayanan: "Senin – Sabtu, 08.00 – 17.00 WIB",
    },
    simpanan: { pokok: 50000, wajib: 25000 },
  };

  const rupiah = (n) =>
    "Rp" + Number(n || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 });

  const esc = (s = "") =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // ---------- Menu mobile ----------
  const header = document.getElementById("header");
  const menuBtn = document.getElementById("menuBtn");
  const navLinks = document.getElementById("navLinks");
  if (header && menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      const open = header.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    });
    navLinks.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        header.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // ---------- Muat konfigurasi pusat ----------
  async function loadConfig() {
    if (window.__KOPERASI_CONFIG__) return window.__KOPERASI_CONFIG__;
    try {
      const res = await fetch("/data/config.json", { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  // ---------- Ikon SVG berdasarkan KBLI ----------
  function iconByKbli(kbli) {
    switch (String(kbli)) {
      case "47112":
        return `<svg viewBox="0 0 24 24" fill="none"><path d="M5 9h14l-1 11H6L5 9Z" stroke="currentColor" stroke-width="1.6"/><path d="M8 9V7a4 4 0 0 1 8 0v2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
      case "47611":
        return `<svg viewBox="0 0 24 24" fill="none"><path d="m5 19 1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L9 18l-4 1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m14.5 6.5 3 3" stroke="currentColor" stroke-width="1.6"/></svg>`;
      case "47901":
        return `<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 21h8M12 18v3M7 9h10M8.5 13h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
      case "47909":
        return `<svg viewBox="0 0 24 24" fill="none"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" stroke="currentColor" stroke-width="1.6"/></svg>`;
      case "56101":
        return `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M7 12a5 5 0 0 1 10 0M4 16h16M12 7V5M6 20h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`;
      default:
        return `<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6"/></svg>`;
    }
  }

  // ==========================================================
  // 1. HALAMAN KATALOG & KERANJANG WHATSAPP (/katalog/)
  // ==========================================================
  async function initKatalog(cfg) {
    const grid = document.getElementById("productGrid");
    if (!grid) return;

    const searchInput = document.getElementById("catalogSearch");
    const filterWrap = document.getElementById("catalogFilters");
    const cartOpenBtn = document.getElementById("cartOpenBtn");
    const cartCountEl = document.getElementById("cartCount");
    const drawer = document.getElementById("cartDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    const drawerClose = document.getElementById("drawerClose");
    const cartItemsEl = document.getElementById("cartItems");
    const cartTotalEl = document.getElementById("cartTotal");
    const checkoutBtn = document.getElementById("checkoutWaBtn");
    const clearCartBtn = document.getElementById("clearCartBtn");
    const cartError = document.getElementById("cartError");
    const titipJualBtn = document.getElementById("titipJualBtn");

    const waNumber = cfg.kontak?.whatsapp || DEFAULT_CONFIG.kontak.whatsapp;
    if (titipJualBtn) {
      const msg = [
        "Assalamu'alaikum Admin Koperasi Konsumen Darut Thalibin Telang Bangkalan,",
        "Saya berminat mengajukan titip jual / kemitraan produk UMKM anggota (KBLI 47901).",
        "",
        "Nama:",
        "Domisili (Kab/Kota):",
        "Nama Produk & Harga:",
        "Keterangan Singkat:",
      ].join("\n");
      titipJualBtn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;
    }

    let products = [];
    if (Array.isArray(window.__KOPERASI_PRODUK__)) {
      products = window.__KOPERASI_PRODUK__;
    } else {
      try {
        const res = await fetch("/data/produk.json", { cache: "no-cache" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        products = await res.json();
      } catch {
        grid.innerHTML = `<div class="empty-catalog"><strong>Data katalog belum dapat dimuat.</strong><br>Silakan muat ulang halaman atau hubungi admin koperasi melalui WhatsApp ${esc(cfg.kontak?.teleponDisplay || "0817-9284-789")}.</div>`;
        return;
      }
    }

    // State keranjang (localStorage)
    const CART_KEY = "ppdt_koperasi_cart_v1";
    let cart = {};
    try {
      cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}") || {};
    } catch {
      cart = {};
    }
    const saveCart = () => {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
      } catch {}
    };

    let activeCat = "all";
    let searchQuery = "";

    // Render filter kategori
    const categories = [...new Set(products.map((p) => p.kategori))];
    filterWrap.innerHTML = [
      `<button type="button" class="filter-pill is-active" data-cat="all">Semua (${products.length})</button>`,
      ...categories.map((cat) => {
        const count = products.filter((p) => p.kategori === cat).length;
        return `<button type="button" class="filter-pill" data-cat="${esc(cat)}">${esc(cat)} (${count})</button>`;
      }),
    ].join("");

    filterWrap.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-cat]");
      if (!btn) return;
      activeCat = btn.getAttribute("data-cat");
      filterWrap.querySelectorAll(".filter-pill").forEach((b) => b.classList.toggle("is-active", b === btn));
      renderProducts();
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        renderProducts();
      });
    }

    function updateQty(id, delta) {
      const next = (cart[id] || 0) + delta;
      if (next <= 0) delete cart[id];
      else cart[id] = next;
      saveCart();
      renderProducts();
      renderCart();
    }

    function renderProducts() {
      const filtered = products.filter((p) => {
        const matchCat = activeCat === "all" || p.kategori === activeCat;
        const hay = `${p.nama} ${p.kategori} ${p.kbli} ${p.deskripsi} ${p.penjual}`.toLowerCase();
        const matchQ = !searchQuery || hay.includes(searchQuery);
        return matchCat && matchQ;
      });

      if (!filtered.length) {
        grid.innerHTML = `<div class="empty-catalog"><strong>Produk tidak ditemukan.</strong><br>Coba kata kunci lain atau pilih kategori "Semua".</div>`;
        return;
      }

      grid.innerHTML = filtered
        .map((p) => {
          const qty = cart[p.id] || 0;
          const isPo = /pre-order/i.test(p.status || "");
          const actionHtml =
            qty > 0
              ? `<div class="qty-control" aria-label="Atur jumlah ${esc(p.nama)}">
                  <button type="button" class="qty-btn" data-dec="${esc(p.id)}" aria-label="Kurangi">−</button>
                  <span class="qty-val">${qty}</span>
                  <button type="button" class="qty-btn" data-inc="${esc(p.id)}" aria-label="Tambah">+</button>
                </div>`
              : `<button type="button" class="btn sm" data-inc="${esc(p.id)}">+ Keranjang</button>`;

          return `<article class="product-card">
            <div class="product-thumb">
              <div class="product-badges">
                <span class="badge-kbli">KBLI ${esc(p.kbli)}</span>
                ${p.contoh ? `<span class="badge-draft">Contoh Katalog</span>` : ""}
              </div>
              ${iconByKbli(p.kbli)}
              <span class="badge-status${isPo ? " po" : ""}">${esc(p.status || "Tersedia")}</span>
            </div>
            <div class="product-body">
              <span class="product-cat">${esc(p.kategori)}</span>
              <h3 class="product-title">${esc(p.nama)}</h3>
              <p class="product-desc">${esc(p.deskripsi)}</p>
              <span class="product-seller">Unit: ${esc(p.penjual)}</span>
              <div class="product-foot">
                <div class="product-price">
                  <strong>${rupiah(p.harga)}</strong>
                  <span>per ${esc(p.satuan || "item")}</span>
                </div>
                ${actionHtml}
              </div>
            </div>
          </article>`;
        })
        .join("");
    }

    grid.addEventListener("click", (e) => {
      const inc = e.target.closest("[data-inc]");
      const dec = e.target.closest("[data-dec]");
      if (inc) updateQty(inc.getAttribute("data-inc"), 1);
      if (dec) updateQty(dec.getAttribute("data-dec"), -1);
    });

    function renderCart() {
      const entries = Object.entries(cart)
        .map(([id, qty]) => ({ prod: products.find((p) => p.id === id), qty }))
        .filter((x) => x.prod && x.qty > 0);

      const totalQty = entries.reduce((sum, x) => sum + x.qty, 0);
      const totalHarga = entries.reduce((sum, x) => sum + x.prod.harga * x.qty, 0);

      if (cartCountEl) cartCountEl.textContent = String(totalQty);
      if (cartTotalEl) cartTotalEl.textContent = rupiah(totalHarga);

      if (!entries.length) {
        cartItemsEl.innerHTML = `<p style="font-size:.86rem;color:var(--muted);text-align:center;padding:18px 0">Keranjang pesanan masih kosong. Pilih produk di katalog terlebih dahulu.</p>`;
        return;
      }

      cartItemsEl.innerHTML = entries
        .map(
          ({ prod, qty }) => `<div class="cart-item">
            <div>
              <strong>${esc(prod.nama)}</strong>
              <span>${qty} × ${rupiah(prod.harga)} = <b>${rupiah(prod.harga * qty)}</b></span>
            </div>
            <div class="qty-control">
              <button type="button" class="qty-btn" data-dec="${esc(prod.id)}" aria-label="Kurangi">−</button>
              <span class="qty-val">${qty}</span>
              <button type="button" class="qty-btn" data-inc="${esc(prod.id)}" aria-label="Tambah">+</button>
            </div>
          </div>`
        )
        .join("");
    }

    cartItemsEl.addEventListener("click", (e) => {
      const inc = e.target.closest("[data-inc]");
      const dec = e.target.closest("[data-dec]");
      if (inc) updateQty(inc.getAttribute("data-inc"), 1);
      if (dec) updateQty(dec.getAttribute("data-dec"), -1);
    });

    const toggleDrawer = (open) => {
      drawer.classList.toggle("open", open);
      backdrop.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };

    if (cartOpenBtn) cartOpenBtn.addEventListener("click", () => toggleDrawer(true));
    if (drawerClose) drawerClose.addEventListener("click", () => toggleDrawer(false));
    if (backdrop) backdrop.addEventListener("click", () => toggleDrawer(false));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("open")) toggleDrawer(false);
    });

    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", () => {
        cart = {};
        saveCart();
        renderProducts();
        renderCart();
      });
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        const entries = Object.entries(cart)
          .map(([id, qty]) => ({ prod: products.find((p) => p.id === id), qty }))
          .filter((x) => x.prod && x.qty > 0);

        const nama = (document.getElementById("buyerName")?.value || "").trim();
        const status = (document.getElementById("buyerRole")?.value || "").trim();
        const alamat = (document.getElementById("buyerAddress")?.value || "").trim();
        const catatan = (document.getElementById("buyerNote")?.value || "").trim();

        cartError.className = "form-msg";
        if (!entries.length) {
          cartError.textContent = "Pilih minimal 1 produk sebelum mengirim pesanan.";
          cartError.classList.add("err");
          return;
        }
        if (!nama || !alamat) {
          cartError.textContent = "Mohon lengkapi Nama Pemesan dan Lokasi Pengambilan / Alamat.";
          cartError.classList.add("err");
          return;
        }

        const totalHarga = entries.reduce((sum, x) => sum + x.prod.harga * x.qty, 0);
        const lines = [
          "Assalamu'alaikum Admin Koperasi Konsumen Darut Thalibin Telang Bangkalan,",
          "Saya ingin memesan produk berikut dari Katalog Koperasi:",
          "",
          ...entries.map(
            ({ prod, qty }, i) =>
              `${i + 1}. ${prod.nama} (${qty} ${prod.satuan}) — ${rupiah(prod.harga * qty)}`
          ),
          "",
          `Estimasi Total: ${rupiah(totalHarga)}`,
          "-------------------------",
          `Nama Pemesan : ${nama}`,
          `Status       : ${status || "Anggota / Umum"}`,
          `Alamat/Lokasi: ${alamat}`,
        ];
        if (catatan) lines.push(`Catatan      : ${catatan}`);
        lines.push("", "Mohon konfirmasi ketersediaan & total pembayaran. Terima kasih.");

        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
      });
    }

    renderProducts();
    renderCart();
  }

  // ==========================================================
  // 2. HALAMAN FORM PENDAFTARAN ANGGOTA (/keanggotaan/)
  // ==========================================================
  function initKeanggotaan(cfg) {
    const form = document.getElementById("memberForm");
    if (!form) return;

    const waNumber = cfg.kontak?.whatsapp || DEFAULT_CONFIG.kontak.whatsapp;
    const emailAddr = cfg.kontak?.email || DEFAULT_CONFIG.kontak.email;
    const msgEl = document.getElementById("memberMsg");
    const emailBtn = document.getElementById("memberEmailBtn");

    function buildPayload() {
      const nama = document.getElementById("mNama").value.trim();
      const status = document.getElementById("mStatus").value;
      const kota = document.getElementById("mKota").value.trim();
      const hp = document.getElementById("mHp").value.trim();
      const email = document.getElementById("mEmail").value.trim();
      const minat = document.getElementById("mMinat").value;
      const alamat = document.getElementById("mAlamat").value.trim();
      const setuju = document.getElementById("mSetuju").checked;

      msgEl.className = "form-msg";
      if (!nama || !kota || !hp || !alamat) {
        msgEl.textContent = "Mohon lengkapi Nama Lengkap, Kabupaten/Kota, Nomor WhatsApp, dan Alamat Domisili.";
        msgEl.classList.add("err");
        return null;
      }
      if (!setuju) {
        msgEl.textContent = "Mohon centang persetujuan ketentuan Simpanan Pokok (Rp50.000) & Simpanan Wajib (Rp25.000).";
        msgEl.classList.add("err");
        return null;
      }

      const lines = [
        "Assalamu'alaikum Pengurus Koperasi Konsumen Darut Thalibin Telang Bangkalan,",
        "Saya mengajukan pendaftaran sebagai calon anggota koperasi dengan data berikut:",
        "",
        `Nama Lengkap       : ${nama}`,
        `Kategori           : ${status}`,
        `Kabupaten / Kota   : ${kota}, Jawa Timur`,
        `Nomor WhatsApp     : ${hp}`,
        `Email              : ${email || "-"}`,
        `Alamat Domisili    : ${alamat}`,
        `Minat Partisipasi  : ${minat}`,
        "",
        "Saya menyatakan bersedia mengikuti Anggaran Dasar Koperasi serta ketentuan Simpanan Pokok (Rp50.000) dan Simpanan Wajib (Rp25.000).",
        "Mohon arahan tahapan verifikasi selanjutnya. Terima kasih.",
      ];
      return { nama, text: lines.join("\n") };
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const payload = buildPayload();
      if (!payload) return;
      msgEl.textContent = "Format pendaftaran siap! Membuka WhatsApp admin koperasi...";
      msgEl.classList.add("ok");
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(payload.text)}`, "_blank", "noopener");
    });

    if (emailBtn) {
      emailBtn.addEventListener("click", () => {
        const payload = buildPayload();
        if (!payload) return;
        const subject = `Pendaftaran Anggota Koperasi — ${payload.nama}`;
        window.location.href = `mailto:${encodeURIComponent(emailAddr)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(payload.text)}`;
      });
    }
  }

  // Jalankan inisialisasi halaman
  loadConfig().then((cfg) => {
    initKatalog(cfg);
    initKeanggotaan(cfg);
  });
})();
