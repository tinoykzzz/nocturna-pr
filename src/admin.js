import { createClient } from '@supabase/supabase-js';
import { getDefaultAdminCatalog, loadPersistedAdminCatalog, savePersistedAdminCatalog } from './modules/catalogStorage.js';
import { uploadCatalogImage, STORAGE_BUCKET } from './modules/supabaseStorage.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
/** En `vite` (dev) por defecto demo UI; en build de producción hace falta Supabase salvo VITE_ADMIN_MODE=demo */
const ADMIN_MODE = (
  import.meta.env.VITE_ADMIN_MODE
  || (import.meta.env.DEV ? 'demo' : 'production')
).toLowerCase();
/** Opcional: URL de una Edge Function u otro backend que envíe el broadcast (POST JSON con JWT). */
const NEWSLETTER_BROADCAST_URL = (import.meta.env.VITE_NEWSLETTER_BROADCAST_URL || '').trim();
const DEMO_ADMIN_EMAIL = import.meta.env.VITE_DEMO_ADMIN_EMAIL || 'admin';
const DEMO_ADMIN_PASSWORD = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || '123';
const IS_DEMO_MODE = ADMIN_MODE === 'demo';

let supabase;
try { supabase = createClient(SUPABASE_URL, SUPABASE_ANON); } catch { supabase = null; }

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] || c);
}

const STORE_BRAND = 'NOCTURNA PR';
const STORE_TAGLINE = 'Urban Machine — Streetwear premium';
const STORE_SITE = 'https://nocturnapr.com';

function parseOrderItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw == null) return [];
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Chart.js (CDN UMD) vive en `globalThis`; en módulos ES `Chart` no es un identificador global. */
function getChartConstructor() {
  return typeof globalThis !== 'undefined' ? globalThis.Chart : undefined;
}

function normalizeOrdersForAdmin(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((o) => ({ ...o, items: parseOrderItems(o.items) }));
}

function resizeAllAdminCharts() {
  salesChartInstance?.resize();
  categoryChartInstance?.resize();
  monthlyRevenueInstance?.resize();
  orderStatusInstance?.resize();
  topProductsInstance?.resize();
}

