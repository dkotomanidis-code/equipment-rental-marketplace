require('dotenv').config();
const pool = require('./pool');

async function migrate(db = pool) {
  const connection = await db.getConnection();
  let locked = false;
  try {
    const [locks] = await connection.execute("SELECT GET_LOCK(CONCAT(DATABASE(), ':refund-migration'), 30) AS acquired");
    locked = locks[0].acquired === 1;
    if (!locked) throw new Error('Could not acquire database migration lock');
    const columns = {
      refund_id: 'VARCHAR(255) UNIQUE',
      refund_key: 'VARCHAR(36) UNIQUE',
      refund_reason: 'VARCHAR(50)',
      refund_requested_at: 'TIMESTAMP NULL',
    };
    for (const [name, definition] of Object.entries(columns)) {
      const [rows] = await connection.execute(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = ?`, [name]
      );
      if (!rows.length) await connection.query(`ALTER TABLE payments ADD COLUMN ${name} ${definition}`);
    }
  } finally {
    try {
      if (locked) await connection.execute("SELECT RELEASE_LOCK(CONCAT(DATABASE(), ':refund-migration'))");
    } finally { connection.release(); }
  }
}

if (require.main === module) {
  migrate().then(() => console.log('Refund schema upgrade complete'))
    .catch((error) => { console.error('Database migration failed:', error.message); process.exitCode = 1; })
    .finally(() => pool.end());
}

module.exports = { migrate };
