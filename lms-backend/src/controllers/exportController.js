// src/controllers/exportController.js
import { query } from '../config/database.js';
import { exportClassesToExcel, exportStudentsToExcel, exportAttendanceToExcel, exportGradesToExcel } from '../services/exportService.js';

class ExportController {
    static async exportClasses(req, res) {
        try {
            const classes = await query('SELECT * FROM classes ORDER BY created_at DESC');
            const workbook = await exportClassesToExcel(classes);
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Danh_sach_lop_hoc_${new Date().toISOString().slice(0,10)}.xlsx`);
            
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async exportStudents(req, res) {
        try {
            const { classId } = req.query;
            let sql = 'SELECT * FROM students';
            const params = [];
            if (classId) { sql += ' WHERE class_id = ?'; params.push(classId); }
            sql += ' ORDER BY name';
            
            const students = await query(sql, params);
            const workbook = await exportStudentsToExcel(students);
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Danh_sach_hoc_sinh_${new Date().toISOString().slice(0,10)}.xlsx`);
            
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async exportAttendance(req, res) {
        try {
            const { classId } = req.params;
            const [cls] = await query('SELECT name FROM classes WHERE id = ?', [classId]);
            if (!cls) return res.status(404).json({ success: false, error: 'Không tìm thấy lớp học' });
            
            const workbook = await exportAttendanceToExcel(classId, cls.name);
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Diem_danh_${cls.name}_${new Date().toISOString().slice(0,10)}.xlsx`);
            
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    static async exportGrades(req, res) {
        try {
            const { classId } = req.params;
            const [cls] = await query('SELECT name FROM classes WHERE id = ?', [classId]);
            if (!cls) return res.status(404).json({ success: false, error: 'Không tìm thấy lớp học' });
            
            const workbook = await exportGradesToExcel(classId, cls.name);
            
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=Bang_diem_${cls.name}_${new Date().toISOString().slice(0,10)}.xlsx`);
            
            await workbook.xlsx.write(res);
            res.end();
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default ExportController;
