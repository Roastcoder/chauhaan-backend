require('dotenv').config();
const { Pool } = require('pg');
const config = require('./db-config');

async function migrate() {
  const pool = new Pool(config);
  const client = await pool.connect();
  try {
    console.log("🚀 Starting database migration for orders...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(100) PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        receipt VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'created',
        razorpay_payment_id VARCHAR(255),
        razorpay_signature VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Orders table verified");

    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(100) NOT NULL REFERENCES orders(id),
        product_id UUID NOT NULL REFERENCES products(id),
        quantity INT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Order items table verified");

    console.log("🎉 Migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
