// src/controllers/activityLogController.js
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

class ActivityLogController {
    // Get all activity logs (admin only)
    static async getAll(req, res) {
        try {
            const { userId, action, entityType, startDate, endDate, limit } = req.query;
            
            let sql = `
                SELECT al.*, u.name as user_name, u.email as user_email
                FROM activity_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE 1=1
            `;
            const params = [];

            if (userId) {
                sql += ' AND al.user_id = ?';
                params.push(userId);
            }

            if (action) {
                sql += ' AND al.action = ?';
                params.push(action);
            }

            if (entityType) {
                sql += ' AND al.entity_type = ?';
                params.push(entityType);
            }

            if (startDate) {
                sql += ' AND al.created_at >= ?';
                params.push(startDate);
            }

            if (endDate) {
                sql += ' AND al.created_at <= ?';
                params.push(endDate);
            }

            sql += ' ORDER BY al.created_at DESC';

            if (limit) {
                sql += ' LIMIT ?';
                params.push(parseInt(limit));
            } else {
                sql += ' LIMIT 100';
            }

            const logs = await query(sql, params);

            res.json({ 
                success: true, 
                data: logs.map(log => ({
                    id: log.id,
                    userId: log.user_id,
                    userName: log.user_name,
                    userEmail: log.user_email,
                    action: log.action,
                    entityType: log.entity_type,
                    entityId: log.entity_id,
                    oldData: log.old_data ? JSON.parse(log.old_data) : null,
                    newData: log.new_data ? JSON.parse(log.new_data) : null,
                    ipAddress: log.ip_address,
                    userAgent: log.user_agent,
                    createdAt: log.created_at
                }))
            });
        } catch (error) {
            logger.error('Get activity logs error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get logs for current user
    static async getMyLogs(req, res) {
        try {
            const { limit } = req.query;
            
            const logs = await query(
                `SELECT * FROM activity_logs 
                 WHERE user_id = ? 
                 ORDER BY created_at DESC 
                 LIMIT ?`,
                [req.user.id, parseInt(limit) || 50]
            );

            res.json({ 
                success: true, 
                data: logs.map(log => ({
                    id: log.id,
                    action: log.action,
                    entityType: log.entity_type,
                    entityId: log.entity_id,
                    newData: log.new_data ? JSON.parse(log.new_data) : null,
                    ipAddress: log.ip_address,
                    createdAt: log.created_at
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get statistics
    static async getStats(req, res) {
        try {
            const { startDate, endDate } = req.query;
            
            let dateFilter = '';
            const params = [];
            
            if (startDate && endDate) {
                dateFilter = ' WHERE created_at >= ? AND created_at <= ?';
                params.push(startDate, endDate);
            } else if (startDate) {
                dateFilter = ' WHERE created_at >= ?';
                params.push(startDate);
            } else if (endDate) {
                dateFilter = ' WHERE created_at <= ?';
                params.push(endDate);
            }

            // Activity by action
            const actionStats = await query(
                `SELECT action, COUNT(*) as count 
                 FROM activity_logs${dateFilter} 
                 GROUP BY action 
                 ORDER BY count DESC`,
                params
            );

            // Activity by entity type
            const entityStats = await query(
                `SELECT entity_type, COUNT(*) as count 
                 FROM activity_logs${dateFilter} 
                 GROUP BY entity_type 
                 ORDER BY count DESC`,
                params
            );

            // Most active users
            const userStats = await query(
                `SELECT al.user_id, u.name, u.email, COUNT(*) as activity_count 
                 FROM activity_logs al
                 LEFT JOIN users u ON al.user_id = u.id${dateFilter}
                 GROUP BY al.user_id 
                 ORDER BY activity_count DESC 
                 LIMIT 10`,
                params
            );

            // Total logs
            const [totalResult] = await query(
                `SELECT COUNT(*) as total FROM activity_logs${dateFilter}`,
                params
            );

            res.json({ 
                success: true, 
                data: {
                    total: totalResult[0]?.total || 0,
                    byAction: actionStats,
                    byEntityType: entityStats,
                    topUsers: userStats.map(u => ({
                        userId: u.user_id,
                        name: u.name,
                        email: u.email,
                        activityCount: u.activity_count
                    }))
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get logs by entity
    static async getByEntity(req, res) {
        try {
            const { entityType, entityId } = req.params;
            
            const logs = await query(
                `SELECT al.*, u.name as user_name, u.email as user_email
                 FROM activity_logs al
                 LEFT JOIN users u ON al.user_id = u.id
                 WHERE al.entity_type = ? AND al.entity_id = ?
                 ORDER BY al.created_at DESC`,
                [entityType, entityId]
            );

            res.json({ 
                success: true, 
                data: logs.map(log => ({
                    id: log.id,
                    userId: log.user_id,
                    userName: log.user_name,
                    userEmail: log.user_email,
                    action: log.action,
                    oldData: log.old_data ? JSON.parse(log.old_data) : null,
                    newData: log.new_data ? JSON.parse(log.new_data) : null,
                    ipAddress: log.ip_address,
                    createdAt: log.created_at
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Delete old logs (cleanup)
    static async cleanup(req, res) {
        try {
            const { days } = req.query;
            const daysToKeep = parseInt(days) || 90;
            
            const result = await query(
                'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
                [daysToKeep]
            );

            res.json({ 
                success: true, 
                message: `Đã xóa ${result.affectedRows} log cũ hơn ${daysToKeep} ngày`,
                data: { deletedCount: result.affectedRows }
            });
        } catch (error) {
            logger.error('Cleanup logs error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default ActivityLogController;
