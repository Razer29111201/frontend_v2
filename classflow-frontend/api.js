// api.js - API Client cho ClassFlow LMS
// Tương thích với Backend MySQL/Express

const CONFIG = {
    API_URL: 'http://localhost:8080/api',
    // API_URL: 'https://backend-lms-y0yb.onrender.com/api',
    SESSION_KEY: 'classflow_session',
    SESSION_TIMEOUT: 1000 * 60 * 60 * 24, // 24 hours
    CARD_COLORS: ['green', 'blue', 'purple', 'orange', 'red', 'cyan']
};

const API = {
    // ===== CORE API CALL =====
    async call(endpoint, method = 'GET', data = null) {
        try {
            const sessionData = localStorage.getItem(CONFIG.SESSION_KEY);
            const session = sessionData ? JSON.parse(sessionData) : null;
            const token = session?.token;

            const headers = {
                'Content-Type': 'application/json'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const options = { method, headers };

            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }

            const url = `${CONFIG.API_URL}${endpoint}`;
            console.log(`🌐 ${method} ${url}`);

            const response = await fetch(url, options);

            // Handle 401 Unauthorized
            if (response.status === 401) {
                localStorage.removeItem(CONFIG.SESSION_KEY);
                window.location.reload();
                throw new Error('Phiên đăng nhập hết hạn');
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}`);
            }

            return result;

        } catch (error) {
            console.error('❌ API Error:', error);
            throw error;
        }
    },

    // ===== AUTHENTICATION =====
    async login(email, password) {
        const response = await this.call('/auth/login', 'POST', { email, password });

        if (response.success && response.data) {
            // Lưu session
            localStorage.setItem(CONFIG.SESSION_KEY, JSON.stringify({
                token: response.data.token,
                user: response.data.user,
                timestamp: Date.now()
            }));
            return response.data;
        }

        throw new Error(response.error || 'Đăng nhập thất bại');
    },

    async register(userData) {
        const response = await this.call('/auth/register', 'POST', userData);
        return response;
    },

    async forgotPassword(email) {
        return await this.call('/auth/forgot-password', 'POST', { email });
    },

    async resetPassword(token, newPassword) {
        return await this.call('/auth/reset-password', 'POST', { token, newPassword });
    },

    async changePassword(currentPassword, newPassword) {
        return await this.call('/auth/change-password', 'POST', { currentPassword, newPassword });
    },

    async getCurrentUser() {
        const response = await this.call('/auth/me', 'GET');
        return response.data || response;
    },

    async updateProfile(data) {
        const response = await this.call('/auth/profile', 'PUT', data);
        return response.data || response;
    },

    // ===== CLASSES =====
    async getClasses() {
        const response = await this.call('/classes', 'GET');
        return response.data || [];
    },

    async getClass(id) {
        const response = await this.call(`/classes/${id}`, 'GET');
        return response.data || response;
    },

    async createClass(classData) {
        const response = await this.call('/classes', 'POST', classData);
        return response.data || response;
    },

    async updateClass(id, classData) {
        const response = await this.call(`/classes/${id}`, 'PUT', classData);
        return response.data || response;
    },

    async deleteClass(id) {
        return await this.call(`/classes/${id}`, 'DELETE');
    },

    // ===== STUDENTS =====
    async getStudents(classId = null) {
        const endpoint = classId ? `/students?classId=${classId}` : '/students';
        const response = await this.call(endpoint, 'GET');
        return response.data || [];
    },

    async getStudent(id) {
        const response = await this.call(`/students/${id}`, 'GET');
        return response.data || response;
    },

    async createStudent(studentData) {
        const response = await this.call('/students', 'POST', studentData);
        return response.data || response;
    },

    async updateStudent(id, studentData) {
        const response = await this.call(`/students/${id}`, 'PUT', studentData);
        return response.data || response;
    },

    async deleteStudent(id) {
        return await this.call(`/students/${id}`, 'DELETE');
    },

    // ===== TEACHERS =====
    async getTeachers() {
        const response = await this.call('/teachers', 'GET');
        return response.data || [];
    },

    async getTeacher(id) {
        const response = await this.call(`/teachers/${id}`, 'GET');
        return response.data || response;
    },

    async createTeacher(teacherData) {
        const response = await this.call('/teachers', 'POST', teacherData);
        return response.data || response;
    },

    async updateTeacher(id, teacherData) {
        const response = await this.call(`/teachers/${id}`, 'PUT', teacherData);
        return response.data || response;
    },

    async deleteTeacher(id) {
        return await this.call(`/teachers/${id}`, 'DELETE');
    },

    // ===== CLASS MANAGERS (CMs) =====
    async getCMs() {
        const response = await this.call('/cms', 'GET');
        return response.data || [];
    },

    async getCM(id) {
        const response = await this.call(`/cms/${id}`, 'GET');
        return response.data || response;
    },

    async getActiveCMs() {
        const response = await this.call('/cms/active', 'GET');
        return response.data || [];
    },

    async createCM(cmData) {
        const response = await this.call('/cms', 'POST', cmData);
        return response.data || response;
    },

    async updateCM(id, cmData) {
        const response = await this.call(`/cms/${id}`, 'PUT', cmData);
        return response.data || response;
    },

    async deleteCM(id) {
        return await this.call(`/cms/${id}`, 'DELETE');
    },

    // ===== NOTIFICATIONS API =====
    async getNotifications(userId = null) {
        const endpoint = userId ? `/notifications?userId=${userId}` : '/notifications';
        const response = await this.call(endpoint);
        return response.data || [];
    },

    async getUnreadNotificationCount() {
        const response = await this.call('/notifications/unread-count');
        return response.data || { count: 0 };
    },

    async createNotification(data) {
        return await this.call('/notifications', 'POST', data);
    },

    async bulkCreateNotifications(userIds, type, title, message, data = null) {
        return await this.call('/notifications/bulk', 'POST', { userIds, type, title, message, data });
    },

    async markNotificationRead(id) {
        return await this.call(`/notifications/${id}/read`, 'PUT');
    },

    async markAllNotificationsRead() {
        return await this.call('/notifications/read-all', 'PUT');
    },

    async deleteNotification(id) {
        return await this.call(`/notifications/${id}`, 'DELETE');
    },

    async deleteAllNotifications() {
        return await this.call('/notifications', 'DELETE');
    },

    // ===== FILES API =====
    async getFiles(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/files?${queryString}` : '/files';
        const response = await this.call(endpoint);
        return response.data || [];
    },

    async getFile(id) {
        const response = await this.call(`/files/${id}`);
        return response.data || response;
    },

    async getFilesByClass(classId) {
        const response = await this.call(`/files/class/${classId}`);
        return response.data || [];
    },

    async uploadFile(formData) {
        const session = this.getSession();
        if (!session || !session.token) {
            throw new Error('Chưa đăng nhập');
        }

        const response = await fetch(`${CONFIG.API_URL}/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.token}`
                // Don't set Content-Type for FormData, browser will set it with boundary
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return await response.json();
    },

    async updateFile(id, data) {
        return await this.call(`/files/${id}`, 'PUT', data);
    },

    async deleteFile(id) {
        return await this.call(`/files/${id}`, 'DELETE');
    },

    async getFileStats() {
        const response = await this.call('/files/stats');
        return response.data || { fileCount: 0, totalSize: 0 };
    },

    // ===== HOLIDAYS API =====
    async getHolidays(year = null) {
        const endpoint = year ? `/holidays?year=${year}` : '/holidays';
        const response = await this.call(endpoint);
        return response.data || [];
    },

    async getUpcomingHolidays(limit = 5) {
        const response = await this.call(`/holidays/upcoming?limit=${limit}`);
        return response.data || [];
    },

    async getHolidaysByRange(startDate, endDate) {
        const response = await this.call(`/holidays/range?startDate=${startDate}&endDate=${endDate}`);
        return response.data || [];
    },

    async getHoliday(id) {
        const response = await this.call(`/holidays/${id}`);
        return response.data || response;
    },

    async createHoliday(data) {
        return await this.call('/holidays', 'POST', data);
    },

    async updateHoliday(id, data) {
        return await this.call(`/holidays/${id}`, 'PUT', data);
    },

    async deleteHoliday(id) {
        return await this.call(`/holidays/${id}`, 'DELETE');
    },

    async bulkCreateHolidays(holidays) {
        return await this.call('/holidays/bulk', 'POST', { holidays });
    },

    // ===== ACTIVITY LOGS API =====
    async getAllActivityLogs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/activity-logs?${queryString}` : '/activity-logs';
        const response = await this.call(endpoint);
        return response.data || [];
    },

    async getMyActivityLogs(limit = 50) {
        const response = await this.call(`/activity-logs/my?limit=${limit}`);
        return response.data || [];
    },

    async getActivityLogStats(startDate = null, endDate = null) {
        let endpoint = '/activity-logs/stats';
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const queryString = params.toString();
        if (queryString) endpoint += '?' + queryString;
        const response = await this.call(endpoint);
        return response.data || {};
    },

    async getActivityLogsByEntity(entityType, entityId) {
        const response = await this.call(`/activity-logs/entity/${entityType}/${entityId}`);
        return response.data || [];
    },

    async cleanupActivityLogs(days = 90) {
        return await this.call(`/activity-logs/cleanup?days=${days}`, 'DELETE');
    },

    // ===== SESSIONS =====
    async getSessions(classId) {
        const response = await this.call(`/sessions/${classId}`, 'GET');
        return response.data || [];
    },

    async updateSessions(classId, sessions) {
        const response = await this.call(`/sessions/${classId}`, 'PUT', { sessions });
        return response.data || response;
    },

    async updateSession(classId, sessionNumber, data) {
        const response = await this.call(`/sessions/${classId}/${sessionNumber}`, 'PUT', data);
        return response.data || response;
    },

    // ===== ATTENDANCE =====
    async getAttendance(classId, sessionNumber) {
        const response = await this.call(`/attendance/${classId}/${sessionNumber}`, 'GET');
        return response.data || [];
    },

    async getAttendanceByClass(classId) {
        const response = await this.call(`/attendance/class/${classId}`, 'GET');
        return response.data || [];
    },

    async saveAttendance(classId, session, records, sendNotification = false) {
        return await this.call('/attendance', 'POST', {
            classId,
            session,
            records,
            sendNotification
        });
    },

    async deleteAttendance(classId, session) {
        return await this.call(`/attendance/${classId}/${session}`, 'DELETE');
    },

    async getAttendanceStatsByClass(classId) {
        const response = await this.call(`/attendance/stats/class/${classId}`, 'GET');
        return response.data || {};
    },

    async getAttendanceStatsByStudent(studentId) {
        const response = await this.call(`/attendance/stats/student/${studentId}`, 'GET');
        return response.data || {};
    },

    // ===== COMMENTS =====
    async getCommentsByClass(classId) {
        const response = await this.call(`/comments/class/${classId}`, 'GET');
        return response.data || {};
    },

    async getCommentsByStudent(studentId) {
        const response = await this.call(`/comments/student/${studentId}`, 'GET');
        return response.data || [];
    },

    async saveComments(classId, comments) {
        // comments = [{ studentId, comment }, ...]
        return await this.call('/comments', 'POST', { classId, comments });
    },

    async updateComment(classId, studentId, comment) {
        return await this.call(`/comments/${classId}/${studentId}`, 'PUT', { comment });
    },

    async deleteComment(classId, studentId) {
        return await this.call(`/comments/${classId}/${studentId}`, 'DELETE');
    },

    // ===== GRADES =====
    async getGradesByClass(classId) {
        const response = await this.call(`/grades/class/${classId}`, 'GET');
        return response.data || [];
    },

    async getGradesByStudent(studentId) {
        const response = await this.call(`/grades/student/${studentId}`, 'GET');
        return response.data || {};
    },

    async createGrade(gradeData) {
        const response = await this.call('/grades', 'POST', gradeData);
        return response.data || response;
    },

    async createGradesBulk(classId, assignmentName, grades) {
        return await this.call('/grades/bulk', 'POST', { classId, assignmentName, grades });
    },

    async updateGrade(id, gradeData) {
        const response = await this.call(`/grades/${id}`, 'PUT', gradeData);
        return response.data || response;
    },

    async deleteGrade(id) {
        return await this.call(`/grades/${id}`, 'DELETE');
    },

    async getClassAverage(classId) {
        const response = await this.call(`/grades/class/${classId}/average`, 'GET');
        return response.data || [];
    },

    // ===== DASHBOARD =====
    async getDashboardStats() {
        const response = await this.call('/dashboard/stats', 'GET');
        return response.data || {};
    },

    async getAttendanceReport(startDate, endDate) {
        let endpoint = '/dashboard/attendance-report';
        if (startDate && endDate) {
            endpoint += `?startDate=${startDate}&endDate=${endDate}`;
        }
        const response = await this.call(endpoint, 'GET');
        return response.data || [];
    },

    async getTopAbsentStudents(limit = 10) {
        const response = await this.call(`/dashboard/top-absent?limit=${limit}`, 'GET');
        return response.data || [];
    },

    // ===== EXPORT =====
    async exportClasses() {
        window.open(`${CONFIG.API_URL}/export/classes?token=${this.getToken()}`, '_blank');
    },

    async exportStudents(classId = null) {
        let url = `${CONFIG.API_URL}/export/students?token=${this.getToken()}`;
        if (classId) url += `&classId=${classId}`;
        window.open(url, '_blank');
    },

    async exportAttendance(classId) {
        window.open(`${CONFIG.API_URL}/export/attendance/${classId}?token=${this.getToken()}`, '_blank');
    },

    async exportGrades(classId) {
        window.open(`${CONFIG.API_URL}/export/grades/${classId}?token=${this.getToken()}`, '_blank');
    },

    // ===== HELPERS =====
    getToken() {
        const sessionData = localStorage.getItem(CONFIG.SESSION_KEY);
        if (!sessionData) return null;
        const session = JSON.parse(sessionData);
        return session?.token;
    },

    getSession() {
        const sessionData = localStorage.getItem(CONFIG.SESSION_KEY);
        if (!sessionData) return null;
        return JSON.parse(sessionData);
    },

    isLoggedIn() {
        const session = this.getSession();
        if (!session) return false;
        const elapsed = Date.now() - (session.timestamp || 0);
        return elapsed < CONFIG.SESSION_TIMEOUT;
    },

    logout() {
        localStorage.removeItem(CONFIG.SESSION_KEY);
    },

    // ===== ASSIGNMENTS API (BTVN) =====
    async getAssignments() {
        const response = await this.call('/assignments');
        return response.data || [];
    },

    async getAssignmentsByClass(classId) {
        const response = await this.call(`/assignments/class/${classId}`);
        return response.data || [];
    },

    async getAssignment(id) {
        const response = await this.call(`/assignments/${id}`);
        return response.data;
    },

    async createAssignment(data) {
        const response = await this.call('/assignments', 'POST', data);
        return response.data;
    },

    async updateAssignment(id, data) {
        const response = await this.call(`/assignments/${id}`, 'PUT', data);
        return response.data;
    },

    async deleteAssignment(id) {
        const response = await this.call(`/assignments/${id}`, 'DELETE');
        return response;
    },

    // ===== SUBMISSIONS API (Bài nộp) =====
    async getSubmissions(assignmentId) {
        const response = await this.call(`/assignments/${assignmentId}/submissions`);
        return response.data || [];
    },

    async getMySubmissions() {
        const response = await this.call('/submissions/my');
        return response.data || [];
    },

    async getSubmission(id) {
        const response = await this.call(`/submissions/${id}`);
        return response.data;
    },

    async createSubmission(data) {
        const formData = new FormData();
        formData.append('assignmentId', data.assignmentId);
        formData.append('studentId', data.studentId);
        if (data.file) {
            formData.append('file', data.file);
        }
        if (data.content) {
            formData.append('content', data.content);
        }

        const sessionData = localStorage.getItem(CONFIG.SESSION_KEY);
        const session = sessionData ? JSON.parse(sessionData) : null;
        const token = session?.token;

        const response = await fetch(`${CONFIG.API_URL}/submissions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        return await response.json();
    },

    async updateSubmission(id, data) {
        const response = await this.call(`/submissions/${id}`, 'PUT', data);
        return response.data;
    },

    async gradeSubmission(id, data) {
        const response = await this.call(`/submissions/${id}/grade`, 'PUT', data);
        return response.data;
    },

    async deleteSubmission(id) {
        const response = await this.call(`/submissions/${id}`, 'DELETE');
        return response;
    },

    // ===== GRADES API (Điểm số) =====
    async getGradesByClass(classId) {
        const response = await this.call(`/grades/class/${classId}`);
        return response.data || [];
    },

    async getGradesByStudent(studentId) {
        const response = await this.call(`/grades/student/${studentId}`);
        return response.data || [];
    },

    async updateGrade(data) {
        const response = await this.call('/grades', 'PUT', data);
        return response.data;
    },

    async exportGrades(classId) {
        const response = await this.call(`/grades/class/${classId}/export`);
        return response.data;
    }
};

// ===== CMAPI ALIAS (backward compatibility) =====
const CMAPI = {
    getAll: () => API.getCMs(),
    get: (id) => API.getCM(id),
    getActive: () => API.getActiveCMs(),
    create: (data) => API.createCM(data),
    update: (id, data) => API.updateCM(id, data),
    delete: (id) => API.deleteCM(id)
};

// ===== EXPORT TO WINDOW =====
window.API = API;
window.CONFIG = CONFIG;
window.CMAPI = CMAPI;

console.log('✅ API Client initialized');
console.log('📡 API URL:', CONFIG.API_URL);