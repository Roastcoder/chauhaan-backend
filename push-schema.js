require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function pushToDatabase() {
  const config = {
    host: 'localhost',
    user: 'u463483684_data',
    password: 'System@280303',
    database: 'u463483684_chouhan',
    multipleStatements: true
  };

  console.log('🔌 Connecting to MySQL database...');
  const connection = await mysql.createConnection(config);
  
  console.log('✅ Connected to database');
  
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  
  console.log('📤 Executing SQL schema...');
  await connection.query(schema);
  
  console.log('✅ Schema created successfully!');
  console.log('📊 Tables created in database: u463483684_chouhan');
  
  await connection.end();
  console.log('👋 Connection closed');
}

pushToDatabase().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
