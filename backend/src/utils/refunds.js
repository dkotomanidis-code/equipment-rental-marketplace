const pool = require('../database/pool');

async function reconcileRefund(refund) {
  const status = refund.status === 'succeeded' ? 'refunded'
    : ['failed', 'canceled'].includes(refund.status) ? 'refund_failed' : 'refund_pending';
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `SELECT b.id FROM bookings b JOIN equipment e ON e.id = b.equipment_id
       WHERE b.payment_id = ? FOR UPDATE`, [refund.payment_intent]
    );
    const [rows] = await connection.execute(
      `SELECT amount FROM payments WHERE payment_id = ? AND status = 'refund_pending'
       AND (refund_id = ? OR (refund_key = ? AND refund_id IS NULL)) FOR UPDATE`,
      [refund.payment_intent, refund.id, refund.metadata?.refundKey || null]
    );
    if (rows[0] && Math.round(rows[0].amount * 100) === refund.amount) {
      await connection.execute(
        'UPDATE payments SET refund_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?',
        [refund.id, status, refund.payment_intent]
      );
      await connection.execute(
        `UPDATE bookings SET payment_status = ?,
         status = CASE WHEN ? = 'refunded' THEN 'cancelled' ELSE status END,
         updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?`,
        [status === 'refund_failed' ? 'paid' : status, status, refund.payment_intent]
      );
    }
    await connection.commit();
    return status;
  } finally {
    try { await connection.rollback(); } finally { connection.release(); }
  }
}

module.exports = { reconcileRefund };
