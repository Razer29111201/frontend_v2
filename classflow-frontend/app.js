// app.js - ClassFlow LMS Main Application
// Version: 2.0 - Fixed Attendance System

// ===== GLOBAL STATE =====
let currentUser = null;
let classes = [];
let students = [];
let teachers = [];
let cms = [];
let currentClassId = null;
let currentSessionNumber = null;
let currentSessionDate = null;
let currentSessions = []; // Store sessions for current class

// ===== ROLE CONSTANTS =====
const ROLES = {
    ADMIN: 0,
    TEACHER: 1,
    CM: 2
};

const ROLE_NAMES = {
    0: 'admin',
    1: 'teacher',
    2: 'cm'
};

const ROLE_DISPLAY = {
    0: 'Admin',
    1: 'Giáo viên',
    2: 'Class Manager'
};

// ===== PERMISSIONS SYSTEM =====
const PERMISSIONS = {
    0: { // Admin - Full quyền
        classes: { view: true, create: true, edit: true, delete: true },
        students: { view: true, create: true, edit: true, delete: true },
        teachers: { view: true, create: true, edit: true, delete: true },
        cms: { view: true, create: true, edit: true, delete: true },
        attendance: { view: true, edit: true },
        comments: { view: true, edit: true },
        grades: { view: true, edit: true },
        notifications: { view: true, create: true, delete: true },
        files: { view: true, upload: true, delete: true },
        holidays: { view: true, create: true, edit: true, delete: true },
        activityLogs: { view: true },
        export: true
    },
    1: { // Teacher - Điểm danh, nhận xét
        classes: { view: true, create: false, edit: false, delete: false },
        students: { view: true, create: false, edit: false, delete: false },
        teachers: { view: false, create: false, edit: false, delete: false },
        cms: { view: false, create: false, edit: false, delete: false },
        attendance: { view: true, edit: true },
        comments: { view: true, edit: true },
        grades: { view: true, edit: true },
        notifications: { view: true, create: false, delete: false },
        files: { view: true, upload: true, delete: false },
        holidays: { view: true, create: false, edit: false, delete: false },
        activityLogs: { view: true },
        export: true
    },
    2: { // CM - Quản lý lớp, học sinh
        classes: { view: true, create: true, edit: true, delete: true },
        students: { view: true, create: true, edit: true, delete: true },
        teachers: { view: true, create: false, edit: false, delete: false },
        cms: { view: true, create: false, edit: false, delete: false },
        attendance: { view: true, edit: false },
        comments: { view: true, edit: false },
        grades: { view: true, edit: false },
        notifications: { view: true, create: false, delete: false },
        files: { view: true, upload: true, delete: false },
        holidays: { view: true, create: false, edit: false, delete: false },
        activityLogs: { view: true },
        export: true
    }
};

// ===== PERMISSION HELPER =====
function hasPermission(action, resource, operation = 'view') {
    if (!currentUser) return false;
    const roleNum = currentUser.roleNum ?? parseInt(currentUser.role);
    const perms = PERMISSIONS[roleNum];
    if (!perms) return false;
    if (action === 'export') return perms.export === true;
    return perms[resource] && perms[resource][operation] === true;
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
});

// ===== AUTHENTICATION =====
function checkSession() {
    const session = API.getSession();

    if (!session || !API.isLoggedIn()) {
        showPage('loginPage');
        return;
    }

    currentUser = {
        ...session.user,
        roleNum: parseInt(session.user.role),
        role: ROLE_NAMES[parseInt(session.user.role)] || 'admin',
        timestamp: session.timestamp
    };

    showPage('mainApp');
    updateUserUI();
    loadDashboard();
}

async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showLoginAlert('error', 'Vui lòng nhập email và mật khẩu');
        return;
    }

    try {
        showLoading();
        const result = await API.login(email, password);

        if (result && result.user) {
            currentUser = {
                ...result.user,
                roleNum: parseInt(result.user.role),
                role: ROLE_NAMES[parseInt(result.user.role)] || 'admin',
                timestamp: Date.now()
            };

            hideLoading();
            showPage('mainApp');
            updateUserUI();
            await loadDashboard();
            showAlert('success', 'Đăng nhập thành công!');

            // Redirect based on role
            setTimeout(() => {
                const roleNum = currentUser.roleNum;
                if (roleNum === ROLES.TEACHER || roleNum === ROLES.CM) {
                    showClasses();
                } else {
                    showDashboard();
                }
            }, 500);
        }
    } catch (error) {
        hideLoading();
        console.error('Login error:', error);
        showLoginAlert('error', error.message || 'Đăng nhập thất bại');
    }
}

