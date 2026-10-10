const express = require('express');
const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const pool = require('../database/pool');
const { authenticate } = require('../middleware/auth');
const { asyncRoute, priceCents } = require('../utils/api');
const { randomUUID } = require('crypto');
const { reconcileRefund } = require('../utils/refunds');

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
  let operation;
  try {
    await connection.beginTransaction();
    // Lock equipment/bookings before payments, matching booking creation's lock order.
    const [linked] = await connection.execute(
      `SELECT b.id, b.status FROM bookings b JOIN equipment e ON e.id = b.equipment_id
       WHERE b.payment_id = ? AND b.renter_id = ? FOR UPDATE`,
      [paymentIntentId, req.user.id]
    );
    const [rows] = await connection.execute(
      `SELECT status, refund_id, refund_key, refund_reason,
       TIMESTAMPDIFF(SECOND, refund_requested_at, CURRENT_TIMESTAMP) AS refund_age
       FROM payments WHERE payment_id = ? AND user_id = ? FOR UPDATE`,
      [paymentIntentId, req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Payment not found' });
    const payment = rows[0];
    if (!['succeeded', 'refund_pending', 'refund_failed'].includes(payment.status) || linked[0]?.status === 'completed') {
      return res.status(409).json({ error: 'Payment cannot be refunded' });
    }
    operation = payment;
    if (payment.status !== 'refund_pending') {
      operation = { refund_id: null, refund_key: randomUUID(), refund_reason: reason, refund_age: 0 };
      await connection.execute(
        `UPDATE payments SET status = 'refund_pending', refund_id = NULL, refund_key = ?,
         refund_reason = ?, refund_requested_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE payment_id = ?`, [operation.refund_key, reason, paymentIntentId]
      );
      await connection.execute(
        "UPDATE bookings SET payment_status = 'refund_pending', updated_at = CURRENT_TIMESTAMP WHERE payment_id = ?",
        [paymentIntentId]
      );
    }
    // Commit a non-spendable operation before any external side effect.
    await connection.commit();
  } finally {
    try { await connection.rollback(); } finally { connection.release(); }
  }
  let refund;
  if (operation.refund_id) {
    refund = await stripe.refunds.retrieve(operation.refund_id);
  } else {
    // Recover accepted requests even after Stripe's idempotency cache expires.
    for await (const candidate of stripe.refunds.list({ payment_intent: paymentIntentId, limit: 100 })) {
      if (operation.refund_key && candidate.metadata?.refundKey === operation.refund_key) {
        refund = candidate;
        break;
      }
    }
    if (!refund) {
      if (!operation.refund_key || operation.refund_age >= 23 * 3600) {
        return res.status(409).json({ error: 'Refund outcome requires reconciliation; payment remains blocked' });
      }
      refund = await stripe.refunds.create({
        payment_intent: paymentIntentId, reason: operation.refund_reason,
        metadata: { refundKey: operation.refund_key },
      }, { idempotencyKey: operation.refund_key });
    }
  }
  const status = await reconcileRefund(refund);
  res.status(status === 'refund_pending' ? 202 : 200).json({
    refundId: refund.id, status: refund.status, amount: refund.amount / 100,
  });
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
  await reconcileRefund(refund);
  res.json({ received: true });
});

module.exports = router;
