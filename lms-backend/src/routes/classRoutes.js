import express from 'express';
import ClassController from '../controllers/classController.js';
import { authenticateToken, isCMOrAdmin } from '../middleware/auth.js';
import { classValidator, idParamValidator } from '../utils/validators.js';

const router = express.Router();

router.get('/', authenticateToken, ClassController.getAll);
router.get('/:id', authenticateToken, idParamValidator, ClassController.getOne);
router.post('/', authenticateToken, isCMOrAdmin, classValidator, ClassController.create);
router.put('/:id', authenticateToken, isCMOrAdmin, idParamValidator, ClassController.update);
router.delete('/:id', authenticateToken, isCMOrAdmin, idParamValidator, ClassController.delete);

export default router;
