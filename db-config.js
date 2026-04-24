module.exports = {
  connectionString: process.env.DATABASE_URL || 'postgres://chauhan:chauhan%40computer@187.77.187.120:5411/chauhan%20db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};
