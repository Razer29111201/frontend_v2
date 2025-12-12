-- =====================================================
-- CLASSFLOW SEED DATA
-- Dữ liệu mẫu để test hệ thống
-- =====================================================

USE classflow;

-- =====================================================
-- 1. TẠO TEACHERS (Giáo viên)
-- =====================================================
INSERT INTO teachers (code, name, email, phone, subject, active) VALUES
('GV001', 'Nguyễn Văn Minh', 'minh.gv@classflow.edu.vn', '0901234567', 'Lập trình Web', 1),
('GV002', 'Trần Thị Hương', 'huong.gv@classflow.edu.vn', '0902345678', 'Cơ sở dữ liệu', 1),
('GV003', 'Lê Hoàng Nam', 'nam.gv@classflow.edu.vn', '0903456789', 'Lập trình Java', 1),
('GV004', 'Phạm Thị Lan', 'lan.gv@classflow.edu.vn', '0904567890', 'Thiết kế UI/UX', 1),
('GV005', 'Hoàng Đức Anh', 'anh.gv@classflow.edu.vn', '0905678901', 'Machine Learning', 0);

-- =====================================================
-- 2. TẠO CMS (Class Manager)
-- =====================================================
INSERT INTO cms (code, name, email, phone, active) VALUES
('CM001', 'Võ Thị Mai', 'mai.cm@classflow.edu.vn', '0911234567', 1),
('CM002', 'Đặng Văn Tùng', 'tung.cm@classflow.edu.vn', '0912345678', 1),
('CM003', 'Bùi Thị Ngọc', 'ngoc.cm@classflow.edu.vn', '0913456789', 1);

-- =====================================================
-- 3. TẠO USERS (Tài khoản)
-- Password: 123456 (đã hash bằng bcrypt)
-- =====================================================
INSERT INTO users (email, password, name, role, teacher_id, cm_id, active) VALUES
-- Admin
('admin@classflow.edu.vn', '$2a$10$rQZKv6Xt0dN6R5z1V5K.aeZU9fNvqZ7v1d3C5HxY9GjKz8HfQeEYi', 'Admin System', 0, NULL, NULL, 1),

-- Teachers (role = 1)
('minh.gv@classflow.edu.vn', '$2a$10$rQZKv6Xt0dN6R5z1V5K.aeZU9fNvqZ7v1d3C5HxY9GjKz8HfQeEYi', 'Nguyễn Văn Minh', 1, 1, NULL, 1),
('huong.gv@classflow.edu.vn', '$2a$10$rQZKv6Xt0dN6R5z1V5K.aeZU9fNvqZ7v1d3C5HxY9GjKz8HfQeEYi', 'Trần Thị Hương', 1, 2, NULL, 1),
('nam.gv@classflow.edu.vn', '$2a$10$rQZKv6Xt0dN6R5z1V5K.aeZU9fNvqZ7v1d3C5HxY9GjKz8HfQeEYi', 'Lê Hoàng Nam', 1, 3, NULL, 1),

-- CMs (role = 2)
('mai.cm@classflow.edu.vn', '$2a$10$rQZKv6Xt0dN6R5z1V5K.aeZU9fNvqZ7v1d3C5HxY9GjKz8HfQeEYi', 'Võ Thị Mai', 2, NULL, 1, 1),
('tung.cm@classflow.edu.vn', '$2a$10$rQZKv6Xt0dN6R5z1V5K.aeZU9fNvqZ7v1d3C5HxY9GjKz8HfQeEYi', 'Đặng Văn Tùng', 2, NULL, 2, 1);

