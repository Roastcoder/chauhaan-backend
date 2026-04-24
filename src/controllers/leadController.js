const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

exports.getLeads = async (req, res) => {
  try {
    if (req.user.role === "telecaller") {
      res.json(await db.all("SELECT * FROM leads WHERE assigned_to = ? ORDER BY created_at DESC", [req.user.id]));
    } else {
      res.json(await db.all("SELECT * FROM leads ORDER BY created_at DESC"));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createLead = async (req, res) => {
  try {
    const { name, phone, email, source, product_interest, notes, customer_user_id } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "name and phone required" });
    const id = uuidv4();
    await db.run("INSERT INTO leads (id,name,phone,email,source,product_interest,notes,customer_user_id) VALUES (?,?,?,?,?,?,?,?)",
      [id, name, phone, email || null, source || "manual", product_interest || null, notes || null, customer_user_id || null]);
    res.json(await db.get("SELECT * FROM leads WHERE id = ?", [id]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createLeadsBulk = async (req, res) => {
  try {
    const { leads } = req.body;
    if (!Array.isArray(leads)) return res.status(400).json({ error: "leads array required" });
    
    for (const l of leads) {
      if (!l.name || !l.phone) continue;
      const id = uuidv4();
      await db.run("INSERT INTO leads (id,name,phone,email,source,product_interest) VALUES (?,?,?,?,?,?)",
        [id, l.name, l.phone, l.email || null, l.source || "manual", l.product_interest || null]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const { status, assigned_to, follow_up_at, notes } = req.body;
    const lead = await db.get("SELECT * FROM leads WHERE id = ?", [req.params.id]);
    if (!lead) return res.status(404).json({ error: "Not found" });
    await db.run("UPDATE leads SET status=?,assigned_to=?,follow_up_at=?,notes=? WHERE id=?",
      [status ?? lead.status, assigned_to !== undefined ? assigned_to : lead.assigned_to, follow_up_at !== undefined ? follow_up_at : lead.follow_up_at, notes ?? lead.notes, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    await db.run("DELETE FROM leads WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
