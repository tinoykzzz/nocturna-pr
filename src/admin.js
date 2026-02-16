import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://pjjhmsezxedamwxcjwvy.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqamhtc2V6eGVkYW13eGNqd3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDUyMDUsImV4cCI6MjA1NDAyMTIwNX0.n8sFx04LxuBN4JUh4bm5TzlhEpkb1wf6k_HsLT75h-0';

let supabase;
try { supabase = createClient(SUPABASE_URL, SUPABASE_ANON); } catch { supabase = null; }

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] || c);
}

// ========== SAMPLE DATA (offline) ==========
const SAMPLE_PRODUCTS = [
  { id: 1, name: 'POLO NOCTURNA ELITE', price: 55, stock: 25, category: 'polo', image: '/segundo-drop/polo-elite.jpeg', new_item: true },
  { id: 2, name: 'BIVIDI STEALTH BLACK', price: 38, stock: 30, category: 'bividi', image: '/segundo-drop/bividi-black.jpeg', new_item: false },
  { id: 3, name: 'BERMUDAS BAGGY BLANCO', price: 42, stock: 18, category: 'short', image: '/segundo-drop/bermudas-blanco.jpeg', new_item: true },
  { id: 4, name: 'POLERA SHADOW NEGRA', price: 65, stock: 12, category: 'polera', image: '/segundo-drop/polera-shadow.jpeg', new_item: false },
  { id: 5, name: 'POLO SUPRA BEIGE', price: 50, stock: 20, category: 'polo', image: '/segundo-drop/polo-supra.jpeg', new_item: true },
  { id: 6, name: 'PERFUME NOCTURNA 100ML', price: 120, stock: 15, category: 'perfume', image: '/segundo-drop/perfume.jpeg', new_item: true },
  { id: 7, name: 'BIVIDI STEALTH WHITE', price: 38, stock: 22, category: 'bividi', image: '/segundo-drop/bividi-white.jpeg', new_item: false },
  { id: 8, name: 'BERMUDAS CARGO NEGRO', price: 48, stock: 14, category: 'short', image: '/segundo-drop/bermudas-cargo.jpeg', new_item: true },
];

const SAMPLE_ORDERS = [
  { id: 1, order_number: 1001, customer_name: 'Carlos Mendoza', customer_phone: '987654321', customer_address: 'Av. Arequipa 1234', customer_city: 'Lima', total: 155, status: 'entregado', created_at: '2026-02-10T10:30:00Z', items: [{ name: 'POLO NOCTURNA ELITE', qty: 1, price: 55 }, { name: 'BERMUDAS BAGGY BLANCO', qty: 1, price: 42 }, { name: 'BIVIDI STEALTH BLACK', qty: 1, price: 38 }] },
  { id: 2, order_number: 1002, customer_name: 'María García', customer_phone: '912345678', customer_address: 'Jr. Cusco 456', customer_city: 'Trujillo', total: 120, status: 'entregado', created_at: '2026-02-11T14:15:00Z', items: [{ name: 'PERFUME NOCTURNA 100ML', qty: 1, price: 120 }] },
  { id: 3, order_number: 1003, customer_name: 'Juan Pérez', customer_phone: '945678912', customer_address: 'Calle Tacna 789', customer_city: 'Arequipa', total: 93, status: 'enviado', created_at: '2026-02-12T09:45:00Z', items: [{ name: 'POLO SUPRA BEIGE', qty: 1, price: 50 }, { name: 'BERMUDAS BAGGY BLANCO', qty: 1, price: 42 }] },
  { id: 4, order_number: 1004, customer_name: 'Ana Torres', customer_phone: '978123456', customer_address: 'Av. La Marina 321', customer_city: 'Lima', total: 65, status: 'confirmado', created_at: '2026-02-13T16:20:00Z', items: [{ name: 'POLERA SHADOW NEGRA', qty: 1, price: 65 }] },
  { id: 5, order_number: 1005, customer_name: 'Luis Ramírez', customer_phone: '956789123', customer_address: 'Jr. Puno 654', customer_city: 'Cusco', total: 210, status: 'pendiente', created_at: '2026-02-14T11:10:00Z', items: [{ name: 'PERFUME NOCTURNA 100ML', qty: 1, price: 120 }, { name: 'POLO SUPRA BEIGE', qty: 1, price: 50 }, { name: 'BIVIDI STEALTH BLACK', qty: 1, price: 38 }] },
  { id: 6, order_number: 1006, customer_name: 'Sofia López', customer_phone: '934567891', customer_address: 'Av. Brasil 987', customer_city: 'Lima', total: 88, status: 'pendiente', created_at: '2026-02-15T08:30:00Z', items: [{ name: 'POLO NOCTURNA ELITE', qty: 1, price: 55 }, { name: 'BIVIDI STEALTH WHITE', qty: 1, price: 38 }] },
  { id: 7, order_number: 1007, customer_name: 'Diego Vargas', customer_phone: '923456789', customer_address: 'Jr. Huancavelica 159', customer_city: 'Huancayo', total: 48, status: 'pendiente', created_at: '2026-02-15T14:50:00Z', items: [{ name: 'BERMUDAS CARGO NEGRO', qty: 1, price: 48 }] },
];

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
const toastEl = document.getElementById('adminToast');

