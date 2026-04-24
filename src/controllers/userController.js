const { db } = require('../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const rows = role
      ? await db.all("SELECT id,email,full_name,phone,address,is_active,role,created_at FROM users WHERE role = ?", [role])
      : await db.all("SELECT id,email,full_name,phone,address,is_active,role,created_at FROM users");
    res.json(rows.map(r => ({ ...r, is_active: !!r.is_active })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, full_name, phone, role } = req.body;
    if (!email || !password || !full_name) return res.status(400).json({ error: "Missing fields" });
    if (await db.get("SELECT id FROM users WHERE email = ?", [email]))
      return res.status(400).json({ error: "Email already exists" });
    const id = uuidv4();
    await db.run("INSERT INTO users (id,email,password_hash,full_name,phone,role) VALUES (?,?,?,?,?,?)",
      [id, email, bcrypt.hashSync(password, 10), full_name, phone || null, role || "telecaller"]);
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin")
      return res.status(403).json({ error: "Forbidden" });
    const { full_name, phone, address, email, is_active, role } = req.body;
    const user = await db.get("SELECT * FROM users WHERE id=?", [req.params.id]);
    if (!user) return res.status(404).json({ error: "Not found" });
    
    // Only admin can change roles
    if (role && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only admins can change roles" });
    }
    
    await db.run("UPDATE users SET full_name=?,phone=?,address=?,email=?,is_active=?,role=? WHERE id=?",
      [full_name ?? user.full_name, phone ?? user.phone, address ?? user.address, email ?? user.email,
       is_active !== undefined ? (is_active ? 1 : 0) : user.is_active, role ?? user.role, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