-- =====================================================
-- 4. TẠO CLASSES (Lớp học)
-- =====================================================
INSERT INTO classes (code, name, teacher, teacher_id, cm, cm_id, start_date, week_day, time_slot, color, total_sessions, status) VALUES
('WEB101', 'Lập trình Web Frontend', 'Nguyễn Văn Minh', 1, 'Võ Thị Mai', 1, '2024-12-02', 2, '18:00-20:00', 'green', 15, 'active'),
('WEB102', 'Lập trình Web Backend', 'Nguyễn Văn Minh', 1, 'Võ Thị Mai', 1, '2024-12-04', 4, '18:00-20:00', 'blue', 15, 'active'),
('DB101', 'Cơ sở dữ liệu MySQL', 'Trần Thị Hương', 2, 'Đặng Văn Tùng', 2, '2024-12-03', 3, '19:00-21:00', 'purple', 15, 'active'),
('JAVA101', 'Lập trình Java cơ bản', 'Lê Hoàng Nam', 3, 'Đặng Văn Tùng', 2, '2024-12-05', 5, '18:30-20:30', 'orange', 15, 'active'),
('UI101', 'Thiết kế UI/UX', 'Phạm Thị Lan', 4, 'Bùi Thị Ngọc', 3, '2024-12-07', 7, '09:00-11:00', 'red', 12, 'active'),
('REACT101', 'ReactJS nâng cao', 'Nguyễn Văn Minh', 1, 'Võ Thị Mai', 1, '2024-12-06', 6, '14:00-16:00', 'cyan', 10, 'active');

-- =====================================================
-- 5. TẠO STUDENTS (Học sinh)
-- =====================================================
-- Lớp WEB101 (class_id = 1)
INSERT INTO students (code, name, email, phone, class_id, class_name, parent_name, parent_phone, parent_email, dob, gender) VALUES
('HS001', 'Nguyễn Văn An', 'an.nv@student.edu.vn', '0981234567', 1, 'WEB101', 'Nguyễn Văn Bình', '0971234567', 'binh.parent@gmail.com', '2005-03-15', 'Nam'),
('HS002', 'Trần Thị Bình', 'binh.tt@student.edu.vn', '0982345678', 1, 'WEB101', 'Trần Văn Cường', '0972345678', 'cuong.parent@gmail.com', '2004-07-22', 'Nữ'),
('HS003', 'Lê Hoàng Cường', 'cuong.lh@student.edu.vn', '0983456789', 1, 'WEB101', 'Lê Thị Dung', '0973456789', 'dung.parent@gmail.com', '2005-01-10', 'Nam'),
('HS004', 'Phạm Thị Dung', 'dung.pt@student.edu.vn', '0984567890', 1, 'WEB101', 'Phạm Văn Em', '0974567890', 'em.parent@gmail.com', '2004-11-28', 'Nữ'),
('HS005', 'Hoàng Văn Em', 'em.hv@student.edu.vn', '0985678901', 1, 'WEB101', 'Hoàng Thị Phương', '0975678901', 'phuong.parent@gmail.com', '2005-05-08', 'Nam'),

-- Lớp WEB102 (class_id = 2)
('HS006', 'Võ Thị Giang', 'giang.vt@student.edu.vn', '0986789012', 2, 'WEB102', 'Võ Văn Hải', '0976789012', 'hai.parent@gmail.com', '2004-09-17', 'Nữ'),
('HS007', 'Đặng Văn Hải', 'hai.dv@student.edu.vn', '0987890123', 2, 'WEB102', 'Đặng Thị Lan', '0977890123', 'lan.parent@gmail.com', '2005-02-25', 'Nam'),
('HS008', 'Bùi Thị Lan', 'lan.bt@student.edu.vn', '0988901234', 2, 'WEB102', 'Bùi Văn Minh', '0978901234', 'minh2.parent@gmail.com', '2004-06-30', 'Nữ'),
('HS009', 'Ngô Văn Minh', 'minh.nv@student.edu.vn', '0989012345', 2, 'WEB102', 'Ngô Thị Nga', '0979012345', 'nga.parent@gmail.com', '2005-04-12', 'Nam'),

-- Lớp DB101 (class_id = 3)
('HS010', 'Lý Thị Ngọc', 'ngoc.lt@student.edu.vn', '0990123456', 3, 'DB101', 'Lý Văn Phong', '0980123456', 'phong.parent@gmail.com', '2004-08-20', 'Nữ'),
('HS011', 'Vũ Văn Phong', 'phong.vv@student.edu.vn', '0991234567', 3, 'DB101', 'Vũ Thị Quỳnh', '0981234568', 'quynh.parent@gmail.com', '2005-10-05', 'Nam'),
('HS012', 'Đinh Thị Quỳnh', 'quynh.dt@student.edu.vn', '0992345678', 3, 'DB101', 'Đinh Văn Sơn', '0982345679', 'son.parent@gmail.com', '2004-12-18', 'Nữ'),
('HS013', 'Trương Văn Sơn', 'son.tv@student.edu.vn', '0993456789', 3, 'DB101', 'Trương Thị Thanh', '0983456790', 'thanh.parent@gmail.com', '2005-07-07', 'Nam'),

