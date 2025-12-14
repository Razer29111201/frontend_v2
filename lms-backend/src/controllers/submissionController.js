// src/controllers/submissionController.js - OPTIMIZED VERSION
import { query, transaction } from '../config/database.js';
import { sendGradeNotification } from '../services/emailService.js';
import logger from '../utils/logger.js';

class SubmissionController {
    // Get submissions by assignment with attached files
    static async getByAssignment(req, res) {
        try {
            const { assignmentId } = req.params;

            const submissions = await query(`
                SELECT s.*, 
                    st.name as student_name,
                    st.code as student_code,
                    st.email as student_email,
                    u.name as graded_by_name
                FROM submissions s
                JOIN students st ON s.student_id = st.id
                LEFT JOIN users u ON s.graded_by = u.id
                WHERE s.assignment_id = ?
                ORDER BY st.code
            `, [assignmentId]);

            // Get attached files for each submission
            const submissionsWithFiles = await Promise.all(submissions.map(async (sub) => {
                const files = await query(`
                    SELECT f.*
                    FROM submission_files sf
                    JOIN files f ON sf.file_id = f.id
                    WHERE sf.submission_id = ?
                `, [sub.id]);

                return {
                    id: sub.id,
                    assignmentId: sub.assignment_id,
                    studentId: sub.student_id,
                    studentName: sub.student_name,
                    studentCode: sub.student_code,
                    studentEmail: sub.student_email,
                    content: sub.content,
                    attachedFiles: files.map(f => ({
                        id: f.id,
                        filename: f.filename,
                        originalName: f.original_name,
                        url: f.url,
                        fileType: f.file_type,
                        fileSize: f.file_size
                    })),
                    score: sub.score ? parseFloat(sub.score) : null,
                    feedback: sub.feedback,
                    status: sub.status,
                    submittedAt: sub.submitted_at,
                    gradedAt: sub.graded_at,
                    gradedBy: sub.graded_by,
                    gradedByName: sub.graded_by_name
                };
            }));

            res.json({ success: true, data: submissionsWithFiles });
        } catch (error) {
            logger.error('Get submissions error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get submissions by student
    static async getByStudent(req, res) {
        try {
            const { studentId } = req.params;

            const submissions = await query(`
                SELECT s.*, 
                    a.title as assignment_title,
                    a.deadline,
                    a.max_score,
                    c.name as class_name
                FROM submissions s
                JOIN assignments a ON s.assignment_id = a.id
                JOIN classes c ON a.class_id = c.id
                WHERE s.student_id = ?
                ORDER BY a.deadline DESC
            `, [studentId]);

            const submissionsWithFiles = await Promise.all(submissions.map(async (sub) => {
                const files = await query(`
                    SELECT f.*
                    FROM submission_files sf
                    JOIN files f ON sf.file_id = f.id
                    WHERE sf.submission_id = ?
                `, [sub.id]);

                return {
                    id: sub.id,
                    assignmentId: sub.assignment_id,
                    assignmentTitle: sub.assignment_title,
                    className: sub.class_name,
                    deadline: sub.deadline,
                    maxScore: parseFloat(sub.max_score),
                    content: sub.content,
                    attachedFiles: files.map(f => ({
                        id: f.id,
                        originalName: f.original_name,
                        url: f.url,
                        fileSize: f.file_size
                    })),
                    score: sub.score ? parseFloat(sub.score) : null,
                    feedback: sub.feedback,
                    status: sub.status,
                    submittedAt: sub.submitted_at,
                    gradedAt: sub.graded_at
                };
            }));

            res.json({ success: true, data: submissionsWithFiles });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get one submission with files
    static async getOne(req, res) {
        try {
            const [submission] = await query(`
                SELECT s.*, 
                    st.name as student_name,
                    st.code as student_code,
                    a.title as assignment_title,
                    a.deadline,
                    a.max_score
                FROM submissions s
                JOIN students st ON s.student_id = st.id
                JOIN assignments a ON s.assignment_id = a.id
                WHERE s.id = ?
            `, [req.params.id]);

            if (!submission) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy bài nộp' });
            }

            const files = await query(`
                SELECT f.*
                FROM submission_files sf
                JOIN files f ON sf.file_id = f.id
                WHERE sf.submission_id = ?
            `, [req.params.id]);

            res.json({
                success: true,
                data: {
                    id: submission.id,
                    assignmentId: submission.assignment_id,
                    assignmentTitle: submission.assignment_title,
                    deadline: submission.deadline,
                    maxScore: parseFloat(submission.max_score),
                    studentId: submission.student_id,
                    studentName: submission.student_name,
                    studentCode: submission.student_code,
                    content: submission.content,
                    attachedFiles: files.map(f => ({
                        id: f.id,
                        filename: f.filename,
                        originalName: f.original_name,
                        url: f.url,
                        fileType: f.file_type,
                        fileSize: f.file_size
                    })),
                    score: submission.score ? parseFloat(submission.score) : null,
                    feedback: submission.feedback,
                    status: submission.status,
                    submittedAt: submission.submitted_at,
                    gradedAt: submission.graded_at
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Submit assignment - attach existing files
    static async submit(req, res) {
        try {
            const { assignmentId, studentId, content, fileIds } = req.body;

            // Verify submission exists
            const [existing] = await query(
                'SELECT id, status FROM submissions WHERE assignment_id = ? AND student_id = ?',
                [assignmentId, studentId]
            );

            if (!existing) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy bài nộp. Bài tập có thể đã bị xóa.'
                });
            }

            if (existing.status === 'graded') {
                return res.status(400).json({
                    success: false,
                    error: 'Bài đã được chấm điểm, không thể nộp lại'
                });
            }

            await transaction(async (conn) => {
                // Update submission
                await conn.query(
                    `UPDATE submissions 
                     SET content = ?, submitted_at = NOW(), status = 'submitted'
                     WHERE id = ?`,
                    [content, existing.id]
                );

                // Attach files if provided
                if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
                    // Remove old files
                    await conn.query('DELETE FROM submission_files WHERE submission_id = ?', [existing.id]);

                    // Add new files
                    for (const fileId of fileIds) {
                        // Verify file exists
                        const [file] = await conn.query('SELECT id FROM files WHERE id = ?', [fileId]);

                        if (file) {
                            await conn.query(
                                'INSERT INTO submission_files (submission_id, file_id) VALUES (?, ?)',
                                [existing.id, fileId]
                            );
                        }
                    }
                }
            });

            res.json({
                success: true,
                message: 'Nộp bài thành công',
                data: { submissionId: existing.id }
            });
        } catch (error) {
            logger.error('Submit assignment error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Grade submission
    static async grade(req, res) {
        try {
            const { id } = req.params;
            const { score, feedback, sendNotification } = req.body;

            // Get submission info
            const [submission] = await query(`
                SELECT s.*, st.email, st.parent_email, st.name as student_name,
                    a.max_score, a.title as assignment_title, c.name as class_name
                FROM submissions s
                JOIN students st ON s.student_id = st.id
                JOIN assignments a ON s.assignment_id = a.id
                JOIN classes c ON a.class_id = c.id
                WHERE s.id = ?
            `, [id]);

            if (!submission) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy bài nộp' });
            }

            // Validate score
            if (score < 0 || score > submission.max_score) {
                return res.status(400).json({
                    success: false,
                    error: `Điểm phải từ 0 đến ${submission.max_score}`
                });
            }

            // Update submission
            await query(
                `UPDATE submissions 
                 SET score = ?, feedback = ?, status = 'graded', graded_at = NOW(), graded_by = ?
                 WHERE id = ?`,
                [score, feedback, req.user.id, id]
            );

            // Send notification
            if (sendNotification) {
                try {
                    const emailTo = submission.parent_email || submission.email;
                    if (emailTo) {
                        await sendGradeNotification(
                            emailTo,
                            submission.student_name,
                            submission.class_name,
                            submission.assignment_title,
                            score,
                            submission.max_score,
                            feedback
                        );
                    }
                } catch (emailError) {
                    logger.warn('Failed to send grade notification:', emailError);
                }
            }

            res.json({
                success: true,
                message: 'Chấm điểm thành công',
                data: { score, feedback }
            });
        } catch (error) {
            logger.error('Grade submission error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Bulk grade submissions
    static async bulkGrade(req, res) {
        try {
            const { grades } = req.body; // Array of { submissionId, score, feedback }

            if (!Array.isArray(grades) || grades.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'grades phải là mảng không rỗng'
                });
            }

            const results = await transaction(async (conn) => {
                const graded = [];
                for (const g of grades) {
                    await conn.query(
                        `UPDATE submissions 
                         SET score = ?, feedback = ?, status = 'graded', graded_at = NOW(), graded_by = ?
                         WHERE id = ?`,
                        [g.score, g.feedback || null, req.user.id, g.submissionId]
                    );
                    graded.push(g.submissionId);
                }
                return graded;
            });

            res.json({
                success: true,
                message: `Đã chấm ${results.length} bài thành công`,
                data: { gradedCount: results.length }
            });
        } catch (error) {
            logger.error('Bulk grade error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Attach file to submission
    static async attachFile(req, res) {
        try {
            const { submissionId } = req.params;
            const { fileId } = req.body;

            // Verify submission exists and not graded
            const [submission] = await query(
                'SELECT status FROM submissions WHERE id = ?',
                [submissionId]
            );

            if (!submission) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy bài nộp' });
            }

            if (submission.status === 'graded') {
                return res.status(400).json({
                    success: false,
                    error: 'Bài đã được chấm, không thể thêm file'
                });
            }

            // Check if already attached
            const [existing] = await query(
                'SELECT id FROM submission_files WHERE submission_id = ? AND file_id = ?',
                [submissionId, fileId]
            );

            if (existing) {
                return res.status(400).json({ success: false, error: 'File đã được đính kèm' });
            }

            await query(
                'INSERT INTO submission_files (submission_id, file_id) VALUES (?, ?)',
                [submissionId, fileId]
            );

            res.json({
                success: true,
                message: 'Đã đính kèm file vào bài nộp'
            });
        } catch (error) {
            logger.error('Attach file to submission error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Detach file from submission
    static async detachFile(req, res) {
        try {
            const { submissionId, fileId } = req.params;

            // Verify not graded
            const [submission] = await query(
                'SELECT status FROM submissions WHERE id = ?',
                [submissionId]
            );

            if (submission && submission.status === 'graded') {
                return res.status(400).json({
                    success: false,
                    error: 'Bài đã được chấm, không thể gỡ file'
                });
            }

            await query(
                'DELETE FROM submission_files WHERE submission_id = ? AND file_id = ?',
                [submissionId, fileId]
            );

            res.json({
                success: true,
                message: 'Đã gỡ file khỏi bài nộp'
            });
        } catch (error) {
            logger.error('Detach file from submission error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Delete submission
    static async delete(req, res) {
        try {
            const result = await query('DELETE FROM submissions WHERE id = ?', [req.params.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy bài nộp' });
            }

            res.json({ success: true, message: 'Đã xóa bài nộp' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get submission statistics
    static async getStatistics(req, res) {
        try {
            const { assignmentId } = req.params;

            const [stats] = await query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted,
                    COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded,
                    COUNT(CASE WHEN status = 'not_submitted' THEN 1 END) as not_submitted,
                    COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
                    AVG(CASE WHEN score IS NOT NULL THEN score END) as avg_score,
                    MAX(score) as max_score_achieved,
                    MIN(score) as min_score_achieved
                FROM submissions
                WHERE assignment_id = ?
            `, [assignmentId]);

            res.json({
                success: true,
                data: {
                    total: stats[0].total || 0,
                    submitted: stats[0].submitted || 0,
                    graded: stats[0].graded || 0,
                    notSubmitted: stats[0].not_submitted || 0,
                    late: stats[0].late || 0,
                    averageScore: stats[0].avg_score ? parseFloat(stats[0].avg_score).toFixed(2) : null,
                    maxScore: stats[0].max_score_achieved ? parseFloat(stats[0].max_score_achieved) : null,
                    minScore: stats[0].min_score_achieved ? parseFloat(stats[0].min_score_achieved) : null
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default SubmissionController;