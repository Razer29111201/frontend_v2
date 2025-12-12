import express from 'express';
import ExportController from '../controllers/exportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/classes', authenticateToken, ExportController.exportClasses);
router.get('/students', authenticateToken, ExportController.exportStudents);
router.get('/attendance/:classId', authenticateToken, ExportController.exportAttendance);
router.get('/grades/:classId', authenticateToken, ExportController.exportGrades);

export default router;