-- Lớp JAVA101 (class_id = 4)
('HS014', 'Phan Thị Thanh', 'thanh.pt@student.edu.vn', '0994567890', 4, 'JAVA101', 'Phan Văn Tú', '0984567891', 'tu.parent@gmail.com', '2004-03-25', 'Nữ'),
('HS015', 'Hồ Văn Tú', 'tu.hv@student.edu.vn', '0995678901', 4, 'JAVA101', 'Hồ Thị Uyên', '0985678902', 'uyen.parent@gmail.com', '2005-09-14', 'Nam'),
('HS016', 'Mai Thị Uyên', 'uyen.mt@student.edu.vn', '0996789012', 4, 'JAVA101', 'Mai Văn Vinh', '0986789013', 'vinh.parent@gmail.com', '2004-01-30', 'Nữ'),
('HS017', 'Dương Văn Vinh', 'vinh.dv@student.edu.vn', '0997890123', 4, 'JAVA101', 'Dương Thị Xuân', '0987890124', 'xuan.parent@gmail.com', '2005-11-22', 'Nam'),

-- Lớp UI101 (class_id = 5)
('HS018', 'Cao Thị Xuân', 'xuan.ct@student.edu.vn', '0998901234', 5, 'UI101', 'Cao Văn Yên', '0988901235', 'yen.parent@gmail.com', '2004-05-16', 'Nữ'),
('HS019', 'Tô Văn Yên', 'yen.tv@student.edu.vn', '0999012345', 5, 'UI101', 'Tô Thị Ánh', '0989012346', 'anh2.parent@gmail.com', '2005-08-08', 'Nam'),
('HS020', 'Lương Thị Ánh', 'anh.lt@student.edu.vn', '0910123456', 5, 'UI101', 'Lương Văn Bảo', '0990123457', 'bao.parent@gmail.com', '2004-10-12', 'Nữ'),

-- Lớp REACT101 (class_id = 6)
('HS021', 'Đỗ Văn Bảo', 'bao.dv@student.edu.vn', '0911234568', 6, 'REACT101', 'Đỗ Thị Chi', '0991234568', 'chi.parent@gmail.com', '2005-02-28', 'Nam'),
('HS022', 'Nguyễn Thị Chi', 'chi.nt@student.edu.vn', '0912345679', 6, 'REACT101', 'Nguyễn Văn Đức', '0992345679', 'duc.parent@gmail.com', '2004-04-19', 'Nữ'),
('HS023', 'Trần Văn Đức', 'duc.tv@student.edu.vn', '0913456790', 6, 'REACT101', 'Trần Thị Hà', '0993456790', 'ha.parent@gmail.com', '2005-06-25', 'Nam');

-- =====================================================
-- 6. TẠO SESSIONS (Buổi học) cho mỗi lớp
-- =====================================================
-- Lớp WEB101 - 15 buổi, Thứ 3
INSERT INTO sessions (class_id, session_number, date, status, note) VALUES
(1, 1, '2024-12-03', 'completed', 'Giới thiệu HTML/CSS'),
(1, 2, '2024-12-10', 'completed', 'CSS Flexbox'),
(1, 3, '2024-12-17', 'completed', 'CSS Grid'),
(1, 4, '2024-12-24', 'scheduled', 'JavaScript cơ bản'),
(1, 5, '2024-12-31', 'scheduled', 'DOM Manipulation'),
(1, 6, '2025-01-07', 'scheduled', NULL),
(1, 7, '2025-01-14', 'scheduled', NULL),
(1, 8, '2025-01-21', 'scheduled', NULL),
(1, 9, '2025-01-28', 'scheduled', NULL),
(1, 10, '2025-02-04', 'scheduled', NULL),
(1, 11, '2025-02-11', 'scheduled', NULL),
(1, 12, '2025-02-18', 'scheduled', NULL),
(1, 13, '2025-02-25', 'scheduled', NULL),
(1, 14, '2025-03-04', 'scheduled', NULL),
(1, 15, '2025-03-11', 'scheduled', NULL);

