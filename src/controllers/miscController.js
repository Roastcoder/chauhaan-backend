const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// ── Calls ─────────────────────────────────────────────────────────────────────
exports.getCalls = async (req, res) => {
  try {
    const { lead_id } = req.query;
    if (lead_id) {
      res.json(await db.all("SELECT * FROM call_history WHERE lead_id = ? ORDER BY created_at DESC", [lead_id]));
    } else if (req.user.role === "telecaller") {
      res.json(await db.all("SELECT ch.*, l.name as lead_name, l.phone as lead_phone FROM call_history ch LEFT JOIN leads l ON ch.lead_id = l.id WHERE ch.telecaller_id = ? ORDER BY ch.created_at DESC", [req.user.id]));
    } else {
      res.json(await db.all("SELECT * FROM call_history ORDER BY created_at DESC"));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createCall = async (req, res) => {
  try {
    const { lead_id, outcome, remarks, follow_up_at } = req.body;
    if (!lead_id || !outcome) return res.status(400).json({ error: "lead_id and outcome required" });
    const id = uuidv4();
    await db.run("INSERT INTO call_history (id,lead_id,telecaller_id,outcome,remarks,follow_up_at) VALUES (?,?,?,?,?,?)",
      [id, lead_id, req.user.id, outcome, remarks || null, follow_up_at || null]);
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── Remarks ───────────────────────────────────────────────────────────────────
exports.getRemarks = async (req, res) => {
  try {
    const { lead_id } = req.query;
    if (!lead_id) return res.status(400).json({ error: "lead_id required" });
    res.json(await db.all("SELECT * FROM lead_remarks WHERE lead_id = ? ORDER BY created_at DESC", [lead_id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createRemark = async (req, res) => {
  try {
    const { lead_id, remark, remark_type } = req.body;
    if (!lead_id || !remark) return res.status(400).json({ error: "lead_id and remark required" });
    const id = uuidv4();
    await db.run("INSERT INTO lead_remarks (id,lead_id,user_id,remark,remark_type) VALUES (?,?,?,?,?)",
      [id, lead_id, req.user.id, remark, remark_type || "note"]);
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── Social Links ──────────────────────────────────────────────────────────────
exports.getSocialLinks = async (req, res) => {
  try {
    res.json((await db.all("SELECT * FROM social_media_links ORDER BY display_order")).map(r => ({ ...r, is_active: !!r.is_active })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createSocialLink = async (req, res) => {
  try {
    const { platform, url, icon_name, display_order } = req.body;
    const id = uuidv4();
    await db.run("INSERT INTO social_media_links (id,platform,url,icon_name,display_order) VALUES (?,?,?,?,?)",
      [id, platform, url, icon_name || "", display_order || 0]);
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateSocialLink = async (req, res) => {
  try {
    const { is_active, url, platform } = req.body;
    const link = await db.get("SELECT * FROM social_media_links WHERE id = ?", [req.params.id]);
    if (!link) return res.status(404).json({ error: "Not found" });
    await db.run("UPDATE social_media_links SET is_active=?,url=?,platform=? WHERE id=?",
      [is_active !== undefined ? (is_active) : link.is_active, url ?? link.url, platform ?? link.platform, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteSocialLink = async (req, res) => {
  try {
    await db.run("DELETE FROM social_media_links WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── Loyalty ───────────────────────────────────────────────────────────────────
exports.getLoyalty = async (req, res) => {
  try {
    const userId = req.query.user_id || req.user.id;
    if (userId !== req.user.id && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    res.json(await db.get("SELECT * FROM loyalty_points WHERE user_id = ?", [userId]) || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getLoyaltyTransactions = async (req, res) => {
  try {
    const userId = req.query.user_id || req.user.id;
    if (userId !== req.user.id && req.user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
    res.json(await db.all("SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20", [userId]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── Enquiries ─────────────────────────────────────────────────────────────────
exports.getEnquiries = async (req, res) => {
  try {
    res.json(await db.all("SELECT * FROM leads WHERE customer_user_id = ? ORDER BY created_at DESC", [req.user.id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── Contact Messages ─────────────────────────────────────────────────────────
exports.getContactMessages = async (req, res) => {
  try {
    res.json(await db.all("SELECT * FROM contact_messages ORDER BY created_at DESC"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createContactMessage = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !message) return res.status(400).json({ error: "name and message required" });
    const id = uuidv4();
    await db.run("INSERT INTO contact_messages (id,name,email,subject,message) VALUES (?,?,?,?,?)",
      [id, name, email || null, subject || null, message]);
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.markContactMessageRead = async (req, res) => {
  try {
    await db.run("UPDATE contact_messages SET is_read=true WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteContactMessage = async (req, res) => {
  try {
    await db.run("DELETE FROM contact_messages WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── Newsletter ────────────────────────────────────────────────────────────────
exports.getNewsletterSubscribers = async (req, res) => {
  try {
    const subs = await db.all("SELECT * FROM newsletter_subscribers ORDER BY created_at DESC");
    res.json(subs.map(r => ({ ...r, is_active: !!r.is_active })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });
    if (await db.get("SELECT id FROM newsletter_subscribers WHERE email=?", [email]))
      return res.json({ message: "Already subscribed" });
    await db.run("INSERT INTO newsletter_subscribers (id,email) VALUES (?,?)", [uuidv4(), email]);
    res.json({ message: "Subscribed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteNewsletterSubscriber = async (req, res) => {
  try {
    await db.run("DELETE FROM newsletter_subscribers WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

// ── Upload ───────────────────────────────────────────────────────────────────
exports.uploadFiles = (req, res) => {
  const PUBLIC_URL = process.env.PUBLIC_URL || 'https://backend.chauhancomputers.co.in';
  const urls = req.files.map(f => `${PUBLIC_URL}/uploads/${f.filename}`);
  res.json({ urls });
};
