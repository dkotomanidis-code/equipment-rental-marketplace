const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Mock payment database
const payments = [];

const PLATFORM_COMMISSION_RATE = 0.05; // 5%

// POST /api/payments/create-intent - Create Stripe payment intent
router.post('/create-intent', async (req, res) => {
  try {
    const { bookingId, amount, currency = 'usd' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const totalAmountCents = Math.round(amount * 100); // Convert to cents
    const commissionCents = Math.round(totalAmountCents * PLATFORM_COMMISSION_RATE);
    const ownerAmountCents = totalAmountCents - commissionCents;

    const metadata = {
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

    // Store payment record
    const payment = {
      paymentId: paymentIntent.id,
      bookingId: bookingId || null,
      amount: totalAmountCents / 100,
      commission: commissionCents / 100,
      ownerAmount: ownerAmountCents / 100,
      currency,
      status: 'pending',
      createdAt: new Date(),
    };
    payments.push(payment);

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
router.post('/confirm', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const payment = payments.find((p) => p.paymentId === paymentIntentId);
    if (payment) {
      payment.status = paymentIntent.status === 'succeeded' ? 'completed' : paymentIntent.status;
      payment.updatedAt = new Date();
    }

    res.json({
      status: paymentIntent.status,
      paymentId: paymentIntentId,
      payment: payment || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments/refund - Refund a payment
router.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId, reason = 'requested_by_customer' } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason,
    });

    const payment = payments.find((p) => p.paymentId === paymentIntentId);
    if (payment) {
      payment.status = 'refunded';
      payment.updatedAt = new Date();
    }

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
router.get('/:paymentId', (req, res) => {
  const payment = payments.find((p) => p.paymentId === req.params.paymentId);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json(payment);
});

module.exports = router;
