function runAssessmentMigrationV5(db) {
  const versionRow = db.prepare('PRAGMA user_version').get();
  const currentVersion = versionRow ? Number(versionRow.user_version) : 0;

  if (currentVersion < 5) {
    console.log('[FutureX SQLite] Running Migration v5 (30-Question Phase Exam System)...');

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Open-License Question Provenance Sources
      db.exec(`
        CREATE TABLE IF NOT EXISTS question_source (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          license TEXT NOT NULL,
          added_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      // 2. Career-Phase Questions (Reuses occupations.id & skills.id)
      db.exec(`
        CREATE TABLE IF NOT EXISTS questions (
          id TEXT PRIMARY KEY,
          career_id TEXT NOT NULL,
          phase_id INTEGER NOT NULL,
          skill_id TEXT NOT NULL,
          text TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'mcq',
          options TEXT NOT NULL,
          answer_key TEXT NOT NULL,
          difficulty TEXT NOT NULL DEFAULT 'Intermediate',
          source_id TEXT NOT NULL,
          license TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (career_id) REFERENCES occupations(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
          FOREIGN KEY (source_id) REFERENCES question_source(id) ON DELETE RESTRICT
        );

        CREATE INDEX IF NOT EXISTS idx_q_career_phase ON questions(career_id, phase_id);
        CREATE INDEX IF NOT EXISTS idx_q_skill ON questions(skill_id);
      `);

      // 3. Assessment Blueprint (Skill -> Question Count Distribution)
      db.exec(`
        CREATE TABLE IF NOT EXISTS assessment_blueprint (
          id TEXT PRIMARY KEY,
          career_id TEXT NOT NULL,
          phase_id INTEGER NOT NULL,
          skill_distribution_json TEXT NOT NULL,
          total_questions INTEGER NOT NULL DEFAULT 30,
          UNIQUE (career_id, phase_id),
          FOREIGN KEY (career_id) REFERENCES occupations(id) ON DELETE CASCADE
        );
      `);

      // 4. Student Exam Attempts
      db.exec(`
        CREATE TABLE IF NOT EXISTS assessment_attempts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          career_id TEXT NOT NULL,
          phase_id INTEGER NOT NULL,
          score INTEGER NOT NULL DEFAULT 0,
          passed INTEGER NOT NULL DEFAULT 0 CHECK (passed IN (0, 1)),
          timestamp TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (career_id) REFERENCES occupations(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_att_user_career ON assessment_attempts(user_id, career_id, phase_id);
      `);

      // 5. Individual Question Answers Snapshot per Attempt
      db.exec(`
        CREATE TABLE IF NOT EXISTS attempt_question_answers (
          id TEXT PRIMARY KEY,
          attempt_id TEXT NOT NULL,
          question_id TEXT NOT NULL,
          selected_answer TEXT NOT NULL,
          is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
          FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_aqa_attempt ON attempt_question_answers(attempt_id);
      `);

      // 6. Highest Unlocked Phase Progress (Never downgrades on retake)
      db.exec(`
        CREATE TABLE IF NOT EXISTS student_phase_progress (
          user_id TEXT NOT NULL,
          career_id TEXT NOT NULL,
          current_phase INTEGER NOT NULL DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'complete')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (user_id, career_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (career_id) REFERENCES occupations(id) ON DELETE CASCADE
        );
      `);

      db.exec('PRAGMA user_version = 5;');
      db.exec('COMMIT;');
      console.log('[FutureX SQLite] Migration v5 completed.');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
}

function rollbackAssessmentMigrationV5(db) {
  db.exec('BEGIN TRANSACTION;');
  try {
    db.exec(`
      DROP TABLE IF EXISTS attempt_question_answers;
      DROP TABLE IF EXISTS assessment_attempts;
      DROP TABLE IF EXISTS student_phase_progress;
      DROP TABLE IF EXISTS assessment_blueprint;
      DROP TABLE IF EXISTS questions;
      DROP TABLE IF EXISTS question_source;
      PRAGMA user_version = 4;
    `);
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

module.exports = {
  runAssessmentMigrationV5,
  rollbackAssessmentMigrationV5,
};