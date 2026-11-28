const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { db } = require('../db/database');
const { requireAuth, authRateLimiter } = require('../middleware/auth');

const router = express.Router();

const ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'dev_only_fallback_access_secret_change_in_env';
const REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'dev_only_fallback_refresh_secret_change_in_env';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().email('Enter a valid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  ageGroup: z.enum(['under_18', '18_plus']).optional().default('18_plus'),
});

const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function issueTokenPair(user) {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, jti: crypto.randomUUID() },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(crypto.randomUUID(), user.id, hashToken(refreshToken), expiresAt);

  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register', authRateLimiter, async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid input.' });
  }

  const { name, email, password, ageGroup } = parsed.data;

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const userId = `usr-${crypto.randomUUID()}`;
    const passwordHash = await bcrypt.hash(password, 12);

    db.prepare(`
      INSERT INTO users (id, name, email, password_hash, role, age_group)
      VALUES (?, ?, ?, ?, 'student', ?)
    `).run(userId, name, email, passwordHash, ageGroup);

    // Create empty student profile (no auto-selected career)
    db.prepare(`
      INSERT INTO student_profiles (user_id, readiness_percentage)
      VALUES (?, 0)
    `).run(userId);

    const user = { id: userId, name, email, role: 'student', ageGroup };
    const tokens = issueTokenPair(user);

    return res.status(201).json({
      success: true,
      user,
      ...tokens,
    });
  } catch (err) {
    console.error('[Auth Register Error]:', err.message);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', authRateLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid credentials.' });
  }

  const { email, password } = parsed.data;

  try {
    const userRow = db.prepare(`
      SELECT id, name, email, password_hash, role, age_group
      FROM users WHERE email = ?
    `).get(email);

    if (!userRow) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, userRow.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      ageGroup: userRow.age_group,
    };
    const tokens = issueTokenPair(user);

    return res.json({
      success: true,
      user,
      ...tokens,
    });
  } catch (err) {
    console.error('[Auth Login Error]:', err.message);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken || typeof refreshToken !== 'string') {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const tokenHash = hashToken(refreshToken);

    const stored = db.prepare(`
      SELECT id, user_id, expires_at, revoked
      FROM refresh_tokens WHERE token_hash = ?
    `).get(tokenHash);

    if (!stored || stored.revoked === 1 || new Date(stored.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Refresh token expired or revoked.' });
    }

    // Rotate old token
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?').run(stored.id);

    const userRow = db.prepare('SELECT id, name, email, role, age_group FROM users WHERE id = ?').get(decoded.sub);
    if (!userRow) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const tokens = issueTokenPair(userRow);
    return res.json({ success: true, ...tokens });
  } catch {
    return res.status(401).json({ error: 'Invalid refresh token.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body || {};
  if (refreshToken && typeof refreshToken === 'string') {
    db.prepare('UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?').run(hashToken(refreshToken));
  }
  return res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const userRow = db.prepare(`
    SELECT u.id, u.name, u.email, u.role, u.age_group,
           p.target_role_id, p.target_role_title, p.readiness_percentage
    FROM users u
    LEFT JOIN student_profiles p ON p.user_id = u.id
    WHERE u.id = ?
  `).get(req.user.id);

  if (!userRow) {
    return res.status(404).json({ error: 'User not found.' });
  }

  return res.json({ success: true, user: userRow });
});

module.exports = router;