-- Lớp WEB102 - 15 buổi, Thứ 5
INSERT INTO sessions (class_id, session_number, date, status, note) VALUES
(2, 1, '2024-12-05', 'completed', 'Giới thiệu Node.js'),
(2, 2, '2024-12-12', 'completed', 'Express.js cơ bản'),
(2, 3, '2024-12-19', 'scheduled', 'REST API'),
(2, 4, '2024-12-26', 'scheduled', NULL),
(2, 5, '2025-01-02', 'scheduled', NULL),
(2, 6, '2025-01-09', 'scheduled', NULL),
(2, 7, '2025-01-16', 'scheduled', NULL),
(2, 8, '2025-01-23', 'scheduled', NULL),
(2, 9, '2025-01-30', 'scheduled', NULL),
(2, 10, '2025-02-06', 'scheduled', NULL),
(2, 11, '2025-02-13', 'scheduled', NULL),
(2, 12, '2025-02-20', 'scheduled', NULL),
(2, 13, '2025-02-27', 'scheduled', NULL),
(2, 14, '2025-03-06', 'scheduled', NULL),
(2, 15, '2025-03-13', 'scheduled', NULL);

-- Lớp DB101 - 15 buổi, Thứ 4
INSERT INTO sessions (class_id, session_number, date, status, note) VALUES
(3, 1, '2024-12-04', 'completed', 'Giới thiệu CSDL'),
(3, 2, '2024-12-11', 'completed', 'SQL cơ bản'),
(3, 3, '2024-12-18', 'scheduled', 'JOIN tables'),
(3, 4, '2024-12-25', 'scheduled', NULL),
(3, 5, '2025-01-01', 'scheduled', NULL),
(3, 6, '2025-01-08', 'scheduled', NULL),
(3, 7, '2025-01-15', 'scheduled', NULL),
(3, 8, '2025-01-22', 'scheduled', NULL),
(3, 9, '2025-01-29', 'scheduled', NULL),
(3, 10, '2025-02-05', 'scheduled', NULL),
(3, 11, '2025-02-12', 'scheduled', NULL),
(3, 12, '2025-02-19', 'scheduled', NULL),
(3, 13, '2025-02-26', 'scheduled', NULL),
(3, 14, '2025-03-05', 'scheduled', NULL),
(3, 15, '2025-03-12', 'scheduled', NULL);

-- Lớp JAVA101 - 15 buổi, Thứ 6
INSERT INTO sessions (class_id, session_number, date, status, note) VALUES
(4, 1, '2024-12-06', 'completed', 'Hello World Java'),
(4, 2, '2024-12-13', 'completed', 'OOP cơ bản'),
(4, 3, '2024-12-20', 'scheduled', NULL),
(4, 4, '2024-12-27', 'scheduled', NULL),
(4, 5, '2025-01-03', 'scheduled', NULL),
(4, 6, '2025-01-10', 'scheduled', NULL),
(4, 7, '2025-01-17', 'scheduled', NULL),
(4, 8, '2025-01-24', 'scheduled', NULL),
(4, 9, '2025-01-31', 'scheduled', NULL),
(4, 10, '2025-02-07', 'scheduled', NULL),
(4, 11, '2025-02-14', 'scheduled', NULL),
(4, 12, '2025-02-21', 'scheduled', NULL),
(4, 13, '2025-02-28', 'scheduled', NULL),
(4, 14, '2025-03-07', 'scheduled', NULL),
(4, 15, '2025-03-14', 'scheduled', NULL);

-- Lớp UI101 - 12 buổi, Chủ nhật
INSERT INTO sessions (class_id, session_number, date, status, note) VALUES
(5, 1, '2024-12-08', 'completed', 'Design Thinking'),
(5, 2, '2024-12-15', 'scheduled', 'Figma basics'),
(5, 3, '2024-12-22', 'scheduled', NULL),
(5, 4, '2024-12-29', 'scheduled', NULL),
(5, 5, '2025-01-05', 'scheduled', NULL),
(5, 6, '2025-01-12', 'scheduled', NULL),
(5, 7, '2025-01-19', 'scheduled', NULL),
(5, 8, '2025-01-26', 'scheduled', NULL),
(5, 9, '2025-02-02', 'scheduled', NULL),
(5, 10, '2025-02-09', 'scheduled', NULL),
(5, 11, '2025-02-16', 'scheduled', NULL),
(5, 12, '2025-02-23', 'scheduled', NULL);

