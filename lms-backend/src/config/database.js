// src/config/database.js
import mysql from 'mysql2/promise';
import logger from '../utils/logger.js';
import 'dotenv/config';
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

let pool;

export const initDB = async () => {
    try {
        pool = mysql.createPool(dbConfig);
        const conn = await pool.getConnection();
        logger.info('✅ Database connected successfully');
        conn.release();

        // Tạo tables nếu chưa có
        await createTables();

        return pool;
    } catch (error) {
        logger.error('❌ Database connection failed:', error.message);
        throw error;
    }
};

export const getPool = () => {
    if (!pool) {
        throw new Error('Database pool not initialized. Call initDB first.');
    }
    return pool;
};

export const query = async (sql, params) => {
    const conn = await pool.getConnection();
    try {
        const [results] = await conn.query(sql, params);
        return results;
    } finally {
        conn.release();
    }
};

export const transaction = async (callback) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const result = await callback(conn);
        await conn.commit();
        return result;
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

// Tạo tables
const createTables = async () => {
    const tables = `
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role TINYINT DEFAULT 2 COMMENT '0=Admin, 1=Teacher, 2=CM',
            teacher_id INT NULL,
            cm_id INT NULL,
            avatar VARCHAR(500) NULL,
            reset_token VARCHAR(255) NULL,
            reset_token_expires DATETIME NULL,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- Teachers table
        CREATE TABLE IF NOT EXISTS teachers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(20),
            subject VARCHAR(255),
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- CMs table
        CREATE TABLE IF NOT EXISTS cms (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) UNIQUE,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(20),
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );

        -- Classes table
        CREATE TABLE IF NOT EXISTS classes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            teacher VARCHAR(255),
            teacher_id INT,
            cm VARCHAR(255),
            cm_id INT,
            start_date DATE,
            end_date DATE,
            week_day TINYINT DEFAULT 1,
            time_slot VARCHAR(50),
            color VARCHAR(20) DEFAULT 'green',
            total_sessions INT DEFAULT 15,
            status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
            FOREIGN KEY (cm_id) REFERENCES cms(id) ON DELETE SET NULL
        );

        -- Students table
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(20),
            class_id INT,
            class_name VARCHAR(100),
            parent_name VARCHAR(255),
            parent_phone VARCHAR(20),
            parent_email VARCHAR(255),
            address TEXT,
            dob DATE,
            gender ENUM('male', 'female', 'other'),
            avatar VARCHAR(500),
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
        );

        -- Sessions table
        CREATE TABLE IF NOT EXISTS sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            session_number INT NOT NULL,
            date DATE NOT NULL,
            status ENUM('scheduled', 'completed', 'cancelled', 'rescheduled') DEFAULT 'scheduled',
            note TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            UNIQUE KEY unique_session (class_id, session_number)
        );

        -- Attendance table
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            session INT NOT NULL,
            student_id INT NOT NULL,
            status ENUM('on-time', 'late', 'excused', 'absent') DEFAULT 'on-time',
            note TEXT,
            check_in_time DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            UNIQUE KEY unique_attendance (class_id, session, student_id)
        );

        -- Comments table
        CREATE TABLE IF NOT EXISTS comments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            student_id INT NOT NULL,
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
            UNIQUE KEY unique_comment (class_id, student_id)
        );

        -- Grades table (MỚI)
        CREATE TABLE IF NOT EXISTS grades (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT NOT NULL,
            student_id INT NOT NULL,
            assignment_name VARCHAR(255) NOT NULL,
            assignment_type ENUM('homework', 'quiz', 'midterm', 'final', 'project', 'other') DEFAULT 'homework',
            score DECIMAL(5,2),
            max_score DECIMAL(5,2) DEFAULT 10,
            weight DECIMAL(3,2) DEFAULT 1.00,
            note TEXT,
            graded_at DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        );

        -- Notifications table (MỚI)
        CREATE TABLE IF NOT EXISTS notifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            type ENUM('attendance', 'grade', 'announcement', 'reminder', 'system') DEFAULT 'system',
            title VARCHAR(255) NOT NULL,
            message TEXT,
            data JSON,
            is_read BOOLEAN DEFAULT FALSE,
            sent_email BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Files table (MỚI)
        CREATE TABLE IF NOT EXISTS files (
            id INT AUTO_INCREMENT PRIMARY KEY,
            class_id INT,
            uploader_id INT,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255),
            file_type VARCHAR(50),
            file_size INT,
            url VARCHAR(500) NOT NULL,
            public_id VARCHAR(255),
            category ENUM('material', 'assignment', 'submission', 'other') DEFAULT 'other',
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL,
            FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL
        );

        -- Holidays table (MỚI)
        CREATE TABLE IF NOT EXISTS holidays (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            date DATE NOT NULL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Activity logs table (MỚI)
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(50),
            entity_id INT,
            old_data JSON,
            new_data JSON,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
    `;

    const statements = tables.split(';').filter(s => s.trim());
    for (const statement of statements) {
        if (statement.trim()) {
            try {
                await query(statement);
            } catch (error) {
                // Ignore errors for existing tables
                if (!error.message.includes('already exists')) {
                    logger.warn('Table creation warning:', error.message);
                }
            }
        }
    }

    logger.info('✅ Database tables verified');
};

export default { initDB, getPool, query, transaction };
