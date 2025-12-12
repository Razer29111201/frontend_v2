// src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// General rate limiter
export const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        error: 'Quá nhiều yêu cầu, vui lòng thử lại sau'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Login rate limiter (stricter)
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 1000,
    message: {
        success: false,
        error: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

// API rate limiter (for sensitive operations)
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: {
        success: false,
        error: 'Quá nhiều yêu cầu API, vui lòng thử lại sau'
    }
});

// Upload rate limiter
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: {
        success: false,
        error: 'Đã đạt giới hạn upload, vui lòng thử lại sau'
    }
});

export default {
    generalLimiter,
    loginLimiter,
    apiLimiter,
    uploadLimiter
};
