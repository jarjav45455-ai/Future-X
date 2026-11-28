const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'futurex_dev_access_secret_2026';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'futurex_dev_refresh_secret_2026';

const RegisterSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your full name (min 2 letters).').max(80),
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.').max(100),
  college: z.string().trim().max(120).optional().default(''),
  currentStage: z.string().trim().max(60).optional().default('College Student'),
  deviceId: z.string().trim().min(4).max(120).optional(),
  deviceName: z.string().trim().max(80).optional().default('Mobile Device'),
});

const LoginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
  deviceId: z.string().trim().min(4).max(120).optional(),
  deviceName: z.string().trim().max(80).optional().default('Mobile Device'),
});

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function issueTokenPair(user, deviceId) {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role || 'student', deviceId: deviceId || null },
    ACCESS_SECRET,
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, jti: crypto.randomUUID(), deviceId: deviceId || null },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(`rt-${crypto.randomUUID()}`, user.id, hashToken(refreshToken), expiresAt);

  return { accessToken, refreshToken };
}

function hasActiveLiveSession(userId) {
  const nowIso = new Date().toISOString();
  const row = db
    .prepare('SELECT id FROM refresh_tokens WHERE user_id = ? AND expires_at > ? LIMIT 1')
    .get(userId, nowIso);
  return Boolean(row);
}

// ==========================================
// 1. POST /api/auth/register — Unlimited Smooth Sign Up
// ==========================================
router.post('/register', async (req, res) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid signup input.' });
  }

  const { name, password, college, currentStage, deviceName } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const deviceId = parsed.data.deviceId || `dev-${crypto.randomUUID()}`;

  try {
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(email);
    if (existing) {
      return res.status(409).json({
        code: 'EMAIL_EXISTS',
        error: 'This email already has an account. Please switch to Sign In.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `usr-${crypto.randomUUID()}`;

    db.prepare(`
      INSERT INTO users (
        id, name, email, password_hash, role, college, current_stage,
        active_device_id, active_device_name, active_session_at
      )
      VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, datetime('now'))
    `).run(userId, name, email, passwordHash, college, currentStage, deviceId, deviceName);

    const user = { id: userId, name, email, role: 'student', college, currentStage };
    const tokens = issueTokenPair(user, deviceId);

    return res.status(201).json({
      success: true,
      user,
      ...tokens,
    });
  } catch (err) {
    console.error('[Register Error]:', err.message);
    return res.status(500).json({ error: 'Could not create account right now. Please try again.' });
  }
});

// ==========================================
// 2. POST /api/auth/login — Single-Device Active Lock
// ==========================================
router.post('/login', async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid login input.' });
  }

  const email = parsed.data.email.toLowerCase();
  const { password, deviceName } = parsed.data;
  const incomingDeviceId = parsed.data.deviceId || `dev-${crypto.randomUUID()}`;

  try {
    const userRow = db
      .prepare('SELECT * FROM users WHERE LOWER(email) = ?')
      .get(email);

    if (!userRow) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPass = await bcrypt.compare(password, userRow.password_hash);
    if (!validPass) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // SINGLE-DEVICE LOCK CHECK:
    // Block if already logged in on a DIFFERENT device AND session is still active
    if (
      userRow.active_device_id &&
      userRow.active_device_id !== incomingDeviceId &&
      hasActiveLiveSession(userRow.id)
    ) {
      const activeDeviceLabel = userRow.active_device_name || 'another phone';
      return res.status(409).json({
        code: 'DEVICE_LOCKED',
        error: `This account is already logged in on ${activeDeviceLabel}. Please log out from that device first to open it here.`,
      });
    }

    // Lock session to this device & replace old tokens for clean state
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userRow.id);
    db.prepare(`
      UPDATE users
      SET active_device_id = ?, active_device_name = ?, active_session_at = datetime('now')
      WHERE id = ?
    `).run(incomingDeviceId, deviceName, userRow.id);

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role || 'student',
      college: userRow.college || '',
      currentStage: userRow.current_stage || 'College Student',
    };
    const tokens = issueTokenPair(user, incomingDeviceId);

    return res.json({
      success: true,
      user,
      ...tokens,
    });
  } catch (err) {
    console.error('[Login Error]:', err.message);
    return res.status(500).json({ error: 'Unable to sign in right now.' });
  }
});

// ==========================================
// 3. POST /api/auth/refresh — Auto-Renew on Same Locked Device
// ==========================================
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required.' });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const tokenHash = hashToken(refreshToken);

    const stored = db
      .prepare('SELECT * FROM refresh_tokens WHERE token_hash = ? AND user_id = ?')
      .get(tokenHash, payload.sub);

    if (!stored || new Date(stored.expires_at).getTime() < Date.now()) {
      return res.status(401).json({ error: 'Refresh token expired. Please sign in again.' });
    }

    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    if (!userRow || !userRow.active_device_id) {
      return res.status(401).json({ error: 'Session logged out. Please sign in again.' });
    }

    if (payload.deviceId && userRow.active_device_id !== payload.deviceId) {
      return res.status(401).json({ error: 'Session invalidated on this device.' });
    }

    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(stored.id);
    const tokens = issueTokenPair(userRow, userRow.active_device_id);
    return res.json({ success: true, ...tokens });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token.' });
  }
});

// ==========================================
// 4. POST /api/auth/logout — Unlocks Account for Other Devices
// ==========================================
router.post('/logout', (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    let userId = null;

    // Identify user from either Authorization header OR refreshToken so logout ALWAYS unlocks
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.slice(7).trim(), ACCESS_SECRET);
        userId = decoded.sub;
      } catch {
        // Fallback to refreshToken below
      }
    }

    if (!userId && refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        userId = decoded.sub;
      } catch {
        // Ignore invalid refreshToken
      }
    }

    if (userId) {
      db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
      db.prepare(`
        UPDATE users
        SET active_device_id = NULL, active_device_name = NULL, active_session_at = NULL
        WHERE id = ?
      `).run(userId);
    }

    return res.json({ success: true, message: 'Logged out and device lock released.' });
  } catch (err) {
    console.error('[Logout Error]:', err.message);
    return res.status(500).json({ error: 'Logout failed.' });
  }
});

// ==========================================
// 5. GET /api/auth/me — Verify Active Session
// ==========================================
router.get('/me', requireAuth, (req, res) => {
  const row = db
    .prepare('SELECT id, name, email, role, college, current_stage, active_device_name FROM users WHERE id = ?')
    .get(req.user.id);
  if (!row) return res.status(404).json({ error: 'User not found.' });
  return res.json({
    success: true,
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      college: row.college || '',
      currentStage: row.current_stage || 'College Student',
      activeDeviceName: row.active_device_name || 'This Device',
    },
  });
});

module.exports = router;