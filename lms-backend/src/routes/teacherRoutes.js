import express from 'express';
import TeacherController from '../controllers/teacherController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { teacherValidator, idParamValidator } from '../utils/validators.js';

const router = express.Router();

router.get('/', authenticateToken, TeacherController.getAll);
router.get('/:id', authenticateToken, idParamValidator, TeacherController.getOne);
router.post('/', authenticateToken, isAdmin, teacherValidator, TeacherController.create);
router.put('/:id', authenticateToken, isAdmin, idParamValidator, TeacherController.update);
router.delete('/:id', authenticateToken, isAdmin, idParamValidator, TeacherController.delete);

export default router;
