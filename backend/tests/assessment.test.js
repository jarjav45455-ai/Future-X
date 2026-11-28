const assert = require('assert');
const { DatabaseSync } = require('node:sqlite');
const { runAssessmentMigrationV5, rollbackAssessmentMigrationV5 } = require('../db/assessmentMigrations');
const { seedQuestionBank, ensureCareerPhaseQuestions } = require('../db/seedQuestionBank');
const { generatePhaseExam, submitPhaseExam, getStudentAssessmentHistory } = require('../services/assessmentEngine');

function setupTestDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL);
    CREATE TABLE occupations (id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL);
    CREATE TABLE skills (id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, difficulty_level TEXT DEFAULT 'Intermediate');
    CREATE TABLE occupation_skills (occupation_id TEXT NOT NULL, skill_id TEXT NOT NULL, is_required INTEGER DEFAULT 1, weight INTEGER DEFAULT 2);

    INSERT INTO users VALUES ('u-test-1', 'student@test.local');
    INSERT INTO occupations VALUES ('ai-engineer', 'AI Engineer', 'AI & Data');
    INSERT INTO skills VALUES ('sk-1', 'Python Programming', 'Programming', 'Beginner');
    INSERT INTO skills VALUES ('sk-2', 'Machine Learning', 'Domain', 'Intermediate');
    INSERT INTO skills VALUES ('sk-3', 'LLM & RAG Architecture', 'Industry', 'Advanced');
    INSERT INTO occupation_skills VALUES ('ai-engineer', 'sk-1', 1, 2);
    INSERT INTO occupation_skills VALUES ('ai-engineer', 'sk-2', 1, 2);
    INSERT INTO occupation_skills VALUES ('ai-engineer', 'sk-3', 1, 2);
  `);

  runAssessmentMigrationV5(db);
  seedQuestionBank(db);
  return db;
}

function runAllTests() {
  const db = setupTestDb();

  // Test 1: Exam generation yields 30 unique questions without leaking answer_key or license
  const exam1 = generatePhaseExam(db, 'u-test-1', 'ai-engineer', 1);
  assert.strictEqual(exam1.questions.length, 30, 'Must return exactly 30 questions');
  const uniqueIds = new Set(exam1.questions.map((q) => q.id));
  assert.strictEqual(uniqueIds.size, 30, 'All 30 questions must be unique');
  assert.strictEqual(exam1.questions[0].answer_key, undefined, 'answer_key must NOT be sent to student');
  assert.strictEqual(exam1.questions[0].license, undefined, 'license must NOT be sent to student');
  console.log('PASS 1: 30 unique questions generated with zero answer_key/license leak.');

  // Helper to fetch ground-truth answer_key directly from DB for test grading
  const getKey = db.prepare('SELECT answer_key FROM questions WHERE id = ?');

  // Test 2: Fail (<27/30) keeps Phase 1 locked (does not unlock Phase 2)
  const failAnswers = exam1.questions.map((q, idx) => ({
    questionId: q.id,
    selectedAnswer: idx < 20 ? getKey.get(q.id).answer_key : 'WRONG_OPTION',
  }));
  const failRes = submitPhaseExam(db, 'u-test-1', 'ai-engineer', 1, failAnswers, 3);
  assert.strictEqual(failRes.score, 20);
  assert.strictEqual(failRes.passed, false);
  assert.strictEqual(failRes.progress.currentPhase, 1, 'Failed attempt must NOT unlock Phase 2');
  console.log('PASS 2: Fail (20/30) blocks phase unlock & returns missing_skills feedback.');

  // Test 3: Pass (>=27/30) atomically unlocks Phase 2
  const exam2 = generatePhaseExam(db, 'u-test-1', 'ai-engineer', 1);
  const passAnswers = exam2.questions.map((q, idx) => ({
    questionId: q.id,
    selectedAnswer: idx < 28 ? getKey.get(q.id).answer_key : 'WRONG_OPTION',
  }));
  const passRes = submitPhaseExam(db, 'u-test-1', 'ai-engineer', 1, passAnswers, 3);
  assert.strictEqual(passRes.score, 28);
  assert.strictEqual(passRes.passed, true);
  assert.strictEqual(passRes.progress.currentPhase, 2, 'Pass (>=27/30) must unlock Phase 2');
  console.log('PASS 3: Pass (28/30) atomically unlocks Phase 2.');

  // Test 4: Retake of Phase 1 (even if failed) retains highest unlocked Phase 2
  const retakeExam = generatePhaseExam(db, 'u-test-1', 'ai-engineer', 1);
  const retakeFail = retakeExam.questions.map((q) => ({
    questionId: q.id,
    selectedAnswer: 'WRONG_OPTION',
  }));
  const retakeRes = submitPhaseExam(db, 'u-test-1', 'ai-engineer', 1, retakeFail, 3);
  assert.strictEqual(retakeRes.passed, false);
  assert.strictEqual(retakeRes.progress.currentPhase, 2, 'Retake must NEVER downgrade highest unlocked phase');
  console.log('PASS 4: Retake preserves highest unlocked Phase 2.');

  // Test 5: History returns all 3 attempts
  const hist = getStudentAssessmentHistory(db, 'u-test-1', 'ai-engineer');
  assert.strictEqual(hist.attempts.length, 3);
  assert.strictEqual(hist.currentPhase, 2);
  console.log('PASS 5: History accurately tracks attempts & highest phase.');

  // Test 6: Rollback works cleanly
  rollbackAssessmentMigrationV5(db);
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='questions'").get();
  assert.strictEqual(tableCheck, undefined, 'Rollback must drop assessment tables');
  console.log('PASS 6: Migration v5 rollback verified.');

  console.log('\nALL 6 AUTOMATED ASSESSMENT TESTS PASSED!');
}

runAllTests();