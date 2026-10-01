const fs = require('fs');
const path = require('path');

const BANK_PATH = path.join(__dirname, 'careerBank.json');

// Existing roles ko read karo taaki overwrite na ho
let currentBank = { roles: [] };
if (fs.existsSync(BANK_PATH)) {
  try {
    currentBank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'));
  } catch (e) {
    currentBank = { roles: [] };
  }
}

const existingIds = new Set(currentBank.roles.map((r) => r.id));

// 90 Authentic Roles Matrix (Domain, Title, Skills, Deliverables)
const DOMAINS_MAP = [
  // TECH & SYSTEMS (15 roles)
  { domain: 'Software Engineering', roles: [
    ['Generative AI & Prompt Engineer', 'Extreme', ['LLM Architectures', 'Prompt Optimization', 'LangChain / LlamaIndex', 'RAG Pipelines', 'Vector Databases', 'API Integration', 'Safety Guardrails', 'Fine-Tuning Baselines']],
    ['Site Reliability Engineer (SRE)', 'Very High', ['Linux Internals', 'SLI/SLO Frameworks', 'Incident Management', 'Distributed Tracing', 'Kubernetes Reliability', 'Terraform', 'Go / Python', 'Chaos Engineering']],
    ['Embedded Systems & IoT Developer', 'High', ['C/C++ Programming', 'Microcontrollers (ARM/ESP32)', 'RTOS Fundamentals', 'Hardware Protocols (I2C/SPI)', 'IoT Gateways', 'PCB Debugging', 'Firmware Flashing', 'Low-Power Optimization']],
    ['Blockchain & Smart Contract Developer', 'High', ['Solidity & EVM', 'Smart Contract Security', 'Hardhat / Foundry', 'DeFi Protocols', 'Web3.js / Ethers.js', 'Cryptography & Hashing', 'Gas Optimization', 'Zero-Knowledge Proofs']],
    ['QA Automation & SDET Engineer', 'High', ['Test Automation Frameworks', 'Playwright / Selenium', 'API Testing (Postman/RestAssured)', 'CI/CD Test Pipelines', 'Performance Testing (k6)', 'Defect Lifecycle Management', 'Python / TypeScript', 'Dockerized Test Runners']],
    ['Game Developer (Unity 3D / Unreal Engine)', 'High', ['C# / C++ Programming', '3D Linear Algebra', 'Physics Engines', 'Shader Programming', 'Game Loop Architecture', 'Asset Optimization', 'Multiplayer Networking', 'UI/UX for Games']],
    ['Computer Vision Engineer', 'Extreme', ['OpenCV & Image Processing', 'PyTorch / TensorRT', 'Object Detection (YOLO)', 'Image Segmentation', 'Edge Device Optimization', 'Camera Calibration', 'Feature Extraction', 'Model Quantization']],
    ['Natural Language Processing (NLP) Engineer', 'Extreme', ['Transformers & Attention', 'Tokenization & Embeddings', 'BERT / LLM Architectures', 'Information Extraction', 'HuggingFace Ecosystem', 'Text Preprocessing', 'Model Distillation', 'Semantic Search']],
    ['Database Administrator (DBA & Data Architect)', 'Very High', ['Relational Schemas', 'High Availability Clusters', 'Query Optimization & Profiling', 'Backup & Disaster Recovery', 'NoSQL & Distributed Stores', 'Database Security', 'Replication Architectures', 'Capacity Planning']],
    ['Enterprise Solutions Architect', 'Very High', ['System Decomposition', 'Cloud Patterns (AWS/GCP)', 'Integration Frameworks', 'Cost Optimization', 'Security Compliance', 'Event-Driven Architectures', 'Legacy Modernization', 'Governance Models']],
    ['Network Security Engineer', 'Very High', ['Next-Gen Firewalls', 'VPN & Zero Trust', 'Intrusion Detection (IDS/IPS)', 'Network Topologies', 'TLS/SSL Handshakes', 'Security Policy Auditing', 'Routing & Switching', 'Threat Mitigation']],
    ['AR/VR (Spatial Computing) Developer', 'High', ['Unity / Unreal Engine', 'OpenXR SDKs', 'Spatial Audio & Physics', '3D Asset Pipelines', 'Realtime Rendering Optimization', 'Hand Tracking & Gestures', 'C# / C++', 'Interactive Prototyping']],
    ['Bioinformatics Software Engineer', 'High', ['Genomic Sequencing Tools', 'Python & Biopython', 'Data Pipelines', 'Statistical Genomics', 'High-Performance Computing', 'R & BioConductor', 'Biological Databases', 'Machine Learning in Biology']],
    ['Robotics Software Engineer', 'Very High', ['ROS / ROS2 Architecture', 'Kinematics & Dynamics', 'SLAM & Path Planning', 'Sensor Fusion (LiDAR/IMU)', 'C++ & Python', 'Control Systems (PID)', 'Gazebo Simulation', 'Embedded Linux']],
    ['Microservices Architect', 'Very High', ['Domain-Driven Design', 'gRPC / Protocol Buffers', 'Event-Driven Messaging', 'Service Mesh (Istio)', 'Distributed Transactions (Saga)', 'Observability & Tracing', 'Container Orchestration', 'API Gateways']],
    ['MLOps Engineer', 'Extreme', ['MLflow & Experiment Tracking', 'Kubeflow / Vertex AI', 'Model CI/CD Pipelines', 'Feature Stores', 'Automated Retraining', 'Inference Monitoring', 'Docker & Kubernetes', 'Model Governance']]
  ]},
  // CORE ENGINEERING & MANUFACTURING (15 roles)
  { domain: 'Core Engineering', roles: [
    ['Mechanical Design Engineer (CAD / SolidWorks)', 'Very High', ['Parametric 3D CAD', 'GD&T Standards', 'Finite Element Analysis (FEA)', 'Material Selection & Metallurgy', 'DFM / DFA Standards', 'Prototyping & CNC Machining', 'Sheet Metal Design', 'Technical Documentation']],
    ['Electrical Vehicle (EV) Systems Engineer', 'Extreme', ['Battery Management Systems (BMS)', 'Motor Control & Inverters', 'High-Voltage Architecture', 'CAN / LIN Bus Protocols', 'Thermal Runaway Management', 'Power Electronics', 'Automotive SPICE', 'MATLAB / Simulink']],
    ['VLSI & Chip Design Engineer', 'Extreme', ['Verilog / SystemVerilog', 'Digital Design Fundamentals', 'FPGA Prototyping', 'Static Timing Analysis (STA)', 'CMOS Circuit Design', 'EDA Tools (Synopsys/Cadence)', 'Verification Methodologies (UVM)', 'Physical Design & Layout']],
    ['Renewable Energy (Solar & Wind) Engineer', 'High', ['Photovoltaic System Design', 'Grid Interconnection Protocols', 'Energy Storage Systems (ESS)', 'Yield Estimation (PVsyst)', 'Wind Turbine Aerodynamics', 'Inverter Technology', 'Regulatory Compliance', 'Site Feasibility Analysis']],
    ['Industrial Automation & PLC Engineer', 'Very High', ['PLC Programming (Ladder/Structured Text)', 'SCADA & HMI Design', 'Fieldbus Protocols (Modbus/Profinet)', 'Industrial Sensors & Actuators', 'Electrical Panel Design', 'Troubleshooting & Safety Interlocks', 'VFD Configuration', 'Preventive Maintenance Systems']],
    ['Structural Civil Engineer', 'High', ['Structural Analysis (ETABS/STAAD)', 'Reinforced Concrete Design', 'Steel Structure Detailing', 'Seismic & Wind Load Calculation', 'Building Codes (IS/ACI/Eurocodes)', 'Foundation Design', 'BIM Coordination', 'Site Quality Inspection']],
    ['Drone Hardware & Flight Control Engineer', 'High', ['Avionics & Flight Controllers', 'Propulsion & Aerodynamics', 'Telemetry & Radio Protocols', 'Sensor Calibration', 'Embedded C/C++', 'Payload Integration', 'Airframe Structural Design', 'Safety & Failover Logic']],
    ['Circular Economy & Waste Management Engineer', 'High', ['Material Lifecycle Assessment (LCA)', 'Industrial Symbiosis', 'Waste Characterization', 'Thermal & Chemical Recycling', 'Pollution Control Tech', 'Environmental Compliance', 'Resource Recovery Systems', 'Sustainability Auditing']],
    ['Mechatronics Specialist', 'Very High', ['Sensors & Transducers', 'Microcontroller Interfacing', 'Pneumatics & Hydraulics', 'Electromechanical Assemblies', 'Motion Control Systems', 'Python & C++', 'Rapid Prototyping', 'System Calibration']],
    ['Thermal Systems Analyst', 'High', ['Thermodynamics & Heat Transfer', 'Computational Fluid Dynamics (CFD)', 'Ansys Fluent / OpenFOAM', 'Heat Exchanger Sizing', 'Cooling System Architecture', 'Conjugate Heat Transfer', 'Experimental Testing', 'Thermal Insulation Modeling']],
    ['Aerospace Propulsion Engineer', 'High', ['Gas Turbine Mechanics', 'Rocket Propulsion Physics', 'Compressible Flow Dynamics', 'Combustion Modeling', 'High-Temperature Alloys', 'Test Stand Instrumentation', 'Aerodynamic Optimization', 'Structural Vibration Analysis']],
    ['Supply Chain & Logistics Engineer', 'Very High', ['Warehouse Management Systems (WMS)', 'Network Optimization Modeling', 'Inventory Theory & Safety Stock', 'Simulation (Arena/Simio)', 'Transportation Management', 'Root Cause Analysis', 'Lean Six Sigma', 'Cost-to-Serve Modeling']],
    ['Quality Control & Six Sigma Specialist', 'High', ['Statistical Process Control (SPC)', 'DMAIC Methodology', 'Root Cause Analysis (8D / 5-Why)', 'ISO 9001 / IATF 16949 Standards', 'Measurement System Analysis (MSA)', 'Process Capability (Cp/Cpk)', 'Control Plans', 'Supplier Quality Auditing']],
    ['Geotechnical Engineer', 'High', ['Soil Mechanics & Sampling', 'Slope Stability Analysis', 'Shallow & Deep Foundation Design', 'Retaining Wall Modeling', 'Geotechnical Instrumentation', 'Ground Improvement Techniques', 'Geotechnical Software (GeoStudio)', 'Seismic Hazard Assessment']],
    ['Environmental Safety & Compliance Officer', 'High', ['OSHA / National Safety Codes', 'Hazard Identification & Risk Assessment', 'Environmental Impact Assessment (EIA)', 'Waste Discharge Standards', 'Emergency Preparedness Plans', 'Workplace Ergonomics', 'Safety Training & Drills', 'Incident Investigation']]
  ]},
  // MEDICAL & HEALTHCARE (15 roles)
  { domain: 'Healthcare & Life Sciences', roles: [
    ['Clinical Research Associate (CRA)', 'Very High', ['Good Clinical Practice (ICH-GCP)', 'Trial Monitoring & Site Visits', 'Protocol Adherence Verification', 'Informed Consent Audits', 'Adverse Event Reporting', 'Electronic Data Capture (EDC)', 'Regulatory Submissions', 'Investigator Site Files']],
    ['Healthcare Informatics Specialist', 'Very High', ['HL7 & FHIR Standards', 'Electronic Health Records (EHR)', 'Healthcare Data Privacy (HIPAA)', 'Clinical Terminology (SNOMED/ICD)', 'Clinical Workflow Mapping', 'Data Quality Profiling', 'SQL in Healthcare', 'Health Data Interoperability']],
    ['Public Health Policy Analyst', 'High', ['Epidemiological Study Design', 'Health Economics & Cost-Effectiveness', 'Policy Drafting & Advocacy', 'Biostatistics (R/SPSS)', 'Disease Surveillance Systems', 'Community Needs Assessment', 'Program Monitoring & Evaluation', 'Stakeholder Engagement']],
    ['Medical Laboratory Technologist', 'High', ['Hematology & Clinical Biochemistry', 'Microbiological Culturing', 'Quality Control & Calibration', 'Laboratory Information Systems (LIS)', 'Histopathology Techniques', 'Biosafety Protocols', 'Automated Diagnostic Analyzers', 'Specimen Handling & Validation']],
    ['Biostatistician', 'Very High', ['Survival Analysis & Cox Models', 'Clinical Trial Design & Sample Size', 'SAS / R Programming', 'Hypothesis Testing', 'Meta-Analysis Methodologies', 'Statistical Analysis Plans (SAP)', 'Data Safety Monitoring Reports', 'Longitudinal Data Modeling']],
    ['Hospital Operations Manager', 'High', ['Hospital Workflow Optimization', 'Bed Capacity & Patient Flow', 'Healthcare Accreditation (NABH/JCI)', 'Medical Equipment Procurement', 'Operating Room Scheduling', 'Patient Experience Metrics', 'Hospital Budgeting & Billing', 'Staffing Models']],
    ['Physical Therapy & Rehabilitation Specialist', 'High', ['Musculoskeletal Assessment', 'Therapeutic Exercise Prescription', 'Manual Therapy Techniques', 'Gait Analysis & Biomechanics', 'Rehabilitation Progress Tracking', 'Modalities & Electrophysiology', 'Patient Education & Ergonomics', 'Post-Surgical Protocols']],
    ['Radiologic Technologist', 'High', ['Diagnostic X-Ray Physics', 'CT Scan Protocols', 'MRI Safety & Imaging Sequences', 'Radiation Protection (ALARA)', 'Patient Positioning Techniques', 'PACS / DICOM Image Management', 'Contrast Media Administration', 'Equipment Quality Assurance']],
    ['Regulatory Affairs Specialist (Pharma & Biotech)', 'Very High', ['FDA / EMA / CDSCO Guidelines', 'Dossier Preparation (eCTD)', 'Chemistry, Manufacturing & Controls (CMC)', 'Labeling & Packaging Compliance', 'Post-Marketing Surveillance', 'Regulatory Strategy Formulation', 'Audit Readiness & Inspections', 'Pharmacovigilance Compliance']],
    ['Genetic Counselor', 'High', ['Pedigree Analysis & Genetics', 'Risk Calculation Methodologies', 'Genetic Test Interpretation', 'Patient Communication & Counseling', 'Ethical, Legal & Social Implications', 'Variant Classification (ACMG)', 'Multidisciplinary Collaboration', 'Rare Disease Registries']],
    ['Sports Nutritionist & Dietitian', 'High', ['Macronutrient Periodization', 'Body Composition Assessment', 'Ergogenic Supplements & Doping Codes', 'Hydration Strategies', 'Metabolic Rate Testing', 'Clinical Dietetics & Deficiencies', 'Meal Planning Software', 'Athlete Recovery Protocols']],
    ['Biomedical Equipment Engineer', 'High', ['Medical Device Calibration', 'Preventive Maintenance Protocols', 'Biomedical Sensor Physics', 'Safety Standards (IEC 60601)', 'Troubleshooting & Circuit Repair', 'Hospital Installation Management', 'Telemetry & Patient Monitors', 'Vendor Contract Management']],
    ['Pharmaceutical Quality Assurance Analyst', 'Very High', ['Current Good Manufacturing Practice (cGMP)', 'Batch Record Review & Release', 'Deviation & OOS Investigations', 'Change Control Systems', 'Validation Protocols (IQ/OQ/PQ)', 'Cleanroom Environmental Monitoring', 'Stability Testing Oversight', 'CAPA Execution']],
    ['Occupational Health & Safety Specialist', 'High', ['Industrial Hygiene Monitoring', 'Ergonomic Risk Evaluations', 'Hazard Communication & SDS', 'Noise & Air Exposure Profiling', 'Safety Auditing Frameworks', 'Workers Compensation Compliance', 'Personal Protective Equipment (PPE) Systems', 'Crisis Containment']],
    ['Medical Content & Communication Specialist', 'High', ['Medical Writing (ICMJE Guidelines)', 'Scientific Literature Appraisal', 'Patient Educational Literacy', 'Medical Marketing Code Compliance', 'Peer-Reviewed Manuscript Prep', 'Infographic & Visual Framing', 'Clinical Trial Result Plain Summaries', 'Content Fact-Checking']]
  ]},
  // ARCHITECTURE & DESIGN (15 roles)
  { domain: 'Design & Built Environment', roles: [
    ['Architectural Design Lead (BIM / Revit)', 'Very High', ['Autodesk Revit & BIM Execution Plans', 'Clash Detection (Navisworks)', 'Building Codes & Zoned By-laws', 'Spatial Planning & Massing', 'Parametric Modeling (Grasshopper)', 'Construction Documentation', 'Sustainable Materials Selection', 'Site Supervision & Quality']],
    ['3D Visualizer & Game Asset Artist', 'High', ['3D Modeling (Blender / 3ds Max)', 'PBR Texturing (Substance Painter)', 'UV Unwrapping & Topology Optimization', 'Lighting, Baking & Render Engines', 'Asset Integration (Unreal/Unity)', 'Photogrammetry & Scan Cleanups', 'Composition & Art Direction', 'LOD (Level of Detail) Systems']],
    ['Motion Graphics & Visual Effects (VFX) Designer', 'High', ['After Effects Animation & Expressions', 'Cinema 4D / Blender Dynamics', 'Rotoscoping & Keying', 'Compositing & Color Grading', 'Kinetic Typography', 'Sound Design Integration', 'Render Farm Management', 'Brand Motion Guidelines']],
    ['Industrial Product Designer', 'High', ['Concept Sketching & Form Development', 'Ergonomics & Anthropometrics', 'CAD Modeling for Tooling (SolidWorks/Rhino)', 'Material Selection & Finishing (CMF)', 'Rapid Physical Prototyping', 'User Interaction Ergonomics', 'DFM for Injection Molding', 'Design Language Systems']],
    ['Landscape & Urban Planning Architect', 'High', ['GIS & Spatial Cartography', 'Urban Zoning & Land-Use Models', 'Stormwater & Grading Plans', 'Planting Design & Ecology', 'Pedestrian & Transit Integration', 'Public Space Placemaking', 'Environmental Impact Mitigation', 'Client & Civic Masterplanning']],
    ['Sustainable Green Building Consultant', 'High', ['LEED / BREEAM / GRIHA Certification', 'Energy Simulation (EnergyPlus/eQUEST)', 'Daylighting & Glare Analysis', 'Embodied Carbon Assessments', 'HVAC Efficiency Optimization', 'Water Conservation Frameworks', 'Indoor Air Quality Standards', 'Commissioning Oversight']],
    ['Brand Identity & Visual Designer', 'High', ['Brand Strategy & Positioning', 'Typography Pairing & Hierarchy', 'Logo System Design & Geometry', 'Color Psychology & Palette Tokens', 'Packaging Design & Print Specs', 'Comprehensive Brand Guidelines', 'Illustration & Iconography Systems', 'Marketing Collateral Production']],
    ['Video Producer & Technical Animator', 'High', ['Multi-Camera Production & Lighting', 'NLE Video Editing (Premiere / DaVinci)', 'Color Grading & LUT Workflows', 'Audio Mastering & Dialogue Cleaning', 'Storyboarding & Pacing', 'Technical Demonstration Rigging', 'Streaming & Encoding Codecs', 'Post-Production Archival']],
    ['Sound Designer & Audio Engineer', 'High', ['DAW Mastery (Pro Tools / Ableton)', 'Synthesizer Patch Creation & Foley', 'Audio Dynamic Processing & EQ', 'Spatial Audio (Dolby Atmos)', 'Game Audio Middleware (FMOD / Wwise)', 'Microphone Physics & Recording', 'Audio Restoration (iZotope)', 'Loudness Standards (EBU R128)']],
    ['Interior & Spatial Experience Designer', 'High', ['Interior Space Planning & Layouts', 'Custom Millwork & Joinery Details', 'Lighting Design & Mood Engineering', 'FF&E Sourcing & Specification', 'Material Board Composition', '3D Photorealistic Interior Renders', 'Vendor & Contractor Coordination', 'Acoustic Treatment Integration']],
    ['Design Systems Architect', 'Very High', ['Token Architecture & Naming Schemes', 'Figma Variant & Variable Engineering', 'Component State Matrix Development', 'Accessibility Standards (WCAG)', 'Cross-Platform System Governance', 'Engineering Handoff Protocols', 'Documentation (Storybook Alignment)', 'Design System Adoption Metrics']],
    ['Technical Illustrator & CAD Drafter', 'High', ['Isometric & Exploded Technical Views', 'AutoCAD Precise Drafting', 'GD&T Symbology & Part Schedules', 'Assembly Manual Crafting', 'Vector Graphics (Illustrator)', 'Patent Drawing Compliance', 'Cross-Sectional Renderings', 'Revision Control & Standards']],
    ['Fashion & Textile Systems Designer', 'High', ['Garment Construction & Draping', 'Digital Pattern Making (Clo3D / Gerber)', 'Textile Fiber Tech & Material Sourcing', 'Color & Trend Forecasting', 'Tech Pack Engineering', 'Sustainable Manufacturing Audits', 'Fit Analysis & Alterations', 'Cost-to-Manufacture Analysis']],
    ['Exhibition & Experience Designer', 'High', ['Visitor Circulation & Spatial Flow', 'Interactive Kiosk Hardware & UI', 'Exhibit Lighting & AV Integration', 'Temporary Structure Safety & Fire Codes', 'Story-Driven Spatial Architecture', 'Material Durability & Transportability', 'BIM / 3D Walkthrough Renders', 'Vendor Fabrication Oversight']],
    ['User Research & Usability Lead', 'High', ['Qualitative Interview Methodologies', 'Usability Test Lab Moderation', 'Heuristic Evaluation Frameworks', 'Card Sorting & Tree Testing', 'Survey Design & Quantitative Metrics (SUS)', 'Persona & Archetype Formulation', 'Affinity Mapping & Insight Synthesis', 'Executive Research Readouts']]
  ]},
  // LAW & PUBLIC POLICY (15 roles)
  { domain: 'Law & Governance', roles: [
    ['Corporate M&A Legal Associate', 'Very High', ['Companies Act & Statutory Compliance', 'Due Diligence Data Room Auditing', 'Share Purchase Agreement (SPA) Drafting', 'Cap Table Analysis & Shareholders Rights', 'Merger Clearance & Approvals', 'Board Resolution Formulations', 'Disclosure Schedules', 'Dispute Risk Redlining']],
    ['Intellectual Property (IP) & Patent Attorney', 'Very High', ['Patent Claim Drafting', 'Prior Art Searches (USPTO/WIPO)', 'Patentability Opinions', 'Trademark Filing & Opposition Strategy', 'Copyright Licensing Agreements', 'IP Infringement Analysis', 'Trade Secret Protection Protocols', 'Technology Transfer Agreements']],
    ['Cyber Law & Data Privacy Compliance Counsel', 'Extreme', ['Data Protection Regulations (GDPR/DPDP)', 'Privacy Impact Assessments (PIA)', 'Data Transfer Agreements (SCCs)', 'Cyber Incident Legal Handling', 'Terms of Service & Privacy Policy Crafting', 'Data Processing Agreements (DPAs)', 'Cross-Border Data Governance', 'Regulatory Response Representation']],
    ['FinTech & Banking Regulatory Associate', 'Very High', ['Banking Regulations (RBI/SEC/FCA)', 'Payment Aggregator Licensing Norms', 'Anti-Money Laundering (AML) Compliance', 'Digital Lending Directives', 'KYC & Customer Onboarding Governance', 'Cryptocurrency & Digital Asset Laws', 'Financial Product Risk Disclosures', 'Supervisory Inspection Audits']],
    ['Dispute Resolution & Commercial Arbitrator', 'High', ['Arbitration Agreements & Seat Selection', 'Statement of Claim / Defense Drafting', 'Evidence Collation & Cross-Examination Prep', 'Arbitral Award Enforcement Strategy', 'Mediation Frameworks', 'Interim Relief Injunction Petitions', 'Commercial Contract Breach Analysis', 'Settlement Agreement Structuring']],
    ['Environmental Policy & Climate Law Specialist', 'High', ['Environmental Impact Assessment Auditing', 'Carbon Credit Mechanism Legalities', 'Renewable PPA (Power Purchase) Drafting', 'Forest & Water Conservation Directives', 'Pollution Control Board Permitting', 'Climate Litigation Case Preparation', 'ESG Governance & Disclosure Laws', 'Statutory Environmental Filings']],
    ['Public Policy & Government Relations Strategist', 'High', ['Legislative Policy Analysis', 'Stakeholder Mapping & Coalition Building', 'Regulatory Impact Assessment', 'White Paper Drafting & Consultation Responses', 'Government Procurement Laws', 'Economic Modeling Interpretation', 'Civic Advocacy Strategies', 'Public Sector Partnership Structuring']],
    ['Legal Technology & Operations Specialist', 'High', ['Contract Lifecycle Management (CLM) Systems', 'e-Discovery Platforms (Relativity)', 'Legal Workflow Automation', 'Matter Management Software', 'Legal Spend Analytics & Budgeting', 'Template Harmonization & Playbooks', 'AI Contract Review Implementation', 'Legal Knowledge Management']],
    ['Criminal Defense & Litigation Associate', 'High', ['Criminal Procedure Codes (CrPC/BNSS)', 'Bail Application & Argument Structuring', 'Police Charge-Sheet Scrutiny', 'Forensic Evidence Examination', 'Witness Cross-Examination Strategy', 'Constitutional Rights Protection', 'Appellate Drafting & Case Law Curation', 'Trial Advocacy Practice']],
    ['Human Rights & International Law Researcher', 'High', ['Public International Law & Treaties', 'International Humanitarian Law (Geneva Conv.)', 'UN Human Rights Machinery & Reporting', 'Refugee Law & Asylum Protocols', 'Comparative Constitutional Law', 'Fact-Finding Mission Methodologies', 'Amicus Curiae Brief Drafting', 'Transnational Justice Mechanisms']],
    ['Labor Relations & Employment Law Officer', 'High', ['Employment Contract & Non-Compete Drafting', 'Workplace Harassment (POSH) Adjudication', 'Industrial Disputes & Trade Union Laws', 'Severance & Termination Governance', 'Employee Benefit & Gratuity Compliance', 'Workplace Safety Legal Directives', 'Internal Disciplinary Inquiries', 'Global Remote Work Tax/Labor Issues']],
    ['Contract Lifecycle Management Specialist', 'High', ['Standardized Contract Playbook Engineering', 'Clause Library Maintenance', 'Contract Risk Auditing & Scoring', 'Obligation Tracking & Milestone Governance', 'Vendor Negotiation Support', 'Contract Authoring & Version Control', 'Renewal & Termination Analytics', 'Audit Trail Maintenance']],
    ['Anti-Money Laundering (AML) Compliance Analyst', 'Very High', ['Know Your Customer (KYC/KYB) Verification', 'Transaction Monitoring Alert Triage', 'Suspicious Activity Report (SAR) Filing', 'Sanctions & PEP Screening', 'Source of Wealth Investigation', 'Terrorist Financing Risk Models', 'Financial Crime Regulatory Auditing', 'Traceability Analysis']],
    ['Competition & Antitrust Law Associate', 'High', ['Abuse of Dominant Position Analysis', 'Cartel Investigation Defense', 'Merger Control Threshold Analysis', 'Anti-Competitive Agreement Scrutiny', 'Market Definition Methodologies', 'Dawn Raid Preparation & Response', 'Leniency Applications', 'Economic Evidence Evaluation']],
    ['Tax Law & GST Consultant', 'High', ['Direct Tax Assessments & Appeals', 'GST Valuation, ITC & Filing Compliance', 'Transfer Pricing Documentation', 'International Double Tax Avoidance (DTAA)', 'Corporate Tax Structuring', 'Tax Audit Representation', 'Statutory Refund Claims', 'Withholding Tax Certifications']]
  ]},
  // BUSINESS & FINANCE (15 roles)
  { domain: 'Business & Finance', roles: [
    ['Quantitative Investment Analyst (Quant)', 'Extreme', ['Stochastic Calculus & Time-Series Econometrics', 'Python / C++ Algorithmic Backtesting', 'Factor Investing Models', 'Portfolio Optimization (Mean-Variance/Black-Litterman)', 'Risk Models (VaR, Expected Shortfall)', 'Market Microstructure & Order Book Dynamics', 'Financial Machine Learning', 'Option Pricing Models']],
    ['Venture Capital & Private Equity Analyst', 'High', ['LBO & Financial Return Modeling (IRR/MOIC)', 'Cap Table Waterfall Calculations', 'Startup Pitch Deck Due Diligence', 'Unit Economics Breakdown (CAC/LTV/Burn)', 'Market Sizing (TAM/SAM/SOM)', 'Term Sheet Structuring & Covenants', 'Industry Landscape Mapping', 'Investment Memo Authoring']],
    ['Financial Risk & Fraud Analyst', 'Very High', ['Credit Risk Scoring Models', 'Fraud Detection Machine Learning Rules', 'Stress Testing & Basel Regulatory Norms', 'Liquidity Risk Metrics', 'Counterparty Risk Analysis', 'Anomaly Detection in Financial Data', 'Loss Forecasting', 'Audit Trail Validation']],
    ['Growth Marketing & Performance Specialist', 'High', ['Paid Acquisition Channels (Meta/Google Ads)', 'Conversion Rate Optimization (CRO)', 'A/B Testing Methodology & Significance', 'Marketing Attribution Modeling', 'Customer Lifecycle & Retention Loops', 'Analytics Tracking (GA4/Mixpanel)', 'Cost Per Acquisition Optimization', 'Creative Iteration Systems']],
    ['Management & Strategy Consultant', 'Very High', ['Issue Tree Problem Structuring (MECE)', 'Hypothesis-Driven Synthesis', 'Executive Business Case Construction', 'Market Entry & Feasibility Studies', 'Operational Benchmarking', 'Cost Reduction Frameworks', 'Change Management Roadmaps', 'Boardroom Presentation Crafting']],
    ['Operations Excellence Lead', 'High', ['Lean Six Sigma (VSM / Kaizen)', 'Bottleneck Analysis (Theory of Constraints)', 'Standard Operating Procedure (SOP) Design', 'Resource Allocation & Scheduling', 'Root Cause Problem Solving', 'Operational KPI Scorecards', 'Change Resistance Mitigation', 'Cross-Functional Process Mapping']],
    ['E-Commerce & Retail Operations Manager', 'High', ['Marketplace Optimization (Amazon/Shopify)', 'Catalog Architecture & Merchandising', 'Order Fulfillment & SLA Monitoring', 'Inventory Turnover Metrics', 'Return & Refund Reduction Strategies', 'Customer Acquisition Cost (CAC) Efficiency', 'Vendor Negotiation & Sourcing', 'Payment Gateway Reconciliation']],
    ['Business Analytics & Forecasting Lead', 'High', ['Demand Forecasting & Seasonal Trend Models', 'Predictive Modeling with Machine Learning', 'Executive Dashboard Building', 'Scenario Planning & Sensitivity Analysis', 'Data Pipeline Hygiene', 'Churn & Cohort Analysis', 'Revenue Optimization Strategies', 'Stakeholder Business Briefings']],
    ['Investment Banking Associate', 'Very High', ['3-Statement Dynamic LBO/M&A Modeling', 'Discounted Cash Flow (DCF) Valuation', 'Public Trading Comps & Precedent Transactions', 'Confidential Information Memorandum (CIM)', 'Debt Financing & Syndication Structures', 'Equity Research Pitch Books', 'Data Room Management', 'Transaction Closing Protocols']],
    ['FinTech Product Strategist', 'High', ['Open Banking & API Economy Frameworks', 'Embedded Finance Architectures', 'Payment Rails (ACH, UPI, SEPA, Cards)', 'Credit Underwriting Funnel Optimization', 'Regulatory Sandbox Structuring', 'Fraud vs Friction Conversion Balance', 'Monetization & Take-Rate Modeling', 'User Onboarding UX Optimization']],
    ['Customer Success & Enterprise Account Executive', 'High', ['Enterprise Software Sales Funnels', 'Customer Journey Health Scoring', 'Net Revenue Retention (NRR) Management', 'Quarterly Business Review (QBR) Preparation', 'Objection Handling & Value Negotiation', 'Product Adoption Onboarding Roadmaps', 'Churn Risk Mitigation', 'Expansion & Upsell Strategies']],
    ['Sustainability & ESG Analyst', 'High', ['GRI & SASB Reporting Frameworks', 'Scope 1, 2 & 3 Carbon Footprint Auditing', 'ESG Rating Agency Methodologies (MSCI/Sustainalytics)', 'Supply Chain Ethical Auditing', 'Materiality Assessment Matrices', 'Green Bond Issuance Compliance', 'Decarbonization Roadmap Formulation', 'Corporate Social Responsibility (CSR) Impact']],
    ['Human Capital & Talent Acquisition Strategist', 'High', ['Competency-Based Interview Design', 'Compensation Benchmarking & Bands', 'Talent Sourcing Pipelines & Boolean Search', 'Employee Retention & Attrition Profiling', 'Performance Appraisal Frameworks', 'Employer Branding Strategy', 'HR Information Systems (HRIS)', 'Diversity & Inclusion Governance']],
    ['Supply Chain Sourcing & Procurement Lead', 'High', ['Strategic Sourcing Methodologies', 'Total Cost of Ownership (TCO) Calculation', 'Supplier Risk & Resilience Auditing', 'Contract Terms Negotiation & Master Service Agreements', 'Spend Analytics & Categorization', 'Inventory Replenishment Models', 'Ethical Sourcing Compliance', 'Supplier Relationship Management (SRM)']],
    ['Digital Transformation & Change Leader', 'High', ['Legacy System Architecture Migration', 'Digital Maturity Assessments', 'Agile Organization Transformation', 'Culture & Change Management Plans', 'Technology Vendor Selection (RFP)', 'Value Stream Mapping', 'Executive Transformation Metrics', 'Employee Upskilling Roadmaps']]
  ]}
];

