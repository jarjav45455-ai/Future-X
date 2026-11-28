const crypto = require('crypto');
const { ensureCareerPhaseQuestions } = require('../db/seedQuestionBank');

const PASS_THRESHOLD = 27; // 90% of 30
const EXAM_SIZE = 30;
const MAX_DEFAULT_PHASES = 3;

function secureShuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getOrInitProgress(db, userId, careerId) {
  let row = db
    .prepare('SELECT * FROM student_phase_progress WHERE user_id = ? AND career_id = ?')
    .get(userId, careerId);

  if (!row) {
    db.prepare(`
      INSERT OR IGNORE INTO student_phase_progress (user_id, career_id, current_phase, status)
      VALUES (?, ?, 1, 'in_progress')
    `).run(userId, careerId);
    row = db
      .prepare('SELECT * FROM student_phase_progress WHERE user_id = ? AND career_id = ?')
      .get(userId, careerId);
  }
  return row;
}

/**
 * Generates a 30-question randomized exam (Unseen-first, LRU fallback, zero duplicates).
 * Never exposes answer_key or license to the student client.
 */
function generatePhaseExam(db, userId, careerId, phaseId) {
  const targetPhase = Number(phaseId || 1);

  // Enforce no phase skipping
  const progress = getOrInitProgress(db, userId, careerId);
  if (targetPhase > Number(progress.current_phase)) {
    const err = new Error(`Phase ${targetPhase} is locked. Pass Phase ${progress.current_phase} (>=90%) first.`);
    err.statusCode = 403;
    throw err;
  }

  // Ensure question bank exists for this career-phase
  ensureCareerPhaseQuestions(db, careerId, targetPhase);

  const allQuestions = db
    .prepare(`
      SELECT q.id, q.career_id, q.phase_id, q.skill_id, q.text, q.type, q.options, q.difficulty, s.name AS skill_name
      FROM questions q
      JOIN skills s ON s.id = q.skill_id
      WHERE q.career_id = ? AND q.phase_id = ?
    `)
    .all(careerId, targetPhase);

  if (allQuestions.length < EXAM_SIZE) {
    const err = new Error(
      `Insufficient question bank for career "${careerId}" Phase ${targetPhase} (${allQuestions.length}/${EXAM_SIZE}). Admin review required.`
    );
    err.statusCode = 422;
    throw err;
  }

  // Fetch student's previously seen question IDs ordered by most recent usage
  const seenRows = db
    .prepare(`
      SELECT aqa.question_id, MAX(aa.timestamp) AS last_used
      FROM attempt_question_answers aqa
      JOIN assessment_attempts aa ON aa.id = aqa.attempt_id
      WHERE aa.user_id = ? AND aa.career_id = ? AND aa.phase_id = ?
      GROUP BY aqa.question_id
    `)
    .all(userId, careerId, targetPhase);

  const seenMap = new Map(seenRows.map((r) => [r.question_id, r.last_used]));

  const unseen = secureShuffle(allQuestions.filter((q) => !seenMap.has(q.id)));
  const seenLRU = allQuestions
    .filter((q) => seenMap.has(q.id))
    .sort((a, b) => String(seenMap.get(a.id)).localeCompare(String(seenMap.get(b.id))));

  // Pick unseen first, then least-recently-used to reach exactly 30 unique questions
  const selected = [];
  const usedIds = new Set();

  for (const q of [...unseen, ...seenLRU]) {
    if (selected.length >= EXAM_SIZE) break;
    if (!usedIds.has(q.id)) {
      usedIds.add(q.id);
      selected.push(q);
    }
  }

  const finalShuffled = secureShuffle(selected).map((q) => {
    let parsedOpts = [];
    try {
      parsedOpts = JSON.parse(q.options || '[]');
    } catch {
      parsedOpts = [];
    }
    return {
      id: q.id,
      skillId: q.skill_id,
      skillName: q.skill_name,
      difficulty: q.difficulty,
      type: q.type,
      text: q.text,
      options: secureShuffle(parsedOpts),
    };
  });

  return {
    careerId,
    phaseId: targetPhase,
    totalQuestions: finalShuffled.length,
    passThreshold: PASS_THRESHOLD,
    questions: finalShuffled,
  };
}

/**
 * Server-side grading + atomic phase unlock (never downgrades highest unlocked phase on retake)
 */
