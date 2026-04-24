const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

exports.getPublicSettings = async (req, res) => {
  try {
    const publicKeys = ["store_info", "seo_config", "hero_config", "announcement_config", "careers_config", "testimonials", "services_config"];
    const settings = await db.all("SELECT * FROM settings WHERE `key` IN (?,?,?,?,?,?,?)", publicKeys);
    res.json(settings.map(r => ({ 
      ...r, 
      value: typeof r.value === 'string' ? JSON.parse(r.value) : r.value 
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllSettings = async (req, res) => {
  try {
    const settings = await db.all("SELECT * FROM settings");
    res.json(settings.map(r => ({ 
      ...r, 
      value: typeof r.value === 'string' ? JSON.parse(r.value) : r.value 
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateSetting = async (req, res) => {
  try {
    const { value } = req.body;
    if (await db.get("SELECT id FROM settings WHERE `key` = ?", [req.params.key])) {
      await db.run("UPDATE settings SET value=? WHERE `key`=?", [JSON.stringify(value), req.params.key]);
    } else {
      await db.run("INSERT INTO settings (id,`key`,value) VALUES (?,?,?)", [uuidv4(), req.params.key, JSON.stringify(value)]);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