/** Abre una ventana imprimible: nota de venta con logo y detalle de ítems (documento informativo, no SUNAT). */
function printNotaVenta(order) {
  const logoUrl = `${window.location.origin}/logo-tienda/icono-oficial.png`;
  const items = parseOrderItems(order.items);
  const rows = items.map((i) => {
    const qty = Number(i.qty) || 1;
    const price = Number(i.price) || 0;
    const sub = qty * price;
    return `<tr>
      <td>${escapeHtml(i.name || 'Ítem')}</td>
      <td style="text-align:center">${qty}</td>
      <td style="text-align:right">S/${price.toFixed(2)}</td>
      <td style="text-align:right">S/${sub.toFixed(2)}</td>
    </tr>`;
  }).join('');
  const computedTotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 1), 0);
  const total = Number.parseFloat(order.total) || computedTotal;
  const num = order.order_number ?? order.id;
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' })
    : '—';
  const addr = [order.customer_address, order.customer_city].filter(Boolean).join(', ');
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Nota ${num}</title>
<style>
  @page { margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #111; font-size: 12px; line-height: 1.45; max-width: 720px; margin: 0 auto; padding: 16px; }
  .head { display: flex; align-items: flex-start; gap: 16px; border-bottom: 2px solid #111; padding-bottom: 14px; margin-bottom: 16px; }
  .head img { width: 76px; height: 76px; object-fit: contain; }
  h1 { font-size: 18px; margin: 0 0 4px; letter-spacing: 0.06em; text-transform: uppercase; }
  .tag { color: #444; font-size: 11px; margin: 0 0 6px; }
  .doc { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin: 0 0 4px; }
  table { width: 100%; border-collapse: collapse; margin: 14px 0; }
  th, td { padding: 8px 6px; border-bottom: 1px solid #ddd; }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; text-align: left; }
  th:nth-child(2), td:nth-child(2) { text-align: center; }
  th:nth-child(3), th:nth-child(4), td:nth-child(3), td:nth-child(4) { text-align: right; }
  .tot { text-align: right; font-size: 15px; font-weight: 700; margin: 12px 0 0; }
  .meta { margin: 12px 0; font-size: 11px; color: #333; }
  .foot { margin-top: 22px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 9px; color: #666; line-height: 1.5; }
</style></head><body>
<div class="head">
  <img src="${logoUrl}" alt="${STORE_BRAND}">
  <div>
    <h1>${STORE_BRAND}</h1>
    <p class="tag">${STORE_TAGLINE}</p>
    <p class="doc">Nota de venta — documento informativo (no constituye comprobante fiscal SUNAT)</p>
    <p style="margin:6px 0 0;font-size:11px;"><a href="${STORE_SITE}">${STORE_SITE}</a></p>
  </div>
</div>
<p><strong>Pedido N.º</strong> ${escapeHtml(String(num))} &nbsp;·&nbsp; <strong>Fecha:</strong> ${escapeHtml(dateStr)}</p>
<div class="meta">
  <strong>Cliente:</strong> ${escapeHtml(order.customer_name || '—')}<br>
  <strong>Teléfono:</strong> ${escapeHtml(order.customer_phone || '—')}<br>
  <strong>Entrega / dirección:</strong> ${escapeHtml(addr || '—')}
</div>
<table>
  <thead><tr><th>Descripción</th><th>Cant.</th><th>P. unit.</th><th>Subtotal</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="4">Sin detalle de ítems</td></tr>'}</tbody>
</table>
<p class="tot">Total: S/${total.toFixed(2)}</p>
<p style="font-size:11px;margin-top:10px;"><strong>Estado:</strong> ${escapeHtml(order.status || '—')}</p>
<div class="foot">
  Gracias por tu compra. Este documento se genera desde la intranet de ${STORE_BRAND} como referencia del pedido. Para factura o boleta según normativa vigente, solicítalo al equipo de ventas.
</div>
</body></html>`;
  // Blob + URL evita pantalla en blanco con about:blank + document.write (Chrome/Edge).
  // No usar noopener en window.open: en varios navegadores anula la referencia y rompe el documento.
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  const w = window.open(blobUrl, '_blank');
  if (!w) {
    URL.revokeObjectURL(blobUrl);
    showToast('Permite ventanas emergentes para abrir la nota de venta', true);
    return;
  }
  let printed = false;
  const runPrint = () => {
    if (printed) return;
    printed = true;
    try {
      w.focus();
      w.print();
    } finally {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    }
  };
  w.addEventListener('load', runPrint, { once: true });
  // Respaldo si `load` no dispara (p. ej. algunos navegadores con blob:).
  setTimeout(runPrint, 750);
}

function normalizeProductRecord(record) {
  let images = record.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = images.split(',').map((s) => s.trim()).filter(Boolean); }
  }
  return {
    ...record,
    images: Array.isArray(images) ? images : [],
    drop_name: record.drop_name ?? record.drop ?? null,
    drop: record.drop ?? record.drop_name ?? null,
    stock: Number.parseInt(record.stock, 10) || 0,
    price: Number.parseFloat(record.price) || 0,
  };
}

/** URL de imagen para tabla (misma ruta pública que la tienda) */
function productImageUrl(p) {
  const main = p.image && String(p.image).trim();
  if (main) return main;
  if (p.images?.length) return p.images[0];
  return '/logo-tienda/icono-oficial.png';
}

const PLACEHOLDER_IMG = '/logo-tienda/icono-oficial.png';

function initLocalProducts() {
  const persisted = loadPersistedAdminCatalog();
  if (persisted?.length) return persisted.map(normalizeProductRecord);
  return getDefaultAdminCatalog().map(normalizeProductRecord);
}

function persistLocalCatalogIfNeeded() {
  if (!isOfflineMode) return;
  savePersistedAdminCatalog(localProducts);
}

// ========== DOM ==========
const loginScreen = document.getElementById('adminLogin');
const dashboardScreen = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.admin-sidebar');
const headerDate = document.getElementById('headerDate');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');

const navBtns = document.querySelectorAll('.admin-nav button');
const sections = document.querySelectorAll('.admin-section');

const statTotalVentas = document.getElementById('statTotalVentas');
const statPedidos = document.getElementById('statPedidos');
const statPendientes = document.getElementById('statPendientes');
const statEntregados = document.getElementById('statEntregados');

const productsBody = document.getElementById('productsBody');
const salesBody = document.getElementById('salesBody');
const ordersList = document.getElementById('ordersList');
const productForm = document.getElementById('productForm');
const productSearch = document.getElementById('productSearch');
const inventorySearch = document.getElementById('inventorySearch');
const inventoryTableBody = document.getElementById('inventoryTableBody');
const subscribersBody = document.getElementById('subscribersBody');
const subscriberCountEl = document.getElementById('subscriberCount');
const subscribersModeHint = document.getElementById('subscribersModeHint');
const broadcastEdgeHint = document.getElementById('broadcastEdgeHint');
const toastEl = document.getElementById('adminToast');

// Modal elements
const modalOverlay = document.getElementById('productModalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalSubmitText = document.getElementById('modalSubmitText');
const editProductId = document.getElementById('editProductId');

// In-memory store for offline / demo (persistido en localStorage → misma fuente que la tienda sin Supabase)
let localProducts = initLocalProducts();
let localOrders = [];
let allOrders = [];
let allProducts = [];
let newsletterRows = [];

// ========== TOAST ==========
function showToast(message, isError = false) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = 'admin-toast' + (isError ? ' error' : '');
  requestAnimationFrame(() => toastEl.classList.add('show'));
  setTimeout(() => toastEl.classList.remove('show'), 3000);
}

function setBroadcastHints() {
  if (broadcastEdgeHint) {
    broadcastEdgeHint.textContent = NEWSLETTER_BROADCAST_URL
      ? 'Tenés VITE_NEWSLETTER_BROADCAST_URL: podés enlazar una Edge Function que reciba POST con { subject, body } y el JWT del usuario para enviar con Resend u otro proveedor.'
      : 'Para envío automático desde servidor, creá una Supabase Edge Function + proveedor de email (Resend, SendGrid) y asigná la URL a VITE_NEWSLETTER_BROADCAST_URL en .env.';
  }
}

async function loadNewsletterSubscribers() {
  if (subscribersModeHint) {
    if (isOfflineMode) {
      subscribersModeHint.textContent = 'Modo demo: los suscriptores en la base solo se ven con Supabase conectado y VITE_ADMIN_MODE=production (login real).';
    } else if (!supabase) {
      subscribersModeHint.textContent = 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.';
    } else {
      subscribersModeHint.textContent = '';
    }
  }

  if (!subscribersBody) return;

  if (isOfflineMode || !supabase) {
    newsletterRows = [];
    subscribersBody.innerHTML = '<tr><td colspan="2" style="color:var(--admin-text-dim);padding:1.25rem;">Conectá Supabase y usá login de admin para listar suscriptores.</td></tr>';
    if (subscriberCountEl) subscriberCountEl.textContent = '0';
    return;
  }

  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('email, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    newsletterRows = data || [];
  } catch (e) {
    console.error(e);
    newsletterRows = [];
    showToast('No se pudieron cargar suscriptores. ¿Sesión de admin y tabla newsletter_subscribers?', true);
  }

  if (subscriberCountEl) subscriberCountEl.textContent = String(newsletterRows.length);
  subscribersBody.innerHTML = newsletterRows.length
    ? newsletterRows.map((r) => `
    <tr>
      <td>${escapeHtml(r.email)}</td>
      <td>${r.created_at ? new Date(r.created_at).toLocaleString('es-PE') : '—'}</td>
    </tr>`).join('')
    : '<tr><td colspan="2" style="color:var(--admin-text-dim);padding:1.25rem;">Aún no hay suscriptores.</td></tr>';
}

function getInventoryProductList() {
  const q = (inventorySearch?.value || '').toLowerCase().trim();
  let list = [...allProducts];
  if (q) list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
  return list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
}

function renderInventoryPanel() {
  if (!inventoryTableBody) return;
  const list = getInventoryProductList();
  const ph = escapeHtml(PLACEHOLDER_IMG);
  if (!list.length) {
    inventoryTableBody.innerHTML = '<tr><td colspan="5" style="color:var(--admin-text-dim);padding:1.25rem;">No hay productos. Agregá uno en <strong>Agregar producto</strong> o <strong>Catálogo</strong>.</td></tr>';
    return;
  }
  inventoryTableBody.innerHTML = list.map((p) => `
    <tr data-id="${escapeHtml(String(p.id))}">
      <td>
        <div class="inv-row-name">
          <img class="admin-product-thumb inv-thumb" src="${escapeHtml(productImageUrl(p))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${ph}'">
          <span>${escapeHtml(p.name)}</span>
        </div>
      </td>
      <td><span class="status-badge status-confirmado">${escapeHtml(p.category)}</span></td>
      <td><span class="stock-badge ${p.stock <= 5 ? 'low' : ''}">${p.stock}</span></td>
      <td><input type="number" class="inv-stock-input" min="0" step="1" value="${Number(p.stock) || 0}" aria-label="Nuevo stock"></td>
      <td><button type="button" class="btn-sm btn-primary inv-save-stock">Guardar</button></td>
    </tr>
  `).join('');

  inventoryTableBody.querySelectorAll('.inv-save-stock').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tr = btn.closest('tr');
      const id = tr?.dataset.id;
      const input = tr?.querySelector('.inv-stock-input');
      if (!id || !input) return;
      saveProductStock(id, input.value);
    });
  });
}

async function saveProductStock(productId, newStockRaw) {
  const n = Math.max(0, parseInt(String(newStockRaw), 10) || 0);

  if (!isOfflineMode && supabase) {
    try {
      const { error } = await supabase.from('products').update({ stock: n }).eq('id', productId);
      if (error) {
        showToast('Error: ' + error.message, true);
        return;
      }
    } catch {
      showToast('No se pudo guardar el stock', true);
      return;
    }
  } else {
    const idx = localProducts.findIndex((p) => String(p.id) === String(productId));
    if (idx >= 0) {
      localProducts[idx] = { ...localProducts[idx], stock: n };
      persistLocalCatalogIfNeeded();
    }
  }

  showToast('Stock actualizado ✓');
  await loadProducts();
  if (document.getElementById('section-inventory')?.classList.contains('active')) renderInventoryPanel();
}

function splitCsvCells(line) {
  const delim = line.includes(';') && line.split(';').length > 1 ? ';' : ',';
  return line.split(delim).map((s) => s.trim().replace(/^"|"$/g, ''));
}

function parseStockCsv(text) {
  const raw = String(text).replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  if (!lines.length) return { rows: [], error: 'Archivo vacío' };
  const header = splitCsvCells(lines[0]).map((h) => h.toLowerCase());
  const idIdx = header.findIndex((h) => h === 'id' || h === 'product_id');
  const stockIdx = header.findIndex((h) => h === 'stock' || h === 'cantidad' || h === 'qty');
  if (idIdx < 0 || stockIdx < 0) {
    return { rows: [], error: 'La primera fila debe tener columnas id y stock (separador , o ;)' };
  }
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvCells(lines[i]);
    if (cells.length <= Math.max(idIdx, stockIdx)) continue;
    const id = cells[idIdx];
    const stock = parseInt(String(cells[stockIdx]), 10);
    if (!id || Number.isNaN(stock)) continue;
    rows.push({ id: String(id).trim(), stock: Math.max(0, stock) });
  }
  if (!rows.length) return { rows: [], error: 'No hay filas válidas (¿ids y números correctos?)' };
  return { rows, error: null };
}

async function applyBulkStockRows(rows) {
  let ok = 0;
  let skip = 0;
  for (const { id, stock } of rows) {
    if (!isOfflineMode && supabase) {
      try {
        const { error } = await supabase.from('products').update({ stock }).eq('id', id);
        if (error) {
          skip++;
          continue;
        }
        ok++;
      } catch {
        skip++;
      }
    } else {
      const idx = localProducts.findIndex((p) => String(p.id) === String(id));
      if (idx < 0) {
        skip++;
        continue;
      }
      localProducts[idx] = { ...localProducts[idx], stock };
      persistLocalCatalogIfNeeded();
      ok++;
    }
  }
  showToast(`Stock masivo: ${ok} actualizados${skip ? ` · ${skip} omitidos` : ''}`);
  await loadProducts();
  if (document.getElementById('section-inventory')?.classList.contains('active')) renderInventoryPanel();
}

// ========== DATE DISPLAY ==========
if (headerDate) {
  const now = new Date();
  headerDate.textContent = now.toLocaleDateString('es-PE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// ========== SIDEBAR NAVIGATION ==========
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-section');
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    sections.forEach(s => {
      s.classList.toggle('active', s.id === `section-${target}`);
    });
    sidebar?.classList.remove('open');
    document.querySelector('.sidebar-overlay')?.classList.remove('active');
    if (target === 'inventory') renderInventoryPanel();
    if (target === 'subscribers') loadNewsletterSubscribers();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resizeAllAdminCharts());
    });
  });
});

// ========== MOBILE SIDEBAR TOGGLE ==========
if (sidebarToggle && sidebar) {
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
  });

  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  });
}

let isOfflineMode = IS_DEMO_MODE;

// ========== AUTH ==========
async function checkAuth() {
  if (!supabase && !IS_DEMO_MODE) {
    loginError.textContent = 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para usar intranet.';
    return;
  }

  if (IS_DEMO_MODE) {
    const demoSession = localStorage.getItem('nocturna_admin_demo');
    if (demoSession) {
      try {
        const user = JSON.parse(demoSession);
        isOfflineMode = true;
        showDashboard(user);
        return;
      } catch {
        localStorage.removeItem('nocturna_admin_demo');
      }
    }
  }

  if (!supabase) return;

  const localSession = localStorage.getItem('nocturna_admin');
  if (localSession) {
    try {
      const user = JSON.parse(localSession);
      isOfflineMode = true;
      showDashboard(user);
      return;
    } catch { localStorage.removeItem('nocturna_admin'); }
  }

  if (!supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: adminCheck } = await supabase
        .from('admin_emails')
        .select('email')
        .eq('email', user.email)
        .single();

      if (adminCheck) {
        showDashboard(user);
      } else {
        loginError.textContent = 'No tienes permisos de administrador.';
        await supabase.auth.signOut();
      }
    }
  } catch (err) {
    console.error('checkAuth error:', err);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  if (IS_DEMO_MODE) {
    if (email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD) {
      isOfflineMode = true;
      const user = { email };
      localStorage.setItem('nocturna_admin_demo', JSON.stringify(user));
      showDashboard(user);
      return;
    }
    loginError.textContent = 'Credenciales demo incorrectas.';
    return;
  }

  if (!supabase) {
    loginError.textContent = 'Intranet no configurada. Falta conexión segura.';
    return;
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      const { data: adminCheck } = await supabase
        .from('admin_emails')
        .select('email')
        .eq('email', email)
        .single();

      if (!adminCheck) {
        loginError.textContent = 'No tienes permisos de administrador.';
        await supabase.auth.signOut();
        return;
      }
      showDashboard(data.user);
      return;
    }
    loginError.textContent = 'Email o contraseña incorrectos.';
  } catch (err) {
    console.error('Login error:', err);
    loginError.textContent = 'No se pudo iniciar sesión. Revisa la configuración.';
  }
}

function showDashboard(user) {
  loginScreen.style.display = 'none';
  dashboardScreen.style.display = 'flex';

  if (user?.email) {
    const initial = user.email.charAt(0).toUpperCase();
    if (userAvatar) userAvatar.textContent = initial;
    if (userName) userName.textContent = user.email.split('@')[0];
  }

  loadProducts();
  loadOrders();
  loadNewsletterSubscribers();
  setBroadcastHints();
}

loginForm?.addEventListener('submit', handleLogin);
logoutBtn?.addEventListener('click', async () => {
  localStorage.removeItem('nocturna_admin');
  localStorage.removeItem('nocturna_admin_demo');
  if (supabase) {
    try { await supabase.auth.signOut(); } catch { }
  }
  isOfflineMode = IS_DEMO_MODE;
  dashboardScreen.style.display = 'none';
  loginScreen.style.display = '';
  loginForm?.reset();
  loginError.textContent = '';
});

checkAuth();

// ========== PRODUCT MODAL ==========
function resetProductImageUploadUi() {
  const mainFile = document.getElementById('pImageFile');
  const galFiles = document.getElementById('pImagesFiles');
  const btnMain = document.getElementById('btnUploadMainImage');
  const btnGal = document.getElementById('btnUploadGalleryImages');
  const box = document.getElementById('pImagePreviewBox');
  const prev = document.getElementById('pImagePreview');
  if (mainFile) mainFile.value = '';
  if (galFiles) galFiles.value = '';
  if (btnMain) {
    btnMain.disabled = true;
    btnMain.textContent = 'Subir a Supabase';
  }
  if (btnGal) {
    btnGal.disabled = true;
    btnGal.textContent = 'Subir selección';
  }
  if (box) box.hidden = true;
  if (prev) {
    prev.removeAttribute('src');
    prev.alt = '';
  }
}

function setImageUploadHints() {
  const el = document.getElementById('pImageUploadHint');
  if (!el) return;
  if (!supabase) {
    el.textContent = 'Sin Supabase en .env: solo puedes pegar URL o ruta. Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para subir archivos.';
  } else {
    el.textContent = `Bucket «${STORAGE_BUCKET}». Crea el bucket y políticas (ver supabase-storage-bucket.sql). Si la subida falla por permisos, inicia sesión con Supabase Auth (intranet en producción) o añade la política de desarrollo para anon.`;
  }
}

function openModal(mode = 'add', product = null) {
  if (!modalOverlay) return;
  modalOverlay.classList.add('open');
  editProductId.value = '';
  resetProductImageUploadUi();
  setImageUploadHints();

  if (mode === 'edit' && product) {
    modalTitle.textContent = 'Editar producto';
    modalSubmitText.textContent = 'ACTUALIZAR';
    editProductId.value = product.id;
    document.getElementById('pName').value = product.name || '';
    document.getElementById('pPrice').value = product.price || '';
    document.getElementById('pStock').value = product.stock || '';
    document.getElementById('pCategory').value = product.category || 'polo';
    document.getElementById('pDrop').value = product.drop_name || product.drop || '';
    document.getElementById('pImage').value = product.image || '';
    document.getElementById('pImages').value = (product.images || []).join(', ');
    document.getElementById('pNewItem').checked = product.new_item || false;
    const url = productImageUrl(product);
    const prev = document.getElementById('pImagePreview');
    const box = document.getElementById('pImagePreviewBox');
    if (url && prev && box) {
      prev.src = url;
      prev.alt = product.name || '';
      box.hidden = false;
    }
  } else {
    modalTitle.textContent = 'Agregar producto';
    modalSubmitText.textContent = 'GUARDAR';
    productForm?.reset();
    resetProductImageUploadUi();
    setImageUploadHints();
  }
}

function closeModal() {
  modalOverlay?.classList.remove('open');
  productForm?.reset();
  editProductId.value = '';
  resetProductImageUploadUi();
}

document.getElementById('btnOpenAddProduct')?.addEventListener('click', () => openModal('add'));
document.getElementById('btnSectionAddProduct')?.addEventListener('click', () => openModal('add'));
document.getElementById('btnDashboardAddProduct')?.addEventListener('click', () => {
  document.querySelector('.admin-nav button[data-section="add-product"]')?.click();
  openModal('add');
});
document.getElementById('btnDashboardStock')?.addEventListener('click', () => {
  document.querySelector('.admin-nav button[data-section="inventory"]')?.click();
});
modalClose?.addEventListener('click', closeModal);
modalCancel?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

const pImageFileEl = document.getElementById('pImageFile');
const pImagesFilesEl = document.getElementById('pImagesFiles');
const btnUploadMainImage = document.getElementById('btnUploadMainImage');
const btnUploadGalleryImages = document.getElementById('btnUploadGalleryImages');

pImageFileEl?.addEventListener('change', () => {
  if (btnUploadMainImage) btnUploadMainImage.disabled = !pImageFileEl.files?.length || !supabase;
});

pImagesFilesEl?.addEventListener('change', () => {
  if (btnUploadGalleryImages) btnUploadGalleryImages.disabled = !pImagesFilesEl.files?.length || !supabase;
});

btnUploadMainImage?.addEventListener('click', async () => {
  const file = pImageFileEl?.files?.[0];
  if (!supabase) {
    showToast('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env', true);
    return;
  }
  if (!file) {
    showToast('Elige un archivo de imagen', true);
    return;
  }
  btnUploadMainImage.disabled = true;
  const prevLabel = btnUploadMainImage.textContent;
  btnUploadMainImage.textContent = 'Subiendo...';
  const { url, error } = await uploadCatalogImage(supabase, file, 'catalog');
  btnUploadMainImage.textContent = prevLabel;
  btnUploadMainImage.disabled = !pImageFileEl.files?.length || !supabase;
  if (error) {
    const msg = error.message || String(error);
    const hint = /row-level security|RLS|Unauthorized|permission|policy/i.test(msg)
      ? `${msg} — Ajusta políticas del bucket (supabase-storage-bucket.sql) o usa sesión Supabase Auth.`
      : msg;
    showToast(hint, true);
    return;
  }
  const pImageInput = document.getElementById('pImage');
  if (pImageInput && url) pImageInput.value = url;
  const prev = document.getElementById('pImagePreview');
  const box = document.getElementById('pImagePreviewBox');
  if (prev && box && url) {
    prev.src = url;
    prev.alt = 'Vista previa';
    box.hidden = false;
  }
  showToast('Imagen principal subida ✓');
});

btnUploadGalleryImages?.addEventListener('click', async () => {
  const files = [...(pImagesFilesEl?.files || [])];
  if (!supabase) {
    showToast('Configura Supabase en .env', true);
    return;
  }
  if (!files.length) {
    showToast('Selecciona una o más imágenes', true);
    return;
  }
  btnUploadGalleryImages.disabled = true;
  const prevLabel = btnUploadGalleryImages.textContent;
  btnUploadGalleryImages.textContent = 'Subiendo...';
  const urls = [];
  for (const f of files) {
    const { url, error } = await uploadCatalogImage(supabase, f, 'catalog/gallery');
    if (error) {
      btnUploadGalleryImages.textContent = prevLabel;
      btnUploadGalleryImages.disabled = !pImagesFilesEl.files?.length || !supabase;
      const msg = error.message || String(error);
      showToast(/RLS|row-level security/i.test(msg) ? `${msg} — Revisa políticas de Storage.` : msg, true);
      return;
    }
    if (url) urls.push(url);
  }
  const ta = document.getElementById('pImages');
  if (ta) {
    const existing = ta.value.trim() ? ta.value.split(',').map((s) => s.trim()).filter(Boolean) : [];
    ta.value = [...existing, ...urls].join(', ');
  }
  if (pImagesFilesEl) pImagesFilesEl.value = '';
  btnUploadGalleryImages.textContent = prevLabel;
  btnUploadGalleryImages.disabled = true;
  showToast(`${urls.length} imagen(es) añadidas a la galería ✓`);
});

// ========== PRODUCTS ==========
async function loadProducts() {
  if (!productsBody) return;

  let data;
  if (!isOfflineMode && supabase) {
    try {
      const res = await supabase.from('products').select('*').order('sort_order', { ascending: true });
      if (!res.error && res.data) data = res.data;
    } catch { }
  }
  if (!data) data = localProducts;
  allProducts = data.map(normalizeProductRecord);

  renderProducts(allProducts);
  if (document.getElementById('section-inventory')?.classList.contains('active')) renderInventoryPanel();
}

function renderProducts(data) {
  if (!productsBody) return;
  const ph = escapeHtml(PLACEHOLDER_IMG);
  productsBody.innerHTML = data.map(p => `
    <tr>
      <td class="admin-table-img-cell">
        <img class="admin-product-thumb" src="${escapeHtml(productImageUrl(p))}" alt="" loading="lazy"
          onerror="this.onerror=null;this.src='${ph}'">
      </td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td style="font-weight:600;color:#fff;">S/${(Number.parseFloat(p.price) || 0).toFixed(2)}</td>
      <td>
        <span class="stock-badge ${p.stock <= 5 ? 'low' : ''}">${p.stock}</span>
      </td>
      <td><span class="status-badge status-confirmado">${escapeHtml(p.category)}</span></td>
      <td>
        <button class="btn-sm btn-edit" data-id="${p.id}" title="Editar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn-sm btn-danger btn-delete" data-id="${p.id}" data-name="${escapeHtml(p.name)}" title="Eliminar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    </tr>
  `).join('');

  // Edit buttons
  productsBody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = allProducts.find(p => String(p.id) === btn.dataset.id);
      if (product) openModal('edit', product);
    });
  });

  // Delete buttons
  productsBody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`¿Seguro que quieres eliminar "${btn.dataset.name}"?`)) return;

      if (!isOfflineMode && supabase) {
        try {
          const { error } = await supabase.from('products').delete().eq('id', btn.dataset.id);
          if (error) { showToast('Error al eliminar', true); return; }
        } catch { }
      }

      localProducts = localProducts.filter(p => String(p.id) !== btn.dataset.id);
      persistLocalCatalogIfNeeded();
      showToast(`"${btn.dataset.name}" eliminado`);
      loadProducts();
    });
  });
}

// Product search
productSearch?.addEventListener('input', () => {
  const q = productSearch.value.toLowerCase();
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(q));
  renderProducts(filtered);
});

inventorySearch?.addEventListener('input', () => renderInventoryPanel());

document.getElementById('btnSubscribersRefresh')?.addEventListener('click', () => loadNewsletterSubscribers());

document.getElementById('btnCopyEmailsList')?.addEventListener('click', async () => {
  if (!newsletterRows.length) {
    showToast('No hay emails para copiar', true);
    return;
  }
  const text = newsletterRows.map((r) => r.email).join(', ');
  try {
    await navigator.clipboard.writeText(text);
    showToast('Emails copiados al portapapeles');
  } catch {
    showToast('No se pudo copiar (permisos del navegador)', true);
  }
});

document.getElementById('btnExportSubscribersCsv')?.addEventListener('click', () => {
  if (!newsletterRows.length) {
    showToast('No hay datos para exportar', true);
    return;
  }
  const header = 'email,created_at\n';
  const rows = newsletterRows.map((r) => `"${String(r.email).replace(/"/g, '""')}",${r.created_at || ''}`).join('\n');
  const blob = new Blob([`\ufeff${header}${rows}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `nocturna-suscriptores-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  showToast('CSV descargado ✓');
});

document.getElementById('btnCopyBroadcastDraft')?.addEventListener('click', async () => {
  const sub = document.getElementById('broadcastSubject')?.value || '';
  const body = document.getElementById('broadcastBody')?.value || '';
  const text = `Asunto: ${sub}\n\n${body}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Borrador copiado');
  } catch {
    showToast('No se pudo copiar', true);
  }
});

const stockCsvInput = document.getElementById('stockCsvInput');
const stockCsvFileName = document.getElementById('stockCsvFileName');
stockCsvInput?.addEventListener('change', () => {
  const f = stockCsvInput.files?.[0];
  if (stockCsvFileName) stockCsvFileName.textContent = f ? `Archivo: ${f.name}` : '';
});

document.getElementById('btnApplyStockCsv')?.addEventListener('click', async () => {
  const file = stockCsvInput?.files?.[0];
  if (!file) {
    showToast('Elegí un archivo CSV', true);
    return;
  }
  let text;
  try {
    text = await file.text();
  } catch {
    showToast('No se pudo leer el archivo', true);
    return;
  }
  const { rows, error } = parseStockCsv(text);
  if (error) {
    showToast(error, true);
    return;
  }
  await applyBulkStockRows(rows);
});

// ========== ADD / EDIT PRODUCT ==========
productForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = editProductId.value;
  const imagesList = document.getElementById('pImages').value
    ? document.getElementById('pImages').value.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const imageUrl = document.getElementById('pImage').value.trim();
  if (!imageUrl) {
    showToast('Agrega imagen principal: súbela a Supabase o pega la URL / ruta', true);
    return;
  }

  const product = {
    name: document.getElementById('pName').value,
    price: parseFloat(document.getElementById('pPrice').value),
    stock: parseInt(document.getElementById('pStock').value, 10),
    category: document.getElementById('pCategory').value,
    image: imageUrl,
    drop_name: document.getElementById('pDrop').value || null,
    new_item: document.getElementById('pNewItem').checked,
    images: imagesList.length ? imagesList : [],
  };

  if (id) {
    // Edit mode
    if (!isOfflineMode && supabase) {
      try {
        const { error } = await supabase.from('products').update(product).eq('id', id);
        if (error) { showToast('Error al actualizar: ' + error.message, true); return; }
      } catch { }
    }
    const idx = localProducts.findIndex(p => String(p.id) === id);
    if (idx >= 0) localProducts[idx] = normalizeProductRecord({ ...localProducts[idx], ...product });
    showToast(`"${product.name}" actualizado ✓`);
  } else {
    // Add mode
    if (!isOfflineMode && supabase) {
      try {
        const { error } = await supabase.from('products').insert(product);
        if (error) { showToast('Error al agregar: ' + error.message, true); return; }
      } catch { }
    }
    product.id = Date.now();
    localProducts.push(normalizeProductRecord(product));
    showToast(`"${product.name}" agregado ✓`);
  }

  closeModal();
  loadProducts();
  persistLocalCatalogIfNeeded();
});

// ========== ORDERS ==========
async function loadOrders() {
  let data;
  if (!isOfflineMode && supabase) {
    try {
      const res = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (!res.error && res.data) data = res.data;
    } catch { }
  }
  if (!data) data = localOrders;
  allOrders = normalizeOrdersForAdmin(data);

  updateDashboardStats(allOrders);
  renderSalesTable(allOrders);
  renderOrdersList(allOrders);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderCharts(allOrders);
      renderAnalytics(allOrders);
    });
  });
}

function renderSalesTable(data) {
  if (!salesBody) return;
  salesBody.innerHTML = data.slice(0, 10).map(o => `
    <tr>
      <td><span style="font-family:var(--font-display);font-size:0.8rem;">#${o.order_number}</span></td>
      <td>${escapeHtml(o.customer_name)}</td>
      <td style="font-weight:600;color:#fff;">S/${parseFloat(o.total).toFixed(2)}</td>
      <td><span class="status-badge status-${o.status}">${o.status}</span></td>
      <td>${new Date(o.created_at).toLocaleDateString('es-PE')}</td>
    </tr>
  `).join('');
}

function renderOrdersList(data, filter = 'all') {
  if (!ordersList) return;
  const filtered = filter === 'all' ? data : data.filter(o => o.status === filter);

  ordersList.innerHTML = filtered.length ? filtered.map((o) => {
    const lineItems = parseOrderItems(o.items);
    const itemsLine = lineItems.length
      ? `<div class="order-meta" style="margin-top:0.35rem;">📦 ${lineItems.map(i => `${i.name} x${i.qty}`).join(', ')}</div>`
      : '';
    return `
    <div class="order-card" data-id="${o.id}">
      <div class="order-card-top">
        <div>
          <h4>Pedido #${o.order_number} — ${escapeHtml(o.customer_name)}</h4>
          <div class="order-meta">📱 ${escapeHtml(o.customer_phone)} | 📍 ${escapeHtml(o.customer_address)}, ${escapeHtml(o.customer_city)}</div>
          <div class="order-meta">💰 <strong>S/${parseFloat(o.total).toFixed(2)}</strong> | 📅 ${new Date(o.created_at).toLocaleString('es-PE')}</div>
          ${itemsLine}
        </div>
        <select class="order-status" data-id="${o.id}">
          <option value="pendiente" ${o.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="confirmado" ${o.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
          <option value="enviado" ${o.status === 'enviado' ? 'selected' : ''}>Enviado</option>
          <option value="entregado" ${o.status === 'entregado' ? 'selected' : ''}>Entregado</option>
        </select>
      </div>
      <div class="order-card-actions">
        <button type="button" class="btn-nota-venta" data-order-id="${escapeHtml(String(o.id))}">Nota de venta</button>
      </div>
    </div>
  `;
  }).join('') : '<p style="color:var(--admin-text-dim);text-align:center;padding:2rem;">No hay pedidos con este filtro.</p>';

  ordersList.querySelectorAll('.btn-nota-venta').forEach((btn) => {
    btn.addEventListener('click', () => {
      const order = allOrders.find((o) => String(o.id) === btn.dataset.orderId);
      if (order) printNotaVenta(order);
    });
  });

  ordersList.querySelectorAll('.order-status').forEach(sel => {
    sel.addEventListener('change', async () => {
      if (!isOfflineMode && supabase) {
        try {
          const { error } = await supabase.from('orders').update({ status: sel.value }).eq('id', sel.dataset.id);
          if (error) { showToast('Error al actualizar estado', true); return; }
        } catch { }
      }
      const order = localOrders.find(o => String(o.id) === sel.dataset.id);
      if (order) order.status = sel.value;
      showToast(`Pedido actualizado a "${sel.value}" ✓`);
      loadOrders();
    });
  });
}

// Order filters
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderOrdersList(allOrders, btn.dataset.filter);
  });
});

// ========== DASHBOARD STATS ==========
function updateDashboardStats(orders) {
  if (!orders) return;
  const totalVentas = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
  const totalPedidos = orders.length;
  const pendientes = orders.filter(o => o.status === 'pendiente').length;
  const entregados = orders.filter(o => o.status === 'entregado').length;

  if (statTotalVentas) statTotalVentas.textContent = `S/${totalVentas.toFixed(2)}`;
  if (statPedidos) statPedidos.textContent = totalPedidos;
  if (statPendientes) statPendientes.textContent = pendientes;
  if (statEntregados) statEntregados.textContent = entregados;
}

// ========== CHARTS (Chart.js) ==========
let salesChartInstance = null;
let categoryChartInstance = null;
let monthlyRevenueInstance = null;
let orderStatusInstance = null;
let topProductsInstance = null;

function renderCharts(orders) {
  const Chart = getChartConstructor();
  if (!Chart) return;

  // --- Sales last 7 days (line chart on dashboard) ---
  const salesCtx = document.getElementById('salesChart')?.getContext('2d');
  if (salesCtx) {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
      const total = orders.filter(o => (o.created_at || '').slice(0, 10) === key).reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
      last7.push({ label, total });
    }
    if (salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: last7.map(d => d.label),
        datasets: [{
          label: 'Ventas (S/)',
          data: last7.map(d => d.total),
          borderColor: '#ff003c',
          backgroundColor: 'rgba(255, 0, 60, 0.1)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ff003c',
          pointBorderColor: '#fff',
          pointBorderWidth: 1.5,
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#16161f',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: ctx => `S/${ctx.parsed.y.toFixed(2)}`
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 }, callback: v => `S/${v}` }, beginAtZero: true }
        }
      }
    });
  }

  // --- Category doughnut (dashboard) ---
  const catCtx = document.getElementById('categoryChart')?.getContext('2d');
  if (catCtx) {
    const categories = {};
    orders.forEach((o) => {
      parseOrderItems(o.items).forEach((item) => {
        const cat = item.name?.toLowerCase().includes('polo') ? 'Polos' :
          item.name?.toLowerCase().includes('bividi') ? 'Bividis' :
            item.name?.toLowerCase().includes('bermudas') ? 'Bermudas' :
              item.name?.toLowerCase().includes('polera') ? 'Poleras' :
                item.name?.toLowerCase().includes('perfume') ? 'Perfumes' : 'Otros';
        categories[cat] = (categories[cat] || 0) + (Number(item.price) * (item.qty || 1));
      });
    });
    let catLabels = Object.keys(categories);
    let catData = Object.values(categories);
    const catColors = ['#ff003c', '#00f0ff', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6'];
    if (catLabels.length === 0) {
      catLabels = ['Sin datos por categoría'];
      catData = [1];
    }

    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catData,
          backgroundColor: catLabels[0] === 'Sin datos por categoría' ? ['#475569'] : catColors.slice(0, catLabels.length),
          borderColor: '#16161f',
          borderWidth: 3,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#e2e8f0', padding: 12, font: { size: 11 }, usePointStyle: true, pointStyleWidth: 8 }
          },
          tooltip: {
            backgroundColor: '#16161f',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => (ctx.label === 'Sin datos por categoría'
                ? ' Sin ventas clasificadas aún'
                : ` ${ctx.label}: S/${ctx.parsed.toFixed(2)}`),
            },
          },
        },
        cutout: '65%'
      }
    });
  }
}

// ========== ANALYTICS ==========
function renderAnalytics(orders) {
  const Chart = getChartConstructor();
  if (!Chart) return;

  // KPIs
  const avgTicket = orders.length ? orders.reduce((s, o) => s + parseFloat(o.total), 0) / orders.length : 0;
  const deliveryRate = orders.length ? (orders.filter(o => o.status === 'entregado').length / orders.length * 100) : 0;
  const now = new Date();
  const thisMonth = orders.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthRevenue = thisMonth.reduce((s, o) => s + parseFloat(o.total), 0);

  const kpiAvg = document.getElementById('kpiAvgTicket');
  const kpiDel = document.getElementById('kpiDeliveryRate');
  const kpiMon = document.getElementById('kpiMonthOrders');
  const kpiRev = document.getElementById('kpiMonthRevenue');
  if (kpiAvg) kpiAvg.textContent = `S/${avgTicket.toFixed(2)}`;
  if (kpiDel) kpiDel.textContent = `${deliveryRate.toFixed(1)}%`;
  if (kpiMon) kpiMon.textContent = thisMonth.length;
  if (kpiRev) kpiRev.textContent = `S/${monthRevenue.toFixed(2)}`;

  // Monthly Revenue bar chart
  const mCtx = document.getElementById('monthlyRevenueChart')?.getContext('2d');
  if (mCtx) {
    const months = {};
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    orders.forEach(o => {
      const d = new Date(o.created_at);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      months[key] = (months[key] || 0) + parseFloat(o.total);
    });
    const mLabels = Object.keys(months);
    const mData = Object.values(months);

    if (monthlyRevenueInstance) monthlyRevenueInstance.destroy();
    monthlyRevenueInstance = new Chart(mCtx, {
      type: 'bar',
      data: {
        labels: mLabels,
        datasets: [{
          label: 'Ingresos (S/)',
          data: mData,
          backgroundColor: 'rgba(255, 0, 60, 0.6)',
          borderColor: '#ff003c',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#16161f',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: { label: ctx => `S/${ctx.parsed.y.toFixed(2)}` }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 }, callback: v => `S/${v}` }, beginAtZero: true }
        }
      }
    });
  }

  // Order status pie chart
  const osCtx = document.getElementById('orderStatusChart')?.getContext('2d');
  if (osCtx) {
    const statuses = { Pendiente: 0, Confirmado: 0, Enviado: 0, Entregado: 0 };
    orders.forEach((o) => {
      const raw = o.status || 'pendiente';
      const s = raw.charAt(0).toUpperCase() + raw.slice(1);
      statuses[s] = (statuses[s] || 0) + 1;
    });

    if (orderStatusInstance) orderStatusInstance.destroy();
    orderStatusInstance = new Chart(osCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statuses),
        datasets: [{
          data: Object.values(statuses),
          backgroundColor: ['#f59e0b', '#3b82f6', '#00f0ff', '#10b981'],
          borderColor: '#16161f',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#e2e8f0', padding: 12, font: { size: 11 }, usePointStyle: true, pointStyleWidth: 8 }
          }
        },
        cutout: '60%'
      }
    });
  }

  // Top products bar chart
  const tpCtx = document.getElementById('topProductsChart')?.getContext('2d');
  if (tpCtx) {
    const productSales = {};
    orders.forEach((o) => {
      parseOrderItems(o.items).forEach((i) => {
        productSales[i.name] = (productSales[i.name] || 0) + (Number(i.price) * (i.qty || 1));
      });
    });
    const sorted = Object.entries(productSales).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const tpLabels = sorted.map(s => s[0].length > 20 ? s[0].slice(0, 20) + '…' : s[0]);
    const tpData = sorted.map(s => s[1]);
    const tpColors = ['#ff003c', '#00f0ff', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6'];

    if (topProductsInstance) topProductsInstance.destroy();
    topProductsInstance = new Chart(tpCtx, {
      type: 'bar',
      data: {
        labels: tpLabels,
        datasets: [{
          label: 'Ventas (S/)',
          data: tpData,
          backgroundColor: tpColors,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#16161f',
            titleColor: '#fff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: { label: ctx => `S/${ctx.parsed.x.toFixed(2)}` }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b', font: { size: 11 }, callback: v => `S/${v}` }, beginAtZero: true },
          y: { grid: { display: false }, ticks: { color: '#e2e8f0', font: { size: 11 } } }
        }
      }
    });
  }
}
