const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err.message);
});

/**
 * Execute a parameterised query.
 * @param {string} text  - SQL statement
 * @param {Array}  params - Bound parameters
 */
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
