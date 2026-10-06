const form = document.getElementById('checkout-form');
const errorBox = document.getElementById('error');
const placeBtn = document.getElementById('place-btn');

async function loadSummary() {
  const cart = await api('/api/cart');

  // Nothing to buy -> go back to the cart page
  if (cart.items.length === 0) {
    window.location.href = '/cart.html';
    return;
  }

  document.getElementById('summary-items').innerHTML = cart.items.map((i) => `
    <div class="summary-item">
      <span>${escapeHtml(i.name)} × ${i.quantity}</span>
      <span>${formatPrice(Number(i.price) * i.quantity)}</span>
    </div>`).join('');
  document.getElementById('summary-total').textContent = formatPrice(cart.total);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.textContent = '';
  placeBtn.disabled = true;

  const body = {
    fullName: document.getElementById('fullName').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    postalCode: document.getElementById('postalCode').value,
    paymentMethod: document.getElementById('paymentMethod').value,
  };

  try {
    const result = await api('/api/orders', { method: 'POST', body });
    document.getElementById('checkout-view').style.display = 'none';
    document.getElementById('success-view').style.display = 'block';
    document.getElementById('success-text').textContent =
      `Your order #${result.orderId} for ${formatPrice(result.total)} has been placed successfully.`;
    refreshCartCount();
  } catch (err) {
    errorBox.textContent = err.message;
    placeBtn.disabled = false;
  }
});

(async function init() {
  if (await requireLoginOrRedirect()) loadSummary();
})();
