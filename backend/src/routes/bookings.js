const express = require('express');
const router = express.Router();

// Mock database
const bookings = [];

// Get user's bookings
router.get('/my-bookings', (req, res) => {
  const userBookings = bookings.filter((b) => b.renterId == req.user?.id);
  res.json(userBookings);
});

// Create booking
router.post('/', (req, res) => {
  const { equipmentId, startDate, endDate } = req.body;

  const booking = {
    id: Date.now(),
    renterId: req.user?.id || 1,
    equipmentId,
    startDate,
    endDate,
    totalPrice: 0,
    status: 'pending',
    paymentStatus: 'unpaid',
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
