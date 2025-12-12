// src/utils/validators.js
import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Dữ liệu không hợp lệ',
            details: errors.array().map(e => ({
                field: e.path,
                message: e.msg
            }))
        });
    }
    next();
};

// Auth validators
export const loginValidator = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail(),
    body('password')
        .notEmpty()
        .withMessage('Mật khẩu không được để trống'),
    validate
];

export const registerValidator = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên không được để trống')
        .isLength({ max: 255 })
        .withMessage('Tên không được quá 255 ký tự'),
    body('role')
        .optional()
        .isIn(['admin', 'teacher', 'cm'])
        .withMessage('Role không hợp lệ'),
    validate
];

export const changePasswordValidator = [
    body('oldPassword')
        .notEmpty()
        .withMessage('Mật khẩu cũ không được để trống'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
    validate
];

// Class validators
export const classValidator = [
    body('code')
        .trim()
        .notEmpty()
        .withMessage('Mã lớp không được để trống')
        .isLength({ max: 50 })
        .withMessage('Mã lớp không được quá 50 ký tự'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên lớp không được để trống')
        .isLength({ max: 255 })
        .withMessage('Tên lớp không được quá 255 ký tự'),
    body('startDate')
        .notEmpty()
        .withMessage('Ngày bắt đầu không được để trống')
        .isISO8601()
        .withMessage('Ngày bắt đầu không hợp lệ'),
    body('weekDay')
        .isInt({ min: 0, max: 6 })
        .withMessage('Thứ trong tuần phải từ 0-6'),
    body('timeSlot')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Khung giờ không được quá 50 ký tự'),
    validate
];

// Student validators
export const studentValidator = [
    body('code')
        .trim()
        .notEmpty()
        .withMessage('Mã học sinh không được để trống')
        .isLength({ max: 50 })
        .withMessage('Mã học sinh không được quá 50 ký tự'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên học sinh không được để trống')
        .isLength({ max: 255 })
        .withMessage('Tên học sinh không được quá 255 ký tự'),
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Email không hợp lệ'),
    body('phone')
        .optional()
        .trim()
        .matches(/^[0-9+\-\s()]*$/)
        .withMessage('Số điện thoại không hợp lệ'),
    validate
];

// Teacher validators
export const teacherValidator = [
    body('code')
        .trim()
        .notEmpty()
        .withMessage('Mã giáo viên không được để trống')
        .isLength({ max: 50 })
        .withMessage('Mã giáo viên không được quá 50 ký tự'),
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên giáo viên không được để trống')
        .isLength({ max: 255 })
        .withMessage('Tên giáo viên không được quá 255 ký tự'),
    validate
];

// Attendance validators
export const attendanceValidator = [
    body('classId')
        .notEmpty()
        .withMessage('ID lớp không được để trống')
        .isInt()
        .withMessage('ID lớp phải là số'),
    body('session')
        .notEmpty()
        .withMessage('Số buổi không được để trống')
        .isInt({ min: 1 })
        .withMessage('Số buổi phải lớn hơn 0'),
    body('records')
        .isArray()
        .withMessage('Dữ liệu điểm danh phải là mảng'),
    body('records.*.studentId')
        .isInt()
        .withMessage('ID học sinh phải là số'),
    body('records.*.status')
        .isIn(['on-time', 'late', 'excused', 'absent'])
        .withMessage('Trạng thái điểm danh không hợp lệ'),
    validate
];

// Grade validators
export const gradeValidator = [
    body('classId')
        .isInt()
        .withMessage('ID lớp phải là số'),
    body('studentId')
        .isInt()
        .withMessage('ID học sinh phải là số'),
    body('assignmentName')
        .trim()
        .notEmpty()
        .withMessage('Tên bài tập không được để trống'),
    body('score')
        .isFloat({ min: 0 })
        .withMessage('Điểm phải là số không âm'),
    body('maxScore')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Điểm tối đa phải là số không âm'),
    validate
];

// ID param validator
export const idParamValidator = [
    param('id')
        .isInt()
        .withMessage('ID không hợp lệ'),
    validate
];

// Pagination validator
export const paginationValidator = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Số trang phải lớn hơn 0'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Giới hạn phải từ 1-100'),
    validate
];

export default {
    validate,
    loginValidator,
    registerValidator,
    changePasswordValidator,
    classValidator,
    studentValidator,
    teacherValidator,
    attendanceValidator,
    gradeValidator,
    idParamValidator,
    paginationValidator
};
