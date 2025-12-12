import express from 'express';
import SessionController from '../controllers/sessionController.js';
import { authenticateToken, isCMOrAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/:classId', authenticateToken, SessionController.getByClass);
router.put('/:classId', authenticateToken, isCMOrAdmin, SessionController.update);
router.put('/:classId/:sessionNumber', authenticateToken, isCMOrAdmin, SessionController.updateOne);

export default router;
