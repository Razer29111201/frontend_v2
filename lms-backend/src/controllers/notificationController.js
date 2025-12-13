// src/controllers/notificationController.js
import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';

class NotificationController {
    // Get all notifications for current user
    static async getAll(req, res) {
        try {
            const { userId } = req.query;
            const targetUserId = userId || req.user.id;
            
            const notifications = await query(
                `SELECT * FROM notifications 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT 50`,
                [targetUserId]
            );
            
            res.json({ 
                success: true, 
                data: notifications.map(n => ({
                    id: n.id,
                    userId: n.user_id,
                    type: n.type,
                    title: n.title,
                    message: n.message,
                    data: n.data ? JSON.parse(n.data) : null,
                    isRead: n.is_read === 1,
                    sentEmail: n.sent_email === 1,
                    createdAt: n.created_at
                }))
            });
        } catch (error) {
            logger.error('Get notifications error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get unread count
    static async getUnreadCount(req, res) {
        try {
            const [result] = await query(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
                [req.user.id]
            );
            
            res.json({ 
                success: true, 
                data: { count: result[0]?.count || 0 }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Create notification
    static async create(req, res) {
        try {
            const { userId, type, title, message, data, sendEmail } = req.body;
            
            const result = await query(
                `INSERT INTO notifications (user_id, type, title, message, data, sent_email)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [userId, type || 'system', title, message, data ? JSON.stringify(data) : null, sendEmail || false]
            );

            res.status(201).json({ 
                success: true, 
                data: { 
                    id: result.insertId, 
                    userId, 
                    type, 
                    title, 
                    message 
                } 
            });
        } catch (error) {
            logger.error('Create notification error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Mark as read
    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            
            const result = await query(
                'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
                [id, req.user.id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy thông báo' });
            }
            
            res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Mark all as read
    static async markAllAsRead(req, res) {
        try {
            await query(
                'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
                [req.user.id]
            );
            
            res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Delete notification
    static async delete(req, res) {
        try {
            const result = await query(
                'DELETE FROM notifications WHERE id = ? AND user_id = ?',
                [req.params.id, req.user.id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy thông báo' });
            }
            
            res.json({ success: true, message: 'Đã xóa thông báo' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Delete all notifications
    static async deleteAll(req, res) {
        try {
            await query('DELETE FROM notifications WHERE user_id = ?', [req.user.id]);
            res.json({ success: true, message: 'Đã xóa tất cả thông báo' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Bulk create notifications (for announcements)
    static async bulkCreate(req, res) {
        try {
            const { userIds, type, title, message, data, sendEmail } = req.body;
            
            if (!Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({ success: false, error: 'userIds phải là mảng không rỗng' });
            }

            await transaction(async (conn) => {
                for (const userId of userIds) {
                    await conn.query(
                        `INSERT INTO notifications (user_id, type, title, message, data, sent_email)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [userId, type || 'announcement', title, message, data ? JSON.stringify(data) : null, sendEmail || false]
                    );
                }
            });

            res.status(201).json({ 
                success: true, 
                message: `Đã tạo ${userIds.length} thông báo`,
                data: { count: userIds.length }
            });
        } catch (error) {
            logger.error('Bulk create notifications error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default NotificationController;
