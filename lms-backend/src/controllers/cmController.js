// src/controllers/cmController.js
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

class CMController {
    // Get all CMs (Class Managers)
    static async getAll(req, res) {
        try {
            const cms = await query(`
                SELECT 
                    id,
                    username,
                    email,
                    name,
                    phone,
                    avatar,
                    is_active,
                    created_at
                FROM users
                WHERE role = 'cm'
                ORDER BY name
            `);

            res.json({
                success: true,
                data: cms
            });
        } catch (error) {
            logger.error('Get CMs error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get CM by ID
    static async getOne(req, res) {
        try {
            const [cm] = await query(`
                SELECT 
                    id,
                    username,
                    email,
                    name,
                    phone,
                    avatar,
                    is_active,
                    created_at
                FROM users
                WHERE id = ? AND role = 'cm'
            `, [req.params.id]);

            if (!cm) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy CM'
                });
            }

            res.json({
                success: true,
                data: cm
            });
        } catch (error) {
            logger.error('Get CM error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get classes managed by CM
    static async getClasses(req, res) {
        try {
            const { id } = req.params;

            const classes = await query(`
                SELECT 
                    c.*,
                    u.name as teacher_name,
                    COUNT(DISTINCT s.id) as total_students
                FROM classes c
                LEFT JOIN users u ON c.teacher_id = u.id
                LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
                WHERE c.cm_id = ?
                GROUP BY c.id
                ORDER BY c.status, c.start_date DESC
            `, [id]);

            res.json({
                success: true,
                data: classes
            });
        } catch (error) {
            logger.error('Get CM classes error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Create CM
    static async create(req, res) {
        try {
            const { username, password, email, name, phone } = req.body;

            // Check if username or email already exists
            const [existing] = await query(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );

            if (existing) {
                return res.status(400).json({
                    success: false,
                    error: 'Username hoặc email đã tồn tại'
                });
            }

            // Hash password
            const bcrypt = require('bcrypt');
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            const result = await query(
                `INSERT INTO users (username, password, email, name, phone, role)
                 VALUES (?, ?, ?, ?, ?, 'cm')`,
                [username, hashedPassword, email, name, phone]
            );

            res.status(201).json({
                success: true,
                message: 'Tạo CM thành công',
                data: { id: result.insertId, username, email, name }
            });
        } catch (error) {
            logger.error('Create CM error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Update CM
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { email, name, phone, is_active } = req.body;

            await query(
                `UPDATE users 
                 SET email = ?, name = ?, phone = ?, is_active = ?
                 WHERE id = ? AND role = 'cm'`,
                [email, name, phone, is_active, id]
            );

            res.json({
                success: true,
                message: 'Cập nhật CM thành công'
            });
        } catch (error) {
            logger.error('Update CM error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Delete CM
    static async delete(req, res) {
        try {
            const result = await query(
                'DELETE FROM users WHERE id = ? AND role = "cm"',
                [req.params.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy CM'
                });
            }

            res.json({
                success: true,
                message: 'Đã xóa CM'
            });
        } catch (error) {
            logger.error('Delete CM error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Get CM statistics
    static async getStatistics(req, res) {
        try {
            const { id } = req.params;

            const [stats] = await query(`
                SELECT 
                    COUNT(DISTINCT c.id) as total_classes,
                    COUNT(DISTINCT s.id) as total_students,
                    COUNT(DISTINCT CASE WHEN c.status = 'ongoing' THEN c.id END) as ongoing_classes,
                    COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as completed_classes
                FROM classes c
                LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
                WHERE c.cm_id = ?
            `, [id]);

            res.json({
                success: true,
                data: stats[0] || {
                    total_classes: 0,
                    total_students: 0,
                    ongoing_classes: 0,
                    completed_classes: 0
                }
            });
        } catch (error) {
            logger.error('Get CM statistics error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

export default CMController;