-- =====================================================
-- CLASSFLOW LMS - COMPLETE DATABASE SCHEMA
-- Version: 2.0 - Optimized with BTVN System
-- Date: 2024-12-13
-- =====================================================

-- Drop database if exists and create new
DROP DATABASE IF EXISTS classflow;
CREATE DATABASE classflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE classflow;

-- =====================================================
-- 1. BẢNG USERS - Người dùng hệ thống
-- =====================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'teacher', 'student', 'cm') NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- =====================================================
-- 2. BẢNG CLASSES - Lớp học
-- =====================================================
CREATE TABLE classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    teacher_id INT,
    cm_id INT COMMENT 'Class Manager ID',
    start_date DATE,
    end_date DATE,
    schedule VARCHAR(255) COMMENT 'Lịch học: T2,T4,T6 - 18:00-20:00',
    room VARCHAR(50),
    status ENUM('upcoming', 'ongoing', 'completed', 'cancelled') DEFAULT 'upcoming',
    max_students INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_cm_id (cm_id),
    INDEX idx_status (status),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (cm_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- 3. BẢNG STUDENTS - Học viên
-- =====================================================
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    class_id INT,
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    address TEXT,
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20),
    parent_email VARCHAR(100),
    enrollment_date DATE,
    status ENUM('active', 'inactive', 'graduated', 'dropped') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_class_id (class_id),
    INDEX idx_user_id (user_id),
    INDEX idx_email (email),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- 4. BẢNG ATTENDANCE - Điểm danh
-- =====================================================
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    date DATE NOT NULL,
    status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
    notes TEXT,
    created_by INT COMMENT 'User ID của người điểm danh',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_attendance (class_id, student_id, date),
    INDEX idx_class_date (class_id, date),
    INDEX idx_student_id (student_id),
    INDEX idx_date (date),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- 5. BẢNG GRADES - Điểm số
-- =====================================================
CREATE TABLE grades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    grade_type ENUM('quiz', 'midterm', 'final', 'project', 'homework', 'participation') NOT NULL,
    title VARCHAR(100) NOT NULL COMMENT 'Tên bài kiểm tra/dự án',
    score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 10.00,
    weight DECIMAL(5,2) DEFAULT 1.00 COMMENT 'Trọng số tính điểm',
    date DATE,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id),
    INDEX idx_grade_type (grade_type),
    INDEX idx_date (date),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- 6. BẢNG FILES - Quản lý files
-- =====================================================
CREATE TABLE files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT,
    uploader_id INT COMMENT 'User ID người upload',
    filename VARCHAR(255) NOT NULL COMMENT 'Tên file trên server',
    original_name VARCHAR(255) NOT NULL COMMENT 'Tên file gốc',
    file_type VARCHAR(100) COMMENT 'MIME type',
    file_size BIGINT COMMENT 'Size in bytes',
    url TEXT NOT NULL COMMENT 'URL trên cloud storage',
    category ENUM('material', 'assignment', 'submission', 'other') DEFAULT 'other',
    description TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_class_id (class_id),
    INDEX idx_uploader_id (uploader_id),
    INDEX idx_category (category),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- 7. BẢNG ANNOUNCEMENTS - Thông báo
-- =====================================================
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    created_by INT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_class_id (class_id),
    INDEX idx_created_by (created_by),
    INDEX idx_priority (priority),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- 8. BẢNG ASSIGNMENTS - Bài tập
-- =====================================================
CREATE TABLE assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    deadline DATETIME NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 10.00,
    created_by INT COMMENT 'Teacher user ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_class_id (class_id),
    INDEX idx_deadline (deadline),
    INDEX idx_created_by (created_by),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- 9. BẢNG ASSIGNMENT_FILES - Liên kết assignments với files
