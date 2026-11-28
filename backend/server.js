const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const { db, initDatabase, getDbStats } = require('./db/database');
const { apiRateLimiter, optionalAuth } = require('./middleware/auth');
const authRoutes = require('./routes/authRoutes');
const careerExplorerRoutes = require('./routes/careerExplorerRoutes');
const { generateAdaptiveRoadmap } = require('./services/roadmapEngine');
const opportunityRoutes = require('./routes/opportunityRoutes');
const { startOpportunityScheduler } = require('./services/opportunitySources');
const assessmentRoutes = require('./routes/assessmentRoutes');

initDatabase();
app.use('/api', apiRateLimiter);
app.use('/api', optionalAuth);
app.use('/api/auth', authRoutes);
app.use('/api/assess', assessmentRoutes);
app.use('/api', careerExplorerRoutes);
app.use('/api/opportunities', opportunityRoutes);
startOpportunityScheduler(db);

// ==========================================
// 0. LOCAL DETERMINISTIC EXAM & OPPORTUNITY STORES
// ==========================================
let roleExamBank = {};
try {
  const examPath = path.join(__dirname, 'roleExamBank.json');
  if (fs.existsSync(examPath)) {
    roleExamBank = JSON.parse(fs.readFileSync(examPath, 'utf8'));
    console.log(`[FutureX Exam DB] Loaded local domains: ${Object.keys(roleExamBank).join(', ')}`);
  }
} catch (err) {
  console.warn('[FutureX Exam DB] Warning reading roleExamBank.json:', err.message);
}

let opportunitiesMasterBank = { portals: [] };
try {
  const oppPath = path.join(__dirname, 'opportunitiesBank.json');
  if (fs.existsSync(oppPath)) {
    opportunitiesMasterBank = JSON.parse(fs.readFileSync(oppPath, 'utf8'));
    console.log(`[FutureX Opportunities DB] Loaded ${opportunitiesMasterBank.portals.length} curated master platforms`);
  }
} catch (e) {
  console.warn('[FutureX Opportunities DB] File read warning:', e.message);
}

// Active Assessment Sessions
const assessmentSessions = new Map();

// Multi-Key Google GenAI Setup (ONLY used by AI Mentor)
const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_BACKUP || process.env.GEMINI_API_KEY,
].filter(Boolean);

let currentKeyIndex = 0;
function getAIInstance() {
  return new GoogleGenAI({ apiKey: apiKeys[currentKeyIndex % apiKeys.length] });
}

let lastCallTimestamp = 0;
async function generateWithRetry(modelParams, maxRetries = 2) {
  let lastError;
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTimestamp;
  if (timeSinceLastCall < 800) {
    await new Promise((resolve) => setTimeout(resolve, 800 - timeSinceLastCall));
  }
  lastCallTimestamp = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const aiInstance = getAIInstance();
      return await aiInstance.models.generateContent({
        ...modelParams,
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      });
    } catch (err) {
      lastError = err;
      const isQuota =
        err?.message?.includes('429') ||
        err?.status === 429 ||
        err?.message?.includes('RESOURCE_EXHAUSTED');
      if (isQuota) {
        console.warn(`[Rate Guard] Quota reached. Rotating key (Attempt ${attempt + 1})...`);
        currentKeyIndex++;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        break;
      }
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('[Circuit Breaker] Gemini rate limited. Delegating to OpenAI fallback...');
      const { OpenAI } = require('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content:
              typeof modelParams.contents === 'string'
                ? modelParams.contents
                : JSON.stringify(modelParams.contents),
          },
        ],
        temperature: 0.2,
      });
      return { text: completion.choices[0]?.message?.content || '' };
    } catch (oaErr) {
      console.error('[Circuit Breaker OpenAI Error]:', oaErr.message);
    }
  }

  throw lastError;
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'active',
    platform: 'FutureX Hybrid Intelligence Layer',
    database: getDbStats(),
  });
});