// Generation Logic
let addedCount = 0;

DOMAINS_MAP.forEach((group) => {
  group.roles.forEach(([title, demand, skillsList]) => {
    const roleId = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (existingIds.has(roleId)) return;

    const formattedSkills = skillsList.map((skName, i) => {
      let category = 'Technical';
      if (i < 2) category = 'Core Knowledge';
      else if (i >= 5) category = 'Execution';
      return {
        id: `sk-${i + 1}`,
        name: skName,
        category: category,
      };
    });

    const roadmap = [
      {
        stepNumber: 1,
        title: `Phase 1: ${title} Baseline Systems`,
        subtitle: 'Core operational standards, protocols, and architectural foundations',
        duration: '3-4 Weeks',
        category: 'Foundations',
        deliverable: `${title} Standard Baseline Case Artifact`,
        status: 'current',
      },
      {
        stepNumber: 2,
        title: `Phase 2: Production Execution & Rigor`,
        subtitle: 'Applied industry workflows and technical verification milestones',
        duration: '4-5 Weeks',
        category: 'Execution',
        deliverable: 'Production Case Artifact & Technical ProofPass',
        status: 'upcoming',
      },
      {
        stepNumber: 3,
        title: `Phase 3: High-Scale Reliability & Specialization`,
        subtitle: 'Edge-case handling, distributed optimization, and domain mastery',
        duration: '4-6 Weeks',
        category: 'Specialization',
        deliverable: 'Advanced Specialization Industry Deliverable',
        status: 'upcoming',
      },
      {
        stepNumber: 4,
        title: `Phase 4: Capstone Leadership & Industry Proof`,
        subtitle: 'End-to-end autonomous execution and verified capstone deployment',
        duration: '3-4 Weeks',
        category: 'Production',
        deliverable: 'Comprehensive Portfolio Dossier & Ready-to-Hire Proof',
        status: 'upcoming',
      },
    ];

    currentBank.roles.push({
      id: roleId,
      title: title,
      domain: group.domain,
      seniority: 'Junior to Mid-Level',
      marketDemand: demand,
      skills: formattedSkills,
      roadmap: roadmap,
    });

    existingIds.add(roleId);
    addedCount++;
  });
});

fs.writeFileSync(BANK_PATH, JSON.stringify(currentBank, null, 2), 'utf8');
console.log(`[FutureX Seed] Successfully appended ${addedCount} roles.`);
console.log(`[FutureX Seed] Total roles in careerBank.json: ${currentBank.roles.length}`);