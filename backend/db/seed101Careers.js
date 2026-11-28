const fs = require('fs');
const path = require('path');

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ensureOccupationColumns(db) {
  const existingCols = db
    .prepare('PRAGMA table_info(occupations)')
    .all()
    .map((c) => c.name);

  db.exec('BEGIN TRANSACTION;');
  try {
    if (!existingCols.includes('responsibilities_json')) {
      db.exec("ALTER TABLE occupations ADD COLUMN responsibilities_json TEXT DEFAULT '[]';");
    }
    if (!existingCols.includes('career_growth')) {
      db.exec("ALTER TABLE occupations ADD COLUMN career_growth TEXT DEFAULT '';");
    }
    if (!existingCols.includes('related_occupations_json')) {
      db.exec("ALTER TABLE occupations ADD COLUMN related_occupations_json TEXT DEFAULT '[]';");
    }
    const versionRow = db.prepare('PRAGMA user_version').get();
    if (!versionRow || Number(versionRow.user_version) < 2) {
      db.exec('PRAGMA user_version = 2;');
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

function loadCareerPacks() {
  const packFiles = [
    'pack1_tech_ai.js',
    'pack2_business_finance.js',
    'pack3_medical_law_core.js',
    'pack4_design_science_public.js',
  ];

  const allCareers = [];
  for (const file of packFiles) {
    const fullPath = path.join(__dirname, 'careers', file);
    if (fs.existsSync(fullPath)) {
      const pack = require(fullPath);
      if (Array.isArray(pack)) {
        allCareers.push(...pack);
      }
    }
  }
  return allCareers;
}

function seed101Careers(db) {
  ensureOccupationColumns(db);

  const careers = loadCareerPacks();
  if (careers.length === 0) {
    console.warn('[FutureX 101 DB] No career packs found inside backend/db/careers/.');
    return;
  }

  const upsertOccupation = db.prepare(`
    INSERT INTO occupations (
      id, title, category, domain, seniority, description,
      education_requirements, responsibilities_json, career_growth,
      related_occupations_json, source_framework, source_attribution, is_custom
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      category = excluded.category,
      domain = excluded.domain,
      seniority = excluded.seniority,
      description = excluded.description,
      education_requirements = excluded.education_requirements,
      responsibilities_json = excluded.responsibilities_json,
      career_growth = excluded.career_growth,
      related_occupations_json = excluded.related_occupations_json,
      source_framework = excluded.source_framework,
      source_attribution = excluded.source_attribution
  `);

  const upsertSkill = db.prepare(`
    INSERT INTO skills (id, name, category, description, why_it_matters, required_proficiency, difficulty_level)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      category = excluded.category,
      description = CASE WHEN excluded.description != '' THEN excluded.description ELSE skills.description END,
      why_it_matters = CASE WHEN excluded.why_it_matters != '' THEN excluded.why_it_matters ELSE skills.why_it_matters END,
      required_proficiency = excluded.required_proficiency,
      difficulty_level = excluded.difficulty_level
  `);

  const getSkillByName = db.prepare('SELECT id FROM skills WHERE name = ?');

  const linkOccSkill = db.prepare(`
    INSERT INTO occupation_skills (occupation_id, skill_id, is_required, weight)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(occupation_id, skill_id) DO UPDATE SET
      is_required = excluded.is_required,
      weight = excluded.weight
  `);

  const linkPrereq = db.prepare(`
    INSERT OR IGNORE INTO skill_prerequisites (skill_id, prerequisite_skill_id)
    VALUES (?, ?)
  `);

  const pendingPrereqs = [];

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const occ of careers) {
      upsertOccupation.run(
        occ.id,
        occ.title,
        occ.category,
        occ.domain,
        occ.seniority || 'Entry / Junior',
        occ.description || '',
        occ.education || '',
        JSON.stringify(occ.responsibilities || []),
        occ.growth || '',
        JSON.stringify(occ.related || []),
        'O*NET 31.0 / ESCO v1.2.1 / NCO India',
        'FutureX 101-Career Verified Ontology (Zero-AI Deterministic DB)'
      );

      for (const sk of occ.skills || []) {
        // Supports tuple: [name, category, reqLevel, difficulty, description, whyItMatters, prereqArray, isRequired]
        const [
          name,
          category,
          reqLevel = 4,
          difficulty = 'Intermediate',
          description = '',
          whyItMatters = '',
          prereqs = [],
          isRequired = true,
        ] = sk;

        const skillId = `skill-${slugify(name)}`;
        upsertSkill.run(skillId, name, category, description, whyItMatters, reqLevel, difficulty);

        const saved = getSkillByName.get(name);
        if (saved) {
          linkOccSkill.run(occ.id, saved.id, isRequired ? 1 : 0, isRequired ? 2 : 1);
          for (const pName of prereqs || []) {
            pendingPrereqs.push({ childName: name, parentName: pName });
          }
        }
      }
    }

    for (const edge of pendingPrereqs) {
      const child = getSkillByName.get(edge.childName);
      const parent = getSkillByName.get(edge.parentName);
      if (child && parent && child.id !== parent.id) {
        linkPrereq.run(child.id, parent.id);
      }
    }

    db.exec('COMMIT;');
    console.log(`[FutureX 101 DB] Seeded ${careers.length} deep careers (Zero-AI deterministic ontology).`);
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('[FutureX 101 DB Seed Error]:', err.message);
    throw err;
  }
}

module.exports = { seed101Careers };