// ==========================================
// 1. CONVERSATIONAL CAREER MENTOR (AI ONLY HERE)
// ==========================================
app.post('/api/mentor/ask', async (req, res) => {
  try {
    const { studentProfile, history, question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const roleTitle = studentProfile?.targetRole?.roleTitle || 'Professional';
    const currentPhase = studentProfile?.roadmap?.find((m) => m.status === 'current');
    const roadmapSummary = currentPhase
      ? `${currentPhase.title} (${currentPhase.subtitle})`
      : 'Foundations';

    const systemInstruction = `You are FutureX Senior Career Intelligence Mentor.
Mentoring Profile: Role: "${roleTitle}", Current Phase: "${roadmapSummary}", Readiness: ${studentProfile?.readinessPercentage || 0}%.
Deliver concise, highly actionable guidance under 120 words. No boilerplate.`;

    const contents = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-6)) {
        contents.push({
          role: turn.sender === 'student' ? 'user' : 'model',
          parts: [{ text: turn.text }],
        });
      }
    }
    contents.push({ role: 'user', parts: [{ text: question }] });

    const response = await generateWithRetry({
      contents,
      config: { systemInstruction, temperature: 0.25 },
    });

    return res.json({
      success: true,
      answer: response.text?.trim() || 'Guidance temporarily unavailable.',
    });
  } catch (error) {
    console.error('[Mentor Error]:', error?.message);
    res.status(500).json({ error: 'Career mentor is currently offline.' });
  }
});

// ==========================================
// 2. ZERO-AI DETERMINISTIC CAREER & SKILL ENGINE (101-CAREER SQLITE DB)
// ==========================================
function findOccupationInDb(roleQuery) {
  const clean = String(roleQuery || '').trim().toLowerCase();
  if (!clean) return null;
  const slug = clean.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // 1. Exact id or exact title match
  let occ = db
    .prepare('SELECT * FROM occupations WHERE id = ? OR LOWER(title) = ? LIMIT 1')
    .get(slug, clean);
  if (occ) return occ;

  // 2. Substring match on title or category
  occ = db
    .prepare(
      'SELECT * FROM occupations WHERE LOWER(title) LIKE ? OR LOWER(category) LIKE ? ORDER BY is_custom ASC LIMIT 1'
    )
    .get(`%${clean}%`, `%${clean}%`);
  if (occ) return occ;

  // 3. Keyword token match (e.g. "ml", "cyber", "pilot")
  const tokens = clean.split(/\s+/).filter((t) => t.length >= 2);
  for (const token of tokens) {
    occ = db
      .prepare(
        'SELECT * FROM occupations WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ? ORDER BY is_custom ASC LIMIT 1'
      )
      .get(`%${token}%`, `%${token}%`);
    if (occ) return occ;
  }

  return null;
}

function getDeepSkillsForOccupation(occupationId) {
  const rows = db
    .prepare(`
      SELECT
        s.id, s.name, s.category, s.description, s.why_it_matters,
        s.required_proficiency, s.difficulty_level, os.is_required
      FROM occupation_skills os
      JOIN skills s ON s.id = os.skill_id
      WHERE os.occupation_id = ?
      ORDER BY os.is_required DESC, os.weight DESC, s.category ASC
    `)
    .all(occupationId);

  const prereqStmt = db.prepare(`
    SELECT s.name FROM skill_prerequisites sp
    JOIN skills s ON s.id = sp.prerequisite_skill_id
    WHERE sp.skill_id = ?
  `);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    description: r.description || '',
    whyItMatters: r.why_it_matters || '',
    requiredProficiency: Number(r.required_proficiency || 4),
    difficultyLevel: r.difficulty_level || 'Intermediate',
    isRequired: Boolean(r.is_required),
    prerequisites: prereqStmt.all(r.id).map((p) => p.name),
  }));
}

