const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const { db } = require('../db/database');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const selfAssessmentSchema = z.object({
  occupationId: z.string().min(1, 'occupationId is required'),
  ratings: z
    .array(
      z.object({
        skillId: z.string().min(1),
        rating: z.number().int().min(0).max(5),
      })
    )
    .min(1, 'At least one skill rating is required'),
});

// ==========================================
// 1. GET /api/occupations — Search & Browse
// ==========================================
router.get('/occupations', (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase();
    const category = String(req.query.category || '').trim();
    const seniority = String(req.query.seniority || '').trim();

    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`(
        LOWER(o.title) LIKE ?
        OR LOWER(o.category) LIKE ?
        OR LOWER(o.description) LIKE ?
        OR EXISTS (
          SELECT 1 FROM occupation_skills os2
          JOIN skills s2 ON s2.id = os2.skill_id
          WHERE os2.occupation_id = o.id AND LOWER(s2.name) LIKE ?
        )
      )`);
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (category && category !== 'All') {
      conditions.push('o.category = ?');
      params.push(category);
    }

    if (seniority && seniority !== 'All') {
      conditions.push('o.seniority = ?');
      params.push(seniority);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const rows = db
      .prepare(`
        SELECT
          o.id, o.title, o.category, o.domain, o.seniority, o.description,
          o.source_framework, o.source_attribution,
          COUNT(os.skill_id) AS skill_count
        FROM occupations o
        LEFT JOIN occupation_skills os ON os.occupation_id = o.id
        ${whereSql}
        GROUP BY o.id
        ORDER BY o.is_custom ASC, skill_count DESC, o.title ASC
      `)
      .all(...params);

    const categoryRows = db
      .prepare('SELECT DISTINCT category FROM occupations ORDER BY category ASC')
      .all();

    return res.json({
      success: true,
      total: rows.length,
      categories: ['All', ...categoryRows.map((c) => c.category)],
      occupations: rows.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        domain: r.domain,
        seniority: r.seniority,
        description: r.description || '',
        skillCount: Number(r.skill_count || 0),
        sourceFramework: r.source_framework || 'FutureX Ontology',
        sourceAttribution: r.source_attribution || '',
      })),
    });
  } catch (err) {
    console.error('[Occupations List Error]:', err.message);
    return res.status(500).json({ error: 'Unable to load occupations database.' });
  }
});

// ==========================================
// 2. GET /api/occupations/:id — Full Career Detail + Categorized Skills
// ==========================================
router.get('/occupations/:id', optionalAuth, (req, res) => {
  try {
    const occId = String(req.params.id || '').trim();
    const occ = db.prepare('SELECT * FROM occupations WHERE id = ?').get(occId);

    if (!occ) {
      return res.status(404).json({ error: 'Occupation not found.' });
    }

    const skillRows = db
      .prepare(`
        SELECT
          s.id, s.name, s.category, s.description, s.why_it_matters,
          s.required_proficiency, s.difficulty_level,
          os.is_required, os.weight
        FROM occupation_skills os
        JOIN skills s ON s.id = os.skill_id
        WHERE os.occupation_id = ?
        ORDER BY os.is_required DESC, os.weight DESC, s.category ASC, s.name ASC
      `)
      .all(occId);

    // Fetch prerequisites for these skills
    const prereqStmt = db.prepare(`
      SELECT s.id, s.name
      FROM skill_prerequisites sp
      JOIN skills s ON s.id = sp.prerequisite_skill_id
      WHERE sp.skill_id = ?
    `);

    // Fetch user's existing ratings if logged in (for Reassess mode)
    const userRatingMap = new Map();
    if (req.user?.id) {
      const savedRows = db
        .prepare(`
          SELECT skill_id, self_rating, verified_score, verification_status
          FROM user_skill_assessments
          WHERE user_id = ? AND occupation_id = ?
        `)
        .all(req.user.id, occId);

      for (const sr of savedRows) {
        userRatingMap.set(sr.skill_id, sr);
      }
    }

    const skills = skillRows.map((sk) => {
      const prereqs = prereqStmt.all(sk.id);
      const userSaved = userRatingMap.get(sk.id);
      return {
        id: sk.id,
        name: sk.name,
        category: sk.category,
        description: sk.description || '',
        whyItMatters: sk.why_it_matters || '',
        requiredProficiency: Number(sk.required_proficiency || 4),
        difficultyLevel: sk.difficulty_level || 'Beginner',
        isRequired: Boolean(sk.is_required),
        prerequisites: prereqs.map((p) => ({ id: p.id, name: p.name })),
        currentSelfRating: userSaved?.self_rating ?? null,
        verifiedScore: userSaved?.verified_score ?? null,
        verificationStatus: userSaved?.verification_status || 'not_assessed',
      };
    });

    // Fetch related occupations
    const relatedIds = safeJsonParse(occ.related_occupations_json, []);
    let relatedOccupations = [];
    if (relatedIds.length > 0) {
      const placeholders = relatedIds.map(() => '?').join(',');
      relatedOccupations = db
        .prepare(`
          SELECT id, title, category, seniority
          FROM occupations
          WHERE id IN (${placeholders}) AND id != ?
        `)
        .all(...relatedIds, occId);
    }

    if (relatedOccupations.length === 0) {
      relatedOccupations = db
        .prepare(`
          SELECT id, title, category, seniority
          FROM occupations
          WHERE category = ? AND id != ?
          LIMIT 3
        `)
        .all(occ.category, occId);
    }

    return res.json({
      success: true,
      occupation: {
        id: occ.id,
        title: occ.title,
        category: occ.category,
        domain: occ.domain,
        seniority: occ.seniority,
        description: occ.description || '',
        educationRequirements: occ.education_requirements || '',
        responsibilities: safeJsonParse(occ.responsibilities_json, []),
        careerGrowth: occ.career_growth || '',
        sourceFramework: occ.source_framework || 'FutureX Ontology',
        sourceAttribution: occ.source_attribution || '',
      },
      skills,
      relatedOccupations,
    });
  } catch (err) {
    console.error('[Occupation Detail Error]:', err.message);
    return res.status(500).json({ error: 'Unable to load occupation details.' });
  }
});

