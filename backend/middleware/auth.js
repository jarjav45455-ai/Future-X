const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { db } = require('../db/database');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'futurex_dev_access_secret_2026';

// High limit so multiple students/judges on same Wi-Fi/hotspot never get blocked
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this network. Please wait a minute and retry.' },
});

function verifyAccessToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    const userRow = db
      .prepare('SELECT id, name, email, role, active_device_id FROM users WHERE id = ?')
      .get(payload.sub);

    if (!userRow) return null;

    // If token carries a deviceId and user logged out or switched device, invalidate it
    if (payload.deviceId && userRow.active_device_id && userRow.active_device_id !== payload.deviceId) {
      return null;
    }
    if (payload.deviceId && !userRow.active_device_id) {
      return null;
    }

    return {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role || 'student',
      deviceId: payload.deviceId || null,
    };
  } catch {
    return null;
  }
}

function optionalAuth(req, _res, next) {
  req.user = verifyAccessToken(req);
  next();
}

function requireAuth(req, res, next) {
  const user = verifyAccessToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or logged out. Please sign in again.' });
  }
  req.user = user;
  next();
}

module.exports = {
  apiRateLimiter,
  optionalAuth,
  requireAuth,
};