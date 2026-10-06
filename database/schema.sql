-- E-Commerce database schema + sample data
-- Run with:  mysql -u root -p < database/schema.sql

CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- PRODUCTS ----------
CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  image_url   VARCHAR(500),
  category    VARCHAR(60) NOT NULL,
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_products_category (category)
);

-- ---------- CART ----------
-- One row per (user, product). UNIQUE key lets us "add or increase" in one query.
CREATE TABLE IF NOT EXISTS cart_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  UNIQUE KEY uq_user_product (user_id, product_id),
  FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ---------- ORDERS ----------
CREATE TABLE IF NOT EXISTS orders (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL,
  total          DECIMAL(10,2) NOT NULL,
  status         ENUM('PLACED','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PLACED',
  full_name      VARCHAR(100) NOT NULL,
  phone          VARCHAR(20)  NOT NULL,
  address        VARCHAR(255) NOT NULL,
  city           VARCHAR(80)  NOT NULL,
  postal_code    VARCHAR(15)  NOT NULL,
  payment_method ENUM('COD','ONLINE') NOT NULL DEFAULT 'COD',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_orders_user (user_id)
);

-- Price and name are copied here so old orders stay correct even if the product changes later.
CREATE TABLE IF NOT EXISTS order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT NOT NULL,
  product_id   INT,
  product_name VARCHAR(150) NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  quantity     INT NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- ---------- SAMPLE PRODUCTS ----------
INSERT INTO products (name, description, price, image_url, category, stock) VALUES
('Wireless Headphones',   'Over-ear Bluetooth headphones with 30-hour battery life and deep bass.',  2499.00, 'https://picsum.photos/seed/headphones/400/300', 'Electronics', 25),
('Smart Watch',           'Fitness tracker with heart-rate monitor, step counter and sleep tracking.', 3299.00, 'https://picsum.photos/seed/smartwatch/400/300',  'Electronics', 18),
('Bluetooth Speaker',     'Portable waterproof speaker with 12 hours of playtime.',                   1799.00, 'https://picsum.photos/seed/speaker/400/300',     'Electronics', 30),
('Laptop Backpack',       'Water-resistant backpack with padded compartment for 15.6" laptops.',        1299.00, 'https://picsum.photos/seed/backpack/400/300',    'Fashion',     40),
('Cotton T-Shirt',        'Soft, breathable 100% cotton t-shirt available in everyday colours.',        499.00, 'https://picsum.photos/seed/tshirt/400/300',      'Fashion',     80),
('Running Shoes',         'Lightweight cushioned running shoes with a non-slip sole.',                 2199.00, 'https://picsum.photos/seed/shoes/400/300',       'Fashion',     35),
('Sunglasses',            'UV400 protection polarised sunglasses with a lightweight frame.',            899.00, 'https://picsum.photos/seed/sunglasses/400/300',  'Fashion',     50),
('Ceramic Coffee Mug',    'Handmade 350 ml ceramic mug, microwave and dishwasher safe.',                349.00, 'https://picsum.photos/seed/mug/400/300',         'Home',        100),
('Table Lamp',            'Minimal LED desk lamp with three brightness levels and a USB port.',         799.00, 'https://picsum.photos/seed/lamp/400/300',        'Home',        45),
('Yoga Mat',              'Non-slip 6 mm thick yoga mat with a carrying strap.',                        699.00, 'https://picsum.photos/seed/yogamat/400/300',     'Sports',      60),
('Stainless Water Bottle','1 litre insulated bottle that keeps drinks cold for 24 hours.',              599.00, 'https://picsum.photos/seed/bottle/400/300',      'Sports',      75),
('Notebook Set',          'Pack of 3 ruled notebooks with 200 pages each.',                             299.00, 'https://picsum.photos/seed/notebook/400/300',    'Stationery',  120);