function submitPhaseExam(db, userId, careerId, phaseId, answers = [], totalCareerPhases = MAX_DEFAULT_PHASES) {
  const targetPhase = Number(phaseId || 1);
  if (!Array.isArray(answers) || answers.length === 0) {
    const err = new Error('Answers array is required.');
    err.statusCode = 400;
    throw err;
  }

  const qStmt = db.prepare(`
    SELECT q.id, q.answer_key, q.skill_id, s.name AS skill_name
    FROM questions q
    JOIN skills s ON s.id = q.skill_id
    WHERE q.id = ? AND q.career_id = ? AND q.phase_id = ?
  `);

  let score = 0;
  const skillStats = new Map();
  const gradedAnswers = [];

  for (const ans of answers) {
    const qRow = qStmt.get(ans.questionId, careerId, targetPhase);
    if (!qRow) continue;

    const selected = String(ans.selectedAnswer ?? '').trim();
    const isCorrect = selected === String(qRow.answer_key).trim();
    if (isCorrect) score++;

    gradedAnswers.push({
      questionId: qRow.id,
      selectedAnswer: selected,
      isCorrect: isCorrect ? 1 : 0,
    });

    const stat = skillStats.get(qRow.skill_name) || { total: 0, correct: 0 };
    stat.total += 1;
    if (isCorrect) stat.correct += 1;
    skillStats.set(qRow.skill_name, stat);
  }

  const passed = score >= PASS_THRESHOLD;
  const missingSkills = [];
  const skillBreakdown = [];

  for (const [skillName, st] of skillStats.entries()) {
    const pct = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
    skillBreakdown.push({ skill: skillName, correct: st.correct, total: st.total, percentage: pct });
    if (pct < 80) missingSkills.push(skillName);
  }

  const attemptId = `att-${crypto.randomUUID()}`;

  // Atomic transaction: save attempt + answers + update highest phase progress
  let updatedProgress;
  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      INSERT INTO assessment_attempts (id, user_id, career_id, phase_id, score, passed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(attemptId, userId, careerId, targetPhase, score, passed ? 1 : 0);

    const insertAns = db.prepare(`
      INSERT INTO attempt_question_answers (id, attempt_id, question_id, selected_answer, is_correct)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const ga of gradedAnswers) {
      insertAns.run(`aqa-${crypto.randomUUID()}`, attemptId, ga.questionId, ga.selectedAnswer, ga.isCorrect);
    }

    const currentProg = getOrInitProgress(db, userId, careerId);
    let nextPhase = Number(currentProg.current_phase);
    let nextStatus = currentProg.status;

    if (passed) {
      if (targetPhase >= Number(totalCareerPhases)) {
        nextPhase = Math.max(nextPhase, targetPhase);
        nextStatus = 'complete';
      } else {
        // Retain highest unlocked phase — never downgrade on retake
        nextPhase = Math.max(nextPhase, targetPhase + 1);
      }

      db.prepare(`
        UPDATE student_phase_progress
        SET current_phase = ?, status = ?, updated_at = datetime('now')
        WHERE user_id = ? AND career_id = ?
      `).run(nextPhase, nextStatus, userId, careerId);
    }

    updatedProgress = { currentPhase: nextPhase, status: nextStatus };
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  const feedback = passed
    ? updatedProgress.status === 'complete'
      ? 'All phases complete! Full career mastery verified.'
      : 'Phase complete. Next phase unlocked.'
    : `Required mastery not reached (${score}/30; need ${PASS_THRESHOLD}/30); review ${missingSkills.length ? missingSkills.join(', ') : 'core phase concepts'}.`;

  return {
    attemptId,
    careerId,
    phaseId: targetPhase,
    score,
    totalQuestions: EXAM_SIZE,
    percentage: Math.round((score / EXAM_SIZE) * 100),
    passed,
    missingSkills,
    skillBreakdown,
    feedback,
    progress: updatedProgress,
  };
}

function getStudentAssessmentHistory(db, userId, careerId) {
  const progress = getOrInitProgress(db, userId, careerId);
  const attempts = db
    .prepare(`
      SELECT id, phase_id AS phaseId, score, passed, timestamp
      FROM assessment_attempts
      WHERE user_id = ? AND career_id = ?
      ORDER BY timestamp DESC
      LIMIT 30
    `)
    .all(userId, careerId)
    .map((a) => ({
      ...a,
      passed: Boolean(a.passed),
    }));

  return {
    careerId,
    currentPhase: Number(progress.current_phase),
    status: progress.status,
    attempts,
  };
}

module.exports = {
  PASS_THRESHOLD,
  EXAM_SIZE,
  generatePhaseExam,
  submitPhaseExam,
  getStudentAssessmentHistory,
};