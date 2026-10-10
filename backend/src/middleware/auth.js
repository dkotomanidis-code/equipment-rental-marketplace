const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRE || '7d';
if (!secret || secret.length < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters');
}
if (!/^[1-9]\d*[smhd]$/.test(expiresIn)) {
  throw new Error('JWT_EXPIRE must be a positive duration, such as 1h or 7d');
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      tokenVersion: user.token_version || 0,
    },
    secret,
    {
      algorithm: 'HS256',
      expiresIn,
    }
  );
}

function authenticate(req, res, next) {
  const parts = (req.get('Authorization') || '').split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  try {
    const user = jwt.verify(parts[1], secret, { algorithms: ['HS256'] });
    if (
      !Number.isSafeInteger(user.id) ||
      user.id <= 0 ||
      !Number.isFinite(user.exp) ||
      !Number.isSafeInteger(user.tokenVersion) ||
      user.tokenVersion < 0
    ) {
      throw new Error('Invalid token payload');
    }
    req.user = user;
    req.tokenVersion = user.tokenVersion;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { authenticate, signToken };