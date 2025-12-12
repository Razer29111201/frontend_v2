// src/controllers/gradeController.js
import { query, transaction } from '../config/database.js';
import { sendGradeNotification } from '../services/emailService.js';
import logger from '../utils/logger.js';

class GradeController {
    static async getByClass(req, res) {
        try {
            const grades = await query(
                `SELECT g.*, s.name as student_name, s.code as student_code 
                 FROM grades g 
                 LEFT JOIN students s ON g.student_id = s.id 
                 WHERE g.class_id = ? 
                 ORDER BY g.assignment_name, s.name`,
                [req.params.classId]
            );
            res.json({ success: true, data: grades });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getByStudent(req, res) {
        try {
            const grades = await query(
                `SELECT g.*, c.name as class_name 
                 FROM grades g 
                 LEFT JOIN classes c ON g.class_id = c.id 
                 WHERE g.student_id = ? 
                 ORDER BY g.graded_at DESC`,
                [req.params.studentId]
            );
            
            // Calculate average
            const total = grades.reduce((sum, g) => sum + (g.score / g.max_score * 10 * g.weight), 0);
            const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
            const average = totalWeight > 0 ? (total / totalWeight).toFixed(2) : 0;

            res.json({ success: true, data: { grades, average } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const { classId, studentId, assignmentName, assignmentType, score, maxScore, weight, note, sendNotification } = req.body;
            
            const result = await query(
                `INSERT INTO grades (class_id, student_id, assignment_name, assignment_type, score, max_score, weight, note, graded_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
                [classId, studentId, assignmentName, assignmentType || 'homework', score, maxScore || 10, weight || 1, note]
            );

            // Send notification
            if (sendNotification) {
                const [student] = await query('SELECT name, parent_email FROM students WHERE id = ?', [studentId]);
                const [cls] = await query('SELECT name FROM classes WHERE id = ?', [classId]);
                if (student?.parent_email) {
                    try {
                        await sendGradeNotification(student.parent_email, student.name, cls?.name, assignmentName, score, maxScore || 10);
                    } catch (e) { logger.warn('Grade notification failed:', e); }
                }
            }

            res.status(201).json({ success: true, data: { id: result.insertId, classId, studentId, assignmentName, score, maxScore } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { assignmentName, assignmentType, score, maxScore, weight, note } = req.body;
            const result = await query(
                'UPDATE grades SET assignment_name=?, assignment_type=?, score=?, max_score=?, weight=?, note=? WHERE id=?',
                [assignmentName, assignmentType, score, maxScore, weight, note, req.params.id]
            );
            if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy điểm' });
            res.json({ success: true, message: 'Cập nhật điểm thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const result = await query('DELETE FROM grades WHERE id = ?', [req.params.id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy điểm' });
            res.json({ success: true, message: 'Đã xóa điểm thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async bulkCreate(req, res) {
        try {
            const { classId, assignmentName, assignmentType, maxScore, grades } = req.body;
            
            await transaction(async (conn) => {
                for (const g of grades) {
                    await conn.query(
                        `INSERT INTO grades (class_id, student_id, assignment_name, assignment_type, score, max_score, graded_at)
                         VALUES (?, ?, ?, ?, ?, ?, CURDATE())
                         ON DUPLICATE KEY UPDATE score = VALUES(score)`,
                        [classId, g.studentId, assignmentName, assignmentType || 'homework', g.score, maxScore || 10]
                    );
                }
            });

            res.json({ success: true, message: `Đã lưu ${grades.length} điểm` });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getClassAverage(req, res) {
        try {
            const { classId } = req.params;
            const students = await query('SELECT id, name, code FROM students WHERE class_id = ?', [classId]);
            
            const result = await Promise.all(students.map(async (s) => {
                const grades = await query('SELECT score, max_score, weight FROM grades WHERE student_id = ?', [s.id]);
                const total = grades.reduce((sum, g) => sum + (g.score / g.max_score * 10 * g.weight), 0);
                const totalWeight = grades.reduce((sum, g) => sum + g.weight, 0);
                const average = totalWeight > 0 ? (total / totalWeight).toFixed(2) : null;
                return { studentId: s.id, studentName: s.name, studentCode: s.code, average: average ? parseFloat(average) : null, gradeCount: grades.length };
            }));

            // Sort by average descending
            result.sort((a, b) => (b.average || 0) - (a.average || 0));

            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default GradeController;
