require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function initializeDatabase() {
  const config = {
    host: process.env.DB_HOST || 'srv1743.hstgr.io',
    port: 3306,
    user: process.env.DB_USER || 'u463483684_data',
    password: process.env.DB_PASSWORD || 'System@280303',
    database: process.env.DB_NAME || 'u463483684_chouhan',
    connectTimeout: 10000,
    multipleStatements: true
  };

  console.log('🔌 Connecting to MySQL database...');
  const connection = await mysql.createConnection(config);
  
  console.log('✅ Connected to database:', config.database);
  
  // Create all tables
  console.log('📤 Creating tables...');
  
  await connection.query(`
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

  await connection.query(`
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

  await connection.query(`
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

  await connection.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id VARCHAR(36) PRIMARY KEY,
      \`key\` VARCHAR(100) UNIQUE NOT NULL,
      value JSON,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
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

  await connection.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
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

  await connection.query(`
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

  await connection.query(`
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

  await connection.query(`
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

  await connection.query(`
    CREATE TABLE IF NOT EXISTS lead_remarks (
      id VARCHAR(36) PRIMARY KEY,
      lead_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(36),
      remark TEXT NOT NULL,
      remark_type VARCHAR(50),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await connection.query(`
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

  console.log('✅ All tables created');

  // Check if we need to seed
  const [rows] = await connection.query('SELECT COUNT(*) as c FROM users');
  if (rows[0].c === 0) {
    console.log('📦 Seeding initial data...');
    
    const adminId = uuidv4();
    const hash = bcrypt.hashSync('admin123', 10);
    
    await connection.query(
      'INSERT INTO users (id,email,password_hash,full_name,role) VALUES (?,?,?,?,?)',
      [adminId, 'admin@chauhaan.com', hash, 'Admin User', 'admin']
    );

    await connection.query(
      'INSERT INTO settings (id,`key`,value) VALUES (?,?,?)',
      [uuidv4(), 'store_info', JSON.stringify({ 
        name: 'Chauhan Computers', 
        address: 'B-5 A, Vaibhav Enclave, Malviya Nagar, Jaipur', 
        phone: '09509317543', 
        phone2: '08559965655', 
        phone3: '09376721157', 
        whatsapp: '919509317543', 
        hours: 'Mon-Sat 10am-8pm' 
      })]
    );

    await connection.query(
      'INSERT INTO settings (id,`key`,value) VALUES (?,?,?)',
      [uuidv4(), 'inventory_config', JSON.stringify({ low_stock_threshold: 5 })]
    );

    console.log('✅ Initial data seeded');
    console.log('👤 Admin login: admin@chauhaan.com / admin123');
  } else {
    console.log('ℹ️  Database already has data, skipping seed');
  }
  
  await connection.end();
  console.log('✅ Database initialization complete!');
}

initializeDatabase().catch(err => {
  console.error('❌ Error:', err.message);
  console.error('Full error:', err);
  process.exit(1);
});
