// src/controllers/classController.js
import { query, transaction } from '../config/database.js';
import { generateSessionDates } from '../utils/dateUtils.js';

class ClassController {
    static async getAll(req, res) {
        try {
            const classes = await query('SELECT * FROM classes ORDER BY created_at DESC');
            const result = await Promise.all(classes.map(async (c) => {
                const [studentCount] = await query('SELECT COUNT(*) as count FROM students WHERE class_id = ?', [c.id]);
                const sessions = await query('SELECT * FROM sessions WHERE class_id = ? ORDER BY session_number', [c.id]);
                return {
                    id: c.id, code: c.code, name: c.name, teacherId: c.teacherid,
                    cmId: c.cm_id, students: studentCount[0]?.count || 0, startDate: c.start_date,
                    weekDay: c.week_day, timeSlot: c.time_slot, color: c.color, sessions, totalSessions: sessions.length,
                    status: c.status, createdAt: c.created_at
                };
            }));
            res.json({ success: true, data: result });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getOne(req, res) {
        try {
            const [cls] = await query('SELECT * FROM classes WHERE id = ?', [req.params.id]);
            if (!cls) return res.status(404).json({ success: false, error: 'Không tìm thấy lớp học' });

            const [studentCount] = await query('SELECT COUNT(*) as count FROM students WHERE class_id = ?', [cls.id]);
            const sessions = await query('SELECT * FROM sessions WHERE class_id = ? ORDER BY session_number', [cls.id]);

            res.json({
                success: true,
                data: {
                    id: cls.id, code: cls.code, name: cls.name, teacher: cls.teacherId,
                    cmId: cls.cm_id, students: studentCount[0]?.count || 0, startDate: cls.start_date,
                    weekDay: cls.week_day, timeSlot: cls.time_slot, color: cls.color, sessions, totalSessions: sessions.length
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const { code, name, teacherId, cm, cmId, startDate, weekDay, timeSlot, color, totalSessions } = req.body;

            const [existing] = await query('SELECT id FROM classes WHERE code = ?', [code]);
            if (existing) return res.status(409).json({ success: false, error: 'Mã lớp đã tồn tại' });

            const result = await transaction(async (conn) => {
                const [classResult] = await conn.query(
                    `INSERT INTO classes (code, name, teacher_id, cm, cm_id, start_date, week_day, time_slot, color, total_sessions)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [code, name, teacherId || null, cm, cmId || null, startDate, weekDay || 1, timeSlot, color || 'green', totalSessions || 15]
                );
                const classId = classResult.insertId;
                const sessions = generateSessionDates(startDate, weekDay || 1, totalSessions || 15);
                for (const session of sessions) {
                    await conn.query('INSERT INTO sessions (class_id, session_number, date, status, note) VALUES (?, ?, ?, ?, ?)',
                        [classId, session.number, session.date, session.status, session.note]);
                }
                return { classId, sessions };
            });

            res.status(201).json({ success: true, data: { id: result.classId, code, name, teacherId, cm, cmId, startDate, weekDay, timeSlot, color, totalSessions: result.sessions.length } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const { code, name, teacherId, cmId, startDate, weekDay, timeSlot, color } = req.body;

            const [existing] = await query('SELECT * FROM classes WHERE id = ?', [id]);
            if (!existing) return res.status(404).json({ success: false, error: 'Không tìm thấy lớp học' });

            await transaction(async (conn) => {
                await conn.query(
                    `UPDATE classes SET code=?, name=?, teacher_id=?,  cm_id=?, start_date=?, week_day=?, time_slot=?, color=? WHERE id=?`,
                    [code, name, teacherId, cmId, startDate, weekDay, timeSlot, color, id]
                );
                if (startDate !== existing.start_date || weekDay !== existing.week_day) {
                    await conn.query('DELETE FROM sessions WHERE class_id = ?', [id]);
                    const sessions = generateSessionDates(startDate, weekDay);
                    for (const session of sessions) {
                        await conn.query('INSERT INTO sessions (class_id, session_number, date, status, note) VALUES (?, ?, ?, ?, ?)',
                            [id, session.number, session.date, session.status, session.note]);
                    }
                }
            });

            res.json({ success: true, data: { id: parseInt(id), code, name, teacherId, cm, cmId, startDate, weekDay, timeSlot, color } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            const result = await query('DELETE FROM classes WHERE id = ?', [req.params.id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy lớp học' });
            res.json({ success: true, message: 'Đã xóa lớp học thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default ClassController;
