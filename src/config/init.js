const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createTables(pool) {
  const client = await pool.connect();
  try {
    // Create tables using PostgreSQL syntax
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL DEFAULT '',
        phone VARCHAR(20),
        address TEXT,
        avatar_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        role VARCHAR(20) NOT NULL DEFAULT 'customer',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'other',
        brand VARCHAR(100),
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        description TEXT,
        images JSONB,
        specs JSONB,
        stock_quantity INT DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        source VARCHAR(50) NOT NULL DEFAULT 'manual',
        status VARCHAR(50) NOT NULL DEFAULT 'new',
        product_interest VARCHAR(255),
        notes TEXT,
        assigned_to UUID,
        customer_user_id UUID,
        follow_up_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS call_history (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        telecaller_id UUID NOT NULL,
        outcome VARCHAR(50) NOT NULL,
        remarks TEXT,
        duration_seconds INT,
        follow_up_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_remarks (
        id UUID PRIMARY KEY,
        lead_id UUID NOT NULL,
        user_id UUID,
        remark TEXT NOT NULL,
        remark_type VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL DEFAULT '',
        subtitle TEXT,
        image_url TEXT NOT NULL DEFAULT '',
        cta_text VARCHAR(100),
        cta_link VARCHAR(255),
        page VARCHAR(50) NOT NULL DEFAULT 'home',
        position INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        banner_type VARCHAR(50) NOT NULL DEFAULT 'hero',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS social_media_links (
        id UUID PRIMARY KEY,
        platform VARCHAR(50) NOT NULL,
        url VARCHAR(255) NOT NULL,
        icon_name VARCHAR(50) NOT NULL DEFAULT '',
        display_order INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS loyalty_points (
        id UUID PRIMARY KEY,
        user_id UUID UNIQUE NOT NULL,
        points INT NOT NULL DEFAULT 0,
        lifetime_earned INT NOT NULL DEFAULT 0,
        lifetime_redeemed INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        points INT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'earn',
        description TEXT,
        order_reference VARCHAR(100),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
  } finally {
    client.release();
  }
}

async function seed(pool) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query('SELECT COUNT(*) as c FROM users');
    if (parseInt(rows[0].c) > 0) return;

    const adminId = uuidv4();
    const telecallerId = uuidv4();
    const customerId = uuidv4();
    const hash = (p) => bcrypt.hashSync(p, 10);

    await client.query(
      'INSERT INTO users (id,email,password_hash,full_name,role) VALUES ($1,$2,$3,$4,$5)',
      [adminId, 'admin@chauhaan.com', hash('admin123'), 'Admin User', 'admin']
    );
    await client.query(
      'INSERT INTO users (id,email,password_hash,full_name,role,phone) VALUES ($1,$2,$3,$4,$5,$6)',
      [telecallerId, 'telecaller@chauhaan.com', hash('tele123'), 'Rahul Sharma', 'telecaller', '9876543210']
    );
    await client.query(
      'INSERT INTO users (id,email,password_hash,full_name,role,phone) VALUES ($1,$2,$3,$4,$5,$6)',
      [customerId, 'customer@chauhaan.com', hash('cust123'), 'Priya Mehta', 'customer', '9123456789']
    );

    await client.query(
      'INSERT INTO loyalty_points (id,user_id,points,lifetime_earned) VALUES ($1,$2,$3,$4)',
      [uuidv4(), customerId, 250, 250]
    );

    const products = [
      { name: 'Dell Inspiron 15', category: 'dell-laptop', brand: 'Dell', price: 49999, description: 'Versatile everyday laptop', stock: 10, specs: { list: ['Intel Core i5-1335U', '16GB DDR5', '512GB NVMe SSD', '15.6" FHD IPS'], ram: '16GB', storage: '512GB SSD', rating: 4.4, reviews: 456, badge: 'Popular' } },
      { name: 'HP Pavilion 15', category: 'hp-laptop', brand: 'HP', price: 47999, description: 'Everyday laptop with AMD power', stock: 8, specs: { list: ['AMD Ryzen 5 7530U', '16GB DDR4', '512GB NVMe SSD'], ram: '16GB', storage: '512GB SSD', rating: 4.3, reviews: 389 } },
      { name: 'MacBook Air M2', category: 'macbook', brand: 'Apple', price: 99999, description: 'Supercharged by M2 chip', stock: 5, specs: { list: ['Apple M2 Chip', '8GB Unified Memory', '256GB SSD'], ram: '8GB', storage: '256GB SSD', rating: 4.8, reviews: 892, badge: 'Popular' } },
    ];

    for (const p of products) {
      await client.query(
        'INSERT INTO products (id,name,category,brand,price,description,images,specs,stock_quantity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [uuidv4(), p.name, p.category, p.brand, p.price, p.description, JSON.stringify([]), JSON.stringify(p.specs), p.stock]
      );
    }

    await client.query(
      'INSERT INTO settings (id,key,value) VALUES ($1,$2,$3)',
      [uuidv4(), 'store_info', JSON.stringify({ name: 'Chauhan Computers', address: 'B-5 A, Vaibhav Enclave, Malviya Nagar, Jaipur', phone: '09509317543', phone2: '08559965655', phone3: '09376721157', whatsapp: '919509317543', hours: 'Mon-Sat 10am-8pm' })]
    );

    await client.query(
      'INSERT INTO settings (id,key,value) VALUES ($1,$2,$3)',
      [uuidv4(), 'inventory_config', JSON.stringify({ low_stock_threshold: 5 })]
    );

    console.log('✅ Database seeded with demo data');
  } finally {
    client.release();
  }
}

module.exports = { createTables, seed };
