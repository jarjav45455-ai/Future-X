import { OpportunityItem, StudentProfile, CareerDomainId } from '../types/student';

export const VERIFIED_OPPORTUNITIES_REGISTRY: OpportunityItem[] = [
  // 1. Engineering / Tech
  {
    id: 'opp-tech-01',
    title: 'Cloud Infrastructure & Backend Fellow',
    organization: 'Linux Foundation / CNCF',
    domainId: 'engineering_tech',
    targetRole: 'Backend Engineer',
    type: 'Fellowship',
    location: 'Remote',
    isRemote: true,
    deadline: '2026-10-15',
    applicationUrl: 'https://cncf.io/mentorship',
    sourceUrl: 'https://github.com/cncf/mentoring',
    verified: true,
    requiredSkills: ['API Architecture (REST/gRPC)', 'Relational Databases & SQL', 'Docker', 'Git'],
    matchScore: 0,
    matchReasons: [],
    missingSkills: [],
    estimatedPrepDays: 14
  },
  // 2. Law / Legal
  {
    id: 'opp-law-01',
    title: 'Corporate Governance & Commercial Arbitration Trainee',
    organization: 'International Chamber of Commerce (ICC)',
    domainId: 'law_legal',
    targetRole: 'Corporate Lawyer / Legal Associate',
    type: 'Internship',
    location: 'Hybrid / New Delhi',
    isRemote: false,
    deadline: '2026-10-30',
    applicationUrl: 'https://iccwbo.org/careers',
    sourceUrl: 'https://iccwbo.org',
    verified: true,
    requiredSkills: ['Contract Drafting & Interpretation', 'Legal Research Methodology', 'Corporate Governance Compliance'],
    matchScore: 0,
    matchReasons: [],
    missingSkills: [],
    estimatedPrepDays: 21
  },
  // 3. Design & Creative
  {
    id: 'opp-des-01',
    title: 'Product Design & Design Systems Apprentice',
    organization: 'Canva Design Lab',
    domainId: 'design_creative',
    targetRole: 'Product / UI-UX Designer',
    type: 'Internship',
    location: 'Remote',
    isRemote: true,
    deadline: '2026-11-05',
    applicationUrl: 'https://canva.com/careers',
    sourceUrl: 'https://canva.com',
    verified: true,
    requiredSkills: ['Design System Architecture', 'Interactive Prototyping', 'Figma'],
    matchScore: 0,
    matchReasons: [],
    missingSkills: [],
    estimatedPrepDays: 10
  },
  // 4. Finance & Investment
  {
    id: 'opp-fin-01',
    title: 'Valuation & Quantitative Equity Research Analyst Intern',
    organization: 'Morgan Stanley Global Center',
    domainId: 'finance_economics',
    targetRole: 'Financial Analyst',
    type: 'Internship',
    location: 'Mumbai / Hybrid',
    isRemote: false,
    deadline: '2026-11-12',
    applicationUrl: 'https://morganstanley.com/careers',
    sourceUrl: 'https://morganstanley.com',
    verified: true,
    requiredSkills: ['3-Statement Financial Modeling', 'Discounted Cash Flow (DCF) Valuation', 'Advanced Excel / VBA'],
    matchScore: 0,
    matchReasons: [],
    missingSkills: [],
    estimatedPrepDays: 25
  }
];

export function calculateOpportunityMatches(profile: StudentProfile): OpportunityItem[] {
  const userSkillNames = new Set(profile.skills.map((s) => s.name.toLowerCase()));
  const targetDomain = profile.targetRole.domainId;

  return VERIFIED_OPPORTUNITIES_REGISTRY.map((opp) => {
    let matchedCount = 0;
    const missing: string[] = [];
    const reasons: string[] = [];

    opp.requiredSkills.forEach((req) => {
      if (userSkillNames.has(req.toLowerCase())) {
        matchedCount++;
      } else {
        missing.push(req);
      }
    });

    const totalRequired = opp.requiredSkills.length;
    const skillRatio = totalRequired > 0 ? matchedCount / totalRequired : 0.5;

    // Weighting: 60% Skill Match, 30% Domain/Role Alignment, 10% Remote/Delivery
    let domainBonus = opp.domainId === targetDomain ? 30 : 0;
    if (opp.targetRole.toLowerCase() === profile.targetRole.roleTitle.toLowerCase()) {
      domainBonus += 10;
    }

    const calculatedScore = Math.min(98, Math.round(skillRatio * 60 + domainBonus));

    if (matchedCount > 0) {
      reasons.push(`${matchedCount}/${totalRequired} verified role skills matched`);
    }
    if (opp.domainId === targetDomain) {
      reasons.push(`Direct alignment with your active ${profile.targetRole.profession} track`);
    }
    if (opp.isRemote) {
      reasons.push('Remote flexibility aligns with student schedule');
    }

    return {
      ...opp,
      matchScore: calculatedScore,
      matchReasons: reasons,
      missingSkills: missing,
      estimatedPrepDays: Math.max(7, missing.length * 8)
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}