function logout() {
    API.logout();
    currentUser = null;
    classes = [];
    students = [];
    teachers = [];
    cms = [];
    currentSessions = [];
    showPage('loginPage');
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

function showLoginAlert(type, msg) {
    const el = document.getElementById('loginAlert');
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> <span>${msg}</span>`;
    el.style.display = 'flex';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// ===== REGISTER =====
function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

function showLoginForm() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}

async function register() {
    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const role = document.getElementById('registerRole').value;

    if (!name || !email || !password || !role) {
        showLoginAlert('error', 'Vui lòng điền đầy đủ thông tin');
        return;
    }

    if (password.length < 6) {
        showLoginAlert('error', 'Mật khẩu phải có ít nhất 6 ký tự');
        return;
    }

    if (password !== confirmPassword) {
        showLoginAlert('error', 'Mật khẩu xác nhận không khớp');
        return;
    }

    try {
        showLoading();
        await API.register({ name, email, password, role });
        hideLoading();
        showLoginAlert('success', 'Đăng ký thành công! Vui lòng đăng nhập.');
        showLoginForm();
    } catch (error) {
        hideLoading();
        showLoginAlert('error', error.message || 'Đăng ký thất bại');
    }
}

async function forgotPassword() {
    const email = prompt('Nhập email của bạn:');
    if (!email) return;

    try {
        showLoading();
        await API.forgotPassword(email);
        hideLoading();
        showLoginAlert('success', 'Link đặt lại mật khẩu đã được gửi đến email của bạn');
    } catch (error) {
        hideLoading();
        showLoginAlert('error', error.message || 'Không thể gửi email');
    }
}

// ===== UI HELPERS =====
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
}

function showContent(contentId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(contentId);
    if (el) el.classList.add('active');
}

function setSidebarActive(index) {
    const menuItems = document.querySelectorAll('.sidebar-menu li a');
    menuItems.forEach((item, i) => {
        item.classList.toggle('active', i === index);
    });
}

function updateUserUI() {
    if (!currentUser) return;

    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    const roleEl = document.getElementById('userRole');

    if (nameEl) nameEl.textContent = currentUser.name || '';
    if (avatarEl) avatarEl.textContent = getInitials(currentUser.name);

    if (roleEl) {
        const roleNum = currentUser.roleNum;
        const roleName = ROLE_NAMES[roleNum] || 'admin';
        roleEl.className = `badge badge-${roleName}`;
        roleEl.textContent = ROLE_DISPLAY[roleNum] || 'Admin';
    }

    updateSidebarMenu();
}

function updateSidebarMenu() {
    const sidebar = document.querySelector('.sidebar-menu');
    if (!sidebar) return;

    const roleNum = currentUser?.roleNum ?? 0;
    let menuHTML = '';

    // Dashboard
    menuHTML += '<li><a onclick="showDashboard()"><i class="fas fa-th-large"></i> Dashboard</a></li>';

    // Classes
    menuHTML += '<li><a onclick="showClasses()"><i class="fas fa-chalkboard"></i> Lớp học</a></li>';

    // Students
    menuHTML += '<li><a onclick="showStudents()"><i class="fas fa-user-graduate"></i> Học sinh</a></li>';

    // Teachers (Admin, CM)
    if (roleNum === ROLES.ADMIN || roleNum === ROLES.CM) {
        menuHTML += '<li><a onclick="showTeachers()"><i class="fas fa-chalkboard-teacher"></i> Giáo viên</a></li>';
    }

    // CMs (Admin only)
    if (roleNum === ROLES.ADMIN) {
        menuHTML += '<li><a onclick="showCMs()"><i class="fas fa-user-shield"></i> Class Manager</a></li>';
    }

    sidebar.innerHTML = menuHTML;

    // Set active
    const firstLink = sidebar.querySelector('li a');
    if (firstLink) firstLink.classList.add('active');
}

// ===== DASHBOARD =====
async function loadDashboard() {
    try {
        showLoading();

        [classes, students, teachers, cms] = await Promise.all([
            API.getClasses().catch(() => []),
            API.getStudents().catch(() => []),
            API.getTeachers().catch(() => []),
            API.getCMs().catch(() => [])
        ]);

        // Normalize data
        classes = normalizeClasses(classes);
        students = normalizeStudents(students);

        // Filter by role
        let filteredClasses = filterClassesByRole(classes);

        // Update stats
        document.getElementById('totalClasses').textContent = filteredClasses.length;
        document.getElementById('totalStudents').textContent = students.length;
        document.getElementById('totalTeachers').textContent = teachers.length;

        // Render recent classes
        renderClassCards(filteredClasses.slice(0, 6), 'dashboardClasses');

        hideLoading();
    } catch (err) {
        hideLoading();
        console.error('loadDashboard error:', err);
        showAlert('error', 'Không thể tải dashboard');
    }
}

async function showDashboard() {
    showContent('dashboardContent');
    setSidebarActive(0);
    await loadDashboard();
}

// ===== DATA NORMALIZERS =====
function normalizeClasses(data) {
    return data.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        teacher: c.teacher,
        teacherId: c.teacherId || c.teacher_id,
        cm: c.cm,
        cmId: c.cmId || c.cm_id,
        startDate: c.startDate || c.start_date,
        weekDay: c.weekDay ?? c.week_day,
        timeSlot: c.timeSlot || c.time_slot,
        color: c.color || 'green',
        totalSessions: c.totalSessions || c.total_sessions || 15,
        students: c.students || c.student_count || 0,
        status: c.status || 'active'
    }));
}

function normalizeStudents(data) {
    return data.map(s => ({
        id: s.id,
        code: s.code,
        name: s.name,
        email: s.email,
        phone: s.phone,
        classId: s.classId || s.class_id,
        className: s.className || s.class_name || s.class_code,
        parentName: s.parentName || s.parent_name,
        parentPhone: s.parentPhone || s.parent_phone,
        parentEmail: s.parentEmail || s.parent_email
    }));
}

function normalizeSessions(data) {
    return data.map(s => ({
        id: s.id,
        classId: s.classId || s.class_id,
        number: s.number || s.session_number,
        date: s.date,
        status: s.status || 'scheduled',
        note: s.note || ''
    }));
}

function filterClassesByRole(classList) {
    const roleNum = currentUser?.roleNum ?? 0;

    if (roleNum === ROLES.TEACHER && currentUser.teacherId) {
        return classList.filter(c => c.teacherId === currentUser.teacherId);
    } else if (roleNum === ROLES.CM && currentUser.cmId) {
        return classList.filter(c => c.cmId === currentUser.cmId);
    }

    return classList;
}

// ===== CLASSES =====
async function loadClasses() {
    try {
        showLoading();
        classes = normalizeClasses(await API.getClasses());
        const filtered = filterClassesByRole(classes);
        renderClassCards(filtered, 'classesGrid');
        hideLoading();
    } catch (err) {
        hideLoading();
        console.error('loadClasses error:', err);
        showAlert('error', 'Không thể tải danh sách lớp');
    }
}

async function showClasses() {
    showContent('classesContent');
    setSidebarActive(1);
    await loadClasses();
}

function renderClassCards(classList, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!classList || classList.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-light);">
                <i class="fas fa-inbox" style="font-size:64px;opacity:0.3;margin-bottom:16px"></i>
                <h3>Không có lớp học</h3>
                <p>${hasPermission('', 'classes', 'create') ? 'Nhấn "Thêm lớp" để tạo mới.' : ''}</p>
            </div>`;
        return;
    }

    container.innerHTML = classList.map(cls => `
        <div class="class-card" onclick="viewClassDetail(${cls.id})">
            <div class="card-header ${cls.color || 'green'}">
                <h3>${cls.name || 'Chưa có tên'}</h3>
                <div class="class-code">Mã: ${cls.code || ''}</div>
            </div>
            <div class="card-body">
                <div class="card-info">
                    <div class="card-info-item"><i class="fas fa-user-tie"></i><span>GV: ${cls.teacher || 'Chưa có'}</span></div>
                    <div class="card-info-item"><i class="fas fa-user-shield"></i><span>CM: ${cls.cm || 'Chưa có'}</span></div>
                    <div class="card-info-item"><i class="fas fa-users"></i><span>${cls.students || 0} học sinh</span></div>
                    <div class="card-info-item"><i class="fas fa-calendar"></i><span>Bắt đầu: ${formatDate(cls.startDate)}</span></div>
                    <div class="card-info-item"><i class="fas fa-clock"></i><span>${getWeekdayName(cls.weekDay)}: ${cls.timeSlot || ''}</span></div>
                    <div class="card-info-item"><i class="fas fa-list"></i><span>${cls.totalSessions} buổi</span></div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary btn-sm" style="flex:1" onclick="event.stopPropagation(); viewClassDetail(${cls.id})">
                        <i class="fas fa-eye"></i> Chi tiết
                    </button>
                    ${hasPermission('', 'classes', 'edit') ? `
                        <button class="action-btn edit" onclick="event.stopPropagation(); editClass(${cls.id})" title="Sửa">
                            <i class="fas fa-edit"></i>
                        </button>` : ''}
                    ${hasPermission('', 'classes', 'delete') ? `
                        <button class="action-btn delete" onclick="event.stopPropagation(); deleteClass(${cls.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function openAddClassModal() {
    document.getElementById('classModalTitle').innerHTML = '<i class="fas fa-plus"></i> Thêm lớp học';
    document.getElementById('classId').value = '';
    document.getElementById('className').value = '';
    document.getElementById('classCode').value = '';
    document.getElementById('classStartDate').value = '';
    document.getElementById('classWeekDay').value = '';
    document.getElementById('classTimeSlot').value = '';
    document.getElementById('sessionsPreview').style.display = 'none';

    populateTeachersSelect();
    populateCMSelect();
    openModal('classModal');
}

async function editClass(classId) {
    const cls = classes.find(c => c.id === classId);
    if (!cls) {
        showAlert('error', 'Không tìm thấy lớp học');
        return;
    }

    document.getElementById('classModalTitle').innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa lớp học';
    document.getElementById('classId').value = cls.id;
    document.getElementById('className').value = cls.name || '';
    document.getElementById('classCode').value = cls.code || '';
    document.getElementById('classStartDate').value = cls.startDate ? cls.startDate.split('T')[0] : '';
    document.getElementById('classWeekDay').value = cls.weekDay ?? '';
    document.getElementById('classTimeSlot').value = cls.timeSlot || '';

    await populateTeachersSelect();
    await populateCMSelect();

    document.getElementById('classTeacher').value = cls.teacherId || '';
    document.getElementById('classCM').value = cls.cmId || '';

    previewSessions();
    openModal('classModal');
}

async function saveClass() {
    try {
        const id = document.getElementById('classId').value;
        const name = document.getElementById('className').value.trim();
        const code = document.getElementById('classCode').value.trim();
        const startDate = document.getElementById('classStartDate').value;
        const weekDay = document.getElementById('classWeekDay').value;
        const timeSlot = document.getElementById('classTimeSlot').value.trim();

        if (!name || !code) {
            showAlert('error', 'Vui lòng nhập tên lớp và mã lớp');
            return;
        }

        const teacherId = parseInt(document.getElementById('classTeacher').value) || null;
        const cmId = parseInt(document.getElementById('classCM').value) || null;

        const teacher = teachers.find(t => t.id === teacherId);
        const cm = cms.find(c => c.id === cmId);

        const payload = {
            name,
            code,
            teacherId,
            teacher: teacher?.name || '',
            cmId,
            cm: cm?.name || '',
            startDate,
            weekDay: weekDay ? parseInt(weekDay) : null,
            timeSlot,
            color: CONFIG.CARD_COLORS[Math.floor(Math.random() * CONFIG.CARD_COLORS.length)],
            totalSessions: 15
        };

        showLoading();

        if (id) {
            await API.updateClass(parseInt(id), payload);
            showAlert('success', 'Cập nhật lớp học thành công!');
        } else {
            await API.createClass(payload);
            showAlert('success', 'Tạo lớp học thành công! Hệ thống đã tạo 15 buổi học.');
        }

        hideLoading();
        closeModal('classModal');
        await loadClasses();
        await loadDashboard();

    } catch (err) {
        hideLoading();
        console.error('saveClass error:', err);
        showAlert('error', err.message || 'Không thể lưu lớp học');
    }
}

async function deleteClass(classId) {
    const cls = classes.find(c => c.id === classId);
    if (!cls) return;

    if (!confirm(`Bạn có chắc muốn xóa lớp "${cls.name}"?\nTất cả dữ liệu điểm danh, nhận xét sẽ bị xóa.`)) {
        return;
    }

    try {
        showLoading();
        await API.deleteClass(classId);
        hideLoading();
        showAlert('success', 'Đã xóa lớp học');
        await loadClasses();
        await loadDashboard();
    } catch (err) {
        hideLoading();
        showAlert('error', err.message || 'Không thể xóa lớp');
    }
}

// ===== CLASS DETAIL =====
async function viewClassDetail(classId) {
    try {
        currentClassId = classId;
        const cls = classes.find(c => c.id === classId);

        if (!cls) {
            showAlert('error', 'Không tìm thấy lớp học');
            return;
        }

        // Render header
        document.getElementById('classDetailHeader').innerHTML = `
            <h3>${cls.name}</h3>
            <p style="opacity:0.9;margin-bottom:8px">Mã lớp: ${cls.code}</p>
            <div class="class-info-grid">
                <div class="class-info-box"><label>Giáo viên</label><strong>${cls.teacher || 'Chưa có'}</strong></div>
                <div class="class-info-box"><label>Class Manager</label><strong>${cls.cm || 'Chưa có'}</strong></div>
                <div class="class-info-box"><label>Số học sinh</label><strong>${cls.students || 0}</strong></div>
                <div class="class-info-box"><label>Bắt đầu</label><strong>${formatDate(cls.startDate)}</strong></div>
                <div class="class-info-box"><label>Buổi học</label><strong>${cls.totalSessions} buổi</strong></div>
            </div>
        `;

        // Render students
        renderClassStudents(classId);

        // Reset to first tab
        switchToTab('studentsTab');

        openModal('classDetailModal');

    } catch (err) {
        console.error('viewClassDetail error:', err);
        showAlert('error', 'Không thể mở chi tiết lớp');
    }
}

function renderClassStudents(classId) {
    const classStudents = students.filter(s => s.classId === classId);
    const container = document.getElementById('classStudentsList');

    if (classStudents.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:40px;">Chưa có học sinh trong lớp này</p>';
        return;
    }

    container.innerHTML = classStudents.map(s => `
        <div class="student-item" data-student-id="${s.id}">
            <div class="student-avatar">${getInitials(s.name)}</div>
            <div class="student-info">
                <h4>${s.name}</h4>
                <p>MSSV: ${s.code} • ${s.email || 'Chưa có email'}</p>
            </div>
            <div class="student-stats">
                <div class="student-stat"><strong style="color:#10b981;">-</strong><span>Đúng giờ</span></div>
                <div class="student-stat"><strong style="color:#f59e0b;">-</strong><span>Muộn</span></div>
                <div class="student-stat"><strong style="color:#06b6d4;">-</strong><span>Có phép</span></div>
                <div class="student-stat"><strong style="color:#ef4444;">-</strong><span>Vắng</span></div>
            </div>
        </div>
    `).join('');

    // Load attendance stats async
    loadStudentAttendanceStats(classId, classStudents);
}

async function loadStudentAttendanceStats(classId, classStudents) {
    try {
        const allAttendance = await API.getAttendanceByClass(classId);

        const stats = {};
        classStudents.forEach(s => {
            stats[s.id] = { onTime: 0, late: 0, excused: 0, absent: 0 };
        });

        allAttendance.forEach(record => {
            const studentId = record.student_id || record.studentId;
            if (stats[studentId]) {
                switch (record.status) {
                    case 'on-time': stats[studentId].onTime++; break;
                    case 'late': stats[studentId].late++; break;
                    case 'excused': stats[studentId].excused++; break;
                    case 'absent': stats[studentId].absent++; break;
                }
            }
        });

        // Update UI
        Object.keys(stats).forEach(studentId => {
            const el = document.querySelector(`.student-item[data-student-id="${studentId}"] .student-stats`);
            if (el) {
                el.innerHTML = `
                    <div class="student-stat"><strong style="color:#10b981;">${stats[studentId].onTime}</strong><span>Đúng giờ</span></div>
                    <div class="student-stat"><strong style="color:#f59e0b;">${stats[studentId].late}</strong><span>Muộn</span></div>
                    <div class="student-stat"><strong style="color:#06b6d4;">${stats[studentId].excused}</strong><span>Có phép</span></div>
                    <div class="student-stat"><strong style="color:#ef4444;">${stats[studentId].absent}</strong><span>Vắng</span></div>
                `;
            }
        });

    } catch (err) {
        console.error('Error loading attendance stats:', err);
    }
}

// ===== ATTENDANCE TAB - FIXED VERSION =====
async function loadAttendanceTab() {
    const container = document.getElementById('sessionsGrid');
    const tableContainer = document.getElementById('attendanceTableContainer');

    if (!container || !currentClassId) return;

    try {
        showLoading();

        // Get sessions from API
        currentSessions = await API.getSessions(currentClassId);
        currentSessions = normalizeSessions(currentSessions);

        console.log('📅 Loaded sessions:', currentSessions.length);

        if (currentSessions.length === 0) {
            container.innerHTML = `
                <div style="padding:40px;text-align:center;color:var(--text-light);">
                    <i class="fas fa-calendar-times" style="font-size:48px;opacity:0.3;margin-bottom:16px"></i>
                    <h3>Chưa có buổi học</h3>
                    <p style="margin-top:8px;">Hệ thống chưa tạo lịch học cho lớp này</p>
                </div>`;

            if (tableContainer) tableContainer.innerHTML = '';
            hideLoading();
            return;
        }

        // Render session cards
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        container.innerHTML = currentSessions.map((session, index) => {
            const sessionDate = new Date(session.date);
            sessionDate.setHours(0, 0, 0, 0);

            const isPast = sessionDate < today;
            const isToday = sessionDate.getTime() === today.getTime();

            let statusText = 'Sắp tới';
            let statusClass = '';

            if (isPast) {
                statusText = 'Đã qua';
                statusClass = 'text-muted';
            }
            if (isToday) {
                statusText = 'Hôm nay';
                statusClass = 'text-primary';
            }

            return `
                <div class="session-card ${index === 0 ? 'active' : ''}" 
                     data-session="${session.number}"
                     data-date="${session.date}"
                     onclick="selectSession(${session.number}, '${session.date}')">
                    <h4>Buổi ${session.number}</h4>
                    <p style="font-size:12px;margin:4px 0;">${formatDate(session.date)}</p>
                    <p style="font-size:11px;opacity:0.8;" class="${statusClass}">${statusText}</p>
                </div>
            `;
        }).join('');

        hideLoading();

        // Auto select first session
        if (currentSessions.length > 0) {
            await selectSession(currentSessions[0].number, currentSessions[0].date);
        }

    } catch (err) {
        hideLoading();
        console.error('❌ Error loading attendance tab:', err);
        showAlert('error', 'Không thể tải danh sách buổi học: ' + err.message);
    }
}

async function selectSession(sessionNumber, sessionDate) {
    currentSessionNumber = sessionNumber;
    currentSessionDate = sessionDate;

    console.log('📌 Selected session:', sessionNumber, sessionDate);

    // Update active state on session cards
    document.querySelectorAll('.session-card').forEach(card => {
        const cardSession = parseInt(card.dataset.session);
        card.classList.toggle('active', cardSession === sessionNumber);
    });

    // Render attendance table
    await renderAttendanceTable();
}

async function renderAttendanceTable() {
    const classStudents = students.filter(s => s.classId === currentClassId);
    const container = document.getElementById('attendanceTableContainer');

    if (!container) {
        console.error('❌ attendanceTableContainer not found');
        return;
    }

    if (classStudents.length === 0) {
        container.innerHTML = `
            <div class="alert alert-warning" style="margin:20px;">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Chưa có học sinh trong lớp này. Vui lòng thêm học sinh trước khi điểm danh.</span>
            </div>
        `;
        return;
    }

    try {
        showLoading();

        // Get attendance records for this session
        const attendanceRecords = await API.getAttendance(currentClassId, currentSessionNumber);
        console.log('📊 Attendance records:', attendanceRecords.length);

        // Create attendance map
        const attendanceMap = {};
        attendanceRecords.forEach(r => {
            const studentId = r.student_id || r.studentId;
            attendanceMap[studentId] = {
                status: r.status || 'on-time',
                note: r.note || ''
            };
        });

        const canEdit = hasPermission('', 'attendance', 'edit');

        // Render table
        container.innerHTML = `
            <div style="padding:20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
                <h3>Điểm danh Buổi ${currentSessionNumber} - ${formatDate(currentSessionDate)}</h3>
                ${canEdit ? `
                    <button class="btn btn-primary btn-sm" onclick="saveAttendance()">
                        <i class="fas fa-save"></i> Lưu điểm danh
                    </button>` : `
                    <span class="badge badge-info">Chỉ xem</span>`
            }
            </div>
            <div style="overflow-x:auto;">
                <table>
                    <thead>
                        <tr>
                            <th style="width:50px">STT</th>
                            <th>Họ tên</th>
                            <th style="width:100px">MSSV</th>
                            <th style="width:200px">Trạng thái</th>
                            <th style="width:250px">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${classStudents.map((student, index) => {
                const att = attendanceMap[student.id] || { status: 'on-time', note: '' };
                return `
                                <tr data-student-id="${student.id}">
                                    <td>${index + 1}</td>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:10px;">
                                            <div class="student-avatar" style="width:32px;height:32px;font-size:13px;">
                                                ${getInitials(student.name)}
                                            </div>
                                            <strong>${student.name}</strong>
                                        </div>
                                    </td>
                                    <td>${student.code}</td>
                                    <td>
                                        <div class="attendance-status">
                                            <button type="button" 
                                                class="status-btn on-time ${att.status === 'on-time' ? 'active' : ''}" 
                                                onclick="setAttendance(this, 'on-time')" 
                                                ${!canEdit ? 'disabled' : ''}
                                                title="Đúng giờ">
                                                ✓
                                            </button>
                                            <button type="button" 
                                                class="status-btn late ${att.status === 'late' ? 'active' : ''}" 
                                                onclick="setAttendance(this, 'late')" 
                                                ${!canEdit ? 'disabled' : ''}
                                                title="Muộn">
                                                ⏰
                                            </button>
                                            <button type="button" 
                                                class="status-btn excused ${att.status === 'excused' ? 'active' : ''}" 
                                                onclick="setAttendance(this, 'excused')" 
                                                ${!canEdit ? 'disabled' : ''}
                                                title="Có phép">
                                                📝
                                            </button>
                                            <button type="button" 
                                                class="status-btn absent ${att.status === 'absent' ? 'active' : ''}" 
                                                onclick="setAttendance(this, 'absent')" 
                                                ${!canEdit ? 'disabled' : ''}
                                                title="Vắng">
                                                ✗
                                            </button>
                                        </div>
                                    </td>
                                    <td>
                                        <input type="text" 
                                            class="note-input" 
                                            placeholder="Ghi chú..."
                                            value="${att.note || ''}" 
                                            ${!canEdit ? 'readonly' : ''}>
                                    </td>
                                </tr>
                            `;
            }).join('')}
                    </tbody>
                </table>
            </div>
            ${canEdit ? `
                <div style="padding:20px;text-align:center;border-top:1px solid var(--border);background:var(--bg-main);">
                    <button class="btn btn-primary" onclick="saveAttendance()">
                        <i class="fas fa-save"></i> Lưu điểm danh
                    </button>
                </div>
            ` : ''}
        `;

        hideLoading();

    } catch (err) {
        hideLoading();
        console.error('❌ Error rendering attendance:', err);
        container.innerHTML = `
            <div class="alert alert-error" style="margin:20px;">
                <i class="fas fa-exclamation-circle"></i> 
                <span>Không thể tải bảng điểm danh: ${err.message}</span>
            </div>
        `;
    }
}

function setAttendance(button, status) {
    const tr = button.closest('tr');
    if (!tr) return;

    // Remove active from all buttons in this row
    tr.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('active'));

    // Add active to clicked button
    button.classList.add('active');

    console.log('✅ Set attendance:', tr.dataset.studentId, status);
}

