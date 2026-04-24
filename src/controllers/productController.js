const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

function parseProduct(row) {
  if (!row) return null;
  return { 
    ...row, 
    specs: typeof row.specs === 'string' ? JSON.parse(row.specs) : row.specs, 
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images, 
    is_active: !!row.is_active 
  };
}

exports.getProducts = async (req, res) => {
  try {
    const products = await db.all("SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC");
    res.json(products.map(parseProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await db.all("SELECT * FROM products ORDER BY created_at DESC");
    res.json(products.map(parseProduct));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, category, brand, price, description, stock_quantity, specs, images } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const id = uuidv4();
    await db.run("INSERT INTO products (id,name,category,brand,price,description,images,specs,stock_quantity) VALUES (?,?,?,?,?,?,?,?,?)",
      [id, name, category || "other", brand || "", price || 0, description || "", JSON.stringify(images || []), JSON.stringify(specs || {}), stock_quantity || 0]);
    const product = await db.get("SELECT * FROM products WHERE id = ?", [id]);
    res.json(parseProduct(product));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, category, brand, price, description, stock_quantity, specs, images, is_active } = req.body;
    await db.run("UPDATE products SET name=?,category=?,brand=?,price=?,description=?,images=?,specs=?,stock_quantity=?,is_active=? WHERE id=?",
      [name, category, brand, price, description, JSON.stringify(images || []), JSON.stringify(specs || {}), stock_quantity, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await db.run("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
