const express = require('express');
const router = express.Router();

// Mock database
const notifications = [];
const notificationPreferences = {};

// GET /api/notifications - Get user's notifications
router.get('/', (req, res) => {
  const userId = req.user?.id || 1;
  const userNotifications = notifications.filter((n) => n.userId === userId);
  
  // Sort by created_at descending (newest first)
  userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(userNotifications);
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', (req, res) => {
  const userId = req.user?.id || 1;
  const unreadCount = notifications.filter(
    (n) => n.userId === userId && !n.isRead
  ).length;
  
  res.json({ unreadCount });
});

// POST /api/notifications - Create a new notification
router.post('/', (req, res) => {
  const { userId, type, title, message, relatedBookingId, relatedEquipmentId } = req.body;

  if (!userId || !type || !title || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const notification = {
    id: Date.now(),
    userId,
    type,
    title,
    message,
    relatedBookingId: relatedBookingId || null,
    relatedEquipmentId: relatedEquipmentId || null,
    isRead: false,
    emailSent: false,
    smsSent: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  notifications.push(notification);
  res.status(201).json(notification);
});

// PUT /api/notifications/:id - Mark notification as read
router.put('/:id', (req, res) => {
  const notification = notifications.find((n) => n.id == req.params.id);
  
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notification.isRead = true;
  notification.updatedAt = new Date();
  res.json(notification);
});

// POST /api/notifications/:id/mark-read - Mark as read
router.post('/:id/mark-read', (req, res) => {
  const notification = notifications.find((n) => n.id == req.params.id);
  
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  notification.isRead = true;
  notification.updatedAt = new Date();
  res.json(notification);
});

// POST /api/notifications/mark-all-read - Mark all as read
router.post('/mark-all-read', (req, res) => {
  const userId = req.user?.id || 1;
  const userNotifications = notifications.filter((n) => n.userId === userId && !n.isRead);
  
  userNotifications.forEach((n) => {
    n.isRead = true;
    n.updatedAt = new Date();
  });
  
  res.json({ markedCount: userNotifications.length });
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', (req, res) => {
  const index = notifications.findIndex((n) => n.id == req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  const deleted = notifications.splice(index, 1);
  res.json(deleted[0]);
});

// GET /api/notifications/preferences - Get user's notification preferences
router.get('/preferences', (req, res) => {
  const userId = req.user?.id || 1;
  
  if (!notificationPreferences[userId]) {
    notificationPreferences[userId] = {
      userId,
      bookingReminders: true,
      bookingStartHoursBefore: 24,
      bookingEndHoursBefore: 12,
      reviewNotifications: true,
      messageNotifications: true,
      paymentNotifications: true,
      emailEnabled: false,
      smsEnabled: false,
      phoneNumber: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  res.json(notificationPreferences[userId]);
});

// POST /api/notifications/preferences - Update notification preferences
router.post('/preferences', (req, res) => {
  const userId = req.user?.id || 1;
  const prefs = req.body;

  notificationPreferences[userId] = {
    ...notificationPreferences[userId],
    ...prefs,
    userId,
    updatedAt: new Date(),
  };

  res.json(notificationPreferences[userId]);
});

// POST /api/notifications/pickup-reminder - Scheduled task for pickup reminders
router.post('/pickup-reminder', async (req, res) => {
  try {
    console.log('Running pickup reminder task...');
    res.json({ message: 'Pickup reminder task completed', sentCount: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/return-reminder - Scheduled task for return reminders
router.post('/return-reminder', async (req, res) => {
  try {
    console.log('Running return reminder task...');
    res.json({ message: 'Return reminder task completed', sentCount: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;