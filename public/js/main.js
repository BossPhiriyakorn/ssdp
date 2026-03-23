function toggleMenu() {
  const menu = document.getElementById('navMenu');
  menu.classList.toggle('open');
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  const nav = document.getElementById('navMenu');
  if (nav && !e.target.closest('.navbar') && nav.classList.contains('open')) {
    nav.classList.remove('open');
  }
});
