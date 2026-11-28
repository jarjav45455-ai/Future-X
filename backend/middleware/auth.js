const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'dev_only_fallback_access_secret_change_in_env';

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = authHeader.slice(7).trim();
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role || 'student',
    };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid token.' });
  }
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = jwt.verify(token, ACCESS_SECRET);
      req.user = {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role || 'student',
      };
    } catch {
      // Ignore expired/invalid token on optional routes
    }
  }
  return next();
}

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please wait 15 minutes.' },
});

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Slow down requests.' },
});

module.exports = {
  requireAuth,
  optionalAuth,
  authRateLimiter,
  apiRateLimiter,
};