async function saveAttendance() {
    if (!currentSessionNumber || !currentClassId) {
        showAlert('error', 'Chưa chọn buổi học');
        return;
    }

    const records = [];
    const rows = document.querySelectorAll('#attendanceTableContainer tbody tr');

    rows.forEach(row => {
        const studentId = parseInt(row.dataset.studentId);
        const activeBtn = row.querySelector('.status-btn.active');
        const noteInput = row.querySelector('.note-input');

        if (!studentId) return;

        let status = 'on-time'; // default

        if (activeBtn) {
            if (activeBtn.classList.contains('late')) status = 'late';
            else if (activeBtn.classList.contains('excused')) status = 'excused';
            else if (activeBtn.classList.contains('absent')) status = 'absent';
            else if (activeBtn.classList.contains('on-time')) status = 'on-time';
        }

        records.push({
            studentId: studentId,
            status: status,
            note: noteInput?.value?.trim() || ''
        });
    });

    console.log('💾 Saving attendance:', records.length, 'records');

    try {
        showLoading();
        await API.saveAttendance(currentClassId, currentSessionNumber, records, false);
        hideLoading();
        showAlert('success', `Đã lưu điểm danh buổi ${currentSessionNumber} thành công!`);

        // Reload student stats
        const classStudents = students.filter(s => s.classId === currentClassId);
        await loadStudentAttendanceStats(currentClassId, classStudents);

    } catch (err) {
        hideLoading();
        console.error('❌ Save attendance error:', err);
        showAlert('error', 'Không thể lưu điểm danh: ' + err.message);
    }
}

