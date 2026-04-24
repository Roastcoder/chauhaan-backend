const { db } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || "chauhaan-computers-secret-2024";

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    const { password_hash, ...profile } = user;
    res.json({ token, user: { ...profile, is_active: !!profile.is_active } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.signup = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;
    if (!email || !password || !full_name) return res.status(400).json({ error: "Missing fields" });
    if (await db.get("SELECT id FROM users WHERE email = ?", [email]))
      return res.status(400).json({ error: "Email already registered" });
    const id = uuidv4();
    await db.run("INSERT INTO users (id,email,password_hash,full_name,role) VALUES (?,?,?,?,?)",
      [id, email, bcrypt.hashSync(password, 10), full_name, "customer"]);
    await db.run("INSERT INTO loyalty_points (id,user_id) VALUES (?,?)", [uuidv4(), id]);
    res.json({ message: "Account created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: "Not found" });
    const { password_hash, ...profile } = user;
    res.json({ ...profile, is_active: !!profile.is_active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
