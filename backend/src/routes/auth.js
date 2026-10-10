const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../database/pool');
const { signToken, authenticate } = require('../middleware/auth');
const { asyncRoute, validText } = require('../utils/api');
const {
  generateRecoveryCodes,
  hashRecoveryCode,
} = require('../utils/recoveryCode');

const router = express.Router();

const validEmail = (email) =>
  typeof email === 'string' &&
  email.trim().length > 0 &&
  email.trim().length <= 255 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const validPassword = (password) =>
  typeof password === 'string' &&
  password.length >= 8 &&
  Buffer.byteLength(password, 'utf8') <= 72;

const validOptionalName = (name) =>
  name === undefined ||
  name === null ||
  (typeof name === 'string' && name.length <= 100);

const normalizeOptionalName = (name) =>
  typeof name === 'string' ? name.trim() || null : null;

router.post(
  '/signup',
  asyncRoute(async (req, res) => {
    const {
      username,
      email,
      password,
      passwordConfirm,
      firstName,
      lastName,
    } = req.body || {};

    if (
      !validText(username, 255) ||
      !validEmail(email) ||
      !validPassword(password) ||
      !validOptionalName(firstName) ||
      !validOptionalName(lastName)
    ) {
      return res.status(400).json({
        error: 'Invalid or missing required fields',
      });
    }

    if (
      typeof passwordConfirm !== 'string' ||
      password !== passwordConfirm
    ) {
      return res.status(400).json({
        error: 'Passwords do not match',
      });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [normalizedUsername, normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Username or email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const codes = generateRecoveryCodes(10);
    const connection = await pool.getConnection();

    let transactionStarted = false;
    let responseBody;

    try {
      await connection.beginTransaction();
      transactionStarted = true;

      const [result] = await connection.execute(
        `INSERT INTO users
             (username, email, password, first_name, last_name,
              token_version, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          normalizedUsername,
          normalizedEmail,
          passwordHash,
          normalizeOptionalName(firstName),
          normalizeOptionalName(lastName),
        ]
      );

      const user = {
        id: result.insertId,
        username: normalizedUsername,
        email: normalizedEmail,
      };

      for (const code of codes) {
        await connection.execute(
          `INSERT INTO recovery_codes
             (user_id, code_hash, used, created_at, expires_at)
           VALUES (?, ?, false, NOW(), DATE_ADD(NOW(), INTERVAL 10 YEAR))`,
          [user.id, hashRecoveryCode(code)]
        );
      }

      // Sign before committing so a signing error also rolls back signup.
      responseBody = {
        message: 'User created successfully',
        token: signToken({ ...user, tokenVersion: 0 }),
        user,
        recoveryCodes: codes,
        recoveryMessage:
          'Save your recovery codes in a safe place. Each code can be used once to reset your password.',
      };

      await connection.commit();
      transactionStarted = false;
    } catch (error) {
      if (transactionStarted) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('Signup transaction rollback failed');
        }
      }

      // Handle another signup taking the same username/email
      // after the initial availability check.
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          error: 'Username or email already exists',
        });
      }

      throw error;
    } finally {
      connection.release();
    }

    res.set('Cache-Control', 'no-store');
    return res.status(201).json(responseBody);
  })
);

router.post(
  '/login',
  asyncRoute(async (req, res) => {
    const { password } = req.body || {};
    const username = req.body?.username ?? req.body?.email;

    if (!validText(username, 255) || typeof password !== 'string' ||
        !password || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        error: 'Username and password are required',
      });
    }

    const lookup = username.includes('@')
      ? username.trim().toLowerCase()
      : username.trim();

    const [rows] = await pool.execute(
      'SELECT id, username, email, password, token_version AS tokenVersion FROM users WHERE username = ? OR email = ?',
      [lookup, lookup]
    );

    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    const account = {
      id: user.id,
      username: user.username,
      email: user.email,
    };

    res.set('Cache-Control', 'no-store');

    return res.json({
      message: 'Login successful',
      token: signToken({ ...account, tokenVersion: user.tokenVersion }),
      user: account,
    });
  })
);

router.post(
  '/update-profile',
  authenticate,
  asyncRoute(async (req, res) => {
    const userId = req.user.id;
    const { first_name, last_name, phone, bio } = req.body || {};

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
      return res.status(400).json({
        error: 'No profile fields to update',
      });
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
      return res.status(400).json({
        error: 'Invalid user ID',
      });
    }

    const [rows] = await pool.execute(
      'SELECT id, username, first_name, last_name, profile_picture, bio, is_renter, is_owner, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    return res.json(rows[0]);
  })
);

module.exports = router;