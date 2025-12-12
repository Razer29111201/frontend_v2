// src/controllers/attendanceController.js
import { query, transaction } from '../config/database.js';
import { sendAttendanceNotification } from '../services/emailService.js';
import logger from '../utils/logger.js';

class AttendanceController {
    static async getByClassAndSession(req, res) {
        try {
            const { classId, session } = req.params;
            const records = await query(
                `SELECT a.*, s.name as student_name, s.code as student_code 
                 FROM attendance a 
                 LEFT JOIN students s ON a.student_id = s.id 
                 WHERE a.class_id = ? AND a.session = ? 
                 ORDER BY s.name ASC`,
                [classId, session]
            );
            res.json({ success: true, data: records.map(r => ({
                id: r.id, classId: r.class_id, session: r.session, studentId: r.student_id,
                studentName: r.student_name, studentCode: r.student_code, status: r.status, note: r.note
            }))});
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async save(req, res) {
        try {
            const { classId, session, records, sendNotification } = req.body;
            if (!classId || !session || !Array.isArray(records)) {
                return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ' });
            }

            await transaction(async (conn) => {
                await conn.query('DELETE FROM attendance WHERE class_id = ? AND session = ?', [classId, session]);
                for (const record of records) {
                    if (!record.studentId) continue;
                    await conn.query(
                        'INSERT INTO attendance (class_id, session, student_id, status, note, check_in_time) VALUES (?, ?, ?, ?, ?, NOW())',
                        [parseInt(classId), parseInt(session), parseInt(record.studentId), record.status || 'on-time', record.note || '']
                    );
                }
            });

            // Send notifications for absent/late students
            if (sendNotification) {
                const [cls] = await query('SELECT name FROM classes WHERE id = ?', [classId]);
                const [sess] = await query('SELECT date FROM sessions WHERE class_id = ? AND session_number = ?', [classId, session]);
                
                for (const record of records) {
                    if (record.status === 'absent' || record.status === 'late') {
                        const [student] = await query('SELECT name, parent_email FROM students WHERE id = ?', [record.studentId]);
                        if (student?.parent_email) {
                            try {
                                await sendAttendanceNotification(student.parent_email, student.name, cls?.name, record.status, sess?.date);
                            } catch (e) { logger.warn('Notification failed:', e); }
                        }
                    }
                }
            }

            res.json({ success: true, message: 'Lưu điểm danh thành công', data: { classId: parseInt(classId), session: parseInt(session), recordCount: records.length } });
        } catch (error) {
            logger.error('Save attendance error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getByClass(req, res) {
        try {
            const records = await query('SELECT * FROM attendance WHERE class_id = ? ORDER BY session ASC, student_id ASC', [req.params.classId]);
            res.json({ success: true, data: records.map(r => ({ id: r.id, classId: r.class_id, session: r.session, studentId: r.student_id, status: r.status, note: r.note })) });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getStatsByClass(req, res) {
        try {
            const stats = await query('SELECT status, COUNT(*) as count FROM attendance WHERE class_id = ? GROUP BY status', [req.params.classId]);
            res.json({ success: true, data: stats });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getStatsByStudent(req, res) {
        try {
            const stats = await query('SELECT status, COUNT(*) as count FROM attendance WHERE student_id = ? GROUP BY status', [req.params.studentId]);
            const total = stats.reduce((sum, s) => sum + s.count, 0);
            const result = { onTime: 0, late: 0, excused: 0, absent: 0, total };
            stats.forEach(s => {
                if (s.status === 'on-time') result.onTime = s.count;
                else if (s.status === 'late') result.late = s.count;
                else if (s.status === 'excused') result.excused = s.count;
                else if (s.status === 'absent') result.absent = s.count;
            });
            result.attendanceRate = total > 0 ? (((result.onTime + result.late) / total) * 100).toFixed(1) : 0;
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const { classId, session } = req.params;
            const result = await query('DELETE FROM attendance WHERE class_id = ? AND session = ?', [classId, session]);
            res.json({ success: true, message: `Đã xóa ${result.affectedRows} bản ghi điểm danh` });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default AttendanceController;
