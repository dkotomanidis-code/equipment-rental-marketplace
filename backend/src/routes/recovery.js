const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../database/db');
const { authenticate } = require('../middleware/auth');
const {
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  normalizeRecoveryCode,
} = require('../utils/recoveryCode');

const router = express.Router();

/**
 * POST /api/recovery/generate
 * Generate recovery codes for the authenticated user.
 */
router.post('/generate', authenticate, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT id FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const plainCodes = generateRecoveryCodes(10);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 10);

    for (const code of plainCodes) {
      await connection.execute(
        `INSERT INTO recovery_codes (user_id, code_hash, used, created_at, expires_at)
         VALUES (?, ?, false, NOW(), ?)`,
        [userId, hashRecoveryCode(code), expiresAt]
      );
    }

    return res.json({
      codes: plainCodes,
      message: 'Recovery codes generated. Save them in a safe place. Each code can be used once.',
    });
  } catch (error) {
    console.error('Generate recovery codes error:', error);
    return res.status(500).json({ error: 'Code generation failed' });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/recovery/reset-password
 * Reset a password using a valid recovery code.
 */
router.post('/reset-password', async (req, res) => {
  const { email, recoveryCode, newPassword, newPasswordConfirm } = req.body;

  if (!email || !recoveryCode || !newPassword || !newPasswordConfirm) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (newPassword !== newPasswordConfirm) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT id, email FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = users[0].id;
    const normalizedCode = normalizeRecoveryCode(recoveryCode);

    const [codes] = await connection.execute(
      `SELECT id, code_hash
       FROM recovery_codes
       WHERE user_id = ? AND used = false
       ORDER BY created_at DESC`,
      [userId]
    );

    let match = null;

    for (const record of codes) {
      if (verifyRecoveryCode(normalizedCode, record.code_hash)) {
        match = record;
        break;
      }
    }

    if (!match) {
      return res.status(401).json({ error: 'Invalid or already-used recovery code' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await connection.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    await connection.execute(
      'UPDATE recovery_codes SET used = true, used_at = NOW() WHERE id = ?',
      [match.id]
    );

    return res.json({
      message: 'Password reset successfully',
      user: {
        id: userId,
        email: users[0].email,
      },
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Password reset failed' });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/recovery/codes
 * Returns the recovery codes state for the current user.
 */
router.get('/codes', authenticate, async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    const [codes] = await connection.execute(
      `SELECT id, used, used_at, created_at, expires_at
       FROM recovery_codes
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const unused = codes.filter((code) => !code.used).length;
    const used = codes.filter((code) => code.used).length;

    return res.json({
      total: codes.length,
      unused,
      used,
      codes,
    });
  } catch (error) {
    console.error('Get recovery codes error:', error);
    return res.status(500).json({ error: 'Failed to fetch recovery codes' });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/recovery/regenerate
 * Invalidates the old codes and creates a fresh set.
 */
router.post('/regenerate', authenticate, async (req, res) => {
  const userId = req.user?.id;
  const { password } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password confirmation is required' });
  }

  let connection;

  try {
    connection = await pool.getConnection();

    const [users] = await connection.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatches = await bcrypt.compare(password, users[0].password);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    await connection.execute(
      'UPDATE recovery_codes SET used = true, used_at = NOW() WHERE user_id = ?',
      [userId]
    );

    const plainCodes = generateRecoveryCodes(10);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 10);

    for (const code of plainCodes) {
      await connection.execute(
        `INSERT INTO recovery_codes (user_id, code_hash, used, created_at, expires_at)
         VALUES (?, ?, false, NOW(), ?)`,
        [userId, hashRecoveryCode(code), expiresAt]
      );
    }

    return res.json({
      codes: plainCodes,
      message: 'New recovery codes generated. Old codes are no longer valid.',
    });
  } catch (error) {
    console.error('Regenerate recovery codes error:', error);
    return res.status(500).json({ error: 'Code regeneration failed' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;