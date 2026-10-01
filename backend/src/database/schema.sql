CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  profile_picture VARCHAR(255),
  bio TEXT,
  is_renter BOOLEAN DEFAULT TRUE,
  is_owner BOOLEAN DEFAULT FALSE,
  verification_status VARCHAR(50) DEFAULT 'unverified',
  id_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  id_document_url VARCHAR(255),
  verification_date TIMESTAMP NULL,
  trust_score INT DEFAULT 0,
  total_rentals INT DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price_per_day DECIMAL(10,2),
  min_price_per_day DECIMAL(10,2),
  max_price_per_day DECIMAL(10,2),
  price DECIMAL(10,2),
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  for_sale BOOLEAN DEFAULT FALSE,
  location VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  image_url VARCHAR(255),
  availability_status BOOLEAN DEFAULT TRUE,
  year INT,
  model VARCHAR(255),
  manufacturer VARCHAR(255),
  `condition` VARCHAR(50),
  features TEXT,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_equipment_owner
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_id VARCHAR(255) UNIQUE NOT NULL,
  booking_id INT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,
  owner_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'usd',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  renter_id INT NOT NULL,
  equipment_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'unpaid',
  payment_id VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_renter
    FOREIGN KEY (renter_id) REFERENCES users(id),
  CONSTRAINT fk_bookings_equipment
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  reviewed_user_id INT NOT NULL,
  equipment_id INT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  review_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_reviews_reviewer
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
  CONSTRAINT fk_reviews_reviewed_user
    FOREIGN KEY (reviewed_user_id) REFERENCES users(id),
  CONSTRAINT fk_reviews_equipment
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

CREATE TABLE verification_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  verification_type VARCHAR(50),
  status VARCHAR(50),
  document_url VARCHAR(255),
  verified_at TIMESTAMP NULL,
  verified_by INT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_verification_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE trust_badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  badge_type VARCHAR(50),
  badge_name VARCHAR(100),
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_trust_badges_user
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE rental_agreements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  renter_id INT NOT NULL,
  owner_id INT NOT NULL,
  equipment_id INT NOT NULL,
  signature_image LONGTEXT NOT NULL,
  agreed_to_terms BOOLEAN DEFAULT TRUE,
  signed_at TIMESTAMP NOT NULL,
  agreement_document LONGTEXT,
  status VARCHAR(50) DEFAULT 'signed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rental_agreements_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_rental_agreements_renter
    FOREIGN KEY (renter_id) REFERENCES users(id),
  CONSTRAINT fk_rental_agreements_owner
    FOREIGN KEY (owner_id) REFERENCES users(id),
  CONSTRAINT fk_rental_agreements_equipment
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  booking_id INT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_sender
    FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_messages_receiver
    FOREIGN KEY (receiver_id) REFERENCES users(id),
  CONSTRAINT fk_messages_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  booking_id INT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  email_sent BOOLEAN DEFAULT FALSE,
  sms_sent BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_notifications_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

CREATE TABLE tax_terms_acceptance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  equipment_id INT NOT NULL,
  tax_rate DECIMAL(10,4) DEFAULT 0.005,
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMP NULL,
  terms_version VARCHAR(50) DEFAULT '1.0',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tax_terms_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_tax_terms_equipment
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

CREATE TABLE user_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  equipment_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_favorites_user
    FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_favorites_equipment
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
  UNIQUE KEY unique_favorite (user_id, equipment_id)
);

CREATE TABLE user_earnings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  booking_id INT NOT NULL,
  equipment_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  rental_start_date DATE,
  rental_end_date DATE,
  days_rented INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_earnings_owner
    FOREIGN KEY (owner_id) REFERENCES users(id),
  CONSTRAINT fk_user_earnings_booking
    FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_user_earnings_equipment
    FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

CREATE INDEX idx_equipment_owner_id
  ON equipment(owner_id);

CREATE INDEX idx_bookings_renter_id
  ON bookings(renter_id);

CREATE INDEX idx_bookings_equipment_id
  ON bookings(equipment_id);

CREATE INDEX idx_bookings_payment_id
  ON bookings(payment_id);

CREATE INDEX idx_payments_booking_id
  ON payments(booking_id);

CREATE INDEX idx_reviews_booking_id
  ON reviews(booking_id);

CREATE INDEX idx_reviews_reviewer_id
  ON reviews(reviewer_id);

CREATE INDEX idx_reviews_reviewed_user_id
  ON reviews(reviewed_user_id);

CREATE INDEX idx_reviews_equipment_id
  ON reviews(equipment_id);

CREATE INDEX idx_equipment_category
  ON equipment(category);

CREATE INDEX idx_bookings_status
  ON bookings(status);

CREATE INDEX idx_payments_status
  ON payments(status);

CREATE INDEX idx_verification_logs_user_id
  ON verification_logs(user_id);

CREATE INDEX idx_trust_badges_user_id
  ON trust_badges(user_id);

CREATE INDEX idx_users_verification_status
  ON users(verification_status);

CREATE INDEX idx_rental_agreements_booking_id
  ON rental_agreements(booking_id);

CREATE INDEX idx_rental_agreements_renter_id
  ON rental_agreements(renter_id);

CREATE INDEX idx_rental_agreements_owner_id
  ON rental_agreements(owner_id);

CREATE INDEX idx_messages_sender_id
  ON messages(sender_id);

CREATE INDEX idx_messages_receiver_id
  ON messages(receiver_id);

CREATE INDEX idx_messages_booking_id
  ON messages(booking_id);

CREATE INDEX idx_notifications_user_id
  ON notifications(user_id);

CREATE INDEX idx_notifications_booking_id
  ON notifications(booking_id);

CREATE INDEX idx_notifications_type
  ON notifications(type);

CREATE INDEX idx_tax_terms_user_id
  ON tax_terms_acceptance(user_id);

CREATE INDEX idx_tax_terms_equipment_id
  ON tax_terms_acceptance(equipment_id);

CREATE INDEX idx_user_favorites_user_id
  ON user_favorites(user_id);

CREATE INDEX idx_user_favorites_equipment_id
  ON user_favorites(equipment_id);

CREATE INDEX idx_user_earnings_owner_id
  ON user_earnings(owner_id);

CREATE INDEX idx_user_earnings_booking_id
  ON user_earnings(booking_id);

CREATE INDEX idx_user_earnings_status
  ON user_earnings(status);