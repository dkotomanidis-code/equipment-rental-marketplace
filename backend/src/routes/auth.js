const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = require('../database/pool');
const { signToken, authenticate } = require('../middleware/auth');
const { asyncRoute, validText } = require('../utils/api');

const router = express.Router();

const validEmail = (email) =>
  typeof email === 'string' &&
  email.trim().length > 0 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const validPassword = (password) =>
  typeof password === 'string' &&
  password.length >= 8 &&
  Buffer.byteLength(password, 'utf8') <= 72;

const normalizeRecoveryCode = (code) =>
  typeof code === 'string' ? code.replace(/[\s-]/g, '').toUpperCase() : '';

function generateRecoveryCodes(count = 10) {
  const codes = new Set();

  while (codes.size < count) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.add(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }

  return [...codes];
}

function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');
}

function verifyRecoveryCode(code, storedHash) {
  const normalized = normalizeRecoveryCode(code);

  if (
    !/^[A-F0-9]{8}$/.test(normalized) ||
    typeof storedHash !== 'string' ||
    !/^[a-f0-9]{64}$/i.test(storedHash)
  ) {
    return false;
  }

  const current = crypto.createHash('sha256').update(normalized).digest('hex');
  return current === storedHash;
}

router.post(
  '/signup',
  asyncRoute(async (req, res) => {
    const { username, email, password, passwordConfirm, firstName, lastName } = req.body;

    if (!validText(username, 255) || !validEmail(email) || !validPassword(password)) {
      return res.status(400).json({ error: 'Invalid or missing required fields' });
    }

    if (typeof passwordConfirm !== 'string' || password !== passwordConfirm) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [normalizedUsername, normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, first_name, last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [normalizedUsername, normalizedEmail, hash, firstName || null, lastName || null]
    );

    const user = {
      id: result.insertId,
      username: normalizedUsername,
      email: normalizedEmail,
    };

    const codes = generateRecoveryCodes(10);

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 10);

    for (const code of codes) {
      const codeHash = hashRecoveryCode(code);
      await pool.execute(
        'INSERT INTO recovery_codes (user_id, code_hash, used, created_at, expires_at) VALUES (?, ?, false, NOW(), ?)',
        [user.id, codeHash, expiresAt]
      );
    }

    return res.status(201).json({
      message: 'User created successfully',
      token: signToken(user),
      user,
      recoveryCodes: codes,
      recoveryMessage:
        'Save your recovery codes in a safe place. Each code can be used once to reset your password.',
    });
  })
);

router.post(
  '/login',
  asyncRoute(async (req, res) => {
    const { username, password } = req.body;

    if (!validText(username, 255) || !validPassword(password)) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const lookup = username.includes('@') ? username.trim().toLowerCase() : username.trim();

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [lookup, lookup]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.json({
      message: 'Login successful',
      token: signToken({
        id: user.id,
        username: user.username,
        email: user.email,
      }),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  })
);

router.post(
  '/update-profile',
  authenticate,
  asyncRoute(async (req, res) => {
    const userId = req.user.id;
    const { first_name, last_name, phone, bio } = req.body;

    const updates = [];
    const values = [];

    if (first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(last_name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No profile fields to update' });
    }

    values.push(userId);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    const [rows] = await pool.execute(
      'SELECT id, username, email, first_name, last_name, phone, bio FROM users WHERE id = ?',
      [userId]
    );

    return res.json({
      message: 'Profile updated successfully',
      user: rows[0],
    });
  })
);

router.get(
  '/user/:id',
  asyncRoute(async (req, res) => {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const [rows] = await pool.execute(
      'SELECT id, username, email, first_name, last_name, phone, bio, is_renter, is_owner, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(rows[0]);
  })
);

module.exports = router;