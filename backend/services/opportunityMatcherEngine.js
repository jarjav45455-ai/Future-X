const crypto = require('crypto');

const WEIGHTS = {
  careerRelevance: 0.3,
  phaseAlignment: 0.25,
  mandatorySkills: 0.3,
  preferredSkills: 0.1,
  freshness: 0.05,
};

function getStudentContext(db, userId) {
  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(userId);
  const targetOccId = profile?.target_role_id || null;

  // Determine active roadmap phase
  let currentPhase = 1;
  const activeRoadmap = db
    .prepare('SELECT id FROM roadmaps WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1')
    .get(userId);

  if (activeRoadmap) {
    const currPhaseRow = db
      .prepare("SELECT step_number FROM roadmap_phases WHERE roadmap_id = ? AND status = 'current' ORDER BY step_number ASC LIMIT 1")
      .get(activeRoadmap.id);
    if (currPhaseRow) currentPhase = Number(currPhaseRow.step_number || 1);
  }

  // Load student's skill assessments (honestly distinguishing verified vs self_assessed)
  const skillRows = db
    .prepare(`
      SELECT skill_id, self_rating, verified_score, verification_status
      FROM user_skill_assessments
      WHERE user_id = ?
    `)
    .all(userId);

  const skillMap = new Map();
  for (const r of skillRows) {
    const effectiveLevel =
      r.verification_status === 'verified' && r.verified_score !== null
        ? Math.round((Number(r.verified_score) / 100) * 5)
        : Number(r.self_rating ?? 0);

    skillMap.set(r.skill_id, {
      selfRating: Number(r.self_rating ?? 0),
      verifiedScore: r.verified_score,
      verificationStatus: r.verification_status || 'self_assessed',
      effectiveLevel,
    });
  }

  return {
    userId,
    targetOccId,
    targetRoleTitle: profile?.target_role_title || 'General Track',
    currentPhase,
    skillMap,
  };
}

