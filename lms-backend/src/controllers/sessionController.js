// src/controllers/sessionController.js
import { query, transaction } from '../config/database.js';

class SessionController {
    static async getByClass(req, res) {
        try {
            const sessions = await query('SELECT * FROM sessions WHERE class_id = ? ORDER BY session_number ASC', [req.params.classId]);
            res.json({ success: true, data: sessions.map(s => ({
                id: s.id, classId: s.class_id, number: s.session_number, date: s.date, status: s.status, note: s.note
            }))});
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { classId } = req.params;
            const { sessions } = req.body;
            if (!sessions || !Array.isArray(sessions)) {
                return res.status(400).json({ success: false, error: 'Dữ liệu không hợp lệ' });
            }

            await transaction(async (conn) => {
                await conn.query('DELETE FROM sessions WHERE class_id = ?', [classId]);
                for (const session of sessions) {
                    await conn.query(
                        'INSERT INTO sessions (class_id, session_number, date, status, note) VALUES (?, ?, ?, ?, ?)',
                        [classId, session.number, session.date, session.status || 'scheduled', session.note || '']
                    );
                }
            });

            res.json({ success: true, message: 'Cập nhật lịch học thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async updateOne(req, res) {
        try {
            const { classId, sessionNumber } = req.params;
            const { date, status, note } = req.body;
            
            const result = await query(
                'UPDATE sessions SET date = ?, status = ?, note = ? WHERE class_id = ? AND session_number = ?',
                [date, status, note, classId, sessionNumber]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy buổi học' });
            }
            
            res.json({ success: true, message: 'Cập nhật buổi học thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default SessionController;
