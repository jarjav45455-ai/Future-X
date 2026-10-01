import { CareerDomainId, SeniorityLevel } from '../types/student';

export interface CareerRoleDefinition {
  id: string;
  title: string;
  profession: string;
  domainId: CareerDomainId;
  domainTitle: string;
  seniority: SeniorityLevel;
  description: string;
  coreCompetencies: string[];
  toolsAndFrameworks: string[];
  evidenceTypes: string[];
  roadmapTemplate: {
    title: string;
    subtitle: string;
    category: string;
    deliverable: string;
    duration: string;
  }[];
}

export const CAREER_TAXONOMY: Record<string, CareerRoleDefinition> = {
  // 1. TECHNOLOGY: Backend Engineer
  'backend-engineer': {
    id: 'backend-engineer',
    title: 'Backend Engineer',
    profession: 'Software Engineering',
    domainId: 'engineering_tech',
    domainTitle: 'Engineering & Technology',
    seniority: 'Entry / Junior',
    description: 'Designs, develops, and maintains resilient server-side architectures, databases, and APIs.',
    coreCompetencies: ['API Architecture (REST/gRPC)', 'Relational Databases & SQL', 'Authentication & JWT', 'Distributed Caching', 'System Observability'],
    toolsAndFrameworks: ['Node.js / Go / Python', 'PostgreSQL', 'Redis', 'Docker', 'Git'],
    evidenceTypes: ['Production API Repository', 'Database Benchmark Report', 'CI/CD Pipeline Configuration'],
    roadmapTemplate: [
      { title: 'Core Runtime & Idiomatic Syntax', subtitle: 'Memory management, async concurrency, and protocol fundamentals', category: 'CORE KNOWLEDGE', deliverable: 'Concurrent CLI Parser', duration: '2 Weeks' },
      { title: 'Relational Schemas & Indexing', subtitle: 'ACID compliance, normalization, and query plan profiling', category: 'TECHNICAL / DOMAIN', deliverable: 'E-Commerce Schema & Query Benchmark', duration: '3 Weeks' },
      { title: 'Stateless API & Auth Services', subtitle: 'OAuth2/JWT, rate limiting, and security sandboxing', category: 'PRACTICAL', deliverable: 'Multi-Tenant Auth Microservice', duration: '3 Weeks' },
      { title: 'Containerization & Cloud Deploy', subtitle: 'Docker compose orchestration, health metrics, and Redis cache layer', category: 'TOOLS', deliverable: 'Fully Automated Deploy on Cloud VPS', duration: '2 Weeks' }
    ]
  },

  // 2. TECHNOLOGY: Full Stack Developer
  'fullstack-engineer': {
    id: 'fullstack-engineer',
    title: 'Full Stack Developer',
    profession: 'Software Engineering',
    domainId: 'engineering_tech',
    domainTitle: 'Engineering & Technology',
    seniority: 'Entry / Junior',
    description: 'Builds end-to-end web architectures from responsive UI components to scalable cloud backends.',
    coreCompetencies: ['State Management & Reactive UI', 'REST/GraphQL APIs', 'Database Schemas & ORMs', 'Type-Safe Fullstack', 'Build Pipelines'],
    toolsAndFrameworks: ['TypeScript', 'React / React Native', 'Node.js / Express', 'PostgreSQL', 'TailwindCSS'],
    evidenceTypes: ['End-to-End Deployed Application', 'Open Source Contribution', 'Proof of Verification Pass'],
    roadmapTemplate: [
      { title: 'Type-Safe Client Development', subtitle: 'Modern reactive component patterns, hooks, and clean state flows', category: 'CORE KNOWLEDGE', deliverable: 'Interactive Data Dashboard', duration: '2 Weeks' },
      { title: 'RESTful API & Database Integration', subtitle: 'CRUD endpoints, relational schemas, and input validation', category: 'TECHNICAL / DOMAIN', deliverable: 'CRUD Service with PostgreSQL', duration: '3 Weeks' },
      { title: 'Secure Authentication & Session State', subtitle: 'JWT tokens, role-based route guards, and encrypted storage', category: 'PRACTICAL', deliverable: 'Auth-Gated Application Flow', duration: '2 Weeks' },
      { title: 'Fullstack Deployment & Production Readiness', subtitle: 'Environment configs, build optimization, and CI validation', category: 'TOOLS', deliverable: 'Live Production Web/Mobile App', duration: '3 Weeks' }
    ]
  },

  // 3. LAW: Corporate Lawyer
  'corporate-lawyer': {
    id: 'corporate-lawyer',
    title: 'Corporate Lawyer / Legal Associate',
    profession: 'Corporate Law',
    domainId: 'law_legal',
    domainTitle: 'Law & Legal Practice',
    seniority: 'Entry / Junior',
    description: 'Specializes in corporate governance, transactional structuring, due diligence, and contract drafting.',
    coreCompetencies: ['Contract Drafting & Interpretation', 'Statutory Due Diligence', 'Corporate Governance Compliance', 'Legal Research Methodology', 'Dispute Risk Analysis'],
    toolsAndFrameworks: ['SCC Online / Westlaw / Manupatra', 'Contract Lifecycle Management', 'SEC / MCA Filings Registry'],
    evidenceTypes: ['Moot Court Memorial', 'Published Legal Review Note', 'Contract Risk Redline Audit'],
    roadmapTemplate: [
      { title: 'Corporate Statutory Frameworks', subtitle: 'Companies Act, fiduciary obligations, and board governance', category: 'CORE KNOWLEDGE', deliverable: 'Corporate Governance Advisory Note', duration: '3 Weeks' },
      { title: 'Commercial Contract Drafting', subtitle: 'Indemnity, representations, covenants, and limitation of liability clauses', category: 'TECHNICAL / DOMAIN', deliverable: 'Master Services Agreement (MSA) Draft', duration: '3 Weeks' },
      { title: 'Transactional Due Diligence', subtitle: 'Data room review, cap table audit, and regulatory filings check', category: 'PRACTICAL', deliverable: 'Merger Due Diligence Redline Audit', duration: '4 Weeks' },
      { title: 'Regulatory Compliance & Filings', subtitle: 'Foreign investment regulations and statutory compliance filings', category: 'TOOLS', deliverable: 'FDI Compliance Checklist & Filing Packet', duration: '2 Weeks' }
    ]
  },

  // 4. DESIGN: Product Designer (UI/UX)
  'product-designer': {
    id: 'product-designer',
    title: 'Product / UI-UX Designer',
    profession: 'Design & Creative',
    domainId: 'design_creative',
    domainTitle: 'Design & Creative Arts',
    seniority: 'Entry / Junior',
    description: 'Designs intuitive digital interfaces, conducts user research, and crafts scalable design systems.',
    coreCompetencies: ['User Journey Mapping', 'Information Architecture', 'Design System Architecture', 'Interactive Prototyping', 'Usability Testing'],
    toolsAndFrameworks: ['Figma', 'FigJam', 'Tokens Studio', 'Framer', 'UserTesting'],
    evidenceTypes: ['Comprehensive Figma Case Study', 'Design System Library', 'Usability Test Synthesis Report'],
    roadmapTemplate: [
      { title: 'Foundational UI & Visual Hierarchy', subtitle: 'Typography scales, spatial grids, dark UI tokens, and contrast', category: 'CORE KNOWLEDGE', deliverable: 'Responsive High-Fidelity UI Suite', duration: '2 Weeks' },
      { title: 'Design System & Component Variables', subtitle: 'Atomic design, tokenization, states, and auto-layout architecture', category: 'TOOLS', deliverable: 'Production-Ready Figma Design System', duration: '3 Weeks' },
      { title: 'User Research & Discovery Synthesis', subtitle: 'Problem framing, persona derivation, and journey friction mapping', category: 'PRACTICAL', deliverable: 'Usability Friction Analysis Deck', duration: '3 Weeks' },
      { title: 'Interactive High-Fidelity Prototype', subtitle: 'Micro-interactions, state transitions, and developer handoff specs', category: 'TECHNICAL / DOMAIN', deliverable: 'End-to-End Clickable Prototype Case Study', duration: '3 Weeks' }
    ]
  },

  // 5. FINANCE: Investment Banking / Financial Analyst
  'financial-analyst': {
    id: 'financial-analyst',
    title: 'Financial Analyst',
    profession: 'Investment & Finance',
    domainId: 'finance_economics',
    domainTitle: 'Finance & Economics',
    seniority: 'Entry / Junior',
    description: 'Conducts valuation modeling, financial statement analysis, and capital structure assessments.',
    coreCompetencies: ['3-Statement Financial Modeling', 'Discounted Cash Flow (DCF) Valuation', 'Comparable Company Analysis (Comps)', 'Capital Budgeting', 'Variance Analysis'],
    toolsAndFrameworks: ['Advanced Excel / VBA', 'FactSet / Bloomberg Terminal / CapIQ', 'Python for Financial Data'],
    evidenceTypes: ['Dynamic 3-Statement Valuation Model', 'Equity Research Pitch Deck', 'LBO Sensitivity Matrix'],
    roadmapTemplate: [
      { title: '3-Statement Financial Integration', subtitle: 'Connecting P&L, balance sheet, and cash flow dynamically in Excel', category: 'CORE KNOWLEDGE', deliverable: 'Integrated 3-Statement Financial Model', duration: '3 Weeks' },
      { title: 'Intrinsic & Relative Valuation', subtitle: 'WACC calculation, DCF model build, and trading comps multiples', category: 'TECHNICAL / DOMAIN', deliverable: 'Comprehensive DCF & Comps Valuation', duration: '3 Weeks' },
      { title: 'Sensitivity & Scenario Stress-Testing', subtitle: 'Monte Carlo iterations, debt schedule modeling, and margin curves', category: 'PRACTICAL', deliverable: 'Executive Scenario Stress Test Matrix', duration: '2 Weeks' },
      { title: 'Equity Research Pitch Preparation', subtitle: 'Synthesis of investment thesis, target valuation, and risk hedges', category: 'TOOLS', deliverable: 'Institutional Equity Research Report', duration: '3 Weeks' }
    ]
  },

  // 6. MEDICINE & RESEARCH: Clinical Research Associate
  'clinical-researcher': {
    id: 'clinical-researcher',
    title: 'Clinical Research Scientist',
    profession: 'Medicine & Healthcare',
    domainId: 'medicine_healthcare',
    domainTitle: 'Medicine & Healthcare',
    seniority: 'Entry / Junior',
    description: 'Conducts clinical trial monitoring, systematic literature reviews, and epidemiological data validation.',
    coreCompetencies: ['Good Clinical Practice (GCP)', 'Biostatistics & Trial Protocol', 'Systematic Literature Reviews', 'Adverse Event Auditing', 'Regulatory Submissions (FDA/CDSCO)'],
    toolsAndFrameworks: ['R / SAS', 'PubMed / ClinicalTrials.gov', 'REDCap / Medidata Rave'],
    evidenceTypes: ['Systematic Review Protocol', 'Biostatistical Analysis Script', 'GCP Compliance Certificate'],
    roadmapTemplate: [
      { title: 'Ethical & Regulatory Trial Guidelines', subtitle: 'Declaration of Helsinki, ICH-GCP, and patient consent ethics', category: 'CORE KNOWLEDGE', deliverable: 'Trial Ethics & Regulatory Audit Checklist', duration: '2 Weeks' },
      { title: 'Clinical Data Analytics & Epidemiology', subtitle: 'Hypothesis testing, survival curves, and statistical power metrics', category: 'TECHNICAL / DOMAIN', deliverable: 'R Biostatistics Clinical Trial Analysis', duration: '4 Weeks' },
      { title: 'Systematic Meta-Review Protocol', subtitle: 'PRISMA guideline compliance and peer-reviewed journal synthesis', category: 'PRACTICAL', deliverable: 'Systematic Review Manuscript Draft', duration: '3 Weeks' },
      { title: 'Adverse Event & Safety Monitoring', subtitle: 'Pharmacovigilance logging, CRF validation, and inspection audits', category: 'TOOLS', deliverable: 'Audited Clinical Data Safety Portfolio', duration: '2 Weeks' }
    ]
  }
};

