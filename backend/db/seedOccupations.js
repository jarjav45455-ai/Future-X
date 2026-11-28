function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const RICH_OCCUPATIONS = [
  {
    id: 'ai-engineer',
    title: 'AI Engineer',
    category: 'Artificial Intelligence & Data',
    domain: 'engineering_tech',
    seniority: 'Entry / Junior',
    description:
      'Designs, integrates, and deploys production AI systems including LLM pipelines, retrieval-augmented generation (RAG), and applied ML services.',
    educationRequirements:
      'B.Tech / B.Sc in Computer Science, AI/ML, Data Science, or strong portfolio of deployed AI systems.',
    responsibilities: [
      'Build and evaluate LLM, RAG, and applied machine learning pipelines',
      'Integrate AI inference APIs with low-latency backend services',
      'Monitor model accuracy, hallucinations, latency, and token costs',
      'Collaborate with product and backend teams on real-world deployment',
    ],
    careerGrowth: 'Junior AI Engineer -> AI Systems Engineer -> Senior AI Architect -> Head of AI',
    relatedOccupations: ['machine-learning-engineer', 'data-scientist', 'backend-developer'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1 / NCO India',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'Programming Fundamentals',
        category: 'Programming Languages',
        description: 'Variables, control flow, modular functions, and debugging basics.',
        whyItMatters: 'Foundation for writing reliable AI pipelines and backend glue code.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Python Programming',
        category: 'Programming Languages',
        description: 'Idiomatic Python, virtual environments, typing, and async execution.',
        whyItMatters: 'Primary language across nearly all AI/ML libraries and orchestration stacks.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: ['Programming Fundamentals'],
      },
      {
        name: 'Data Structures & Algorithms',
        category: 'Technical Skills',
        description: 'Arrays, trees, graphs, hashing, and time/space complexity optimization.',
        whyItMatters: 'Ensures retrieval, ranking, and data processing scale efficiently.',
        requiredProficiency: 3,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Python Programming'],
      },
      {
        name: 'Mathematics & Statistics',
        category: 'Analytical Skills',
        description: 'Linear algebra, probability distributions, vectors, and hypothesis testing.',
        whyItMatters: 'Helps you understand embeddings, cosine similarity, and model evaluation metrics.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Programming Fundamentals'],
      },
      {
        name: 'Machine Learning Fundamentals',
        category: 'Domain Knowledge',
        description: 'Supervised/unsupervised models, overfitting, cross-validation, and feature engineering.',
        whyItMatters: 'Core intuition required before working with deep learning or foundation models.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Python Programming', 'Mathematics & Statistics'],
      },
      {
        name: 'LLM & RAG Architecture',
        category: 'Industry-Specific Skills',
        description: 'Prompt engineering, vector databases, chunking, embeddings, and grounding.',
        whyItMatters: 'Defines modern production AI engineering and prevents hallucinated outputs.',
        requiredProficiency: 4,
        difficultyLevel: 'Advanced',
        isRequired: true,
        prerequisites: ['Machine Learning Fundamentals', 'REST APIs & Backend Integration'],
      },
      {
        name: 'REST APIs & Backend Integration',
        category: 'Tools & Technologies',
        description: 'HTTP APIs, FastAPI/Express, rate limiting, caching, and error handling.',
        whyItMatters: 'Models only create value when served reliably inside real applications.',
        requiredProficiency: 3,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Python Programming'],
      },
      {
        name: 'Critical Evaluation & AI Safety',
        category: 'Critical Thinking',
        description: 'Evaluating bias, benchmark leakage, privacy, and failure modes.',
        whyItMatters: 'Protects users and businesses from unsafe or unreliable AI outputs.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Machine Learning Fundamentals'],
      },
      {
        name: 'Technical Communication',
        category: 'Communication Skills',
        description: 'Explaining model trade-offs, metrics, and system architecture clearly.',
        whyItMatters: 'Essential for aligning stakeholders and defending architectural decisions.',
        requiredProficiency: 3,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'machine-learning-engineer',
    title: 'Machine Learning Engineer',
    category: 'Artificial Intelligence & Data',
    domain: 'engineering_tech',
    seniority: 'Mid-Level',
    description:
      'Builds, trains, optimizes, and deploys scalable machine learning and deep learning models into production infrastructure.',
    educationRequirements:
      'B.Tech / M.Tech in CS, AI/ML, Mathematics, or equivalent hands-on MLOps experience.',
    responsibilities: [
      'Design training pipelines and reproducible feature stores',
      'Optimize model inference latency, quantization, and GPU usage',
      'Automate model training, testing, and drift monitoring (MLOps)',
      'Partner with data scientists to productionize research prototypes',
    ],
    careerGrowth: 'ML Engineer -> Senior ML Engineer -> Staff MLOps Architect -> VP Engineering',
    relatedOccupations: ['ai-engineer', 'data-scientist', 'devops-engineer'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'Python Programming',
        category: 'Programming Languages',
        description: 'Clean, modular Python for data and ML engineering.',
        whyItMatters: 'Standard language for PyTorch, TensorFlow, and Scikit-Learn.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: ['Programming Fundamentals'],
      },
      {
        name: 'Mathematics & Statistics',
        category: 'Analytical Skills',
        description: 'Calculus, linear algebra, optimization, and probability.',
        whyItMatters: 'Essential for debugging convergence issues and loss functions.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Programming Fundamentals'],
      },
      {
        name: 'Machine Learning Fundamentals',
        category: 'Domain Knowledge',
        description: 'Model selection, regularization, metrics, and feature pipelines.',
        whyItMatters: 'Forms the core engineering toolbox for predictive systems.',
        requiredProficiency: 5,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Python Programming', 'Mathematics & Statistics'],
      },
      {
        name: 'Deep Learning & Neural Networks',
        category: 'Industry-Specific Skills',
        description: 'CNNs, Transformers, PyTorch/TensorFlow training, and transfer learning.',
        whyItMatters: 'Powers vision, NLP, and multimodal ML applications.',
        requiredProficiency: 4,
        difficultyLevel: 'Advanced',
        isRequired: true,
        prerequisites: ['Machine Learning Fundamentals'],
      },
      {
        name: 'Docker & MLOps Pipelines',
        category: 'Tools & Technologies',
        description: 'Containerization, experiment tracking, model registries, and CI/CD.',
        whyItMatters: 'Bridges the gap between notebooks and reliable production models.',
        requiredProficiency: 4,
        difficultyLevel: 'Advanced',
        isRequired: true,
        prerequisites: ['Python Programming'],
      },
      {
        name: 'Structured Problem Solving',
        category: 'Problem-Solving Skills',
        description: 'Diagnosing data bottlenecks, silent accuracy drops, and scaling issues.',
        whyItMatters: 'Production ML bugs rarely throw syntax errors; systematic debugging is key.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    category: 'Artificial Intelligence & Data',
    domain: 'science_research',
    seniority: 'Entry / Junior',
    description:
      'Transforms raw business and operational datasets into clear dashboards, KPIs, and actionable insights for decision-makers.',
    educationRequirements:
      'Any Bachelor degree (B.Tech, B.Com, BBA, B.Sc, BA Economics) with strong SQL, Excel, and BI portfolio.',
    responsibilities: [
      'Clean, validate, and query structured data using SQL and spreadsheets',
      'Build interactive dashboards in Power BI or Tableau',
      'Identify trends, anomalies, and revenue/retention drivers',
      'Present concise data stories to business and product teams',
    ],
    careerGrowth: 'Junior Data Analyst -> Senior Analyst -> Analytics Manager -> Data Scientist',
    relatedOccupations: ['business-analyst', 'data-scientist', 'financial-analyst'],
    sourceFramework: 'O*NET 31.0 / NCO India',
    sourceAttribution: 'Adapted from O*NET & NCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'SQL & Relational Databases',
        category: 'Technical Skills',
        description: 'Joins, CTEs, window functions, aggregations, and query optimization.',
        whyItMatters: 'Primary daily tool for extracting business truth from databases.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Spreadsheet & Excel Modeling',
        category: 'Tools & Technologies',
        description: 'Pivot tables, lookups, dynamic formulas, and data cleaning.',
        whyItMatters: 'Universal baseline tool across finance, operations, and management.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Data Visualization & BI Tools',
        category: 'Tools & Technologies',
        description: 'Power BI / Tableau dashboards, visual hierarchy, and KPI design.',
        whyItMatters: 'Turns complex tables into executive-ready visual decisions.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['SQL & Relational Databases', 'Spreadsheet & Excel Modeling'],
      },
      {
        name: 'Mathematics & Statistics',
        category: 'Analytical Skills',
        description: 'Descriptive stats, correlation vs causation, A/B test significance.',
        whyItMatters: 'Prevents misleading business conclusions from noisy data.',
        requiredProficiency: 3,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Data Storytelling & Presentation',
        category: 'Communication Skills',
        description: 'Structuring insights around business impact rather than raw charts.',
        whyItMatters: 'Insights only matter if leadership understands and acts on them.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Data Visualization & BI Tools'],
      },
      {
        name: 'Python for Data Analysis',
        category: 'Programming Languages',
        description: 'Pandas, NumPy, and automated data cleaning scripts.',
        whyItMatters: 'Handles large datasets that exceed spreadsheet limits.',
        requiredProficiency: 3,
        difficultyLevel: 'Intermediate',
        isRequired: false,
        prerequisites: ['Programming Fundamentals'],
      },
    ],
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    category: 'Artificial Intelligence & Data',
    domain: 'science_research',
    seniority: 'Mid-Level',
    description:
      'Combines statistical modeling, experimentation, and machine learning to forecast outcomes and solve ambiguous business problems.',
    educationRequirements:
      'Degree in Computer Science, Statistics, Economics, Mathematics, or proven applied portfolio.',
    responsibilities: [
      'Formulate business problems into measurable statistical and ML hypotheses',
      'Design and analyze controlled A/B experiments',
      'Build forecasting, churn, recommendation, and pricing models',
      'Communicate uncertainty and ROI clearly to leadership',
    ],
    careerGrowth: 'Data Scientist -> Senior Data Scientist -> Lead Data Scientist -> Chief Data Officer',
    relatedOccupations: ['data-analyst', 'machine-learning-engineer', 'ai-engineer'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'Python Programming',
        category: 'Programming Languages',
        description: 'Python ecosystem for data wrangling and modeling.',
        whyItMatters: 'Core language for scientific computing and ML experiments.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: ['Programming Fundamentals'],
      },
      {
        name: 'SQL & Relational Databases',
        category: 'Technical Skills',
        description: 'Complex analytical SQL queries across multi-table warehouses.',
        whyItMatters: 'You must extract your own training datasets cleanly.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Mathematics & Statistics',
        category: 'Analytical Skills',
        description: 'Hypothesis testing, Bayesian reasoning, regression, and distributions.',
        whyItMatters: 'Separates real scientific rigor from blind model fitting.',
        requiredProficiency: 5,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Machine Learning Fundamentals',
        category: 'Domain Knowledge',
        description: 'Predictive modeling, feature engineering, and cross-validation.',
        whyItMatters: 'Enables forecasting, classification, and personalization systems.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Python Programming', 'Mathematics & Statistics'],
      },
      {
        name: 'Experiment Design & Causal Thinking',
        category: 'Critical Thinking',
        description: 'A/B testing, sample sizing, bias detection, and counterfactual reasoning.',
        whyItMatters: 'Proves whether a product change actually caused growth.',
        requiredProficiency: 4,
        difficultyLevel: 'Advanced',
        isRequired: true,
        prerequisites: ['Mathematics & Statistics'],
      },
      {
        name: 'Data Storytelling & Presentation',
        category: 'Communication Skills',
        description: 'Translating statistical outputs into executive decisions.',
        whyItMatters: 'Directly drives adoption of your models by product teams.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'full-stack-developer',
    title: 'Full Stack Developer',
    category: 'Software Engineering',
    domain: 'engineering_tech',
    seniority: 'Entry / Junior',
    description:
      'Builds complete web and mobile applications end-to-end across user interfaces, backend APIs, databases, and cloud deployments.',
    educationRequirements:
      'B.Tech / BCA / B.Sc CS or strong deployed full-stack GitHub portfolio.',
    responsibilities: [
      'Develop responsive frontends using React / Next.js / React Native',
      'Design secure REST APIs, authentication flows, and database schemas',
      'Write tests, handle errors gracefully, and deploy production builds',
      'Collaborate across UI/UX, product, and DevOps workflows',
    ],
    careerGrowth: 'Full Stack Developer -> Senior Software Engineer -> Tech Lead -> CTO / Founder',
    relatedOccupations: ['frontend-developer', 'backend-developer', 'cloud-engineer'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'JavaScript & TypeScript',
        category: 'Programming Languages',
        description: 'Modern ES6+, async/await, closures, and strict TypeScript typing.',
        whyItMatters: 'Unified language powering both frontend UI and Node.js backend.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: ['Programming Fundamentals'],
      },
      {
        name: 'React & Modern UI Engineering',
        category: 'Technical Skills',
        description: 'Component architecture, hooks, state management, and responsive layouts.',
        whyItMatters: 'Industry standard for interactive web and mobile products.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['JavaScript & TypeScript'],
      },
      {
        name: 'REST APIs & Backend Integration',
        category: 'Technical Skills',
        description: 'Node.js/Express routing, JWT auth, validation, and middleware.',
        whyItMatters: 'Secures business logic and connects clients to databases.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['JavaScript & TypeScript'],
      },
      {
        name: 'SQL & Relational Databases',
        category: 'Domain Knowledge',
        description: 'Schema normalization, foreign keys, indexes, and migrations.',
        whyItMatters: 'Keeps user data consistent, fast, and bug-free at scale.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Git & Collaborative Workflows',
        category: 'Tools & Technologies',
        description: 'Branching, pull requests, merge conflict resolution, and CI checks.',
        whyItMatters: 'Mandatory for team engineering and open-source contributions.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Structured Problem Solving',
        category: 'Problem-Solving Skills',
        description: 'Breaking ambiguous product requirements into clean technical tasks.',
        whyItMatters: 'Lets you ship working features independently under deadlines.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'frontend-developer',
    title: 'Frontend Developer',
    category: 'Software Engineering',
    domain: 'engineering_tech',
    seniority: 'Entry / Junior',
    description:
      'Crafts fast, accessible, visually polished web and mobile user interfaces with smooth interactions and clean state management.',
    educationRequirements:
      'Any degree or self-taught portfolio demonstrating live deployed UI apps.',
    responsibilities: [
      'Translate Figma designs into pixel-accurate responsive interfaces',
      'Optimize render performance, bundle size, and accessibility (WCAG)',
      'Manage API state, offline caching, and form validation cleanly',
      'Build reusable design system components',
    ],
    careerGrowth: 'Frontend Developer -> Senior Frontend Engineer -> UI Architect -> Design Engineer Lead',
    relatedOccupations: ['full-stack-developer', 'ui-ux-designer', 'backend-developer'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'HTML, CSS & Responsive Design',
        category: 'Technical Skills',
        description: 'Flexbox, Grid, semantic HTML, Tailwind CSS, and mobile-first layouts.',
        whyItMatters: 'Core building blocks of every web interface.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'JavaScript & TypeScript',
        category: 'Programming Languages',
        description: 'DOM/JS runtime, event loop, promises, and TypeScript interfaces.',
        whyItMatters: 'Powers all client-side interactivity and type-safe apps.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: ['HTML, CSS & Responsive Design'],
      },
      {
        name: 'React & Modern UI Engineering',
        category: 'Technical Skills',
        description: 'Hooks, routing, memoization, and component composition.',
        whyItMatters: 'Most in-demand frontend library across startups and enterprises.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['JavaScript & TypeScript'],
      },
      {
        name: 'Web Performance & Accessibility',
        category: 'Industry-Specific Skills',
        description: 'Core Web Vitals, lazy loading, keyboard navigation, and contrast ratios.',
        whyItMatters: 'Directly impacts user retention, SEO, and inclusive usability.',
        requiredProficiency: 3,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['React & Modern UI Engineering'],
      },
      {
        name: 'Git & Collaborative Workflows',
        category: 'Tools & Technologies',
        description: 'Version control, PR reviews, and deployment previews.',
        whyItMatters: 'Standard daily workflow in every product team.',
        requiredProficiency: 3,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Technical Communication',
        category: 'Communication Skills',
        description: 'Collaborating with designers and backend devs on API contracts.',
        whyItMatters: 'Prevents UI/backend mismatches and rework.',
        requiredProficiency: 3,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'backend-developer',
    title: 'Backend Developer',
    category: 'Software Engineering',
    domain: 'engineering_tech',
    seniority: 'Entry / Junior',
    description:
      'Architects reliable server-side APIs, databases, authentication systems, and scalable microservices powering digital products.',
    educationRequirements:
      'B.Tech / B.Sc CS or strong portfolio of production-grade APIs and database systems.',
    responsibilities: [
      'Design and secure REST/GraphQL APIs with proper auth and rate limits',
      'Model relational and NoSQL databases for data integrity and speed',
      'Implement caching, background queues, and observability logs',
      'Handle concurrency, migrations, and fault tolerance',
    ],
    careerGrowth: 'Backend Developer -> Senior Systems Engineer -> Principal Architect -> CTO',
    relatedOccupations: ['full-stack-developer', 'cloud-engineer', 'devops-engineer'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'Programming Fundamentals',
        category: 'Programming Languages',
        description: 'Clean code, OOP/functional patterns, error handling, and testing.',
        whyItMatters: 'Required to build maintainable backend services.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Data Structures & Algorithms',
        category: 'Technical Skills',
        description: 'Efficient lookup structures, queues, graphs, and complexity analysis.',
        whyItMatters: 'Prevents slow endpoints and high server memory consumption.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Programming Fundamentals'],
      },
      {
        name: 'REST APIs & Backend Integration',
        category: 'Technical Skills',
        description: 'HTTP semantics, Express/FastAPI/Spring, JWT auth, and Zod validation.',
        whyItMatters: 'Core interface between mobile/web clients and server logic.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Programming Fundamentals'],
      },
      {
        name: 'SQL & Relational Databases',
        category: 'Domain Knowledge',
        description: 'Transactions, indexing, query plans, and schema migrations.',
        whyItMatters: 'Database design determines 80% of backend reliability.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'System Design & Security',
        category: 'Industry-Specific Skills',
        description: 'Caching, rate limiting, OWASP security, encryption, and horizontal scaling.',
        whyItMatters: 'Keeps user data safe and apps online during traffic spikes.',
        requiredProficiency: 4,
        difficultyLevel: 'Advanced',
        isRequired: true,
        prerequisites: ['REST APIs & Backend Integration', 'SQL & Relational Databases'],
      },
      {
        name: 'Structured Problem Solving',
        category: 'Problem-Solving Skills',
        description: 'Root-cause debugging of race conditions, timeouts, and failures.',
        whyItMatters: 'Critical for production incident response.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    category: 'Security & Cloud',
    domain: 'engineering_tech',
    seniority: 'Entry / Junior',
    description:
      'Protects networks, cloud workloads, and applications by detecting threats, investigating vulnerabilities, and enforcing security controls.',
    educationRequirements:
      'Degree in CS/IT or recognized security labs & certifications (CompTIA Security+, CEH, SOC practice).',
    responsibilities: [
      'Monitor SIEM alerts and investigate suspicious network activity',
      'Perform vulnerability assessments and web app security testing',
      'Document incident response steps and remediation playbooks',
      'Enforce least-privilege access and compliance standards',
    ],
    careerGrowth: 'SOC Analyst -> Security Engineer -> Penetration Tester / Cloud Security Architect -> CISO',
    relatedOccupations: ['cloud-engineer', 'devops-engineer', 'backend-developer'],
    sourceFramework: 'O*NET 31.0 / NICE Framework',
    sourceAttribution: 'Adapted from O*NET & NICE cybersecurity frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'Computer Networking & TCP/IP',
        category: 'Domain Knowledge',
        description: 'OSI model, DNS, HTTP/TLS, firewalls, subnets, and packet analysis.',
        whyItMatters: 'You cannot defend a network you do not understand.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Linux & Operating Systems',
        category: 'Tools & Technologies',
        description: 'Shell scripting, permissions, processes, logs, and hardening.',
        whyItMatters: 'Most servers and security toolchains run on Linux.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Web Application Security (OWASP)',
        category: 'Industry-Specific Skills',
        description: 'SQLi, XSS, CSRF, broken auth, and secure API auditing.',
        whyItMatters: 'Web apps and APIs are the #1 attack surface today.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Computer Networking & TCP/IP'],
      },
      {
        name: 'Threat Detection & SIEM Analysis',
        category: 'Analytical Skills',
        description: 'Log correlation, alert triage, and incident response lifecycles.',
        whyItMatters: 'Core daily workflow of a Security Operations Center (SOC).',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Computer Networking & TCP/IP', 'Linux & Operating Systems'],
      },
      {
        name: 'Critical Investigation & Ethics',
        category: 'Critical Thinking',
        description: 'Separating false positives from real breaches under pressure with strict legal ethics.',
        whyItMatters: 'Prevents alert fatigue and ensures responsible disclosure.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Security Reporting & Communication',
        category: 'Communication Skills',
        description: 'Writing clear vulnerability reports and remediation steps for developers.',
        whyItMatters: 'Vulnerabilities only get fixed when dev teams understand the risk.',
        requiredProficiency: 3,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'cloud-engineer',
    title: 'Cloud Engineer',
    category: 'Security & Cloud',
    domain: 'engineering_tech',
    seniority: 'Mid-Level',
    description:
      'Designs, provisions, secures, and optimizes cloud infrastructure across AWS, GCP, or Azure for resilient, cost-efficient applications.',
    educationRequirements:
      'Degree in CS/IT or hands-on cloud architecture labs (AWS SAA / GCP ACE).',
    responsibilities: [
      'Architect VPC networks, IAM policies, storage, and compute clusters',
      'Automate cloud infrastructure using Terraform or Infrastructure-as-Code',
      'Optimize cloud billing, auto-scaling, and disaster recovery',
      'Ensure high availability and compliance across environments',
    ],
    careerGrowth: 'Cloud Support -> Cloud Engineer -> Solutions Architect -> Principal Cloud Architect',
    relatedOccupations: ['devops-engineer', 'backend-developer', 'cybersecurity-analyst'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'Linux & Operating Systems',
        category: 'Technical Skills',
        description: 'Server administration, SSH, systemd, and shell scripting.',
        whyItMatters: 'Cloud virtual machines and containers run primarily on Linux.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Computer Networking & TCP/IP',
        category: 'Domain Knowledge',
        description: 'VPCs, load balancers, DNS routing, VPNs, and security groups.',
        whyItMatters: 'Secure cloud architecture depends on proper network isolation.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Cloud Platforms (AWS / GCP / Azure)',
        category: 'Tools & Technologies',
        description: 'Compute, managed databases, IAM, object storage, and serverless.',
        whyItMatters: 'Core services used to deploy modern scalable systems.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Linux & Operating Systems', 'Computer Networking & TCP/IP'],
      },
      {
        name: 'Infrastructure as Code (Terraform)',
        category: 'Industry-Specific Skills',
        description: 'Declarative cloud provisioning, state management, and modules.',
        whyItMatters: 'Eliminates manual click-ops errors and enables repeatable environments.',
        requiredProficiency: 4,
        difficultyLevel: 'Advanced',
        isRequired: true,
        prerequisites: ['Cloud Platforms (AWS / GCP / Azure)'],
      },
      {
        name: 'Cost & Architecture Trade-Off Analysis',
        category: 'Analytical Skills',
        description: 'Balancing reliability, latency, and monthly cloud spend.',
        whyItMatters: 'Prevents runaway cloud bills while maintaining SLAs.',
        requiredProficiency: 3,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Cloud Platforms (AWS / GCP / Azure)'],
      },
    ],
  },
  {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    category: 'Security & Cloud',
    domain: 'engineering_tech',
    seniority: 'Mid-Level',
    description:
      'Automates build, test, deployment, container orchestration, and observability workflows so software ships safely and rapidly.',
    educationRequirements:
      'B.Tech / IT background or demonstrated CI/CD, Docker, Kubernetes, and automation projects.',
    responsibilities: [
      'Build automated CI/CD pipelines for zero-downtime releases',
      'Containerize services with Docker and orchestrate with Kubernetes',
      'Implement logging, metrics, alerting, and SLO dashboards',
      'Automate repetitive ops work with Python or Bash',
    ],
    careerGrowth: 'DevOps Engineer -> Site Reliability Engineer (SRE) -> Platform Engineering Lead',
    relatedOccupations: ['cloud-engineer', 'backend-developer', 'cybersecurity-analyst'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'Linux & Operating Systems',
        category: 'Technical Skills',
        description: 'CLI proficiency, Bash scripting, file systems, and process troubleshooting.',
        whyItMatters: 'Foundation for automation and container runtimes.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Git & Collaborative Workflows',
        category: 'Tools & Technologies',
        description: 'GitHub Actions, branching strategies, and release tagging.',
        whyItMatters: 'Every CI/CD workflow starts from source control triggers.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Docker & Container Orchestration',
        category: 'Industry-Specific Skills',
        description: 'Multi-stage Dockerfiles, Compose, and Kubernetes deployments.',
        whyItMatters: 'Guarantees code runs identically from laptop to production.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Linux & Operating Systems'],
      },
      {
        name: 'CI/CD & Release Automation',
        category: 'Technical Skills',
        description: 'Automated testing, build artifacts, rollbacks, and blue-green deploys.',
        whyItMatters: 'Reduces deployment risk and accelerates engineering velocity.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Git & Collaborative Workflows', 'Docker & Container Orchestration'],
      },
      {
        name: 'Observability & Incident Response',
        category: 'Problem-Solving Skills',
        description: 'Prometheus, Grafana, structured logs, and blameless postmortems.',
        whyItMatters: 'Detects outages before users complain and prevents repeat failures.',
        requiredProficiency: 4,
        difficultyLevel: 'Advanced',
        isRequired: true,
        prerequisites: ['CI/CD & Release Automation'],
      },
    ],
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    category: 'Design & Product',
    domain: 'design_creative',
    seniority: 'Entry / Junior',
    description:
      'Researches user needs, structures intuitive information flows, and designs cohesive digital interfaces and design systems.',
    educationRequirements:
      'Any degree (Design, CS, Humanities) with a strong case-study portfolio showing problem-to-prototype process.',
    responsibilities: [
      'Conduct user interviews, journey mapping, and usability testing',
      'Create wireframes, interactive Figma prototypes, and design systems',
      'Ensure visual hierarchy, responsive layouts, and accessibility compliance',
      'Partner closely with engineers during design handoff and QA',
    ],
    careerGrowth: 'UI/UX Designer -> Senior Product Designer -> Design Systems Lead -> Head of Design',
    relatedOccupations: ['product-manager', 'frontend-developer', 'digital-marketer'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'User Research & Empathy Mapping',
        category: 'Domain Knowledge',
        description: 'User interviews, surveys, personas, and pain-point synthesis.',
        whyItMatters: 'Prevents building pretty interfaces that solve the wrong problem.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Information Architecture & Wireframing',
        category: 'Analytical Skills',
        description: 'User flows, navigation hierarchy, and low-fidelity layout sketching.',
        whyItMatters: 'Ensures users never feel lost inside complex applications.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: ['User Research & Empathy Mapping'],
      },
      {
        name: 'Figma & Interactive Prototyping',
        category: 'Tools & Technologies',
        description: 'Auto-layout, component variants, tokens, and clickable prototypes.',
        whyItMatters: 'Industry-standard design and engineering handoff tool.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Information Architecture & Wireframing'],
      },
      {
        name: 'Visual Design & Design Systems',
        category: 'Industry-Specific Skills',
        description: 'Typography, color contrast, spacing grids, and reusable UI libraries.',
        whyItMatters: 'Creates trust, polish, and consistency across every screen.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Figma & Interactive Prototyping'],
      },
      {
        name: 'Usability Testing & Iteration',
        category: 'Critical Thinking',
        description: 'Observing real users, spotting friction, and validating fixes with evidence.',
        whyItMatters: 'Replaces personal opinions with real user behavior.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Figma & Interactive Prototyping'],
      },
      {
        name: 'Design Storytelling & Critique',
        category: 'Communication Skills',
        description: 'Presenting case studies and articulating the "why" behind design choices.',
        whyItMatters: 'Crucial for stakeholder buy-in and design interviews.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    category: 'Design & Product',
    domain: 'business_management',
    seniority: 'Mid-Level',
    description:
      'Defines product vision, prioritizes high-impact features, and aligns engineering, design, and business teams around measurable user outcomes.',
    educationRequirements:
      'B.Tech, BBA, MBA, or any bachelor degree with product teardowns, analytics, and execution experience.',
    responsibilities: [
      'Discover customer pain points and validate product opportunities',
      'Write crisp Product Requirements Documents (PRDs) and user stories',
      'Prioritize roadmaps using impact vs effort frameworks',
      'Track retention, activation, and conversion metrics post-launch',
    ],
    careerGrowth: 'Associate PM (APM) -> Product Manager -> Senior PM -> Group PM -> CPO / Founder',
    relatedOccupations: ['business-analyst', 'ui-ux-designer', 'digital-marketer'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'User Research & Customer Discovery',
        category: 'Domain Knowledge',
        description: 'Jobs-to-be-Done interviews, market sizing, and competitive teardowns.',
        whyItMatters: 'Ensures the team builds products users genuinely need.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Product Strategy & Prioritization',
        category: 'Critical Thinking',
        description: 'RICE/ICE scoring, MVP scoping, and ruthless trade-off decisions.',
        whyItMatters: 'Engineering time is scarce; prioritization determines product success.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['User Research & Customer Discovery'],
      },
      {
        name: 'PRD Writing & Agile Execution',
        category: 'Professional Skills',
        description: 'Clear acceptance criteria, sprint planning, and edge-case specs.',
        whyItMatters: 'Eliminates ambiguity for engineers and designers.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Product Strategy & Prioritization'],
      },
      {
        name: 'Product Analytics & Metrics',
        category: 'Analytical Skills',
        description: 'Funnels, cohorts, North Star metrics, and A/B test interpretation.',
        whyItMatters: 'Measures real user impact instead of vanity launch counts.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Stakeholder Alignment & Influence',
        category: 'Communication Skills',
        description: 'Leading cross-functional teams without direct authority.',
        whyItMatters: 'PMs succeed through clarity, persuasion, and trust.',
        requiredProficiency: 5,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'business-analyst',
    title: 'Business Analyst',
    category: 'Business & Finance',
    domain: 'business_management',
    seniority: 'Entry / Junior',
    description:
      'Bridges business stakeholders and technical teams by analyzing processes, quantifying operational gaps, and defining clear solution requirements.',
    educationRequirements:
      'BBA, B.Com, B.Tech, Economics, or MBA with analytics and requirements documentation skills.',
    responsibilities: [
      'Gather and document functional and business requirements (BRD/FRD)',
      'Map operational workflows and identify cost or efficiency bottlenecks',
      'Analyze KPIs using SQL, Excel, and BI dashboards',
      'Support user acceptance testing (UAT) and rollout adoption',
    ],
    careerGrowth: 'Junior BA -> Senior Business Analyst -> Product Manager / Strategy Consultant',
    relatedOccupations: ['data-analyst', 'product-manager', 'financial-analyst'],
    sourceFramework: 'O*NET 31.0 / IIBA BABOK',
    sourceAttribution: 'Adapted from O*NET & BABOK competency concepts (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'Requirements Gathering & Documentation',
        category: 'Professional Skills',
        description: 'BRDs, process flowcharts, use cases, and acceptance criteria.',
        whyItMatters: 'Prevents expensive scope creep and misaligned software builds.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Spreadsheet & Excel Modeling',
        category: 'Tools & Technologies',
        description: 'Scenario modeling, KPI trackers, pivot tables, and variance analysis.',
        whyItMatters: 'Fastest way to quantify business impact and ROI.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'SQL & Relational Databases',
        category: 'Technical Skills',
        description: 'Querying operational databases to validate business assumptions.',
        whyItMatters: 'Lets you verify facts independently without waiting on engineering.',
        requiredProficiency: 3,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Process Optimization & Root-Cause Analysis',
        category: 'Problem-Solving Skills',
        description: '5 Whys, bottleneck mapping, and operational workflow redesign.',
        whyItMatters: 'Directly saves time, cost, and manual errors for organizations.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Requirements Gathering & Documentation'],
      },
      {
        name: 'Stakeholder Alignment & Influence',
        category: 'Communication Skills',
        description: 'Running structured workshops and resolving conflicting priorities.',
        whyItMatters: 'Core bridge between executives and execution teams.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'digital-marketer',
    title: 'Digital Marketer',
    category: 'Marketing & Growth',
    domain: 'media_communication',
    seniority: 'Entry / Junior',
    description:
      'Drives customer acquisition, brand awareness, and measurable conversion growth across SEO, content, social, email, and paid performance channels.',
    educationRequirements:
      'Any degree with real campaign portfolios, analytics certifications, or D2C/brand growth experiments.',
    responsibilities: [
      'Plan and optimize SEO, content calendars, and paid ad funnels',
      'Track CAC, ROAS, CTR, and conversion rates using analytics tools',
      'Write high-converting copy and run creative A/B tests',
      'Build retention loops via email, WhatsApp, and community channels',
    ],
    careerGrowth: 'Digital Marketing Executive -> Performance Marketer -> Growth Manager -> CMO',
    relatedOccupations: ['product-manager', 'business-analyst', 'ui-ux-designer'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'Marketing Fundamentals & Customer Funnels',
        category: 'Domain Knowledge',
        description: 'ICP targeting, positioning, awareness-to-retention funnels, and unit economics.',
        whyItMatters: 'Tools change every year, but buyer psychology and funnels stay constant.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'SEO & Content Strategy',
        category: 'Industry-Specific Skills',
        description: 'Keyword intent, on-page optimization, and organic growth loops.',
        whyItMatters: 'Builds compounding low-cost customer acquisition over time.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: ['Marketing Fundamentals & Customer Funnels'],
      },
      {
        name: 'Performance Ads & Campaign Optimization',
        category: 'Tools & Technologies',
        description: 'Meta Ads, Google Ads, audience testing, and ROAS optimization.',
        whyItMatters: 'Drives immediate measurable sales for startups and D2C brands.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Marketing Fundamentals & Customer Funnels'],
      },
      {
        name: 'Marketing Analytics & Attribution',
        category: 'Analytical Skills',
        description: 'GA4, UTM tracking, conversion funnels, and cohort LTV vs CAC.',
        whyItMatters: 'Separates profitable growth from wasted ad spend.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Performance Ads & Campaign Optimization'],
      },
      {
        name: 'Persuasive Copywriting & Storytelling',
        category: 'Communication Skills',
        description: 'Hooks, landing page messaging, ad scripts, and brand voice.',
        whyItMatters: 'Clear positioning multiplies click-through and conversion rates.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'financial-analyst',
    title: 'Financial Analyst',
    category: 'Business & Finance',
    domain: 'finance_economics',
    seniority: 'Entry / Junior',
    description:
      'Evaluates financial statements, builds valuation and forecasting models, and guides corporate budgeting or investment decisions.',
    educationRequirements:
      'B.Com, BBA Finance, BA Economics, CA/CFA track, or MBA Finance.',
    responsibilities: [
      'Analyze P&L, Balance Sheet, and Cash Flow statements',
      'Build 3-statement financial models, DCF valuations, and budgets',
      'Track variance between forecast vs actual revenue and margins',
      'Prepare crisp investment memos and board-ready financial decks',
    ],
    careerGrowth: 'Financial Analyst -> Senior FP&A / Equity Analyst -> Finance Manager -> CFO',
    relatedOccupations: ['business-analyst', 'data-analyst', 'product-manager'],
    sourceFramework: 'O*NET 31.0 / NCO India',
    sourceAttribution: 'Adapted from O*NET & NCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'Accounting & Financial Statements',
        category: 'Domain Knowledge',
        description: 'Income statement, balance sheet, cash flow linkage, and key ratios.',
        whyItMatters: 'Core language of business health and profitability.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Spreadsheet & Excel Modeling',
        category: 'Tools & Technologies',
        description: 'Dynamic 3-statement models, sensitivity tables, and clean formulas.',
        whyItMatters: 'Primary daily workstation for every finance analyst.',
        requiredProficiency: 5,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Accounting & Financial Statements'],
      },
      {
        name: 'Valuation & Financial Forecasting',
        category: 'Industry-Specific Skills',
        description: 'DCF, comparable multiples, unit economics, and cash runway forecasting.',
        whyItMatters: 'Determines pricing, fundraising, and investment decisions.',
        requiredProficiency: 4,
        difficultyLevel: 'Advanced',
        isRequired: true,
        prerequisites: ['Spreadsheet & Excel Modeling'],
      },
      {
        name: 'Quantitative Risk & Variance Analysis',
        category: 'Analytical Skills',
        description: 'Stress testing assumptions and explaining margin/cash movements.',
        whyItMatters: 'Protects companies against cash crunch and bad capital allocation.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Accounting & Financial Statements'],
      },
      {
        name: 'Executive Memo & Financial Reporting',
        category: 'Communication Skills',
        description: 'Distilling complex spreadsheets into clear recommendations.',
        whyItMatters: 'Decision-makers rely on your clarity, not 40 raw tabs.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
    ],
  },
  {
    id: 'researcher',
    title: 'Researcher (AI / Applied Science)',
    category: 'Science & Research',
    domain: 'science_research',
    seniority: 'Entry / Junior',
    description:
      'Investigates open scientific or technological problems through literature review, structured experiments, statistical validation, and peer-reviewed publication.',
    educationRequirements:
      'Undergraduate / Postgraduate STEM student or graduate pursuing research labs, R&D fellowships, or PhD pathways.',
    responsibilities: [
      'Conduct structured literature reviews and identify research gaps',
      'Design reproducible experimental protocols and ablation studies',
      'Analyze quantitative/qualitative findings with statistical rigor',
      'Author technical papers, posters, and reproducible code repositories',
    ],
    careerGrowth: 'Research Intern -> Research Associate -> Research Scientist -> Principal Investigator',
    relatedOccupations: ['data-scientist', 'ai-engineer', 'machine-learning-engineer'],
    sourceFramework: 'O*NET 31.0 / ESCO v1.2.1',
    sourceAttribution: 'Adapted from O*NET & ESCO competency frameworks (CC BY 4.0) by FutureX',
    skills: [
      {
        name: 'Literature Review & Gap Synthesis',
        category: 'Domain Knowledge',
        description: 'Reading peer-reviewed papers, tracking citations, and isolating unsolved gaps.',
        whyItMatters: 'Prevents reinventing known results and frames novel contributions.',
        requiredProficiency: 4,
        difficultyLevel: 'Beginner',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Research Methodology & Experimental Design',
        category: 'Critical Thinking',
        description: 'Controls, baselines, ablation design, and bias mitigation.',
        whyItMatters: 'Ensures findings hold up under strict peer review.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Literature Review & Gap Synthesis'],
      },
      {
        name: 'Mathematics & Statistics',
        category: 'Analytical Skills',
        description: 'Statistical significance, confidence intervals, and quantitative validation.',
        whyItMatters: 'Separates genuine breakthroughs from random noise.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Reproducible Computing & LaTeX',
        category: 'Tools & Technologies',
        description: 'Python/R notebooks, seed control, Git, and academic paper typesetting.',
        whyItMatters: 'Modern top-tier venues require reproducible code and clean manuscripts.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: [],
      },
      {
        name: 'Academic Writing & Peer Presentation',
        category: 'Communication Skills',
        description: 'Writing concise abstracts, structured papers, and defending methodology.',
        whyItMatters: 'Research only advances the field when clearly communicated.',
        requiredProficiency: 4,
        difficultyLevel: 'Intermediate',
        isRequired: true,
        prerequisites: ['Literature Review & Gap Synthesis'],
      },
    ],
  },
];