-- =====================================================
CREATE TABLE assignment_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    file_id INT NOT NULL,
    file_type ENUM('instruction', 'material', 'reference') DEFAULT 'instruction',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_assignment_file (assignment_id, file_id),
    INDEX idx_assignment_id (assignment_id),
    INDEX idx_file_id (file_id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- 10. BẢNG SUBMISSIONS - Bài nộp
-- =====================================================
CREATE TABLE submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT NOT NULL,
    student_id INT NOT NULL,
    content TEXT COMMENT 'Nội dung bài làm dạng text (optional)',
    score DECIMAL(5,2) DEFAULT NULL,
    feedback TEXT COMMENT 'Nhận xét của GV',
    status ENUM('not_submitted', 'submitted', 'graded', 'late') DEFAULT 'not_submitted',
    submitted_at DATETIME DEFAULT NULL,
    graded_at DATETIME DEFAULT NULL,
    graded_by INT COMMENT 'Teacher user ID who graded',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_submission (assignment_id, student_id),
    INDEX idx_assignment_id (assignment_id),
    INDEX idx_student_id (student_id),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- 11. BẢNG SUBMISSION_FILES - Liên kết submissions với files
-- =====================================================
CREATE TABLE submission_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    submission_id INT NOT NULL,
    file_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_submission_file (submission_id, file_id),
    INDEX idx_submission_id (submission_id),
    INDEX idx_file_id (file_id),
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- 12. BẢNG SCHEDULES - Lịch học chi tiết
-- =====================================================
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    session_number INT NOT NULL COMMENT 'Buổi học số mấy',
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    topic VARCHAR(255) COMMENT 'Chủ đề buổi học',
    room VARCHAR(50),
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_class_id (class_id),
    INDEX idx_date (date),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- 13. BẢNG NOTIFICATIONS - Thông báo cá nhân
-- =====================================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info',
    link VARCHAR(255) COMMENT 'Link liên quan',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- 14. BẢNG MESSAGES - Tin nhắn
-- =====================================================
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    parent_id INT COMMENT 'ID tin nhắn cha (nếu là reply)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_is_read (is_read),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES messages(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- 15. BẢNG CERTIFICATES - Chứng chỉ
-- =====================================================
CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    issue_date DATE NOT NULL,
    final_grade DECIMAL(5,2),
    status ENUM('issued', 'revoked') DEFAULT 'issued',
    pdf_url VARCHAR(255) COMMENT 'Link file PDF chứng chỉ',
    issued_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_certificate_number (certificate_number),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- 16. BẢNG PAYMENT_HISTORY - Lịch sử thanh toán
-- =====================================================
CREATE TABLE payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method ENUM('cash', 'transfer', 'card', 'momo', 'other') NOT NULL,
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_id (student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_payment_date (payment_date),
    INDEX idx_status (status),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- 17. BẢNG SETTINGS - Cấu hình hệ thống
-- =====================================================
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- VIEWS - Các view hỗ trợ
-- =====================================================

-- View: Class statistics
CREATE OR REPLACE VIEW class_statistics AS
SELECT 
    c.id,
    c.code,
    c.name,
    c.status,
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT a.id) as total_assignments,
    u.name as teacher_name
FROM classes c
LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
LEFT JOIN assignments a ON c.id = a.class_id
LEFT JOIN users u ON c.teacher_id = u.id
GROUP BY c.id;

-- View: Student performance
CREATE OR REPLACE VIEW student_performance AS
SELECT 
    s.id as student_id,
    s.name as student_name,
    s.code as student_code,
    c.id as class_id,
    c.name as class_name,
    COUNT(DISTINCT g.id) as total_grades,
    AVG(g.score) as average_score,
    COUNT(DISTINCT CASE WHEN sub.status = 'graded' THEN sub.id END) as assignments_graded,
    COUNT(DISTINCT CASE WHEN att.status = 'present' THEN att.id END) as days_present,
    COUNT(DISTINCT att.id) as total_attendance_records
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN grades g ON s.id = g.student_id
LEFT JOIN submissions sub ON s.id = sub.student_id
LEFT JOIN attendance att ON s.id = att.student_id
GROUP BY s.id, c.id;

-- View: Assignment with files
CREATE OR REPLACE VIEW assignment_with_files AS
SELECT 
    a.id,
    a.class_id,
    a.title,
    a.deadline,
    a.max_score,
    COUNT(DISTINCT af.file_id) as attachment_count,
    GROUP_CONCAT(DISTINCT f.original_name ORDER BY af.display_order SEPARATOR ', ') as attachment_names,
    COUNT(DISTINCT s.id) as total_submissions,
    COUNT(DISTINCT CASE WHEN s.status = 'graded' THEN s.id END) as graded_count,
    (SELECT COUNT(*) FROM students WHERE class_id = a.class_id AND status = 'active') as total_students
FROM assignments a
LEFT JOIN assignment_files af ON a.id = af.assignment_id
LEFT JOIN files f ON af.file_id = f.id
LEFT JOIN submissions s ON a.id = s.assignment_id
GROUP BY a.id;

-- View: Submission with files
CREATE OR REPLACE VIEW submission_with_files AS
SELECT 
    s.id,
    s.assignment_id,
    a.title as assignment_title,
    s.student_id,
    st.name as student_name,
    st.code as student_code,
    s.status,
    s.score,
    s.submitted_at,
    COUNT(DISTINCT sf.file_id) as file_count,
    GROUP_CONCAT(DISTINCT f.original_name SEPARATOR ', ') as file_names
FROM submissions s
JOIN assignments a ON s.assignment_id = a.id
JOIN students st ON s.student_id = st.id
LEFT JOIN submission_files sf ON s.id = sf.submission_id
LEFT JOIN files f ON sf.file_id = f.id
GROUP BY s.id;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger: Auto-create submissions khi tạo assignment
DELIMITER $$
DROP TRIGGER IF EXISTS create_submissions_on_assignment$$
CREATE TRIGGER create_submissions_on_assignment
AFTER INSERT ON assignments
FOR EACH ROW
BEGIN
    INSERT INTO submissions (assignment_id, student_id, status)
    SELECT NEW.id, id, 'not_submitted'
    FROM students
    WHERE class_id = NEW.class_id AND status = 'active';
END$$
DELIMITER ;

-- Trigger: Update status thành 'late' nếu nộp sau deadline
DELIMITER $$
DROP TRIGGER IF EXISTS check_late_submission$$
CREATE TRIGGER check_late_submission
BEFORE UPDATE ON submissions
FOR EACH ROW
BEGIN
    DECLARE assignment_deadline DATETIME;
    
    IF NEW.submitted_at IS NOT NULL AND OLD.submitted_at IS NULL THEN
        SELECT deadline INTO assignment_deadline 
        FROM assignments 
        WHERE id = NEW.assignment_id;
        
        IF NEW.submitted_at > assignment_deadline THEN
            SET NEW.status = 'late';
        ELSEIF NEW.status = 'not_submitted' THEN
            SET NEW.status = 'submitted';
        END IF;
    END IF;
END$$
DELIMITER ;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Procedure: Get class details
DELIMITER $$
DROP PROCEDURE IF EXISTS get_class_details$$
CREATE PROCEDURE get_class_details(IN p_class_id INT)
BEGIN
    -- Class info
    SELECT c.*, u.name as teacher_name, u.email as teacher_email
    FROM classes c
    LEFT JOIN users u ON c.teacher_id = u.id
    WHERE c.id = p_class_id;
    
    -- Students
    SELECT * FROM students WHERE class_id = p_class_id AND status = 'active';
    
    -- Statistics
    SELECT 
        COUNT(DISTINCT s.id) as total_students,
        COUNT(DISTINCT a.id) as total_assignments,
        COUNT(DISTINCT g.id) as total_grades,
        AVG(g.score) as average_grade
    FROM classes c
    LEFT JOIN students s ON c.id = s.class_id AND s.status = 'active'
    LEFT JOIN assignments a ON c.id = a.class_id
    LEFT JOIN grades g ON c.id = g.class_id
    WHERE c.id = p_class_id;
END$$
DELIMITER ;

-- Procedure: Get assignment details
DELIMITER $$
DROP PROCEDURE IF EXISTS get_assignment_details$$
CREATE PROCEDURE get_assignment_details(IN p_assignment_id INT)
BEGIN
    -- Assignment info
    SELECT * FROM assignments WHERE id = p_assignment_id;
    
    -- Attached files
    SELECT f.*, af.file_type, af.display_order
    FROM assignment_files af
    JOIN files f ON af.file_id = f.id
    WHERE af.assignment_id = p_assignment_id
    ORDER BY af.display_order;
    
    -- Submission statistics
    SELECT 
        COUNT(*) as total_submissions,
        COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'not_submitted' THEN 1 END) as not_submitted,
        AVG(score) as avg_score
    FROM submissions
    WHERE assignment_id = p_assignment_id;
