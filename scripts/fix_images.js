const { connect } = require('../src/config/db');
const { v4: uuidv4 } = require('uuid');

async function fixImages() {
  const pool = await connect();
  const client = await pool.connect();
  try {
    console.log('Connected to DB. Fixing product images...');
    const { rows: products } = await client.query('SELECT id, name, category FROM products');
    
    for (const p of products) {
      let imageName = '';
      const cat = p.category.toLowerCase();
      const name = p.name.toLowerCase();

      if (cat.includes('dell')) imageName = 'dell-laptop.png';
      else if (cat.includes('hp') && cat.includes('laptop')) imageName = 'hp-laptop.png';
      else if (cat.includes('lenovo')) imageName = 'lenovo-laptop.png';
      else if (cat.includes('macbook')) imageName = 'macbook.png';
      else if (cat.includes('cpu') || cat.includes('desktop')) imageName = 'cpu-desktop.png';
      else if (cat.includes('printer')) imageName = 'printer.png';
      else if (cat.includes('accessory') || cat.includes('accessories')) imageName = 'accessories.png';
      
      // Specific overrides
      if (name.includes('inspiron')) imageName = 'dell-laptop.png';
      if (name.includes('pavilion')) imageName = 'hp-laptop.png';
      if (name.includes('air') || name.includes('pro')) imageName = 'macbook.png';
      
      if (imageName) {
        const publicUrl = process.env.PUBLIC_URL || 'https://saddlebrown-lapwing-971744.hostingersite.com';
        const url = `${publicUrl}/uploads/${imageName}`;
        await client.query('UPDATE products SET images = $1 WHERE id = $2', [JSON.stringify([url]), p.id]);
        console.log(`Updated ${p.name} with ${imageName}`);
      }
    }
    
    // Also fix banners
    console.log('Fixing banners...');
    const { rows: banners } = await client.query('SELECT id, title FROM banners');
    for (const b of banners) {
      if (!b.image_url || b.image_url === '') {
        const publicUrl = process.env.PUBLIC_URL || 'https://saddlebrown-lapwing-971744.hostingersite.com';
        const url = `${publicUrl}/uploads/banner-hero-1.jpg`;
        await client.query('UPDATE banners SET image_url = $1 WHERE id = $2', [url, b.id]);
        console.log(`Updated banner ${b.title}`);
      }
    }

    console.log('✅ Done!');
  } catch (err) {
    console.error('Error fixing images:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

fixImages();
