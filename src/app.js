require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connect } = require('./config/db');
const { createTables, seed } = require('./config/init');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const ALLOWED_ORIGINS = [
  /^http:\/\/localhost(:\d+)?$/,
  "https://chauhancomputers.co.in",
  "https://www.chauhancomputers.co.in",
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = ALLOWED_ORIGINS.some(o => typeof o === "string" ? o === origin : o.test(origin));
    cb(allowed ? null : new Error("CORS blocked"), allowed);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Serve static uploads
const uploadsDir = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsDir));

// API Routes
app.use("/api", routes);
// Root health check with "hacker" interface
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chauhaan Computers API</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #0f172a;
          color: white;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .container {
          text-align: center;
          padding: 2rem;
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 2rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          max-width: 500px;
          width: 90%;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 100px;
          color: #4ade80;
          font-size: 0.75rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .pulse {
          width: 8px;
          height: 8px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(to right, #fff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        p {
          color: #94a3b8;
          font-size: 0.875rem;
          margin: 0 0 2rem 0;
        }
        .footer {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 1.5rem;
          display: grid;
          grid-cols: 2;
          gap: 1rem;
          text-align: left;
        }
        .stat {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
        }
        .stat-label { color: #64748b; }
        .stat-value { font-family: monospace; color: #cbd5e1; }
        .btn {
          display: inline-block;
          margin-top: 2rem;
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          transition: all 0.2s;
        }
        .btn:hover { background: #2563eb; transform: translateY(-2px); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="status-badge">
          <div class="pulse"></div>
          SYSTEM ONLINE
        </div>
        <h1>Chauhaan Computers Core</h1>
        <p>Production API Service is running and healthy.</p>
        
        <div class="footer">
          <div class="stat">
            <span class="stat-label">Version</span>
            <span class="stat-value">1.0.2-pg-stable</span>
          </div>
          <div class="stat">
            <span class="stat-label">Database</span>
            <span class="stat-value">PostgreSQL</span>
          </div>
          <div class="stat">
            <span class="stat-label">Last Refresh</span>
            <span class="stat-value">${new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <a href="https://chauhancomputers.co.in" class="btn">Visit Website</a>
      </div>
    </body>
    </html>
  `);
});

// Initialize DB and start server
async function startServer() {
  try {
    const pool = await connect();
    console.log(`✅ PostgreSQL database connected successfully`);

    // Ensure tables exist and seed data if empty
    await createTables(pool);
    await seed(pool);
    console.log(`✅ Database schema verified and seeded`);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Backend running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
