const crypto = require('crypto');

function stripHtml(html = '') {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeFingerprint(company, title, location) {
  const norm = `${String(company || '').toLowerCase().trim()}|${String(title || '').toLowerCase().trim()}|${String(location || '').toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(norm).digest('hex').slice(0, 32);
}

function isSafeHttpUrl(url) {
  try {
    const parsed = new URL(String(url || ''));
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function detectOpportunityType(title = '', tags = []) {
  const text = `${title} ${(tags || []).join(' ')}`.toLowerCase();
  if (text.includes('hackathon') || text.includes('challenge') || text.includes('datathon')) {
    return 'HACKATHON';
  }
  if (text.includes('intern') || text.includes('trainee') || text.includes('apprentice') || text.includes('fellow')) {
    return 'INTERNSHIP';
  }
  return 'JOB';
}

function inferPhaseRange(title = '', description = '', oppType = 'JOB') {
  const text = `${title} ${description}`.toLowerCase();
  if (oppType === 'HACKATHON') return { minPhase: 1, maxPhase: 4, exp: 'Open to Students & Builders' };
  if (oppType === 'INTERNSHIP' || text.includes('junior') || text.includes('entry') || text.includes('graduate') || text.includes('fresher')) {
    return { minPhase: 1, maxPhase: 2, exp: 'Entry / Student (0-1 yrs)' };
  }
  if (text.includes('senior') || text.includes('staff') || text.includes('lead') || text.includes('principal') || text.includes('architect')) {
    return { minPhase: 3, maxPhase: 4, exp: 'Senior / Advanced (3+ yrs)' };
  }
  return { minPhase: 2, maxPhase: 4, exp: 'Mid-Level (1-3 yrs)' };
}

function mapToOccupationsAndSkills(db, title, description, tags = []) {
  const haystack = `${title} ${(tags || []).join(' ')} ${description.slice(0, 600)}`.toLowerCase();

  const allOccupations = db.prepare('SELECT id, title, category, domain FROM occupations').all();
  const matchedOccIds = [];

  for (const occ of allOccupations) {
    const occTitle = occ.title.toLowerCase();
    const tokens = occTitle
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !['and', 'the', 'for', 'specialist', 'manager', 'engineer', 'analyst'].includes(t));

    if (haystack.includes(occTitle) || (tokens.length > 0 && tokens.some((t) => haystack.includes(t)))) {
      matchedOccIds.push(occ.id);
    }
    if (matchedOccIds.length >= 3) break;
  }

  // Fallback mapping for general software/tech roles
  if (matchedOccIds.length === 0) {
    if (haystack.includes('react') || haystack.includes('frontend')) matchedOccIds.push('frontend-developer');
    else if (haystack.includes('node') || haystack.includes('backend') || haystack.includes('api')) matchedOccIds.push('backend-developer');
    else if (haystack.includes('data')) matchedOccIds.push('data-analyst');
    else if (haystack.includes('design') || haystack.includes('figma')) matchedOccIds.push('ui-ux-designer');
    else matchedOccIds.push('full-stack-developer');
  }

  // Match existing SQLite skills
  const allSkills = db.prepare('SELECT id, name, required_proficiency FROM skills').all();
  const matchedSkills = [];

  for (const sk of allSkills) {
    const skName = sk.name.toLowerCase();
    const primaryKeyword = skName.split(/[&(/]/)[0].trim();
    if (
      (primaryKeyword.length >= 3 && haystack.includes(primaryKeyword)) ||
      haystack.includes(skName)
    ) {
      matchedSkills.push({
        skillId: sk.id,
        requirementType: matchedSkills.length < 3 ? 'mandatory' : 'preferred',
        requiredProficiency: Math.min(4, Number(sk.required_proficiency || 3)),
      });
    }
    if (matchedSkills.length >= 6) break;
  }

  // If no direct text skill matched, borrow top 3 skills from primary mapped occupation
  if (matchedSkills.length === 0 && matchedOccIds[0]) {
    const occSkills = db
      .prepare(`
        SELECT s.id, s.required_proficiency, os.is_required
        FROM occupation_skills os
        JOIN skills s ON s.id = os.skill_id
        WHERE os.occupation_id = ?
        ORDER BY os.is_required DESC, os.weight DESC
        LIMIT 4
      `)
      .all(matchedOccIds[0]);

    for (let i = 0; i < occSkills.length; i++) {
      matchedSkills.push({
        skillId: occSkills[i].id,
        requirementType: i < 2 ? 'mandatory' : 'preferred',
        requiredProficiency: Math.min(4, Number(occSkills[i].required_proficiency || 3)),
      });
    }
  }

  return { matchedOccIds, matchedSkills };
}

/**
 * Adapter 1: Remotive Free Public API (No API key required)
 */
async function fetchRemotiveAdapter() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=35', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const jobs = Array.isArray(data?.jobs) ? data.jobs : [];

    return jobs
      .filter((j) => j.title && j.company_name && isSafeHttpUrl(j.url))
      .map((j) => {
        const cleanDesc = stripHtml(j.description).slice(0, 1200);
        const oppType = detectOpportunityType(j.title, j.tags);
        const phaseInfo = inferPhaseRange(j.title, cleanDesc, oppType);
        return {
          sourceId: 'remotive-public-api',
          title: String(j.title).trim(),
          company: String(j.company_name).trim(),
          opportunityType: oppType,
          description: cleanDesc || `${j.title} at ${j.company_name}`,
          location: String(j.candidate_required_location || 'Remote / Worldwide').trim(),
          workMode: 'Remote',
          officialUrl: j.url,
          applicationUrl: j.url,
          publicationDate: j.publication_date || null,
          deadline: null,
          experienceRequirement: phaseInfo.exp,
          minPhase: phaseInfo.minPhase,
          maxPhase: phaseInfo.maxPhase,
          stipendOrPrize: j.salary || '',
          tags: Array.isArray(j.tags) ? j.tags : [],
        };
      });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Adapter 2: Arbeitnow Free Public Job Board API (No API key required)
 */
async function fetchArbeitnowAdapter() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const jobs = Array.isArray(data?.data) ? data.data.slice(0, 35) : [];

    return jobs
      .filter((j) => j.title && j.company_name && isSafeHttpUrl(j.url))
      .map((j) => {
        const cleanDesc = stripHtml(j.description).slice(0, 1200);
        const oppType = detectOpportunityType(j.title, j.tags);
        const phaseInfo = inferPhaseRange(j.title, cleanDesc, oppType);
        const pubDate = j.created_at ? new Date(Number(j.created_at) * 1000).toISOString() : null;

        return {
          sourceId: 'arbeitnow-public-api',
          title: String(j.title).trim(),
          company: String(j.company_name).trim(),
          opportunityType: oppType,
          description: cleanDesc || `${j.title} at ${j.company_name}`,
          location: String(j.location || 'Remote').trim(),
          workMode: j.remote ? 'Remote' : 'Hybrid / On-site',
          officialUrl: j.url,
          applicationUrl: j.url,
          publicationDate: pubDate,
          deadline: null,
          experienceRequirement: phaseInfo.exp,
          minPhase: phaseInfo.minPhase,
          maxPhase: phaseInfo.maxPhase,
          stipendOrPrize: '',
          tags: Array.isArray(j.tags) ? j.tags : [],
        };
      });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Freshness & Expiration Validator (Strict: No expired/stale items in active feed)
 */
function runFreshnessSweep(db) {
  const nowIso = new Date().toISOString();
  const closingSoonIso = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const staleCutoffIso = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Mark past-deadline opportunities as Expired
  const expired = db
    .prepare(`
      UPDATE live_opportunities
      SET status = 'Expired', last_updated_at = datetime('now')
      WHERE deadline IS NOT NULL AND deadline != '' AND deadline < ? AND status NOT IN ('Expired', 'Removed')
    `)
    .run(nowIso);

  // 2. Mark opportunities closing within 5 days as Closing Soon
  db.prepare(`
    UPDATE live_opportunities
    SET status = 'Closing Soon', last_updated_at = datetime('now')
    WHERE deadline IS NOT NULL AND deadline >= ? AND deadline <= ? AND status = 'Open'
  `).run(nowIso, closingSoonIso);

  // 3. Mark undated opportunities older than 45 days without re-verification as Unverified
  const stale = db
    .prepare(`
      UPDATE live_opportunities
      SET status = 'Unverified', last_updated_at = datetime('now')
      WHERE (deadline IS NULL OR deadline = '') AND last_verified_at < ? AND status = 'Open'
    `)
    .run(staleCutoffIso);

  return { expiredCount: expired.changes, staleUnverifiedCount: stale.changes };
}

/**
 * Master Sync Pipeline (Deduplicates, preserves original publication_date, updates source health)
 */
async function syncLiveOpportunities(db, force = false) {
  const adapters = [
    { sourceId: 'remotive-public-api', fn: fetchRemotiveAdapter },
    { sourceId: 'arbeitnow-public-api', fn: fetchArbeitnowAdapter },
  ];

  const results = {
    syncedSources: 0,
    inserted: 0,
    updated: 0,
    errors: [],
  };

  const upsertOpp = db.prepare(`
    INSERT INTO live_opportunities (
      id, fingerprint, title, company, opportunity_type, description,
      location, work_mode, official_url, application_url, source_id,
      publication_date, deadline, experience_requirement,
      min_roadmap_phase, max_roadmap_phase, stipend_or_prize,
      status, last_verified_at, last_updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open', datetime('now'), datetime('now'))
    ON CONFLICT(fingerprint) DO UPDATE SET
      description = excluded.description,
      application_url = excluded.application_url,
      last_verified_at = datetime('now'),
      last_updated_at = datetime('now'),
      status = CASE WHEN live_opportunities.status = 'Removed' THEN 'Removed' ELSE 'Open' END
  `);

  const linkSkill = db.prepare(`
    INSERT OR IGNORE INTO opportunity_skills (opportunity_id, skill_id, requirement_type, required_proficiency)
    VALUES (?, ?, ?, ?)
  `);

  const linkCareer = db.prepare(`
    INSERT OR IGNORE INTO opportunity_career_mapping (opportunity_id, occupation_id, relevant_phases_json, relevance_level)
    VALUES (?, ?, ?, ?)
  `);

  for (const adapter of adapters) {
    const srcRow = db.prepare('SELECT * FROM opportunity_sources WHERE id = ?').get(adapter.sourceId);
    if (!srcRow || !srcRow.automated_ingestion_permitted) continue;

    // Respect sync interval unless forced
    if (!force && srcRow.last_sync_at) {
      const minsAgo = (Date.now() - new Date(srcRow.last_sync_at).getTime()) / 60000;
      if (minsAgo < (srcRow.sync_interval_minutes || 60)) {
        continue;
      }
    }

    try {
      const items = await adapter.fn();
      db.exec('BEGIN TRANSACTION;');
      try {
        for (const item of items) {
          const fp = makeFingerprint(item.company, item.title, item.location);
          const existing = db.prepare('SELECT id FROM live_opportunities WHERE fingerprint = ?').get(fp);
          const oppId = existing ? existing.id : `opp-${fp.slice(0, 14)}`;

          upsertOpp.run(
            oppId,
            fp,
            item.title,
            item.company,
            item.opportunityType,
            item.description,
            item.location,
            item.workMode,
            item.officialUrl,
            item.applicationUrl,
            item.sourceId,
            item.publicationDate,
            item.deadline,
            item.experienceRequirement,
            item.minPhase,
            item.maxPhase,
            item.stipendOrPrize
          );

          if (existing) results.updated++;
          else results.inserted++;

          const { matchedOccIds, matchedSkills } = mapToOccupationsAndSkills(
            db,
            item.title,
            item.description,
            item.tags
          );

          const phasesArr = [];
          for (let p = item.minPhase; p <= item.maxPhase; p++) phasesArr.push(p);

          for (const occId of matchedOccIds) {
            linkCareer.run(oppId, occId, JSON.stringify(phasesArr), 85);
          }
          for (const sk of matchedSkills) {
            linkSkill.run(oppId, sk.skillId, sk.requirementType, sk.requiredProficiency);
          }
        }

        db.prepare(`
          UPDATE opportunity_sources
          SET last_sync_at = datetime('now'), health_status = 'healthy', last_error = ''
          WHERE id = ?
        `).run(adapter.sourceId);

        db.exec('COMMIT;');
        results.syncedSources++;
      } catch (txErr) {
        db.exec('ROLLBACK;');
        throw txErr;
      }
    } catch (err) {
      results.errors.push({ sourceId: adapter.sourceId, error: err.message });
      db.prepare(`
        UPDATE opportunity_sources
        SET health_status = 'degraded', last_error = ?
        WHERE id = ?
      `).run(String(err.message).slice(0, 200), adapter.sourceId);
    }
  }

  const sweep = runFreshnessSweep(db);
  console.log(
    `[Opportunity Sync] Sources: ${results.syncedSources} | New: ${results.inserted} | Updated: ${results.updated} | Expired: ${sweep.expiredCount}`
  );
  return { ...results, ...sweep };
}

function startOpportunityScheduler(db) {
  // Initial non-blocking sync 3 seconds after server boot
  setTimeout(() => {
    syncLiveOpportunities(db, false).catch((e) =>
      console.warn('[Opportunity Boot Sync Warning]:', e.message)
    );
  }, 3000);

  // Periodic sweep + sync every 2 hours
  setInterval(() => {
    syncLiveOpportunities(db, false).catch((e) =>
      console.warn('[Opportunity Scheduled Sync Warning]:', e.message)
    );
  }, 2 * 60 * 60 * 1000);
}

module.exports = {
  syncLiveOpportunities,
  runFreshnessSweep,
  startOpportunityScheduler,
};