# 🛍️ ShopEasy – E-Commerce Website

A full-stack e-commerce web application with an end-to-end shopping experience: product browsing, cart management and checkout, backed by secure user authentication and a MySQL database.

## Features

- **Product browsing** – product grid with live search and category filter
- **Cart management** – add items, change quantities, remove items (stored per user in MySQL)
- **Checkout flow** – shipping details, payment method, order confirmation, order history
- **Secure authentication** – registration and login with bcrypt-hashed passwords
- **Session management** – server-side sessions stored in MySQL, HTTP-only cookies
- **Data integrity** – foreign keys, unique constraints, and a transactional checkout (stock is checked and reduced atomically)
- **Responsive UI** – works on mobile, tablet and desktop

## Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | HTML5, CSS3, JavaScript (vanilla)             |
| Backend   | Node.js, Express                              |
| Database  | MySQL (`mysql2` driver)                       |
| Auth      | `bcryptjs`, `express-session`, `express-mysql-session` |

## Project Structure

```
ecommerce-website/
├── server.js              # App entry point
├── package.json
├── .env.example           # Copy to .env and edit
├── config/
│   └── db.js              # MySQL connection pool
├── middleware/
│   └── auth.js            # requireLogin guard
├── routes/
│   ├── auth.js            # register / login / logout / me
│   ├── products.js        # list, search, categories
│   ├── cart.js            # cart CRUD
│   └── orders.js          # checkout + order history
├── database/
│   └── schema.sql         # Tables + sample products
└── public/                # Frontend
    ├── index.html  login.html  register.html
    ├── cart.html   checkout.html  orders.html
    ├── css/style.css
    └── js/  app.js products.js auth.js cart.js checkout.js orders.js
```

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) 18 or newer
- [MySQL](https://dev.mysql.com/downloads/) 8 or newer

### 1. Install dependencies
```bash
npm install
```

### 2. Create the database
```bash
mysql -u root -p < database/schema.sql
```
This creates the `ecommerce_db` database, all tables, and 12 sample products.

### 3. Configure environment variables
```bash
cp .env.example .env
```
Open `.env` and set your MySQL password and a random `SESSION_SECRET`.

### 4. Run the app
```bash
npm start
```
Open **http://localhost:3000** in your browser.

## Database Schema

| Table         | Purpose                                              |
|---------------|------------------------------------------------------|
| `users`       | Customer accounts (email unique, password hash)      |
| `products`    | Catalogue with price, category and stock             |
| `cart_items`  | One row per user + product (unique pair)             |
| `orders`      | Order header: totals, shipping info, status          |
| `order_items` | Line items, with product name/price snapshot         |
| `sessions`    | Created automatically by `express-mysql-session`     |

## API Overview

| Method | Endpoint                   | Auth | Description               |
|--------|----------------------------|------|---------------------------|
| POST   | `/api/auth/register`       | –    | Create account            |
| POST   | `/api/auth/login`          | –    | Log in                    |
| POST   | `/api/auth/logout`         | –    | Log out                   |
| GET    | `/api/auth/me`             | –    | Current user              |
| GET    | `/api/products`            | –    | List (`?search=&category=`) |
| GET    | `/api/products/:id`        | –    | Single product            |
| GET    | `/api/cart`                | ✔    | View cart                 |
| POST   | `/api/cart`                | ✔    | Add item                  |
| PUT    | `/api/cart/:productId`     | ✔    | Set quantity              |
| DELETE | `/api/cart/:productId`     | ✔    | Remove item               |
| POST   | `/api/orders`              | ✔    | Checkout                  |
| GET    | `/api/orders`              | ✔    | Order history             |

## Security Notes

- Passwords are hashed with bcrypt (never stored in plain text)
- All SQL uses parameterised queries (protects against SQL injection)
- Session cookies are `httpOnly` and `sameSite=lax`; session ID is regenerated on login
- User-supplied text is escaped before being rendered in the browser (protects against XSS)
- Secrets live in `.env`, which is git-ignored

## Possible Improvements

- Admin dashboard to add/edit products
- Real payment gateway (Razorpay / Stripe)
- Product detail page and reviews
- Email order confirmations

## License

MIT
