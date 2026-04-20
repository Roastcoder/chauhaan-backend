require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Choose database based on environment with fallback
let dbModule = './db'; // Default to SQLite
let dbType = 'SQLite';

if (process.env.DB_TYPE === 'mysql') {
  try {
    dbModule = './db-mysql';
    dbType = 'MySQL';
  } catch (err) {
    console.warn('⚠️  MySQL module failed, falling back to SQLite');
    dbModule = './db';
    dbType = 'SQLite';
  }
}

const { initDb } = require(dbModule);
console.log(`🗄️  Using ${dbType} database`);

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = "chauhaan-computers-secret-2024";
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

const ALLOWED_ORIGINS = [
  /^http:\/\/localhost(:\d+)?$/,
  "https://chauhancomputers.co.in",
  "https://www.chauhancomputers.co.in",
  "https://hotpink-wolverine-210632.hostingersite.com",
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = ALLOWED_ORIGINS.some(o => typeof o === "string" ? o === origin : o.test(origin));
    cb(allowed ? null : new Error("CORS blocked"), allowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Handle preflight requests
app.options('*', cors());

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

let db;

// ── Auth middleware ──────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

// ── Health check ────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", message: "Chauhaan Computers API is running 🚀" }));

// ── Auth ─────────────────────────────────────────────────────────────────────
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user = db.get2("SELECT * FROM users WHERE email = ?", [email]);
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  const { password_hash, ...profile } = user;
  res.json({ token, user: { ...profile, is_active: !!profile.is_active } });
});

app.post("/api/auth/signup", (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password || !full_name) return res.status(400).json({ error: "Missing fields" });
  if (db.get2("SELECT id FROM users WHERE email = ?", [email]))
    return res.status(400).json({ error: "Email already registered" });
  const id = uuidv4();
  const now = new Date().toISOString();
  db.run2("INSERT INTO users (id,email,password_hash,full_name,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
    [id, email, bcrypt.hashSync(password, 10), full_name, "customer", now, now]);
  db.run2("INSERT INTO loyalty_points (id,user_id,created_at,updated_at) VALUES (?,?,?,?)", [uuidv4(), id, now, now]);
  res.json({ message: "Account created" });
});

app.get("/api/auth/me", auth, (req, res) => {
  const user = db.get2("SELECT * FROM users WHERE id = ?", [req.user.id]);
  if (!user) return res.status(404).json({ error: "Not found" });
  const { password_hash, ...profile } = user;
  res.json({ ...profile, is_active: !!profile.is_active });
});

// ── Products ─────────────────────────────────────────────────────────────────
function parseProduct(row) {
  return { ...row, specs: JSON.parse(row.specs || "{}"), images: JSON.parse(row.images || "[]"), is_active: !!row.is_active };
}

app.get("/api/products", (req, res) => {
  res.json(db.all2("SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC").map(parseProduct));
});

app.get("/api/products/all", auth, requireRole("admin"), (req, res) => {
  res.json(db.all2("SELECT * FROM products ORDER BY created_at DESC").map(parseProduct));
});

app.post("/api/products", auth, requireRole("admin"), (req, res) => {
  const { name, category, brand, price, description, stock_quantity, specs, images } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  const id = uuidv4(); const now = new Date().toISOString();
  db.run2("INSERT INTO products (id,name,category,brand,price,description,images,specs,stock_quantity,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
    [id, name, category || "other", brand || "", price || 0, description || "", JSON.stringify(images || []), JSON.stringify(specs || {}), stock_quantity || 0, now, now]);
  res.json(parseProduct(db.get2("SELECT * FROM products WHERE id = ?", [id])));
});