function buildDeterministicRoadmap(occ, skills, skillRatings = []) {
  const ratingMap = new Map(
    (Array.isArray(skillRatings) ? skillRatings : []).map((r) => [
      String(r.name || '').toLowerCase(),
      Number(r.rating || 1),
    ])
  );

  // Filter out skills student already self-rated >= 4 so roadmap focuses on actual gaps
  const needsFocus = (list) => {
    const filtered = list.filter((s) => {
      const rating = ratingMap.get(s.name.toLowerCase());
      return rating === undefined || rating < 4;
    });
    return (filtered.length > 0 ? filtered : list).map((s) => s.name);
  };

  const beginner = needsFocus(skills.filter((s) => s.difficultyLevel === 'Beginner'));
  const intermediate = needsFocus(skills.filter((s) => s.difficultyLevel === 'Intermediate'));
  const advanced = needsFocus(skills.filter((s) => s.difficultyLevel === 'Advanced'));

  return [
    {
      stepNumber: 1,
      title: `Phase 1: ${occ.title} Core Foundations`,
      subtitle: beginner.length
        ? `Focus on: ${beginner.slice(0, 3).join(', ')}`
        : 'Core domain principles & setup',
      duration: '3-4 Weeks',
      category: 'Foundations',
      deliverable: `${occ.title} Foundation Portfolio Artifact`,
      status: 'current',
    },
    {
      stepNumber: 2,
      title: `Phase 2: Applied Tools & Practical Execution`,
      subtitle: intermediate.length
        ? `Build with: ${intermediate.slice(0, 3).join(', ')}`
        : 'Real-world domain workflows',
      duration: '4-6 Weeks',
      category: 'Execution',
      deliverable: `Verified ${occ.title} Case Study / Project`,
      status: 'upcoming',
    },
    {
      stepNumber: 3,
      title: `Phase 3: Production Mastery & Specialization`,
      subtitle: advanced.length
        ? `Specialize in: ${advanced.slice(0, 3).join(', ')}`
        : 'Industry-grade capstone delivery',
      duration: '5-6 Weeks',
      category: 'Specialization',
      deliverable: `End-to-End ${occ.title} Capstone & ProofPass`,
      status: 'upcoming',
    },
  ];
}

app.post('/api/careers/inspect-skills', (req, res) => {
  const { roleQuery } = req.body || {};
  if (!roleQuery) return res.status(400).json({ error: 'roleQuery required' });

  const matched = findOccupationInDb(roleQuery);
  if (!matched) {
    const suggestions = db
      .prepare('SELECT id, title, category FROM occupations ORDER BY title ASC LIMIT 8')
      .all();
    return res.status(404).json({
      success: false,
      error: `Career "${roleQuery}" not found in verified database.`,
      suggestions,
    });
  }

  const skills = getDeepSkillsForOccupation(matched.id);
  return res.json({
    success: true,
    source: 'sqlite-verified-101-db',
    occupation: {
      id: matched.id,
      title: matched.title,
      category: matched.category,
      domain: matched.domain,
      seniority: matched.seniority,
    },
    skills,
  });
});

app.post('/api/careers/synthesize', (req, res) => {
  const { roleQuery } = req.body || {};
  if (!roleQuery) return res.status(400).json({ error: 'roleQuery is required' });

  const matched = findOccupationInDb(roleQuery);
  if (!matched) {
    return res.status(404).json({
      success: false,
      error: `Career "${roleQuery}" not found in verified 101-career database. Please pick a career from Career Explorer.`,
    });
  }

  const skills = getDeepSkillsForOccupation(matched.id);
  const roadmap = buildDeterministicRoadmap(matched, skills);

  return res.json({
    success: true,
    source: 'sqlite-verified-101-db',
    career: {
      roleId: matched.id,
      roleTitle: matched.title,
      profession: matched.category,
      domainId: matched.domain || 'engineering_tech',
      seniority: matched.seniority || 'Entry / Junior',
      coreCompetencies: skills.slice(0, 5).map((s) => s.name),
      toolsAndFrameworks: skills
        .filter((s) => s.category.toLowerCase().includes('tool'))
        .map((s) => s.name),
      skills,
      roadmap,
    },
  });
});

app.post('/api/careers/generate-tailored-roadmap', (req, res) => {
  const { roleQuery, skillRatings } = req.body || {};
  const query = roleQuery || 'AI Engineer';

  const matched = findOccupationInDb(query);
  if (!matched) {
    return res.status(404).json({
      success: false,
      error: `Career "${query}" not found in verified 101-career database.`,
    });
  }

  const skills = getDeepSkillsForOccupation(matched.id);
  const engineResult = generateAdaptiveRoadmap(
    db,
    matched,
    skills,
    skillRatings,
    req.user?.id || null
  );

  return res.json({
    success: true,
    source: 'sqlite-dag-adaptive-engine',
    roleTitle: matched.title,
    profession: matched.category,
    seniority: matched.seniority || 'Entry / Junior',
    marketDemand: 'High',
    totalPhases: engineResult.totalPhases,
    totalSkillsCovered: engineResult.totalSkillsCovered,
    fastTrackedSkills: engineResult.fastTrackedSkills,
    roadmap: engineResult.roadmap,
  });
});
  


