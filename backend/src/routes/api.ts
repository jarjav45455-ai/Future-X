import { Router } from 'express';
import { searchGlobalOccupations, synthesizeCareerRole } from '../controllers/careerController';

const router = Router();

// Universal Career Intelligence Endpoints
router.get('/careers/search', searchGlobalOccupations);
router.post('/careers/synthesize', synthesizeCareerRole);

export default router;