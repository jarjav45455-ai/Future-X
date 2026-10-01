const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 0. LOCAL DETERMINISTIC MASTER STORES
// ==========================================
let careerBankData = { roles: [] };
try {
  const bankPath = path.join(__dirname, 'careerBank.json');
  if (fs.existsSync(bankPath)) {
    careerBankData = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
    console.log(`[FutureX DB] Loaded ${careerBankData.roles.length} benchmark careers from careerBank.json`);
  }
} catch (e) {
  console.warn('[FutureX DB] careerBank.json read error, using dynamic AI mode:', e.message);
}

// Load Local Role Exam Master Bank (Zero-API Assessment Store)
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

// Load Master Opportunity Bank (Zero-API Dynamic Portals)
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

// Self-Growing Pipeline: Persist newly synthesized careers to disk
function persistCareerToBank(newCareer) {
  try {
    const bankPath = path.join(__dirname, 'careerBank.json');
    const exists = careerBankData.roles.some((r) => r.id === newCareer.id);
    if (!exists) {
      careerBankData.roles.push(newCareer);
      fs.writeFileSync(bankPath, JSON.stringify(careerBankData, null, 2), 'utf8');
      console.log(`[Self-Growing DB] Ingested & saved new career to disk: "${newCareer.title}" (Total Roles: ${careerBankData.roles.length})`);
    }
  } catch (err) {
    console.error('[Self-Growing DB Write Error]:', err.message);
  }
}

// In-Memory Caches & Sessions
const assessmentSessions = new Map();
const projectCache = new Map();
const skillsCache = new Map();
const roadmapCache = new Map();

// Multi-Key Google GenAI Setup
const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_BACKUP || process.env.GEMINI_API_KEY
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
        model: 'gemini-3.6-flash',
      });
    } catch (err) {
      lastError = err;
      const isQuota = err?.message?.includes('429') || err?.status === 429 || err?.message?.includes('RESOURCE_EXHAUSTED');
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
        messages: [{ role: 'user', content: typeof modelParams.contents === 'string' ? modelParams.contents : JSON.stringify(modelParams.contents) }],
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
  res.json({ status: 'active', platform: 'FutureX Hybrid Intelligence Layer' });
});

