const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { users, bookings, equipment } = require('../database/store');
const authenticateToken = require('../middleware/auth');

const earningsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/users/:userId/earnings - Get owner's total earnings from rentals
router.get('/:userId/earnings', earningsLimiter, authenticateToken, (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (req.user.id !== userId) {
    return res.status(403).json({ error: 'You can only view your own earnings' });
  }

  // Find all equipment owned by this user
  const ownerEquipmentIds = equipment
    .filter((e) => e.ownerId === userId)
    .map((e) => e.id);

  // Find all confirmed/paid bookings for that equipment
  const ownerBookings = bookings.filter(
    (b) => ownerEquipmentIds.includes(b.equipmentId) && b.paymentStatus === 'paid'
  );

  const grossTotal = ownerBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const commission = grossTotal * 0.05;
  const netEarnings = grossTotal - commission;

  res.json({
    grossTotal: parseFloat(grossTotal.toFixed(2)),
    commission: parseFloat(commission.toFixed(2)),
    netEarnings: parseFloat(netEarnings.toFixed(2)),
    bookingCount: ownerBookings.length,
  });
});

module.exports = router;
