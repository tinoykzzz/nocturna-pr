const LIGHT_PAGE_PATTERNS = ['terminos.html', 'privacidad.html', '404.html'];

export function getCurrentPathname() {
  return (window.location.pathname || '/').toLowerCase();
}

export function isLightweightPage(pathname = getCurrentPathname()) {
  return LIGHT_PAGE_PATTERNS.some((pattern) => pathname.endsWith(pattern));
}

export function isDropsPage(pathname = getCurrentPathname()) {
  return pathname.includes('drops');
}
