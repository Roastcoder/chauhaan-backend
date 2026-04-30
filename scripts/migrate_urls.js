const { connect } = require('../src/config/db');

async function migrateUrls() {
  const pool = await connect();
  const client = await pool.connect();
  try {
    const targetUrl = 'https://chauhancomputers.co.in';
    const oldUrls = ['http://localhost:3000', 'https://saddlebrown-lapwing-971744.hostingersite.com'];

    console.log(`Migrating URLs to ${targetUrl}...`);

    const replaceUrl = (str) => {
      let result = str;
      oldUrls.forEach(old => {
        result = result.replace(new RegExp(old, 'g'), targetUrl);
      });
      return result;
    };

    // Fix products
    const { rows: products } = await client.query('SELECT id, images FROM products');
    for (const p of products) {
      if (p.images) {
        let images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        if (Array.isArray(images)) {
          let updated = false;
          const newImages = images.map(img => {
            const newImg = replaceUrl(img);
            if (newImg !== img) updated = true;
            return newImg;
          });
          if (updated) {
            await client.query('UPDATE products SET images = $1 WHERE id = $2', [JSON.stringify(newImages), p.id]);
            console.log(`Fixed product ${p.id}`);
          }
        }
      }
    }

    // Fix banners
    const { rows: banners } = await client.query('SELECT id, image_url FROM banners');
    for (const b of banners) {
      if (b.image_url) {
        const newUrl = replaceUrl(b.image_url);
        if (newUrl !== b.image_url) {
          await client.query('UPDATE banners SET image_url = $1 WHERE id = $2', [newUrl, b.id]);
          console.log(`Fixed banner ${b.id}`);
        }
      }
    }

    // Fix settings
    const { rows: settings } = await client.query('SELECT key, value FROM settings');
    for (const s of settings) {
      if (s.value) {
        let valStr = JSON.stringify(s.value);
        const newValStr = replaceUrl(valStr);
        if (newValStr !== valStr) {
          await client.query('UPDATE settings SET value = $1 WHERE key = $2', [newValStr, s.key]);
          console.log(`Fixed setting ${s.key}`);
        }
      }
    }

    console.log('✅ URL Migration Complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrateUrls();
