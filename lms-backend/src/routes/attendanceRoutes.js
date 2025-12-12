import express from 'express';
import AttendanceController from '../controllers/attendanceController.js';
import { authenticateToken, isTeacherOrAdmin } from '../middleware/auth.js';
import { attendanceValidator } from '../utils/validators.js';

const router = express.Router();

router.get('/class/:classId', authenticateToken, AttendanceController.getByClass);
router.get('/class/:classId/stats', authenticateToken, AttendanceController.getStatsByClass);
router.get('/student/:studentId/stats', authenticateToken, AttendanceController.getStatsByStudent);
router.get('/:classId/:session', authenticateToken, AttendanceController.getByClassAndSession);
router.post('/', authenticateToken, isTeacherOrAdmin, attendanceValidator, AttendanceController.save);
router.delete('/:classId/:session', authenticateToken, isTeacherOrAdmin, AttendanceController.delete);

export default router;
