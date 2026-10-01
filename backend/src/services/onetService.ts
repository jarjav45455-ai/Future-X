import axios from 'axios';

const ONET_BASE_URL = 'https://services.onetcenter.org/ws/online';

export interface OnetOccupation {
  code: string;
  title: string;
  description: string;
}

export class OnetService {
  private static getAuthHeader() {
    const username = process.env.ONET_USERNAME || '';
    const password = process.env.ONET_PASSWORD || '';
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    return {
      Authorization: `Basic ${token}`,
      Accept: 'application/json',
    };
  }

  // Search through all global occupations
  static async searchOccupations(keyword: string): Promise<OnetOccupation[]> {
    if (!process.env.ONET_USERNAME) return [];
    try {
      const res = await axios.get(`${ONET_BASE_URL}/search`, {
        headers: this.getAuthHeader(),
        params: { kw: keyword },
      });

      const occupations = res.data?.occupation || [];
      return occupations.slice(0, 8).map((o: any) => ({
        code: o.code,
        title: o.title,
        description: o.tags?.bright_outlook ? 'Bright Outlook' : 'Standard Industry Occupation',
      }));
    } catch (err) {
      console.warn('O*NET API fallback triggered.');
      return [];
    }
  }

  // Get specific skills, knowledge, and tools for an occupation
  static async getOccupationDetails(code: string) {
    if (!process.env.ONET_USERNAME) return null;
    try {
      const [summaryRes, skillsRes] = await Promise.all([
        axios.get(`${ONET_BASE_URL}/occupations/${code}/summary`, { headers: this.getAuthHeader() }),
        axios.get(`${ONET_BASE_URL}/occupations/${code}/summary/skills`, { headers: this.getAuthHeader() }),
      ]);

      const tasks = summaryRes.data?.tasks?.task?.map((t: any) => t.statement).slice(0, 5) || [];
      const skills = skillsRes.data?.element?.map((s: any) => s.name).slice(0, 6) || [];

      return { tasks, skills };
    } catch (err) {
      return null;
    }
  }
}