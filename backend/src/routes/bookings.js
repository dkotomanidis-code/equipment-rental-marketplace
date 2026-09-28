const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { serializeBooking } = require('../utils/serializers');

// Get user's bookings
router.get('/my-bookings', requireAuth, async (req, res) => {
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
router.get('/:id', requireAuth, async (req, res) => {
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
        WHERE b.id = ?
          AND b.renter_id = ?
        LIMIT 1
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
router.post('/', requireAuth, async (req, res) => {
  const { equipmentId, startDate, endDate, totalPrice, paymentId } = req.body;

  if (!equipmentId || !startDate || !endDate) {
    return res.status(400).json({ error: 'equipmentId, startDate, and endDate are required' });
  }

  try {
    const [equipment] = await db.query(
      'SELECT id, owner_id, name FROM equipment WHERE id = ? AND availability_status = true LIMIT 1',
      [equipmentId]
    );

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const insertResult = await db.query(
      `
        INSERT INTO bookings (renter_id, equipment_id, start_date, end_date, total_price, status, payment_status, payment_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        req.user.id,
        equipmentId,
        startDate,
        endDate,
        totalPrice || 0,
        paymentId ? 'confirmed' : 'pending',
        paymentId ? 'paid' : 'unpaid',
        paymentId || null,
      ]
    );

    await db.query('UPDATE users SET is_renter = true WHERE id = ?', [req.user.id]);

    if (equipment.owner_id && Number(totalPrice || 0) > 0) {
      const amount = Number(totalPrice);
      const commission = Number((amount * 0.05).toFixed(2));
      const netAmount = Number((amount - commission).toFixed(2));
      const daysRented = Math.max(
        1,
        Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      );

      await db.query(
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
          paymentId ? 'completed' : 'pending',
          startDate,
          endDate,
          daysRented,
        ]
      );
    }

    const rows = await db.query(
      `
        SELECT
          b.*,
          e.owner_id,
          e.name AS equipment_name,
          e.image_url AS equipment_image_url,
          e.location
        FROM bookings b
        JOIN equipment e ON e.id = b.equipment_id
        WHERE b.id = ?
        LIMIT 1
      `,
      [insertResult.insertId]
    );

    return res.status(201).json(serializeBooking(rows[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update booking status
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const allowedFields = ['status', 'paymentStatus'];
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

    const rows = await db.query('SELECT * FROM bookings WHERE id = ? LIMIT 1', [req.params.id]);
    return res.json(serializeBooking(rows[0]));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
