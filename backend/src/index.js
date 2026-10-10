const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const paymentRoutes = require('./routes/payments');
const recoveryRoutes = require('./routes/recovery');
const favoriteRoutes = require('./routes/favorites');
const chatRoutes = require('./routes/chat');
const notificationRoutes = require('./routes/notifications');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || (
  process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000,http://127.0.0.1:3000'
)).split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.includes(origin));
  },
}));

if (process.env.TRUST_PROXY_HOPS !== undefined) {
  if (!/^[1-9]\d*$/.test(process.env.TRUST_PROXY_HOPS) ||
      Number(process.env.TRUST_PROXY_HOPS) > 10) {
    throw new Error('TRUST_PROXY_HOPS must be an integer from 1 to 10');
  }
  app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS));
}

const rateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later',
  },
};

app.use(
  '/api',
  rateLimit({
    ...rateLimitOptions,
    limit: 300,
  })
);

app.use(
  '/api/auth',
  rateLimit({
    ...rateLimitOptions,
    limit: 20,
  })
);

app.use(
  '/api/recovery',
  rateLimit({
    ...rateLimitOptions,
    limit: 20,
  })
);

// Stripe webhook verification requires the original request body.
// Keep this route before express.json().
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentRoutes.webhook
);

app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'API is running',
  });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(err.stack || err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request body is too large',
    });
  }

  if (
    [
      'ER_ROW_IS_REFERENCED_2',
      'ER_NO_REFERENCED_ROW_2',
      'ER_DUP_ENTRY',
    ].includes(err.code)
  ) {
    return res.status(409).json({
      error: 'Operation conflicts with existing records',
    });
  }

  return res.status(500).json({
    error: 'Something went wrong!',
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;