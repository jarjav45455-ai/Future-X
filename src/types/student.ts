export type CareerDomainId =
  | 'engineering_tech'
  | 'business_management'
  | 'law_legal'
  | 'medicine_healthcare'
  | 'science_research'
  | 'design_creative'
  | 'finance_economics'
  | 'media_communication'
  | 'public_service';

export type SeniorityLevel = 'Entry / Junior' | 'Mid-Level' | 'Senior / Lead';

export type EvidenceStatus = 'Self Reported' | 'In Progress' | 'Assessed' | 'Verified' | 'Proof-Verified';

export interface SkillItem {
  id: string;
  name: string;
  category: 'CORE KNOWLEDGE' | 'TECHNICAL / DOMAIN' | 'TOOLS' | 'PRACTICAL' | 'PROBLEM SOLVING';
  proficiency: number; // 0 - 100
  targetBenchmark?: number; // Target role required benchmark (e.g. 85%)
  status: EvidenceStatus;
  lastAssessed?: string;
  isGap?: boolean;
  verifiedBy?: string; // e.g. "Phase 1 Balanced Assessment"
  evidenceRepoUrl?: string; // Deliverable repository link
}

export interface TargetRoleProfile {
  roleId: string;
  roleTitle: string;
  profession: string;
  domainId: CareerDomainId;
  seniority: SeniorityLevel;
  requiredSkills: string[];
  keyTools: string[];
  marketDemand: 'High' | 'Very High' | 'Critical';
}

export interface ProofItem {
  id: string;
  title: string;
  type: 'Project' | 'Assessment' | 'Moot Court' | 'Case Study' | 'Research Paper' | 'Certification' | 'Internship';
  domain: string;
  roleRef: string;
  status: EvidenceStatus;
  issuedBy?: string;
  verificationBadgeUrl?: string;
  date: string;
  skillsDemonstrated: string[];
  proofHash?: string;
  repoUrl?: string;
}

export interface OpportunityItem {
  id: string;
  title: string;
  organization: string;
  domainId: CareerDomainId;
  targetRole: string;
  type: 'Internship' | 'Fellowship' | 'Competition / Challenge' | 'Research Opportunity' | 'Job';
  location: string;
  isRemote: boolean;
  deadline: string;
  applicationUrl: string;
  sourceUrl: string;
  verified: boolean;
  requiredSkills: string[];
  matchScore: number;
  matchReasons: string[];
  missingSkills: string[];
  estimatedPrepDays: number;
}

export interface RoadmapMilestone {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  category: string;
  duration: string;
  prerequisites: string[];
  deliverable: string;
  status: 'completed' | 'current' | 'upcoming';
  assessmentUnlocked: boolean;
}

export interface StudentProfile {
  id: string;
  name: string;
  targetRole: TargetRoleProfile;
  readinessPercentage: number;
  skills: SkillItem[];
  roadmap: RoadmapMilestone[];
  proofPass: ProofItem[];
  opportunities: OpportunityItem[];
  weeklyCommitmentHours: number;
  proofPassHash?: string; // e.g. "FX-PASS-2026-ARJ-90"
  recruiterModeEnabled?: boolean;
}