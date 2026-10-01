import { CareerDomainId } from '../types/student';

export interface ProjectBlueprint {
  id: string;
  title: string;
  domainId: CareerDomainId;
  targetRole: string;
  problemStatement: string;
  industryRelevance: string;
  skillsDeveloped: string[];
  deliverableType: 'GitHub Repository' | 'Legal Brief PDF' | 'Financial Model (.xlsx)' | 'Figma Prototype' | 'Research Protocol';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  milestones: string[];
}

export const DOMAIN_PROJECT_BLUEPRINTS: Record<string, ProjectBlueprint[]> = {
  'backend-engineer': [
    {
      id: 'proj-be-1',
      title: 'High-Throughput Distributed Rate Limiter',
      domainId: 'engineering_tech',
      targetRole: 'Backend Engineer',
      problemStatement: 'Build a distributed sliding-window rate limiter service capable of handling 50k req/sec using Redis memory stores.',
      industryRelevance: 'Directly mirrors standard production traffic guards used at Stripe and Cloudflare.',
      skillsDeveloped: ['API Architecture', 'Redis Caching', 'Concurrency', 'Docker'],
      deliverableType: 'GitHub Repository',
      difficulty: 'Intermediate',
      estimatedHours: 18,
      milestones: ['Token bucket design', 'Redis atomic scripts', 'Benchmarking test', 'Dockerized deployment']
    }
  ],
  'corporate-lawyer': [
    {
      id: 'proj-law-1',
      title: 'Cross-Border Tech Acquisition Due Diligence Memo',
      domainId: 'law_legal',
      targetRole: 'Corporate Lawyer / Legal Associate',
      problemStatement: 'Draft a complete regulatory risk and liability assessment memo for a cross-border SaaS acquisition under FDI guidelines.',
      industryRelevance: 'Essential portfolio piece for tier-1 corporate law firm recruitment.',
      skillsDeveloped: ['Contract Interpretation', 'FDI Regulations', 'Due Diligence', 'Legal Drafting'],
      deliverableType: 'Legal Brief PDF',
      difficulty: 'Advanced',
      estimatedHours: 24,
      milestones: ['Target data room review', 'Statutory liability matrix', 'Indemnity clause redlining', 'Executive legal memo']
    }
  ],
  'financial-analyst': [
    {
      id: 'proj-fin-1',
      title: '3-Statement Dynamic LBO Valuation Model',
      domainId: 'finance_economics',
      targetRole: 'Financial Analyst',
      problemStatement: 'Construct a dynamic Leveraged Buyout (LBO) debt-paydown model with sensitivity tables for an enterprise software buyout.',
      industryRelevance: 'Standard technical assessment given during Private Equity and Investment Banking interviews.',
      skillsDeveloped: ['Financial Modeling', 'DCF Valuation', 'Debt Waterfall', 'Sensitivity Analysis'],
      deliverableType: 'Financial Model (.xlsx)',
      difficulty: 'Advanced',
      estimatedHours: 20,
      milestones: ['Historical normalization', 'Debt schedule structure', 'Returns & IRR matrix', 'Executive pitch deck']
    }
  ],
  'product-designer': [
    {
      id: 'proj-des-1',
      title: 'Fintech Design System & Accessibility Audit',
      domainId: 'design_creative',
      targetRole: 'Product / UI-UX Designer',
      problemStatement: 'Design an accessible, enterprise-grade mobile banking design system adhering strictly to WCAG 2.1 AA standards.',
      industryRelevance: 'Essential proof of systematic UI/UX capability beyond surface-level aesthetics.',
      skillsDeveloped: ['Design System Architecture', 'WCAG Accessibility', 'Figma Auto-layout', 'Interactive Prototyping'],
      deliverableType: 'Figma Prototype',
      difficulty: 'Intermediate',
      estimatedHours: 16,
      milestones: ['Semantic token hierarchy', 'Component state variants', 'Accessibility contrast audit', 'Developer handoff specs']
    }
  ]
};

export function getProjectsForRole(roleId: string): ProjectBlueprint[] {
  return DOMAIN_PROJECT_BLUEPRINTS[roleId] || DOMAIN_PROJECT_BLUEPRINTS['backend-engineer'];
}