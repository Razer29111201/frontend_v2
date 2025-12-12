import express from 'express';
import DashboardController from '../controllers/dashboardController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, DashboardController.getStats);
router.get('/attendance-report', authenticateToken, DashboardController.getAttendanceReport);
router.get('/top-absent', authenticateToken, DashboardController.getTopAbsentStudents);

export default router;
