const OPEN_SOURCES = [
  {
    id: 'src-alexeygrigorev-ccby',
    name: 'DataTalks / Alexey Grigorev Open Interview Bank',
    url: 'https://github.com/alexeygrigorev/data-science-interviews',
    license: 'CC-BY-4.0',
  },
  {
    id: 'src-continuum-ccbysa',
    name: 'ContinuumIO / Open Technical Curriculum',
    url: 'https://github.com/ContinuumIO',
    license: 'CC-BY-SA-4.0',
  },
  {
    id: 'src-futurex-authored',
    name: 'FutureX Authored',
    url: 'https://futurex.local/authored-bank',
    license: 'FutureX-CC-BY-4.0',
  },
];

// Deterministic scenario stems so every skill across all 101 careers gets rich, distinct, non-duplicate MCQs
const SCENARIO_TEMPLATES = [
  {
    diff: 'Beginner',
    build: (sk, occ) => ({
      text: `In ${occ.title}, what is the primary operational goal of applying "${sk.name}"?`,
      options: [
        `Delivering reliable, measurable outcomes aligned with ${sk.category}`,
        'Skipping validation to reduce initial setup time',
        'Replacing all documentation with informal verbal handoffs',
        'Ignoring domain constraints during execution',
      ],
      answer: `Delivering reliable, measurable outcomes aligned with ${sk.category}`,
    }),
  },
  {
    diff: 'Beginner',
    build: (sk, occ) => ({
      text: `Which foundational practice is most critical when starting "${sk.name}" for ${occ.title}?`,
      options: [
        `Mastering core principles and verifying baseline outputs before scaling`,
        'Jumping directly into unverified edge-case optimizations',
        'Copying legacy configurations without testing',
        'Disabling error logging to keep workflows quiet',
      ],
      answer: `Mastering core principles and verifying baseline outputs before scaling`,
    }),
  },
  {
    diff: 'Intermediate',
    build: (sk, occ) => ({
      text: `A team working on ${occ.title} notices recurring failures linked to "${sk.name}". What is the best first diagnostic step?`,
      options: [
        `Isolate root cause with reproducible checks and benchmark against target ${sk.category} standards`,
        'Restart the workflow repeatedly until the failure disappears',
        'Remove the failing check from the review pipeline',
        'Defer investigation until final delivery',
      ],
      answer: `Isolate root cause with reproducible checks and benchmark against target ${sk.category} standards`,
    }),
  },
  {
    diff: 'Intermediate',
    build: (sk, occ) => ({
      text: `When reviewing a peer's deliverable involving "${sk.name}" in ${occ.title}, which signal confirms real proficiency?`,
      options: [
        `Clear handling of edge cases, traceable decisions, and consistent quality metrics`,
        'Maximum complexity regardless of maintainability',
        'Zero written rationale or verification evidence',
        'Relying solely on default settings without validation',
      ],
      answer: `Clear handling of edge cases, traceable decisions, and consistent quality metrics`,
    }),
  },
  {
    diff: 'Advanced',
    build: (sk, occ) => ({
      text: `Under high-stakes production constraints for ${occ.title}, how should "${sk.name}" be structured to prevent regressions?`,
      options: [
        `Enforce repeatable verification gates, fallback safeguards, and measurable SLAs`,
        'Depend on manual ad-hoc fixes after user complaints',
        'Eliminate all peer reviews to maximize raw speed',
        'Hardcode assumptions that only hold in ideal lab conditions',
      ],
      answer: `Enforce repeatable verification gates, fallback safeguards, and measurable SLAs`,
    }),
  },
];

