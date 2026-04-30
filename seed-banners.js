require('dotenv').config();
const { Pool } = require('pg');

const config = {
  connectionString: process.env.DATABASE_URL || 'postgres://chauhan:chauhan%40computer@187.77.187.120:5411/chauhan',
  ssl: false
};

const pool = new Pool(config);

const seedBanners = async () => {
  try {
    console.log('Connecting to database...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL DEFAULT '',
        subtitle TEXT,
        image_url TEXT NOT NULL DEFAULT '',
        cta_text VARCHAR(100),
        cta_link VARCHAR(255),
        page VARCHAR(50) NOT NULL DEFAULT 'home',
        position INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        banner_type VARCHAR(50) NOT NULL DEFAULT 'hero',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    console.log('Inserting banners...');
    
    // Using PostgreSQL's INSERT ... ON CONFLICT DO NOTHING just in case
    await pool.query(`
      INSERT INTO banners (id, title, subtitle, image_url, cta_text, cta_link, page, position, is_active, banner_type, created_at, updated_at) VALUES
      ('93c800bd-8a59-4dd7-af52-c800c7cc41b8', 'Expert Repair & IT Services', 'Certified technicians for all brands', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80', 'Learn More', '/services', 'home', 2, true, 'promo', '2026-04-20 06:52:31', '2026-04-20 06:52:31'),
      ('98c5a86e-385e-4719-ad8d-2f9c803db30c', '30 Days Hardware Warranty', 'On all products — terms apply', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=1200&q=80', 'Contact Us', '/contact', 'home', 3, true, 'promo', '2026-04-20 06:52:31', '2026-04-20 06:52:31'),
      ('a8ee4be8-7614-4032-90f8-011fbac509c2', 'Premium Laptops & Desktops', 'Official Dell, HP, Lenovo & Apple Partner', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&q=80', 'Shop Now', '/category/dell-laptop', 'home', 1, true, 'hero', '2026-04-20 06:52:31', '2026-04-20 06:52:31'),
      ('c4f7c9b8-ee20-4d8f-a06e-8d3bdf8b28c6', 'MacBook Air M2 — Now Available', 'Supercharged by M2 chip', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80', 'View MacBooks', '/category/macbook', 'home', 4, true, 'hero', '2026-04-20 06:52:31', '2026-04-20 06:52:31')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log('✅ Banners seeded.');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await pool.end();
  }
};

seedBanners();
