const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const authenticateToken = require('../middleware/auth');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'equipment_rental',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Sign rental agreement
router.post('/sign', authenticateToken, async (req, res) => {
  try {
    const { bookingId, signature, agreedToTerms, signedAt } = req.body;
    const userId = req.user.id;

    const connection = await pool.getConnection();

    // Get booking details
    const [booking] = await connection.query(
      'SELECT * FROM bookings WHERE id = ? AND renter_id = ?',
      [bookingId, userId]
    );

    if (!booking || booking.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Booking not found' });
    }

    const bookingData = booking[0];

    // Get equipment and owner details
    const [equipment] = await connection.query(
      'SELECT * FROM equipment WHERE id = ?',
      [bookingData.equipment_id]
    );

    const [owner] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [equipment[0].owner_id]
    );

    const [renter] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    // Save agreement to database
    await connection.query(
      `INSERT INTO rental_agreements 
       (booking_id, renter_id, owner_id, equipment_id, signature_image, agreed_to_terms, signed_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'signed')`,
      [
        bookingId,
        userId,
        equipment[0].owner_id,
        bookingData.equipment_id,
        signature,
        agreedToTerms,
        new Date(signedAt),
      ]
    );

    // Update booking status
    await connection.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      ['agreement_signed', bookingId]
    );

    connection.release();

    // Send email to renter
    const renterMailOptions = {
      from: process.env.EMAIL_USER,
      to: renter[0].email,
      subject: 'Equipment Rental Agreement Signed ✓',
      html: `
        <h2>Agreement Confirmed</h2>
        <p>Dear ${renter[0].first_name},</p>
        <p>Your rental agreement for <strong>${equipment[0].name}</strong> has been successfully signed.</p>
        <p><strong>Rental Details:</strong></p>
        <ul>
          <li>Equipment: ${equipment[0].name}</li>
          <li>Start Date: ${bookingData.start_date}</li>
          <li>End Date: ${bookingData.end_date}</li>
          <li>Total Price: $${bookingData.total_price}</li>
        </ul>
        <p>Please ensure you read and understand all terms and conditions. You are now liable for any damage to the equipment during the rental period.</p>
        <p>Best regards,<br/>Equipment Rental & Buy Team</p>
      `,
    };

    // Send email to owner
    const ownerMailOptions = {
      from: process.env.EMAIL_USER,
      to: owner[0].email,
      subject: 'Rental Agreement Signed - Equipment Ready for Pickup',
      html: `
        <h2>Agreement Signed</h2>
        <p>Dear ${owner[0].first_name},</p>
        <p>The rental agreement for your <strong>${equipment[0].name}</strong> has been signed by the renter.</p>
        <p><strong>Renter Details:</strong></p>
        <ul>
          <li>Name: ${renter[0].first_name} ${renter[0].last_name}</li>
          <li>Email: ${renter[0].email}</li>
          <li>Phone: ${renter[0].phone || 'N/A'}</li>
        </ul>
        <p><strong>Rental Period:</strong></p>
        <ul>
          <li>Start Date: ${bookingData.start_date}</li>
          <li>End Date: ${bookingData.end_date}</li>
          <li>Total Payment: $${bookingData.total_price}</li>
        </ul>
        <p>The equipment is now ready for pickup. Please coordinate with the renter.</p>
        <p>Best regards,<br/>Equipment Rental & Buy Team</p>
      `,
    };

    transporter.sendMail(renterMailOptions, (error) => {
      if (error) console.error('Error sending renter email:', error);
    });

    transporter.sendMail(ownerMailOptions, (error) => {
      if (error) console.error('Error sending owner email:', error);
    });

    res.status(201).json({ 
      message: 'Agreement signed successfully',
      agreementId: null,
    });
  } catch (error) {
    console.error('Error signing agreement:', error);
    res.status(500).json({ message: 'Error signing agreement', error: error.message });
  }
});

// Get user's agreement history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const connection = await pool.getConnection();

    const [agreements] = await connection.query(
      `SELECT ra.*, b.start_date, b.end_date, b.total_price, 
              e.name as equipment_name, e.image_url,
              u.first_name, u.last_name
       FROM rental_agreements ra
       JOIN bookings b ON ra.booking_id = b.id
       JOIN equipment e ON ra.equipment_id = e.id
       JOIN users u ON ra.owner_id = u.id
       WHERE ra.renter_id = ?
       ORDER BY ra.signed_at DESC`,
      [userId]
    );

    connection.release();

    res.json(agreements);
  } catch (error) {
    console.error('Error fetching agreement history:', error);
    res.status(500).json({ message: 'Error fetching agreement history', error: error.message });
  }
});

// Get agreement by booking ID
router.get('/booking/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    const connection = await pool.getConnection();

    const [agreement] = await connection.query(
      `SELECT ra.*, b.start_date, b.end_date, b.total_price, 
              e.name as equipment_name, e.image_url,
              u.first_name, u.last_name, u.email, u.phone
       FROM rental_agreements ra
       JOIN bookings b ON ra.booking_id = b.id
       JOIN equipment e ON ra.equipment_id = e.id
       JOIN users u ON ra.owner_id = u.id
       WHERE ra.booking_id = ? AND (ra.renter_id = ? OR ra.owner_id = ?)`,
      [bookingId, userId, userId]
    );

    connection.release();

    if (!agreement || agreement.length === 0) {
      return res.status(404).json({ message: 'Agreement not found' });
    }

    res.json(agreement[0]);
  } catch (error) {
    console.error('Error fetching agreement:', error);
    res.status(500).json({ message: 'Error fetching agreement', error: error.message });
  }
});

// Check if agreement exists for booking
router.get('/check/:bookingId', authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const connection = await pool.getConnection();

    const [agreement] = await connection.query(
      'SELECT id FROM rental_agreements WHERE booking_id = ?',
      [bookingId]
    );

    connection.release();

    res.json({ 
      exists: agreement.length > 0,
      agreementId: agreement.length > 0 ? agreement[0].id : null 
    });
  } catch (error) {
    console.error('Error checking agreement:', error);
    res.status(500).json({ message: 'Error checking agreement', error: error.message });
  }
});

module.exports = router;