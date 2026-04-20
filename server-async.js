require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// Use MySQL database
const { initDb } = require('./db-mysql');

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
app.get("/", (req, res) => res.json({ status: "ok", message: "Chauhaan Computers API is running 🚀", database: "MySQL" }));

// ── Auth ─────────────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.get2("SELECT * FROM users WHERE email = ?", [email]);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    const { password_hash, ...profile } = user;
    res.json({ token, user: { ...profile, is_active: !!profile.is_active } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) return res.status(400).json({ error: "Missing fields" });
    if (await db.get2("SELECT id FROM users WHERE email = ?", [email]))
      return res.status(400).json({ error: "Email already registered" });
    const id = uuidv4();
    await db.run2("INSERT INTO users (id,email,password_hash,full_name,role) VALUES (?,?,?,?,?)",
      [id, email, bcrypt.hashSync(password, 10), full_name, "customer"]);
    await db.run2("INSERT INTO loyalty_points (id,user_id) VALUES (?,?)", [uuidv4(), id]);
    res.json({ message: "Account created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", auth, async (req, res) => {
  try {
    const user = await db.get2("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: "Not found" });
    const { password_hash, ...profile } = user;
    res.json({ ...profile, is_active: !!profile.is_active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Products ─────────────────────────────────────────────────────────────────
function parseProduct(row) {
  return { 
    ...row, 
    specs: typeof row.specs === 'string' ? JSON.parse(row.specs) : row.specs, 
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images, 
    is_active: !!row.is_active 
  };
}

app.get("/api/products", async (req, res) => {
  try {
    const products = await db.all2("SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC");
    res.json(products.map(parseProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/products/all", auth, requireRole("admin"), async (req, res) => {
  try {
    const products = await db.all2("SELECT * FROM products ORDER BY created_at DESC");
    res.json(products.map(parseProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/products", auth, requireRole("admin"), async (req, res) => {
  try {
    const { name, category, brand, price, description, stock_quantity, specs, images } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const id = uuidv4();
    await db.run2("INSERT INTO products (id,name,category,brand,price,description,images,specs,stock_quantity) VALUES (?,?,?,?,?,?,?,?,?)",
      [id, name, category || "other", brand || "", price || 0, description || "", JSON.stringify(images || []), JSON.stringify(specs || {}), stock_quantity || 0]);
    const product = await db.get2("SELECT * FROM products WHERE id = ?", [id]);
    res.json(parseProduct(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/products/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const { name, category, brand, price, description, stock_quantity, specs, images, is_active } = req.body;
    await db.run2("UPDATE products SET name=?,category=?,brand=?,price=?,description=?,images=?,specs=?,stock_quantity=?,is_active=? WHERE id=?",
      [name, category, brand, price, description, JSON.stringify(images || []), JSON.stringify(specs || {}), stock_quantity, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/products/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    await db.run2("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Settings ──────────────────────────────────────────────────────────────────
app.get("/api/settings/public", async (req, res) => {
  try {
    const publicKeys = ["store_info", "seo_config", "hero_config", "announcement_config", "careers_config", "testimonials", "services_config"];
    const settings = await db.all2("SELECT * FROM settings WHERE `key` IN (?,?,?,?,?,?,?)", publicKeys);
    res.json(settings.map(r => ({ 
      ...r, 
      value: typeof r.value === 'string' ? JSON.parse(r.value) : r.value 
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/settings", auth, requireRole("admin"), async (req, res) => {
  try {
    const settings = await db.all2("SELECT * FROM settings");
    res.json(settings.map(r => ({ 
      ...r, 
      value: typeof r.value === 'string' ? JSON.parse(r.value) : r.value 
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/settings/:key", auth, requireRole("admin"), async (req, res) => {
  try {
    const { value } = req.body;
    if (await db.get2("SELECT id FROM settings WHERE `key` = ?", [req.params.key])) {
      await db.run2("UPDATE settings SET value=? WHERE `key`=?", [JSON.stringify(value), req.params.key]);
    } else {
      await db.run2("INSERT INTO settings (id,`key`,value) VALUES (?,?,?)", [uuidv4(), req.params.key, JSON.stringify(value)]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Users ─────────────────────────────────────────────────────────────────────
app.get("/api/users", auth, requireRole("admin"), async (req, res) => {
  try {
    const { role } = req.query;
    const rows = role
      ? await db.all2("SELECT id,email,full_name,phone,address,is_active,role,created_at FROM users WHERE role = ?", [role])
      : await db.all2("SELECT id,email,full_name,phone,address,is_active,role,created_at FROM users");
    res.json(rows.map(r => ({ ...r, is_active: !!r.is_active })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/users", auth, requireRole("admin"), async (req, res) => {
  try {
    const { email, password, full_name, phone, role } = req.body;
    if (!email || !password || !full_name) return res.status(400).json({ error: "Missing fields" });
    if (await db.get2("SELECT id FROM users WHERE email = ?", [email]))
      return res.status(400).json({ error: "Email already exists" });
    const id = uuidv4();
    await db.run2("INSERT INTO users (id,email,password_hash,full_name,phone,role) VALUES (?,?,?,?,?,?)",
      [id, email, bcrypt.hashSync(password, 10), full_name, phone || null, role || "telecaller"]);
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/users/:id", auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin")
      return res.status(403).json({ error: "Forbidden" });
    const { full_name, phone, address, email, is_active, role } = req.body;
    const user = await db.get2("SELECT * FROM users WHERE id=?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "Not found" });
    
    // Only admin can change roles
    if (role && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can change roles" });
    }
    
    await db.run2("UPDATE users SET full_name=?,phone=?,address=?,email=?,is_active=?,role=? WHERE id=?",
      [full_name ?? user.full_name, phone ?? user.phone, address ?? user.address, email ?? user.email,
       is_active !== undefined ? (is_active ? 1 : 0) : user.is_active, role ?? user.role, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Banners ───────────────────────────────────────────────────────────────────
function parseBanner(row) { return { ...row, is_active: !!row.is_active }; }

app.get("/api/banners", async (req, res) => {
  try {
    const { page, type } = req.query;
    let q = "SELECT * FROM banners WHERE is_active = 1"; const params = [];
    if (page) { q += " AND page = ?"; params.push(page); }
    if (type) { q += " AND banner_type = ?"; params.push(type); }
    q += " ORDER BY position ASC";
    res.json((await db.all2(q, params)).map(parseBanner));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/banners/all", auth, requireRole("admin"), async (req, res) => {
  try {
    res.json((await db.all2("SELECT * FROM banners ORDER BY page, position")).map(parseBanner));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/banners", auth, requireRole("admin"), async (req, res) => {
  try {
    const { title, subtitle, image_url, cta_text, cta_link, page, position, is_active, banner_type } = req.body;
    if (!image_url) return res.status(400).json({ error: "image_url required" });
    const id = uuidv4();
    await db.run2("INSERT INTO banners (id,title,subtitle,image_url,cta_text,cta_link,page,position,is_active,banner_type) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [id, title || "", subtitle || "", image_url, cta_text || "", cta_link || "/", page || "home", position || 0, is_active !== false ? 1 : 0, banner_type || "hero"]);
    res.json(parseBanner(await db.get2("SELECT * FROM banners WHERE id = ?", [id])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/banners/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const { title, subtitle, image_url, cta_text, cta_link, page, position, is_active, banner_type } = req.body;
    const b = await db.get2("SELECT * FROM banners WHERE id = ?", [req.params.id]);
    if (!b) return res.status(404).json({ error: "Not found" });
    await db.run2("UPDATE banners SET title=?,subtitle=?,image_url=?,cta_text=?,cta_link=?,page=?,position=?,is_active=?,banner_type=? WHERE id=?",
      [title ?? b.title, subtitle ?? b.subtitle, image_url ?? b.image_url, cta_text ?? b.cta_text, cta_link ?? b.cta_link, page ?? b.page, position ?? b.position, is_active !== undefined ? (is_active ? 1 : 0) : b.is_active, banner_type ?? b.banner_type, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/banners/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    await db.run2("DELETE FROM banners WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Leads ─────────────────────────────────────────────────────────────────────
app.get("/api/leads", auth, requireRole("admin", "telecaller"), async (req, res) => {
  try {
    if (req.user.role === "telecaller") {
      res.json(await db.all2("SELECT * FROM leads WHERE assigned_to = ? ORDER BY created_at DESC", [req.user.id]));
    } else {
      res.json(await db.all2("SELECT * FROM leads ORDER BY created_at DESC"));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/leads", auth, async (req, res) => {
  try {
    const { name, phone, email, source, product_interest, notes, customer_user_id } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "name and phone required" });
    const id = uuidv4();
    await db.run2("INSERT INTO leads (id,name,phone,email,source,product_interest,notes,customer_user_id) VALUES (?,?,?,?,?,?,?,?)",
      [id, name, phone, email || null, source || "manual", product_interest || null, notes || null, customer_user_id || null]);
    res.json(await db.get2("SELECT * FROM leads WHERE id = ?", [id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/leads/:id", auth, requireRole("admin", "telecaller"), async (req, res) => {
  try {
    const { status, assigned_to, follow_up_at, notes } = req.body;
    const lead = await db.get2("SELECT * FROM leads WHERE id = ?", [req.params.id]);
    if (!lead) return res.status(404).json({ error: "Not found" });
    await db.run2("UPDATE leads SET status=?,assigned_to=?,follow_up_at=?,notes=? WHERE id=?",
      [status ?? lead.status, assigned_to !== undefined ? assigned_to : lead.assigned_to, follow_up_at !== undefined ? follow_up_at : lead.follow_up_at, notes ?? lead.notes, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/leads/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    await db.run2("DELETE FROM leads WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Calls ─────────────────────────────────────────────────────────────────────
app.get("/api/calls", auth, requireRole("admin", "telecaller"), async (req, res) => {
  try {
    const { lead_id } = req.query;
    if (lead_id) {
      res.json(await db.all2("SELECT * FROM call_history WHERE lead_id = ? ORDER BY created_at DESC", [lead_id]));
    } else if (req.user.role === "telecaller") {
      res.json(await db.all2("SELECT ch.*, l.name as lead_name, l.phone as lead_phone FROM call_history ch LEFT JOIN leads l ON ch.lead_id = l.id WHERE ch.telecaller_id = ? ORDER BY ch.created_at DESC", [req.user.id]));
    } else {
      res.json(await db.all2("SELECT * FROM call_history ORDER BY created_at DESC"));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/calls", auth, requireRole("telecaller", "admin"), async (req, res) => {
  try {
    const { lead_id, outcome, remarks, follow_up_at } = req.body;
    if (!lead_id || !outcome) return res.status(400).json({ error: "lead_id and outcome required" });
    const id = uuidv4();
    await db.run2("INSERT INTO call_history (id,lead_id,telecaller_id,outcome,remarks,follow_up_at) VALUES (?,?,?,?,?,?)",
      [id, lead_id, req.user.id, outcome, remarks || null, follow_up_at || null]);
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Remarks ───────────────────────────────────────────────────────────────────
app.get("/api/remarks", auth, async (req, res) => {
  try {
    const { lead_id } = req.query;
    if (!lead_id) return res.status(400).json({ error: "lead_id required" });
    res.json(await db.all2("SELECT * FROM lead_remarks WHERE lead_id = ? ORDER BY created_at DESC", [lead_id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/remarks", auth, async (req, res) => {
  try {
    const { lead_id, remark, remark_type } = req.body;
    if (!lead_id || !remark) return res.status(400).json({ error: "lead_id and remark required" });
    const id = uuidv4();
    await db.run2("INSERT INTO lead_remarks (id,lead_id,user_id,remark,remark_type) VALUES (?,?,?,?,?)",
      [id, lead_id, req.user.id, remark, remark_type || "note"]);
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Social Links ──────────────────────────────────────────────────────────────
app.get("/api/social-links", async (req, res) => {
  try {
    res.json((await db.all2("SELECT * FROM social_media_links ORDER BY display_order")).map(r => ({ ...r, is_active: !!r.is_active })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/social-links", auth, requireRole("admin"), async (req, res) => {
  try {
    const { platform, url, icon_name, display_order } = req.body;
    const id = uuidv4();
    await db.run2("INSERT INTO social_media_links (id,platform,url,icon_name,display_order) VALUES (?,?,?,?,?)",
      [id, platform, url, icon_name || "", display_order || 0]);
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/social-links/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const { is_active, url, platform } = req.body;
    const link = await db.get2("SELECT * FROM social_media_links WHERE id = ?", [req.params.id]);
    if (!link) return res.status(404).json({ error: "Not found" });
    await db.run2("UPDATE social_media_links SET is_active=?,url=?,platform=? WHERE id=?",
      [is_active !== undefined ? (is_active ? 1 : 0) : link.is_active, url ?? link.url, platform ?? link.platform, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/social-links/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    await db.run2("DELETE FROM social_media_links WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Loyalty ───────────────────────────────────────────────────────────────────
app.get("/api/loyalty", auth, async (req, res) => {
  try {
    const userId = req.query.user_id || req.user.id;
    if (userId !== req.user.id && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    res.json(await db.get2("SELECT * FROM loyalty_points WHERE user_id = ?", [userId]) || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/loyalty/transactions", auth, async (req, res) => {
  try {
    const userId = req.query.user_id || req.user.id;
    if (userId !== req.user.id && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    res.json(await db.all2("SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", [userId]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Customer enquiries ────────────────────────────────────────────────────────
app.get("/api/enquiries", auth, async (req, res) => {
  try {
    res.json(await db.all2("SELECT * FROM leads WHERE customer_user_id = ? ORDER BY created_at DESC", [req.user.id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Contact Messages ─────────────────────────────────────────────────────────
app.get("/api/contact-messages", auth, requireRole("admin"), async (req, res) => {
  try {
    res.json(await db.all2("SELECT * FROM contact_messages ORDER BY created_at DESC"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/contact-messages", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !message) return res.status(400).json({ error: "name and message required" });
    const id = uuidv4();
    await db.run2("INSERT INTO contact_messages (id,name,email,subject,message) VALUES (?,?,?,?,?)",
      [id, name, email || null, subject || null, message]);
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/contact-messages/:id/read", auth, requireRole("admin"), async (req, res) => {
  try {
    await db.run2("UPDATE contact_messages SET is_read=1 WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/contact-messages/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    await db.run2("DELETE FROM contact_messages WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Newsletter ────────────────────────────────────────────────────────────────
app.get("/api/newsletter", auth, requireRole("admin"), async (req, res) => {
  try {
    const subs = await db.all2("SELECT * FROM newsletter_subscribers ORDER BY created_at DESC");
    res.json(subs.map(r => ({ ...r, is_active: !!r.is_active })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/newsletter", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });
    if (await db.get2("SELECT id FROM newsletter_subscribers WHERE email=?", [email]))
      return res.json({ message: "Already subscribed" });
    await db.run2("INSERT INTO newsletter_subscribers (id,email) VALUES (?,?)", [uuidv4(), email]);
    res.json({ message: "Subscribed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/newsletter/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    await db.run2("DELETE FROM newsletter_subscribers WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Image upload ──────────────────────────────────────────────────────────────
app.post("/api/upload", auth, requireRole("admin"), upload.array("files", 10), (req, res) => {
  const urls = req.files.map(f => `${PUBLIC_URL}/uploads/${f.filename}`);
  res.json({ urls });
});

// ── Start ─────────────────────────────────────────────────────────────────────
initDb().then((database) => {
  db = database;
  console.log(`✅ MySQL database initialized successfully`);
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📊 Database: MySQL`);
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
