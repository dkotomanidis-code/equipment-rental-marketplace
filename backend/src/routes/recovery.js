const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../database/db');
const { authenticate } = require('../middleware/auth');
const { asyncRoute } = require('../utils/api');
const {
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  normalizeRecoveryCode,
} = require('../utils/recoveryCode');

const router = express.Router();

const invalidCode = () => ({
  status: 401,
  body: {
    error: 'Invalid, expired, or already-used recovery code',
  },
});

function validPassword(value) {
  return (
    typeof value === 'string' &&
    value.length >= 8 &&
    Buffer.byteLength(value, 'utf8') <= 72
  );
}

async function transaction(work) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('Recovery transaction rollback failed');
    }

    throw error;
  } finally {
    connection.release();
  }
}

function sendResult(res, result) {
  res.set('Cache-Control', 'no-store');
  return res.status(result.status).json(result.body);
}

async function insertCodes(connection, userId) {
  const codes = generateRecoveryCodes(10);

  for (const code of codes) {
    await connection.execute(
      `INSERT INTO recovery_codes
         (user_id, code_hash, used, created_at, expires_at)
       VALUES (?, ?, false, NOW(), DATE_ADD(NOW(), INTERVAL 10 YEAR))`,
      [userId, hashRecoveryCode(code)]
    );
  }

  return codes;
}

async function issueCodes(req, res, replaceExisting) {
  const { password } = req.body || {};

  if (
    typeof password !== 'string' ||
    !password ||
    Buffer.byteLength(password, 'utf8') > 72
  ) {
    return res.status(400).json({
      error: 'Current password confirmation is required',
    });
  }

  const result = await transaction(async (connection) => {
    // All recovery-changing operations lock the user first.
    const [users] = await connection.execute(
      'SELECT id, password FROM users WHERE id = ? FOR UPDATE',
      [req.user.id]
    );

    if (!users.length) {
      return {
        status: 401,
        body: { error: 'Invalid account or password' },
      };
    }

    const user = users[0];

    if (!(await bcrypt.compare(password, user.password))) {
      return {
        status: 401,
        body: { error: 'Invalid account or password' },
      };
    }

    if (!replaceExisting) {
      const [activeCodes] = await connection.execute(
        `SELECT id
         FROM recovery_codes
         WHERE user_id = ?
           AND used = false
           AND expires_at > NOW()
         LIMIT 1
         FOR UPDATE`,
        [user.id]
      );

      if (activeCodes.length) {
        return {
          status: 409,
          body: {
            error: 'Active recovery codes already exist. Use regenerate to replace them.',
          },
        };
      }
    }

    // Retire all remaining unused codes before issuing a new set.
    await connection.execute(
      `UPDATE recovery_codes
       SET used = true, used_at = NOW()
       WHERE user_id = ? AND used = false`,
      [user.id]
    );

    const codes = await insertCodes(connection, user.id);

    return {
      status: 200,
      body: {
        codes,
        message: 'Save these recovery codes safely. Previous codes are no longer valid.',
      },
    };
  });

  return sendResult(res, result);
}

router.post(
  '/generate',
  authenticate,
  asyncRoute((req, res) => issueCodes(req, res, false))
);

router.post(
  '/regenerate',
  authenticate,
  asyncRoute((req, res) => issueCodes(req, res, true))
);

router.post(
  '/reset-password',
  asyncRoute(async (req, res) => {
    const {
      email,
      recoveryCode,
      newPassword,
      newPasswordConfirm,
    } = req.body || {};

    if (
      typeof email !== 'string' ||
      !email.trim() ||
      email.trim().length > 255 ||
      typeof recoveryCode !== 'string' ||
      recoveryCode.length > 128
    ) {
      return res.status(400).json({
        error: 'A valid email and recovery code are required',
      });
    }

    if (!validPassword(newPassword)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and no more than 72 UTF-8 bytes',
      });
    }

    if (
      typeof newPasswordConfirm !== 'string' ||
      newPassword !== newPasswordConfirm
    ) {
      return res.status(400).json({
        error: 'Passwords do not match',
      });
    }

    const normalizedCode = normalizeRecoveryCode(recoveryCode);

    if (!/^[A-F0-9]{8}$/.test(normalizedCode)) {
      return sendResult(res, invalidCode());
    }

    const result = await transaction(async (connection) => {
      const [users] = await connection.execute(
        'SELECT id, email FROM users WHERE email = ? FOR UPDATE',
        [email.trim().toLowerCase()]
      );

      // Do not reveal whether this email has an account.
      if (!users.length) {
        return invalidCode();
      }

      const user = users[0];

      const [codes] = await connection.execute(
        `SELECT id, code_hash
         FROM recovery_codes
         WHERE user_id = ?
           AND used = false
           AND expires_at > NOW()
         FOR UPDATE`,
        [user.id]
      );

      const match = codes.find((record) =>
        verifyRecoveryCode(normalizedCode, record.code_hash)
      );

      if (!match) {
        return invalidCode();
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const [consumed] = await connection.execute(
        `UPDATE recovery_codes
         SET used = true, used_at = NOW()
         WHERE id = ?
           AND user_id = ?
           AND used = false
           AND expires_at > NOW()`,
        [match.id, user.id]
      );

      if (consumed.affectedRows !== 1) {
        return invalidCode();
      }

      await connection.execute(
        'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, user.id]
      );

      return {
        status: 200,
        body: {
          message: 'Password reset successfully',
          user: {
            id: user.id,
            email: user.email,
          },
        },
      };
    });

    return sendResult(res, result);
  })
);

router.get(
  '/codes',
  authenticate,
  asyncRoute(async (req, res) => {
    const [rows] = await pool.execute(
      `SELECT id, used, used_at, created_at, expires_at,
              (used = false AND expires_at > NOW()) AS usable
       FROM recovery_codes
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`,
      [req.user.id]
    );

    const codes = rows.map((row) => ({
      ...row,
      used: Boolean(row.used),
      usable: Boolean(row.usable),
    }));

    return sendResult(res, {
      status: 200,
      body: {
        total: codes.length,
        unused: codes.filter((code) => code.usable).length,
        used: codes.filter((code) => code.used).length,
        expired: codes.filter((code) => !code.used && !code.usable).length,
        codes,
      },
    });
  })
);

module.exports = router;