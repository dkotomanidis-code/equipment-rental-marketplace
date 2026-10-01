const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const mysql = require('mysql2/promise');
const authenticateToken = require('../middleware/auth');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'equipment_rental',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const PLATFORM_COMMISSION = 0.10; // 10% commission to nkotomanidi@gmail.com

// Create payment intent
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { bookingId, amount } = req.body;
    const userId = req.user.id;

    const connection = await pool.getConnection();

    // Get booking details
    const [booking] = await connection.query(
      'SELECT * FROM bookings WHERE id = ? AND renter_id = ?',
      [bookingId, userId]
    );

    if (!booking || booking.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Calculate commission (10% for nkotomanidi@gmail.com)
    const commissionAmount = amount * PLATFORM_COMMISSION;
    const ownerAmount = amount - commissionAmount;
    const amountToCharge = Math.round(amount * 100); // in cents

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountToCharge,
      currency: 'usd',
      metadata: {
        bookingId: bookingId,
        renterId: userId,
        commission: commissionAmount,
        platformEmail: 'nkotomanidi@gmail.com',
      },
    });

    connection.release();

    res.json({
      clientSecret: paymentIntent.client_secret,
      rentalAmount: amount,
      platformCommission: commissionAmount,
      platformEmail: 'nkotomanidi@gmail.com',
      ownerReceives: ownerAmount,
      total: amount,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error creating payment', error: error.message });
  }
});

// Confirm payment
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;
    const userId = req.user.id;

    const connection = await pool.getConnection();

    // Get booking
    const [booking] = await connection.query(
      'SELECT * FROM bookings WHERE id = ? AND renter_id = ?',
      [bookingId, userId]
    );

    if (!booking || booking.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Booking not found' });
    }

    const bookingData = booking[0];

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      connection.release();
      return res.status(400).json({ message: 'Payment not successful' });
    }

    // Calculate amounts
    const rentalAmount = bookingData.total_price;
    const platformCommission = rentalAmount * PLATFORM_COMMISSION; // Goes to nkotomanidi@gmail.com
    const ownerAmount = rentalAmount - platformCommission;

    // Save payment to database
    await connection.query(
      `INSERT INTO payments (payment_id, booking_id, subtotal, tax_amount, total_amount, commission, owner_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'succeeded')`,
      [
        paymentIntentId,
        bookingId,
        rentalAmount,
        0,
        rentalAmount,
        platformCommission,
        ownerAmount,
      ]
    );

    // Update booking
    await connection.query(
      'UPDATE bookings SET payment_status = ?, payment_id = ?, status = ? WHERE id = ?',
      ['paid', paymentIntentId, 'payment_confirmed', bookingId]
    );

    connection.release();

    res.json({
      message: 'Payment successful',
      bookingId: bookingId,
      rentalAmount: rentalAmount,
      platformCommission: platformCommission,
      platformEmail: 'nkotomanidi@gmail.com',
      ownerReceives: ownerAmount,
      total: rentalAmount,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error confirming payment', error: error.message });
  }
});

// Get publishable key
router.get('/publishable-key', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// Get platform email
router.get('/platform-email', (req, res) => {
  res.json({ platformEmail: 'nkotomanidi@gmail.com' });
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.sendStatus(400);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('✅ Payment succeeded for nkotomanidi@gmail.com:', event.data.object.id);
      break;
    case 'payment_intent.payment_failed':
      console.log('❌ Payment failed:', event.data.object.id);
      break;
  }

  res.json({ received: true });
});

module.exports = router;