// =========================================================================
// O*NET & ESCO STANDARDIZED TOP 100 CAREER ROLES (FOR INSTANT AUTO-COMPLETE)
// =========================================================================
export const TOP_100_CAREERS: string[] = [
  // 1. Tech & Software Systems (25 Roles)
  'Full-Stack Web Developer',
  'Backend Systems Engineer',
  'Frontend Engineer',
  'Mobile App Engineer (React Native)',
  'AI / Machine Learning Engineer',
  'Data Scientist',
  'Data Analyst / BI Developer',
  'DevOps & Cloud Infrastructure Engineer',
  'Cybersecurity Analyst & Ethical Hacker',
  'Generative AI & Prompt Engineer',
  'Site Reliability Engineer (SRE)',
  'Embedded Systems & IoT Developer',
  'Blockchain & Smart Contract Developer',
  'QA Automation & SDET Engineer',
  'Game Developer (Unity 3D / Unreal Engine)',
  'Computer Vision Engineer',
  'Natural Language Processing (NLP) Engineer',
  'Database Administrator (DBA & Data Architect)',
  'Enterprise Solutions Architect',
  'Network Security Engineer',
  'AR/VR (Spatial Computing) Developer',
  'Bioinformatics Software Engineer',
  'Robotics Software Engineer',
  'Microservices Architect',
  'MLOps Engineer',

  // 2. Engineering Core & Manufacturing (15 Roles)
  'Mechanical Design Engineer (CAD / SolidWorks)',
  'Electrical Vehicle (EV) Systems Engineer',
  'VLSI & Chip Design Engineer',
  'Renewable Energy (Solar & Wind) Engineer',
  'Industrial Automation & PLC Engineer',
  'Structural Civil Engineer',
  'Drone Hardware & Flight Control Engineer',
  'Circular Economy & Waste Management Engineer',
  'Mechatronics Specialist',
  'Thermal Systems Analyst',
  'Aerospace Propulsion Engineer',
  'Supply Chain & Logistics Engineer',
  'Quality Control & Six Sigma Specialist',
  'Geotechnical Engineer',
  'Environmental Safety & Compliance Officer',

  // 3. Medical, Healthcare & Life Sciences (15 Roles)
  'Clinical Research Associate (CRA)',
  'Healthcare Informatics Specialist',
  'Public Health Policy Analyst',
  'Medical Laboratory Technologist',
  'Biostatistician',
  'Hospital Operations Manager',
  'Physical Therapy & Rehabilitation Specialist',
  'Radiologic Technologist',
  'Regulatory Affairs Specialist (Pharma & Biotech)',
  'Genetic Counselor',
  'Sports Nutritionist & Dietitian',
  'Biomedical Equipment Engineer',
  'Pharmaceutical Quality Assurance Analyst',
  'Occupational Health & Safety Specialist',
  'Medical Content & Communication Specialist',

  // 4. Architecture, Design & Media (15 Roles)
  'UI/UX Product Designer',
  'Architectural Design Lead (BIM / Revit)',
  '3D Visualizer & Game Asset Artist',
  'Motion Graphics & Visual Effects (VFX) Designer',
  'Industrial Product Designer',
  'Landscape & Urban Planning Architect',
  'Sustainable Green Building Consultant',
  'Brand Identity & Visual Designer',
  'Video Producer & Technical Animator',
  'Sound Designer & Audio Engineer',
  'Interior & Spatial Experience Designer',
  'Design Systems Architect',
  'Technical Illustrator & CAD Drafter',
  'Fashion & Textile Systems Designer',
  'Exhibition & Experience Designer',

  // 5. Law, Governance & Public Policy (15 Roles)
  'Corporate M&A Legal Associate',
  'Intellectual Property (IP) & Patent Attorney',
  'Cyber Law & Data Privacy Compliance Counsel',
  'FinTech & Banking Regulatory Associate',
  'Dispute Resolution & Commercial Arbitrator',
  'Environmental Policy & Climate Law Specialist',
  'Public Policy & Government Relations Strategist',
  'Legal Technology & Operations Specialist',
  'Criminal Defense & Litigation Associate',
  'Human Rights & International Law Researcher',
  'Labor Relations & Employment Law Officer',
  'Contract Lifecycle Management Specialist',
  'Anti-Money Laundering (AML) Compliance Analyst',
  'Competition & Antitrust Law Associate',
  'Tax Law & GST Consultant',

  // 6. Business, Finance & Management (15 Roles)
  'Technical Product Manager (TPM)',
  'Quantitative Investment Analyst (Quant)',
  'Venture Capital & Private Equity Analyst',
  'Financial Risk & Fraud Analyst',
  'Growth Marketing & Performance Specialist',
  'Management & Strategy Consultant',
  'Operations Excellence Lead',
  'E-Commerce & Retail Operations Manager',
  'Business Analytics & Forecasting Lead',
  'Investment Banking Associate',
  'FinTech Product Strategist',
  'Customer Success & Enterprise Account Executive',
  'Sustainability & ESG Analyst',
  'Human Capital & Talent Acquisition Strategist',
  'Supply Chain Sourcing & Procurement Lead'
];