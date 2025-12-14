import express from 'express';
import SubmissionController from '../controllers/submissionController.js';
import { authenticateToken, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET routes
router.get('/assignment/:assignmentId', SubmissionController.getByAssignment);
router.get('/assignment/:assignmentId/statistics', SubmissionController.getStatistics);
router.get('/student/:studentId', SubmissionController.getByStudent);
router.get('/:id', SubmissionController.getOne);

// POST routes
router.post('/submit', SubmissionController.submit);

router.post('/grade/:id',
    authorize(['teacher', 'admin']),
    SubmissionController.grade
);

router.post('/bulk-grade',
    authorize(['teacher', 'admin']),
    SubmissionController.bulkGrade
);

// File attachment routes
router.post('/:submissionId/attach-file',
    SubmissionController.attachFile
);

router.delete('/:submissionId/files/:fileId',
    SubmissionController.detachFile
);

// DELETE routes (teacher/admin only)
router.delete('/:id',
    authorize(['teacher', 'admin']),
    SubmissionController.delete
);

export default router;