app.put("/api/products/:id", auth, requireRole("admin"), (req, res) => {
  const { name, category, brand, price, description, stock_quantity, specs, images, is_active } = req.body;
  const now = new Date().toISOString();
  db.run2("UPDATE products SET name=?,category=?,brand=?,price=?,description=?,images=?,specs=?,stock_quantity=?,is_active=?,updated_at=? WHERE id=?",
    [name, category, brand, price, description, JSON.stringify(images || []), JSON.stringify(specs || {}), stock_quantity, is_active !== undefined ? (is_active ? 1 : 0) : 1, now, req.params.id]);
  res.json({ success: true });
});

app.delete("/api/products/:id", auth, requireRole("admin"), (req, res) => {
  db.run2("DELETE FROM products WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

// ── Banners ───────────────────────────────────────────────────────────────────
function parseBanner(row) { return { ...row, is_active: !!row.is_active }; }

app.get("/api/banners", (req, res) => {
  const { page, type } = req.query;
  let q = "SELECT * FROM banners WHERE is_active = 1"; const params = [];
  if (page) { q += " AND page = ?"; params.push(page); }
  if (type) { q += " AND banner_type = ?"; params.push(type); }
  q += " ORDER BY position ASC";
  res.json(db.all2(q, params).map(parseBanner));
});

app.get("/api/banners/all", auth, requireRole("admin"), (req, res) => {
  res.json(db.all2("SELECT * FROM banners ORDER BY page, position").map(parseBanner));
});

app.post("/api/banners", auth, requireRole("admin"), (req, res) => {
  const { title, subtitle, image_url, cta_text, cta_link, page, position, is_active, banner_type } = req.body;
  if (!image_url) return res.status(400).json({ error: "image_url required" });
  const id = uuidv4(); const now = new Date().toISOString();
  db.run2("INSERT INTO banners (id,title,subtitle,image_url,cta_text,cta_link,page,position,is_active,banner_type,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [id, title || "", subtitle || "", image_url, cta_text || "", cta_link || "/", page || "home", position || 0, is_active !== false ? 1 : 0, banner_type || "hero", now, now]);
  res.json(parseBanner(db.get2("SELECT * FROM banners WHERE id = ?", [id])));
});

app.put("/api/banners/:id", auth, requireRole("admin"), (req, res) => {
  const { title, subtitle, image_url, cta_text, cta_link, page, position, is_active, banner_type } = req.body;
  const now = new Date().toISOString();
  const b = db.get2("SELECT * FROM banners WHERE id = ?", [req.params.id]);
  if (!b) return res.status(404).json({ error: "Not found" });
  db.run2("UPDATE banners SET title=?,subtitle=?,image_url=?,cta_text=?,cta_link=?,page=?,position=?,is_active=?,banner_type=?,updated_at=? WHERE id=?",
    [title ?? b.title, subtitle ?? b.subtitle, image_url ?? b.image_url, cta_text ?? b.cta_text, cta_link ?? b.cta_link, page ?? b.page, position ?? b.position, is_active !== undefined ? (is_active ? 1 : 0) : b.is_active, banner_type ?? b.banner_type, now, req.params.id]);
  res.json({ success: true });
});

app.delete("/api/banners/:id", auth, requireRole("admin"), (req, res) => {
  db.run2("DELETE FROM banners WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

// ── Leads ─────────────────────────────────────────────────────────────────────
app.get("/api/leads", auth, requireRole("admin", "telecaller"), (req, res) => {
  if (req.user.role === "telecaller") {
    res.json(db.all2("SELECT * FROM leads WHERE assigned_to = ? ORDER BY created_at DESC", [req.user.id]));
  } else {
    res.json(db.all2("SELECT * FROM leads ORDER BY created_at DESC"));
  }
});

app.post("/api/leads", auth, (req, res) => {
  const { name, phone, email, source, product_interest, notes, customer_user_id } = req.body;
  if (!name || !phone) return res.status(400).json({ error: "name and phone required" });
  const id = uuidv4(); const now = new Date().toISOString();
  db.run2("INSERT INTO leads (id,name,phone,email,source,product_interest,notes,customer_user_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [id, name, phone, email || null, source || "manual", product_interest || null, notes || null, customer_user_id || null, now, now]);
  res.json(db.get2("SELECT * FROM leads WHERE id = ?", [id]));
});

app.put("/api/leads/:id", auth, requireRole("admin", "telecaller"), (req, res) => {
  const { status, assigned_to, follow_up_at, notes } = req.body;
  const now = new Date().toISOString();
  const lead = db.get2("SELECT * FROM leads WHERE id = ?", [req.params.id]);
  if (!lead) return res.status(404).json({ error: "Not found" });
  db.run2("UPDATE leads SET status=?,assigned_to=?,follow_up_at=?,notes=?,updated_at=? WHERE id=?",
    [status ?? lead.status, assigned_to !== undefined ? assigned_to : lead.assigned_to, follow_up_at !== undefined ? follow_up_at : lead.follow_up_at, notes ?? lead.notes, now, req.params.id]);
  res.json({ success: true });
});

app.post("/api/leads/bulk", auth, requireRole("admin"), (req, res) => {
  const { leads } = req.body;
  if (!Array.isArray(leads)) return res.status(400).json({ error: "leads array required" });
  const now = new Date().toISOString();
  for (const l of leads) {
    if (!l.name || !l.phone) continue;
    db.run("INSERT INTO leads (id,name,phone,email,source,product_interest,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
      [uuidv4(), l.name, l.phone, l.email || null, l.source || "manual", l.product_interest || null, now, now]);
  }
  db.save();
  res.json({ success: true });
});

// ── Calls ─────────────────────────────────────────────────────────────────────
app.get("/api/calls", auth, requireRole("admin", "telecaller"), (req, res) => {
  const { lead_id } = req.query;
  if (lead_id) {
    res.json(db.all2("SELECT * FROM call_history WHERE lead_id = ? ORDER BY created_at DESC", [lead_id]));
  } else if (req.user.role === "telecaller") {
    res.json(db.all2("SELECT ch.*, l.name as lead_name, l.phone as lead_phone FROM call_history ch LEFT JOIN leads l ON ch.lead_id = l.id WHERE ch.telecaller_id = ? ORDER BY ch.created_at DESC", [req.user.id]));
  } else {
    res.json(db.all2("SELECT * FROM call_history ORDER BY created_at DESC"));
  }
});

app.post("/api/calls", auth, requireRole("telecaller", "admin"), (req, res) => {
  const { lead_id, outcome, remarks, follow_up_at } = req.body;
  if (!lead_id || !outcome) return res.status(400).json({ error: "lead_id and outcome required" });
  const id = uuidv4(); const now = new Date().toISOString();
  db.run2("INSERT INTO call_history (id,lead_id,telecaller_id,outcome,remarks,follow_up_at,created_at) VALUES (?,?,?,?,?,?,?)",
    [id, lead_id, req.user.id, outcome, remarks || null, follow_up_at || null, now]);
  res.json({ id });
});

// ── Remarks ───────────────────────────────────────────────────────────────────
app.get("/api/remarks", auth, (req, res) => {
  const { lead_id } = req.query;
  if (!lead_id) return res.status(400).json({ error: "lead_id required" });
  res.json(db.all2("SELECT * FROM lead_remarks WHERE lead_id = ? ORDER BY created_at DESC", [lead_id]));
});

app.post("/api/remarks", auth, (req, res) => {
  const { lead_id, remark, remark_type } = req.body;
  if (!lead_id || !remark) return res.status(400).json({ error: "lead_id and remark required" });
  const id = uuidv4();
  db.run2("INSERT INTO lead_remarks (id,lead_id,user_id,remark,remark_type,created_at) VALUES (?,?,?,?,?,?)",
    [id, lead_id, req.user.id, remark, remark_type || "note", new Date().toISOString()]);
  res.json({ id });
});

// ── Users ─────────────────────────────────────────────────────────────────────
app.get("/api/users", auth, requireRole("admin"), (req, res) => {
  const { role } = req.query;
  const rows = role
    ? db.all2("SELECT id,email,full_name,phone,address,is_active,role,created_at FROM users WHERE role = ?", [role])
    : db.all2("SELECT id,email,full_name,phone,address,is_active,role,created_at FROM users");
  res.json(rows.map(r => ({ ...r, is_active: !!r.is_active })));
});

app.post("/api/users", auth, requireRole("admin"), (req, res) => {
  const { email, password, full_name, phone, role } = req.body;
  if (!email || !password || !full_name) return res.status(400).json({ error: "Missing fields" });
  if (db.get2("SELECT id FROM users WHERE email = ?", [email]))
    return res.status(400).json({ error: "Email already exists" });
  const id = uuidv4(); const now = new Date().toISOString();
  db.run2("INSERT INTO users (id,email,password_hash,full_name,phone,role,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
    [id, email, bcrypt.hashSync(password, 10), full_name, phone || null, role || "telecaller", now, now]);
  res.json({ id });
});

app.put("/api/users/:id", auth, (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== "admin")
    return res.status(403).json({ error: "Forbidden" });
  const { full_name, phone, address, email, is_active } = req.body;
  const now = new Date().toISOString();
  const user = db.get2("SELECT * FROM users WHERE id=?", [req.params.id]);
  if (!user) return res.status(404).json({ error: "Not found" });
  db.run2("UPDATE users SET full_name=?,phone=?,address=?,email=?,is_active=?,updated_at=? WHERE id=?",
    [full_name ?? user.full_name, phone ?? user.phone, address ?? user.address, email ?? user.email,
     is_active !== undefined ? (is_active ? 1 : 0) : user.is_active, now, req.params.id]);
  res.json({ success: true });
});

// ── Social Links ──────────────────────────────────────────────────────────────
app.get("/api/social-links", (req, res) => {
  res.json(db.all2("SELECT * FROM social_media_links ORDER BY display_order").map(r => ({ ...r, is_active: !!r.is_active })));
});

app.post("/api/social-links", auth, requireRole("admin"), (req, res) => {
  const { platform, url, icon_name, display_order } = req.body;
  const id = uuidv4(); const now = new Date().toISOString();
  db.run2("INSERT INTO social_media_links (id,platform,url,icon_name,display_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
    [id, platform, url, icon_name || "", display_order || 0, now, now]);
  res.json({ id });
});

app.put("/api/social-links/:id", auth, requireRole("admin"), (req, res) => {
  const { is_active, url, platform } = req.body;
  const now = new Date().toISOString();
  const link = db.get2("SELECT * FROM social_media_links WHERE id = ?", [req.params.id]);
  if (!link) return res.status(404).json({ error: "Not found" });
  db.run2("UPDATE social_media_links SET is_active=?,url=?,platform=?,updated_at=? WHERE id=?",
    [is_active !== undefined ? (is_active ? 1 : 0) : link.is_active, url ?? link.url, platform ?? link.platform, now, req.params.id]);
  res.json({ success: true });
});

app.delete("/api/social-links/:id", auth, requireRole("admin"), (req, res) => {
  db.run2("DELETE FROM social_media_links WHERE id = ?", [req.params.id]);
  res.json({ success: true });
});

// ── Settings ──────────────────────────────────────────────────────────────────
// Public endpoint for frontend to fetch store info
app.get("/api/settings/public", (req, res) => {
  const publicKeys = ["store_info", "seo_config", "hero_config", "announcement_config"];
  const settings = db.all2("SELECT * FROM settings WHERE key IN (?,?,?,?)", publicKeys)
    .map(r => ({ ...r, value: JSON.parse(r.value) }));
  res.json(settings);
});

app.get("/api/settings", auth, requireRole("admin"), (req, res) => {
  res.json(db.all2("SELECT * FROM settings").map(r => ({ ...r, value: JSON.parse(r.value) })));
});

app.put("/api/settings/:key", auth, requireRole("admin"), (req, res) => {
  const { value } = req.body;
  const now = new Date().toISOString();
  if (db.get2("SELECT id FROM settings WHERE key = ?", [req.params.key])) {
    db.run2("UPDATE settings SET value=?,updated_at=? WHERE key=?", [JSON.stringify(value), now, req.params.key]);
  } else {
    db.run2("INSERT INTO settings (id,key,value,updated_at) VALUES (?,?,?,?)", [uuidv4(), req.params.key, JSON.stringify(value), now]);
  }
  res.json({ success: true });
});

// ── Loyalty ───────────────────────────────────────────────────────────────────
app.get("/api/loyalty", auth, (req, res) => {
  const userId = req.query.user_id || req.user.id;
  if (userId !== req.user.id && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  res.json(db.get2("SELECT * FROM loyalty_points WHERE user_id = ?", [userId]) || null);
});

app.get("/api/loyalty/transactions", auth, (req, res) => {
  const userId = req.query.user_id || req.user.id;
  if (userId !== req.user.id && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  res.json(db.all2("SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", [userId]));
});

// ── Customer enquiries ────────────────────────────────────────────────────────
app.get("/api/enquiries", auth, (req, res) => {
  res.json(db.all2("SELECT * FROM leads WHERE customer_user_id = ? ORDER BY created_at DESC", [req.user.id]));
});

// ── Contact Messages ─────────────────────────────────────────────────────────
app.get("/api/contact-messages", auth, requireRole("admin"), (req, res) => {
  res.json(db.all2("SELECT * FROM contact_messages ORDER BY created_at DESC"));
});

app.post("/api/contact-messages", (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !message) return res.status(400).json({ error: "name and message required" });
  const id = uuidv4();
  db.run2("INSERT INTO contact_messages (id,name,email,subject,message,created_at) VALUES (?,?,?,?,?,?)",
    [id, name, email || null, subject || null, message, new Date().toISOString()]);
  res.json({ id });
});

app.put("/api/contact-messages/:id/read", auth, requireRole("admin"), (req, res) => {
  db.run2("UPDATE contact_messages SET is_read=1 WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

app.delete("/api/contact-messages/:id", auth, requireRole("admin"), (req, res) => {
  db.run2("DELETE FROM contact_messages WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

// ── Newsletter ────────────────────────────────────────────────────────────────
app.get("/api/newsletter", auth, requireRole("admin"), (req, res) => {
  res.json(db.all2("SELECT * FROM newsletter_subscribers ORDER BY created_at DESC").map(r => ({ ...r, is_active: !!r.is_active })));
});

app.post("/api/newsletter", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });
  if (db.get2("SELECT id FROM newsletter_subscribers WHERE email=?", [email]))
    return res.json({ message: "Already subscribed" });
  db.run2("INSERT INTO newsletter_subscribers (id,email,created_at) VALUES (?,?,?)",
    [uuidv4(), email, new Date().toISOString()]);
  res.json({ message: "Subscribed" });
});

app.delete("/api/newsletter/:id", auth, requireRole("admin"), (req, res) => {
  db.run2("DELETE FROM newsletter_subscribers WHERE id=?", [req.params.id]);
  res.json({ success: true });
});

// ── Image upload ──────────────────────────────────────────────────────────────
app.post("/api/upload", auth, requireRole("admin"), upload.array("files", 10), (req, res) => {
  const urls = req.files.map(f => `${PUBLIC_URL}/uploads/${f.filename}`);
  res.json({ urls });
});

// ── Start ─────────────────────────────────────────────────────────────────────
initDb().then((database) => {
  db = database;
  console.log(`✅ Database initialized successfully`);
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📊 Database: ${dbType}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
  
  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });
}).catch(err => {
  console.error("❌ Failed to init DB:", err);
  console.error(err.stack);
  process.exit(1);
});
