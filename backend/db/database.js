const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_DIR = __dirname;
const DB_PATH = path.join(DB_DIR, 'futurex.sqlite');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Performance + Referential Integrity
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

// ==========================================
// VERSIONED DATABASE MIGRATIONS
// ==========================================
function runMigrations() {
  const versionRow = db.prepare('PRAGMA user_version').get();
  const currentVersion = versionRow ? Number(versionRow.user_version) : 0;

  if (currentVersion < 1) {
    console.log('[FutureX SQLite] Running Migration v1 (Core Relational Schema)...');

    db.exec(`
      BEGIN TRANSACTION;

      -- 1. Users & Auth
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        age_group TEXT NOT NULL DEFAULT '18_plus',
        consent_public_profile INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- 2. Student Profiles (No auto-selected career on registration)
      CREATE TABLE IF NOT EXISTS student_profiles (
        user_id TEXT PRIMARY KEY,
        target_role_id TEXT,
        target_role_title TEXT,
        profession TEXT,
        domain_id TEXT,
        seniority TEXT,
        weekly_commitment_hours INTEGER NOT NULL DEFAULT 10,
        readiness_percentage INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- 3. Occupations & Skills Ontology (O*NET / ESCO / NCO Extensible)
      CREATE TABLE IF NOT EXISTS occupations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'General',
        domain TEXT NOT NULL DEFAULT 'General',
        seniority TEXT NOT NULL DEFAULT 'Entry / Junior',
        description TEXT DEFAULT '',
        education_requirements TEXT DEFAULT '',
        source_framework TEXT DEFAULT 'FutureX Curated',
        source_attribution TEXT DEFAULT 'FutureX Ontology',
        is_custom INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL DEFAULT 'Technical Skills',
        description TEXT DEFAULT '',
        why_it_matters TEXT DEFAULT '',
        required_proficiency INTEGER NOT NULL DEFAULT 4,
        difficulty_level TEXT NOT NULL DEFAULT 'Beginner'
      );

      CREATE TABLE IF NOT EXISTS occupation_skills (
        occupation_id TEXT NOT NULL,
        skill_id TEXT NOT NULL,
        is_required INTEGER NOT NULL DEFAULT 1,
        weight INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (occupation_id, skill_id),
        FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      );

      -- 4. Skill Prerequisites (DAG Edges for Phase C)
      CREATE TABLE IF NOT EXISTS skill_prerequisites (
        skill_id TEXT NOT NULL,
        prerequisite_skill_id TEXT NOT NULL,
        PRIMARY KEY (skill_id, prerequisite_skill_id),
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
        FOREIGN KEY (prerequisite_skill_id) REFERENCES skills(id) ON DELETE CASCADE
      );

      -- 5. User Skill Assessments (Separates Self-Assessed vs Verified)
      CREATE TABLE IF NOT EXISTS user_skill_assessments (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        occupation_id TEXT NOT NULL,
        skill_id TEXT NOT NULL,
        self_rating INTEGER CHECK (self_rating BETWEEN 1 AND 5),
        verified_score INTEGER CHECK (verified_score BETWEEN 0 AND 100),
        verification_status TEXT NOT NULL DEFAULT 'self_assessed',
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE (user_id, occupation_id, skill_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
        FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
      );

      -- 6. Roadmaps & Phases
      CREATE TABLE IF NOT EXISTS roadmaps (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        occupation_id TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS roadmap_phases (
        id TEXT PRIMARY KEY,
        roadmap_id TEXT NOT NULL,
        step_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        subtitle TEXT DEFAULT '',
        category TEXT DEFAULT 'Foundations',
        duration TEXT DEFAULT '3 Weeks',
        deliverable TEXT DEFAULT '',
        prerequisites_json TEXT DEFAULT '[]',
        status TEXT NOT NULL DEFAULT 'upcoming',
        assessment_unlocked INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (roadmap_id) REFERENCES roadmaps(id) ON DELETE CASCADE
      );

      -- 7. Projects & Portfolio Evidence
      CREATE TABLE IF NOT EXISTS user_projects (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        occupation_id TEXT,
        title TEXT NOT NULL,
        difficulty TEXT NOT NULL DEFAULT 'BEGINNER',
        milestones_json TEXT NOT NULL DEFAULT '[]',
        evidence_url TEXT DEFAULT '',
        reflection TEXT DEFAULT '',
        verification_type TEXT NOT NULL DEFAULT 'self_reported',
        status TEXT NOT NULL DEFAULT 'in_progress',
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- 8. Opportunities (Verified Sources + Expiry Tracking)
      CREATE TABLE IF NOT EXISTS opportunities (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        organization TEXT NOT NULL,
        category TEXT NOT NULL,
        domain TEXT NOT NULL DEFAULT 'tech',
        description TEXT DEFAULT '',
        required_skills_json TEXT DEFAULT '[]',
        eligibility_notes TEXT DEFAULT '',
        min_age_group TEXT DEFAULT 'all',
        location TEXT DEFAULT 'Remote',
        apply_url TEXT NOT NULL,
        source TEXT NOT NULL,
        last_verified_at TEXT NOT NULL DEFAULT (datetime('now')),
        expires_at TEXT,
        is_active INTEGER NOT NULL DEFAULT 1
      );

      -- 9. ProofPass Credentials & Revocations (Ready for Ed25519 in Phase D)
      CREATE TABLE IF NOT EXISTS proofpass_credentials (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        occupation_id TEXT,
        payload_json TEXT NOT NULL,
        signature_ed25519 TEXT NOT NULL,
        public_key_id TEXT NOT NULL,
        consent_fields_json TEXT NOT NULL DEFAULT '["studentName","verifiedSkills","issuedAt"]',
        issued_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS credential_revocations (
        credential_id TEXT PRIMARY KEY,
        reason TEXT NOT NULL,
        revoked_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (credential_id) REFERENCES proofpass_credentials(id) ON DELETE CASCADE
      );

      -- 10. Activity History & Offline Sync Idempotency
      CREATE TABLE IF NOT EXISTS activity_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity_type TEXT NOT NULL,
        metadata_json TEXT DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sync_idempotency_log (
        idempotency_key TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'applied',
        processed_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      -- Indexes for fast queries
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_occ_title ON occupations(title);
      CREATE INDEX IF NOT EXISTS idx_opp_active ON opportunities(is_active, domain);
      CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_history(user_id, created_at);

      PRAGMA user_version = 1;
      COMMIT;
    `);

    console.log('[FutureX SQLite] Migration v1 completed successfully.');
  }
}

