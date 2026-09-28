const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { PLATFORM_COMMISSION_RATE } = require('../constants/payments');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { serializeBooking } = require('../utils/serializers');

const protectedRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

const BOOKING_DETAILS_QUERY = `
  SELECT
    b.*,
    e.owner_id,
    e.name AS equipment_name,
    e.image_url AS equipment_image_url,
    e.location,
    owner.username AS owner_username,
    owner.first_name AS owner_first_name,
    owner.last_name AS owner_last_name
  FROM bookings b
  JOIN equipment e ON e.id = b.equipment_id
  LEFT JOIN users owner ON owner.id = e.owner_id
  WHERE b.id = ?
  LIMIT 1
`;

function getEarningsStatus(booking) {
  if (['cancelled', 'rejected'].includes(booking.status)) {
    return booking.status;
  }

  if (booking.payment_status === 'refunded') {
    return 'refunded';
  }

  if (booking.payment_status === 'paid' || ['confirmed', 'completed'].includes(booking.status)) {
    return 'completed';
  }

  return 'pending';
}

// Get user's bookings
router.get('/my-bookings', protectedRateLimit, requireAuth, async (req, res) => {
  try {
    const rows = await db.query(
      `
        SELECT
          b.*,
          e.owner_id,
          e.name AS equipment_name,
          e.image_url AS equipment_image_url,
          e.location,
          owner.username AS owner_username,
          owner.first_name AS owner_first_name,
          owner.last_name AS owner_last_name
        FROM bookings b
        JOIN equipment e ON e.id = b.equipment_id
        LEFT JOIN users owner ON owner.id = e.owner_id
        WHERE b.renter_id = ?
        ORDER BY b.start_date DESC, b.created_at DESC
      `,
      [req.user.id]
    );

    res.json(rows.map((row) => serializeBooking(row)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/bookings/:id - Get booking details
router.get('/:id', protectedRateLimit, requireAuth, async (req, res) => {
  try {
    const rows = await db.query(
      `
        ${BOOKING_DETAILS_QUERY.trim().replace('WHERE b.id = ?', 'WHERE b.id = ? AND b.renter_id = ?')}
      `,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    return res.json(serializeBooking(rows[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/bookings - Create booking with payment info
router.post('/', protectedRateLimit, requireAuth, async (req, res) => {
  const { equipmentId, startDate, endDate, totalPrice, paymentId } = req.body;

  if (!equipmentId || !startDate || !endDate) {
    return res.status(400).json({ error: 'equipmentId, startDate, and endDate are required' });
  }

  try {
    const connection = await db.getPool().getConnection();

    try {
      await connection.beginTransaction();

      const [equipmentRows] = await connection.execute(
        'SELECT id, owner_id, name FROM equipment WHERE id = ? AND availability_status = true LIMIT 1 FOR UPDATE',
        [equipmentId]
      );
      const equipment = equipmentRows[0];

      if (!equipment) {
        await connection.rollback();
        return res.status(404).json({ error: 'Equipment not found' });
      }

      if (equipment.owner_id === req.user.id) {
        await connection.rollback();
        return res.status(400).json({ error: 'You cannot book your own equipment' });
      }

      let bookingStatus = 'pending';
      let paymentStatus = 'unpaid';

      if (paymentId) {
        const [paymentRows] = await connection.execute(
          `
            SELECT payment_id, status, user_id, equipment_id, rental_start_date, rental_end_date, total_amount
            FROM payments
            WHERE payment_id = ?
            LIMIT 1
            FOR UPDATE
          `,
          [paymentId]
        );
        const payment = paymentRows[0];

        if (
          !payment ||
          payment.status !== 'completed' ||
          payment.user_id !== req.user.id ||
          payment.equipment_id !== Number(equipmentId) ||
          String(payment.rental_start_date) !== String(startDate) ||
          String(payment.rental_end_date) !== String(endDate) ||
          Number(payment.total_amount) !== Number(totalPrice || 0)
        ) {
          await connection.rollback();
          return res.status(400).json({ error: 'A completed payment is required for this booking' });
        }

        bookingStatus = 'confirmed';
        paymentStatus = 'paid';
      }

      const [overlapRows] = await connection.execute(
        `
          SELECT id
          FROM bookings
          WHERE equipment_id = ?
            AND status NOT IN ('cancelled', 'rejected')
            AND start_date <= ?
            AND end_date >= ?
          LIMIT 1
          FOR UPDATE
        `,
        [equipmentId, endDate, startDate]
      );

      if (overlapRows.length > 0) {
        await connection.rollback();
        return res.status(409).json({ error: 'Equipment is already booked for those dates' });
      }

      const [insertResult] = await connection.execute(
        `
          INSERT INTO bookings (renter_id, equipment_id, start_date, end_date, total_price, status, payment_status, payment_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [req.user.id, equipmentId, startDate, endDate, totalPrice || 0, bookingStatus, paymentStatus, paymentId || null]
      );

      await connection.execute('UPDATE users SET is_renter = true WHERE id = ?', [req.user.id]);

      if (paymentId) {
        await connection.execute('UPDATE payments SET booking_id = ? WHERE payment_id = ?', [insertResult.insertId, paymentId]);
      }

      if (equipment.owner_id && Number(totalPrice || 0) > 0) {
        const amount = Number(totalPrice);
        const commission = Number((amount * PLATFORM_COMMISSION_RATE).toFixed(2));
        const netAmount = Number((amount - commission).toFixed(2));
        const daysRented = Math.max(
          1,
          Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
        );

        await connection.execute(
          `
            INSERT INTO user_earnings (
              owner_id,
              booking_id,
              equipment_id,
              amount,
              commission,
              net_amount,
              status,
              rental_start_date,
              rental_end_date,
              days_rented
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            equipment.owner_id,
            insertResult.insertId,
            equipmentId,
            amount,
            commission,
            netAmount,
            paymentStatus === 'paid' ? 'completed' : 'pending',
            startDate,
            endDate,
            daysRented,
          ]
        );
      }

      await connection.commit();

      const rows = await db.query(BOOKING_DETAILS_QUERY, [insertResult.insertId]);
      return res.status(201).json(serializeBooking(rows[0]));
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update booking status
router.put('/:id', protectedRateLimit, requireAuth, async (req, res) => {
  try {
    const allowedFields = ['status'];
    const updates = Object.entries(req.body).filter(([key]) => allowedFields.includes(key));

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const ownerRows = await db.query(
      `
        SELECT b.id
        FROM bookings b
        JOIN equipment e ON e.id = b.equipment_id
        WHERE b.id = ?
          AND e.owner_id = ?
        LIMIT 1
      `,
      [req.params.id, req.user.id]
    );

    if (ownerRows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const fields = [];
    const params = [];

    for (const [key, value] of updates) {
      if (key === 'paymentStatus') {
        fields.push('payment_status = ?');
      } else {
        fields.push(`${key} = ?`);
      }
      params.push(value);
    }

    params.push(req.params.id);

    await db.query(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, params);

    const rows = await db.query(BOOKING_DETAILS_QUERY, [req.params.id]);
    const booking = rows[0];

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    await db.query('UPDATE user_earnings SET status = ? WHERE booking_id = ?', [getEarningsStatus(booking), req.params.id]);
    return res.json(serializeBooking(booking));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
