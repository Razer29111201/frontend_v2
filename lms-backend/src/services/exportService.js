// src/services/exportService.js
import ExcelJS from 'exceljs';
import { query } from '../config/database.js';
import { formatDateVN, getDayName } from '../utils/dateUtils.js';

// Export classes to Excel
export const exportClassesToExcel = async (classes) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ClassFlow';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Danh sách lớp học');

    // Header style
    const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34A853' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        }
    };

    // Set columns
    sheet.columns = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'Mã lớp', key: 'code', width: 12 },
        { header: 'Tên lớp', key: 'name', width: 30 },
        { header: 'Giáo viên', key: 'teacher', width: 20 },
        { header: 'Class Manager', key: 'cm', width: 20 },
        { header: 'Số học sinh', key: 'students', width: 12 },
        { header: 'Ngày bắt đầu', key: 'startDate', width: 15 },
        { header: 'Lịch học', key: 'schedule', width: 20 },
        { header: 'Số buổi', key: 'totalSessions', width: 10 }
    ];

    // Apply header style
    sheet.getRow(1).eachCell(cell => {
        cell.style = headerStyle;
    });
    sheet.getRow(1).height = 25;

    // Add data
    classes.forEach((cls, index) => {
        sheet.addRow({
            stt: index + 1,
            code: cls.code,
            name: cls.name,
            teacher: cls.teacher || 'Chưa có',
            cm: cls.cm || 'Chưa có',
            students: cls.students || 0,
            startDate: cls.startDate ? formatDateVN(cls.startDate) : '',
            schedule: cls.weekDay !== undefined ? `${getDayName(cls.weekDay)}: ${cls.timeSlot || ''}` : '',
            totalSessions: cls.totalSessions || 15
        });
    });

    // Style data rows
    for (let i = 2; i <= classes.length + 1; i++) {
        sheet.getRow(i).eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    }

    return workbook;
};

// Export students to Excel
export const exportStudentsToExcel = async (students) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ClassFlow';

    const sheet = workbook.addWorksheet('Danh sách học sinh');

    const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4285F4' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        }
    };

    sheet.columns = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'MSSV', key: 'code', width: 12 },
        { header: 'Họ và tên', key: 'name', width: 25 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Số điện thoại', key: 'phone', width: 15 },
        { header: 'Lớp', key: 'className', width: 15 },
        { header: 'Phụ huynh', key: 'parentName', width: 20 },
        { header: 'SĐT Phụ huynh', key: 'parentPhone', width: 15 }
    ];

    sheet.getRow(1).eachCell(cell => {
        cell.style = headerStyle;
    });
    sheet.getRow(1).height = 25;

    students.forEach((s, index) => {
        sheet.addRow({
            stt: index + 1,
            code: s.code,
            name: s.name,
            email: s.email || '',
            phone: s.phone || '',
            className: s.className || s.class_name || '',
            parentName: s.parentName || s.parent_name || '',
            parentPhone: s.parentPhone || s.parent_phone || ''
        });
    });

    for (let i = 2; i <= students.length + 1; i++) {
        sheet.getRow(i).eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    }

    return workbook;
};

