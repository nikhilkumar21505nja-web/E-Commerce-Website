require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { dbConfig } = require('./config/db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions are stored in MySQL (table "sessions" is created automatically),
// so users stay logged in even if the server restarts.
const sessionStore = new MySQLStore(dbConfig);

app.use(
  session({
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // JavaScript in the browser cannot read the cookie
      sameSite: 'lax', // basic protection against CSRF
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Frontend (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Unknown API route -> JSON 404
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
