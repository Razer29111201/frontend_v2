import express from 'express';
import NotificationController from '../controllers/notificationController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, NotificationController.getAll);
router.get('/unread-count', authenticateToken, NotificationController.getUnreadCount);
router.post('/', authenticateToken, isAdmin, NotificationController.create);
router.post('/bulk', authenticateToken, isAdmin, NotificationController.bulkCreate);
router.put('/:id/read', authenticateToken, NotificationController.markAsRead);
router.put('/read-all', authenticateToken, NotificationController.markAllAsRead);
router.delete('/:id', authenticateToken, NotificationController.delete);
router.delete('/', authenticateToken, NotificationController.deleteAll);

export default router;
