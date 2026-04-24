const mysql = require('mysql2/promise');
const config = require('../../mysql-config');

let pool;

async function connect() {
  if (pool) return pool;
  
  pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  
  return pool;
}

const db = {
  run: async (sql, params = []) => {
    const p = await connect();
    const [result] = await p.query(sql, params);
    return result;
  },
  get: async (sql, params = []) => {
    const p = await connect();
    const [rows] = await p.query(sql, params);
    return rows[0];
  },
  all: async (sql, params = []) => {
    const p = await connect();
    const [rows] = await p.query(sql, params);
    return rows;
  }
};

module.exports = { connect, db };
