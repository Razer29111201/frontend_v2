// src/controllers/dashboardController.js
import { query } from '../config/database.js';
import { ROLES } from '../config/constants.js';

class DashboardController {
    static async getStats(req, res) {
        try {
            const { role, teacherId, cmId } = req.user;
            
            let classFilter = '';
            const params = [];
            
            if (role === ROLES.TEACHER && teacherId) {
                classFilter = ' WHERE teacher_id = ?';
                params.push(teacherId);
            } else if (role === ROLES.CM && cmId) {
                classFilter = ' WHERE cm_id = ?';
                params.push(cmId);
            }

            // Get counts
            const [classCount] = await query(`SELECT COUNT(*) as count FROM classes${classFilter}`, params);
            const [studentCount] = await query('SELECT COUNT(*) as count FROM students');
            const [teacherCount] = await query('SELECT COUNT(*) as count FROM teachers WHERE active = 1');
            const [cmCount] = await query('SELECT COUNT(*) as count FROM cms WHERE active = 1');

            // Get recent attendance stats
            const attendanceStats = await query(`
                SELECT status, COUNT(*) as count 
                FROM attendance 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY status
            `);

            // Get recent classes
            const recentClasses = await query(`
                SELECT c.*, 
                    (SELECT COUNT(*) FROM students WHERE class_id = c.id) as student_count
                FROM classes c ${classFilter}
                ORDER BY c.created_at DESC LIMIT 5
            `, params);

            // Get upcoming sessions
            const upcomingSessions = await query(`
                SELECT s.*, c.name as class_name, c.code as class_code
                FROM sessions s
                JOIN classes c ON s.class_id = c.id
                WHERE s.date >= CURDATE() AND s.status = 'scheduled'
                ${classFilter ? classFilter.replace('WHERE', 'AND') : ''}
                ORDER BY s.date ASC LIMIT 10
            `, params);

            res.json({
                success: true,
                data: {
                    counts: {
                        classes: classCount[0]?.count || 0,
                        students: studentCount[0]?.count || 0,
                        teachers: teacherCount[0]?.count || 0,
                        cms: cmCount[0]?.count || 0
                    },
                    attendanceStats: {
                        onTime: attendanceStats.find(s => s.status === 'on-time')?.count || 0,
                        late: attendanceStats.find(s => s.status === 'late')?.count || 0,
                        excused: attendanceStats.find(s => s.status === 'excused')?.count || 0,
                        absent: attendanceStats.find(s => s.status === 'absent')?.count || 0
                    },
                    recentClasses: recentClasses.map(c => ({
                        id: c.id, code: c.code, name: c.name, teacher: c.teacher,
                        students: c.student_count, startDate: c.start_date, color: c.color
                    })),
                    upcomingSessions: upcomingSessions.map(s => ({
                        id: s.id, classId: s.class_id, className: s.class_name, classCode: s.class_code,
                        sessionNumber: s.session_number, date: s.date
                    }))
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getAttendanceReport(req, res) {
        try {
            const { classId, startDate, endDate } = req.query;
            
            let sql = `
                SELECT 
                    DATE(a.created_at) as date,
                    a.status,
                    COUNT(*) as count
                FROM attendance a
                WHERE 1=1
            `;
            const params = [];

            if (classId) {
                sql += ' AND a.class_id = ?';
                params.push(classId);
            }
            if (startDate) {
                sql += ' AND DATE(a.created_at) >= ?';
                params.push(startDate);
            }
            if (endDate) {
                sql += ' AND DATE(a.created_at) <= ?';
                params.push(endDate);
            }

            sql += ' GROUP BY DATE(a.created_at), a.status ORDER BY date DESC';

            const data = await query(sql, params);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getTopAbsentStudents(req, res) {
        try {
            const { classId, limit } = req.query;
            
            let sql = `
                SELECT 
                    s.id, s.code, s.name, s.class_name,
                    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
                    COUNT(a.id) as total_sessions
                FROM students s
                LEFT JOIN attendance a ON s.id = a.student_id
            `;
            const params = [];

            if (classId) {
                sql += ' WHERE s.class_id = ?';
                params.push(classId);
            }

            sql += ` GROUP BY s.id ORDER BY absent_count DESC LIMIT ?`;
            params.push(parseInt(limit) || 10);

            const data = await query(sql, params);
            res.json({ success: true, data });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default DashboardController;
