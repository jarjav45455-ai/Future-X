const crypto = require('crypto');

const DIFFICULTY_RANK = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

const PHASE_THEMES = [
  { label: 'Core Foundations', category: 'Foundations' },
  { label: 'Essential Tooling & Mechanics', category: 'Core Execution' },
  { label: 'Applied Domain Workflows', category: 'Applied Practice' },
  { label: 'Systems Integration & Depth', category: 'Intermediate Mastery' },
  { label: 'Advanced Engineering & Edge Cases', category: 'Specialization' },
  { label: 'Production Architecture & Capstone', category: 'Capstone' },
];

/**
 * Topological DAG Sort (Kahn's Algorithm) with Importance & Difficulty Tie-Breaking
 */
function topologicalSortSkills(skills, prereqMap) {
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const inDegree = new Map();
  const adj = new Map();

  for (const s of skills) {
    inDegree.set(s.id, 0);
    adj.set(s.id, []);
  }

  for (const s of skills) {
    const prereqs = prereqMap.get(s.id) || [];
    for (const p of prereqs) {
      if (skillById.has(p.id)) {
        adj.get(p.id).push(s.id);
        inDegree.set(s.id, (inDegree.get(s.id) || 0) + 1);
      }
    }
  }

  const sortPriority = (aId, bId) => {
    const a = skillById.get(aId);
    const b = skillById.get(bId);
    // 1. Beginner -> Intermediate -> Advanced
    const diffA = DIFFICULTY_RANK[a.difficultyLevel] ?? 1;
    const diffB = DIFFICULTY_RANK[b.difficultyLevel] ?? 1;
    if (diffA !== diffB) return diffA - diffB;
    // 2. Required / High-importance skills first
    if (a.isRequired !== b.isRequired) return a.isRequired ? -1 : 1;
    // 3. Bigger gap (lower rating) prioritized earlier within same tier
    return (a.selfRating ?? 0) - (b.selfRating ?? 0);
  };

  const queue = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) queue.push(id);
  }
  queue.sort(sortPriority);

  const ordered = [];
  const depthMap = new Map();

  while (queue.length > 0) {
    const curr = queue.shift();
    ordered.push(skillById.get(curr));
    const currDepth = depthMap.get(curr) || 0;

    for (const nextId of adj.get(curr) || []) {
      depthMap.set(nextId, Math.max(depthMap.get(nextId) || 0, currDepth + 1));
      const newDeg = (inDegree.get(nextId) || 1) - 1;
      inDegree.set(nextId, newDeg);
      if (newDeg === 0) {
        queue.push(nextId);
        queue.sort(sortPriority);
      }
    }
  }

  // Safety fallback if any cycle existed
  if (ordered.length < skills.length) {
    const seen = new Set(ordered.map((s) => s.id));
    for (const s of skills) {
      if (!seen.has(s.id)) ordered.push(s);
    }
  }

  return { ordered, depthMap };
}

/**
 * Generates a dynamic, prerequisite-ordered, 100% skill-covered roadmap from SQLite
 */