-- Lớp REACT101 - 10 buổi, Thứ 7
INSERT INTO sessions (class_id, session_number, date, status, note) VALUES
(6, 1, '2024-12-07', 'completed', 'React intro'),
(6, 2, '2024-12-14', 'scheduled', 'Components'),
(6, 3, '2024-12-21', 'scheduled', NULL),
(6, 4, '2024-12-28', 'scheduled', NULL),
(6, 5, '2025-01-04', 'scheduled', NULL),
(6, 6, '2025-01-11', 'scheduled', NULL),
(6, 7, '2025-01-18', 'scheduled', NULL),
(6, 8, '2025-01-25', 'scheduled', NULL),
(6, 9, '2025-02-01', 'scheduled', NULL),
(6, 10, '2025-02-08', 'scheduled', NULL);

-- =====================================================
-- 7. TẠO ATTENDANCE (Điểm danh)
-- =====================================================
-- Điểm danh lớp WEB101 - Buổi 1
INSERT INTO attendance (class_id, session, student_id, status, note, check_in_time) VALUES
(1, 1, 1, 'on-time', NULL, '2024-12-03 18:00:00'),
(1, 1, 2, 'on-time', NULL, '2024-12-03 17:58:00'),
(1, 1, 3, 'late', 'Kẹt xe', '2024-12-03 18:15:00'),
(1, 1, 4, 'on-time', NULL, '2024-12-03 17:55:00'),
(1, 1, 5, 'absent', 'Ốm', NULL);

-- Điểm danh lớp WEB101 - Buổi 2
INSERT INTO attendance (class_id, session, student_id, status, note, check_in_time) VALUES
(1, 2, 1, 'on-time', NULL, '2024-12-10 18:00:00'),
(1, 2, 2, 'on-time', NULL, '2024-12-10 17:50:00'),
(1, 2, 3, 'on-time', NULL, '2024-12-10 17:58:00'),
(1, 2, 4, 'late', NULL, '2024-12-10 18:10:00'),
(1, 2, 5, 'on-time', NULL, '2024-12-10 17:55:00');

-- Điểm danh lớp WEB101 - Buổi 3
INSERT INTO attendance (class_id, session, student_id, status, note, check_in_time) VALUES
(1, 3, 1, 'on-time', NULL, '2024-12-17 18:00:00'),
(1, 3, 2, 'excused', 'Có việc gia đình', NULL),
(1, 3, 3, 'on-time', NULL, '2024-12-17 17:58:00'),
(1, 3, 4, 'on-time', NULL, '2024-12-17 17:55:00'),
(1, 3, 5, 'on-time', NULL, '2024-12-17 17:52:00');

-- Điểm danh lớp WEB102 - Buổi 1
INSERT INTO attendance (class_id, session, student_id, status, note, check_in_time) VALUES
(2, 1, 6, 'on-time', NULL, '2024-12-05 18:00:00'),
(2, 1, 7, 'on-time', NULL, '2024-12-05 17:55:00'),
(2, 1, 8, 'late', NULL, '2024-12-05 18:20:00'),
(2, 1, 9, 'on-time', NULL, '2024-12-05 17:58:00');

-- Điểm danh lớp WEB102 - Buổi 2
INSERT INTO attendance (class_id, session, student_id, status, note, check_in_time) VALUES
(2, 2, 6, 'on-time', NULL, '2024-12-12 18:00:00'),
(2, 2, 7, 'absent', 'Không liên lạc được', NULL),
(2, 2, 8, 'on-time', NULL, '2024-12-12 17:50:00'),
(2, 2, 9, 'on-time', NULL, '2024-12-12 17:55:00');

-- Điểm danh lớp DB101 - Buổi 1 & 2
INSERT INTO attendance (class_id, session, student_id, status, note, check_in_time) VALUES
(3, 1, 10, 'on-time', NULL, '2024-12-04 19:00:00'),
(3, 1, 11, 'on-time', NULL, '2024-12-04 18:55:00'),
(3, 1, 12, 'on-time', NULL, '2024-12-04 18:58:00'),
(3, 1, 13, 'late', NULL, '2024-12-04 19:15:00'),
(3, 2, 10, 'on-time', NULL, '2024-12-11 19:00:00'),
(3, 2, 11, 'on-time', NULL, '2024-12-11 18:50:00'),
(3, 2, 12, 'excused', 'Đi khám bệnh', NULL),
(3, 2, 13, 'on-time', NULL, '2024-12-11 18:55:00');