// Export attendance to Excel
export const exportAttendanceToExcel = async (classId, className) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ClassFlow';

    // Get students
    const students = await query(
        'SELECT * FROM students WHERE class_id = ? ORDER BY name',
        [classId]
    );

    // Get sessions
    const sessions = await query(
        'SELECT * FROM sessions WHERE class_id = ? ORDER BY session_number',
        [classId]
    );

    // Get attendance records
    const attendance = await query(
        'SELECT * FROM attendance WHERE class_id = ?',
        [classId]
    );

    const sheet = workbook.addWorksheet('Điểm danh');

    // Title
    sheet.mergeCells('A1:' + String.fromCharCode(67 + sessions.length) + '1');
    sheet.getCell('A1').value = `BẢNG ĐIỂM DANH - ${className}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };
    sheet.getRow(1).height = 30;

    // Headers
    const headers = ['STT', 'MSSV', 'Họ và tên'];
    sessions.forEach(s => {
        headers.push(`Buổi ${s.session_number}\n${formatDateVN(s.date)}`);
    });
    headers.push('Đúng giờ', 'Muộn', 'Có phép', 'Vắng', 'Tổng');

    sheet.addRow(headers);
    sheet.getRow(2).height = 40;
    sheet.getRow(2).eachCell(cell => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34A853' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Attendance map
    const attendanceMap = {};
    attendance.forEach(a => {
        const key = `${a.student_id}_${a.session}`;
        attendanceMap[key] = a.status;
    });

    const statusSymbols = {
        'on-time': '✓',
        'late': 'M',
        'excused': 'P',
        'absent': '✗'
    };

    // Data rows
    students.forEach((student, idx) => {
        const row = [idx + 1, student.code, student.name];
        let onTime = 0, late = 0, excused = 0, absent = 0;

        sessions.forEach(session => {
            const status = attendanceMap[`${student.id}_${session.session_number}`];
            row.push(status ? statusSymbols[status] : '-');
            
            if (status === 'on-time') onTime++;
            else if (status === 'late') late++;
            else if (status === 'excused') excused++;
            else if (status === 'absent') absent++;
        });

        row.push(onTime, late, excused, absent, onTime + late + excused + absent);

        const dataRow = sheet.addRow(row);
        dataRow.eachCell((cell, colNumber) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // Color code attendance
            if (colNumber > 3 && colNumber <= 3 + sessions.length) {
                const value = cell.value;
                if (value === '✓') cell.font = { color: { argb: 'FF10B981' } };
                else if (value === 'M') cell.font = { color: { argb: 'FFF59E0B' } };
                else if (value === 'P') cell.font = { color: { argb: 'FF06B6D4' } };
                else if (value === '✗') cell.font = { color: { argb: 'FFEF4444' } };
            }
        });
    });

    // Set column widths
    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 12;
    sheet.getColumn(3).width = 25;
    for (let i = 4; i <= 3 + sessions.length; i++) {
        sheet.getColumn(i).width = 12;
    }

    // Legend
    const legendRow = sheet.addRow([]);
    sheet.addRow(['', 'Chú thích:', '✓ = Đúng giờ', 'M = Muộn', 'P = Có phép', '✗ = Vắng']);

    return workbook;
};

// Export grades to Excel
export const exportGradesToExcel = async (classId, className) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'ClassFlow';

    const students = await query(
        'SELECT * FROM students WHERE class_id = ? ORDER BY name',
        [classId]
    );

    const grades = await query(
        'SELECT * FROM grades WHERE class_id = ? ORDER BY assignment_name',
        [classId]
    );

    // Get unique assignments
    const assignments = [...new Set(grades.map(g => g.assignment_name))];

    const sheet = workbook.addWorksheet('Bảng điểm');

    // Title
    sheet.mergeCells('A1:' + String.fromCharCode(67 + assignments.length) + '1');
    sheet.getCell('A1').value = `BẢNG ĐIỂM - ${className}`;
    sheet.getCell('A1').font = { bold: true, size: 14 };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    // Headers
    const headers = ['STT', 'MSSV', 'Họ và tên', ...assignments, 'Trung bình'];
    sheet.addRow(headers);
    sheet.getRow(2).eachCell(cell => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4285F4' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Grade map
    const gradeMap = {};
    grades.forEach(g => {
        const key = `${g.student_id}_${g.assignment_name}`;
        gradeMap[key] = g.score;
    });

    // Data
    students.forEach((student, idx) => {
        const row = [idx + 1, student.code, student.name];
        let total = 0, count = 0;

        assignments.forEach(assignment => {
            const score = gradeMap[`${student.id}_${assignment}`];
            row.push(score !== undefined ? score : '-');
            if (score !== undefined) {
                total += score;
                count++;
            }
        });

        const avg = count > 0 ? (total / count).toFixed(2) : '-';
        row.push(avg);

        const dataRow = sheet.addRow(row);
        dataRow.eachCell(cell => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });
    });

    // Column widths
    sheet.getColumn(1).width = 6;
    sheet.getColumn(2).width = 12;
    sheet.getColumn(3).width = 25;

    return workbook;
};

export default {
    exportClassesToExcel,
    exportStudentsToExcel,
    exportAttendanceToExcel,
    exportGradesToExcel
};
