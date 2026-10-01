import { GoogleGenerativeAI } from '@google/generative-ai';
import { OnetService } from './onetService';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface SynthesizedCareer {
  roleId: string;
  roleTitle: string;
  profession: string;
  domainId: string;
  seniority: string;
  marketDemand: string;
  coreCompetencies: string[];
  toolsAndFrameworks: string[];
  skills: Array<{
    id: string;
    name: string;
    category: string;
    proficiency: number;
    status: 'Verified' | 'Assessed' | 'Learning';
    isGap: boolean;
  }>;
  roadmap: Array<{
    id: string;
    stepNumber: number;
    title: string;
    subtitle: string;
    duration: string;
    category: string;
    deliverable: string;
    status: 'completed' | 'current' | 'locked';
  }>;
}

export class UniversalCareerSynthesizer {
  static async synthesizeRole(roleQuery: string): Promise<SynthesizedCareer> {
    // 1. Search O*NET first for official US Department of Labor taxonomies
    const onetMatches = await OnetService.searchOccupations(roleQuery);
    let onetContext = '';

    if (onetMatches.length > 0) {
      const topMatch = onetMatches[0];
      const details = await OnetService.getOccupationDetails(topMatch.code);
      if (details) {
        onetContext = `Standard O*NET Reference: ${topMatch.title}. Core Tasks: ${details.tasks.join('; ')}. Standard Skills: ${details.skills.join(', ')}.`;
      }
    }

    // 2. Synthesize complete FutureX profile schema via Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are the FutureX Global Career Intelligence Engine.
Analyze the target career/occupation query: "${roleQuery}".
Reference Data: ${onetContext || 'None. Synthesize using strict current global industry standards.'}

Return a STRICT JSON object without markdown fences, matching this structure:
{
  "roleId": "kebab-case-id",
  "roleTitle": "Official Professional Title",
  "profession": "Primary Domain (e.g. Healthcare, Legal, Engineering, Finance, Aviation, Design)",
  "domainId": "domain-id",
  "seniority": "Junior to Mid-Level",
  "marketDemand": "High",
  "coreCompetencies": ["Skill 1", "Skill 2", "Skill 3", "Skill 4"],
  "toolsAndFrameworks": ["Tool 1", "Tool 2", "Tool 3"],
  "skills": [
    { "id": "sk-1", "name": "Skill Name 1", "category": "Core Knowledge", "proficiency": 45, "status": "Learning", "isGap": false },
    { "id": "sk-2", "name": "Skill Name 2", "category": "Technical", "proficiency": 25, "status": "Learning", "isGap": true },
    { "id": "sk-3", "name": "Skill Name 3", "category": "Practical Execution", "proficiency": 20, "status": "Learning", "isGap": true }
  ],
  "roadmap": [
    { "id": "step-1", "stepNumber": 1, "title": "Phase 1 Foundations", "subtitle": "Core fundamentals", "duration": "3-4 Weeks", "category": "Foundations", "deliverable": "Initial Case Artifact", "status": "current" },
    { "id": "step-2", "stepNumber": 2, "title": "Phase 2 Production Rigor", "subtitle": "Industry standard workflows", "duration": "4-6 Weeks", "category": "Execution", "deliverable": "Comprehensive Deliverable", "status": "locked" }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim().replace(/```json/g, '').replace(/```/g, '');
    return JSON.parse(rawText) as SynthesizedCareer;
  }
}