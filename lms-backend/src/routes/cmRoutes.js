import express from 'express';
import CMController from '../controllers/cmController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { idParamValidator } from '../utils/validators.js';

const router = express.Router();

router.get('/', authenticateToken, CMController.getAll);
router.get('/active', authenticateToken, CMController.getActive);
router.get('/:id', authenticateToken, idParamValidator, CMController.getOne);
router.get('/:id/details', authenticateToken, idParamValidator, CMController.getDetails);
router.get('/:id/statistics', authenticateToken, idParamValidator, CMController.getStatistics);
router.post('/', authenticateToken, isAdmin, CMController.create);
router.put('/:id', authenticateToken, isAdmin, idParamValidator, CMController.update);
router.delete('/:id', authenticateToken, isAdmin, idParamValidator, CMController.delete);

export default router;
