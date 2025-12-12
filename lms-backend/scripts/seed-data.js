// scripts/seed-data.js
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3306
};

async function seedData() {
    let connection;
    try {
        console.log('🔌 Đang kết nối database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Đã kết nối!\n');

        // Create admin user
        const adminPassword = await bcrypt.hash('admin123', 10);
        await connection.query(
            `INSERT IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`,
            ['admin@classflow.com', adminPassword, 'Admin', 0]
        );
        console.log('✅ Tạo admin user: admin@classflow.com / admin123');

        // Create sample teacher
        await connection.query(
            `INSERT IGNORE INTO teachers (code, name, email, phone, subject, active) VALUES (?, ?, ?, ?, ?, ?)`,
            ['GV001', 'Nguyễn Văn A', 'teacher@classflow.com', '0901234567', 'Lập trình Web', 1]
        );
        console.log('✅ Tạo sample teacher');

        // Create sample CM
        await connection.query(
            `INSERT IGNORE INTO cms (code, name, email, phone, active) VALUES (?, ?, ?, ?, ?)`,
            ['CM001', 'Trần Thị B', 'cm@classflow.com', '0912345678', 1]
        );
        console.log('✅ Tạo sample CM');

        console.log('\n✅ Seed data hoàn tất!');

    } catch (error) {
        console.error('\n❌ Lỗi:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

seedData();
