require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function setup() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    for (const statement of schema.split(';').filter((sql) => sql.trim())) {
      await pool.query(statement);
    }
    console.log('Database tables created');
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

setup();