// ===== COMMENTS TAB =====
async function loadCommentsTab() {
    const classStudents = students.filter(s => s.classId === currentClassId);
    const container = document.getElementById('commentsStudentsList');
    if (!container) return;

    try {
        showLoading();

        const commentsMap = await API.getCommentsByClass(currentClassId);
        const canEdit = hasPermission('', 'comments', 'edit');

        container.innerHTML = classStudents.map(s => `
            <div class="student-item" data-student-id="${s.id}">
                <div class="student-avatar">${getInitials(s.name)}</div>
                <div class="student-info" style="flex:1">
                    <h4>${s.name}</h4>
                    <p>MSSV: ${s.code}</p>
                    <textarea class="note-input comment-input" rows="2" 
                        placeholder="Nhận xét về học sinh..."
                        ${!canEdit ? 'readonly' : ''}>${commentsMap[s.id] || ''}</textarea>
                </div>
            </div>
        `).join('');

        hideLoading();

    } catch (err) {
        hideLoading();
        console.error('Error loading comments:', err);
    }
}

async function saveComments() {
    const comments = [];
    const items = document.querySelectorAll('#commentsStudentsList .student-item');

    items.forEach(item => {
        const studentId = parseInt(item.dataset.studentId);
        const textarea = item.querySelector('.comment-input');
        const comment = textarea?.value?.trim() || '';

        if (studentId && comment) {
            comments.push({ studentId, comment });
        }
    });

    try {
        showLoading();
        await API.saveComments(currentClassId, comments);
        hideLoading();
        showAlert('success', 'Đã lưu nhận xét!');
    } catch (err) {
        hideLoading();
        showAlert('error', err.message || 'Không thể lưu nhận xét');
    }
}

// ===== STUDENTS =====
async function loadStudents() {
    try {
        showLoading();
        students = normalizeStudents(await API.getStudents());
        if (!classes.length) classes = normalizeClasses(await API.getClasses());
        renderStudentsTable();
        hideLoading();
    } catch (err) {
        hideLoading();
        showAlert('error', 'Không thể tải danh sách học sinh');
    }
}

async function showStudents() {
    showContent('studentsContent');
    setSidebarActive(2);
    await loadStudents();
}

