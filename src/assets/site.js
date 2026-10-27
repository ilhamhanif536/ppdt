// Interaksi website Darut Thalibin Telang
// Sticky header, menu mobile, dropdown navigasi, animasi reveal, tahun footer.

// ---------- Sticky header ----------
const header = document.querySelector("[data-header]");
if (header) {
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// ---------- Menu mobile ----------
const toggle = document.querySelector("[data-menu-toggle]");
const nav = document.querySelector("[data-nav]");
const setMenu = (open) => {
  document.body.classList.toggle("nav-open", open);
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Tutup menu navigasi" : "Buka menu navigasi");
  }
};
if (toggle && nav) {
  toggle.addEventListener("click", () =>
    setMenu(!document.body.classList.contains("nav-open"))
  );
  nav.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => setMenu(false))
  );
  document.addEventListener("click", (e) => {
    if (
      document.body.classList.contains("nav-open") &&
      !nav.contains(e.target) &&
      !toggle.contains(e.target)
    ) {
      setMenu(false);
    }
  });
}

// ---------- Dropdown navigasi (klik / sentuh) ----------
const subToggles = document.querySelectorAll(".sub-toggle");
subToggles.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const item = btn.closest(".nav-item");
    if (!item) return;
    const open = item.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
});
document.addEventListener("click", (e) => {
  document.querySelectorAll(".nav-item.open").forEach((item) => {
    if (!item.contains(e.target)) {
      item.classList.remove("open");
      const b = item.querySelector(".sub-toggle");
      if (b) b.setAttribute("aria-expanded", "false");
    }
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  document.querySelectorAll(".nav-item.open").forEach((item) => {
    item.classList.remove("open");
    const b = item.querySelector(".sub-toggle");
    if (b) b.setAttribute("aria-expanded", "false");
  });
  if (document.body.classList.contains("nav-open")) {
    setMenu(false);
    if (toggle) toggle.focus();
  }
});

// ---------- Animasi reveal saat scroll ----------
const reveals = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window && reveals.length) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add("in"));
}

// ---------- Tahun berjalan di footer ----------
document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});
