const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// GET /api/products?search=phone&category=Electronics
router.get('/', async (req, res) => {
  try {
    const search = String(req.query.search || '').trim();
    const category = String(req.query.category || '').trim();

    let sql = 'SELECT id, name, description, price, image_url, category, stock FROM products WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY id ASC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Products error:', err);
    res.status(500).json({ error: 'Could not load products.' });
  }
});

// GET /api/products/categories
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
    res.json(rows.map((r) => r.category));
  } catch (err) {
    console.error('Categories error:', err);
    res.status(500).json({ error: 'Could not load categories.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Product error:', err);
    res.status(500).json({ error: 'Could not load product.' });
  }
});

module.exports = router;
