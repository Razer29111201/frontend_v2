// src/controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { ROLES } from '../config/constants.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

class AuthController {
    static async login(req, res) {
        try {
            const { email, password } = req.body;

            const users = await query(
                'SELECT id, email, password, name, role, teacher_id, cm_id, avatar, active FROM users WHERE email = ?',
                [email]
            );

            if (users.length === 0) {
                return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
            }

            const user = users[0];

            if (!user.active) {
                return res.status(401).json({ success: false, error: 'Tài khoản đã bị vô hiệu hóa' });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: parseInt(user.role), teacherId: user.teacher_id, cmId: user.cm_id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
            );

            logger.info(`User logged in: ${user.email}`);

            res.json({
                success: true,
                data: {
                    token,
                    user: { id: user.id, email: user.email, name: user.name, role: parseInt(user.role), teacherId: user.teacher_id, cmId: user.cm_id, avatar: user.avatar }
                }
            });
        } catch (error) {
            logger.error('Login error:', error);
            res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi đăng nhập' });
        }
    }

    static async register(req, res) {
        try {
            const { email, password, name, role, linkId } = req.body;

            const existing = await query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(409).json({ success: false, error: 'Email đã được sử dụng' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const roleNum = role === 'admin' ? ROLES.ADMIN : role === 'teacher' ? ROLES.TEACHER : ROLES.CM;
            const teacherId = role === 'teacher' && linkId ? parseInt(linkId) : null;
            const cmId = role === 'cm' && linkId ? parseInt(linkId) : null;

            const result = await query(
                'INSERT INTO users (email, password, name, role, teacher_id, cm_id) VALUES (?, ?, ?, ?, ?, ?)',
                [email, hashedPassword, name, roleNum, teacherId, cmId]
            );

            try { await sendWelcomeEmail(email, name, roleNum); } catch (e) { logger.warn('Email failed:', e); }

            res.status(201).json({
                success: true,
                data: { user: { id: result.insertId, email, name, role: roleNum, teacherId, cmId } }
            });
        } catch (error) {
            logger.error('Register error:', error);
            res.status(500).json({ success: false, error: 'Có lỗi xảy ra khi đăng ký' });
        }
    }

    static async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const users = await query('SELECT password FROM users WHERE id = ?', [req.user.id]);
            
            if (users.length === 0) return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' });

            const isValid = await bcrypt.compare(oldPassword, users[0].password);
            if (!isValid) return res.status(401).json({ success: false, error: 'Mật khẩu cũ không đúng' });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

            res.json({ success: true, message: 'Đổi mật khẩu thành công' });
        } catch (error) {
            logger.error('Change password error:', error);
            res.status(500).json({ success: false, error: 'Có lỗi xảy ra' });
        }
    }

    static async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const users = await query('SELECT id, name, email FROM users WHERE email = ?', [email]);
            
            if (users.length === 0) {
                return res.json({ success: true, message: 'Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu' });
            }

            const resetToken = uuidv4();
            await query('UPDATE users SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?', [resetToken, users[0].id]);
            await sendPasswordResetEmail(users[0].email, users[0].name, resetToken);

            res.json({ success: true, message: 'Đã gửi email đặt lại mật khẩu' });
        } catch (error) {
            logger.error('Forgot password error:', error);
            res.status(500).json({ success: false, error: 'Có lỗi xảy ra' });
        }
    }

    static async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            const users = await query('SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()', [token]);
            
            if (users.length === 0) return res.status(400).json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn' });

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await query('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashedPassword, users[0].id]);

            res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
        } catch (error) {
            logger.error('Reset password error:', error);
            res.status(500).json({ success: false, error: 'Có lỗi xảy ra' });
        }
    }

    static async getCurrentUser(req, res) {
        try {
            const users = await query('SELECT id, email, name, role, teacher_id, cm_id, avatar FROM users WHERE id = ?', [req.user.id]);
            if (users.length === 0) return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' });

            const user = users[0];
            res.json({
                success: true,
                data: { id: user.id, email: user.email, name: user.name, role: parseInt(user.role), teacherId: user.teacher_id, cmId: user.cm_id, avatar: user.avatar }
            });
        } catch (error) {
            logger.error('Get current user error:', error);
            res.status(500).json({ success: false, error: 'Có lỗi xảy ra' });
        }
    }

    static async updateProfile(req, res) {
        try {
            const { name, avatar } = req.body;
            await query('UPDATE users SET name = ?, avatar = ? WHERE id = ?', [name, avatar, req.user.id]);
            res.json({ success: true, message: 'Cập nhật thông tin thành công' });
        } catch (error) {
            logger.error('Update profile error:', error);
            res.status(500).json({ success: false, error: 'Có lỗi xảy ra' });
        }
    }
}

export default AuthController;
