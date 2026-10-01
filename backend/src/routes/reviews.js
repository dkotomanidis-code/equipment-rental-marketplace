const express = require('express');
const router = express.Router();

// Mock database (replace with actual DB)
const reviews = [];
let reviewIdCounter = 1;

// Middleware to verify token
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    req.userId = decoded.id || 1;
  } catch {
    req.userId = 1;
  }
  next();
};

// GET all reviews for equipment
router.get('/equipment/:equipmentId', (req, res) => {
  try {
    const equipmentId = parseInt(req.params.equipmentId);
    const equipmentReviews = reviews.filter(r => r.equipmentId === equipmentId);
    
    const avgRating = equipmentReviews.length > 0
      ? (equipmentReviews.reduce((sum, r) => sum + r.rating, 0) / equipmentReviews.length).toFixed(1)
      : 0;

    res.json({
      reviews: equipmentReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      averageRating: parseFloat(avgRating),
      totalReviews: equipmentReviews.length,
      ratingBreakdown: {
        5: equipmentReviews.filter(r => r.rating === 5).length,
        4: equipmentReviews.filter(r => r.rating === 4).length,
        3: equipmentReviews.filter(r => r.rating === 3).length,
        2: equipmentReviews.filter(r => r.rating === 2).length,
        1: equipmentReviews.filter(r => r.rating === 1).length,
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews: ' + err.message });
  }
});

// GET reviews for a user (owner rating)
router.get('/user/:userId', (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userReviews = reviews.filter(r => r.reviewedUserId === userId);
    
    const avgRating = userReviews.length > 0
      ? (userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length).toFixed(1)
      : 0;

    res.json({
      reviews: userReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      averageRating: parseFloat(avgRating),
      totalReviews: userReviews.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user reviews: ' + err.message });
  }
});

// GET user's own reviews (reviews they left)
router.get('/my-reviews', authMiddleware, (req, res) => {
  try {
    const myReviews = reviews.filter(r => r.reviewerId === req.userId);
    res.json(myReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching reviews: ' + err.message });
  }
});

// CREATE a new review (authenticated)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { bookingId, reviewedUserId, equipmentId, rating, title, comment, reviewType } = req.body;

    // Validate required fields
    if (!bookingId || !reviewedUserId || !equipmentId || !rating || !comment) {
      return res.status(400).json({
        message: 'Missing required fields: bookingId, reviewedUserId, equipmentId, rating, comment'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const newReview = {
      id: reviewIdCounter++,
      bookingId,
      reviewerId: req.userId,
      reviewedUserId,
      equipmentId,
      rating: parseInt(rating),
      title: title || '',
      comment,
      reviewType: reviewType || 'equipment',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reviews.push(newReview);

    res.status(201).json({
      message: 'Review created successfully',
      review: newReview,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error creating review: ' + err.message });
  }
});

// UPDATE a review (authenticated, reviewer only)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const review = reviews.find(r => r.id === parseInt(req.params.id));

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.reviewerId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to update this review' });
    }

    const { rating, title, comment } = req.body;

    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (rating) review.rating = parseInt(rating);
    if (title) review.title = title;
    if (comment) review.comment = comment;
    review.updatedAt = new Date().toISOString();

    res.json({
      message: 'Review updated successfully',
      review,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error updating review: ' + err.message });
  }
});

// DELETE a review (authenticated, reviewer only)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const index = reviews.findIndex(r => r.id === parseInt(req.params.id));

    if (index === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (reviews[index].reviewerId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this review' });
    }

    const deleted = reviews.splice(index, 1);

    res.json({
      message: 'Review deleted successfully',
      review: deleted[0],
    });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting review: ' + err.message });
  }
});

module.exports = router;