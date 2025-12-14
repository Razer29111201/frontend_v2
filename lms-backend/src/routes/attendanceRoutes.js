// src/routes/attendanceRoutes.js
import express from 'express';
import AttendanceController from '../controllers/attendanceController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/class/:classId', AttendanceController.getByClass);
router.get('/class/:classId/stats', AttendanceController.getStatsByClass);
router.get('/class/:classId/dates', AttendanceController.getDates);
router.get('/class/:classId/summary', AttendanceController.getSummaryByDate);
router.get('/student/:studentId', AttendanceController.getByStudent);
router.get('/student/:studentId/stats', AttendanceController.getStatsByStudent);

// POST routes (teacher/admin only)
router.post('/mark',
    authorize(['teacher', 'admin']),
    AttendanceController.mark
);

// PUT routes (teacher/admin only)
router.put('/:id',
    authorize(['teacher', 'admin']),
    AttendanceController.update
);

// DELETE routes (teacher/admin only)
router.delete('/:id',
    authorize(['teacher', 'admin']),
    AttendanceController.delete
);

export default router;