// src/config/constants.js

export const ROLES = {
    ADMIN: 0,
    TEACHER: 1,
    CM: 2
};

export const ROLE_NAMES = {
    0: 'admin',
    1: 'teacher',
    2: 'cm'
};

export const ATTENDANCE_STATUS = {
    ON_TIME: 'on-time',
    LATE: 'late',
    EXCUSED: 'excused',
    ABSENT: 'absent'
};

export const SESSION_STATUS = {
    SCHEDULED: 'scheduled',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    RESCHEDULED: 'rescheduled'
};

export const CLASS_STATUS = {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

export const GRADE_TYPES = {
    HOMEWORK: 'homework',
    QUIZ: 'quiz',
    MIDTERM: 'midterm',
    FINAL: 'final',
    PROJECT: 'project',
    OTHER: 'other'
};

export const NOTIFICATION_TYPES = {
    ATTENDANCE: 'attendance',
    GRADE: 'grade',
    ANNOUNCEMENT: 'announcement',
    REMINDER: 'reminder',
    SYSTEM: 'system'
};

export const FILE_CATEGORIES = {
    MATERIAL: 'material',
    ASSIGNMENT: 'assignment',
    SUBMISSION: 'submission',
    OTHER: 'other'
};

export const WEEKDAYS = {
    0: 'Chủ nhật',
    1: 'Thứ 2',
    2: 'Thứ 3',
    3: 'Thứ 4',
    4: 'Thứ 5',
    5: 'Thứ 6',
    6: 'Thứ 7'
};

export const CARD_COLORS = ['green', 'blue', 'purple', 'orange', 'red', 'cyan'];

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100
};

export default {
    ROLES,
    ROLE_NAMES,
    ATTENDANCE_STATUS,
    SESSION_STATUS,
    CLASS_STATUS,
    GRADE_TYPES,
    NOTIFICATION_TYPES,
    FILE_CATEGORIES,
    WEEKDAYS,
    CARD_COLORS,
    PAGINATION
};
