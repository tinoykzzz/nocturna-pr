export function initLegalPageLite() {
  initScrollProgress();
  initHeaderScroll();
  initBackToTop();
}

function initScrollProgress() {
  const scrollProgress = document.getElementById('scrollProgress');
  if (!scrollProgress) return;

  window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    scrollProgress.style.width = height > 0 ? `${(winScroll / height) * 100}%` : '0%';
  });
}

function initHeaderScroll() {
  const header = document.querySelector('header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    header.style.background = window.scrollY > 100
      ? 'rgba(0, 0, 0, 0.95)'
      : 'rgba(0, 0, 0, 0.8)';
  });
}

function initBackToTop() {
  const backToTop = document.getElementById('backToTop');
  if (!backToTop) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) backToTop.classList.add('visible');
    else backToTop.classList.remove('visible');
  });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