-- Điểm danh lớp JAVA101 - Buổi 1 & 2
INSERT INTO attendance (class_id, session, student_id, status, note, check_in_time) VALUES
(4, 1, 14, 'on-time', NULL, '2024-12-06 18:30:00'),
(4, 1, 15, 'on-time', NULL, '2024-12-06 18:25:00'),
(4, 1, 16, 'on-time', NULL, '2024-12-06 18:28:00'),
(4, 1, 17, 'absent', NULL, NULL),
(4, 2, 14, 'on-time', NULL, '2024-12-13 18:30:00'),
(4, 2, 15, 'late', 'Mưa to', '2024-12-13 18:45:00'),
(4, 2, 16, 'on-time', NULL, '2024-12-13 18:28:00'),
(4, 2, 17, 'on-time', NULL, '2024-12-13 18:20:00');

-- =====================================================
-- 8. TẠO COMMENTS (Nhận xét)
-- =====================================================
INSERT INTO comments (class_id, student_id, comment) VALUES
(1, 1, 'Học sinh chăm chỉ, tiến bộ tốt trong CSS'),
(1, 2, 'Cần cải thiện thêm về JavaScript'),
(1, 3, 'Năng động, hay hỏi bài'),
(1, 4, 'Hoàn thành bài tập đầy đủ'),
(1, 5, 'Cần tập trung hơn trong lớp'),
(2, 6, 'Nắm vững Node.js'),
(2, 7, 'Cần ôn lại Express routing'),
(3, 10, 'SQL queries rất tốt'),
(3, 11, 'Cần practice thêm JOIN'),
(4, 14, 'OOP concept tốt'),
(4, 15, 'Cần làm thêm bài tập');

-- =====================================================
-- 9. TẠO GRADES (Điểm số)
-- =====================================================
INSERT INTO grades (class_id, student_id, assignment_name, assignment_type, score, max_score, weight, note, graded_at) VALUES
-- WEB101
(1, 1, 'Bài tập HTML', 'homework', 9.0, 10, 1.0, NULL, '2024-12-05'),
(1, 1, 'Quiz CSS', 'quiz', 8.5, 10, 1.0, NULL, '2024-12-12'),
(1, 2, 'Bài tập HTML', 'homework', 8.0, 10, 1.0, NULL, '2024-12-05'),
(1, 2, 'Quiz CSS', 'quiz', 7.5, 10, 1.0, NULL, '2024-12-12'),
(1, 3, 'Bài tập HTML', 'homework', 9.5, 10, 1.0, NULL, '2024-12-05'),
(1, 3, 'Quiz CSS', 'quiz', 9.0, 10, 1.0, NULL, '2024-12-12'),
(1, 4, 'Bài tập HTML', 'homework', 7.5, 10, 1.0, NULL, '2024-12-05'),
(1, 4, 'Quiz CSS', 'quiz', 8.0, 10, 1.0, NULL, '2024-12-12'),
(1, 5, 'Bài tập HTML', 'homework', 6.5, 10, 1.0, 'Nộp muộn', '2024-12-05'),
(1, 5, 'Quiz CSS', 'quiz', 7.0, 10, 1.0, NULL, '2024-12-12'),

-- WEB102
(2, 6, 'Bài tập Node.js', 'homework', 9.0, 10, 1.0, NULL, '2024-12-08'),
(2, 7, 'Bài tập Node.js', 'homework', 7.5, 10, 1.0, NULL, '2024-12-08'),
(2, 8, 'Bài tập Node.js', 'homework', 8.5, 10, 1.0, NULL, '2024-12-08'),
(2, 9, 'Bài tập Node.js', 'homework', 8.0, 10, 1.0, NULL, '2024-12-08'),

