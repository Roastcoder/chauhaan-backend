require('dotenv').config();
const initSqlJs = require("sql.js");
const mysql = require('mysql2/promise');
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "data.db");

async function migrate() {
  // Load SQLite
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(DB_PATH);
  const sqliteDb = new SQL.Database(fileBuffer);

  // Connect to MySQL
  const mysqlDb = await mysql.createConnection({
    host: process.env.DB_HOST || 'srv1743.hstgr.io',
    user: process.env.DB_USER || 'u463483684_chauhan',
    password: process.env.DB_PASSWORD || 'Sparsh@280303',
    database: process.env.DB_NAME || 'u463483684_chauhaan',
  });

  console.log('✅ Connected to both databases');

  // Migrate each table
  const tables = ['users', 'products', 'leads', 'banners', 'settings', 'social_media_links', 
                  'loyalty_points', 'contact_messages', 'newsletter_subscribers'];

  for (const table of tables) {
    try {
      const stmt = sqliteDb.prepare(`SELECT * FROM ${table}`);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();

      if (rows.length === 0) {
        console.log(`⏭️  ${table}: No data to migrate`);
        continue;
      }

      // Clear MySQL table first
      await mysqlDb.query(`DELETE FROM ${table}`);

      // Insert rows
      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = columns.map(() => '?').join(',');
        
        // Handle backticks for 'key' column in settings table
        const columnNames = columns.map(c => c === 'key' ? '`key`' : c).join(',');
        
        await mysqlDb.query(
          `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders})`,
          values
        );
      }

      console.log(`✅ ${table}: Migrated ${rows.length} rows`);
    } catch (err) {
      console.error(`❌ ${table}: ${err.message}`);
    }
  }

  await mysqlDb.end();
  console.log('🎉 Migration complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