// Modal elements
const modalOverlay = document.getElementById('productModalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const modalCancel = document.getElementById('modalCancel');
const modalSubmitText = document.getElementById('modalSubmitText');
const editProductId = document.getElementById('editProductId');

// In-memory store for offline mode
let localProducts = [...SAMPLE_PRODUCTS];
let localOrders = [...SAMPLE_ORDERS];
let allOrders = [];
let allProducts = [];

// ========== TOAST ==========
function showToast(message, isError = false) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = 'admin-toast' + (isError ? ' error' : '');
  requestAnimationFrame(() => toastEl.classList.add('show'));
  setTimeout(() => toastEl.classList.remove('show'), 3000);
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

// ========== LOCAL ADMIN CREDENTIALS ==========
const LOCAL_ADMINS = [
  { email: 'richard@nocturna.com', password: 'NocturnaPR2026' },
  { email: 'patrick@nocturna.com', password: 'NocturnaPR2026' }
];

let isOfflineMode = false;

function localAuth(email, password) {
  return LOCAL_ADMINS.find(a => a.email === email && a.password === password) || null;
}

// ========== AUTH ==========
async function checkAuth() {
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

  if (supabase) {
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
    } catch (err) {
      console.warn('Supabase no disponible, usando login local...');
    }
  }

  const admin = localAuth(email, password);
  if (admin) {
    isOfflineMode = true;
    const user = { email: admin.email };
    localStorage.setItem('nocturna_admin', JSON.stringify(user));
    showDashboard(user);
  } else {
    loginError.textContent = 'Email o contraseña incorrectos.';
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
}

loginForm?.addEventListener('submit', handleLogin);
logoutBtn?.addEventListener('click', async () => {
  localStorage.removeItem('nocturna_admin');
  if (supabase) {
    try { await supabase.auth.signOut(); } catch { }
  }
  isOfflineMode = false;
  dashboardScreen.style.display = 'none';
  loginScreen.style.display = '';
  loginForm?.reset();
  loginError.textContent = '';
});

checkAuth();

// ========== PRODUCT MODAL ==========
function openModal(mode = 'add', product = null) {
  if (!modalOverlay) return;
  modalOverlay.classList.add('open');
  editProductId.value = '';

  if (mode === 'edit' && product) {
    modalTitle.textContent = 'Editar producto';
    modalSubmitText.textContent = 'ACTUALIZAR';
    editProductId.value = product.id;
    document.getElementById('pName').value = product.name || '';
    document.getElementById('pPrice').value = product.price || '';
    document.getElementById('pStock').value = product.stock || '';
    document.getElementById('pCategory').value = product.category || 'polo';
    document.getElementById('pDrop').value = product.drop || '';
    document.getElementById('pImage').value = product.image || '';
    document.getElementById('pImages').value = (product.images || []).join(', ');
    document.getElementById('pNewItem').checked = product.new_item || false;
  } else {
    modalTitle.textContent = 'Agregar producto';
    modalSubmitText.textContent = 'GUARDAR';
    productForm?.reset();
  }
}

function closeModal() {
  modalOverlay?.classList.remove('open');
  productForm?.reset();
  editProductId.value = '';
}

document.getElementById('btnOpenAddProduct')?.addEventListener('click', () => openModal('add'));
modalClose?.addEventListener('click', closeModal);
modalCancel?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

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
  allProducts = data;

  renderProducts(data);
}

