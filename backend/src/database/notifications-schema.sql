-- Create reminders table for upcoming bookings/returns
CREATE TABLE reminders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  equipment_id INTEGER NOT NULL REFERENCES equipment(id),
  reminder_type VARCHAR(50) NOT NULL,
  reminder_time TIMESTAMP NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  notification_method VARCHAR(50) DEFAULT 'in_app',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_booking_id (booking_id),
  INDEX idx_reminder_time (reminder_time),
  INDEX idx_is_sent (is_sent)
);

-- Create notification preferences table
CREATE TABLE notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  booking_reminders BOOLEAN DEFAULT TRUE,
  booking_start_hours_before INTEGER DEFAULT 24,
  booking_end_hours_before INTEGER DEFAULT 12,
  review_notifications BOOLEAN DEFAULT TRUE,
  message_notifications BOOLEAN DEFAULT TRUE,
  payment_notifications BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT FALSE,
  sms_enabled BOOLEAN DEFAULT FALSE,
  phone_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for notifications table
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_booking_id ON notifications(booking_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);