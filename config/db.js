require('dotenv').config();
const mysql = require('mysql2/promise');

// Connection pool: reuses connections instead of opening a new one per request.
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ecommerce_db',
};

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
module.exports.dbConfig = dbConfig;
