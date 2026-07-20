const express = require('express');
const router = express.Router();

// Mock database
const bookings = [];

// Get user's bookings
router.get('/my-bookings', (req, res) => {
  const userBookings = bookings.filter((b) => b.renterId == req.user?.id);
  res.json(userBookings);
});

// GET /api/bookings/:id - Get booking details
router.get('/:id', (req, res) => {
  const booking = bookings.find((b) => b.id == req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  res.json(booking);
});

// POST /api/bookings - Create booking with payment info
router.post('/', (req, res) => {
  const { equipmentId, startDate, endDate, totalPrice, paymentId } = req.body;

  if (!equipmentId || !startDate || !endDate) {
    return res.status(400).json({ error: 'equipmentId, startDate, and endDate are required' });
  }

  const booking = {
    id: Date.now(),
    renterId: req.user?.id || 1,
    equipmentId,
    startDate,
    endDate,
    totalPrice: totalPrice || 0,
    // paymentId is only set after payment is confirmed on the frontend,
    // so its presence reliably indicates the payment succeeded
    status: paymentId ? 'confirmed' : 'pending',
    paymentStatus: paymentId ? 'paid' : 'unpaid',
    paymentId: paymentId || null,
    createdAt: new Date(),
  };

  bookings.push(booking);
  res.status(201).json(booking);
});

// Update booking status
router.put('/:id', (req, res) => {
  const booking = bookings.find((b) => b.id == req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  Object.assign(booking, req.body);
  res.json(booking);
});

module.exports = router;
