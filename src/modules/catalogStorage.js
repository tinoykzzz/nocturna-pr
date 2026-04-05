import { CATALOG_FALLBACK } from '../data/catalogFallback.js';

/** Catálogo editado desde la intranet (demo / sin filas en Supabase) */
export const CATALOG_STORAGE_KEY = 'nocturna_catalog_v1';

/** Forma tienda (main.js) */
export function adminProductToShop(p) {
  const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
  const mainImg = p.image && String(p.image).trim();
  return {
    id: p.id,
    name: p.name,
    price: Number.parseFloat(p.price) || 0,
    image: mainImg || imgs[0] || '/logo-tienda/icono-oficial.png',
    images: imgs.length ? imgs : (mainImg ? [mainImg] : []),
    category: p.category,
    stock: Number.parseInt(p.stock, 10) || 0,
    drop: p.drop_name || p.drop || '',
    newItem: Boolean(p.new_item),
  };
}

/** Forma intranet / Supabase */
export function shopProductToAdmin(p) {
  const imgs = Array.isArray(p.images) ? [...p.images] : [];
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    stock: p.stock,
    category: p.category,
    image: p.image,
    images: imgs,
    drop_name: p.drop || null,
    new_item: Boolean(p.newItem),
  };
}

export function getDefaultAdminCatalog() {
  return CATALOG_FALLBACK.map(shopProductToAdmin);
}

export function loadPersistedAdminCatalog() {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function savePersistedAdminCatalog(products) {
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(products));
  } catch {
    /* quota / private mode */
  }
}

/** Catálogo para la tienda cuando no hay datos en Supabase */
export function loadShopCatalogFromStorage() {
  const raw = loadPersistedAdminCatalog();
  if (!raw?.length) return null;
  return raw.map(adminProductToShop);
}
