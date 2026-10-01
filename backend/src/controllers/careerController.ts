import { Request, Response } from 'express';
import { UniversalCareerSynthesizer } from '../services/universalCareerSynthesizer';
import { OnetService } from '../services/onetService';

export const searchGlobalOccupations = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

    const results = await OnetService.searchOccupations(q);
    return res.json({ success: true, count: results.length, occupations: results });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const synthesizeCareerRole = async (req: Request, res: Response) => {
  try {
    const { roleQuery } = req.body;
    if (!roleQuery) return res.status(400).json({ error: 'roleQuery is required in body' });

    const synthesizedProfile = await UniversalCareerSynthesizer.synthesizeRole(roleQuery);
    return res.json({ success: true, career: synthesizedProfile });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};