// ==========================================
// SEED FROM EXISTING JSON BANKS (IDEMPOTENT)
// ==========================================
function seedFromJsonBanks() {
  const careerBankPath = path.join(__dirname, '..', 'careerBank.json');
  const oppBankPath = path.join(__dirname, '..', 'opportunitiesBank.json');

  const insertOccupation = db.prepare(`
    INSERT OR IGNORE INTO occupations (id, title, category, domain, seniority, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertSkill = db.prepare(`
    INSERT OR IGNORE INTO skills (id, name, category, description)
    VALUES (?, ?, ?, ?)
  `);

  const getSkillByName = db.prepare('SELECT id FROM skills WHERE name = ?');

  const linkOccSkill = db.prepare(`
    INSERT OR IGNORE INTO occupation_skills (occupation_id, skill_id, is_required)
    VALUES (?, ?, 1)
  `);

  if (fs.existsSync(careerBankPath)) {
    try {
      const bank = JSON.parse(fs.readFileSync(careerBankPath, 'utf8'));
      const roles = Array.isArray(bank.roles) ? bank.roles : [];

      for (const role of roles) {
        const occId = role.id || role.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        insertOccupation.run(
          occId,
          role.title,
          role.domain || 'General',
          (role.domain || 'general').toLowerCase(),
          role.seniority || 'Entry / Junior',
          role.description || `Structured career pathway for ${role.title}`
        );

        if (Array.isArray(role.skills)) {
          for (const sk of role.skills) {
            const skillName = (sk.name || '').trim();
            if (!skillName) continue;

            const normalizedSkillId = `skill-${skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
            insertSkill.run(
              normalizedSkillId,
              skillName,
              sk.category || 'Technical Skills',
              sk.description || ''
            );

            const existingSkill = getSkillByName.get(skillName);
            if (existingSkill) {
              linkOccSkill.run(occId, existingSkill.id);
            }
          }
        }
      }
      console.log(`[FutureX SQLite] Seeded ${roles.length} careers from careerBank.json`);
    } catch (err) {
      console.warn('[FutureX SQLite] careerBank.json seed skipped:', err.message);
    }
  }

  if (fs.existsSync(oppBankPath)) {
    try {
      const oppBank = JSON.parse(fs.readFileSync(oppBankPath, 'utf8'));
      const portals = Array.isArray(oppBank.portals) ? oppBank.portals : [];

      const insertOpp = db.prepare(`
        INSERT OR IGNORE INTO opportunities
        (id, title, organization, category, domain, description, apply_url, source, expires_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);

      for (const p of portals) {
        const oppId = `portal-${p.id || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        const primaryDomain = Array.isArray(p.domains) && p.domains.length ? p.domains[0] : 'tech';
        insertOpp.run(
          oppId,
          `${p.name} — Verified ${p.type || 'Opportunity'} Portal`,
          p.name,
          p.type || 'HACKATHON',
          primaryDomain,
          p.description || '',
          p.baseQueryUrl || 'https://unstop.com',
          p.authority || p.name,
          '2027-12-31T23:59:59Z'
        );
      }
      console.log(`[FutureX SQLite] Seeded ${portals.length} opportunity sources from opportunitiesBank.json`);
    } catch (err) {
      console.warn('[FutureX SQLite] opportunitiesBank.json seed skipped:', err.message);
    }
  }
}


