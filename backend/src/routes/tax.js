const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
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

const TAX_RATE = 0.005; // 0.5%

// Get tax terms
router.get('/terms', (req, res) => {
  res.json({
    tax_rate: TAX_RATE,
    tax_percentage: (TAX_RATE * 100).toFixed(2),
    description: 'A 0.5% platform tax is applied to all equipment rentals.',
    terms: [
      '0.5% tax is calculated on the rental subtotal',
      'Tax is collected at the time of booking payment',
      'Tax is shown separately in the payment breakdown',
      'You must accept these terms before listing equipment',
      'The tax helps fund platform maintenance and support',
      'Tax is non-refundable on completed transactions',
      'By accepting, you cannot dispute the tax later',
    ],
  });
});

// Accept tax terms
router.post('/accept-terms', authenticateToken, async (req, res) => {
  try {
    const { equipmentId } = req.body;
    const userId = req.user.id;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    const connection = await pool.getConnection();

    const [equipment] = await connection.query(
      'SELECT owner_id FROM equipment WHERE id = ?',
      [equipmentId]
    );

    if (!equipment || equipment.length === 0 || equipment[0].owner_id !== userId) {
      connection.release();
      return res.status(403).json({ message: 'Not authorized' });
    }

    await connection.query(
      `INSERT INTO tax_terms_acceptance 
       (user_id, equipment_id, tax_rate, accepted, accepted_at, ip_address, user_agent)
       VALUES (?, ?, ?, true, NOW(), ?, ?)
       ON DUPLICATE KEY UPDATE 
       accepted = true, accepted_at = NOW(), ip_address = ?, user_agent = ?`,
      [userId, equipmentId, TAX_RATE, ipAddress, userAgent, ipAddress, userAgent]
    );

    connection.release();

    res.json({ message: 'Tax terms accepted', accepted: true, tax_rate: TAX_RATE });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// Decline tax terms
router.post('/decline-terms', authenticateToken, async (req, res) => {
  try {
    const { equipmentId } = req.body;
    const userId = req.user.id;

    const connection = await pool.getConnection();

    const [equipment] = await connection.query(
      'SELECT owner_id FROM equipment WHERE id = ?',
      [equipmentId]
    );

    if (!equipment || equipment.length === 0 || equipment[0].owner_id !== userId) {
      connection.release();
      return res.status(403).json({ message: 'Not authorized' });
    }

    await connection.query(
      'UPDATE equipment SET availability_status = false WHERE id = ?',
      [equipmentId]
    );

    connection.release();

    res.json({ message: 'Terms declined. Equipment deactivated.', accepted: false });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// Check acceptance
router.get('/check-acceptance/:equipmentId', authenticateToken, async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const userId = req.user.id;

    const connection = await pool.getConnection();

    const [acceptance] = await connection.query(
      'SELECT accepted FROM tax_terms_acceptance WHERE user_id = ? AND equipment_id = ?',
      [userId, equipmentId]
    );

    connection.release();

    res.json({ accepted: acceptance.length > 0 ? acceptance[0].accepted : false });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

// Calculate price with tax
router.post('/calculate', async (req, res) => {
  try {
    const { subtotal } = req.body;

    const taxAmount = subtotal * TAX_RATE;
    const totalAmount = subtotal + taxAmount;

    res.json({
      subtotal: parseFloat(subtotal).toFixed(2),
      tax_rate: (TAX_RATE * 100).toFixed(2) + '%',
      tax_amount: parseFloat(taxAmount).toFixed(2),
      total: parseFloat(totalAmount).toFixed(2),
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
});

module.exports = router;