function renderStudentsTable() {
    const tbody = document.getElementById('studentsTable');
    if (!tbody) return;

    if (!students.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px">Chưa có học sinh</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(s => `
        <tr>
            <td>${s.code}</td>
            <td>
                <div style="display:flex;align-items:center;gap:12px">
                    <div class="avatar" style="width:36px;height:36px;font-size:14px">${getInitials(s.name)}</div>
                    <span>${s.name}</span>
                </div>
            </td>
            <td>${s.email || '-'}</td>
            <td>${s.phone || '-'}</td>
            <td>${s.className || '-'}</td>
            <td>
                ${hasPermission('', 'students', 'edit') ? `
                    <button class="action-btn edit" onclick="editStudent(${s.id})"><i class="fas fa-edit"></i></button>` : ''}
                ${hasPermission('', 'students', 'delete') ? `
                    <button class="action-btn delete" onclick="deleteStudent(${s.id})"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

async function openAddStudentModal() {
    document.getElementById('studentModalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Thêm học sinh';
    document.getElementById('studentId').value = '';
    document.getElementById('studentCode').value = '';
    document.getElementById('studentName').value = '';
    document.getElementById('studentEmail').value = '';
    document.getElementById('studentPhone').value = '';
    await populateClassesSelect();
    openModal('studentModal');
}

async function editStudent(studentId) {
    const s = students.find(x => x.id === studentId);
    if (!s) return;

    document.getElementById('studentModalTitle').innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa học sinh';
    document.getElementById('studentId').value = s.id;
    document.getElementById('studentCode').value = s.code || '';
    document.getElementById('studentName').value = s.name || '';
    document.getElementById('studentEmail').value = s.email || '';
    document.getElementById('studentPhone').value = s.phone || '';

    await populateClassesSelect();
    document.getElementById('studentClass').value = s.classId || '';

    openModal('studentModal');
}

async function saveStudent() {
    try {
        const id = document.getElementById('studentId').value;
        const code = document.getElementById('studentCode').value.trim();
        const name = document.getElementById('studentName').value.trim();

        if (!code || !name) {
            showAlert('error', 'Vui lòng nhập mã và tên học sinh');
            return;
        }

        const classId = parseInt(document.getElementById('studentClass').value) || null;
        const cls = classes.find(c => c.id === classId);

        const payload = {
            code,
            name,
            email: document.getElementById('studentEmail').value.trim(),
            phone: document.getElementById('studentPhone').value.trim(),
            classId,
            className: cls?.code || ''
        };

        showLoading();

        if (id) {
            await API.updateStudent(parseInt(id), payload);
            showAlert('success', 'Cập nhật học sinh thành công');
        } else {
            await API.createStudent(payload);
            showAlert('success', 'Thêm học sinh thành công');
        }

        hideLoading();
        closeModal('studentModal');
        await loadStudents();
        await loadDashboard();

    } catch (err) {
        hideLoading();
        showAlert('error', err.message || 'Không thể lưu học sinh');
    }
}

async function deleteStudent(studentId) {
    const s = students.find(x => x.id === studentId);
    if (!s) return;

    if (!confirm(`Xóa học sinh "${s.name}"?`)) return;

    try {
        showLoading();
        await API.deleteStudent(studentId);
        hideLoading();
        showAlert('success', 'Đã xóa học sinh');
        await loadStudents();
    } catch (err) {
        hideLoading();
        showAlert('error', err.message);
    }
}

// ===== TEACHERS =====
async function loadTeachers() {
    try {
        showLoading();
        teachers = await API.getTeachers();
        renderTeachersTable();
        hideLoading();
    } catch (err) {
        hideLoading();
        showAlert('error', 'Không thể tải danh sách giáo viên');
    }
}

async function showTeachers() {
    showContent('teachersContent');
    setSidebarActive(3);
    await loadTeachers();
}

function renderTeachersTable() {
    const tbody = document.getElementById('teachersTable');
    if (!tbody) return;

    if (!teachers.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px">Chưa có giáo viên</td></tr>';
        return;
    }

    tbody.innerHTML = teachers.map(t => `
        <tr>
            <td>${t.code}</td>
            <td>
                <div style="display:flex;align-items:center;gap:12px">
                    <div class="avatar" style="width:36px;height:36px;font-size:14px">${getInitials(t.name)}</div>
                    <span>${t.name}</span>
                </div>
            </td>
            <td>${t.email || '-'}</td>
            <td>${t.phone || '-'}</td>
            <td>${t.subject || '-'}</td>
            <td><span class="status ${t.active ? 'status-active' : 'status-pending'}">${t.active ? 'Hoạt động' : 'Tạm dừng'}</span></td>
            <td>
                ${hasPermission('', 'teachers', 'edit') ? `
                    <button class="action-btn edit" onclick="editTeacher(${t.id})"><i class="fas fa-edit"></i></button>` : ''}
                ${hasPermission('', 'teachers', 'delete') ? `
                    <button class="action-btn delete" onclick="deleteTeacher(${t.id})"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

function openAddTeacherModal() {
    document.getElementById('teacherModalTitle').innerHTML = '<i class="fas fa-chalkboard-teacher"></i> Thêm giáo viên';
    document.getElementById('teacherId').value = '';
    document.getElementById('teacherCode').value = '';
    document.getElementById('teacherName').value = '';
    document.getElementById('teacherEmail').value = '';
    document.getElementById('teacherPhone').value = '';
    document.getElementById('teacherSubject').value = '';
    openModal('teacherModal');
}

async function editTeacher(teacherId) {
    const t = teachers.find(x => x.id === teacherId);
    if (!t) return;

    document.getElementById('teacherModalTitle').innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa giáo viên';
    document.getElementById('teacherId').value = t.id;
    document.getElementById('teacherCode').value = t.code || '';
    document.getElementById('teacherName').value = t.name || '';
    document.getElementById('teacherEmail').value = t.email || '';
    document.getElementById('teacherPhone').value = t.phone || '';
    document.getElementById('teacherSubject').value = t.subject || '';
    openModal('teacherModal');
}

async function saveTeacher() {
    try {
        const id = document.getElementById('teacherId').value;
        const code = document.getElementById('teacherCode').value.trim();
        const name = document.getElementById('teacherName').value.trim();

        if (!code || !name) {
            showAlert('error', 'Vui lòng nhập mã và tên');
            return;
        }

        const payload = {
            code,
            name,
            email: document.getElementById('teacherEmail').value.trim(),
            phone: document.getElementById('teacherPhone').value.trim(),
            subject: document.getElementById('teacherSubject').value.trim(),
            active: true
        };

        showLoading();

        if (id) {
            await API.updateTeacher(parseInt(id), payload);
            showAlert('success', 'Cập nhật giáo viên thành công');
        } else {
            await API.createTeacher(payload);
            showAlert('success', 'Thêm giáo viên thành công');
        }

        hideLoading();
        closeModal('teacherModal');
        await loadTeachers();

    } catch (err) {
        hideLoading();
        showAlert('error', err.message);
    }
}

async function deleteTeacher(teacherId) {
    const t = teachers.find(x => x.id === teacherId);
    if (!t) return;

    if (!confirm(`Xóa giáo viên "${t.name}"?`)) return;

    try {
        showLoading();
        await API.deleteTeacher(teacherId);
        hideLoading();
        showAlert('success', 'Đã xóa giáo viên');
        await loadTeachers();
    } catch (err) {
        hideLoading();
        showAlert('error', err.message);
    }
}

// ===== CLASS MANAGERS =====
async function loadCMs() {
    try {
        showLoading();
        cms = await API.getCMs();
        if (!classes.length) classes = normalizeClasses(await API.getClasses());
        renderCMsTable();
        hideLoading();
    } catch (err) {
        hideLoading();
        showAlert('error', 'Không thể tải danh sách CM');
    }
}

async function showCMs() {
    showContent('cmsContent');
    setSidebarActive(4);
    await loadCMs();
}

function renderCMsTable() {
    const tbody = document.getElementById('cmsTable');
    if (!tbody) return;

    if (!cms.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px">Chưa có Class Manager</td></tr>';
        return;
    }

    const cmClassCount = {};
    classes.forEach(c => {
        if (c.cmId) cmClassCount[c.cmId] = (cmClassCount[c.cmId] || 0) + 1;
    });

    tbody.innerHTML = cms.map(cm => `
        <tr>
            <td>${cm.code}</td>
            <td>
                <div style="display:flex;align-items:center;gap:12px">
                    <div class="avatar" style="width:36px;height:36px;font-size:14px">${getInitials(cm.name)}</div>
                    <span>${cm.name}</span>
                </div>
            </td>
            <td>${cm.email || '-'}</td>
            <td>${cm.phone || '-'}</td>
            <td><strong style="color:var(--primary)">${cmClassCount[cm.id] || 0}</strong> lớp</td>
            <td><span class="status ${cm.active ? 'status-active' : 'status-pending'}">${cm.active ? 'Hoạt động' : 'Tạm dừng'}</span></td>
            <td>
                <button class="action-btn view" onclick="viewCMDetail(${cm.id})"><i class="fas fa-eye"></i></button>
                ${hasPermission('', 'cms', 'edit') ? `
                    <button class="action-btn edit" onclick="editCM(${cm.id})"><i class="fas fa-edit"></i></button>` : ''}
                ${hasPermission('', 'cms', 'delete') ? `
                    <button class="action-btn delete" onclick="deleteCM(${cm.id})"><i class="fas fa-trash"></i></button>` : ''}
            </td>
        </tr>
    `).join('');
}

function openAddCMModal() {
    document.getElementById('cmModalTitle').innerHTML = '<i class="fas fa-user-shield"></i> Thêm Class Manager';
    document.getElementById('cmId').value = '';
    document.getElementById('cmCode').value = '';
    document.getElementById('cmName').value = '';
    document.getElementById('cmEmail').value = '';
    document.getElementById('cmPhone').value = '';
    openModal('cmModal');
}

async function editCM(cmId) {
    const cm = cms.find(x => x.id === cmId);
    if (!cm) return;

    document.getElementById('cmModalTitle').innerHTML = '<i class="fas fa-edit"></i> Chỉnh sửa Class Manager';
    document.getElementById('cmId').value = cm.id;
    document.getElementById('cmCode').value = cm.code || '';
    document.getElementById('cmName').value = cm.name || '';
    document.getElementById('cmEmail').value = cm.email || '';
    document.getElementById('cmPhone').value = cm.phone || '';
    openModal('cmModal');
}

async function saveCM() {
    try {
        const id = document.getElementById('cmId').value;
        const code = document.getElementById('cmCode').value.trim();
        const name = document.getElementById('cmName').value.trim();

        if (!name) {
            showAlert('error', 'Vui lòng nhập tên CM');
            return;
        }

        const payload = {
            code,
            name,
            email: document.getElementById('cmEmail').value.trim(),
            phone: document.getElementById('cmPhone').value.trim(),
            active: true
        };

        showLoading();

        if (id) {
            await API.updateCM(parseInt(id), payload);
            showAlert('success', 'Cập nhật CM thành công');
        } else {
            await API.createCM(payload);
            showAlert('success', 'Thêm CM thành công');
        }

        hideLoading();
        closeModal('cmModal');
        await loadCMs();

    } catch (err) {
        hideLoading();
        showAlert('error', err.message);
    }
}

async function deleteCM(cmId) {
    const cm = cms.find(x => x.id === cmId);
    if (!cm) return;

    if (!confirm(`Xóa CM "${cm.name}"?`)) return;

    try {
        showLoading();
        await API.deleteCM(cmId);
        hideLoading();
        showAlert('success', 'Đã xóa CM');
        await loadCMs();
    } catch (err) {
        hideLoading();
        showAlert('error', err.message);
    }
}

async function viewCMDetail(cmId) {
    try {
        showLoading();

        const cm = await API.getCM(cmId);
        const cmClasses = classes.filter(c => c.cmId === cmId);

        document.getElementById('cmDetailHeader').innerHTML = `
            <h3>${cm.name}</h3>
            <p style="opacity:0.9;margin-bottom:8px">Mã CM: ${cm.code || 'N/A'}</p>
            <div class="class-info-grid">
                <div class="class-info-box"><label>Email</label><strong>${cm.email || 'Chưa có'}</strong></div>
                <div class="class-info-box"><label>Số điện thoại</label><strong>${cm.phone || 'Chưa có'}</strong></div>
                <div class="class-info-box"><label>Trạng thái</label><strong>${cm.active ? '✓ Hoạt động' : '⊘ Tạm dừng'}</strong></div>
                <div class="class-info-box"><label>Số lớp quản lý</label><strong>${cmClasses.length} lớp</strong></div>
            </div>
        `;

        // Render classes
        const classesContainer = document.getElementById('cmClassesList');
        if (cmClasses.length === 0) {
            classesContainer.innerHTML = '<p style="text-align:center;padding:40px;color:var(--text-light)">CM này chưa quản lý lớp nào</p>';
        } else {
            classesContainer.innerHTML = cmClasses.map(cls => `
                <div class="class-card" onclick="closeModal('cmDetailModal'); viewClassDetail(${cls.id})">
                    <div class="card-header ${cls.color}">
                        <h3>${cls.name}</h3>
                        <div class="class-code">Mã: ${cls.code}</div>
                    </div>
                    <div class="card-body">
                        <div class="card-info">
                            <div class="card-info-item"><i class="fas fa-user-tie"></i><span>GV: ${cls.teacher || 'Chưa có'}</span></div>
                            <div class="card-info-item"><i class="fas fa-users"></i><span>${cls.students || 0} học sinh</span></div>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        hideLoading();
        openModal('cmDetailModal');

    } catch (err) {
        hideLoading();
        showAlert('error', err.message);
    }
}

// ===== POPULATE SELECTS =====
async function populateTeachersSelect() {
    if (!teachers.length) teachers = await API.getTeachers();
    const el = document.getElementById('classTeacher');
    if (el) {
        el.innerHTML = '<option value="">Chọn giáo viên</option>' +
            teachers.filter(t => t.active !== false).map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }
}

async function populateCMSelect() {
    if (!cms.length) cms = await API.getCMs();
    const el = document.getElementById('classCM');
    if (el) {
        el.innerHTML = '<option value="">Chọn CM</option>' +
            cms.filter(c => c.active !== false).map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
}

async function populateClassesSelect() {
    if (!classes.length) classes = normalizeClasses(await API.getClasses());
    const el = document.getElementById('studentClass');
    if (el) {
        el.innerHTML = '<option value="">Chọn lớp học</option>' +
            classes.map(c => `<option value="${c.id}">${c.code} - ${c.name}</option>`).join('');
    }
}

// ===== MODAL & TAB HELPERS =====
function openModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
        m.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) {
        m.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function switchTab(event, tabId) {
    // Get the modal element
    const modal = event.target.closest('.modal');
    if (!modal) {
        console.error('❌ Modal not found');
        return;
    }

    // Update tab active state
    const tabs = modal.querySelector('.tabs');
    if (tabs) {
        tabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
    }

    // Update tab content active state
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        const targetContent = modalBody.querySelector(`#${tabId}`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }

    // Load tab content
    if (tabId === 'attendanceTab') {
        loadAttendanceTab();
    } else if (tabId === 'commentsTab') {
        loadCommentsTab();
    }
}

function switchToTab(tabId) {
    const tabs = document.querySelector('#classDetailModal .tabs');
    if (!tabs) return;

    tabs.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.getAttribute('onclick')?.includes(tabId));
    });

    const modalBody = document.querySelector('#classDetailModal .modal-body');
    modalBody.querySelectorAll('.tab-content').forEach(c => {
        c.classList.toggle('active', c.id === tabId);
    });
}

