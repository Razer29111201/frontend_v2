// src/routes/fileRoutes.js
import express from 'express';
import FileController from '../controllers/fileController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/', FileController.getAll);
router.get('/stats', FileController.getStats);
router.get('/class/:classId', FileController.getByClass);
router.get('/:id', FileController.getOne);

// File selection for assignments/submissions
router.get('/class/:classId/available-for-assignment',
    FileController.getAvailableForAssignment
);

router.get('/class/:classId/student/:studentId/available-for-submission',
    FileController.getAvailableForSubmission
);

// File usage info
router.get('/:id/usage', FileController.getUsageInfo);

// POST routes
router.post('/', FileController.upload);

// PUT/PATCH routes
router.put('/:id',
    authorize(['teacher', 'admin']),
    FileController.update
);

router.patch('/:id/category',
    authorize(['teacher', 'admin']),
    FileController.updateCategory
);

// DELETE routes
router.delete('/:id',
    authorize(['teacher', 'admin']),
    FileController.delete
);

export default router;