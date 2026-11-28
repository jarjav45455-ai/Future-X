const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const {
  generatePhaseExam,
  submitPhaseExam,
  getStudentAssessmentHistory,
} = require('../services/assessmentEngine');

const router = express.Router();

// 1. POST /api/assess/generate
router.post('/generate', requireAuth, (req, res) => {
  try {
    const { careerId, phaseId } = req.body || {};
    if (!careerId) return res.status(400).json({ error: 'careerId is required.' });

    const exam = generatePhaseExam(db, req.user.id, String(careerId), Number(phaseId || 1));
    return res.json({ success: true, ...exam });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// 2. POST /api/assess/submit
router.post('/submit', requireAuth, (req, res) => {
  try {
    const { careerId, phaseId, answers, totalCareerPhases } = req.body || {};
    if (!careerId) return res.status(400).json({ error: 'careerId is required.' });

    const result = submitPhaseExam(
      db,
      req.user.id,
      String(careerId),
      Number(phaseId || 1),
      answers,
      Number(totalCareerPhases || 3)
    );
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// 3. GET /api/assess/history?careerId=ai-engineer
router.get('/history', requireAuth, (req, res) => {
  try {
    const careerId = String(req.query.careerId || '').trim();
    if (!careerId) return res.status(400).json({ error: 'careerId query param required.' });

    const history = getStudentAssessmentHistory(db, req.user.id, careerId);
    return res.json({ success: true, ...history });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. GET /api/assess/admin/overview (Admin Only)
router.get('/admin/overview', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }

  const sources = db.prepare('SELECT * FROM question_source ORDER BY added_at DESC').all();
  const bankSummary = db
    .prepare(`
      SELECT career_id, phase_id, COUNT(*) AS question_count
      FROM questions
      GROUP BY career_id, phase_id
      ORDER BY career_id ASC, phase_id ASC
      LIMIT 100
    `)
    .all();
  const recentAttempts = db
    .prepare(`
      SELECT id, user_id, career_id, phase_id, score, passed, timestamp
      FROM assessment_attempts
      ORDER BY timestamp DESC
      LIMIT 50
    `)
    .all();

  return res.json({
    success: true,
    sources,
    bankSummary,
    recentAttempts,
  });
});

module.exports = router;