const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/rateLimit');
const { serializeUser } = require('../utils/serializers');

function createToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
}

router.use(createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }));

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, isOwner, isRenter } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUsers = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'A user with that email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `
        INSERT INTO users (username, email, password, first_name, last_name, is_owner, is_renter)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [username, email, hashedPassword, firstName || null, lastName || null, Boolean(isOwner), isRenter !== false]
    );

    const rows = await db.query(
      `
        SELECT id, username, email, first_name, last_name, is_owner, is_renter, created_at, updated_at
        FROM users
        WHERE id = ?
      `,
      [result.insertId]
    );

    const user = serializeUser(rows[0]);

    res.status(201).json({
      message: 'User created successfully',
      token: createToken(user),
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const users = await db.query(
      `
        SELECT id, username, email, password, first_name, last_name, is_owner, is_renter, created_at, updated_at
        FROM users
        WHERE email = ?
        LIMIT 1
      `,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      token: createToken(user),
      user: serializeUser(user),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const rows = await db.query(
      `
        SELECT id, username, email, first_name, last_name, is_owner, is_renter, created_at, updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: serializeUser(rows[0]) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
