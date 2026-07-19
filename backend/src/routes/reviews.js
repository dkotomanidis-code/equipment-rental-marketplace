const express = require('express');
const router = express.Router();

// Mock database
const reviews = [];

// Get reviews for equipment
router.get('/equipment/:equipmentId', (req, res) => {
  const equipmentReviews = reviews.filter((r) => r.equipmentId == req.params.equipmentId);
  res.json(equipmentReviews);
});

// Create review
router.post('/', (req, res) => {
  const { bookingId, equipmentId, rating, comment } = req.body;

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const review = {
    id: Date.now(),
    bookingId,
    equipmentId,
    reviewerId: req.user?.id || 1,
    rating,
    comment,
    createdAt: new Date(),
  };

  reviews.push(review);
  res.status(201).json(review);
});

module.exports = router;
