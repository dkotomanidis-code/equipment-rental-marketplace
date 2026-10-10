const crypto = require('crypto');

function normalizeRecoveryCode(code) {
  return typeof code === 'string'
    ? code.replace(/[\s-]/g, '').toUpperCase()
    : '';
}

function generateRecoveryCodes(count = 10) {
  const codes = new Set();

  while (codes.size < count) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.add(`${raw.slice(0, 4)}-${raw.slice(4)}`);
  }

  return [...codes];
}

function hashRecoveryCode(code) {
  return crypto.createHash('sha256')
    .update(normalizeRecoveryCode(code))
    .digest('hex');
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

  const currentHash = crypto.createHash('sha256')
    .update(normalized)
    .digest('hex');

  if (currentHash === storedHash) {
    return true;
  }

  const legacy = `${normalized.slice(0, 4)}-${normalized.slice(4)}`;
  const legacyHash = crypto.createHash('sha256')
    .update(legacy)
    .digest('hex');

  return legacyHash === storedHash;
}

module.exports = {
  generateRecoveryCodes,
  hashRecoveryCode,
  verifyRecoveryCode,
  normalizeRecoveryCode,
};