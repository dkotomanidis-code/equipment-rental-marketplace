const express = require('express');
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { asyncRoute, validId } = require('../utils/api');

const router = express.Router();

function pagination(query) {
  const page = Math.min(100000, Math.max(1, Number.parseInt(query.page, 10) || 1));
  const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

router.param('equipmentId', (req, res, next, id) => {
  if (!validId(id)) return res.status(400).json({ error: 'Invalid equipment ID' });
  next();
});

async function listReviews(req, res) {
  const { page, limit, offset } = pagination(req.query);
  const [equipment] = await pool.execute('SELECT id FROM equipment WHERE id = ?', [req.params.equipmentId]);
  if (!equipment.length) return res.status(404).json({ error: 'Equipment not found' });

  const [rows] = await pool.execute(
    `SELECT r.id, r.booking_id AS bookingId, r.rating, r.comment,
            r.created_at AS createdAt, u.id AS reviewerId, u.username AS reviewerUsername,
            u.first_name AS reviewerFirstName, u.last_name AS reviewerLastName
     FROM reviews r
     JOIN bookings b ON b.id = r.booking_id
     JOIN users u ON u.id = r.reviewer_id
     WHERE b.equipment_id = ?
     ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?`,
    [req.params.equipmentId, limit, offset]
  );
  const [stats] = await pool.execute(
    `SELECT COUNT(*) AS total, COALESCE(AVG(r.rating), 0) AS averageRating
     FROM reviews r JOIN bookings b ON b.id = r.booking_id WHERE b.equipment_id = ?`,
    [req.params.equipmentId]
  );
  res.json({
    items: rows,
    page,
    limit,
    total: stats[0].total,
    averageRating: Number(stats[0].averageRating),
  });
}

router.get('/equipment/:equipmentId', asyncRoute(listReviews));
router.get('/:equipmentId', asyncRoute(listReviews));

router.get('/eligible/:equipmentId', authenticate, asyncRoute(async (req, res) => {
  const [equipment] = await pool.execute('SELECT id, owner_id FROM equipment WHERE id = ?', [
    req.params.equipmentId,
  ]);
  if (!equipment.length) return res.status(404).json({ error: 'Equipment not found' });
  if (equipment[0].owner_id === req.user.id) return res.json({ bookings: [] });
  const [rows] = await pool.execute(
    `SELECT b.id AS bookingId, b.end_date AS endDate
     FROM bookings b LEFT JOIN reviews r ON r.booking_id = b.id AND r.reviewer_id = b.renter_id
     WHERE b.equipment_id = ? AND b.renter_id = ? AND b.status = 'completed' AND r.id IS NULL
     ORDER BY b.end_date DESC, b.id DESC`,
    [req.params.equipmentId, req.user.id]
  );
  res.json({ bookings: rows });
}));

async function createReview(req, res, bookingId, pathEquipmentId) {
  const { rating, comment = '' } = req.body || {};
  if (!validId(bookingId) || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
      typeof comment !== 'string' || comment.length > 2000 ||
      Object.keys(req.body || {}).some((key) => !['bookingId', 'equipmentId', 'rating', 'comment', 'text'].includes(key))) {
    return res.status(400).json({ error: 'Review requires a valid booking, an integer rating from 1 to 5, and a comment up to 2000 characters' });
  }
  const text = req.body.comment ?? req.body.text ?? '';
  if (typeof text !== 'string' || text.length > 2000) {
    return res.status(400).json({ error: 'Comment must be plain text up to 2000 characters' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT b.id, b.renter_id AS renterId, b.equipment_id AS equipmentId, b.status,
              e.owner_id AS ownerId
       FROM bookings b JOIN equipment e ON e.id = b.equipment_id
       WHERE b.id = ? FOR UPDATE`,
      [bookingId]
    );
    const booking = rows[0];
    if (!booking) {
      await connection.rollback();
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.renterId !== req.user.id) {
      await connection.rollback();
      return res.status(403).json({ error: 'Only the booking renter can review this booking' });
    }
    if (booking.ownerId === req.user.id) {
      await connection.rollback();
      return res.status(403).json({ error: 'Listing owners cannot review their own equipment' });
    }
    if (booking.status !== 'completed') {
      await connection.rollback();
      return res.status(409).json({ error: 'Only completed bookings can be reviewed' });
    }
    if ((pathEquipmentId !== undefined && String(pathEquipmentId) !== String(booking.equipmentId)) ||
        (req.body.equipmentId !== undefined && String(req.body.equipmentId) !== String(booking.equipmentId))) {
      await connection.rollback();
      return res.status(400).json({ error: 'Equipment does not match the booking' });
    }

    const [existing] = await connection.execute(
      'SELECT id FROM reviews WHERE booking_id = ? AND reviewer_id = ?',
      [booking.id, req.user.id]
    );
    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({ error: 'This booking has already been reviewed' });
    }
    const [result] = await connection.execute(
      'INSERT INTO reviews (booking_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?)',
      [booking.id, req.user.id, rating, text.trim() || null]
    );
    await connection.commit();
    res.status(201).json({
      id: result.insertId,
      bookingId: booking.id,
      reviewerId: req.user.id,
      rating,
      comment: text.trim(),
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'This booking has already been reviewed' });
    }
    throw error;
  } finally {
    try { await connection.rollback(); } finally { connection.release(); }
  }
}

router.post('/', authenticate, asyncRoute(async (req, res) => createReview(req, res, req.body?.bookingId)));
router.post('/:equipmentId', authenticate, asyncRoute(async (req, res) => {
  return createReview(req, res, req.body?.bookingId, req.params.equipmentId);
}));

module.exports = router;
