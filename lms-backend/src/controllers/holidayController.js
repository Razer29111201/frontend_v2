// src/controllers/holidayController.js
import { query } from '../config/database.js';
import logger from '../utils/logger.js';

class HolidayController {
    // Get all holidays
    static async getAll(req, res) {
        try {
            const { year } = req.query;
            
            let sql = 'SELECT * FROM holidays';
            const params = [];
            
            if (year) {
                sql += ' WHERE YEAR(date) = ?';
                params.push(year);
            }
            
            sql += ' ORDER BY date ASC';
            
            const holidays = await query(sql, params);
            
            res.json({ 
                success: true, 
                data: holidays.map(h => ({
                    id: h.id,
                    name: h.name,
                    date: h.date,
                    description: h.description,
                    createdAt: h.created_at
                }))
            });
        } catch (error) {
            logger.error('Get holidays error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get one holiday
    static async getOne(req, res) {
        try {
            const [holiday] = await query('SELECT * FROM holidays WHERE id = ?', [req.params.id]);
            
            if (!holiday) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy ngày nghỉ lễ' });
            }
            
            res.json({ 
                success: true, 
                data: {
                    id: holiday.id,
                    name: holiday.name,
                    date: holiday.date,
                    description: holiday.description,
                    createdAt: holiday.created_at
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Create holiday
    static async create(req, res) {
        try {
            const { name, date, description } = req.body;
            
            // Check if holiday already exists on this date
            const [existing] = await query('SELECT id FROM holidays WHERE date = ?', [date]);
            if (existing) {
                return res.status(409).json({ success: false, error: 'Đã có ngày nghỉ lễ vào ngày này' });
            }
            
            const result = await query(
                'INSERT INTO holidays (name, date, description) VALUES (?, ?, ?)',
                [name, date, description || '']
            );
            
            res.status(201).json({ 
                success: true, 
                data: { 
                    id: result.insertId, 
                    name, 
                    date, 
                    description 
                } 
            });
        } catch (error) {
            logger.error('Create holiday error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Update holiday
    static async update(req, res) {
        try {
            const { name, date, description } = req.body;
            
            const result = await query(
                'UPDATE holidays SET name = ?, date = ?, description = ? WHERE id = ?',
                [name, date, description, req.params.id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy ngày nghỉ lễ' });
            }
            
            res.json({ 
                success: true, 
                data: { 
                    id: parseInt(req.params.id), 
                    name, 
                    date, 
                    description 
                } 
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Delete holiday
    static async delete(req, res) {
        try {
            const result = await query('DELETE FROM holidays WHERE id = ?', [req.params.id]);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy ngày nghỉ lễ' });
            }
            
            res.json({ success: true, message: 'Đã xóa ngày nghỉ lễ thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get upcoming holidays
    static async getUpcoming(req, res) {
        try {
            const { limit } = req.query;
            
            let sql = 'SELECT * FROM holidays WHERE date >= CURDATE() ORDER BY date ASC';
            const params = [];
            
            if (limit) {
                sql += ' LIMIT ?';
                params.push(parseInt(limit));
            }
            
            const holidays = await query(sql, params);
            
            res.json({ 
                success: true, 
                data: holidays.map(h => ({
                    id: h.id,
                    name: h.name,
                    date: h.date,
                    description: h.description
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get holidays in date range
    static async getByRange(req, res) {
        try {
            const { startDate, endDate } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({ success: false, error: 'startDate và endDate là bắt buộc' });
            }
            
            const holidays = await query(
                'SELECT * FROM holidays WHERE date >= ? AND date <= ? ORDER BY date ASC',
                [startDate, endDate]
            );
            
            res.json({ 
                success: true, 
                data: holidays.map(h => ({
                    id: h.id,
                    name: h.name,
                    date: h.date,
                    description: h.description
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Bulk create holidays (import)
    static async bulkCreate(req, res) {
        try {
            const { holidays } = req.body;
            
            if (!Array.isArray(holidays) || holidays.length === 0) {
                return res.status(400).json({ success: false, error: 'holidays phải là mảng không rỗng' });
            }

            let created = 0;
            let skipped = 0;

            for (const holiday of holidays) {
                const [existing] = await query('SELECT id FROM holidays WHERE date = ?', [holiday.date]);
                
                if (existing) {
                    skipped++;
                    continue;
                }

                await query(
                    'INSERT INTO holidays (name, date, description) VALUES (?, ?, ?)',
                    [holiday.name, holiday.date, holiday.description || '']
                );
                created++;
            }

            res.status(201).json({ 
                success: true, 
                message: `Đã tạo ${created} ngày nghỉ lễ, bỏ qua ${skipped} ngày đã tồn tại`,
                data: { created, skipped, total: holidays.length }
            });
        } catch (error) {
            logger.error('Bulk create holidays error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default HolidayController;
