require('dotenv').config();
const pool = require('./pool');

async function migrateTokenVersion(db = pool) {
  const connection = await db.getConnection();
  try {
    const [rows] = await connection.execute(
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'token_version'
    );
    
    if (!rows.length) {
      await connection.execute(
        ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0
      );
      console.log('Added token_version column to users table');
    } else {
      console.log('token_version column already exists');
    }
  } finally {
    connection.release();
  }
}

if (require.main === module) {
  migrateTokenVersion()
    .then(() => console.log('Token version migration complete'))
    .catch((error) => { 
      console.error('Token version migration failed:', error.message); 
      process.exitCode = 1; 
    })
    .finally(() => pool.end());
}

module.exports = { migrateTokenVersion };
