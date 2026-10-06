const grid = document.getElementById('product-grid');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category');

let isLoggedIn = false;

async function loadCategories() {
  try {
    const categories = await api('/api/products/categories');
    categories.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      categorySelect.appendChild(opt);
    });
  } catch (e) { /* ignore */ }
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (searchInput.value.trim()) params.set('search', searchInput.value.trim());
  if (categorySelect.value) params.set('category', categorySelect.value);

  try {
    const products = await api('/api/products?' + params.toString());
    renderProducts(products);
  } catch (err) {
    grid.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
  }
}

function renderProducts(products) {
  if (products.length === 0) {
    grid.innerHTML = '<p class="empty-state">No products found.</p>';
    return;
  }

  grid.innerHTML = products.map((p) => `
    <article class="product-card">
      <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="imageFallback(this)" />
      <div class="product-body">
        <span class="product-category">${escapeHtml(p.category)}</span>
        <h3 class="product-name">${escapeHtml(p.name)}</h3>
        <p class="product-desc">${escapeHtml(p.description)}</p>
        <div class="product-footer">
          <span class="price">${formatPrice(p.price)}</span>
          ${p.stock > 0
            ? `<button class="btn add-btn" data-id="${p.id}">Add to cart</button>`
            : '<span class="out-of-stock">Out of stock</span>'}
        </div>
      </div>
    </article>`).join('');
}

// One click listener for all "Add to cart" buttons
grid.addEventListener('click', async (e) => {
  const btn = e.target.closest('.add-btn');
  if (!btn) return;

  if (!isLoggedIn) {
    window.location.href = '/login.html';
    return;
  }

  btn.disabled = true;
  try {
    await api('/api/cart', { method: 'POST', body: { productId: Number(btn.dataset.id), quantity: 1 } });
    showToast('Added to cart ✔');
    refreshCartCount();
  } catch (err) {
    showToast(err.message, true);
  } finally {
    btn.disabled = false;
  }
});

// Wait a moment after typing before searching
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadProducts, 300);
});
categorySelect.addEventListener('change', loadProducts);

(async function init() {
  const me = await setupNavbar();
  isLoggedIn = !!(me && me.loggedIn);
  await loadCategories();
  await loadProducts();
})();
