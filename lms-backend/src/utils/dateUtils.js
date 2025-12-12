// src/utils/dateUtils.js

export const generateSessionDates = (startDate, weekDay, totalSessions = 15, holidays = []) => {
    const sessions = [];
    const start = new Date(startDate);

    if (isNaN(start.getTime())) {
        throw new Error('Ngày bắt đầu không hợp lệ');
    }

    if (weekDay < 0 || weekDay > 6) {
        throw new Error('Thứ trong tuần phải từ 0 (Chủ nhật) đến 6 (Thứ 7)');
    }

    // Convert holidays to date strings for easy comparison
    const holidayDates = holidays.map(h => formatDate(new Date(h)));

    let current = new Date(start);
    
    // Find first occurrence of weekDay
    while (current.getDay() !== weekDay) {
        current.setDate(current.getDate() + 1);
    }

    let sessionCount = 0;
    while (sessionCount < totalSessions) {
        const dateStr = formatDate(current);
        
        // Check if this date is a holiday
        const isHoliday = holidayDates.includes(dateStr);
        
        sessions.push({
            number: sessionCount + 1,
            date: dateStr,
            status: isHoliday ? 'cancelled' : 'scheduled',
            note: isHoliday ? 'Nghỉ lễ' : ''
        });
        
        sessionCount++;
        current.setDate(current.getDate() + 7);
    }

    return sessions;
};

export const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatDateTime = (date) => {
    const d = new Date(date);
    return d.toISOString().slice(0, 19).replace('T', ' ');
};

export const formatDateVN = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
};

export const getDayName = (weekDay) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[weekDay] || 'Không xác định';
};

export const parseDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new Error(`Ngày không hợp lệ: ${dateStr}`);
    }
    return date;
};

export const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

export const isWeekend = (date) => {
    const d = new Date(date);
    return d.getDay() === 0 || d.getDay() === 6;
};

export const getMonthRange = (year, month) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return { start: formatDate(start), end: formatDate(end) };
};

export default {
    generateSessionDates,
    formatDate,
    formatDateTime,
    formatDateVN,
    getDayName,
    parseDate,
    addDays,
    getWeekNumber,
    isWeekend,
    getMonthRange
};
