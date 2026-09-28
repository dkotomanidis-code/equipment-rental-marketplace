const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { PLATFORM_COMMISSION_RATE } = require('../constants/payments');
const { requireAuth } = require('../middleware/auth');

const paymentRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/payments/create-intent - Create Stripe payment intent
router.post('/create-intent', paymentRateLimit, requireAuth, async (req, res) => {
  try {
    const { bookingId, equipmentId, startDate, endDate, amount, currency = 'usd' } = req.body;

    if (!amount || amount <= 0 || !equipmentId || !startDate || !endDate) {
      return res.status(400).json({ error: 'amount, equipmentId, startDate, and endDate are required' });
    }

    let persistedBookingId = null;
    if (bookingId != null) {
      const bookingRows = await db.query('SELECT id FROM bookings WHERE id = ? LIMIT 1', [bookingId]);
      persistedBookingId = bookingRows[0]?.id || null;

      if (!persistedBookingId) {
        return res.status(404).json({ error: 'Booking not found' });
      }
    }

    const totalAmountCents = Math.round(amount * 100); // Convert to cents
    const commissionCents = Math.round(totalAmountCents * PLATFORM_COMMISSION_RATE);
    const ownerAmountCents = totalAmountCents - commissionCents;

    const metadata = {
      userId: String(req.user.id),
      equipmentId: String(equipmentId),
      startDate: String(startDate),
      endDate: String(endDate),
      amount: String(amount),
      commission: String(commissionCents),
      ownerAmount: String(ownerAmountCents),
    };
    if (bookingId != null) {
      metadata.bookingId = String(bookingId);
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency,
      metadata,
    });

    await db.query(
      `
        INSERT INTO payments (
          payment_id,
          booking_id,
          user_id,
          equipment_id,
          rental_start_date,
          rental_end_date,
          subtotal,
          tax_amount,
          total_amount,
          commission,
          owner_amount,
          currency,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          user_id = VALUES(user_id),
          equipment_id = VALUES(equipment_id),
          rental_start_date = VALUES(rental_start_date),
          rental_end_date = VALUES(rental_end_date),
          subtotal = VALUES(subtotal),
          tax_amount = VALUES(tax_amount),
          total_amount = VALUES(total_amount),
          commission = VALUES(commission),
          owner_amount = VALUES(owner_amount),
          currency = VALUES(currency),
          status = VALUES(status)
      `,
      [
        paymentIntent.id,
        persistedBookingId,
        req.user.id,
        equipmentId,
        startDate,
        endDate,
        totalAmountCents / 100,
        0,
        totalAmountCents / 100,
        commissionCents / 100,
        ownerAmountCents / 100,
        currency,
        'pending',
      ]
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.id,
      amount: totalAmountCents / 100,
      commission: commissionCents / 100,
      ownerAmount: ownerAmountCents / 100,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments/confirm - Confirm payment after Stripe processes it
router.post('/confirm', paymentRateLimit, requireAuth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    await db.query('UPDATE payments SET status = ? WHERE payment_id = ? AND user_id = ?', [
      paymentIntent.status === 'succeeded' ? 'completed' : paymentIntent.status,
      paymentIntentId,
      req.user.id,
    ]);

    const paymentRows = await db.query('SELECT * FROM payments WHERE payment_id = ? AND user_id = ? LIMIT 1', [
      paymentIntentId,
      req.user.id,
    ]);

    res.json({
      status: paymentIntent.status,
      paymentId: paymentIntentId,
      payment: paymentRows[0] || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments/refund - Refund a payment
router.post('/refund', paymentRateLimit, requireAuth, async (req, res) => {
  try {
    const { paymentIntentId, reason = 'requested_by_customer' } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const paymentRows = await db.query('SELECT payment_id FROM payments WHERE payment_id = ? AND user_id = ? LIMIT 1', [
      paymentIntentId,
      req.user.id,
    ]);

    if (paymentRows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason,
    });

    await db.query('UPDATE payments SET status = ? WHERE payment_id = ? AND user_id = ?', [
      'refunded',
      paymentIntentId,
      req.user.id,
    ]);

    res.json({
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payments/:paymentId - Get payment details
router.get('/:paymentId', paymentRateLimit, requireAuth, async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM payments WHERE payment_id = ? AND user_id = ? LIMIT 1', [
      req.params.paymentId,
      req.user.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    return res.json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
