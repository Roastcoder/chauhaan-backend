const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

function parseBanner(row) { 
  if (!row) return null;
  return { ...row, is_active: !!row.is_active }; 
}

exports.getBanners = async (req, res) => {
  try {
    const { page, type } = req.query;
    let q = "SELECT * FROM banners WHERE is_active = true"; 
    const params = [];
    if (page) { q += " AND page = ?"; params.push(page); }
    if (type) { q += " AND banner_type = ?"; params.push(type); }
    q += " ORDER BY position ASC";
    res.json((await db.all(q, params)).map(parseBanner));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllBanners = async (req, res) => {
  try {
    res.json((await db.all("SELECT * FROM banners ORDER BY page, position")).map(parseBanner));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const { title, subtitle, image_url, cta_text, cta_link, page, position, is_active, banner_type } = req.body;
    if (!image_url) return res.status(400).json({ error: "image_url required" });
    const id = uuidv4();
    await db.run("INSERT INTO banners (id,title,subtitle,image_url,cta_text,cta_link,page,position,is_active,banner_type) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [id, title || "", subtitle || "", image_url, cta_text || "", cta_link || "/", page || "home", position || 0, is_active !== false, banner_type || "hero"]);
    res.json(parseBanner(await db.get("SELECT * FROM banners WHERE id = ?", [id])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { title, subtitle, image_url, cta_text, cta_link, page, position, is_active, banner_type } = req.body;
    const b = await db.get("SELECT * FROM banners WHERE id = ?", [req.params.id]);
    if (!b) return res.status(404).json({ error: "Not found" });
    await db.run("UPDATE banners SET title=?,subtitle=?,image_url=?,cta_text=?,cta_link=?,page=?,position=?,is_active=?,banner_type=? WHERE id=?",
      [title ?? b.title, subtitle ?? b.subtitle, image_url ?? b.image_url, cta_text ?? b.cta_text, cta_link ?? b.cta_link, page ?? b.page, position ?? b.position, is_active !== undefined ? (is_active) : b.is_active, banner_type ?? b.banner_type, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    await db.run("DELETE FROM banners WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
