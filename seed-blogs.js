require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const config = {
  connectionString: process.env.DATABASE_URL || 'postgres://chauhan:chauhan%40computer@187.77.187.120:5411/chauhan',
  ssl: false
};

const pool = new Pool(config);

const seedBlogs = async () => {
  try {
    console.log('Seeding demo blogs...');

    const blogs = [
      {
        id: uuidv4(),
        title: "Why Choose Refurbished Laptops? The Smart Way to Save",
        slug: "why-choose-refurbished-laptops",
        excerpt: "Discover why refurbished laptops are becoming the go-to choice for students and professionals. Save money without sacrificing performance.",
        content: `
          <div class="space-y-6">
            <p class="text-lg leading-relaxed">In today's fast-paced digital world, having a reliable laptop is no longer a luxury—it's a necessity. However, the high price tags of brand-new premium laptops can be a significant barrier for many. This is where <strong>refurbished laptops</strong> come in as a game-changer.</p>
            
            <h2 class="text-2xl font-bold mt-8 mb-4">What Exactly is a Refurbished Laptop?</h2>
            <p>A refurbished laptop is NOT just a "used" laptop. While used laptops are sold "as-is" by individuals, refurbished laptops undergo a rigorous testing, cleaning, and repair process by professionals. At <strong>Chauhan Computers</strong>, our refurbishment process includes:</p>
            <ul class="list-disc pl-6 space-y-2">
              <li>Full hardware diagnostic tests.</li>
              <li>Keyboard and trackpad responsiveness checks.</li>
              <li>Battery health verification and replacement if necessary.</li>
              <li>Complete internal cleaning (fan, motherboard, ports).</li>
              <li>Fresh OS installation and driver updates.</li>
            </ul>

            <h2 class="text-2xl font-bold mt-8 mb-4">Key Benefits of Buying Refurbished</h2>
            <div class="grid md:grid-cols-2 gap-6 mt-4">
              <div class="bg-muted/50 p-4 rounded-xl border border-border">
                <h3 class="font-bold text-primary mb-2">1. Huge Cost Savings</h3>
                <p class="text-sm text-muted-foreground">You can often get a premium enterprise-grade laptop (like a ThinkPad or Latitude) at 40-60% less than its original retail price.</p>
              </div>
              <div class="bg-muted/50 p-4 rounded-xl border border-border">
                <h3 class="font-bold text-primary mb-2">2. Higher Build Quality</h3>
                <p class="text-sm text-muted-foreground">Most refurbished units are high-end business series laptops, built with durable materials (magnesium alloy, carbon fiber) that outlast consumer-grade plastic laptops.</p>
              </div>
              <div class="bg-muted/50 p-4 rounded-xl border border-border">
                <h3 class="font-bold text-primary mb-2">3. Eco-Friendly Choice</h3>
                <p class="text-sm text-muted-foreground">Buying refurbished reduces e-waste and the demand for new resource-intensive manufacturing, making it a sustainable choice for the planet.</p>
              </div>
              <div class="bg-muted/50 p-4 rounded-xl border border-border">
                <h3 class="font-bold text-primary mb-2">4. Peace of Mind Warranty</h3>
                <p class="text-sm text-muted-foreground">Professional sellers like us provide warranties on refurbished machines, ensuring you're protected against any hardware defects.</p>
              </div>
            </div>

            <h2 class="text-2xl font-bold mt-8 mb-4">Is it Right for You?</h2>
            <p>If you are a student looking for a powerful coding machine, a small business owner needing reliable office tools, or someone who wants a premium MacBook experience on a budget, refurbished is the way to go.</p>
            
            <p class="mt-6 font-medium">Ready to find your next laptop? Explore our <a href="/category/dell-laptop" class="text-primary hover:underline font-bold">Refurbished Collection</a> today at Chauhan Computers!</p>
          </div>
        `,
        featured_image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=2070&auto=format&fit=crop",
        author: "Chauhan Computers",
        status: "published"
      }
    ];

    for (const blog of blogs) {
      await pool.query(
        `INSERT INTO blogs (id, title, slug, excerpt, content, featured_image, author, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) DO UPDATE SET 
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         excerpt = EXCLUDED.excerpt,
         featured_image = EXCLUDED.featured_image`,
        [blog.id, blog.title, blog.slug, blog.excerpt, blog.content, blog.featured_image, blog.author, blog.status]
      );
      console.log(`✅ Seeded blog: ${blog.title}`);
    }

    console.log('Seeding completed.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await pool.end();
  }
};

seedBlogs();