END$$
DELIMITER ;

-- Procedure: Get student report
DELIMITER $$
DROP PROCEDURE IF EXISTS get_student_report$$
CREATE PROCEDURE get_student_report(IN p_student_id INT)
BEGIN
    -- Student info
    SELECT s.*, c.name as class_name, c.code as class_code
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.id = p_student_id;
    
    -- Grades
    SELECT * FROM grades WHERE student_id = p_student_id ORDER BY date DESC;
    
    -- Attendance
    SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late
    FROM attendance
    WHERE student_id = p_student_id;
    
    -- Submissions
    SELECT * FROM submission_with_files WHERE student_id = p_student_id;
END$$
DELIMITER ;

-- =====================================================
-- DỮ LIỆU MẪU
-- =====================================================

-- Insert admin user
INSERT INTO users (username, password, email, name, role, phone) VALUES
('admin', '$2b$10$XdGbZ7hJYZKjY0h8h.3pneGPvFQxLCQfZLGTZWvKGn4YrVqvYLQYu', 'admin@classflow.com', 'Administrator', 'admin', '0123456789'),
('teacher1', '$2b$10$XdGbZ7hJYZKjY0h8h.3pneGPvFQxLCQfZLGTZWvKGn4YrVqvYLQYu', 'teacher1@classflow.com', 'Nguyễn Văn A', 'teacher', '0987654321'),
('teacher2', '$2b$10$XdGbZ7hJYZKjY0h8h.3pneGPvFQxLCQfZLGTZWvKGn4YrVqvYLQYu', 'teacher2@classflow.com', 'Trần Thị B', 'teacher', '0987654322'),
('cm1', '$2b$10$XdGbZ7hJYZKjY0h8h.3pneGPvFQxLCQfZLGTZWvKGn4YrVqvYLQYu', 'cm1@classflow.com', 'Lê Văn C', 'cm', '0987654323');

