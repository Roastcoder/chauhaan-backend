const { db } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

exports.getBlogs = async (req, res) => {
  try {
    const blogs = await db.all("SELECT * FROM blogs WHERE is_published = true ORDER BY published_at DESC");
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await db.get("SELECT * FROM blogs WHERE slug = ?", [req.params.slug]);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await db.all("SELECT * FROM blogs ORDER BY created_at DESC");
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, excerpt, content, image_url, category, author, is_published } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and content required" });
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const id = uuidv4();
    
    await db.run(
      "INSERT INTO blogs (id, title, slug, excerpt, content, image_url, category, author, is_published) VALUES (?,?,?,?,?,?,?,?,?)",
      [id, title, slug, excerpt || "", content, image_url || "", category || "tech", author || "Admin", is_published !== false]
    );
    
    const blog = await db.get("SELECT * FROM blogs WHERE id = ?", [id]);
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const { title, excerpt, content, image_url, category, author, is_published } = req.body;
    const blog = await db.get("SELECT * FROM blogs WHERE id = ?", [req.params.id]);
    if (!blog) return res.status(404).json({ error: "Blog not found" });
    
    const slug = title ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : blog.slug;
    
    await db.run(
      "UPDATE blogs SET title=?, slug=?, excerpt=?, content=?, image_url=?, category=?, author=?, is_published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [title || blog.title, slug, excerpt ?? blog.excerpt, content || blog.content, image_url ?? blog.image_url, category || blog.category, author || blog.author, is_published !== undefined ? is_published : blog.is_published, req.params.id]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    await db.run("DELETE FROM blogs WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
