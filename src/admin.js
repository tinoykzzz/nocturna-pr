import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://pjjhmsezxedamwxcjwvy.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqamhtc2V6eGVkYW13eGNqd3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0NDUyMDUsImV4cCI6MjA1NDAyMTIwNX0.n8sFx04LxuBN4JUh4bm5TzlhEpkb1wf6k_HsLT75h-0';

let supabase;
try { supabase = createClient(SUPABASE_URL, SUPABASE_ANON); } catch { supabase = null; }

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] || c);
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

// ========== AUTH ==========
async function checkAuth() {
  if (!supabase) {
    loginError.textContent = 'Error: No se pudo conectar a Supabase.';
    return;
  }
  const { data: { user }, error } = await supabase.auth.getUser();

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
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = error.message;
    return;
  }

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
  await supabase.auth.signOut();
  dashboardScreen.style.display = 'none';
  loginScreen.style.display = '';
  loginForm?.reset();
  loginError.textContent = '';
});

checkAuth();

// ========== PRODUCTS ==========
async function loadProducts() {
  if (!supabase || !productsBody) return;
  const { data, error } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
  if (error || !data) return;

  productsBody.innerHTML = data.map(p => `
    <tr>
      <td><img src="${escapeHtml(p.image)}" alt="" onerror="this.src='/favicon.svg'" loading="lazy"></td>
      <td>${escapeHtml(p.name)}</td>
      <td>S/${parseFloat(p.price).toFixed(2)}</td>
      <td>
        <input type="number" class="stock-input" value="${p.stock}" min="0" data-id="${p.id}" data-product="${escapeHtml(p.name)}">
      </td>
      <td>${escapeHtml(p.category)}</td>
      <td>
        <button class="btn-sm btn-save-stock" data-id="${p.id}">Guardar</button>
        <button class="btn-sm btn-danger btn-delete" data-id="${p.id}" data-name="${escapeHtml(p.name)}">Eliminar</button>
      </td>
    </tr>
  `).join('');

  productsBody.querySelectorAll('.btn-save-stock').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const input = productsBody.querySelector(`.stock-input[data-id="${id}"]`);
      const newStock = parseInt(input.value);
      const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
      alert(error ? 'Error al actualizar stock' : `Stock actualizado: ${input.dataset.product} → ${newStock}`);
    });
  });

  productsBody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(`¿Seguro que quieres eliminar "${btn.dataset.name}"?`)) return;
      const { error } = await supabase.from('products').delete().eq('id', btn.dataset.id);
      if (!error) loadProducts();
      else alert('Error al eliminar');
    });
  });
}

// ========== ADD PRODUCT ==========
productForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(productForm);
  const product = {
    name: fd.get('name'),
    price: parseFloat(fd.get('price')),
    stock: parseInt(fd.get('stock')),
    category: fd.get('category'),
    image: fd.get('image'),
    drop: fd.get('drop_name') || null,
    new_item: fd.get('new_item') === 'on',
    images: fd.get('images') ? fd.get('images').split(',').map(s => s.trim()) : null
  };

  const { error } = await supabase.from('products').insert(product);
  if (error) {
    alert('Error al agregar: ' + error.message);
  } else {
    productForm.reset();
    loadProducts();
    alert('¡Producto agregado!');
  }
});

// ========== ORDERS ==========
async function loadOrders() {
  if (!supabase) return;
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error || !data) return;

  updateDashboardStats(data);

  if (salesBody) {
    salesBody.innerHTML = data.slice(0, 8).map(o => `
      <tr>
        <td><span style="font-family: var(--font-display); font-size: 0.8rem;">#${o.order_number}</span></td>
        <td>${escapeHtml(o.customer_name)}</td>
        <td style="font-weight: 600;">S/${parseFloat(o.total).toFixed(2)}</td>
        <td><span class="status-badge status-${o.status}">${o.status}</span></td>
        <td>${new Date(o.created_at).toLocaleDateString('es-PE')}</td>
      </tr>
    `).join('');
  }

  if (ordersList) {
    ordersList.innerHTML = data.map(o => `
      <div class="order-card" data-id="${o.id}">
        <h4>Pedido #${o.order_number} — ${escapeHtml(o.customer_name)}</h4>
        <div class="order-meta">${escapeHtml(o.customer_phone)} | ${escapeHtml(o.customer_address)}, ${escapeHtml(o.customer_city)}</div>
        <div class="order-meta">S/${parseFloat(o.total).toFixed(2)} | ${new Date(o.created_at).toLocaleString('es-PE')}</div>
        <div style="margin-top:0.5rem;">
          <select class="order-status" data-id="${o.id}">
            <option value="pendiente" ${o.status === 'pendiente' ? 'selected' : ''}>Pendiente</option>
            <option value="confirmado" ${o.status === 'confirmado' ? 'selected' : ''}>Confirmado</option>
            <option value="enviado" ${o.status === 'enviado' ? 'selected' : ''}>Enviado</option>
            <option value="entregado" ${o.status === 'entregado' ? 'selected' : ''}>Entregado</option>
          </select>
        </div>
      </div>
    `).join('');

    ordersList.querySelectorAll('.order-status').forEach(sel => {
      sel.addEventListener('change', async () => {
        const { error } = await supabase.from('orders').update({ status: sel.value }).eq('id', sel.dataset.id);
        if (error) alert('Error al actualizar estado');
        else loadOrders();
      });
    });
  }
}

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
