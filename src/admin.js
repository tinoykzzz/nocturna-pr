import { createClient } from '@supabase/supabase-js';

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  document.body.innerHTML = '<div style="padding:2rem;color:#ff4444;">Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env</div>';
  throw new Error('Supabase not configured');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// =========== AUTH ===========
const adminLogin = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');

function updateHeaderDate() {
  const el = document.getElementById('headerDate');
  if (el) {
    const d = new Date();
    el.textContent = d.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
}

async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    adminLogin.style.display = 'none';
    adminDashboard.style.display = 'block';
    updateHeaderDate();
    loadDashboard();
    loadProducts();
    loadOrders();
    return true;
  }
  return false;
}

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : error.message;
    return;
  }
  await checkAuth();
});

logoutBtn?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  adminLogin.style.display = 'block';
  adminDashboard.style.display = 'none';
});

// =========== NAV ===========
document.querySelectorAll('.admin-nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.admin-nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`section-${btn.dataset.section}`).classList.add('active');
    if (btn.dataset.section === 'orders') loadOrders();
    if (btn.dataset.section === 'dashboard') loadDashboard();
  });
});

// =========== PRODUCTS ===========
async function loadProducts() {
  const tbody = document.getElementById('productsBody');
  if (!tbody) return;
  const { data, error } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
  if (error) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:#ff4444;">Error: ${escapeHtml(error.message)}. ¿Ejecutaste supabase-admin-setup.sql?</td></tr>`;
    return;
  }
  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No hay productos. Agrega uno o ejecuta supabase-admin-setup.sql para importar.</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(p => `
    <tr>
      <td><img src="${escapeHtml(p.image)}" alt="" onerror="this.src='/favicon.svg'"></td>
      <td>${escapeHtml(p.name)}</td>
      <td>$${parseFloat(p.price).toFixed(2)}</td>
      <td>
        <input type="number" class="stock-input" value="${p.stock}" min="0" data-id="${p.id}" data-product="${escapeHtml(p.name)}">
      </td>
      <td>${p.category}</td>
      <td>
        <button class="btn-sm btn-save-stock" data-id="${p.id}">Guardar stock</button>
        <button class="btn-sm btn-danger btn-delete" data-id="${p.id}">Eliminar</button>
      </td>
    </tr>
  `).join('');
  tbody.querySelectorAll('.btn-save-stock').forEach(btn => {
    btn.addEventListener('click', () => saveStock(btn.dataset.id, btn.closest('tr').querySelector('.stock-input').value));
  });
  tbody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
  });
}

async function saveStock(id, stock) {
  const { error } = await supabase.from('products').update({ stock: parseInt(stock) || 0 }).eq('id', id);
  if (error) alert('Error: ' + error.message);
  else loadProducts();
}

async function deleteProduct(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) alert('Error: ' + error.message);
  else loadProducts();
}

document.getElementById('productForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const imagesVal = form.images.value.trim();
  const images = imagesVal ? imagesVal.split(',').map(s => s.trim()).filter(Boolean) : [];
  const payload = {
    name: form.name.value.trim().toUpperCase(),
    price: parseFloat(form.price.value),
    stock: parseInt(form.stock.value) || 0,
    category: form.category.value,
    drop_name: form.drop_name.value.trim() || null,
    image: form.image.value.trim(),
    images,
    new_item: form.new_item.checked,
    sort_order: 999
  };
  const { error } = await supabase.from('products').insert(payload);
  if (error) {
    alert('Error: ' + error.message);
    return;
  }
  form.reset();
  loadProducts();
});

// =========== ORDERS ===========
async function loadOrders() {
  const list = document.getElementById('ordersList');
  if (!list) return;
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) {
    list.innerHTML = `<p style="color:#ff4444;">Error: ${escapeHtml(error.message)}</p>`;
    return;
  }
  if (!data || data.length === 0) {
    list.innerHTML = '<p>No hay pedidos.</p>';
    return;
  }
  list.innerHTML = data.map(o => `
    <div class="order-card" data-id="${o.id}">
      <h4>Pedido #${o.order_number} — ${escapeHtml(o.customer_name)}</h4>
      <div class="order-meta">${escapeHtml(o.customer_phone)} | ${escapeHtml(o.customer_address)}, ${escapeHtml(o.customer_city)}</div>
      <div class="order-meta">$${parseFloat(o.total).toFixed(2)} | ${new Date(o.created_at).toLocaleString('es-PE')}</div>
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
  list.querySelectorAll('.order-status').forEach(sel => {
    sel.addEventListener('change', () => updateOrderStatus(sel.dataset.id, sel.value));
  });
}

async function updateOrderStatus(id, status) {
  const { error } = await supabase.from('orders').update({ status }).eq('id', id);
  if (error) alert('Error: ' + error.message);
}

// Orders table needs RLS policy for authenticated to update
// Add to supabase admin setup: policy for UPDATE on orders

// =========== INIT ===========
checkAuth();