-- DB101
(3, 10, 'Quiz SQL cơ bản', 'quiz', 9.5, 10, 1.0, NULL, '2024-12-06'),
(3, 11, 'Quiz SQL cơ bản', 'quiz', 8.0, 10, 1.0, NULL, '2024-12-06'),
(3, 12, 'Quiz SQL cơ bản', 'quiz', 8.5, 10, 1.0, NULL, '2024-12-06'),
(3, 13, 'Quiz SQL cơ bản', 'quiz', 7.5, 10, 1.0, NULL, '2024-12-06'),

-- JAVA101
(4, 14, 'Bài tập OOP', 'homework', 9.0, 10, 1.0, NULL, '2024-12-10'),
(4, 15, 'Bài tập OOP', 'homework', 8.5, 10, 1.0, NULL, '2024-12-10'),
(4, 16, 'Bài tập OOP', 'homework', 9.5, 10, 1.0, 'Xuất sắc', '2024-12-10'),
(4, 17, 'Bài tập OOP', 'homework', 0, 10, 1.0, 'Chưa nộp', '2024-12-10');

-- =====================================================
-- 10. TẠO HOLIDAYS (Ngày nghỉ)
-- =====================================================
INSERT INTO holidays (name, date, description) VALUES
('Tết Dương lịch', '2025-01-01', 'Nghỉ Tết Dương lịch'),
('Tết Nguyên đán', '2025-01-29', 'Nghỉ Tết Nguyên đán'),
('Tết Nguyên đán', '2025-01-30', 'Nghỉ Tết Nguyên đán'),
('Tết Nguyên đán', '2025-01-31', 'Nghỉ Tết Nguyên đán'),
('Tết Nguyên đán', '2025-02-01', 'Nghỉ Tết Nguyên đán'),
('Tết Nguyên đán', '2025-02-02', 'Nghỉ Tết Nguyên đán'),
('Giỗ tổ Hùng Vương', '2025-04-07', 'Nghỉ Giỗ tổ'),
('Ngày Giải phóng', '2025-04-30', 'Nghỉ 30/4'),
('Quốc tế Lao động', '2025-05-01', 'Nghỉ 1/5'),
('Quốc khánh', '2025-09-02', 'Nghỉ Quốc khánh');

-- =====================================================
-- 11. TẠO SAMPLE NOTIFICATIONS
-- =====================================================
INSERT INTO notifications (user_id, type, title, message, data, is_read, sent_email) VALUES
(2, 'system', 'Chào mừng đến với ClassFlow', 'Xin chào Nguyễn Văn Minh! Chúc bạn có trải nghiệm tốt với hệ thống.', NULL, 1, 0),
(5, 'system', 'Chào mừng đến với ClassFlow', 'Xin chào Võ Thị Mai! Chúc bạn có trải nghiệm tốt với hệ thống.', NULL, 0, 0),
(2, 'reminder', 'Nhắc nhở điểm danh', 'Lớp WEB101 có buổi học vào ngày mai lúc 18:00', '{"classId": 1, "sessionNumber": 4}', 0, 0);

-- =====================================================
-- 12. TẠO SAMPLE ACTIVITY LOGS
-- =====================================================
INSERT INTO activity_logs (user_id, action, entity_type, entity_id, old_data, new_data, ip_address) VALUES
(1, 'login', 'user', 1, NULL, NULL, '127.0.0.1'),
(1, 'create', 'class', 1, NULL, '{"code": "WEB101", "name": "Lập trình Web Frontend"}', '127.0.0.1'),
(1, 'create', 'student', 1, NULL, '{"code": "HS001", "name": "Nguyễn Văn An"}', '127.0.0.1'),
(2, 'login', 'user', 2, NULL, NULL, '192.168.1.100'),
(2, 'create', 'attendance', NULL, NULL, '{"classId": 1, "session": 1}', '192.168.1.100');

-- =====================================================
-- HOÀN TẤT SEED DATA
-- =====================================================
SELECT 'Seed data inserted successfully!' AS Status;
SELECT 
    (SELECT COUNT(*) FROM users) AS users,
    (SELECT COUNT(*) FROM teachers) AS teachers,
    (SELECT COUNT(*) FROM cms) AS cms,
    (SELECT COUNT(*) FROM classes) AS classes,
    (SELECT COUNT(*) FROM students) AS students,
    (SELECT COUNT(*) FROM sessions) AS sessions,
    (SELECT COUNT(*) FROM attendance) AS attendance,
    (SELECT COUNT(*) FROM grades) AS grades;