// ==========================================
// 3. POST /api/assessments/self — Submit 1-5 Skill Assessment & Calculate Gaps
// ==========================================
router.post('/assessments/self', requireAuth, (req, res) => {
  const parsed = selfAssessmentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid assessment input.' });
  }

  const { occupationId, ratings } = parsed.data;
  const userId = req.user.id;

  try {
    const occ = db.prepare('SELECT * FROM occupations WHERE id = ?').get(occupationId);
    if (!occ) {
      return res.status(404).json({ error: 'Selected occupation not found.' });
    }

    const occSkills = db
      .prepare(`
        SELECT s.id, s.name, s.category, s.required_proficiency, os.is_required, os.weight
        FROM occupation_skills os
        JOIN skills s ON s.id = os.skill_id
        WHERE os.occupation_id = ?
      `)
      .all(occupationId);

    const skillLookup = new Map(occSkills.map((s) => [s.id, s]));

    const upsertAssessment = db.prepare(`
      INSERT INTO user_skill_assessments (
        id, user_id, occupation_id, skill_id, self_rating, verification_status, updated_at
      )
      VALUES (?, ?, ?, ?, ?, 'self_assessed', datetime('now'))
      ON CONFLICT(user_id, occupation_id, skill_id) DO UPDATE SET
        self_rating = excluded.self_rating,
        verification_status = CASE
          WHEN user_skill_assessments.verification_status = 'verified' THEN 'verified'
          ELSE 'self_assessed'
        END,
        updated_at = datetime('now')
    `);

    let achievedPoints = 0;
    let maxPoints = 0;
    const missingSkills = [];
    const weakSkills = [];
    const strongSelfAssessedSkills = [];
    const skillBreakdown = [];

    db.exec('BEGIN TRANSACTION;');
    try {
      for (const entry of ratings) {
        const meta = skillLookup.get(entry.skillId);
        if (!meta) continue;

        const requiredLevel = Number(meta.required_proficiency || 4);
        const weight = Number(meta.weight || 1);
        const rating = Number(entry.rating);

        upsertAssessment.run(
          `usa-${crypto.randomUUID()}`,
          userId,
          occupationId,
          entry.skillId,
          rating
        );

        achievedPoints += Math.min(rating, requiredLevel) * weight;
        maxPoints += requiredLevel * weight;

        let gapStatus = 'strong_self_assessed';
        if (rating <= 2) {
          gapStatus = 'missing';
          missingSkills.push(meta.name);
        } else if (rating < requiredLevel) {
          gapStatus = 'weak';
          weakSkills.push(meta.name);
        } else {
          strongSelfAssessedSkills.push(meta.name);
        }
        isGap: gapStatus !== 'strong_self_assessed',

        skillBreakdown.push({
          id: meta.id,
          name: meta.name,
          category: meta.category,
          selfRating: rating,
          requiredProficiency: requiredLevel,
          proficiencyPercentage: Math.round((rating / 5) * 100),
          targetBenchmarkPercentage: Math.round((requiredLevel / 5) * 100),
          gapStatus,
          isGap: gapStatus === 'missing' || gapStatus === 'weak',
          // Self-assessment is NEVER treated as verified expertise
          verificationStatus: 'self_assessed',
        });
      }

      const baselineReadiness = maxPoints > 0 ? Math.round((achievedPoints / maxPoints) * 100) : 0;

      db.prepare(`
        INSERT INTO student_profiles (
          user_id, target_role_id, target_role_title, profession, domain_id,
          seniority, readiness_percentage, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          target_role_id = excluded.target_role_id,
          target_role_title = excluded.target_role_title,
          profession = excluded.profession,
          domain_id = excluded.domain_id,
          seniority = excluded.seniority,
          readiness_percentage = excluded.readiness_percentage,
          updated_at = datetime('now')
      `).run(
        userId,
        occ.id,
        occ.title,
        occ.category,
        occ.domain,
        occ.seniority,
        baselineReadiness
      );

      db.prepare(`
        INSERT INTO activity_history (id, user_id, activity_type, metadata_json)
        VALUES (?, ?, 'self_assessment_submitted', ?)
      `).run(
        `act-${crypto.randomUUID()}`,
        userId,
        JSON.stringify({
          occupationId: occ.id,
          occupationTitle: occ.title,
          baselineReadiness,
          missingCount: missingSkills.length,
          weakCount: weakSkills.length,
        })
      );

      db.exec('COMMIT;');

      return res.json({
        success: true,
        occupation: {
          id: occ.id,
          title: occ.title,
          category: occ.category,
          domain: occ.domain,
          seniority: occ.seniority,
        },
        summary: {
          baselineReadiness,
          totalSkills: skillBreakdown.length,
          missingCount: missingSkills.length,
          weakCount: weakSkills.length,
          strongSelfAssessedCount: strongSelfAssessedSkills.length,
          missingSkills,
          weakSkills,
          strongSelfAssessedSkills,
          verificationNotice:
            'Self-assessment builds your baseline gap profile. Complete Skill Checks and Projects to earn Verified status.',
        },
        skills: skillBreakdown,
      });
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }
  } catch (err) {
    console.error('[Self Assessment Submit Error]:', err.message);
    return res.status(500).json({ error: 'Failed to save skill assessment.' });
  }
});