function evaluateOpportunitiesForStudent(db, userId, categoryFilter = 'ALL') {
  const ctx = getStudentContext(db, userId);

  const typeCondition =
    categoryFilter && categoryFilter !== 'ALL' ? 'AND lo.opportunity_type = ?' : '';
  const params = categoryFilter && categoryFilter !== 'ALL' ? [categoryFilter] : [];

  const activeOpps = db
    .prepare(`
      SELECT lo.*, os.name AS source_name
      FROM live_opportunities lo
      JOIN opportunity_sources os ON os.id = lo.source_id
      WHERE lo.status IN ('Open', 'Closing Soon', 'Upcoming')
      ${typeCondition}
      ORDER BY lo.last_verified_at DESC
      LIMIT 80
    `)
    .all(...params);

  const occMapStmt = db.prepare(
    'SELECT occupation_id, relevance_level FROM opportunity_career_mapping WHERE opportunity_id = ?'
  );
  const oppSkillStmt = db.prepare(`
    SELECT os.skill_id, os.requirement_type, os.required_proficiency, s.name, s.category
    FROM opportunity_skills os
    JOIN skills s ON s.id = os.skill_id
    WHERE os.opportunity_id = ?
  `);

  const prevMatchStmt = db.prepare(
    'SELECT is_locked FROM student_opportunity_matches WHERE user_id = ? AND opportunity_id = ?'
  );
  const upsertMatch = db.prepare(`
    INSERT INTO student_opportunity_matches (
      user_id, opportunity_id, match_score, match_label, eligibility_status,
      is_locked, missing_skills_json, last_evaluated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id, opportunity_id) DO UPDATE SET
      match_score = excluded.match_score,
      match_label = excluded.match_label,
      eligibility_status = excluded.eligibility_status,
      is_locked = excluded.is_locked,
      missing_skills_json = excluded.missing_skills_json,
      last_evaluated_at = datetime('now')
  `);

  const insertNotif = db.prepare(`
    INSERT INTO user_notifications (id, user_id, opportunity_id, notif_type, title, message)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const evaluated = activeOpps.map((opp) => {
    const careerLinks = occMapStmt.all(opp.id);
    const isDirectCareerMatch = ctx.targetOccId
      ? careerLinks.some((c) => c.occupation_id === ctx.targetOccId)
      : false;

    const skills = oppSkillStmt.all(opp.id);
    const mandatorySkills = skills.filter((s) => s.requirement_type === 'mandatory');
    const preferredSkills = skills.filter((s) => s.requirement_type === 'preferred');

    const completedSkills = [];
    const missingMandatory = [];
    const missingPreferred = [];

    for (const sk of mandatorySkills) {
      const st = ctx.skillMap.get(sk.skill_id);
      const level = st ? st.effectiveLevel : 0;
      if (level >= sk.required_proficiency) {
        completedSkills.push({
          id: sk.skill_id,
          name: sk.name,
          status: st.verificationStatus,
        });
      } else {
        missingMandatory.push({
          id: sk.skill_id,
          name: sk.name,
          currentLevel: level,
          requiredLevel: sk.required_proficiency,
          roadmapPhase: opp.min_roadmap_phase,
        });
      }
    }

    for (const sk of preferredSkills) {
      const st = ctx.skillMap.get(sk.skill_id);
      const level = st ? st.effectiveLevel : 0;
      if (level >= sk.required_proficiency) {
        completedSkills.push({ id: sk.skill_id, name: sk.name, status: st.verificationStatus });
      } else {
        missingPreferred.push({ id: sk.skill_id, name: sk.name });
      }
    }

    // Smart Lock Rule: Lock if opportunity is for a higher roadmap phase AND student is missing mandatory skills
    const phaseGap = opp.min_roadmap_phase - ctx.currentPhase;
    const isLocked =
      (phaseGap >= 1 && missingMandatory.length > 0) ||
      (mandatorySkills.length >= 2 && missingMandatory.length === mandatorySkills.length && ctx.currentPhase === 1 && opp.min_roadmap_phase >= 2);

    // Transparent Weighted Score
    const careerScore = isDirectCareerMatch ? 100 : 55;
    const phaseScore =
      ctx.currentPhase >= opp.min_roadmap_phase && ctx.currentPhase <= opp.max_roadmap_phase
        ? 100
        : phaseGap === 1
          ? 55
          : phaseGap > 1
            ? 25
            : 80;

    const mandatoryCoverage =
      mandatorySkills.length > 0
        ? Math.round(((mandatorySkills.length - missingMandatory.length) / mandatorySkills.length) * 100)
        : 80;
    const preferredCoverage =
      preferredSkills.length > 0
        ? Math.round(((preferredSkills.length - missingPreferred.length) / preferredSkills.length) * 100)
        : 70;

    const rawScore = Math.round(
      careerScore * WEIGHTS.careerRelevance +
        phaseScore * WEIGHTS.phaseAlignment +
        mandatoryCoverage * WEIGHTS.mandatorySkills +
        preferredCoverage * WEIGHTS.preferredSkills +
        95 * WEIGHTS.freshness
    );

    const matchScore = isLocked ? Math.min(rawScore, 64) : Math.min(99, rawScore);

    let matchLabel = 'Skill Gap';
    if (isLocked) matchLabel = 'Locked — Skills Required';
    else if (matchScore >= 85 && isDirectCareerMatch) matchLabel = 'Excellent Match';
    else if (matchScore >= 72) matchLabel = 'Strong Match';
    else if (opp.min_roadmap_phase === 1) matchLabel = 'Beginner Friendly';
    else if (missingMandatory.length === 1) matchLabel = 'Almost Eligible';

    // Detect Unlock transition & fire in-app notification
    if (userId) {
      const prev = prevMatchStmt.get(userId, opp.id);
      if (prev && Number(prev.is_locked) === 1 && !isLocked) {
        insertNotif.run(
          `notif-${crypto.randomUUID()}`,
          userId,
          opp.id,
          'opportunity_unlocked',
          `Phase ${opp.min_roadmap_phase} Opportunity Unlocked!`,
          `${opp.title} at ${opp.company} is now unlocked based on your updated skill progress.`
        );
      }

      upsertMatch.run(
        userId,
        opp.id,
        matchScore,
        matchLabel,
        isLocked ? 'skills_required' : 'eligible',
        isLocked ? 1 : 0,
        JSON.stringify(missingMandatory.map((m) => m.name))
      );
    }

    const whyMatched = isLocked
      ? `Mapped to Phase ${opp.min_roadmap_phase}. Complete ${missingMandatory.map((m) => m.name).slice(0, 2).join(', ')} to unlock.`
      : isDirectCareerMatch
        ? `Matches your ${ctx.targetRoleTitle} track and Phase ${ctx.currentPhase} readiness.`
        : `Relevant ${opp.opportunity_type.toLowerCase()} aligned with your transferable skills.`;

    return {
      id: opp.id,
      title: opp.title,
      company: opp.company,
      opportunityType: opp.opportunity_type,
      description: opp.description,
      location: opp.location,
      workMode: opp.work_mode,
      officialUrl: opp.official_url,
      applicationUrl: opp.application_url,
      sourceName: opp.source_name,
      publicationDate: opp.publication_date,
      deadline: opp.deadline,
      lastVerifiedAt: opp.last_verified_at,
      status: opp.status,
      educationRequirement: opp.education_requirement,
      experienceRequirement: opp.experience_requirement,
      minRoadmapPhase: opp.min_roadmap_phase,
      maxRoadmapPhase: opp.max_roadmap_phase,
      stipendOrPrize: opp.stipend_or_prize,
      isDirectCareerMatch,
      matchScore,
      matchLabel,
      isLocked,
      whyMatched,
      mandatorySkills: mandatorySkills.map((s) => s.name),
      preferredSkills: preferredSkills.map((s) => s.name),
      completedSkills,
      missingMandatorySkills: missingMandatory,
      missingPreferredSkills: missingPreferred,
    };
  });

  // Sort: Unlocked + Direct Career Match + Current Phase first, then Locked
  evaluated.sort((a, b) => {
    if (a.isLocked !== b.isLocked) return a.isLocked ? 1 : -1;
    if (a.isDirectCareerMatch !== b.isDirectCareerMatch) return a.isDirectCareerMatch ? -1 : 1;
    return b.matchScore - a.matchScore;
  });

  // Build Data-Driven Sections (no fake counts)
  const unlocked = evaluated.filter((o) => !o.isLocked);
  const locked = evaluated.filter((o) => o.isLocked);

  return {
    studentContext: {
      targetRoleTitle: ctx.targetRoleTitle,
      currentPhase: ctx.currentPhase,
      totalActive: evaluated.length,
      unlockedCount: unlocked.length,
      lockedCount: locked.length,
      closingSoonCount: evaluated.filter((o) => o.status === 'Closing Soon').length,
    },
    sections: {
      topForYou: unlocked.slice(0, 3),
      currentPhase: unlocked.filter(
        (o) => ctx.currentPhase >= o.minRoadmapPhase && ctx.currentPhase <= o.maxRoadmapPhase
      ).slice(0, 6),
      beginnerFriendly: unlocked.filter((o) => o.minRoadmapPhase === 1).slice(0, 5),
      lockedNextPhase: locked.slice(0, 5),
      closingSoon: evaluated.filter((o) => o.status === 'Closing Soon').slice(0, 5),
    },
    opportunities: evaluated,
  };
}

module.exports = {
  evaluateOpportunitiesForStudent,
};