// ==========================================
// 3. STAGE-GATED OPPORTUNITY ENGINE (DYNAMIC DEEP LINKS + ROADMAP SYNC)
// ==========================================
function detectDomainFromRole(roleTitle = '') {
  const r = roleTitle.toLowerCase();
  if (r.includes('doctor') || r.includes('surge') || r.includes('medic') || r.includes('nurse') || r.includes('pharma') || r.includes('health')) return 'healthcare';
  if (r.includes('law') || r.includes('legal') || r.includes('advocate') || r.includes('judic')) return 'legal';
  if (r.includes('pilot') || r.includes('aviat') || r.includes('flight') || r.includes('aero')) return 'aviation';
  if (r.includes('financ') || r.includes('bank') || r.includes('account') || r.includes('invest') || r.includes('trade')) return 'finance';
  if (r.includes('design') || r.includes('ui') || r.includes('ux') || r.includes('product designer') || r.includes('animat')) return 'design';
  return 'tech';
}

function generateTailoredOpportunities(roleTitle = 'Professional', userSkills = [], currentPhaseNum = 1) {
  const domain = detectDomainFromRole(roleTitle);
  const portals = opportunitiesMasterBank.portals || [];

  const matchedPortals = portals.filter(
    (p) => p.domains.includes(domain) || p.domains.includes('all') || p.domains.includes('general')
  );

  return matchedPortals
    .map((portal, index) => {
      const cleanQuery = encodeURIComponent(roleTitle.trim());
      let dynamicApplyUrl = portal.baseQueryUrl;

      if (portal.baseQueryUrl.endsWith('=') || portal.baseQueryUrl.endsWith('-')) {
        dynamicApplyUrl = `${portal.baseQueryUrl}${cleanQuery}`;
      }

      let requiredPhase = 1;
      let eligiblePhases = [1, 2, 3, 4];

      if (portal.type === 'INTERNSHIP') {
        requiredPhase = 2;
        eligiblePhases = [2, 3, 4];
      } else if (portal.type === 'JOB') {
        requiredPhase = 3;
        eligiblePhases = [3, 4];
      } else if (portal.type === 'FELLOWSHIP') {
        requiredPhase = index % 2 === 0 ? 1 : 2;
        eligiblePhases = requiredPhase === 1 ? [1, 2, 3, 4] : [2, 3, 4];
      }

      const isPhaseEligible = currentPhaseNum >= requiredPhase;
      const baseScore = 75 + ((index * 5) % 18);
      const phaseAdjustedScore = isPhaseEligible
        ? Math.min(98, baseScore + currentPhaseNum * 4)
        : Math.max(45, baseScore - 20);

      const missingGaps = !isPhaseEligible
        ? [`Phase ${requiredPhase} Milestone Deliverable`, 'Production Telemetry']
        : index === 0
          ? []
          : ['Advanced Edge-Cases'];

      return {
        id: `live-opp-${portal.id}-${index}`,
        title: `${roleTitle} ${portal.type === 'HACKATHON' ? 'Challenge Sprint' : portal.type === 'INTERNSHIP' ? 'Cohort Internship' : portal.type === 'FELLOWSHIP' ? 'Research Fellowship' : 'Early Career Role'}`,
        organization: portal.name,
        type: portal.type,
        location: portal.domains.includes('tech') ? 'Remote / Hybrid' : 'Pan-India / Hybrid',
        deadline: 'Active 2026',
        applyUrl: dynamicApplyUrl,
        authorityBadge: portal.authority,
        matchScore: phaseAdjustedScore,
        summary: portal.description,
        requiredSkills: [roleTitle, 'Core Execution', 'Problem Solving'],
        missingSkills: missingGaps,
        requiredPhase,
        eligiblePhases,
        isDynamicDeepLink: true,
        stipendOrPrize:
          portal.type === 'HACKATHON'
            ? '₹1,00,000+ Prize Pool'
            : portal.type === 'INTERNSHIP'
              ? '₹25,000 - ₹45,000 / mo'
              : 'Industry Standard',
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

app.post('/api/opportunities/radar', (req, res) => {
  const { targetRole, userSkills, currentPhase } = req.body || {};
  const roleTitle = targetRole?.roleTitle || 'Core Engineering';
  const phaseStep = currentPhase?.stepNumber || 1;

  const tailoredOpps = generateTailoredOpportunities(roleTitle, userSkills, phaseStep);

  return res.json({
    success: true,
    source: 'stage-gated-deep-link-radar',
    opportunities: tailoredOpps,
    futureAlerts: [
      {
        id: 'alt-sih-2026',
        title: 'Smart India Hackathon 2026 Active Window',
        source: 'AICTE / SIH Portal',
        category: 'HACKATHON',
        date: 'Active Registration 2026',
        actionText: 'Register Now',
        priority: 'HIGH',
        applyUrl: 'https://www.sih.gov.in',
      },
    ],
  });
});

app.post('/api/opportunities/discover', (req, res) => {
  const { roleTitle, userSkills, currentPhase } = req.body || {};
  const tailored = generateTailoredOpportunities(
    roleTitle || 'Professional',
    userSkills,
    currentPhase?.stepNumber || 1
  );
  return res.json({ success: true, opportunities: tailored });
});

// ==========================================
// 4. PROJECTS RECOMMENDATION
// ==========================================
app.post('/api/projects/recommend', (req, res) => {
  const { targetRole, skillGaps } = req.body || {};
  const roleTitle = targetRole?.roleTitle || 'Core Engineering';
  const gaps = (skillGaps || []).slice(0, 2);

  return res.json({
    success: true,
    projects: [
      {
        id: 'proj-1',
        title: `${roleTitle} Production Architecture Baseline`,
        level: 'BEGINNER',
        whatYouWillBuild: `A structured repository baseline tailored for ${roleTitle} with validated contracts and unit tests.`,
        problemStatement: 'Candidates often lack production hygiene and decoupled project structure.',
        deliverableType: 'GitHub Repository & CI Pipeline',
        estimatedHours: 15,
        skillsDeveloped: gaps.length ? gaps : ['Clean Architecture', 'Testing'],
        whyRecommended: `Reinforces Phase 1 foundational requirements for ${roleTitle}.`,
        milestones: [
          'Scaffold repository & linter',
          'Implement service boundaries',
          'Add automated tests',
        ],
      },
      {
        id: 'proj-2',
        title: `${roleTitle} High-Throughput Resilience System`,
        level: 'INTERMEDIATE',
        whatYouWillBuild: `An end-to-end service featuring asynchronous data flow, structured logging, and automated failure recovery.`,
        problemStatement: 'Real-world services must handle network dropouts and high concurrency gracefully.',
        deliverableType: 'Live Containerized Microservice',
        estimatedHours: 25,
        skillsDeveloped: ['Fault Tolerance', 'Asynchronous Queues'],
        whyRecommended: 'Eliminates active technical skill gaps through hands-on implementation.',
        milestones: [
          'Design schemas & contracts',
          'Build resilient pipelines with retry logic',
          'Benchmark metrics',
        ],
      },
    ],
  });
});

// ==========================================
// 5. 100% DETERMINISTIC ZERO-API SKILL-CHECK GENERATOR
// ==========================================
app.post('/api/skill-check/generate', (req, res) => {
  const { targetRole, currentPhase } = req.body || {};
  const roleTitle = (targetRole?.roleTitle || '').toLowerCase();
  const domainId = (targetRole?.domainId || '').toLowerCase();
  const phaseStep = currentPhase?.stepNumber || 1;
  const phaseKey = phaseStep >= 2 ? 'phase2' : 'phase1';

  let matchedDomain = 'frontend';
  if (roleTitle.includes('front') || roleTitle.includes('ui') || roleTitle.includes('web') || roleTitle.includes('react')) {
    matchedDomain = 'frontend';
  } else if (roleTitle.includes('back') || roleTitle.includes('devops') || roleTitle.includes('cloud') || roleTitle.includes('system') || roleTitle.includes('engineer')) {
    matchedDomain = 'backend';
  } else if (roleTitle.includes('doctor') || roleTitle.includes('surgeon') || roleTitle.includes('medic') || roleTitle.includes('cardio') || domainId.includes('health')) {
    matchedDomain = 'medicine';
  } else if (roleTitle.includes('law') || roleTitle.includes('advocate') || roleTitle.includes('legal') || domainId.includes('law')) {
    matchedDomain = 'law';
  } else if (roleTitle.includes('pilot') || roleTitle.includes('aviation') || roleTitle.includes('flight')) {
    matchedDomain = 'aviation';
  } else if (roleTitle.includes('financ') || roleTitle.includes('account') || roleTitle.includes('bank') || roleTitle.includes('analyst')) {
    matchedDomain = 'finance';
  }

  const domainData = roleExamBank[matchedDomain] || roleExamBank['frontend'] || {};
  let pool = domainData[phaseKey] || [];

  if (pool.length === 0) {
    pool = domainData['phase1'] || [];
  }

  const finalQuestions = pool.map((q, idx) => {
    const opts = [...q.options];
    const correctOpt = opts[q.correctIndex || 0];
    const shuffledOpts = opts.sort(() => Math.random() - 0.5);
    const newIdx = shuffledOpts.indexOf(correctOpt);

    return {
      ...q,
      id: `${q.id}-${Date.now()}-${idx}`,
      options: shuffledOpts,
      correctIndex: newIdx,
    };
  });

  const attemptId = `att-det-${Date.now()}`;
  assessmentSessions.set(attemptId, {
    questions: finalQuestions,
    targetRole: targetRole?.roleTitle || 'Professional',
    phaseStep,
  });

  console.log(
    `[Exam Generator] Dispensed ${finalQuestions.length} zero-API questions for ${targetRole?.roleTitle || 'Professional'} (${phaseKey})`
  );

  return res.json({
    success: true,
    attemptId,
    totalQuestions: finalQuestions.length,
    questions: finalQuestions.map(({ id, difficulty, skill, question, snippet, options }) => ({
      id,
      type: 'mcq',
      difficulty,
      skill,
      question,
      snippet: snippet || null,
      options,
    })),
  });
});

// ==========================================
// 6. DYNAMIC SKILL-CHECK SUBMISSION (SKILL BREAKDOWN + 90% MASTERY GATE)
// ==========================================
app.post('/api/skill-check/submit', (req, res) => {
  const { attemptId, userAnswers, currentProfile } = req.body || {};
  const session = assessmentSessions.get(attemptId);
  const questions = session?.questions || [];

  if (!questions.length) {
    return res.status(400).json({ error: 'Assessment session expired or invalid.' });
  }

  let correctCount = 0;
  const skillStats = {};

  questions.forEach((q, idx) => {
    const isCorrect =
      userAnswers?.[q.id] === q.correctIndex || userAnswers?.[idx] === q.correctIndex;
    if (isCorrect) correctCount++;

    const sk = q.skill || 'Core Knowledge';
    if (!skillStats[sk]) skillStats[sk] = { total: 0, correct: 0 };
    skillStats[sk].total += 1;
    if (isCorrect) skillStats[sk].correct += 1;
  });

  const overallScore = Math.round((correctCount / questions.length) * 100);
  const isPhaseMastered = overallScore >= 90;

  const skillBreakdown = Object.keys(skillStats).map((sk) => ({
    skill: sk,
    percentage: Math.round((skillStats[sk].correct / skillStats[sk].total) * 100),
  }));

  let updatedProfile = { ...currentProfile };
  if (isPhaseMastered && currentProfile?.roadmap) {
    const roadmap = [...currentProfile.roadmap];
    const currentIdx = roadmap.findIndex((m) => m.status === 'current');
    if (currentIdx !== -1) {
      roadmap[currentIdx] = { ...roadmap[currentIdx], status: 'completed' };
      if (currentIdx + 1 < roadmap.length) {
        roadmap[currentIdx + 1] = {
          ...roadmap[currentIdx + 1],
          status: 'current',
          assessmentUnlocked: true,
        };
      }
    }
    updatedProfile = {
      ...currentProfile,
      roadmap,
      readinessPercentage: Math.min(100, (currentProfile.readinessPercentage || 40) + 15),
    };
  }

  return res.json({
    success: true,
    overallScore,
    correctCount,
    totalQuestions: questions.length,
    isPhaseMastered,
    skillBreakdown,
    updatedProfile: isPhaseMastered ? updatedProfile : null,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`FutureX Hybrid Intelligence Layer running on port ${PORT}`);
});