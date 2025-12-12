import express from 'express';
import StudentController from '../controllers/studentController.js';
import { authenticateToken, isCMOrAdmin } from '../middleware/auth.js';
import { studentValidator, idParamValidator } from '../utils/validators.js';

const router = express.Router();

router.get('/', authenticateToken, StudentController.getAll);
router.get('/:id', authenticateToken, idParamValidator, StudentController.getOne);
router.post('/', authenticateToken, isCMOrAdmin, studentValidator, StudentController.create);
router.put('/:id', authenticateToken, isCMOrAdmin, idParamValidator, StudentController.update);
router.delete('/:id', authenticateToken, isCMOrAdmin, idParamValidator, StudentController.delete);

export default router;
