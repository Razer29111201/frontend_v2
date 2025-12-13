import express from 'express';
import HolidayController from '../controllers/holidayController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, HolidayController.getAll);
router.get('/upcoming', authenticateToken, HolidayController.getUpcoming);
router.get('/range', authenticateToken, HolidayController.getByRange);
router.get('/:id', authenticateToken, HolidayController.getOne);
router.post('/', authenticateToken, isAdmin, HolidayController.create);
router.post('/bulk', authenticateToken, isAdmin, HolidayController.bulkCreate);
router.put('/:id', authenticateToken, isAdmin, HolidayController.update);
router.delete('/:id', authenticateToken, isAdmin, HolidayController.delete);

export default router;
