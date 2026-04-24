const { Pool } = require('pg');
const config = require('../../db-config');

let pool;

async function connect() {
  if (pool) return pool;
  pool = new Pool(config);
  return pool;
}

// Helper to convert '?' placeholders to '$1, $2, ...' for PostgreSQL
function convertPlaceholders(sql) {
  let count = 1;
  return sql.replace(/\?/g, () => `$${count++}`);
}

const db = {
  query: async (text, params = []) => {
    const p = await connect();
    const pgSql = convertPlaceholders(text);
    return p.query(pgSql, params);
  },
  run: async (sql, params = []) => {
    const p = await connect();
    const pgSql = convertPlaceholders(sql);
    const result = await p.query(pgSql, params);
    return result;
  },
  get: async (sql, params = []) => {
    const p = await connect();
    const pgSql = convertPlaceholders(sql);
    const { rows } = await p.query(pgSql, params);
    return rows[0];
  },
  all: async (sql, params = []) => {
    const p = await connect();
    const pgSql = convertPlaceholders(sql);
    const { rows } = await p.query(pgSql, params);
    return rows;
  }
};

module.exports = { connect, db };
