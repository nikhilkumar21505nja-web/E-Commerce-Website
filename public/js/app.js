// Shared helpers used by every page.

// ---- Talk to the backend API ----
async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = {};
  try { data = await res.json(); } catch (e) { /* empty response */ }

  if (!res.ok) {
    const error = new Error(data.error || 'Something went wrong.');
    error.status = res.status;
    throw error;
  }
  return data;
}

// ---- Safety: stop user-provided text from being run as HTML ----
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatPrice(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---- Small popup message ----
function showToast(message, isError = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = 'toast show' + (isError ? ' error' : '');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => (toast.className = 'toast'), 2500);
}

// Fallback picture if an image URL fails to load
function imageFallback(img) {
  img.onerror = null;
  img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e5e7eb"/>' +
    '<text x="50%" y="50%" fill="#9ca3af" font-family="sans-serif" font-size="22" text-anchor="middle">No image</text></svg>'
  );
}

// ---- Navbar: shows Login/Register or user name + Logout, and cart count ----
async function setupNavbar() {
  const nav = document.getElementById('nav-links');
  if (!nav) return null;

  let me = { loggedIn: false };
  try { me = await api('/api/auth/me'); } catch (e) { /* server offline */ }

  if (me.loggedIn) {
    nav.innerHTML = `
      <a href="/index.html">Shop</a>
      <a href="/orders.html">My Orders</a>
      <a href="/cart.html">Cart <span class="cart-badge" id="cart-count">0</span></a>
      <span>Hi, ${escapeHtml(me.name)}</span>
      <button class="link-btn" id="logout-btn">Logout</button>`;
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await api('/api/auth/logout', { method: 'POST' });
      window.location.href = '/index.html';
    });
    refreshCartCount();
  } else {
    nav.innerHTML = `
      <a href="/index.html">Shop</a>
      <a href="/login.html">Login</a>
      <a class="btn" href="/register.html">Register</a>`;
  }
  return me;
}

async function refreshCartCount() {
  const badge = document.getElementById('cart-count');
  if (!badge) return;
  try {
    const cart = await api('/api/cart');
    badge.textContent = cart.items.reduce((n, i) => n + i.quantity, 0);
  } catch (e) { /* ignore */ }
}

// Redirect to login if the page needs a logged-in user
async function requireLoginOrRedirect() {
  const me = await setupNavbar();
  if (!me || !me.loggedIn) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}
