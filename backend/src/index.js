const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const dotenv = require('dotenv');
dotenv.config();

const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payments');

const app = express();

// Middleware
app.use(cors());
const rateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
};
app.use('/api', rateLimit({ ...rateLimitOptions, limit: 300 }));
app.use('/api/auth', rateLimit({ ...rateLimitOptions, limit: 20 }));
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentRoutes.webhook);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' });
  }
  if (['ER_ROW_IS_REFERENCED_2', 'ER_NO_REFERENCED_ROW_2', 'ER_DUP_ENTRY'].includes(err.code)) {
    return res.status(409).json({ error: 'Operation conflicts with existing records' });
  }
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
