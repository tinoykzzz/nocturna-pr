export const CART_STORAGE_KEY = 'nocturna_cart';
export const WISHLIST_STORAGE_KEY = 'nocturna_wishlist';
export const COUPON_STORAGE_KEY = 'nocturna_coupon';

export const VALID_COUPONS = {
  NOCTURNA10: { discount: 10, type: 'percent' },
  BIENVENIDO15: { discount: 15, type: 'percent' },
  ENVIO5: { discount: 5, type: 'fixed' },
};

export function sanitizeQuantity(value, min = 1, max = 10) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

export function sanitizeSize(value) {
  const allowed = new Set(['S', 'M', 'L', 'XL']);
  return allowed.has(value) ? value : 'M';
}

export function parseMoney(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function saveJsonInStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readJsonFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}
