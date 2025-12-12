// src/middleware/activityLogger.js
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

export const logActivity = (action, entityType) => {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);
        
        res.json = async (data) => {
            // Log activity after successful response
            if (data.success !== false && req.user) {
                try {
                    const entityId = req.params.id || data.data?.id || null;
                    
                    await query(
                        `INSERT INTO activity_logs 
                        (user_id, action, entity_type, entity_id, new_data, ip_address, user_agent)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            req.user.id,
                            action,
                            entityType,
                            entityId,
                            JSON.stringify(req.body || {}),
                            req.ip,
                            req.get('User-Agent')
                        ]
                    );
                } catch (error) {
                    logger.error('Failed to log activity:', error);
                }
            }
            
            return originalJson(data);
        };
        
        next();
    };
};

// Get activity logs
export const getActivityLogs = async (filters = {}) => {
    let sql = `
        SELECT al.*, u.name as user_name, u.email as user_email
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE 1=1
    `;
    const params = [];

    if (filters.userId) {
        sql += ' AND al.user_id = ?';
        params.push(filters.userId);
    }

    if (filters.action) {
        sql += ' AND al.action = ?';
        params.push(filters.action);
    }

    if (filters.entityType) {
        sql += ' AND al.entity_type = ?';
        params.push(filters.entityType);
    }

    if (filters.startDate) {
        sql += ' AND al.created_at >= ?';
        params.push(filters.startDate);
    }

    if (filters.endDate) {
        sql += ' AND al.created_at <= ?';
        params.push(filters.endDate);
    }

    sql += ' ORDER BY al.created_at DESC';

    if (filters.limit) {
        sql += ' LIMIT ?';
        params.push(parseInt(filters.limit));
    }

    return await query(sql, params);
};

export default { logActivity, getActivityLogs };
