// src/routes/cmRoutes.js
import express from 'express';
import CMController from '../controllers/cmController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/', CMController.getAll);
router.get('/:id', CMController.getOne);
router.get('/:id/classes', CMController.getClasses);
router.get('/:id/statistics', CMController.getStatistics);

// POST routes (admin only)
router.post('/',
    authorize(['admin']),
    CMController.create
);

// PUT routes (admin only)
router.put('/:id',
    authorize(['admin']),
    CMController.update
);

// DELETE routes (admin only)
router.delete('/:id',
    authorize(['admin']),
    CMController.delete
);

export default router;