const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { syncLiveOpportunities } = require('../services/opportunitySources');
const { evaluateOpportunitiesForStudent } = require('../services/opportunityMatcherEngine');

const router = express.Router();

// 1. GET /api/opportunities/feed?category=ALL|INTERNSHIP|JOB|HACKATHON
router.get('/feed', requireAuth, async (req, res) => {
  try {
    const category = String(req.query.category || 'ALL').toUpperCase();
    const validCat = ['ALL', 'INTERNSHIP', 'JOB', 'HACKATHON'].includes(category) ? category : 'ALL';

    // If table is empty on very first boot, trigger one live free sync
    const countRow = db.prepare("SELECT COUNT(*) as c FROM live_opportunities WHERE status IN ('Open','Closing Soon','Upcoming')").get();
    if (!countRow || Number(countRow.c) === 0) {
      await syncLiveOpportunities(db, true);
    }

    const feed = evaluateOpportunitiesForStudent(db, req.user.id, validCat);
    return res.json({ success: true, ...feed });
  } catch (err) {
    console.error('[Opportunities Feed Error]:', err.message);
    return res.status(500).json({ error: 'Unable to load opportunity intelligence feed.' });
  }
});

// 2. GET /api/opportunities/notifications/list
router.get('/notifications/list', requireAuth, (req, res) => {
  try {
    const rows = db
      .prepare('SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30')
      .all(req.user.id);
    return res.json({ success: true, notifications: rows });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to load notifications.' });
  }
});

// 3. POST /api/opportunities/notifications/read
router.post('/notifications/read', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE user_notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({ error: 'Failed to mark notifications read.' });
  }
});

// 4. GET /api/opportunities/admin/sources (Admin Only)
router.get('/admin/sources', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  const sources = db.prepare('SELECT * FROM opportunity_sources ORDER BY name ASC').all();
  return res.json({ success: true, sources });
});

// 5. POST /api/opportunities/admin/sync (Admin Only)
router.post('/admin/sync', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  try {
    const report = await syncLiveOpportunities(db, true);
    return res.json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/opportunities/:id (Full Detail + Lock/Unlock Breakdown)
router.get('/:id', requireAuth, (req, res) => {
  try {
    const oppId = String(req.params.id || '').trim();
    const feed = evaluateOpportunitiesForStudent(db, req.user.id, 'ALL');
    const found = feed.opportunities.find((o) => o.id === oppId);
    if (!found) {
      return res.status(404).json({ error: 'Opportunity not found or no longer active.' });
    }
    return res.json({
      success: true,
      studentContext: feed.studentContext,
      opportunity: found,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Unable to load opportunity detail.' });
  }
});

module.exports = router;