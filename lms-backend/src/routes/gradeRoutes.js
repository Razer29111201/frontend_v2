import express from 'express';
import GradeController from '../controllers/gradeController.js';
import { authenticateToken, isTeacherOrAdmin } from '../middleware/auth.js';
import { gradeValidator } from '../utils/validators.js';

const router = express.Router();

router.get('/class/:classId', authenticateToken, GradeController.getByClass);
router.get('/class/:classId/average', authenticateToken, GradeController.getClassAverage);
router.get('/student/:studentId', authenticateToken, GradeController.getByStudent);
router.post('/', authenticateToken, isTeacherOrAdmin, gradeValidator, GradeController.create);
router.post('/bulk', authenticateToken, isTeacherOrAdmin, GradeController.bulkCreate);
router.put('/:id', authenticateToken, isTeacherOrAdmin, GradeController.update);
router.delete('/:id', authenticateToken, isTeacherOrAdmin, GradeController.delete);

export default router;
