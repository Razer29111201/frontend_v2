import express from 'express';
import ActivityLogController from '../controllers/activityLogController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, isAdmin, ActivityLogController.getAll);
router.get('/my', authenticateToken, ActivityLogController.getMyLogs);
router.get('/stats', authenticateToken, isAdmin, ActivityLogController.getStats);
router.get('/entity/:entityType/:entityId', authenticateToken, isAdmin, ActivityLogController.getByEntity);
router.delete('/cleanup', authenticateToken, isAdmin, ActivityLogController.cleanup);

export default router;
