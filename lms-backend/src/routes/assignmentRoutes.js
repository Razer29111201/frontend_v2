// =====================================================
// UPDATED ROUTES - Optimized Version
// =====================================================

// ========== assignmentRoutes.js ==========
import express from 'express';
import AssignmentController from '../controllers/assignmentController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/', AssignmentController.getAll);
router.get('/class/:classId', AssignmentController.getByClass);
router.get('/class/:classId/statistics', AssignmentController.getStatistics);
router.get('/:id', AssignmentController.getOne);

// POST routes (teacher/admin only)
router.post('/',
    authorize(['teacher', 'admin']),
    AssignmentController.create
);

// File attachment routes
router.post('/:assignmentId/attach-file',
    authorize(['teacher', 'admin']),
    AssignmentController.attachFile
);

router.delete('/:assignmentId/files/:fileId',
    authorize(['teacher', 'admin']),
    AssignmentController.detachFile
);

// PUT routes (teacher/admin only)
router.put('/:id',
    authorize(['teacher', 'admin']),
    AssignmentController.update
);

// DELETE routes (teacher/admin only)
router.delete('/:id',
    authorize(['teacher', 'admin']),
    AssignmentController.delete
);

export default router;


// ========== submissionRoutes.js ==========


// ========== fileRoutes.js - ADD THESE ROUTES ==========
