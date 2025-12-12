// src/controllers/studentController.js
import { query } from '../config/database.js';

class StudentController {
    static async getAll(req, res) {
        try {
            const { classId } = req.query;
            let sql = 'SELECT * FROM students';
            const params = [];
            if (classId) { sql += ' WHERE class_id = ?'; params.push(classId); }
            sql += ' ORDER BY name ASC';
            const students = await query(sql, params);
            res.json({ success: true, data: students.map(s => ({
                id: s.id, code: s.code, name: s.name, email: s.email, phone: s.phone,
                classId: s.class_id, className: s.class_name, parentName: s.parent_name,
                parentPhone: s.parent_phone, parentEmail: s.parent_email, createdAt: s.created_at
            }))});
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getOne(req, res) {
        try {
            const [student] = await query('SELECT * FROM students WHERE id = ?', [req.params.id]);
            if (!student) return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh' });
            res.json({ success: true, data: student });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const { code, name, email, phone, classId, className, parentName, parentPhone, parentEmail, dob, gender, address } = req.body;
            const [existing] = await query('SELECT id FROM students WHERE code = ?', [code]);
            if (existing) return res.status(409).json({ success: false, error: 'Mã học sinh đã tồn tại' });

            const result = await query(
                `INSERT INTO students (code, name, email, phone, class_id, class_name, parent_name, parent_phone, parent_email, dob, gender, address)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [code, name, email, phone, classId, className, parentName, parentPhone, parentEmail, dob, gender, address]
            );
            res.status(201).json({ success: true, data: { id: result.insertId, code, name, email, phone, classId, className } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { code, name, email, phone, classId, className, parentName, parentPhone, parentEmail, dob, gender, address } = req.body;
            const result = await query(
                `UPDATE students SET code=?, name=?, email=?, phone=?, class_id=?, class_name=?, parent_name=?, parent_phone=?, parent_email=?, dob=?, gender=?, address=? WHERE id=?`,
                [code, name, email, phone, classId, className, parentName, parentPhone, parentEmail, dob, gender, address, req.params.id]
            );
            if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh' });
            res.json({ success: true, data: { id: parseInt(req.params.id), code, name, email, phone, classId, className } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const result = await query('DELETE FROM students WHERE id = ?', [req.params.id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh' });
            res.json({ success: true, message: 'Đã xóa học sinh thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default StudentController;