function runMigrationV3() {
  const versionRow = db.prepare('PRAGMA user_version').get();
  const currentVersion = versionRow ? Number(versionRow.user_version) : 0;

  if (currentVersion < 3) {
    console.log('[FutureX SQLite] Running Migration v3 (0-5 rating scale)...');

    db.exec('PRAGMA foreign_keys = OFF;');
    db.exec('BEGIN TRANSACTION;');
    try {
      db.exec(`
        CREATE TABLE user_skill_assessments_new (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          occupation_id TEXT NOT NULL,
          skill_id TEXT NOT NULL,
          self_rating INTEGER CHECK (self_rating BETWEEN 0 AND 5),
          verified_score INTEGER CHECK (verified_score BETWEEN 0 AND 100),
          verification_status TEXT NOT NULL DEFAULT 'self_assessed',
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE (user_id, occupation_id, skill_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
        );

        INSERT INTO user_skill_assessments_new
        SELECT * FROM user_skill_assessments;

        DROP TABLE user_skill_assessments;
        ALTER TABLE user_skill_assessments_new RENAME TO user_skill_assessments;
        PRAGMA user_version = 3;
      `);
      db.exec('COMMIT;');
      console.log('[FutureX SQLite] Migration v3 done. 0-5 ratings now active.');
    } catch (err) {
      db.exec('ROLLBACK;');
      db.exec('PRAGMA foreign_keys = ON;');
      throw err;
    }
    db.exec('PRAGMA foreign_keys = ON;');
  }
}

const { seed101Careers } = require('./seed101Careers');
const { runOpportunityMigrationV4 } = require('./opportunityMigrations');
const { runAssessmentMigrationV5 } = require('./assessmentMigrations');
const { seedQuestionBank } = require('./seedQuestionBank');

function initDatabase() {
  runMigrations();
  seedFromJsonBanks();
  seed101Careers(db);
  runAssessmentMigrationV5(db);
  seedQuestionBank(db);
  runMigrationV3();
  runOpportunityMigrationV4(db);
}
function getDbStats() {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const occupations = db.prepare('SELECT COUNT(*) as count FROM occupations').get().count;
  const skills = db.prepare('SELECT COUNT(*) as count FROM skills').get().count;
  const opportunities = db.prepare('SELECT COUNT(*) as count FROM opportunities').get().count;
  return { users, occupations, skills, opportunities };
}

module.exports = {
  db,
  initDatabase,
  getDbStats,
};