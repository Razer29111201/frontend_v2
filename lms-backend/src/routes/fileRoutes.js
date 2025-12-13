import express from 'express';
import FileController from '../controllers/fileController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/', authenticateToken, FileController.getAll);
router.get('/stats', authenticateToken, FileController.getStorageStats);
router.get('/class/:classId', authenticateToken, FileController.getByClass);
router.get('/:id', authenticateToken, FileController.getOne);
router.post('/upload', authenticateToken, uploadLimiter, upload.single('file'), FileController.upload);
router.put('/:id', authenticateToken, FileController.update);
router.delete('/:id', authenticateToken, FileController.delete);

export default router;
