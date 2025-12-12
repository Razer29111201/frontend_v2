import express from 'express';
import AuthController from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { loginValidator, registerValidator, changePasswordValidator } from '../utils/validators.js';

const router = express.Router();

router.post('/login', loginLimiter, loginValidator, AuthController.login);
router.post('/register', registerValidator, AuthController.register);
router.post('/change-password', authenticateToken, changePasswordValidator, AuthController.changePassword);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);
router.get('/me', authenticateToken, AuthController.getCurrentUser);
router.put('/profile', authenticateToken, AuthController.updateProfile);

export default router;
