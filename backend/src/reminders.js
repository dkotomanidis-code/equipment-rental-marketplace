const express = require('express');
const router = express.Router();

// Mock database
const bookings = [];

// GET /api/bookings/:id - Get booking details
router.get('/:id', (req, res) => {
  const booking = bookings.find((b) => b.id == req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }
  res.json(booking);
});

// GET /api/bookings/my-bookings - Get user's bookings
router.get('/my-bookings', (req, res) => {
  const userBookings = bookings.filter((b) => b.renterId == req.user?.id);
  res.json(userBookings);
});

// POST /api/bookings - Create booking with payment info
router.post('/', async (req, res) => {
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
    status: paymentId ? 'confirmed' : 'pending',
    paymentStatus: paymentId ? 'paid' : 'unpaid',
    paymentId: paymentId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  bookings.push(booking);

  // ✅ TRIGGER NOTIFICATIONS
  try {
    // Create booking confirmation notification
    await fetch(`${process.env.API_URL || 'http://localhost:5000'}/api/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: booking.renterId,
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: `Your booking for equipment has been confirmed for ${startDate} to ${endDate}`,
        relatedBookingId: booking.id,
        relatedEquipmentId: equipmentId,
      }),
    });

    // Create reminders for booking start and end
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    // Reminder 24 hours before booking start
    const reminderStart = new Date(startDateObj.getTime() - 24 * 60 * 60 * 1000);
    await fetch(`${process.env.API_URL || 'http://localhost:5000'}/api/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: booking.renterId,
        bookingId: booking.id,
        equipmentId,
        reminderType: 'booking_start',
        reminderTime: reminderStart,
        notificationMethod: 'in_app',
      }),
    });

    // Reminder 12 hours before booking end
    const reminderEnd = new Date(endDateObj.getTime() - 12 * 60 * 60 * 1000);
    await fetch(`${process.env.API_URL || 'http://localhost:5000'}/api/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: booking.renterId,
        bookingId: booking.id,
        equipmentId,
        reminderType: 'booking_end',
        reminderTime: reminderEnd,
        notificationMethod: 'in_app',
      }),
    });

    console.log(`Booking ${booking.id} created with notifications and reminders`);
  } catch (error) {
    console.error('Error creating notifications/reminders:', error);
  }

  res.status(201).json(booking);
});

// PUT /api/bookings/:id - Update booking status
router.put('/:id', (req, res) => {
  const booking = bookings.find((b) => b.id == req.params.id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  Object.assign(booking, req.body);
  res.json(booking);
});

module.exports = router;