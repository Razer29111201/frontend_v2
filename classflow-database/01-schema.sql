-- =====================================================
-- CLASSFLOW DATABASE SCHEMA
-- Hệ thống quản lý lớp học
-- =====================================================

-- Tạo database (nếu chưa có)
CREATE DATABASE IF NOT EXISTS classflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE classflow;

-- =====================================================
-- 1. BẢNG USERS - Tài khoản đăng nhập
-- =====================================================
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role TINYINT NOT NULL DEFAULT 2 COMMENT '0=Admin, 1=Teacher, 2=CM',
    teacher_id INT DEFAULT NULL COMMENT 'Liên kết với bảng teachers',
    cm_id INT DEFAULT NULL COMMENT 'Liên kết với bảng cms',
    avatar VARCHAR(500) DEFAULT NULL,
    active TINYINT(1) DEFAULT 1,
    reset_token VARCHAR(255) DEFAULT NULL,
    reset_token_expires DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_cm_id (cm_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. BẢNG TEACHERS - Giáo viên
-- =====================================================
DROP TABLE IF EXISTS teachers;
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    subject VARCHAR(255) DEFAULT NULL COMMENT 'Chuyên môn',
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. BẢNG CMS - Class Manager
-- =====================================================
DROP TABLE IF EXISTS cms;
CREATE TABLE cms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. BẢNG CLASSES - Lớp học
-- =====================================================
DROP TABLE IF EXISTS classes;
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    teacher VARCHAR(255) DEFAULT NULL,
    teacher_id INT DEFAULT NULL,
    cm VARCHAR(255) DEFAULT NULL,
    cm_id INT DEFAULT NULL,
    start_date DATE DEFAULT NULL,
    week_day TINYINT DEFAULT 1 COMMENT '0=CN, 1=T2, 2=T3...',
    time_slot VARCHAR(50) DEFAULT NULL COMMENT 'VD: 18:00-20:00',
    color VARCHAR(20) DEFAULT 'green',
    total_sessions INT DEFAULT 15,
    status VARCHAR(20) DEFAULT 'active' COMMENT 'active, completed, cancelled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_cm_id (cm_id),
    INDEX idx_status (status),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    FOREIGN KEY (cm_id) REFERENCES cms(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. BẢNG STUDENTS - Học sinh
-- =====================================================
DROP TABLE IF EXISTS students;
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    class_id INT DEFAULT NULL,
    class_name VARCHAR(100) DEFAULT NULL,
    parent_name VARCHAR(255) DEFAULT NULL,
    parent_phone VARCHAR(20) DEFAULT NULL,
    parent_email VARCHAR(255) DEFAULT NULL,
    dob DATE DEFAULT NULL,
    gender VARCHAR(10) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_class_id (class_id),
    INDEX idx_name (name),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. BẢNG SESSIONS - Buổi học
-- =====================================================
DROP TABLE IF EXISTS sessions;
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    session_number INT NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled' COMMENT 'scheduled, completed, cancelled',
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_class_session (class_id, session_number),
    INDEX idx_class_id (class_id),
    INDEX idx_date (date),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. BẢNG ATTENDANCE - Điểm danh
-- =====================================================
DROP TABLE IF EXISTS attendance;
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    session INT NOT NULL COMMENT 'Số buổi học',
    student_id INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'on-time' COMMENT 'on-time, late, excused, absent',
    note TEXT DEFAULT NULL,
    check_in_time DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_attendance (class_id, session, student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. BẢNG COMMENTS - Nhận xét học sinh
-- =====================================================
DROP TABLE IF EXISTS comments;
CREATE TABLE comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_comment (class_id, student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. BẢNG GRADES - Điểm số (MỚI)
-- =====================================================
DROP TABLE IF EXISTS grades;
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    assignment_name VARCHAR(255) NOT NULL,
    assignment_type VARCHAR(50) DEFAULT 'homework' COMMENT 'homework, quiz, midterm, final, project',
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 10,
    weight DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Hệ số điểm',
    note TEXT DEFAULT NULL,
    graded_at DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_assignment_type (assignment_type),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. BẢNG NOTIFICATIONS - Thông báo (MỚI)
-- =====================================================
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    type VARCHAR(50) NOT NULL COMMENT 'attendance, grade, system, reminder',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON DEFAULT NULL COMMENT 'Dữ liệu bổ sung',
    is_read TINYINT(1) DEFAULT 0,
    sent_email TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. BẢNG HOLIDAYS - Ngày nghỉ (MỚI)
-- =====================================================
DROP TABLE IF EXISTS holidays;
CREATE TABLE holidays (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL UNIQUE,
    description TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. BẢNG ACTIVITY_LOGS - Nhật ký hoạt động (MỚI)
-- =====================================================
DROP TABLE IF EXISTS activity_logs;
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL COMMENT 'login, create, update, delete...',
    entity_type VARCHAR(50) DEFAULT NULL COMMENT 'class, student, teacher...',
    entity_id INT DEFAULT NULL,
    old_data JSON DEFAULT NULL,
    new_data JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- HOÀN TẤT TẠO SCHEMA
-- =====================================================
SELECT 'Schema created successfully!' AS Status;
