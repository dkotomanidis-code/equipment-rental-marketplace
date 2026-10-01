const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('📋 Starting database setup...');
    console.log('🔧 DB_HOST:', process.env.DB_HOST || 'localhost');
    console.log('👤 DB_USER:', process.env.DB_USER || 'root');
    console.log('🗄️  DB_NAME:', process.env.DB_NAME || 'equipment_rental');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log('📂 Schema path:', schemaPath);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error('Schema file not found at: ' + schemaPath);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Schema file loaded');

    // Connect to MySQL
    console.log('🔌 Connecting to MySQL...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });

    console.log('✅ Connected to MySQL');

    // Create database if it doesn't exist
    console.log('🗄️  Creating database...');
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'equipment_rental'}\``);
    console.log('✅ Database created/verified');

    // Select the database
    console.log('📊 Selecting database...');
    await connection.execute(`USE \`${process.env.DB_NAME || 'equipment_rental'}\``);
    console.log('✅ Database selected');

    // Execute the schema
    console.log('📝 Creating tables...');
    await connection.execute(schema);
    console.log('✅ Tables created/verified');

    await connection.end();
    console.log('✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('SQL:', error.sql);
    console.error('Full Error:', error);
    process.exit(1);
  }
}

setupDatabase();