// ==========================================
// 1. CONVERSATIONAL CAREER MENTOR (PURE AI)
// ==========================================
app.post('/api/mentor/ask', async (req, res) => {
  try {
    const { studentProfile, history, question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const roleTitle = studentProfile?.targetRole?.roleTitle || 'Professional';
    const currentPhase = studentProfile?.roadmap?.find((m) => m.status === 'current');
    const roadmapSummary = currentPhase ? `${currentPhase.title} (${currentPhase.subtitle})` : 'Foundations';

    const systemInstruction = `You are FutureX Senior Career Intelligence Mentor.
Mentoring Profile: Role: "${roleTitle}", Current Phase: "${roadmapSummary}", Readiness: ${studentProfile?.readinessPercentage || 0}%.
Deliver concise, highly actionable guidance under 120 words. No boilerplate.`;

    const contents = [];
    if (Array.isArray(history)) {
      for (const turn of history.slice(-6)) {
        contents.push({ role: turn.sender === 'student' ? 'user' : 'model', parts: [{ text: turn.text }] });
      }
    }
    contents.push({ role: 'user', parts: [{ text: question }] });

    const response = await generateWithRetry({
      contents,
      config: { systemInstruction, temperature: 0.25 },
    });

    return res.json({ success: true, answer: response.text?.trim() || 'Guidance temporarily unavailable.' });
  } catch (error) {
    console.error('[Mentor Error]:', error?.message);
    res.status(500).json({ error: 'Career mentor is currently offline.' });
  }
});

// ==========================================
// 2. DYNAMIC SKILL INSPECTION & ROADMAP
// ==========================================
app.post('/api/careers/inspect-skills', async (req, res) => {
  const { roleQuery } = req.body;
  if (!roleQuery) return res.status(400).json({ error: 'roleQuery required' });

  const queryNorm = roleQuery.toLowerCase().trim();

  // 1. Check local careerBank.json (Deterministic Fast Path)
  const matchedRole = careerBankData.roles.find(
    (r) => r.id === queryNorm.replace(/\s+/g, '-') || r.title.toLowerCase().includes(queryNorm)
  );

  if (matchedRole && matchedRole.skills) {
    return res.json({ success: true, source: 'deterministic-db', skills: matchedRole.skills });
  }

  // 2. In-Memory Cache
  if (skillsCache.has(queryNorm)) {
    return res.json({ success: true, source: 'cache', skills: skillsCache.get(queryNorm) });
  }

  // 3. AI Synthesizer (Only for unknown/rare roles)
  try {
    console.log(`[AI Engine] Long-tail skill extraction for: "${roleQuery}"`);
    const prompt = `Extract 8 to 12 essential competencies for "${roleQuery}". Return ONLY a strict JSON array:
[{"id": "sk-1", "name": "Skill Name", "category": "Core Knowledge / Tools / Technical", "description": "Brief 1-line reason"}]`;

    const response = await generateWithRetry({ contents: prompt, config: { temperature: 0.2 } });
    let raw = (response.text || '').trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    const skills = JSON.parse(raw);
    skillsCache.set(queryNorm, skills);
    return res.json({ success: true, source: 'ai-synthesis', skills });
  } catch (error) {
    const fallback = [
      { id: 'sk-1', name: `${roleQuery} Core Fundamentals`, category: 'Core Knowledge' },
      { id: 'sk-2', name: 'Standard Industry Toolchain', category: 'Tools' },
      { id: 'sk-3', name: 'Operational Execution', category: 'Technical' }
    ];
    return res.json({ success: true, source: 'fallback', skills: fallback });
  }
});

app.post('/api/careers/synthesize', async (req, res) => {
  const { roleQuery } = req.body;
  if (!roleQuery) return res.status(400).json({ error: 'roleQuery is required' });

  const queryNorm = roleQuery.toLowerCase().trim();

  // 1. Deterministic Fast Path: Check existing roles in memory
  const matched = careerBankData.roles.find(
    (r) => r.id === queryNorm.replace(/\s+/g, '-') || r.title.toLowerCase().includes(queryNorm)
  );

  if (matched) {
    return res.json({
      success: true,
      source: 'deterministic-db',
      career: {
        roleId: matched.id,
        roleTitle: matched.title,
        profession: matched.domain,
        domainId: (matched.domain || 'general').toLowerCase(),
        seniority: matched.seniority || 'Junior to Mid-Level',
        skills: matched.skills,
        roadmap: matched.roadmap,
      },
    });
  }

  // 2. Layer 4: AI Synthesis for Unknown Long-Tail Career
  try {
    console.log(`[Self-Growing Pipeline] Synthesizing unknown role via AI: "${roleQuery}"`);
    
    const prompt = `You are a workforce intelligence architect. Generate a complete structured career profile for the role: "${roleQuery}".
Return ONLY a valid JSON object matching this exact schema:
{
  "id": "${queryNorm.replace(/[^a-z0-9]/g, '-')}",
  "title": "${roleQuery}",
  "domain": "Target Industry Domain",
  "seniority": "Junior to Mid-Level",
  "skills": [
    {"id": "sk-1", "name": "Exact Skill 1", "category": "Core Knowledge"},
    {"id": "sk-2", "name": "Exact Skill 2", "category": "Tools"},
    {"id": "sk-3", "name": "Exact Skill 3", "category": "Technical"},
    {"id": "sk-4", "name": "Exact Skill 4", "category": "Execution"},
    {"id": "sk-5", "name": "Exact Skill 5", "category": "Core Knowledge"},
    {"id": "sk-6", "name": "Exact Skill 6", "category": "Tools"}
  ],
  "roadmap": [
    {
      "stepNumber": 1,
      "title": "Phase 1: Foundational Systems",
      "subtitle": "Core theoretical frameworks and setup",
      "duration": "4 Weeks",
      "category": "Foundations",
      "deliverable": "Baseline Architectural Spec",
      "status": "current"
    },
    {
      "stepNumber": 2,
      "title": "Phase 2: Applied Workflows",
      "subtitle": "Practical domain implementations",
      "duration": "5 Weeks",
      "category": "Execution",
      "deliverable": "Verified Production Case Deliverable",
      "status": "upcoming"
    },
    {
      "stepNumber": 3,
      "title": "Phase 3: Production & Specialization",
      "subtitle": "Advanced integration, telemetry, and edge-cases",
      "duration": "6 Weeks",
      "category": "Specialization",
      "deliverable": "End-to-End Capstone Project",
      "status": "upcoming"
    }
  ]
}`;

    const response = await generateWithRetry({
      contents: prompt,
      config: { temperature: 0.2 },
    });

    let raw = (response.text || '')
      .trim()
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();

    const synthesizedRole = JSON.parse(raw);

    // Persist to disk
    persistCareerToBank(synthesizedRole);

    return res.json({
      success: true,
      source: 'ai-synthesized-and-persisted',
      career: {
        roleId: synthesizedRole.id,
        roleTitle: synthesizedRole.title,
        profession: synthesizedRole.domain,
        domainId: (synthesizedRole.domain || 'general').toLowerCase(),
        seniority: synthesizedRole.seniority,
        skills: synthesizedRole.skills,
        roadmap: synthesizedRole.roadmap,
      },
    });
  } catch (error) {
    console.error('[Synthesize Fallback Triggered]:', error.message);
    
    const fallbackRole = {
      id: queryNorm.replace(/[^a-z0-9]/g, '-'),
      title: roleQuery,
      domain: 'Specialized Practice',
      seniority: 'Junior to Mid-Level',
      skills: [
        { id: 'sk-1', name: `${roleQuery} Core Fundamentals`, category: 'Core Knowledge' },
        { id: 'sk-2', name: 'Operational Field Toolchain', category: 'Tools' },
        { id: 'sk-3', name: 'Execution & QA Standards', category: 'Technical' }
      ],
      roadmap: [
        { stepNumber: 1, title: 'Phase 1: Foundations', subtitle: 'Core baseline principles', deliverable: 'Baseline Artifact', duration: '4 Weeks', status: 'current' },
        { stepNumber: 2, title: 'Phase 2: Applied Operations', subtitle: 'Simulated industry workflows', deliverable: 'Verified Deliverable', duration: '5 Weeks', status: 'upcoming' }
      ]
    };

    persistCareerToBank(fallbackRole);

    return res.json({
      success: true,
      source: 'deterministic-fallback',
      career: {
        roleId: fallbackRole.id,
        roleTitle: fallbackRole.title,
        profession: fallbackRole.domain,
        domainId: 'domain-general',
        seniority: fallbackRole.seniority,
        skills: fallbackRole.skills,
        roadmap: fallbackRole.roadmap,
      }
    });
  }
});

// Tailored Roadmap Endpoint
app.post('/api/careers/generate-tailored-roadmap', (req, res) => {
  const { roleQuery } = req.body || {};
  const query = roleQuery || 'Professional Track';

  const queryNorm = query.toLowerCase().trim();
  const matched = careerBankData.roles.find(
    (r) => r.id === queryNorm.replace(/\s+/g, '-') || r.title.toLowerCase().includes(queryNorm)
  );

  if (matched && matched.roadmap) {
    return res.json({
      success: true,
      roleTitle: matched.title,
      profession: matched.domain,
      seniority: matched.seniority || 'Junior to Mid-Level',
      marketDemand: 'High',
      roadmap: matched.roadmap,
    });
  }

  return res.json({
    success: true,
    roleTitle: query,
    profession: 'Industry Practice',
    seniority: 'Junior to Mid-Level',
    marketDemand: 'High',
    roadmap: [
      {
        stepNumber: 1,
        title: `Phase 1: ${query} Baseline Systems`,
        subtitle: 'Core operational standards, protocols, and architectural foundations',
        duration: '4 Weeks',
        category: 'Foundations',
        deliverable: `${query} Verified Architecture Portfolio`,
        status: 'current',
      },
      {
        stepNumber: 2,
        title: `Phase 2: Production Execution & Rigor`,
        subtitle: 'Hands-on workflow delivery and real-world system benchmarks',
        duration: '5 Weeks',
        category: 'Execution',
        deliverable: 'Production Case Artifact & Technical ProofPass',
        status: 'upcoming',
      },
      {
        stepNumber: 3,
        title: `Phase 3: High-Scale Reliability & Specialization`,
        subtitle: 'Edge-case handling, distributed optimization, and domain mastery',
        duration: '6 Weeks',
        category: 'Specialization',
        deliverable: 'Industry Capstone Deliverable',
        status: 'upcoming',
      },
    ],
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
  return 'tech'; // Default tech & systems
}

function generateTailoredOpportunities(roleTitle = 'Professional', userSkills = [], currentPhaseNum = 1) {
  const domain = detectDomainFromRole(roleTitle);
  const portals = opportunitiesMasterBank.portals || [];

  const matchedPortals = portals.filter((p) =>
    p.domains.includes(domain) || p.domains.includes('all') || p.domains.includes('general')
  );

  return matchedPortals.map((portal, index) => {
    const cleanQuery = encodeURIComponent(roleTitle.trim());
    let dynamicApplyUrl = portal.baseQueryUrl;

    if (portal.baseQueryUrl.endsWith('=') || portal.baseQueryUrl.endsWith('-')) {
      dynamicApplyUrl = `${portal.baseQueryUrl}${cleanQuery}`;
    }

    // Determine Required Roadmap Phase for this specific opportunity
    // Hackathons & Foundation fellowships = Phase 1; Internships = Phase 2; High-tier Jobs = Phase 3
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

    // Stage-Gated Dynamic Scoring
    const baseScore = 75 + ((index * 5) % 18);
    const phaseAdjustedScore = isPhaseEligible
      ? Math.min(98, baseScore + (currentPhaseNum * 4))
      : Math.max(45, baseScore - 20);

    const missingGaps = !isPhaseEligible
      ? [`Phase ${requiredPhase} Milestone Deliverable`, 'Production Telemetry']
      : (index === 0 ? [] : ['Advanced Edge-Cases']);

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
      stipendOrPrize: portal.type === 'HACKATHON' ? '₹1,00,000+ Prize Pool' : portal.type === 'INTERNSHIP' ? '₹25,000 - ₹45,000 / mo' : 'Industry Standard'
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
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
      }
    ],
  });
});

app.post('/api/opportunities/discover', (req, res) => {
  const { roleTitle, userSkills, currentPhase } = req.body || {};
  const tailored = generateTailoredOpportunities(roleTitle || 'Professional', userSkills, currentPhase?.stepNumber || 1);
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
        milestones: ['Scaffold repository & linter', 'Implement service boundaries', 'Add automated tests']
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
        milestones: ['Design schemas & contracts', 'Build resilient pipelines with retry logic', 'Benchmark metrics']
      }
    ]
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

  // 1. Detect Category Deterministically
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

  // 2. Extract Questions for Domain & Phase
  const domainData = roleExamBank[matchedDomain] || roleExamBank['frontend'] || {};
  let pool = domainData[phaseKey] || [];

  if (pool.length === 0) {
    pool = domainData['phase1'] || [];
  }

  // Shuffle options so correct index is randomized
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

  console.log(`[Exam Generator] Dispensed ${finalQuestions.length} zero-API questions for ${targetRole?.roleTitle || 'Professional'} (${phaseKey})`);

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
    const isCorrect = userAnswers?.[q.id] === q.correctIndex || userAnswers?.[idx] === q.correctIndex;
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
        roadmap[currentIdx + 1] = { ...roadmap[currentIdx + 1], status: 'current', assessmentUnlocked: true };
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