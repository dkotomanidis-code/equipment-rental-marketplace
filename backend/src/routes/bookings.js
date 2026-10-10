const express = require('express');
const router = express.Router();
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { asyncRoute, validId, rentalDays, priceCents, bookingColumns } = require('../utils/api');

router.use(authenticate);

// Get renter and owner bookings; preserve the renter-only dashboard route.
router.get(['/', '/my-bookings'], asyncRoute(async (req, res) => {
  const renterOnly = req.path === '/my-bookings';
  const [rows] = await pool.execute(
    `SELECT ${bookingColumns} FROM bookings b JOIN equipment e ON e.id = b.equipment_id
     WHERE ${renterOnly ? 'b.renter_id = ?' : '(b.renter_id = ? OR e.owner_id = ?)'} ORDER BY b.id DESC`,
    renterOnly ? [req.user.id] : [req.user.id, req.user.id]
  );
  res.json(rows);
}));

router.param('id', (req, res, next, id) => {
  if (!validId(id)) return res.status(400).json({ error: 'Invalid booking ID' });
  next();
});

async function findBooking(db, id, lock = false) {
  const [rows] = await db.execute(
    `SELECT ${bookingColumns}, e.owner_id AS ownerId FROM bookings b
     JOIN equipment e ON e.id = b.equipment_id WHERE b.id = ?${lock ? ' FOR UPDATE' : ''}`,
    [id]
  );
  return rows[0];
}

const participant = (booking, userId) => booking.renterId === userId || booking.ownerId === userId;
const response = ({ ownerId, ...booking }) => booking;

router.get('/:id', asyncRoute(async (req, res) => {
  const booking = await findBooking(pool, req.params.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (!participant(booking, req.user.id)) return res.status(403).json({ error: 'Access denied' });
  res.json(response(booking));
}));

// Dates use an exclusive end date, matching the existing frontend price calculation.
router.post('/', asyncRoute(async (req, res) => {
  const { equipmentId, startDate, endDate, paymentId } = req.body;
  const days = rentalDays(startDate, endDate);
  if (!validId(equipmentId) || !days ||
      (paymentId != null && (typeof paymentId !== 'string' || !paymentId || paymentId.length > 255))) {
    return res.status(400).json({ error: 'Valid equipmentId and dates (endDate after startDate) are required' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [items] = await connection.execute('SELECT * FROM equipment WHERE id = ? FOR UPDATE', [equipmentId]);
    const item = items[0];
    if (!item) return res.status(404).json({ error: 'Equipment not found' });
    if (item.owner_id === req.user.id) return res.status(403).json({ error: 'Cannot book your own equipment' });
    if (!item.availability_status) return res.status(409).json({ error: 'Equipment is unavailable' });

    const totalCents = days * priceCents(item.price_per_day);
    if (!Number.isSafeInteger(totalCents) || totalCents <= 0 || totalCents > 9999999999) {
      return res.status(400).json({ error: 'Booking price is out of range' });
    }
    const [overlaps] = await connection.execute(
      `SELECT id FROM bookings WHERE equipment_id = ? AND status IN ('pending', 'confirmed')
       AND start_date < ? AND end_date > ? FOR UPDATE`,
      [equipmentId, endDate, startDate]
    );
    if (overlaps.length) return res.status(409).json({ error: 'Equipment is already booked for these dates' });

    if (paymentId) {
      const [payments] = await connection.execute('SELECT * FROM payments WHERE payment_id = ? FOR UPDATE', [paymentId]);
      const payment = payments[0];
      if (!payment || payment.user_id !== req.user.id || payment.status !== 'succeeded' ||
          payment.booking_id !== null || Math.round(Number(payment.amount) * 100) !== totalCents) {
        return res.status(400).json({ error: 'Payment must be verified, unused, and match the booking price and renter' });
      }
    }

    const [result] = await connection.execute(
      `INSERT INTO bookings (renter_id, equipment_id, start_date, end_date, total_price, status, payment_status, payment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, equipmentId, startDate, endDate, totalCents / 100,
        paymentId ? 'confirmed' : 'pending', paymentId ? 'paid' : 'unpaid', paymentId || null]
    );
    if (paymentId) {
      await connection.execute('UPDATE payments SET booking_id = ? WHERE payment_id = ?', [result.insertId, paymentId]);
    }
    const booking = await findBooking(connection, result.insertId);
    await connection.commit();
    res.status(201).json(response(booking));
  } finally {
    // Also rolls back early validation returns; after commit this is a no-op.
    try { await connection.rollback(); } finally { connection.release(); }
  }
}));

// Owners can confirm/complete a booking; either participant can cancel.
router.put('/:id', asyncRoute(async (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'completed', 'cancelled'].includes(status) ||
      Object.keys(req.body).some((key) => key !== 'status')) {
    return res.status(400).json({ error: 'Only a valid booking status can be updated' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const booking = await findBooking(connection, req.params.id, true);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!participant(booking, req.user.id) || (status !== 'cancelled' && booking.ownerId !== req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to change this booking status' });
    }
    const transitions = { pending: ['confirmed', 'cancelled'], confirmed: ['completed', 'cancelled'] };
    if (!transitions[booking.status]?.includes(status)) {
      return res.status(409).json({ error: 'Invalid booking status transition' });
    }
    if (status === 'cancelled' && booking.paymentStatus === 'paid') {
      return res.status(409).json({ error: 'Refund the payment before cancelling' });
    }
    await connection.execute('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      status, req.params.id,
    ]);
    await connection.commit();
    res.json(response({ ...booking, status }));
  } finally {
    try { await connection.rollback(); } finally { connection.release(); }
  }
}));

router.delete('/:id', asyncRoute(async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const booking = await findBooking(connection, req.params.id, true);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (!participant(booking, req.user.id)) return res.status(403).json({ error: 'Access denied' });
    if (booking.paymentStatus === 'paid' || !['pending', 'cancelled'].includes(booking.status)) {
      return res.status(409).json({ error: 'Only unpaid pending or cancelled bookings can be deleted' });
    }
    await connection.execute('DELETE FROM bookings WHERE id = ?', [req.params.id]);
    await connection.commit();
    res.json({ message: 'Booking deleted' });
  } finally {
    try { await connection.rollback(); } finally { connection.release(); }
  }
}));

module.exports = router;
