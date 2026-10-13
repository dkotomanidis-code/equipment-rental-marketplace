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

    const equipmentColumns = {
      city: 'VARCHAR(100) NULL',
      latitude: 'DECIMAL(10, 8) NULL',
      longitude: 'DECIMAL(11, 8) NULL',
    };
    for (const [name, definition] of Object.entries(equipmentColumns)) {
      const [rows] = await connection.execute(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'equipment' AND COLUMN_NAME = ?`, [name]
      );
      if (!rows.length) await connection.query(`ALTER TABLE equipment ADD COLUMN ${name} ${definition}`);
    }
    const [cityIndex] = await connection.execute(
      `SELECT INDEX_NAME FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'equipment' AND INDEX_NAME = 'idx_equipment_city'`
    );
    if (!cityIndex.length) await connection.query('CREATE INDEX idx_equipment_city ON equipment(city)');

    const [tokenVersion] = await connection.execute(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'token_version'`
    );
    if (!tokenVersion.length) {
      await connection.query('ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 0');
    }

    const [duplicateReviews] = await connection.query(
      `SELECT booking_id, reviewer_id, COUNT(*) AS review_count
       FROM reviews GROUP BY booking_id, reviewer_id HAVING COUNT(*) > 1 LIMIT 1`
    );
    if (duplicateReviews.length) {
      const duplicate = duplicateReviews[0];
      throw new Error(
        `Cannot add unique review constraint: booking ${duplicate.booking_id} has ${duplicate.review_count} reviews by reviewer ${duplicate.reviewer_id}. Resolve duplicate review records manually before retrying.`
      );
    }

    const tables = [
      `CREATE TABLE IF NOT EXISTS favorites (
        user_id INT NOT NULL,
        equipment_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, equipment_id),
        INDEX idx_favorites_user_created (user_id, created_at, equipment_id),
        CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_favorites_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS conversations (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        equipment_id INT NULL,
        renter_id INT NOT NULL,
        owner_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_conversations_listing_renter (equipment_id, renter_id),
        INDEX idx_conversations_renter_updated (renter_id, updated_at, id),
        INDEX idx_conversations_owner_updated (owner_id, updated_at, id),
        CONSTRAINT fk_conversations_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL,
        CONSTRAINT fk_conversations_renter FOREIGN KEY (renter_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_conversations_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS messages (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        sender_id INT NOT NULL,
        body VARCHAR(2000) NOT NULL,
        read_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_messages_conversation_id (conversation_id, id),
        INDEX idx_messages_unread (conversation_id, sender_id, read_at, id),
        CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        actor_id INT NULL,
        event_key VARCHAR(191) NOT NULL UNIQUE,
        type VARCHAR(40) NOT NULL,
        message VARCHAR(255) NOT NULL,
        resource_type VARCHAR(40) NOT NULL,
        resource_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP NULL,
        INDEX idx_notifications_user_created (user_id, created_at, id),
        INDEX idx_notifications_user_unread (user_id, read_at, id),
        CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB`,
    ];
    for (const sql of tables) await connection.query(sql);

    const [reviewIndex] = await connection.execute(
      `SELECT INDEX_NAME FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND INDEX_NAME = 'uq_reviews_booking_reviewer'`
    );
    if (!reviewIndex.length) {
      await connection.query('ALTER TABLE reviews ADD UNIQUE KEY uq_reviews_booking_reviewer (booking_id, reviewer_id)');
    }
    const [reviewEquipmentIndex] = await connection.execute(
      `SELECT INDEX_NAME FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND INDEX_NAME = 'idx_reviews_booking_created'`
    );
    if (!reviewEquipmentIndex.length) {
      await connection.query('ALTER TABLE reviews ADD INDEX idx_reviews_booking_created (booking_id, created_at, id)');
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
