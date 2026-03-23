function toggleMenu(e) {
  if (e && typeof e.stopPropagation === 'function') {
    e.stopPropagation();
  }
  const menu = document.getElementById('navMenu');
  const btn = document.getElementById('navToggle');
  if (!menu) return;

  const open = menu.classList.toggle('open');
  if (btn) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'ปิดเมนู' : 'เปิดเมนู');
  }
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  const nav = document.getElementById('navMenu');
  const btn = document.getElementById('navToggle');
  if (nav && !e.target.closest('.navbar') && nav.classList.contains('open')) {
    nav.classList.remove('open');
    if (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'เปิดเมนู');
    }
  }
});

// Close drawer after navigation on small screens + scroll-linked navbar morph
document.addEventListener('DOMContentLoaded', () => {
  const bar = document.querySelector('nav.navbar');
  if (bar) {
    const syncScrolled = () => bar.classList.toggle('scrolled', window.scrollY > 50);
    syncScrolled();
    window.addEventListener('scroll', syncScrolled, { passive: true });
  }

  const nav = document.getElementById('navMenu');
  if (!nav) return;
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      if (!window.matchMedia('(max-width: 768px)').matches) return;
      nav.classList.remove('open');
      const btn = document.getElementById('navToggle');
      if (btn) {
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', 'เปิดเมนู');
      }
    });
  });
});
