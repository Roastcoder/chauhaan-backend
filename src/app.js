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
// Root health check (optional, already in routes but good for root level)
app.get("/", (req, res) => res.json({ status: "ok", message: "Chauhaan Computers API is running 🚀" }));

// Initialize DB and start server
async function startServer() {
  try {
    const pool = await connect();
    console.log(`✅ MySQL database connected successfully`);

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
