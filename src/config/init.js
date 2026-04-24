const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createTables(pool) {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL DEFAULT '',
        phone VARCHAR(20),
        address TEXT,
        avatar_url TEXT,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        role VARCHAR(20) NOT NULL DEFAULT 'customer',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'other',
        brand VARCHAR(100),
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        description TEXT,
        images JSON,
        specs JSON,
        stock_quantity INT DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255),
        source VARCHAR(50) NOT NULL DEFAULT 'manual',
        status VARCHAR(50) NOT NULL DEFAULT 'new',
        product_interest VARCHAR(255),
        notes TEXT,
        assigned_to VARCHAR(36),
        customer_user_id VARCHAR(36),
        follow_up_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS call_history (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        telecaller_id VARCHAR(36) NOT NULL,
        outcome VARCHAR(50) NOT NULL,
        remarks TEXT,
        duration_seconds INT,
        follow_up_at DATETIME,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS lead_remarks (
        id VARCHAR(36) PRIMARY KEY,
        lead_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36),
        remark TEXT NOT NULL,
        remark_type VARCHAR(50),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL DEFAULT '',
        subtitle TEXT,
        image_url TEXT NOT NULL DEFAULT '',
        cta_text VARCHAR(100),
        cta_link VARCHAR(255),
        page VARCHAR(50) NOT NULL DEFAULT 'home',
        position INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        banner_type VARCHAR(50) NOT NULL DEFAULT 'hero',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS social_media_links (
        id VARCHAR(36) PRIMARY KEY,
        platform VARCHAR(50) NOT NULL,
        url VARCHAR(255) NOT NULL,
        icon_name VARCHAR(50) NOT NULL DEFAULT '',
        display_order INT NOT NULL DEFAULT 0,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(36) PRIMARY KEY,
        \`key\` VARCHAR(100) UNIQUE NOT NULL,
        value JSON,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS loyalty_points (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) UNIQUE NOT NULL,
        points INT NOT NULL DEFAULT 0,
        lifetime_earned INT NOT NULL DEFAULT 0,
        lifetime_redeemed INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        points INT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'earn',
        description TEXT,
        order_reference VARCHAR(100),
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    conn.release();
  }
}

async function seed(pool) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT COUNT(*) as c FROM users');
    if (rows[0].c > 0) return;

    const adminId = uuidv4();
    const telecallerId = uuidv4();
    const customerId = uuidv4();
    const hash = (p) => bcrypt.hashSync(p, 10);

    await conn.query(
      'INSERT INTO users (id,email,password_hash,full_name,role) VALUES (?,?,?,?,?)',
      [adminId, 'admin@chauhaan.com', hash('admin123'), 'Admin User', 'admin']
    );
    await conn.query(
      'INSERT INTO users (id,email,password_hash,full_name,role,phone) VALUES (?,?,?,?,?,?)',
      [telecallerId, 'telecaller@chauhaan.com', hash('tele123'), 'Rahul Sharma', 'telecaller', '9876543210']
    );
    await conn.query(
      'INSERT INTO users (id,email,password_hash,full_name,role,phone) VALUES (?,?,?,?,?,?)',
      [customerId, 'customer@chauhaan.com', hash('cust123'), 'Priya Mehta', 'customer', '9123456789']
    );

    await conn.query(
      'INSERT INTO loyalty_points (id,user_id,points,lifetime_earned) VALUES (?,?,?,?)',
      [uuidv4(), customerId, 250, 250]
    );

    const products = [
      { name: 'Dell Inspiron 15', category: 'dell-laptop', brand: 'Dell', price: 49999, description: 'Versatile everyday laptop', stock: 10, specs: { list: ['Intel Core i5-1335U', '16GB DDR5', '512GB NVMe SSD', '15.6" FHD IPS'], ram: '16GB', storage: '512GB SSD', rating: 4.4, reviews: 456, badge: 'Popular' } },
      { name: 'HP Pavilion 15', category: 'hp-laptop', brand: 'HP', price: 47999, description: 'Everyday laptop with AMD power', stock: 8, specs: { list: ['AMD Ryzen 5 7530U', '16GB DDR4', '512GB NVMe SSD'], ram: '16GB', storage: '512GB SSD', rating: 4.3, reviews: 389 } },
      { name: 'MacBook Air M2', category: 'macbook', brand: 'Apple', price: 99999, description: 'Supercharged by M2 chip', stock: 5, specs: { list: ['Apple M2 Chip', '8GB Unified Memory', '256GB SSD'], ram: '8GB', storage: '256GB SSD', rating: 4.8, reviews: 892, badge: 'Popular' } },
    ];

    for (const p of products) {
      await conn.query(
        'INSERT INTO products (id,name,category,brand,price,description,images,specs,stock_quantity) VALUES (?,?,?,?,?,?,?,?,?)',
        [uuidv4(), p.name, p.category, p.brand, p.price, p.description, JSON.stringify([]), JSON.stringify(p.specs), p.stock]
      );
    }

    await conn.query(
      'INSERT INTO settings (id,`key`,value) VALUES (?,?,?)',
      [uuidv4(), 'store_info', JSON.stringify({ name: 'Chauhan Computers', address: 'B-5 A, Vaibhav Enclave, Malviya Nagar, Jaipur', phone: '09509317543', phone2: '08559965655', phone3: '09376721157', whatsapp: '919509317543', hours: 'Mon-Sat 10am-8pm' })]
    );

    await conn.query(
      'INSERT INTO settings (id,`key`,value) VALUES (?,?,?)',
      [uuidv4(), 'inventory_config', JSON.stringify({ low_stock_threshold: 5 })]
    );

    console.log('✅ Database seeded with demo data');
  } finally {
    conn.release();
  }
}

module.exports = { createTables, seed };
