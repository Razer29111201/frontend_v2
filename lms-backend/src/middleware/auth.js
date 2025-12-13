import jwt from 'jsonwebtoken';
import { ROLES } from '../config/constants.js';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Vui lòng đăng nhập để tiếp tục'
        });
    }

    const SECRET = process.env.JWT_SECRET;

    if (!SECRET) {
        return res.status(500).json({
            success: false,
            error: 'Lỗi cấu hình server'
        });
    }

    jwt.verify(token, SECRET, (err, user) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
                });
            }
            return res.status(403).json({
                success: false,
                error: 'Token không hợp lệ'
            });
        }
        req.user = user;
        next();
    });
};

// Authorize specific roles
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Chưa xác thực'
            });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: 'Bạn không có quyền truy cập chức năng này'
            });
        }

        next();
    };
};

// Check if user is admin
export const isAdmin = authorize(ROLES.ADMIN);

// Check if user is teacher or admin
export const isTeacherOrAdmin = authorize(ROLES.ADMIN, ROLES.TEACHER);

// Check if user is CM or admin
export const isCMOrAdmin = authorize(ROLES.ADMIN, ROLES.CM);

// Check if user can access class (teacher of class or admin or CM of class)
export const canAccessClass = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Chưa xác thực'
        });
    }

    const { role, teacherId, cmId } = req.user;
    const classId = req.params.id || req.params.classId || req.body.classId;

    // Admin can access all
    if (role === ROLES.ADMIN) {
        return next();
    }

    // For teachers and CMs, need to check if they're assigned to this class
    // This would require a database lookup - simplified for now
    // In production, you'd check against the classes table

    next();
};

export default {
    authenticateToken,
    authorize,
    isAdmin,
    isTeacherOrAdmin,
    isCMOrAdmin,
    canAccessClass
};