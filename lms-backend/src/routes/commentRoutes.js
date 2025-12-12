import express from 'express';
import CommentController from '../controllers/commentController.js';
import { authenticateToken, isTeacherOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/class/:classId', authenticateToken, CommentController.getByClass);
router.get('/student/:studentId', authenticateToken, CommentController.getByStudent);
router.post('/', authenticateToken, isTeacherOrAdmin, CommentController.save);
router.put('/:classId/:studentId', authenticateToken, isTeacherOrAdmin, CommentController.update);
router.delete('/:classId/:studentId', authenticateToken, isTeacherOrAdmin, CommentController.delete);

export default router;