-- Insert classes
INSERT INTO classes (code, name, description, teacher_id, cm_id, start_date, end_date, schedule, room, status, max_students) VALUES
('WEB101', 'Lập trình Web cơ bản', 'Học HTML, CSS, JavaScript cơ bản', 2, 4, '2024-01-15', '2024-03-15', 'T2,T4,T6 - 18:00-20:00', 'P101', 'ongoing', 30),
('WEB102', 'Lập trình Web nâng cao', 'Node.js, Express, React', 2, 4, '2024-02-01', '2024-04-30', 'T3,T5,T7 - 18:00-21:00', 'P102', 'ongoing', 25),
('DB101', 'Cơ sở dữ liệu', 'SQL, MySQL, Database Design', 3, 4, '2024-01-20', '2024-03-20', 'T2,T5 - 18:30-21:00', 'P103', 'ongoing', 30),
('JAVA101', 'Lập trình Java cơ bản', 'Java Core, OOP', 3, 4, '2024-02-10', '2024-04-10', 'T4,T7 - 18:00-20:30', 'P104', 'ongoing', 28);

-- Insert students
INSERT INTO students (user_id, code, name, email, phone, class_id, date_of_birth, gender, enrollment_date, status) VALUES
(NULL, 'SV001', 'Phạm Văn D', 'phamvand@email.com', '0901234567', 1, '2000-05-15', 'male', '2024-01-15', 'active'),
(NULL, 'SV002', 'Hoàng Thị E', 'hoangthie@email.com', '0901234568', 1, '2001-03-20', 'female', '2024-01-15', 'active'),
(NULL, 'SV003', 'Đặng Văn F', 'dangvanf@email.com', '0901234569', 1, '2000-08-10', 'male', '2024-01-15', 'active'),
(NULL, 'SV004', 'Vũ Thị G', 'vuthig@email.com', '0901234570', 1, '2001-11-25', 'female', '2024-01-15', 'active'),
(NULL, 'SV005', 'Bùi Văn H', 'buivanh@email.com', '0901234571', 1, '2000-07-18', 'male', '2024-01-15', 'active'),
(NULL, 'SV006', 'Mai Văn I', 'maivani@email.com', '0901234572', 2, '2000-04-12', 'male', '2024-02-01', 'active'),
(NULL, 'SV007', 'Lý Thị K', 'lythik@email.com', '0901234573', 2, '2001-09-08', 'female', '2024-02-01', 'active'),
(NULL, 'SV008', 'Đinh Văn L', 'dinhvanl@email.com', '0901234574', 2, '2000-12-30', 'male', '2024-02-01', 'active'),
(NULL, 'SV009', 'Dương Thị M', 'duongthim@email.com', '0901234575', 2, '2001-06-22', 'female', '2024-02-01', 'active'),
(NULL, 'SV010', 'Phan Văn N', 'phanvann@email.com', '0901234576', 3, '2000-10-05', 'male', '2024-01-20', 'active'),
(NULL, 'SV011', 'Võ Thị O', 'vothio@email.com', '0901234577', 3, '2001-02-14', 'female', '2024-01-20', 'active'),
(NULL, 'SV012', 'Ngô Văn P', 'ngovanp@email.com', '0901234578', 3, '2000-11-28', 'male', '2024-01-20', 'active'),
(NULL, 'SV013', 'Hồ Thị Q', 'hothiq@email.com', '0901234579', 3, '2001-08-17', 'female', '2024-01-20', 'active'),
(NULL, 'SV014', 'Trương Văn R', 'truongvanr@email.com', '0901234580', 4, '2000-03-09', 'male', '2024-02-10', 'active'),
(NULL, 'SV015', 'Lâm Thị S', 'lamthis@email.com', '0901234581', 4, '2001-12-03', 'female', '2024-02-10', 'active'),
(NULL, 'SV016', 'Tô Văn T', 'tovant@email.com', '0901234582', 4, '2000-09-21', 'male', '2024-02-10', 'active'),
(NULL, 'SV017', 'Đỗ Thị U', 'dothiu@email.com', '0901234583', 4, '2001-04-16', 'female', '2024-02-10', 'active');

