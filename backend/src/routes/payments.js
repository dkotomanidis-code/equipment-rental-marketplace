const express = require('express');
const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { asyncRoute, priceCents } = require('../utils/api');

const PLATFORM_COMMISSION_RATE = 0.05; // 5%
const paymentColumns = `payment_id AS paymentId, booking_id AS bookingId, amount,
  commission, owner_amount AS ownerAmount, currency, status, created_at AS createdAt`;

router.use(authenticate);
router.use((req, res, next) => {
  if (!stripe) return res.status(503).json({ error: 'Payments are not configured' });
  next();
});

async function ownPayment(paymentId, userId) {
  const [rows] = await pool.execute(
    `SELECT ${paymentColumns} FROM payments WHERE payment_id = ? AND user_id = ?`,
    [paymentId, userId]
  );
  return rows[0];
}

// POST /api/payments/create-intent - Create Stripe payment intent
router.post('/create-intent', asyncRoute(async (req, res) => {
  const { amount, currency = 'usd', bookingId } = req.body;
  const totalAmountCents = priceCents(amount);
  if (totalAmountCents === null || currency !== 'usd' || bookingId != null) {
    return res.status(400).json({ error: 'A positive USD amount is required; create payment before booking' });
  }
  const commissionCents = Math.round(totalAmountCents * PLATFORM_COMMISSION_RATE);
  const ownerAmountCents = totalAmountCents - commissionCents;
  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmountCents,
    currency,
    metadata: {
      renterId: String(req.user.id),
      commission: String(commissionCents),
      ownerAmount: String(ownerAmountCents),
    },
  });
  await pool.execute(
    `INSERT INTO payments (payment_id, user_id, amount, commission, owner_amount, currency)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [paymentIntent.id, req.user.id, totalAmountCents / 100, commissionCents / 100, ownerAmountCents / 100, currency]
  );
  res.json({
    clientSecret: paymentIntent.client_secret,
    paymentId: paymentIntent.id,
    amount: totalAmountCents / 100,
    commission: commissionCents / 100,
    ownerAmount: ownerAmountCents / 100,
  });
}));

// POST /api/payments/confirm - Verify payment with Stripe, not the client
router.post('/confirm', asyncRoute(async (req, res) => {
  const { paymentIntentId } = req.body;
  if (typeof paymentIntentId !== 'string' || !paymentIntentId || paymentIntentId.length > 255) {
    return res.status(400).json({ error: 'Payment intent ID required' });
  }
  const payment = await ownPayment(paymentIntentId, req.user.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (['refunded', 'refund_pending', 'refund_failed'].includes(payment.status)) {
    return res.status(409).json({ error: 'Payment has a refund; use the refund endpoint to reconcile it' });
  }
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (intent.metadata.renterId !== String(req.user.id) ||
      intent.amount !== Math.round(payment.amount * 100) || intent.currency !== payment.currency) {
    return res.status(409).json({ error: 'Payment details do not match' });
  }
  await pool.execute(
    `UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE payment_id = ? AND user_id = ? AND status NOT IN ('refunded', 'refund_pending', 'refund_failed')`,
    [intent.status, paymentIntentId, req.user.id]
  );
  // Keep the existing payment response status while storing Stripe's canonical status.
  res.json({
    status: intent.status,
    paymentId: paymentIntentId,
    payment: { ...payment, status: intent.status === 'succeeded' ? 'completed' : intent.status },
  });
}));

// POST /api/payments/refund - Only the payer can refund their payment
router.post('/refund', asyncRoute(async (req, res) => {
  const { paymentIntentId, reason = 'requested_by_customer' } = req.body;
  if (typeof paymentIntentId !== 'string' || !paymentIntentId || paymentIntentId.length > 255 ||
      !['requested_by_customer', 'duplicate', 'fraudulent'].includes(reason)) {
    return res.status(400).json({ error: 'Payment intent ID and valid refund reason required' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Lock equipment/bookings before payments, matching booking creation's lock order.
    const [linked] = await connection.execute(
      `SELECT b.id, b.status FROM bookings b JOIN equipment e ON e.id = b.equipment_id
       WHERE b.payment_id = ? AND b.renter_id = ? FOR UPDATE`,
      [paymentIntentId, req.user.id]
    );
    const [rows] = await connection.execute(
      'SELECT status, refund_id FROM payments WHERE payment_id = ? AND user_id = ? FOR UPDATE',
      [paymentIntentId, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Payment not found' });
    const payment = rows[0];
    if (!['succeeded', 'refund_pending', 'refund_failed'].includes(payment.status) || linked[0]?.status === 'completed') {
      return res.status(409).json({ error: 'Payment cannot be refunded' });
    }
    const refund = payment.status === 'refund_pending'
      ? await stripe.refunds.retrieve(payment.refund_id)
      : await stripe.refunds.create({
        payment_intent: paymentIntentId, reason,
      }, { idempotencyKey: `refund-${paymentIntentId}-${payment.refund_id || 'initial'}` });
    const status = refund.status === 'succeeded' ? 'refunded'
      : ['failed', 'canceled'].includes(refund.status) ? 'refund_failed' : 'refund_pending';
    await connection.execute(
      'UPDATE payments SET refund_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?',
      [refund.id, status, paymentIntentId]
    );
    await connection.execute(
      "UPDATE bookings SET payment_status = ?, status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?",
      [status === 'refund_failed' ? 'paid' : status, paymentIntentId]
    );
    await connection.commit();
    res.status(status === 'refund_pending' ? 202 : 200).json({
      refundId: refund.id, status: refund.status, amount: refund.amount / 100,
    });
  } finally {
    try { await connection.rollback(); } finally { connection.release(); }
  }
}));

router.get('/:paymentId', asyncRoute(async (req, res) => {
  const payment = await ownPayment(req.params.paymentId, req.user.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  res.json({ ...payment, status: payment.status === 'succeeded' ? 'completed' : payment.status });
}));

// Mount before JSON parsing: Stripe signatures require the original request bytes.
router.webhook = asyncRoute(async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Payment webhooks are not configured' });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.get('stripe-signature'), process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }
  if (!['refund.updated', 'refund.failed'].includes(event.type)) return res.json({ received: true });
  const refund = event.data.object;
  const status = refund.status === 'succeeded' ? 'refunded'
    : ['failed', 'canceled'].includes(refund.status) ? 'refund_failed' : null;
  if (!status) return res.json({ received: true });
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `SELECT b.id FROM bookings b JOIN equipment e ON e.id = b.equipment_id
       WHERE b.payment_id = ? FOR UPDATE`, [refund.payment_intent]
    );
    const [rows] = await connection.execute(
      "SELECT amount FROM payments WHERE payment_id = ? AND refund_id = ? AND status = 'refund_pending' FOR UPDATE",
      [refund.payment_intent, refund.id]
    );
    if (rows[0] && Math.round(rows[0].amount * 100) === refund.amount) {
      await connection.execute(
        'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?',
        [status, refund.payment_intent]
      );
      await connection.execute(
        "UPDATE bookings SET payment_status = ?, status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?",
        [status === 'refund_failed' ? 'paid' : status, refund.payment_intent]
      );
    }
    await connection.commit();
    res.json({ received: true });
  } finally {
    try { await connection.rollback(); } finally { connection.release(); }
  }
});

module.exports = router;