function renderProducts(data) {
  if (!productsBody) return;
  productsBody.innerHTML = data.map(p => `
    <tr>
      <td><img src="${escapeHtml(p.image)}" alt="" onerror="this.src='/favicon.svg'" loading="lazy"></td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td style="font-weight:600;color:#fff;">S/${parseFloat(p.price).toFixed(2)}</td>
      <td>
        <span class="stock-badge ${p.stock <= 5 ? 'low' : ''}">${p.stock}</span>
      </td>
      <td><span class="status-badge status-${p.category === 'polo' ? 'confirmado' : p.category === 'perfume' ? 'enviado' : p.category === 'short' ? 'pendiente' : 'entregado'}">${escapeHtml(p.category)}</span></td>
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

// ========== ADD / EDIT PRODUCT ==========
productForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = editProductId.value;
  const product = {
    name: document.getElementById('pName').value,
    price: parseFloat(document.getElementById('pPrice').value),
    stock: parseInt(document.getElementById('pStock').value),
    category: document.getElementById('pCategory').value,
    image: document.getElementById('pImage').value,
    drop: document.getElementById('pDrop').value || null,
    new_item: document.getElementById('pNewItem').checked,
    images: document.getElementById('pImages').value ? document.getElementById('pImages').value.split(',').map(s => s.trim()) : null
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
    if (idx >= 0) localProducts[idx] = { ...localProducts[idx], ...product };
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
    localProducts.push(product);
    showToast(`"${product.name}" agregado ✓`);
  }

  closeModal();
  loadProducts();
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
  allOrders = data;

  updateDashboardStats(data);
  renderSalesTable(data);
  renderOrdersList(data);
  renderCharts(data);
  renderAnalytics(data);
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

  ordersList.innerHTML = filtered.length ? filtered.map(o => `
    <div class="order-card" data-id="${o.id}">
      <div class="order-card-top">
        <div>
          <h4>Pedido #${o.order_number} — ${escapeHtml(o.customer_name)}</h4>
          <div class="order-meta">📱 ${escapeHtml(o.customer_phone)} | 📍 ${escapeHtml(o.customer_address)}, ${escapeHtml(o.customer_city)}</div>
          <div class="order-meta">💰 <strong>S/${parseFloat(o.total).toFixed(2)}</strong> | 📅 ${new Date(o.created_at).toLocaleString('es-PE')}</div>
          ${o.items ? `<div class="order-meta" style="margin-top:0.35rem;">📦 ${o.items.map(i => `${i.name} x${i.qty}`).join(', ')}</div>` : ''}
        </div>
        <select class="order-status" data-id="${o.id}">
          <option value="pendiente" ${o.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="confirmado" ${o.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
          <option value="enviado" ${o.status === 'enviado' ? 'selected' : ''}>Enviado</option>
          <option value="entregado" ${o.status === 'entregado' ? 'selected' : ''}>Entregado</option>
        </select>
      </div>
    </div>
  `).join('') : '<p style="color:var(--admin-text-dim);text-align:center;padding:2rem;">No hay pedidos con este filtro.</p>';

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
  if (typeof Chart === 'undefined') return;

  // --- Sales last 7 days (line chart on dashboard) ---
  const salesCtx = document.getElementById('salesChart')?.getContext('2d');
  if (salesCtx) {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
      const total = orders.filter(o => o.created_at.slice(0, 10) === key).reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
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
    orders.forEach(o => {
      if (o.items) {
        o.items.forEach(item => {
          const cat = item.name?.toLowerCase().includes('polo') ? 'Polos' :
            item.name?.toLowerCase().includes('bividi') ? 'Bividis' :
              item.name?.toLowerCase().includes('bermudas') ? 'Bermudas' :
                item.name?.toLowerCase().includes('polera') ? 'Poleras' :
                  item.name?.toLowerCase().includes('perfume') ? 'Perfumes' : 'Otros';
          categories[cat] = (categories[cat] || 0) + (item.price * (item.qty || 1));
        });
      }
    });
    const catLabels = Object.keys(categories);
    const catData = Object.values(categories);
    const catColors = ['#ff003c', '#00f0ff', '#f59e0b', '#10b981', '#8b5cf6', '#3b82f6'];

    if (categoryChartInstance) categoryChartInstance.destroy();
    categoryChartInstance = new Chart(catCtx, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catData,
          backgroundColor: catColors.slice(0, catLabels.length),
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
            callbacks: { label: ctx => ` ${ctx.label}: S/${ctx.parsed.toFixed(2)}` }
          }
        },
        cutout: '65%'
      }
    });
  }
}

// ========== ANALYTICS ==========
function renderAnalytics(orders) {
  if (typeof Chart === 'undefined') return;

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
    orders.forEach(o => {
      const s = o.status.charAt(0).toUpperCase() + o.status.slice(1);
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
    orders.forEach(o => {
      if (o.items) {
        o.items.forEach(i => {
          productSales[i.name] = (productSales[i.name] || 0) + (i.price * (i.qty || 1));
        });
      }
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
