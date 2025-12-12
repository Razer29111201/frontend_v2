// src/middleware/errorHandler.js
import logger from '../utils/logger.js';

export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const notFoundHandler = (req, res, next) => {
    const error = new AppError(`Không tìm thấy đường dẫn ${req.originalUrl}`, 404);
    next(error);
};

export const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;

    // Log error
    logger.error(err.message, {
        statusCode: err.statusCode,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
            statusCode: err.statusCode,
            stack: err.stack
        });
    } else {
        // Production mode
        if (err.isOperational) {
            res.status(err.statusCode).json({
                success: false,
                error: err.message
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Đã xảy ra lỗi hệ thống'
            });
        }
    }
};

export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Handle specific database errors
export const handleDatabaseError = (error) => {
    if (error.code === 'ER_DUP_ENTRY') {
        return new AppError('Dữ liệu đã tồn tại trong hệ thống', 409);
    }

    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return new AppError('Dữ liệu tham chiếu không tồn tại', 400);
    }

    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return new AppError('Không thể xóa vì dữ liệu đang được sử dụng', 400);
    }

    if (error.code === 'ER_DATA_TOO_LONG') {
        return new AppError('Dữ liệu quá dài', 400);
    }

    if (error.code === 'ER_BAD_NULL_ERROR') {
        return new AppError('Thiếu dữ liệu bắt buộc', 400);
    }

    return error;
};

export default {
    AppError,
    notFoundHandler,
    errorHandler,
    asyncHandler,
    handleDatabaseError
};
