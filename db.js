const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

const DB_PATH = path.join(__dirname, "data.db");

let db;

async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Save helper
  db.save = () => {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  };

  // run helper (execute + save)
  db.run2 = (sql, params = []) => {
    db.run(sql, params);
    db.save();
  };

  // get helper (returns first row as object)
  db.get2 = (sql, params = []) => {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return undefined;
  };

  // all helper (returns all rows as objects)
  db.all2 = (sql, params = []) => {
    const results = [];
    const stmt = db.prepare(sql);
    stmt.bind(params);
    while (stmt.step()) results.push(stmt.getAsObject());
    stmt.free();
    return results;
  };

  createTables();
  seed();
  return db;
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL DEFAULT '',
      phone TEXT,
      address TEXT,
      avatar_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      brand TEXT,
      price REAL NOT NULL DEFAULT 0,
      description TEXT,
      images TEXT NOT NULL DEFAULT '[]',
      specs TEXT NOT NULL DEFAULT '{}',
      stock_quantity INTEGER DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'new',
      product_interest TEXT,
      notes TEXT,
      assigned_to TEXT,
      customer_user_id TEXT,
      follow_up_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS call_history (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      telecaller_id TEXT NOT NULL,
      outcome TEXT NOT NULL,
      remarks TEXT,
      duration_seconds INTEGER,
      follow_up_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS lead_remarks (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      user_id TEXT,
      remark TEXT NOT NULL,
      remark_type TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS banners (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      subtitle TEXT,
      image_url TEXT NOT NULL DEFAULT '',
      cta_text TEXT,
      cta_link TEXT,
      page TEXT NOT NULL DEFAULT 'home',
      position INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      banner_type TEXT NOT NULL DEFAULT 'hero',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS social_media_links (
      id TEXT PRIMARY KEY,
      platform TEXT NOT NULL,
      url TEXT NOT NULL,
      icon_name TEXT NOT NULL DEFAULT '',
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS loyalty_points (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      lifetime_earned INTEGER NOT NULL DEFAULT 0,
      lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    subject TEXT,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      points INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'earn',
      description TEXT,
      order_reference TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.save();
}

function seed() {
  const existing = db.get2("SELECT COUNT(*) as c FROM users");
  if (existing && existing.c > 0) return;

  const adminId = uuidv4();
  const telecallerId = uuidv4();
  const customerId = uuidv4();
  const hash = (p) => bcrypt.hashSync(p, 10);
  const now = new Date().toISOString();

  db.run("INSERT INTO users (id,email,password_hash,full_name,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
    [adminId, "admin@chauhaan.com", hash("admin123"), "Admin User", "admin", now, now]);
  db.run("INSERT INTO users (id,email,password_hash,full_name,role,phone,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
    [telecallerId, "telecaller@chauhaan.com", hash("tele123"), "Rahul Sharma", "telecaller", "9876543210", now, now]);
  db.run("INSERT INTO users (id,email,password_hash,full_name,role,phone,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
    [customerId, "customer@chauhaan.com", hash("cust123"), "Priya Mehta", "customer", "9123456789", now, now]);

  db.run("INSERT INTO loyalty_points (id,user_id,points,lifetime_earned,created_at,updated_at) VALUES (?,?,?,?,?,?)",
    [uuidv4(), customerId, 250, 250, now, now]);

  const products = [
    { name: "Dell Inspiron 15", category: "dell-laptop", brand: "Dell", price: 49999, description: "Versatile everyday laptop", stock: 10, specs: { list: ["Intel Core i5-1335U", "16GB DDR5", "512GB NVMe SSD", "15.6\" FHD IPS"], ram: "16GB", storage: "512GB SSD", rating: 4.4, reviews: 456, badge: "Popular" } },
    { name: "HP Pavilion 15", category: "hp-laptop", brand: "HP", price: 47999, description: "Everyday laptop with AMD power", stock: 8, specs: { list: ["AMD Ryzen 5 7530U", "16GB DDR4", "512GB NVMe SSD"], ram: "16GB", storage: "512GB SSD", rating: 4.3, reviews: 389 } },
    { name: "MacBook Air M2", category: "macbook", brand: "Apple", price: 99999, description: "Supercharged by M2 chip", stock: 5, specs: { list: ["Apple M2 Chip", "8GB Unified Memory", "256GB SSD"], ram: "8GB", storage: "256GB SSD", rating: 4.8, reviews: 892, badge: "Popular" } },
    { name: "ProDesk Elite i9", category: "cpu-desktop", brand: "Chauhaan", price: 89999, description: "High-performance desktop workstation", stock: 3, specs: { list: ["Intel Core i9-14900K", "32GB DDR5", "1TB NVMe SSD", "NVIDIA RTX 4070"], ram: "32GB", storage: "1TB SSD", rating: 4.9, reviews: 124, badge: "Best Seller" } },
    { name: "HP LaserJet Pro MFP", category: "printers", brand: "HP", price: 24999, description: "All-in-one laser printer", stock: 15, specs: { list: ["Laser Print/Scan/Copy", "40 ppm", "Auto Duplex"], rating: 4.5, reviews: 567 } },
    { name: "Lenovo ThinkPad X1 Carbon", category: "lenovo-laptop", brand: "Lenovo", price: 139999, description: "The gold standard in business ultrabooks", stock: 4, specs: { list: ["Intel Core i7-1365U", "16GB LPDDR5", "512GB NVMe SSD", "14\" 2.8K OLED"], ram: "16GB", storage: "512GB SSD", rating: 4.9, reviews: 445, badge: "Editor's Choice" } },
  ];

  for (const p of products) {
    db.run("INSERT INTO products (id,name,category,brand,price,description,images,specs,stock_quantity,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
      [uuidv4(), p.name, p.category, p.brand, p.price, p.description, "[]", JSON.stringify(p.specs), p.stock, now, now]);
  }

  const leads = [
    { name: "Arjun Mehta", phone: "9876501234", email: "arjun@example.com", source: "meta", status: "new", product_interest: "Dell Inspiron 15", assigned_to: null },
    { name: "Sneha Patel", phone: "9876502345", email: "sneha@example.com", source: "google", status: "contacted", product_interest: "MacBook Air M2", assigned_to: telecallerId },
    { name: "Vikram Singh", phone: "9876503456", email: null, source: "whatsapp", status: "interested", product_interest: "HP Pavilion 15", assigned_to: telecallerId },
    { name: "Kavya Sharma", phone: "9876504567", email: "kavya@example.com", source: "website", status: "converted", product_interest: "ProDesk Elite i9", assigned_to: null },
    { name: "Rohan Gupta", phone: "9876505678", email: null, source: "manual", status: "not_interested", product_interest: "HP LaserJet Pro", assigned_to: null },
  ];

  const leadIds = [];
  for (const l of leads) {
    const id = uuidv4();
    leadIds.push(id);
    db.run("INSERT INTO leads (id,name,phone,email,source,status,product_interest,assigned_to,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [id, l.name, l.phone, l.email, l.source, l.status, l.product_interest, l.assigned_to, now, now]);
  }

  db.run("INSERT INTO call_history (id,lead_id,telecaller_id,outcome,remarks,created_at) VALUES (?,?,?,?,?,?)",
    [uuidv4(), leadIds[1], telecallerId, "answered", "Customer interested, will call back tomorrow", now]);
  db.run("INSERT INTO call_history (id,lead_id,telecaller_id,outcome,remarks,created_at) VALUES (?,?,?,?,?,?)",
    [uuidv4(), leadIds[2], telecallerId, "callback", "Requested callback at 5pm", now]);

  db.run("INSERT INTO settings (id,key,value,updated_at) VALUES (?,?,?,?)", [uuidv4(), "auto_assign", JSON.stringify({ enabled: false }), now]);
  db.run("INSERT INTO settings (id,key,value,updated_at) VALUES (?,?,?,?)", [uuidv4(), "loyalty_config", JSON.stringify({ points_per_100_rupees: 1, point_value_rupees: 1, enabled: true }), now]);
  db.run("INSERT INTO settings (id,key,value,updated_at) VALUES (?,?,?,?)", [uuidv4(), "store_info", JSON.stringify({ name: "Chauhaan Computers", address: "Shop No B-5, Girdhar Marg, Malviya Nagar, Jaipur", phone: "098297 21157", hours: "Mon-Sat 10am-8pm" }), now]);

  db.run("INSERT INTO social_media_links (id,platform,url,icon_name,display_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
    [uuidv4(), "Instagram", "https://instagram.com/chauhaan_computers", "instagram", 1, now, now]);
  db.run("INSERT INTO social_media_links (id,platform,url,icon_name,display_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
    [uuidv4(), "Facebook", "https://facebook.com/chauhaan_computers", "facebook", 2, now, now]);

  db.save();
  console.log("✅ Database seeded with demo data");
}

module.exports = { initDb };
