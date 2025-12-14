// src/controllers/attendanceController.js
import { query, transaction } from '../config/database.js';
import logger from '../utils/logger.js';

class AttendanceController {
    /**
     * Get attendance by class and date
     */
    static async getByClass(req, res) {
        try {
            const { classId } = req.params;
            const { date, startDate, endDate } = req.query;

            let sql = `
                SELECT 
                    a.*,
                    s.code as student_code,
                    s.name as student_name,
                    u.name as created_by_name
                FROM attendance a
                JOIN students s ON a.student_id = s.id
                LEFT JOIN users u ON a.created_by = u.id
                WHERE a.class_id = ?
            `;
            const params = [classId];

            if (date) {
                sql += ' AND a.date = ?';
                params.push(date);
            }

            if (startDate && endDate) {
                sql += ' AND a.date BETWEEN ? AND ?';
                params.push(startDate, endDate);
            }

            sql += ' ORDER BY a.date DESC, s.code';

            const attendance = await query(sql, params);

            res.json({
                success: true,
                data: attendance.map(a => ({
                    id: a.id,
                    classId: a.class_id,
                    studentId: a.student_id,
                    studentCode: a.student_code,
                    studentName: a.student_name,
                    date: a.date,
                    status: a.status,
                    notes: a.notes,
                    createdBy: a.created_by,
                    createdByName: a.created_by_name,
                    createdAt: a.created_at
                }))
            });
        } catch (error) {
            logger.error('Get attendance by class error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get attendance by student
     */
    static async getByStudent(req, res) {
        try {
            const { studentId } = req.params;
            const { startDate, endDate } = req.query;

            let sql = `
                SELECT 
                    a.*,
                    c.code as class_code,
                    c.name as class_name
                FROM attendance a
                JOIN classes c ON a.class_id = c.id
                WHERE a.student_id = ?
            `;
            const params = [studentId];

            if (startDate && endDate) {
                sql += ' AND a.date BETWEEN ? AND ?';
                params.push(startDate, endDate);
            }

            sql += ' ORDER BY a.date DESC';

            const attendance = await query(sql, params);

            res.json({
                success: true,
                data: attendance.map(a => ({
                    id: a.id,
                    classId: a.class_id,
                    classCode: a.class_code,
                    className: a.class_name,
                    date: a.date,
                    status: a.status,
                    notes: a.notes
                }))
            });
        } catch (error) {
            logger.error('Get attendance by student error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Mark attendance (single or bulk)
     */
    static async mark(req, res) {
        try {
            const { classId, date, attendances } = req.body;
            // attendances = [{ studentId, status, notes }, ...]

            if (!classId || !date || !Array.isArray(attendances)) {
                return res.status(400).json({
                    success: false,
                    error: 'Thiếu thông tin bắt buộc'
                });
            }

            const createdBy = req.user.id;

            await transaction(async (conn) => {
                for (const att of attendances) {
                    // Check if attendance already exists
                    const [existing] = await conn.query(
                        'SELECT id FROM attendance WHERE class_id = ? AND student_id = ? AND date = ?',
                        [classId, att.studentId, date]
                    );

                    if (existing) {
                        // Update existing
                        await conn.query(
                            `UPDATE attendance 
                             SET status = ?, notes = ?, created_by = ?
                             WHERE id = ?`,
                            [att.status, att.notes || null, createdBy, existing.id]
                        );
                    } else {
                        // Insert new
                        await conn.query(
                            `INSERT INTO attendance (class_id, student_id, date, status, notes, created_by)
                             VALUES (?, ?, ?, ?, ?, ?)`,
                            [classId, att.studentId, date, att.status, att.notes || null, createdBy]
                        );
                    }
                }
            });

            res.json({
                success: true,
                message: `Đã điểm danh ${attendances.length} học viên`
            });
        } catch (error) {
            logger.error('Mark attendance error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update single attendance record
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;

            await query(
                `UPDATE attendance 
                 SET status = ?, notes = ?
                 WHERE id = ?`,
                [status, notes, id]
            );

            res.json({
                success: true,
                message: 'Cập nhật điểm danh thành công'
            });
        } catch (error) {
            logger.error('Update attendance error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Delete attendance record
     */
    static async delete(req, res) {
        try {
            const result = await query(
                'DELETE FROM attendance WHERE id = ?',
                [req.params.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy bản ghi điểm danh'
                });
            }

            res.json({
                success: true,
                message: 'Đã xóa bản ghi điểm danh'
            });
        } catch (error) {
            logger.error('Delete attendance error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get attendance statistics by class
     */
    static async getStatsByClass(req, res) {
        try {
            const { classId } = req.params;
            const { startDate, endDate } = req.query;

            let sql = `
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(DISTINCT date) as total_sessions,
                    COUNT(DISTINCT student_id) as total_students,
                    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
                    COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
                    COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused_count
                FROM attendance
                WHERE class_id = ?
            `;
            const params = [classId];

            if (startDate && endDate) {
                sql += ' AND date BETWEEN ? AND ?';
                params.push(startDate, endDate);
            }

            const [stats] = await query(sql, params);

            res.json({
                success: true,
                data: {
                    totalRecords: stats.total_records || 0,
                    totalSessions: stats.total_sessions || 0,
                    totalStudents: stats.total_students || 0,
                    presentCount: stats.present_count || 0,
                    absentCount: stats.absent_count || 0,
                    lateCount: stats.late_count || 0,
                    excusedCount: stats.excused_count || 0,
                    attendanceRate: stats.total_records > 0
                        ? ((stats.present_count / stats.total_records) * 100).toFixed(2)
                        : 0
                }
            });
        } catch (error) {
            logger.error('Get attendance stats error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get attendance statistics by student
     */
    static async getStatsByStudent(req, res) {
        try {
            const { studentId } = req.params;
            const { startDate, endDate } = req.query;

            let sql = `
                SELECT 
                    COUNT(*) as total_records,
                    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
                    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
                    COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
                    COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused_count
                FROM attendance
                WHERE student_id = ?
            `;
            const params = [studentId];

            if (startDate && endDate) {
                sql += ' AND date BETWEEN ? AND ?';
                params.push(startDate, endDate);
            }

            const [stats] = await query(sql, params);

            res.json({
                success: true,
                data: {
                    totalRecords: stats.total_records || 0,
                    presentCount: stats.present_count || 0,
                    absentCount: stats.absent_count || 0,
                    lateCount: stats.late_count || 0,
                    excusedCount: stats.excused_count || 0,
                    attendanceRate: stats.total_records > 0
                        ? ((stats.present_count / stats.total_records) * 100).toFixed(2)
                        : 0
                }
            });
        } catch (error) {
            logger.error('Get student attendance stats error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get attendance dates (sessions) for a class
     */
    static async getDates(req, res) {
        try {
            const { classId } = req.params;

            const dates = await query(`
                SELECT DISTINCT date
                FROM attendance
                WHERE class_id = ?
                ORDER BY date DESC
            `, [classId]);

            res.json({
                success: true,
                data: dates.map(d => d.date)
            });
        } catch (error) {
            logger.error('Get attendance dates error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get attendance summary for a specific date
     */
    static async getSummaryByDate(req, res) {
        try {
            const { classId } = req.params;
            const { date } = req.query;

            if (!date) {
                return res.status(400).json({
                    success: false,
                    error: 'Thiếu tham số date'
                });
            }

            // Get all students in class
            const students = await query(
                'SELECT id, code, name FROM students WHERE class_id = ? AND status = "active" ORDER BY code',
                [classId]
            );

            // Get attendance for this date
            const attendance = await query(
                'SELECT student_id, status, notes FROM attendance WHERE class_id = ? AND date = ?',
                [classId, date]
            );

            // Map attendance to students
            const attendanceMap = {};
            attendance.forEach(a => {
                attendanceMap[a.student_id] = {
                    status: a.status,
                    notes: a.notes
                };
            });

            const summary = students.map(s => ({
                studentId: s.id,
                studentCode: s.code,
                studentName: s.name,
                status: attendanceMap[s.id]?.status || null,
                notes: attendanceMap[s.id]?.notes || null
            }));

            res.json({
                success: true,
                data: {
                    date,
                    classId,
                    students: summary,
                    stats: {
                        total: students.length,
                        present: summary.filter(s => s.status === 'present').length,
                        absent: summary.filter(s => s.status === 'absent').length,
                        late: summary.filter(s => s.status === 'late').length,
                        excused: summary.filter(s => s.status === 'excused').length,
                        notMarked: summary.filter(s => !s.status).length
                    }
                }
            });
        } catch (error) {
            logger.error('Get attendance summary error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default AttendanceController;