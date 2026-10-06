const itemsBox = document.getElementById('cart-items');
const totalBox = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

async function loadCart() {
  try {
    const cart = await api('/api/cart');
    renderCart(cart);
  } catch (err) {
    itemsBox.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
  }
}

function renderCart(cart) {
  totalBox.textContent = formatPrice(cart.total);

  if (cart.items.length === 0) {
    itemsBox.innerHTML = '<p class="empty-state">Your cart is empty. <a href="/index.html">Start shopping</a></p>';
    checkoutBtn.style.display = 'none';
    return;
  }
  checkoutBtn.style.display = 'block';

  itemsBox.innerHTML = cart.items.map((i) => `
    <div class="cart-item">
      <img src="${escapeHtml(i.image_url)}" alt="${escapeHtml(i.name)}" onerror="imageFallback(this)" />
      <div>
        <div class="cart-item-name">${escapeHtml(i.name)}</div>
        <div>${formatPrice(i.price)}</div>
        <div class="qty-controls">
          <button data-action="dec" data-id="${i.product_id}" data-qty="${i.quantity}" aria-label="Decrease quantity">−</button>
          <span>${i.quantity}</span>
          <button data-action="inc" data-id="${i.product_id}" data-qty="${i.quantity}" aria-label="Increase quantity">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <strong>${formatPrice(Number(i.price) * i.quantity)}</strong><br />
        <button class="remove-btn" data-action="remove" data-id="${i.product_id}">Remove</button>
      </div>
    </div>`).join('');
}

itemsBox.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const id = btn.dataset.id;
  const qty = Number(btn.dataset.qty);

  try {
    if (btn.dataset.action === 'remove') {
      await api('/api/cart/' + id, { method: 'DELETE' });
    } else if (btn.dataset.action === 'inc') {
      await api('/api/cart/' + id, { method: 'PUT', body: { quantity: qty + 1 } });
    } else if (btn.dataset.action === 'dec') {
      if (qty <= 1) await api('/api/cart/' + id, { method: 'DELETE' });
      else await api('/api/cart/' + id, { method: 'PUT', body: { quantity: qty - 1 } });
    }
    await loadCart();
    refreshCartCount();
  } catch (err) {
    showToast(err.message, true);
  }
});

(async function init() {
  if (await requireLoginOrRedirect()) loadCart();
})();
