const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../database/pool');
const { signToken } = require('../middleware/auth');
const { asyncRoute, validText } = require('../utils/api');

const validEmail = (email) => validText(email, 255) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validPassword = (password) => typeof password === 'string' &&
  password.length > 0 && Buffer.byteLength(password, 'utf8') <= 72;

// Sign Up
router.post('/signup', asyncRoute(async (req, res) => {
  const { username, email, password, firstName, lastName } = req.body;
  if (!validText(username, 255) || !validEmail(email) || !validPassword(password) ||
      (firstName != null && (typeof firstName !== 'string' || firstName.length > 100)) ||
      (lastName != null && (typeof lastName !== 'string' || lastName.length > 100))) {
    return res.status(400).json({ error: 'Invalid or missing required fields' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
    [username.trim(), normalizedEmail, hashedPassword, firstName || null, lastName || null]
  );
  const user = { id: result.insertId, username: username.trim(), email: normalizedEmail };
  res.status(201).json({
    message: 'User created successfully',
    token: signToken(user),
    user,
  });
}));

// Login
router.post('/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body;
  if (!validEmail(email) || !validPassword(password)) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const [rows] = await pool.execute('SELECT id, username, email, password FROM users WHERE email = ?', [
    email.trim().toLowerCase(),
  ]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  res.json({
    message: 'Login successful',
    token: signToken(user),
    user: { id: user.id, username: user.username, email: user.email },
  });
}));

module.exports = router;