-- Insert sample files
INSERT INTO files (class_id, uploader_id, filename, original_name, file_type, file_size, url, category, description) VALUES
(1, 2, 'html_basics_assignment.pdf', 'Đề bài HTML cơ bản.pdf', 'application/pdf', 245678, 'https://cloudinary.com/classflow/html_basics.pdf', 'assignment', 'Đề bài tập HTML cơ bản'),
(1, 2, 'html_example.html', 'Ví dụ HTML.html', 'text/html', 12345, 'https://cloudinary.com/classflow/html_example.html', 'material', 'File mẫu HTML'),
(1, 2, 'css_flexbox_guide.pdf', 'Hướng dẫn Flexbox.pdf', 'application/pdf', 567890, 'https://cloudinary.com/classflow/flexbox_guide.pdf', 'assignment', 'Đề bài CSS Flexbox'),
(2, 2, 'nodejs_assignment.pdf', 'Đề bài Node.js.pdf', 'application/pdf', 345678, 'https://cloudinary.com/classflow/nodejs_assignment.pdf', 'assignment', 'Đề bài Node.js cơ bản'),
(2, 2, 'express_template.zip', 'Express starter template.zip', 'application/zip', 98765, 'https://cloudinary.com/classflow/express_template.zip', 'material', 'Template Express'),
(3, 2, 'sql_queries.pdf', 'Đề bài SQL queries.pdf', 'application/pdf', 234567, 'https://cloudinary.com/classflow/sql_queries.pdf', 'assignment', '20 câu hỏi SQL'),
(3, 2, 'database_diagram.png', 'Database ERD.png', 'image/png', 456789, 'https://cloudinary.com/classflow/db_diagram.png', 'material', 'Sơ đồ database mẫu'),
(4, 2, 'java_oop.pdf', 'Đề bài Java OOP.pdf', 'application/pdf', 123456, 'https://cloudinary.com/classflow/java_oop.pdf', 'assignment', 'Bài tập Java OOP');

-- Insert assignments
INSERT INTO assignments (class_id, title, description, deadline, max_score, created_by) VALUES
-- Lớp WEB101
(1, 'Bài tập HTML cơ bản', 'Tạo trang web giới thiệu bản thân sử dụng HTML. Yêu cầu: có header, nav, section, footer, ảnh đại diện, danh sách sở thích.', '2024-12-20 23:59:59', 10.00, 2),
(1, 'Bài tập CSS Flexbox', 'Tạo layout responsive sử dụng Flexbox. Bao gồm: navbar, sidebar, content area, footer. Phải responsive trên mobile.', '2024-12-27 23:59:59', 10.00, 2),
(1, 'Project cuối kỳ - Landing Page', 'Thiết kế landing page hoàn chỉnh cho một sản phẩm/dịch vụ. Sử dụng HTML, CSS, JavaScript.', '2025-01-15 23:59:59', 20.00, 2),
-- Lớp WEB102
(2, 'Bài tập Node.js cơ bản', 'Viết server đơn giản với Node.js xử lý HTTP requests.', '2024-12-22 23:59:59', 10.00, 2),
(2, 'Express REST API', 'Xây dựng REST API cho quản lý sản phẩm (CRUD). Sử dụng Express, MySQL.', '2024-12-29 23:59:59', 15.00, 2),
(2, 'Authentication System', 'Implement hệ thống đăng ký/đăng nhập với JWT, bcrypt.', '2025-01-10 23:59:59', 20.00, 2),
-- Lớp DB101
(3, 'SQL queries cơ bản', 'Viết 20 queries SQL theo yêu cầu: SELECT, WHERE, ORDER BY, GROUP BY, HAVING, LIMIT.', '2024-12-25 23:59:59', 10.00, 2),
(3, 'Database Design', 'Thiết kế database cho hệ thống thư viện: tables, relationships, indexes, constraints.', '2025-01-05 23:59:59', 15.00, 2),
-- Lớp JAVA101
(4, 'OOP Java cơ bản', 'Tạo class Student với properties, constructor, getters/setters, methods.', '2024-12-28 23:59:59', 10.00, 2),
(4, 'Java Collections', 'Sử dụng ArrayList, HashMap để quản lý dữ liệu. Implement search, sort, filter.', '2025-01-08 23:59:59', 15.00, 2);