// Close modal on outside click
window.onclick = function (event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

// ===== UTILITIES =====
function showAlert(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i> <span>${message}</span>`;

    const container = document.querySelector('.main-content') || document.body;
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => alertDiv.remove(), 5000);
}

function showLoading() {
    const l = document.getElementById('loadingOverlay');
    if (l) l.classList.add('active');
}

function hideLoading() {
    const l = document.getElementById('loadingOverlay');
    if (l) l.classList.remove('active');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN');
    } catch {
        return dateStr;
    }
}

function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').slice(-2).map(n => n[0]).join('').toUpperCase();
}

function getWeekdayName(day) {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const num = parseInt(day);
    return days[num] || '';
}

function previewSessions() {
    const startDate = document.getElementById('classStartDate').value;
    const weekDay = document.getElementById('classWeekDay').value;
    const preview = document.getElementById('sessionsPreview');
    if (!preview) return;

    if (!startDate || weekDay === '') {
        preview.style.display = 'none';
        return;
    }

    const sessions = generateSessions(startDate, parseInt(weekDay), 15);
    preview.style.display = 'block';
    preview.innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            <div>
                <strong>15 buổi học sẽ được tạo:</strong>
                <p style="margin-top:8px;font-size:13px;">
                    Buổi 1: ${formatDate(sessions[0]?.date)} → Buổi 15: ${formatDate(sessions[14]?.date)}
                </p>
            </div>
        </div>
    `;
}

function generateSessions(startDate, weekDay, total = 15) {
    const sessions = [];
    const start = new Date(startDate);

    // Find first weekday
    let first = new Date(start);
    if (!isNaN(weekDay) && weekDay >= 0 && weekDay <= 6) {
        while (first.getDay() !== weekDay) {
            first.setDate(first.getDate() + 1);
        }
    }

    for (let i = 0; i < total; i++) {
        const d = new Date(first);
        d.setDate(first.getDate() + i * 7);
        sessions.push({ number: i + 1, date: d.toISOString().slice(0, 10) });
    }

    return sessions;
}

// ===== EXCEL EXPORT (Frontend) =====
async function exportAllData() {
    try {
        showLoading();

        const wb = XLSX.utils.book_new();

        // Classes
        const classesSheet = XLSX.utils.json_to_sheet(classes.map(c => ({
            'Mã lớp': c.code,
            'Tên lớp': c.name,
            'Giáo viên': c.teacher,
            'CM': c.cm,
            'Học sinh': c.students,
            'Bắt đầu': formatDate(c.startDate)
        })));
        XLSX.utils.book_append_sheet(wb, classesSheet, 'Lớp học');

        // Students
        const studentsSheet = XLSX.utils.json_to_sheet(students.map(s => ({
            'MSSV': s.code,
            'Họ tên': s.name,
            'Email': s.email,
            'SĐT': s.phone,
            'Lớp': s.className
        })));
        XLSX.utils.book_append_sheet(wb, studentsSheet, 'Học sinh');

        // Teachers
        const teachersSheet = XLSX.utils.json_to_sheet(teachers.map(t => ({
            'Mã GV': t.code,
            'Họ tên': t.name,
            'Email': t.email,
            'SĐT': t.phone,
            'Chuyên môn': t.subject
        })));
        XLSX.utils.book_append_sheet(wb, teachersSheet, 'Giáo viên');

        XLSX.writeFile(wb, `ClassFlow_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);

        hideLoading();
        showAlert('success', 'Export thành công!');

    } catch (err) {
        hideLoading();
        showAlert('error', 'Không thể export');
    }
}

async function exportClasses() {
    try {
        showLoading();
        const wb = XLSX.utils.book_new();
        const filtered = filterClassesByRole(classes);
        const ws = XLSX.utils.json_to_sheet(filtered.map(c => ({
            'Mã lớp': c.code,
            'Tên lớp': c.name,
            'Giáo viên': c.teacher,
            'CM': c.cm,
            'Học sinh': c.students,
            'Bắt đầu': formatDate(c.startDate),
            'Thứ': getWeekdayName(c.weekDay),
            'Giờ học': c.timeSlot
        })));
        XLSX.utils.book_append_sheet(wb, ws, 'Lớp học');
        XLSX.writeFile(wb, `Danh_sach_lop_${new Date().toISOString().slice(0, 10)}.xlsx`);
        hideLoading();
        showAlert('success', 'Export thành công!');
    } catch (err) {
        hideLoading();
        showAlert('error', 'Không thể export');
    }
}

async function exportStudents() {
    try {
        showLoading();
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(students.map(s => ({
            'MSSV': s.code,
            'Họ tên': s.name,
            'Email': s.email,
            'SĐT': s.phone,
            'Lớp': s.className
        })));
        XLSX.utils.book_append_sheet(wb, ws, 'Học sinh');
        XLSX.writeFile(wb, `Danh_sach_hoc_sinh_${new Date().toISOString().slice(0, 10)}.xlsx`);
        hideLoading();
        showAlert('success', 'Export thành công!');
    } catch (err) {
        hideLoading();
        showAlert('error', 'Không thể export');
    }
}

async function exportTeachers() {
    try {
        showLoading();
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(teachers.map(t => ({
            'Mã GV': t.code,
            'Họ tên': t.name,
            'Email': t.email,
            'SĐT': t.phone,
            'Chuyên môn': t.subject,
            'Trạng thái': t.active ? 'Hoạt động' : 'Tạm dừng'
        })));
        XLSX.utils.book_append_sheet(wb, ws, 'Giáo viên');
        XLSX.writeFile(wb, `Danh_sach_giao_vien_${new Date().toISOString().slice(0, 10)}.xlsx`);
        hideLoading();
        showAlert('success', 'Export thành công!');
    } catch (err) {
        hideLoading();
        showAlert('error', 'Không thể export');
    }
}

async function exportCMs() {
    try {
        showLoading();
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(cms.map(cm => ({
            'Mã CM': cm.code,
            'Họ tên': cm.name,
            'Email': cm.email,
            'SĐT': cm.phone,
            'Số lớp': classes.filter(c => c.cmId === cm.id).length,
            'Trạng thái': cm.active ? 'Hoạt động' : 'Tạm dừng'
        })));
        XLSX.utils.book_append_sheet(wb, ws, 'Class Manager');
        XLSX.writeFile(wb, `Danh_sach_CM_${new Date().toISOString().slice(0, 10)}.xlsx`);
        hideLoading();
        showAlert('success', 'Export thành công!');
    } catch (err) {
        hideLoading();
        showAlert('error', 'Không thể export');
    }
}

// ===== EXPOSE TO WINDOW =====
window.login = login;
window.logout = logout;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.register = register;
window.forgotPassword = forgotPassword;

window.showDashboard = showDashboard;
window.showClasses = showClasses;
window.showStudents = showStudents;
window.showTeachers = showTeachers;
window.showCMs = showCMs;

window.viewClassDetail = viewClassDetail;
window.openAddClassModal = openAddClassModal;
window.editClass = editClass;
window.saveClass = saveClass;
window.deleteClass = deleteClass;

window.openAddStudentModal = openAddStudentModal;
window.editStudent = editStudent;
window.saveStudent = saveStudent;
window.deleteStudent = deleteStudent;

window.openAddTeacherModal = openAddTeacherModal;
window.editTeacher = editTeacher;
window.saveTeacher = saveTeacher;
window.deleteTeacher = deleteTeacher;

window.openAddCMModal = openAddCMModal;
window.editCM = editCM;
window.saveCM = saveCM;
window.deleteCM = deleteCM;
window.viewCMDetail = viewCMDetail;

window.selectSession = selectSession;
window.setAttendance = setAttendance;
window.saveAttendance = saveAttendance;
window.saveComments = saveComments;

window.switchTab = switchTab;
window.openModal = openModal;
window.closeModal = closeModal;
window.previewSessions = previewSessions;

window.exportAllData = exportAllData;
window.exportClasses = exportClasses;
window.exportStudents = exportStudents;
window.exportTeachers = exportTeachers;
window.exportCMs = exportCMs;

console.log('✅ App.js v2.0 loaded successfully');
console.log('✅ Attendance system fixed!');
console.log('✅ Roles: 0=Admin, 1=Teacher, 2=CM');
// ===== APP SUPPLEMENTS - CLASSFLOW LMS =====
// Phần bổ sung cho app.js: Notifications, Files, Holidays, Activity Logs

// ===== GLOBAL STATE BỔ SUNG =====
let notifications = [];
let files = [];
let holidays = [];
let activityLogs = [];
let unreadCount = 0;

// ===== 1. NOTIFICATIONS =====

async function showNotifications() {
    showSection('notificationsContent');
    await loadNotifications();
}

async function loadNotifications() {
    try {
        showLoading();
        const response = await API.getNotifications();

        if (response.success) {
            notifications = response.data;
            renderNotifications();
            await updateUnreadBadge();
        }
    } catch (error) {
        showAlert('Không thể tải thông báo: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderNotifications() {
    const container = document.getElementById('notificationsList');
    const noNotif = document.getElementById('noNotifications');

    if (!notifications || notifications.length === 0) {
        container.innerHTML = '';
        noNotif.style.display = 'block';
        return;
    }

    noNotif.style.display = 'none';

    container.innerHTML = notifications.map(notif => `
        <div class="notification-item ${!notif.isRead ? 'unread' : ''}" onclick="markNotificationRead(${notif.id})">
            <div class="notification-header">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-time">${formatTimeAgo(notif.createdAt)}</div>
            </div>
            <div class="notification-message">${notif.message}</div>
            <div>
                <span class="notification-type ${notif.type}">${getNotificationTypeText(notif.type)}</span>
            </div>
        </div>
    `).join('');
}

function getNotificationTypeText(type) {
    const types = {
        'attendance': 'Điểm danh',
        'grade': 'Điểm số',
        'announcement': 'Thông báo',
        'reminder': 'Nhắc nhở',
        'system': 'Hệ thống'
    };
    return types[type] || 'Khác';
}

async function markNotificationRead(id) {
    try {
        await API.markNotificationRead(id);
        await loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllNotificationsRead() {
    if (!confirm('Đánh dấu tất cả thông báo là đã đọc?')) return;

    try {
        showLoading();
        await API.markAllNotificationsRead();
        await loadNotifications();
        showAlert('Đã đánh dấu tất cả đã đọc', 'success');
    } catch (error) {
        showAlert('Không thể đánh dấu: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteAllNotifications() {
    if (!confirm('Xóa TẤT CẢ thông báo? Hành động này không thể hoàn tác!')) return;

    try {
        showLoading();
        await API.deleteAllNotifications();
        await loadNotifications();
        showAlert('Đã xóa tất cả thông báo', 'success');
    } catch (error) {
        showAlert('Không thể xóa: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function updateUnreadBadge() {
    try {
        const response = await API.getUnreadNotificationCount();
        if (response.success) {
            unreadCount = response.data.count;
            const badge = document.getElementById('unreadBadge');
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error getting unread count:', error);
    }
}

// Poll for new notifications every 30 seconds
setInterval(() => {
    if (currentUser) {
        updateUnreadBadge();
    }
}, 30000);

// ===== 2. FILES =====

async function showFiles() {
    showSection('filesContent');
    await loadFiles();
}

async function loadFiles() {
    try {
        showLoading();
        const response = await API.getFiles();

        if (response.success) {
            files = response.data;
            renderFiles();
            updateFileStats();
        }
    } catch (error) {
        showAlert('Không thể tải danh sách file: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderFiles() {
    const tbody = document.getElementById('filesTable');

    if (!files || files.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-light);">Chưa có tài liệu nào</td></tr>';
        return;
    }

    tbody.innerHTML = files.map(file => {
        const icon = getFileIcon(file.fileType);
        const size = formatFileSize(file.fileSize);

        return `
            <tr>
                <td>
                    <div class="file-icon ${icon.class}">
                        <i class="fas ${icon.icon}"></i>
                    </div>
                </td>
                <td>
                    <strong>${file.originalName || file.filename}</strong>
                    ${file.description ? `<br><small style="color:var(--text-light);">${file.description}</small>` : ''}
                </td>
                <td>${file.className || '-'}</td>
                <td><span class="badge badge-${getCategoryColor(file.category)}">${getCategoryText(file.category)}</span></td>
                <td>${size}</td>
                <td>${file.uploaderName || 'Unknown'}</td>
                <td>${formatDate(file.createdAt)}</td>
                <td>
                    <button class="btn-icon" onclick="downloadFile('${file.url}')" title="Tải về">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-icon" onclick="viewFile('${file.url}')" title="Xem">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${file.uploaderId === currentUser.id || hasPermission('', 'files', 'delete') ? `
                        <button class="btn-icon danger" onclick="deleteFile(${file.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function getFileIcon(mimeType) {
    if (mimeType.includes('pdf')) return { icon: 'fa-file-pdf', class: 'pdf' };
    if (mimeType.includes('word') || mimeType.includes('document')) return { icon: 'fa-file-word', class: 'doc' };
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return { icon: 'fa-file-excel', class: 'xls' };
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return { icon: 'fa-file-powerpoint', class: 'ppt' };
    if (mimeType.includes('image')) return { icon: 'fa-file-image', class: 'img' };
    return { icon: 'fa-file', class: 'other' };
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getCategoryText(category) {
    const categories = {
        'material': 'Tài liệu',
        'assignment': 'Bài tập',
        'submission': 'Bài nộp',
        'other': 'Khác'
    };
    return categories[category] || 'Khác';
}

function getCategoryColor(category) {
    const colors = {
        'material': 'primary',
        'assignment': 'warning',
        'submission': 'success',
        'other': 'secondary'
    };
    return colors[category] || 'secondary';
}

async function updateFileStats() {
    try {
        const response = await API.getFileStats();
        if (response.success) {
            document.getElementById('totalFilesCount').textContent = response.data.fileCount;
            document.getElementById('totalStorageSize').textContent = formatFileSize(response.data.totalSize);
        }
    } catch (error) {
        console.error('Error loading file stats:', error);
    }
}

function filterFiles() {
    const category = document.getElementById('filesCategoryFilter').value;
    const filteredFiles = category ? files.filter(f => f.category === category) : files;

    const tbody = document.getElementById('filesTable');
    // Re-render with filtered files
    const tempFiles = files;
    files = filteredFiles;
    renderFiles();
    files = tempFiles;
}

function openUploadFileModal() {
    document.getElementById('uploadFileInput').value = '';
    document.getElementById('uploadFileClass').value = '';
    document.getElementById('uploadFileCategory').value = 'material';
    document.getElementById('uploadFileDescription').value = '';
    document.getElementById('uploadProgress').style.display = 'none';

    // Populate class dropdown
    const classSelect = document.getElementById('uploadFileClass');
    classSelect.innerHTML = '<option value="">Không thuộc lớp nào</option>' +
        classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    openModal('uploadFileModal');
}

async function uploadFile() {
    const fileInput = document.getElementById('uploadFileInput');
    const classId = document.getElementById('uploadFileClass').value;
    const category = document.getElementById('uploadFileCategory').value;
    const description = document.getElementById('uploadFileDescription').value;

    if (!fileInput.files || fileInput.files.length === 0) {
        showAlert('Vui lòng chọn file', 'error');
        return;
    }

    const file = fileInput.files[0];

    // Check file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        showAlert('File quá lớn! Giới hạn 10MB', 'error');
        return;
    }

    try {
        const progressDiv = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('uploadProgressBar');
        const progressText = document.getElementById('uploadProgressText');

        progressDiv.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = 'Đang upload...';

        const formData = new FormData();
        formData.append('file', file);
        if (classId) formData.append('classId', classId);
        formData.append('category', category);
        if (description) formData.append('description', description);

        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 90) {
                progressBar.style.width = progress + '%';
            }
        }, 200);

        const response = await API.uploadFile(formData);

        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressText.textContent = 'Hoàn thành!';

        if (response.success) {
            showAlert('Upload thành công!', 'success');
            closeModal('uploadFileModal');
            await loadFiles();
        }
    } catch (error) {
        showAlert('Upload thất bại: ' + error.message, 'error');
    }
}

