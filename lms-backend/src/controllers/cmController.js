// src/controllers/cmController.js
import { query } from '../config/database.js';

class CMController {
    static async getAll(req, res) {
        try {
            const cms = await query('SELECT * FROM cms ORDER BY name ASC');
            const classCounts = await query('SELECT cm_id, COUNT(*) as count FROM classes WHERE cm_id IS NOT NULL GROUP BY cm_id');
            const countMap = {};
            classCounts.forEach(r => { countMap[r.cm_id] = r.count; });

            res.json({ success: true, data: cms.map(cm => ({
                id: cm.id, code: cm.code, name: cm.name, email: cm.email, phone: cm.phone,
                active: cm.active === 1, classCount: countMap[cm.id] || 0, createdAt: cm.created_at
            }))});
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getOne(req, res) {
        try {
            const [cm] = await query('SELECT * FROM cms WHERE id = ?', [req.params.id]);
            if (!cm) return res.status(404).json({ success: false, error: 'Không tìm thấy CM' });
            res.json({ success: true, data: { id: cm.id, code: cm.code, name: cm.name, email: cm.email, phone: cm.phone, active: cm.active === 1 } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async create(req, res) {
        try {
            const { code, name, email, phone, active } = req.body;
            const result = await query('INSERT INTO cms (code, name, email, phone, active) VALUES (?, ?, ?, ?, ?)', [code, name, email, phone, active !== false]);
            res.status(201).json({ success: true, data: { id: result.insertId, code, name, email, phone, active: active !== false, classCount: 0 } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async update(req, res) {
        try {
            const { code, name, email, phone, active } = req.body;
            const result = await query('UPDATE cms SET code=?, name=?, email=?, phone=?, active=? WHERE id=?', [code, name, email, phone, active !== false, req.params.id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy CM' });
            res.json({ success: true, data: { id: parseInt(req.params.id), code, name, email, phone, active } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async delete(req, res) {
        try {
            await query('UPDATE classes SET cm = NULL, cm_id = NULL WHERE cm_id = ?', [req.params.id]);
            const result = await query('DELETE FROM cms WHERE id = ?', [req.params.id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Không tìm thấy CM' });
            res.json({ success: true, message: 'Đã xóa CM thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getActive(req, res) {
        try {
            const cms = await query('SELECT * FROM cms WHERE active = 1 ORDER BY name ASC');
            res.json({ success: true, data: cms.map(cm => ({ id: cm.id, code: cm.code, name: cm.name, email: cm.email, phone: cm.phone })) });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getDetails(req, res) {
        try {
            const [cm] = await query('SELECT * FROM cms WHERE id = ?', [req.params.id]);
            if (!cm) return res.status(404).json({ success: false, error: 'Không tìm thấy CM' });
            const classes = await query('SELECT * FROM classes WHERE cm_id = ?', [req.params.id]);
            res.json({ success: true, data: { ...cm, active: cm.active === 1, classes } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async getStatistics(req, res) {
        try {
            const [cm] = await query('SELECT * FROM cms WHERE id = ?', [req.params.id]);
            if (!cm) return res.status(404).json({ success: false, error: 'Không tìm thấy CM' });

            const classes = await query('SELECT * FROM classes WHERE cm_id = ?', [req.params.id]);
            let totalStudents = 0, totalSessions = 0;
            
            for (const cls of classes) {
                const [sc] = await query('SELECT COUNT(*) as count FROM students WHERE class_id = ?', [cls.id]);
                const [ss] = await query('SELECT COUNT(*) as count FROM sessions WHERE class_id = ?', [cls.id]);
                totalStudents += sc[0]?.count || 0;
                totalSessions += ss[0]?.count || 0;
            }

            res.json({ success: true, data: { classCount: classes.length, studentCount: totalStudents, sessionCount: totalSessions, classes: classes.map(c => ({ id: c.id, code: c.code, name: c.name })) } });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default CMController;
