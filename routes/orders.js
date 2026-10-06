const express = require('express');
const pool = require('../config/db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin);

// POST /api/orders  -> checkout: turn the cart into an order
router.post('/', async (req, res) => {
  const fullName = String(req.body.fullName || '').trim();
  const phone = String(req.body.phone || '').trim();
  const address = String(req.body.address || '').trim();
  const city = String(req.body.city || '').trim();
  const postalCode = String(req.body.postalCode || '').trim();
  const paymentMethod = req.body.paymentMethod === 'ONLINE' ? 'ONLINE' : 'COD';

  if (!fullName || !phone || !address || !city || !postalCode) {
    return res.status(400).json({ error: 'Please fill in all shipping details.' });
  }

  const conn = await pool.getConnection();
  try {
    // A transaction makes the whole checkout "all or nothing".
    await conn.beginTransaction();

    // FOR UPDATE locks these product rows so two buyers can't grab the last item at once.
    const [items] = await conn.query(
      `SELECT c.product_id, c.quantity, p.name, p.price, p.stock
         FROM cart_items c
         JOIN products p ON p.id = c.product_id
        WHERE c.user_id = ?
          FOR UPDATE`,
      [req.session.userId]
    );

    if (items.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'Your cart is empty.' });
    }

    for (const item of items) {
      if (item.quantity > item.stock) {
        await conn.rollback();
        return res.status(400).json({ error: `Not enough stock for "${item.name}".` });
      }
    }

    const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

    const [orderResult] = await conn.query(
      `INSERT INTO orders (user_id, total, full_name, phone, address, city, postal_code, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.session.userId, total.toFixed(2), fullName, phone, address, city, postalCode, paymentMethod]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.name, item.price, item.quantity]
      );
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [req.session.userId]);
    await conn.commit();

    res.status(201).json({ orderId, total: Number(total.toFixed(2)) });
  } catch (err) {
    await conn.rollback();
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Checkout failed. Please try again.' });
  } finally {
    conn.release();
  }
});

// GET /api/orders  -> the logged-in user's order history
router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT id, total, status, payment_method, created_at
         FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
      [req.session.userId]
    );

    for (const order of orders) {
      const [items] = await pool.query(
        'SELECT product_name, price, quantity FROM order_items WHERE order_id = ?',
        [order.id]
      );
      order.items = items;
    }
    res.json(orders);
  } catch (err) {
    console.error('Orders error:', err);
    res.status(500).json({ error: 'Could not load orders.' });
  }
});

module.exports = router;