function downloadFile(url) {
    window.open(url, '_blank');
}

function viewFile(url) {
    window.open(url, '_blank');
}

async function deleteFile(id) {
    if (!confirm('Xóa file này?')) return;

    try {
        showLoading();
        await API.deleteFile(id);
        showAlert('Đã xóa file', 'success');
        await loadFiles();
    } catch (error) {
        showAlert('Không thể xóa file: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ===== 3. HOLIDAYS =====

async function showHolidays() {
    showSection('holidaysContent');

    // Show/hide buttons based on role
    const isAdmin = hasPermission('', 'classes', 'create'); // Admin check
    document.getElementById('addHolidayBtn').style.display = isAdmin ? 'inline-block' : 'none';
    document.getElementById('importHolidaysBtn').style.display = isAdmin ? 'inline-block' : 'none';

    await loadHolidays();
}

async function loadHolidays() {
    try {
        showLoading();
        const year = document.getElementById('holidayYearFilter').value;
        const response = await API.getHolidays(year);

        if (response.success) {
            holidays = response.data;
            renderHolidays();
        }
    } catch (error) {
        showAlert('Không thể tải danh sách ngày nghỉ: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderHolidays() {
    const grid = document.getElementById('holidaysGrid');

    if (!holidays || holidays.length === 0) {
        grid.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-light);grid-column:1/-1;"><i class="fas fa-calendar-times" style="font-size:48px;margin-bottom:16px;"></i><p>Chưa có ngày nghỉ lễ nào</p></div>';
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    grid.innerHTML = holidays.map(holiday => {
        const holidayDate = new Date(holiday.date);
        const isPast = holidayDate < today;
        const isUpcoming = holidayDate >= today;

        const isAdmin = hasPermission('', 'classes', 'create');

        return `
            <div class="holiday-card ${isPast ? 'past' : ''} ${isUpcoming ? 'upcoming' : ''}">
                <div class="holiday-date">
                    ${formatDate(holiday.date)}
                </div>
                <div class="holiday-name">${holiday.name}</div>
                ${holiday.description ? `<div class="holiday-description">${holiday.description}</div>` : ''}
                ${isAdmin ? `
                    <div class="holiday-actions">
                        <button class="btn btn-sm btn-secondary" onclick="openEditHolidayModal(${holiday.id})">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteHoliday(${holiday.id})">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function filterHolidays() {
    loadHolidays();
}

function openAddHolidayModal() {
    document.getElementById('holidayModalTitle').innerHTML = '<i class="fas fa-calendar-plus"></i> Thêm ngày nghỉ lễ';
    document.getElementById('holidayId').value = '';
    document.getElementById('holidayName').value = '';
    document.getElementById('holidayDate').value = '';
    document.getElementById('holidayDescription').value = '';
    openModal('holidayModal');
}

async function openEditHolidayModal(id) {
    const holiday = holidays.find(h => h.id === id);
    if (!holiday) return;

    document.getElementById('holidayModalTitle').innerHTML = '<i class="fas fa-edit"></i> Sửa ngày nghỉ lễ';
    document.getElementById('holidayId').value = holiday.id;
    document.getElementById('holidayName').value = holiday.name;
    document.getElementById('holidayDate').value = holiday.date;
    document.getElementById('holidayDescription').value = holiday.description || '';
    openModal('holidayModal');
}

async function saveHoliday() {
    const id = document.getElementById('holidayId').value;
    const name = document.getElementById('holidayName').value.trim();
    const date = document.getElementById('holidayDate').value;
    const description = document.getElementById('holidayDescription').value.trim();

    if (!name || !date) {
        showAlert('Vui lòng nhập đầy đủ thông tin', 'error');
        return;
    }

    try {
        showLoading();

        const data = { name, date, description };

        if (id) {
            await API.updateHoliday(id, data);
            showAlert('Cập nhật thành công', 'success');
        } else {
            await API.createHoliday(data);
            showAlert('Thêm ngày nghỉ lễ thành công', 'success');
        }

        closeModal('holidayModal');
        await loadHolidays();
    } catch (error) {
        showAlert('Lỗi: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function deleteHoliday(id) {
    if (!confirm('Xóa ngày nghỉ lễ này?')) return;

    try {
        showLoading();
        await API.deleteHoliday(id);
        showAlert('Đã xóa ngày nghỉ lễ', 'success');
        await loadHolidays();
    } catch (error) {
        showAlert('Không thể xóa: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function openImportHolidaysModal() {
    openModal('importHolidaysModal');
}

async function importVietnamHolidays2025() {
    const vietnamHolidays = [
        { name: 'Tết Dương lịch', date: '2025-01-01', description: 'Nghỉ 1 ngày' },
        { name: 'Tết Nguyên Đán (Mùng 1)', date: '2025-01-29', description: 'Nghỉ Tết' },
        { name: 'Tết Nguyên Đán (Mùng 2)', date: '2025-01-30', description: 'Nghỉ Tết' },
        { name: 'Tết Nguyên Đán (Mùng 3)', date: '2025-01-31', description: 'Nghỉ Tết' },
        { name: 'Tết Nguyên Đán (Mùng 4)', date: '2025-02-01', description: 'Nghỉ Tết' },
        { name: 'Tết Nguyên Đán (Mùng 5)', date: '2025-02-02', description: 'Nghỉ Tết' },
        { name: 'Giỗ Tổ Hùng Vương', date: '2025-04-06', description: 'Nghỉ 1 ngày' },
        { name: 'Ngày 30/4', date: '2025-04-30', description: 'Giải phóng miền Nam' },
        { name: 'Ngày Quốc tế Lao động', date: '2025-05-01', description: 'Nghỉ 1 ngày' },
        { name: 'Ngày Quốc Khánh', date: '2025-09-02', description: 'Nghỉ 1 ngày' }
    ];

    try {
        showLoading();
        const response = await API.bulkCreateHolidays(vietnamHolidays);

        if (response.success) {
            showAlert(`Đã import ${response.data.created} ngày nghỉ lễ`, 'success');
            closeModal('importHolidaysModal');
            await loadHolidays();
        }
    } catch (error) {
        showAlert('Import thất bại: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ===== 4. ACTIVITY LOGS =====

async function showActivityLogs() {
    showSection('activityLogsContent');
    await loadActivityLogs();
}

async function loadActivityLogs() {
    try {
        showLoading();

        const isAdmin = hasPermission('', 'classes', 'create');
        const response = isAdmin ? await API.getAllActivityLogs() : await API.getMyActivityLogs();

        if (response.success) {
            activityLogs = response.data;
            renderActivityLogs();
        }
    } catch (error) {
        showAlert('Không thể tải lịch sử: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function renderActivityLogs() {
    const tbody = document.getElementById('activityLogsTable');

    if (!activityLogs || activityLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-light);">Chưa có lịch sử hoạt động</td></tr>';
        return;
    }

    tbody.innerHTML = activityLogs.map(log => `
        <tr>
            <td>${formatDateTime(log.createdAt)}</td>
            <td>${log.userName || log.userEmail || 'System'}</td>
            <td><span class="log-action ${log.action}">${getActionText(log.action)}</span></td>
            <td>${getEntityText(log.entityType)} ${log.entityId ? `#${log.entityId}` : ''}</td>
            <td><small>${log.ipAddress || '-'}</small></td>
            <td>
                ${log.newData ? `
                    <button class="btn-icon" onclick="viewLogDetail(${log.id})" title="Xem chi tiết">
                        <i class="fas fa-info-circle"></i>
                    </button>
                ` : '-'}
            </td>
        </tr>
    `).join('');
}

function getActionText(action) {
    const actions = {
        'create': 'Tạo mới',
        'update': 'Cập nhật',
        'delete': 'Xóa',
        'login': 'Đăng nhập',
        'export': 'Xuất file'
    };
    return actions[action] || action;
}

function getEntityText(entityType) {
    const entities = {
        'class': 'Lớp học',
        'student': 'Học sinh',
        'teacher': 'Giáo viên',
        'cm': 'CM',
        'attendance': 'Điểm danh',
        'grade': 'Điểm',
        'comment': 'Nhận xét',
        'file': 'File',
        'holiday': 'Ngày nghỉ',
        'notification': 'Thông báo'
    };
    return entities[entityType] || entityType;
}

function filterLogs() {
    const action = document.getElementById('logsActionFilter').value;
    const entityType = document.getElementById('logsEntityFilter').value;

    let filtered = activityLogs;

    if (action) {
        filtered = filtered.filter(log => log.action === action);
    }

    if (entityType) {
        filtered = filtered.filter(log => log.entityType === entityType);
    }

    const tbody = document.getElementById('activityLogsTable');
    const tempLogs = activityLogs;
    activityLogs = filtered;
    renderActivityLogs();
    activityLogs = tempLogs;
}

function viewLogDetail(id) {
    const log = activityLogs.find(l => l.id === id);
    if (!log) return;

    const content = document.getElementById('logDetailContent');

    content.innerHTML = `
        <div class="log-detail">
            <div class="detail-row">
                <strong>Thời gian:</strong>
                <span>${formatDateTime(log.createdAt)}</span>
            </div>
            <div class="detail-row">
                <strong>Người dùng:</strong>
                <span>${log.userName} (${log.userEmail})</span>
            </div>
            <div class="detail-row">
                <strong>Hành động:</strong>
                <span class="log-action ${log.action}">${getActionText(log.action)}</span>
            </div>
            <div class="detail-row">
                <strong>Đối tượng:</strong>
                <span>${getEntityText(log.entityType)} #${log.entityId}</span>
            </div>
            <div class="detail-row">
                <strong>IP Address:</strong>
                <span>${log.ipAddress}</span>
            </div>
            ${log.oldData ? `
                <div class="detail-section">
                    <strong>Dữ liệu cũ:</strong>
                    <pre>${JSON.stringify(log.oldData, null, 2)}</pre>
                </div>
            ` : ''}
            ${log.newData ? `
                <div class="detail-section">
                    <strong>Dữ liệu mới:</strong>
                    <pre>${JSON.stringify(log.newData, null, 2)}</pre>
                </div>
            ` : ''}
        </div>
        
        <style>
        .log-detail { padding: 8px; }
        .detail-row { 
            display: flex; 
            padding: 12px; 
            border-bottom: 1px solid #e5e7eb; 
        }
        .detail-row strong { 
            width: 150px; 
            color: var(--text-dark); 
        }
        .detail-section { 
            margin-top: 16px; 
            padding: 12px;
            background: #f9fafb;
            border-radius: 8px;
        }
        .detail-section pre { 
            background: white; 
            padding: 12px; 
            border-radius: 4px; 
            overflow-x: auto;
            font-size: 12px;
        }
        </style>
    `;

    openModal('logDetailModal');
}

// ===== UTILITY FUNCTIONS =====

function formatTimeAgo(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' phút trước';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' giờ trước';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' ngày trước';

    return formatDate(dateStr);
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// ===== INITIALIZATION =====
// Load unread badge when user logs in
if (currentUser) {
    updateUnreadBadge();
}