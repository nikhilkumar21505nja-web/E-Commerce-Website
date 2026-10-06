const express = require('express');
const pool = require('../config/db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();
router.use(requireLogin); // every cart route needs a logged-in user

// GET /api/cart  -> items + total
router.get('/', async (req, res) => {
  try {
    const [items] = await pool.query(
      `SELECT c.product_id, c.quantity, p.name, p.price, p.image_url, p.stock
         FROM cart_items c
         JOIN products p ON p.id = c.product_id
        WHERE c.user_id = ?
        ORDER BY c.id ASC`,
      [req.session.userId]
    );
    const total = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
    res.json({ items, total: Number(total.toFixed(2)) });
  } catch (err) {
    console.error('Cart load error:', err);
    res.status(500).json({ error: 'Could not load cart.' });
  }
});

// POST /api/cart  { productId, quantity }  -> add (or increase) an item
router.post('/', async (req, res) => {
  try {
    const productId = Number(req.body.productId);
    const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);

    const [products] = await pool.query('SELECT id, stock FROM products WHERE id = ?', [productId]);
    if (products.length === 0) return res.status(404).json({ error: 'Product not found.' });

    const [existing] = await pool.query(
      'SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.session.userId, productId]
    );
    const newQty = (existing[0] ? existing[0].quantity : 0) + quantity;
    if (newQty > products[0].stock) {
      return res.status(400).json({ error: `Only ${products[0].stock} left in stock.` });
    }

    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = ?`,
      [req.session.userId, productId, quantity, newQty]
    );
    res.status(201).json({ message: 'Added to cart.' });
  } catch (err) {
    console.error('Cart add error:', err);
    res.status(500).json({ error: 'Could not add to cart.' });
  }
});

// PUT /api/cart/:productId  { quantity }  -> set an exact quantity
router.put('/:productId', async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const quantity = parseInt(req.body.quantity, 10);
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1.' });
    }

    const [products] = await pool.query('SELECT stock FROM products WHERE id = ?', [productId]);
    if (products.length === 0) return res.status(404).json({ error: 'Product not found.' });
    if (quantity > products[0].stock) {
      return res.status(400).json({ error: `Only ${products[0].stock} left in stock.` });
    }

    await pool.query('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?', [
      quantity,
      req.session.userId,
      productId,
    ]);
    res.json({ message: 'Cart updated.' });
  } catch (err) {
    console.error('Cart update error:', err);
    res.status(500).json({ error: 'Could not update cart.' });
  }
});

// DELETE /api/cart/:productId  -> remove one item
router.delete('/:productId', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = ? AND product_id = ?', [
      req.session.userId,
      Number(req.params.productId),
    ]);
    res.json({ message: 'Item removed.' });
  } catch (err) {
    console.error('Cart delete error:', err);
    res.status(500).json({ error: 'Could not remove item.' });
  }
});

module.exports = router;
