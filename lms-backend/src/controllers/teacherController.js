// src/controllers/teacherController.js
import { query } from '../config/database.js';

class TeacherController {
    static async getAll(req, res) {
        try {
            const { active } = req.query;
            let sql = 'SELECT * FROM teachers';
            if (active === 'true') sql += ' WHERE active = 1';
            sql += ' ORDER BY name ASC';
            const teachers = await query(sql);
            res.json({ success: true, data: teachers });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getOne(req, res) {
        try {
            const [teacher] = await query('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
            if (!teacher) return res.status(404).json({ success: false, error: 'Không tìm thấy giáo viên' });
            res.json({ success: true, data: teacher });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const { code, name, email, phone, subject, active } = req.body;
            const [existing] = await query('SELECT id FROM teachers WHERE code = ?', [code]);
            if (existing) return res.status(409).json({ success: false, error: 'Mã giáo viên đã tồn tại' });

            const result = await query(
                'INSERT INTO teachers (code, name, email, phone, subject, active) VALUES (?, ?, ?, ?, ?, ?)',
                [code, name, email, phone, subject, active !== false]
            );
            res.status(201).json({ success: true, data: { id: result.insertId, code, name, email, phone, subject, active: active !== false } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { code, name, email, phone, subject, active } = req.body;
            const result = await query(
                'UPDATE teachers SET code=?, name=?, email=?, phone=?, subject=?, active=? WHERE id=?',
                [code, name, email, phone, subject, active !== false, req.params.id]
            );
            if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy giáo viên' });
            res.json({ success: true, data: { id: parseInt(req.params.id), code, name, email, phone, subject, active } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            await query('UPDATE classes SET teacher = NULL, teacher_id = NULL WHERE teacher_id = ?', [req.params.id]);
            const result = await query('DELETE FROM teachers WHERE id = ?', [req.params.id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy giáo viên' });
            res.json({ success: true, message: 'Đã xóa giáo viên thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default TeacherController;
