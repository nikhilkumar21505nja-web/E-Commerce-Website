const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Never store plain-text passwords: store a salted bcrypt hash.
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    req.session.userId = result.insertId;
    req.session.userName = name;
    res.status(201).json({ id: result.insertId, name, email });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email]
    );
    // Same message for "no user" and "wrong password" so attackers can't probe which emails exist.
    const user = rows[0];
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });

    // New session id on login prevents session-fixation attacks.
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ error: 'Could not start session.' });
      req.session.userId = user.id;
      req.session.userName = user.name;
      res.json({ id: user.id, name: user.name, email: user.email });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out.' });
  });
});

// GET /api/auth/me  -> who is logged in right now (used by the navbar)
router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ loggedIn: false });
  res.json({ loggedIn: true, id: req.session.userId, name: req.session.userName });
});

module.exports = router;
