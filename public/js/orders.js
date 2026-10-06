const list = document.getElementById('orders-list');

async function loadOrders() {
  try {
    const orders = await api('/api/orders');

    if (orders.length === 0) {
      list.innerHTML = '<p class="empty-state">No orders yet. <a href="/index.html">Start shopping</a></p>';
      return;
    }

    list.innerHTML = orders.map((o) => `
      <div class="order-card">
        <div class="order-head">
          <div>
            <strong>Order #${o.id}</strong><br />
            <small>${new Date(o.created_at).toLocaleString('en-IN')} · ${o.payment_method === 'COD' ? 'Cash on Delivery' : 'Online'}</small>
          </div>
          <div style="text-align:right">
            <span class="status-badge">${escapeHtml(o.status)}</span><br />
            <strong>${formatPrice(o.total)}</strong>
          </div>
        </div>
        ${o.items.map((i) => `
          <div class="order-line">
            <span>${escapeHtml(i.product_name)} × ${i.quantity}</span>
            <span>${formatPrice(Number(i.price) * i.quantity)}</span>
          </div>`).join('')}
      </div>`).join('');
  } catch (err) {
    list.innerHTML = `<p class="empty-state">${escapeHtml(err.message)}</p>`;
  }
}

(async function init() {
  if (await requireLoginOrRedirect()) loadOrders();
})();