// ==========================================
// 4. GET /api/assessments/me — Hydrate Student's Real Saved Career & Skills
// ==========================================
router.get('/assessments/me', requireAuth, (req, res) => {
  try {
    const userId = req.user.id;
    const profileRow = db
      .prepare('SELECT * FROM student_profiles WHERE user_id = ?')
      .get(userId);

    if (!profileRow || !profileRow.target_role_id) {
      return res.json({
        success: true,
        hasSelectedCareer: false,
        profile: null,
        skills: [],
      });
    }

    const occ = db
      .prepare('SELECT * FROM occupations WHERE id = ?')
      .get(profileRow.target_role_id);

    const assessedRows = db
      .prepare(`
        SELECT
          s.id, s.name, s.category, s.required_proficiency,
          usa.self_rating, usa.verified_score, usa.verification_status, usa.updated_at
        FROM user_skill_assessments usa
        JOIN skills s ON s.id = usa.skill_id
        WHERE usa.user_id = ? AND usa.occupation_id = ?
        ORDER BY usa.self_rating ASC, s.name ASC
      `)
      .all(userId, profileRow.target_role_id);

    const skills = assessedRows.map((row) => {
     const rating =
  row.self_rating !== null && row.self_rating !== undefined ? Number(row.self_rating) : 0;
const reqLevel = Number(row.required_proficiency || 4);
const gapStatus =
  rating === 0
    ? 'not_started'
    : rating <= 2
      ? 'missing'
      : rating < reqLevel
        ? 'weak'
        : 'strong_self_assessed';
        

      return {
        id: row.id,
        name: row.name,
        category: row.category,
        selfRating: rating,
        requiredProficiency: reqLevel,
        proficiencyPercentage:
          row.verification_status === 'verified' && row.verified_score !== null
            ? Number(row.verified_score)
            : Math.round((rating / 5) * 100),
        targetBenchmarkPercentage: Math.round((reqLevel / 5) * 100),
        gapStatus,
        isGap: gapStatus === 'missing' || gapStatus === 'weak',
        verificationStatus: row.verification_status || 'self_assessed',
        updatedAt: row.updated_at,
      };
    });

    return res.json({
      success: true,
      hasSelectedCareer: true,
      profile: {
        targetRoleId: profileRow.target_role_id,
        targetRoleTitle: profileRow.target_role_title,
        profession: profileRow.profession,
        domainId: profileRow.domain_id,
        seniority: profileRow.seniority,
        readinessPercentage: Number(profileRow.readiness_percentage || 0),
        weeklyCommitmentHours: Number(profileRow.weekly_commitment_hours || 10),
        sourceAttribution: occ?.source_attribution || '',
      },
      skills,
    });
  } catch (err) {
    console.error('[Get My Assessment Error]:', err.message);
    return res.status(500).json({ error: 'Unable to load saved assessment profile.' });
  }
});

module.exports = router;