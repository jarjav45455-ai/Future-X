function runOpportunityMigrationV4(db) {
  const versionRow = db.prepare('PRAGMA user_version').get();
  const currentVersion = versionRow ? Number(versionRow.user_version) : 0;

  if (currentVersion < 4) {
    console.log('[FutureX SQLite] Running Migration v4 (Opportunity Intelligence System)...');

    db.exec('BEGIN TRANSACTION;');
    try {
      // 1. Curated Free Opportunity Source Registry
      db.exec(`
        CREATE TABLE IF NOT EXISTS opportunity_sources (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          official_url TEXT NOT NULL,
          category TEXT NOT NULL,
          supported_types_json TEXT NOT NULL DEFAULT '["JOB","INTERNSHIP"]',
          professions_json TEXT NOT NULL DEFAULT '["all"]',
          geo_coverage TEXT NOT NULL DEFAULT 'Global / India',
          access_method TEXT NOT NULL DEFAULT 'public_api',
          api_or_rss_url TEXT DEFAULT '',
          auth_required INTEGER NOT NULL DEFAULT 0,
          rate_limit_notes TEXT DEFAULT 'Respectful polling',
          sync_interval_minutes INTEGER NOT NULL DEFAULT 60,
          automated_ingestion_permitted INTEGER NOT NULL DEFAULT 1,
          last_sync_at TEXT,
          health_status TEXT NOT NULL DEFAULT 'healthy',
          last_error TEXT DEFAULT ''
        );
      `);

      // 2. Normalized Live Opportunities Table (Freshness + Status + Eligibility)
      db.exec(`
        CREATE TABLE IF NOT EXISTS live_opportunities (
          id TEXT PRIMARY KEY,
          fingerprint TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          company TEXT NOT NULL,
          opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('INTERNSHIP', 'JOB', 'HACKATHON')),
          description TEXT NOT NULL DEFAULT '',
          responsibilities_json TEXT NOT NULL DEFAULT '[]',
          location TEXT NOT NULL DEFAULT 'Remote',
          work_mode TEXT NOT NULL DEFAULT 'Remote',
          official_url TEXT NOT NULL,
          application_url TEXT NOT NULL,
          source_id TEXT NOT NULL,
          publication_date TEXT,
          opening_date TEXT,
          deadline TEXT,
          first_discovered_at TEXT NOT NULL DEFAULT (datetime('now')),
          last_verified_at TEXT NOT NULL DEFAULT (datetime('now')),
          last_updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          status TEXT NOT NULL DEFAULT 'Open' CHECK (
            status IN ('Upcoming', 'Open', 'Closing Soon', 'Closed', 'Expired', 'Unverified', 'Removed')
          ),
          education_requirement TEXT DEFAULT 'Any relevant degree or portfolio',
          experience_requirement TEXT DEFAULT 'Entry / Student',
          min_age INTEGER,
          min_roadmap_phase INTEGER NOT NULL DEFAULT 1,
          max_roadmap_phase INTEGER NOT NULL DEFAULT 4,
          stipend_or_prize TEXT DEFAULT '',
          metadata_json TEXT NOT NULL DEFAULT '{}',
          FOREIGN KEY (source_id) REFERENCES opportunity_sources(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_live_opp_status ON live_opportunities(status);
        CREATE INDEX IF NOT EXISTS idx_live_opp_type ON live_opportunities(opportunity_type);
        CREATE INDEX IF NOT EXISTS idx_live_opp_deadline ON live_opportunities(deadline);
      `);

      // 3. Opportunity Skills (Reuses existing skills.id)
      db.exec(`
        CREATE TABLE IF NOT EXISTS opportunity_skills (
          opportunity_id TEXT NOT NULL,
          skill_id TEXT NOT NULL,
          requirement_type TEXT NOT NULL DEFAULT 'mandatory' CHECK (requirement_type IN ('mandatory', 'preferred')),
          required_proficiency INTEGER NOT NULL DEFAULT 3 CHECK (required_proficiency BETWEEN 1 AND 5),
          PRIMARY KEY (opportunity_id, skill_id),
          FOREIGN KEY (opportunity_id) REFERENCES live_opportunities(id) ON DELETE CASCADE,
          FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
        );
      `);

      // 4. Opportunity Career Mapping (Reuses existing occupations.id)
      db.exec(`
        CREATE TABLE IF NOT EXISTS opportunity_career_mapping (
          opportunity_id TEXT NOT NULL,
          occupation_id TEXT NOT NULL,
          relevant_phases_json TEXT NOT NULL DEFAULT '[1,2,3]',
          relevance_level INTEGER NOT NULL DEFAULT 80,
          PRIMARY KEY (opportunity_id, occupation_id),
          FOREIGN KEY (opportunity_id) REFERENCES live_opportunities(id) ON DELETE CASCADE,
          FOREIGN KEY (occupation_id) REFERENCES occupations(id) ON DELETE CASCADE
        );
      `);

      // 5. Student Opportunity Matches (Cached evaluation + unlock tracking)
      db.exec(`
        CREATE TABLE IF NOT EXISTS student_opportunity_matches (
          user_id TEXT NOT NULL,
          opportunity_id TEXT NOT NULL,
          match_score INTEGER NOT NULL DEFAULT 0,
          match_label TEXT NOT NULL DEFAULT 'Skill Gap',
          eligibility_status TEXT NOT NULL DEFAULT 'eligible',
          is_locked INTEGER NOT NULL DEFAULT 0,
          missing_skills_json TEXT NOT NULL DEFAULT '[]',
          notified_at TEXT,
          last_evaluated_at TEXT NOT NULL DEFAULT (datetime('now')),
          PRIMARY KEY (user_id, opportunity_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (opportunity_id) REFERENCES live_opportunities(id) ON DELETE CASCADE
        );
      `);

      // 6. In-App Notifications & Preferences
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          opportunity_id TEXT,
          notif_type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          is_read INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS notification_preferences (
          user_id TEXT PRIMARY KEY,
          categories_json TEXT NOT NULL DEFAULT '["INTERNSHIP","JOB","HACKATHON"]',
          remote_only INTEGER NOT NULL DEFAULT 0,
          closing_soon_alerts INTEGER NOT NULL DEFAULT 1,
          unlock_alerts INTEGER NOT NULL DEFAULT 1,
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      // Seed Verified Free Sources Registry
      const upsertSource = db.prepare(`
        INSERT OR IGNORE INTO opportunity_sources (
          id, name, official_url, category, supported_types_json, professions_json,
          geo_coverage, access_method, api_or_rss_url, auth_required,
          rate_limit_notes, sync_interval_minutes, automated_ingestion_permitted
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const FREE_SOURCES = [
        [
          'remotive-public-api',
          'Remotive Public Jobs API',
          'https://remotive.com',
          'Remote Tech & Product Board',
          '["JOB","INTERNSHIP"]',
          '["engineering_tech","design_creative","business_management","media_communication"]',
          'Global / Remote',
          'public_api',
          'https://remotive.com/api/remote-jobs?limit=40',
          0,
          'Max 4 requests/day recommended; cached locally in SQLite',
          120,
          1,
        ],
        [
          'arbeitnow-public-api',
          'Arbeitnow Public Job Board API',
          'https://www.arbeitnow.com',
          'Tech & Startup Hiring Board',
          '["JOB","INTERNSHIP"]',
          '["engineering_tech","business_management","design_creative","finance_economics"]',
          'Global / Remote / EU',
          'public_api',
          'https://www.arbeitnow.com/api/job-board-api',
          0,
          'Free public JSON endpoint; polled every 2 hours with backoff',
          120,
          1,
        ],
        [
          'devpost-hackathons',
          'Devpost Official Hackathons',
          'https://devpost.com/hackathons',
          'Global Hackathon Platform',
          '["HACKATHON"]',
          '["engineering_tech","design_creative","science_research"]',
          'Global / Online',
          'official_portal',
          'https://devpost.com/hackathons',
          0,
          'Direct official portal reference; no unauthorized scraping',
          360,
          0,
        ],
        [
          'sih-aicte-india',
          'Smart India Hackathon (AICTE / MoE)',
          'https://www.sih.gov.in',
          'Government Hackathon Portal',
          '["HACKATHON"]',
          '["all"]',
          'India',
          'official_portal',
          'https://www.sih.gov.in',
          0,
          'Official Government of India portal',
          720,
          0,
        ],
        [
          'unstop-india',
          'Unstop Competitions & Internships',
          'https://unstop.com',
          'Student Competitions & Internships',
          '["HACKATHON","INTERNSHIP"]',
          '["all"]',
          'India',
          'official_portal',
          'https://unstop.com',
          0,
          'No free public API; linked transparently as verified portal',
          720,
          0,
        ],
      ];

      for (const src of FREE_SOURCES) {
        upsertSource.run(...src);
      }

      db.exec('PRAGMA user_version = 4;');
      db.exec('COMMIT;');
      console.log('[FutureX SQLite] Migration v4 completed (Opportunity Intelligence tables ready).');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
}

module.exports = { runOpportunityMigrationV4 };