-- Link files to assignments
INSERT INTO assignment_files (assignment_id, file_id, file_type, display_order) VALUES
(1, 1, 'instruction', 1),
(1, 2, 'material', 2),
(2, 3, 'instruction', 1),
(4, 4, 'instruction', 1),
(4, 5, 'material', 2),
(7, 6, 'instruction', 1),
(8, 7, 'material', 1),
(9, 8, 'instruction', 1);

-- Insert sample attendance records
INSERT INTO attendance (class_id, student_id, date, status, created_by) VALUES
-- WEB101
(1, 1, '2024-01-15', 'present', 2),
(1, 2, '2024-01-15', 'present', 2),
(1, 3, '2024-01-15', 'late', 2),
(1, 4, '2024-01-15', 'present', 2),
(1, 5, '2024-01-15', 'absent', 2),
-- WEB102
(2, 6, '2024-02-01', 'present', 2),
(2, 7, '2024-02-01', 'present', 2),
(2, 8, '2024-02-01', 'present', 2),
(2, 9, '2024-02-01', 'late', 2);

-- Insert sample grades
INSERT INTO grades (class_id, student_id, grade_type, title, score, max_score, date, created_by) VALUES
(1, 1, 'quiz', 'Quiz HTML cơ bản', 9.5, 10, '2024-01-20', 2),
(1, 2, 'quiz', 'Quiz HTML cơ bản', 8.0, 10, '2024-01-20', 2),
(1, 3, 'quiz', 'Quiz HTML cơ bản', 7.5, 10, '2024-01-20', 2),
(2, 6, 'quiz', 'Quiz Node.js', 9.0, 10, '2024-02-05', 2),
(2, 7, 'quiz', 'Quiz Node.js', 8.5, 10, '2024-02-05', 2);

-- Insert sample announcements
INSERT INTO announcements (class_id, title, content, priority, created_by, is_pinned) VALUES
(1, 'Thông báo nghỉ học', 'Lớp sẽ nghỉ vào thứ 2 tuần sau do giáo viên có việc đột xuất.', 'high', 2, TRUE),
(2, 'Nộp bài tập', 'Nhớ nộp bài tập Node.js trước deadline nhé các bạn!', 'medium', 2, FALSE),
(3, 'Tài liệu tham khảo', 'Đã upload tài liệu SQL lên tab Files, các bạn tải về học nhé.', 'low', 3, FALSE);

-- Insert settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('system_name', 'ClassFlow LMS', 'Tên hệ thống'),
('max_file_size', '10485760', 'Kích thước file tối đa (bytes) - 10MB'),
('allowed_file_types', 'pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,zip,rar', 'Các loại file được phép upload'),
('email_from', 'noreply@classflow.com', 'Email gửi đi'),
('smtp_host', 'smtp.gmail.com', 'SMTP host'),
('smtp_port', '587', 'SMTP port');

-- =====================================================
-- HOÀN TẤT
-- =====================================================

SELECT '========================================' as '';
SELECT 'CLASSFLOW LMS DATABASE CREATED!' as 'Status';
SELECT '========================================' as '';
SELECT '' as '';
SELECT 'DATABASE STATISTICS:' as '';
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM classes) as total_classes,
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM assignments) as total_assignments,
    (SELECT COUNT(*) FROM submissions) as total_submissions,
    (SELECT COUNT(*) FROM files) as total_files,
    (SELECT COUNT(*) FROM grades) as total_grades,
    (SELECT COUNT(*) FROM attendance) as total_attendance_records;
SELECT '' as '';
SELECT 'DEFAULT CREDENTIALS:' as '';
SELECT 'Admin: admin / password123' as '';
SELECT 'Teacher: teacher1 / password123' as '';
SELECT '========================================' as '';