function generateAdaptiveRoadmap(db, occupation, rawSkills, skillRatings = [], userId = null) {
  const ratingById = new Map();
  const ratingByName = new Map();

  for (const r of Array.isArray(skillRatings) ? skillRatings : []) {
    if (r.id) ratingById.set(r.id, Number(r.rating ?? 0));
    if (r.name) ratingByName.set(String(r.name).toLowerCase(), Number(r.rating ?? 0));
  }

  // Fetch DAG prerequisite edges for these skills
  const prereqStmt = db.prepare(`
    SELECT s.id, s.name
    FROM skill_prerequisites sp
    JOIN skills s ON s.id = sp.prerequisite_skill_id
    WHERE sp.skill_id = ?
  `);

  const prereqMap = new Map();
  const enrichedSkills = rawSkills.map((sk) => {
    const prereqs = prereqStmt.all(sk.id);
    prereqMap.set(sk.id, prereqs);

    let selfRating = 0;
    if (ratingById.has(sk.id)) {
      selfRating = ratingById.get(sk.id);
    } else if (ratingByName.has(sk.name.toLowerCase())) {
      selfRating = ratingByName.get(sk.name.toLowerCase());
    }

    const target = Number(sk.requiredProficiency || 4);
    const deficit = Math.max(0, target - selfRating);

    return {
      ...sk,
      selfRating,
      requiredProficiency: target,
      deficit,
      isMasteredBaseline: selfRating >= target,
      prerequisites: prereqs.map((p) => p.name),
    };
  });

  // Topological sort all career skills
  const { ordered } = topologicalSortSkills(enrichedSkills, prereqMap);

  const activeSkills = ordered.filter((s) => !s.isMasteredBaseline);
  const fastTrackedSkills = ordered.filter((s) => s.isMasteredBaseline);

  // If user already rated ALL skills >= target, still build a 2-phase Verification & Capstone roadmap
  const skillsToSchedule = activeSkills.length > 0 ? activeSkills : ordered;

  // Dynamically chunk into phases based on skill count & importance (2 skills per phase; high-deficit advanced skills can get solo focus)
  const phaseBuckets = [];
  let currentBucket = [];

  for (const sk of skillsToSchedule) {
    const isHeavyAdvanced =
      sk.difficultyLevel === 'Advanced' && sk.isRequired && sk.deficit >= 3;

    if (isHeavyAdvanced && currentBucket.length > 0) {
      phaseBuckets.push(currentBucket);
      currentBucket = [sk];
      phaseBuckets.push(currentBucket);
      currentBucket = [];
      continue;
    }

    currentBucket.push(sk);

    // Max 2 skills per phase so every phase stays deep, focused, and achievable
    if (currentBucket.length >= 2) {
      phaseBuckets.push(currentBucket);
      currentBucket = [];
    }
  }
  if (currentBucket.length > 0) {
    phaseBuckets.push(currentBucket);
  }

  // Build structured Phase objects
  const phases = phaseBuckets.map((bucket, idx) => {
    const theme = PHASE_THEMES[Math.min(idx, PHASE_THEMES.length - 1)];
    const stepNumber = idx + 1;

    // Dynamic duration based on total deficit points in this phase
    const totalDeficit = bucket.reduce((sum, s) => sum + Math.max(1, s.deficit), 0);
    const weeksMin = Math.max(1, Math.round(totalDeficit * 0.6));
    const weeksMax = weeksMin + 1;

    // Collect unique prerequisites needed before this phase
    const bucketNames = new Set(bucket.map((s) => s.name));
    const externalPrereqs = Array.from(
      new Set(
        bucket
          .flatMap((s) => s.prerequisites || [])
          .filter((pName) => !bucketNames.has(pName))
      )
    );

    const primarySkill = bucket[0];
    const phaseTitle =
      bucket.length === 1
        ? `Phase ${stepNumber}: Deep Mastery — ${primarySkill.name}`
        : `Phase ${stepNumber}: ${theme.label}`;

    return {
      id: `phase-${occupation.id}-${stepNumber}`,
      stepNumber,
      title: phaseTitle,
      subtitle: bucket.map((s) => s.name).join(' • '),
      category: primarySkill.category || theme.category,
      duration: `${weeksMin}-${weeksMax} Weeks`,
      deliverable:
        stepNumber === phaseBuckets.length
          ? `${occupation.title} End-to-End Capstone & ProofPass Verification`
          : `Hands-On Deliverable applying ${bucket.map((s) => s.name).join(' + ')}`,
      prerequisites:
        externalPrereqs.length > 0
          ? externalPrereqs
          : stepNumber === 1
            ? ['0–5 Baseline Assessment']
            : [`Phase ${stepNumber - 1} Mastery (>=90%)`],
      status: stepNumber === 1 ? 'current' : 'upcoming',
      assessmentUnlocked: stepNumber === 1,
      skills: bucket.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        difficultyLevel: s.difficultyLevel,
        selfRating: s.selfRating,
        requiredProficiency: s.requiredProficiency,
        deficit: s.deficit,
        whyItMatters: s.whyItMatters || s.description || '',
        isRequired: Boolean(s.isRequired),
      })),
    };
  });

  // Persist to SQLite roadmaps & roadmap_phases if userId is logged in
  if (userId) {
    try {
      db.exec('BEGIN TRANSACTION;');
      db.prepare('UPDATE roadmaps SET is_active = 0 WHERE user_id = ?').run(userId);
      const roadmapId = `rm-${crypto.randomUUID()}`;
      db.prepare(`
        INSERT INTO roadmaps (id, user_id, occupation_id, is_active)
        VALUES (?, ?, ?, 1)
      `).run(roadmapId, userId, occupation.id);

      const insertPhase = db.prepare(`
        INSERT INTO roadmap_phases (
          id, roadmap_id, step_number, title, subtitle, category,
          duration, deliverable, prerequisites_json, status, assessment_unlocked
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const p of phases) {
        insertPhase.run(
          `${roadmapId}-p${p.stepNumber}`,
          roadmapId,
          p.stepNumber,
          p.title,
          p.subtitle,
          p.category,
          p.duration,
          p.deliverable,
          JSON.stringify(p.prerequisites || []),
          p.status,
          p.assessmentUnlocked ? 1 : 0
        );
      }
      db.exec('COMMIT;');
    } catch (err) {
      db.exec('ROLLBACK;');
      console.warn('[Roadmap Persist Warning]:', err.message);
    }
  }

  return {
    totalPhases: phases.length,
    totalSkillsCovered: ordered.length,
    fastTrackedSkills: fastTrackedSkills.map((s) => ({
      id: s.id,
      name: s.name,
      selfRating: s.selfRating,
      requiredProficiency: s.requiredProficiency,
    })),
    roadmap: phases,
  };
}

module.exports = {
  generateAdaptiveRoadmap,
};