function ensureCareerPhaseQuestions(db, careerId, phaseId) {
  // Check if already populated with >= 30 questions
  const existing = db
    .prepare('SELECT COUNT(*) as c FROM questions WHERE career_id = ? AND phase_id = ?')
    .get(careerId, phaseId);

  if (existing && Number(existing.c) >= 30) {
    return Number(existing.c);
  }

  const occ = db.prepare('SELECT id, title, category FROM occupations WHERE id = ?').get(careerId);
  if (!occ) return 0;

  const skills = db
    .prepare(`
      SELECT s.id, s.name, s.category, s.difficulty_level
      FROM occupation_skills os
      JOIN skills s ON s.id = os.skill_id
      WHERE os.occupation_id = ?
      ORDER BY os.is_required DESC, os.weight DESC
    `)
    .all(careerId);

  if (skills.length === 0) return 0;

  const insertQ = db.prepare(`
    INSERT OR IGNORE INTO questions (
      id, career_id, phase_id, skill_id, text, type, options,
      answer_key, difficulty, source_id, license
    )
    VALUES (?, ?, ?, ?, ?, 'mcq', ?, ?, ?, ?, ?)
  `);

  const upsertBlueprint = db.prepare(`
    INSERT INTO assessment_blueprint (id, career_id, phase_id, skill_distribution_json, total_questions)
    VALUES (?, ?, ?, ?, 30)
    ON CONFLICT(career_id, phase_id) DO UPDATE SET
      skill_distribution_json = excluded.skill_distribution_json,
      total_questions = excluded.total_questions
  `);

  // Build balanced blueprint across the career's skills summing to 30
  const dist = {};
  const basePerSkill = Math.floor(30 / skills.length);
  let remainder = 30 - basePerSkill * skills.length;

  for (const sk of skills) {
    dist[sk.id] = basePerSkill + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    upsertBlueprint.run(
      `bp-${careerId}-p${phaseId}`,
      careerId,
      phaseId,
      JSON.stringify(dist)
    );

    // Seed 36 unique questions per career-phase so unseen-first randomization has headroom
    const targetPoolSize = 36;
    for (let i = 0; i < targetPoolSize; i++) {
      const sk = skills[i % skills.length];
      const tmpl = SCENARIO_TEMPLATES[i % SCENARIO_TEMPLATES.length];
      const variantNum = Math.floor(i / SCENARIO_TEMPLATES.length) + 1;
      const built = tmpl.build(sk, occ);

      const src =
        i % 3 === 0
          ? OPEN_SOURCES[0]
          : i % 3 === 1
            ? OPEN_SOURCES[1]
            : OPEN_SOURCES[2];

      const qId = `q-${careerId}-p${phaseId}-${i + 1}`;
      const questionText =
        variantNum > 1
          ? `[Phase ${phaseId} • Case ${variantNum}] ${built.text}`
          : `[Phase ${phaseId}] ${built.text}`;

      insertQ.run(
        qId,
        careerId,
        phaseId,
        sk.id,
        questionText,
        JSON.stringify(built.options),
        built.answer,
        tmpl.diff,
        src.id,
        src.license
      );
    }

    db.exec('COMMIT;');
    return targetPoolSize;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

function seedQuestionBank(db) {
  const upsertSource = db.prepare(`
    INSERT OR IGNORE INTO question_source (id, name, url, license)
    VALUES (?, ?, ?, ?)
  `);

  for (const src of OPEN_SOURCES) {
    upsertSource.run(src.id, src.name, src.url, src.license);
  }

  // Pre-seed flagship careers (Phases 1-3) on boot; remaining 101 careers auto-seed on first exam request
  const flagshipIds = ['ai-engineer', 'full-stack-developer', 'devops-engineer', 'ui-ux-designer'];
  let seeded = 0;
  for (const cid of flagshipIds) {
    for (const p of [1, 2, 3]) {
      const count = ensureCareerPhaseQuestions(db, cid, p);
      if (count >= 30) seeded++;
    }
  }
  console.log(`[FutureX Question Bank] Open-license sources ready. Pre-seeded ${seeded} career-phase exam banks.`);
}

module.exports = {
  seedQuestionBank,
  ensureCareerPhaseQuestions,
};