function runMigrationV2(db) {
  const versionRow = db.prepare('PRAGMA user_version').get();
  const currentVersion = versionRow ? Number(versionRow.user_version) : 0;

  if (currentVersion < 2) {
    console.log('[FutureX SQLite] Running Migration v2 (Rich Occupation Metadata)...');

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
      db.exec('PRAGMA user_version = 2;');
      db.exec('COMMIT;');
      console.log('[FutureX SQLite] Migration v2 completed.');
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }
}

function seedRichOccupations(db) {
  runMigrationV2(db);

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

  // Pass 1: Insert all occupations, skills, and occupation-skill links
  const pendingPrereqs = [];

  for (const occ of RICH_OCCUPATIONS) {
    upsertOccupation.run(
      occ.id,
      occ.title,
      occ.category,
      occ.domain,
      occ.seniority,
      occ.description,
      occ.educationRequirements,
      JSON.stringify(occ.responsibilities || []),
      occ.careerGrowth || '',
      JSON.stringify(occ.relatedOccupations || []),
      occ.sourceFramework || 'FutureX Ontology',
      occ.sourceAttribution || 'FutureX Curated'
    );

    for (const sk of occ.skills || []) {
      const skillId = `skill-${slugify(sk.name)}`;
      upsertSkill.run(
        skillId,
        sk.name,
        sk.category,
        sk.description || '',
        sk.whyItMatters || '',
        sk.requiredProficiency || 4,
        sk.difficultyLevel || 'Beginner'
      );

      const savedSkill = getSkillByName.get(sk.name);
      if (savedSkill) {
        linkOccSkill.run(occ.id, savedSkill.id, sk.isRequired === false ? 0 : 1, sk.isRequired === false ? 1 : 2);
        if (Array.isArray(sk.prerequisites)) {
          for (const prereqName of sk.prerequisites) {
            pendingPrereqs.push({ skillName: sk.name, prereqName });
          }
        }
      }
    }
  }

  // Pass 2: Insert prerequisite DAG edges after all skills exist
  for (const edge of pendingPrereqs) {
    const child = getSkillByName.get(edge.skillName);
    const parent = getSkillByName.get(edge.prereqName);
    if (child && parent && child.id !== parent.id) {
      linkPrereq.run(child.id, parent.id);
    }
  }

  console.log(`[FutureX SQLite] Rich Ontology ready: ${RICH_OCCUPATIONS.length} multi-category occupations seeded.`);
}

module.exports = {
  seedRichOccupations,
};