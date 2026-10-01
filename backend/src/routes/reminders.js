const express = require('express');
const router = express.Router();

// Mock database
const reminders = [];

// GET /api/reminders - Get user's reminders
router.get('/', (req, res) => {
  const userId = req.user?.id || 1;
  const userReminders = reminders.filter((r) => r.userId === userId);
  
  // Sort by reminder_time ascending (earliest first)
  userReminders.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
  
  res.json(userReminders);
});

// GET /api/reminders/upcoming - Get upcoming reminders (not yet sent)
router.get('/upcoming', (req, res) => {
  const userId = req.user?.id || 1;
  const now = new Date();
  
  const upcomingReminders = reminders.filter(
    (r) => r.userId === userId && 
           !r.isSent && 
           new Date(r.reminderTime) > now
  );
  
  upcomingReminders.sort((a, b) => new Date(a.reminderTime) - new Date(b.reminderTime));
  
  res.json(upcomingReminders);
});

// POST /api/reminders - Create a new reminder
router.post('/', (req, res) => {
  const { userId, bookingId, equipmentId, reminderType, reminderTime, notificationMethod = 'in_app' } = req.body;

  if (!userId || !bookingId || !reminderType || !reminderTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const reminder = {
    id: Date.now(),
    userId,
    bookingId,
    equipmentId: equipmentId || null,
    reminderType,
    reminderTime: new Date(reminderTime),
    isSent: false,
    sentAt: null,
    notificationMethod,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  reminders.push(reminder);
  res.status(201).json(reminder);
});

// PUT /api/reminders/:id - Mark reminder as sent
router.put('/:id', (req, res) => {
  const reminder = reminders.find((r) => r.id == req.params.id);
  
  if (!reminder) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  reminder.isSent = true;
  reminder.sentAt = new Date();
  reminder.updatedAt = new Date();
  res.json(reminder);
});

// POST /api/reminders/:id/mark-sent - Mark reminder as sent
router.post('/:id/mark-sent', (req, res) => {
  const reminder = reminders.find((r) => r.id == req.params.id);
  
  if (!reminder) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  reminder.isSent = true;
  reminder.sentAt = new Date();
  reminder.updatedAt = new Date();
  res.json(reminder);
});

// DELETE /api/reminders/:id - Delete reminder
router.delete('/:id', (req, res) => {
  const index = reminders.findIndex((r) => r.id == req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  const deleted = reminders.splice(index, 1);
  res.json(deleted[0]);
});

// POST /api/reminders/process-due - Process due reminders (scheduled task)
router.post('/process-due', async (req, res) => {
  try {
    const now = new Date();
    const dueReminders = reminders.filter(
      (r) => !r.isSent && new Date(r.reminderTime) <= now
    );

    dueReminders.forEach((r) => {
      r.isSent = true;
      r.sentAt = new Date();
      r.updatedAt = new Date();
    });

    console.log(`Processed ${dueReminders.length} due reminders`);
    res.json({ processedCount: dueReminders.length, reminders: dueReminders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;