const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const bookingsRoutes = require('./routes/bookings');
const paymentsRoutes = require('./routes/payments');
const reviewsRoutes = require('./routes/reviews');
const agreementsRoutes = require('./routes/agreements');
const notificationsRoutes = require('./routes/notifications');
const remindersRoutes = require('./routes/reminders');
const taxRoutes = require('./routes/tax');
const stripeRoutes = require('./routes/stripe');
const aiSupportRoutes = require('./routes/ai-support');
const dashboardStatsRoutes = require('./routes/dashboard-stats');

app.use('/api/auth', authRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/agreements', agreementsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reminders', remindersRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/ai-support', aiSupportRoutes);
app.use('/api/dashboard-stats', dashboardStatsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'Server is running', platformEmail: 'nkotomanidi@gmail.com' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error: ' + err.message });
});

// Scheduled Tasks - Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('Running scheduled notification tasks...');
  
  try {
    // Process due reminders
    await fetch('http://localhost:5000/api/reminders/process-due', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    // Send pickup reminders
    await fetch('http://localhost:5000/api/notifications/pickup-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    // Send return reminders
    await fetch('http://localhost:5000/api/notifications/return-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('Scheduled tasks completed successfully');
  } catch (error) {
    console.error('Error in scheduled tasks:', error);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📧 Platform email: nkotomanidi@gmail.com`);
  console.log(`💳 Stripe Keys Loaded`);
  console.log(`🔔 Notifications & Reminders System Active`);
  console.log(`🤖 AI Support System Active`);
  console.log(`📊 Dashboard Stats System Active`);
});