// app-assignments.js - Quản lý Bài tập và Chấm điểm

// ===== GLOBAL STATE =====
let currentAssignmentId = null;
let currentClassForAssignment = null;

// ===== SHOW ASSIGNMENTS TAB IN CLASS DETAIL =====
async function loadAssignments(classId) {
    try {
        currentClassForAssignment = classId;
        const assignments = await API.getAssignmentsByClass(classId);

        const container = document.getElementById('assignmentsListContainer');
        if (!container) return;

        if (assignments.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px;color:var(--text-light);">
                    <i class="fas fa-clipboard-list" style="font-size:48px;margin-bottom:16px;"></i>
                    <p>Chưa có bài tập nào</p>
                </div>
            `;
            return;
        }

        let html = '<div class="assignments-list">';

        assignments.forEach(assignment => {
            const deadline = new Date(assignment.deadline);
            const isOverdue = deadline < new Date();
            const submissionCount = assignment.submissionCount || 0;
            const totalStudents = assignment.totalStudents || 0;
            const completionRate = totalStudents > 0 ? Math.round((submissionCount / totalStudents) * 100) : 0;

            html += `
                <div class="assignment-card ${isOverdue ? 'overdue' : ''}">
                    <div class="assignment-header">
                        <h3>${assignment.title}</h3>
                        <div class="assignment-meta">
                            <span class="badge ${isOverdue ? 'badge-danger' : 'badge-warning'}">
                                <i class="fas fa-clock"></i> 
                                Deadline: ${formatDate(assignment.deadline)}
                            </span>
                            <span class="badge badge-info">
                                <i class="fas fa-star"></i> ${assignment.maxScore} điểm
                            </span>
                        </div>
                    </div>
                    <div class="assignment-description">
                        ${assignment.description || 'Không có mô tả'}
                    </div>
                    ${assignment.fileUrl ? `
                        <div class="assignment-file">
                            <i class="fas fa-paperclip"></i>
                            <a href="${assignment.fileUrl}" target="_blank">Tải đề bài</a>
                        </div>
                    ` : ''}
                    <div class="assignment-stats">
                        <div class="stat-item">
                            <i class="fas fa-users"></i>
                            <span>${submissionCount}/${totalStudents} đã nộp (${completionRate}%)</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width:${completionRate}%;"></div>
                        </div>
                    </div>
                    <div class="assignment-actions">
                        ${currentUser.roleId <= 1 ? `
                            <button class="btn btn-primary btn-sm" onclick="viewSubmissions(${assignment.id})">
                                <i class="fas fa-eye"></i> Xem bài nộp
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="openEditAssignmentModal(${assignment.id})">
                                <i class="fas fa-edit"></i> Sửa
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteAssignment(${assignment.id})">
                                <i class="fas fa-trash"></i> Xóa
                            </button>
                        ` : `
                            <button class="btn btn-primary btn-sm" onclick="openSubmitAssignmentModal(${assignment.id})">
                                <i class="fas fa-upload"></i> Nộp bài
                            </button>
                        `}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading assignments:', error);
        showAlert('Không thể tải danh sách bài tập: ' + error.message, 'error');
    }
}

// ===== CREATE ASSIGNMENT =====
function openAddAssignmentModal() {
    if (!currentClassForAssignment) {
        showAlert('Vui lòng chọn lớp học trước', 'warning');
        return;
    }

    document.getElementById('assignmentModalTitle').innerHTML = '<i class="fas fa-plus"></i> Thêm bài tập mới';
    document.getElementById('assignmentId').value = '';
    document.getElementById('assignmentTitle').value = '';
    document.getElementById('assignmentDescription').value = '';
    document.getElementById('assignmentDeadline').value = '';
    document.getElementById('assignmentMaxScore').value = '10';
    document.getElementById('assignmentFileInput').value = '';

    openModal('assignmentModal');
}

async function saveAssignment() {
    try {
        const id = document.getElementById('assignmentId').value;
        const title = document.getElementById('assignmentTitle').value.trim();
        const description = document.getElementById('assignmentDescription').value.trim();
        const deadline = document.getElementById('assignmentDeadline').value;
        const maxScore = parseFloat(document.getElementById('assignmentMaxScore').value);
        const fileInput = document.getElementById('assignmentFileInput');

        if (!title || !deadline) {
            showAlert('Vui lòng điền đầy đủ thông tin bắt buộc', 'warning');
            return;
        }

        if (maxScore <= 0 || maxScore > 100) {
            showAlert('Điểm tối đa phải từ 1-100', 'warning');
            return;
        }

        const data = {
            classId: currentClassForAssignment,
            title,
            description,
            deadline,
            maxScore
        };

        // Upload file if provided
        if (fileInput.files.length > 0) {
            const fileData = new FormData();
            fileData.append('file', fileInput.files[0]);
            fileData.append('classId', currentClassForAssignment);
            fileData.append('category', 'assignment');
            fileData.append('description', 'Đề bài: ' + title);

            const fileResponse = await API.uploadFile(fileData);
            data.fileUrl = fileResponse.fileUrl;
        }

        if (id) {
            await API.updateAssignment(id, data);
            showAlert('Cập nhật bài tập thành công', 'success');
        } else {
            await API.createAssignment(data);
            showAlert('Thêm bài tập thành công', 'success');
        }

        closeModal('assignmentModal');
        await loadAssignments(currentClassForAssignment);

    } catch (error) {
        console.error('Error saving assignment:', error);
        showAlert('Không thể lưu bài tập: ' + error.message, 'error');
    }
}

async function deleteAssignment(id) {
    if (!confirm('Bạn có chắc muốn xóa bài tập này?\nMọi bài nộp sẽ bị xóa theo.')) return;

    try {
        await API.deleteAssignment(id);
        showAlert('Xóa bài tập thành công', 'success');
        await loadAssignments(currentClassForAssignment);
    } catch (error) {
        console.error('Error deleting assignment:', error);
        showAlert('Không thể xóa bài tập: ' + error.message, 'error');
    }
}

// ===== VIEW SUBMISSIONS & GRADING =====
async function viewSubmissions(assignmentId) {
    try {
        currentAssignmentId = assignmentId;
        const assignment = await API.getAssignment(assignmentId);
        const submissions = await API.getSubmissions(assignmentId);
        const students = await API.getStudentsByClass(assignment.classId);

        // Open grading modal
        document.getElementById('gradingAssignmentTitle').textContent = assignment.title;
        document.getElementById('gradingDeadline').textContent = formatDate(assignment.deadline);
        document.getElementById('gradingMaxScore').textContent = assignment.maxScore;

        // Create submissions table
        const tbody = document.getElementById('submissionsTable');
        tbody.innerHTML = '';

        students.forEach(student => {
            const submission = submissions.find(s => s.studentId === student.id);
            const submitted = !!submission;
            const graded = submission && submission.score !== null;
            const late = submission && new Date(submission.submittedAt) > new Date(assignment.deadline);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.studentCode || student.id}</td>
                <td>${student.name}</td>
                <td>
                    ${submitted ? `
                        <span class="badge badge-success">
                            <i class="fas fa-check"></i> Đã nộp
                        </span>
                        ${late ? '<span class="badge badge-danger">Nộp trễ</span>' : ''}
                    ` : `
                        <span class="badge badge-secondary">
                            <i class="fas fa-times"></i> Chưa nộp
                        </span>
                    `}
                </td>
                <td>${submitted ? formatDate(submission.submittedAt) : '-'}</td>
                <td>
                    ${submitted && submission.fileUrl ? `
                        <a href="${submission.fileUrl}" target="_blank" class="btn btn-sm btn-secondary">
                            <i class="fas fa-download"></i> Tải về
                        </a>
                    ` : '-'}
                </td>
                <td>
                    ${submitted ? `
                        <input type="number" 
                               class="form-control" 
                               style="width:80px;display:inline-block;" 
                               min="0" 
                               max="${assignment.maxScore}" 
                               step="0.5"
                               value="${submission.score || ''}" 
                               id="score_${submission.id}"
                               ${!graded ? 'placeholder="Chưa chấm"' : ''}>
                        <button class="btn btn-primary btn-sm" onclick="gradeSubmission(${submission.id}, ${assignment.maxScore})">
                            <i class="fas fa-save"></i>
                        </button>
                    ` : '-'}
                </td>
                <td>
                    ${submitted ? `
                        <textarea class="form-control" 
                                  rows="2" 
                                  id="feedback_${submission.id}"
                                  placeholder="Nhận xét...">${submission.feedback || ''}</textarea>
                    ` : '-'}
                </td>
            `;
            tbody.appendChild(row);
        });

        openModal('gradingModal');

    } catch (error) {
        console.error('Error loading submissions:', error);
        showAlert('Không thể tải danh sách bài nộp: ' + error.message, 'error');
    }
}

async function gradeSubmission(submissionId, maxScore) {
    try {
        const scoreInput = document.getElementById(`score_${submissionId}`);
        const feedbackInput = document.getElementById(`feedback_${submissionId}`);

        const score = parseFloat(scoreInput.value);
        const feedback = feedbackInput.value.trim();

        if (isNaN(score) || score < 0 || score > maxScore) {
            showAlert(`Điểm phải từ 0 đến ${maxScore}`, 'warning');
            return;
        }

        await API.gradeSubmission(submissionId, { score, feedback });
        showAlert('Chấm điểm thành công', 'success');

        // Refresh submissions
        await viewSubmissions(currentAssignmentId);

    } catch (error) {
        console.error('Error grading submission:', error);
        showAlert('Không thể chấm điểm: ' + error.message, 'error');
    }
}

async function bulkGrade() {
    const rows = document.querySelectorAll('#submissionsTable tr');
    let graded = 0;

    for (const row of rows) {
        const scoreInput = row.querySelector('input[type="number"]');
        const feedbackInput = row.querySelector('textarea');

        if (!scoreInput) continue;

        const submissionId = parseInt(scoreInput.id.replace('score_', ''));
        const score = parseFloat(scoreInput.value);
        const feedback = feedbackInput ? feedbackInput.value.trim() : '';

        if (!isNaN(score)) {
            try {
                await API.gradeSubmission(submissionId, { score, feedback });
                graded++;
            } catch (error) {
                console.error(`Error grading submission ${submissionId}:`, error);
            }
        }
    }

    showAlert(`Đã chấm điểm cho ${graded} bài nộp`, 'success');
    await viewSubmissions(currentAssignmentId);
}

// ===== STUDENT SUBMISSION =====
function openSubmitAssignmentModal(assignmentId) {
    currentAssignmentId = assignmentId;
    document.getElementById('submissionFileInput').value = '';
    document.getElementById('submissionContent').value = '';
    openModal('submitAssignmentModal');
}

async function submitAssignment() {
    try {
        const fileInput = document.getElementById('submissionFileInput');
        const content = document.getElementById('submissionContent').value.trim();

        if (fileInput.files.length === 0 && !content) {
            showAlert('Vui lòng chọn file hoặc nhập nội dung bài làm', 'warning');
            return;
        }

        const data = {
            assignmentId: currentAssignmentId,
            studentId: currentUser.id,
            content: content
        };

        if (fileInput.files.length > 0) {
            data.file = fileInput.files[0];
        }

        await API.createSubmission(data);
        showAlert('Nộp bài thành công', 'success');
        closeModal('submitAssignmentModal');
        await loadAssignments(currentClassForAssignment);

    } catch (error) {
        console.error('Error submitting assignment:', error);
        showAlert('Không thể nộp bài: ' + error.message, 'error');
    }
}

// ===== GRADES VIEW =====
async function loadGrades(classId) {
    try {
        const grades = await API.getGradesByClass(classId);
        const students = await API.getStudentsByClass(classId);
        const assignments = await API.getAssignmentsByClass(classId);

        const container = document.getElementById('gradesTableContainer');
        if (!container) return;

        if (assignments.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px;color:var(--text-light);">
                    <i class="fas fa-chart-bar" style="font-size:48px;margin-bottom:16px;"></i>
                    <p>Chưa có bài tập nào để hiển thị điểm</p>
                </div>
            `;
            return;
        }

        // Build grades table
        let html = '<div class="table-container"><table class="grades-table">';

        // Header
        html += '<thead><tr>';
        html += '<th>MSSV</th>';
        html += '<th>Họ tên</th>';
        assignments.forEach(a => {
            html += `<th>${a.title}<br><small>(${a.maxScore}đ)</small></th>`;
        });
        html += '<th>Điểm TB</th>';
        html += '</tr></thead>';

        // Body
        html += '<tbody>';
        students.forEach(student => {
            html += '<tr>';
            html += `<td>${student.studentCode || student.id}</td>`;
            html += `<td>${student.name}</td>`;

            let totalScore = 0;
            let count = 0;

            assignments.forEach(assignment => {
                const grade = grades.find(g =>
                    g.studentId === student.id && g.assignmentId === assignment.id
                );

                if (grade && grade.score !== null) {
                    html += `<td class="grade-cell ${getGradeClass(grade.score, assignment.maxScore)}">
                        ${grade.score}
                    </td>`;
                    totalScore += (grade.score / assignment.maxScore) * 10;
                    count++;
                } else {
                    html += '<td class="grade-cell">-</td>';
                }
            });

            const average = count > 0 ? (totalScore / count).toFixed(1) : '-';
            html += `<td class="grade-cell average ${getGradeClass(average, 10)}">
                <strong>${average}</strong>
            </td>`;
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading grades:', error);
        showAlert('Không thể tải bảng điểm: ' + error.message, 'error');
    }
}

function getGradeClass(score, maxScore) {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'grade-excellent';
    if (percentage >= 65) return 'grade-good';
    if (percentage >= 50) return 'grade-average';
    return 'grade-poor';
}

// ===== EXPORT GRADES =====
async function exportGradesExcel(classId) {
    try {
        const classData = await API.getClass(classId);
        const grades = await API.getGradesByClass(classId);
        const students = await API.getStudentsByClass(classId);
        const assignments = await API.getAssignmentsByClass(classId);

        // Build Excel data
        const data = [];

        // Header
        const header = ['MSSV', 'Họ tên'];
        assignments.forEach(a => header.push(a.title));
        header.push('Điểm TB');
        data.push(header);

        // Rows
        students.forEach(student => {
            const row = [student.studentCode || student.id, student.name];

            let totalScore = 0;
            let count = 0;

            assignments.forEach(assignment => {
                const grade = grades.find(g =>
                    g.studentId === student.id && g.assignmentId === assignment.id
                );

                if (grade && grade.score !== null) {
                    row.push(grade.score);
                    totalScore += (grade.score / assignment.maxScore) * 10;
                    count++;
                } else {
                    row.push('');
                }
            });

            const average = count > 0 ? (totalScore / count).toFixed(1) : '';
            row.push(average);
            data.push(row);
        });

        // Create Excel
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Bảng điểm');

        XLSX.writeFile(wb, `Bang_diem_${classData.classCode}_${formatDate(new Date())}.xlsx`);
        showAlert('Xuất Excel thành công', 'success');

    } catch (error) {
        console.error('Error exporting grades:', error);
        showAlert('Không thể xuất Excel: ' + error.message, 'error');
    }
}

// ===== UTILITY FUNCTIONS =====
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ===== EXPORT TO WINDOW =====
window.loadAssignments = loadAssignments;
window.openAddAssignmentModal = openAddAssignmentModal;
window.saveAssignment = saveAssignment;
window.deleteAssignment = deleteAssignment;
window.viewSubmissions = viewSubmissions;
window.gradeSubmission = gradeSubmission;
window.bulkGrade = bulkGrade;
window.openSubmitAssignmentModal = openSubmitAssignmentModal;
window.submitAssignment = submitAssignment;
window.loadGrades = loadGrades;
window.exportGradesExcel = exportGradesExcel;

console.log('✅ Assignments module loaded');