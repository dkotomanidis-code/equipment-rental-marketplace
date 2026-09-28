const requests = new Map();

function createRateLimiter({ windowMs = 60 * 1000, max = 120 } = {}) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.baseUrl}:${req.path}`;
    const now = Date.now();
    const record = requests.get(key);

    if (!record || record.resetAt <= now) {
      requests.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    record.count += 1;
    return next();
  };
}

module.exports = {
  createRateLimiter,
};
