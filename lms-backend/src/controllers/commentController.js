// src/controllers/commentController.js
import { query, transaction } from '../config/database.js';

class CommentController {
    static async getByClass(req, res) {
        try {
            const comments = await query(
                `SELECT c.*, s.name as student_name FROM comments c 
                 LEFT JOIN students s ON c.student_id = s.id 
                 WHERE c.class_id = ? ORDER BY s.name`,
                [req.params.classId]
            );
            const result = {};
            comments.forEach(c => { result[c.student_id] = c.comment; });
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getByStudent(req, res) {
        try {
            const [comment] = await query('SELECT * FROM comments WHERE student_id = ?', [req.params.studentId]);
            res.json({ success: true, data: comment || null });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async save(req, res) {
        try {
            const { classId, comments } = req.body;
            if (!classId) return res.status(400).json({ success: false, error: 'Class ID is required' });

            await transaction(async (conn) => {
                await conn.query('DELETE FROM comments WHERE class_id = ?', [classId]);
                if (comments && typeof comments === 'object') {
                    for (const [studentId, comment] of Object.entries(comments)) {
                        if (comment && comment.trim()) {
                            await conn.query('INSERT INTO comments (class_id, student_id, comment) VALUES (?, ?, ?)', [classId, studentId, comment.trim()]);
                        }
                    }
                }
            });

            res.json({ success: true, message: 'Lưu nhận xét thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { classId, studentId } = req.params;
            const { comment } = req.body;
            
            if (!comment || !comment.trim()) {
                await query('DELETE FROM comments WHERE class_id = ? AND student_id = ?', [classId, studentId]);
                return res.json({ success: true, message: 'Đã xóa nhận xét' });
            }

            await query(
                `INSERT INTO comments (class_id, student_id, comment) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE comment = ?`,
                [classId, studentId, comment.trim(), comment.trim()]
            );
            res.json({ success: true, message: 'Cập nhật nhận xét thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const { classId, studentId } = req.params;
            const result = await query('DELETE FROM comments WHERE class_id = ? AND student_id = ?', [classId, studentId]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy nhận xét' });
            res.json({ success: true, message: 'Đã xóa nhận xét' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default CommentController;
