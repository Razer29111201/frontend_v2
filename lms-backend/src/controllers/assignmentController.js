// src/controllers/assignmentController.js - OPTIMIZED VERSION
import { query, transaction } from '../config/database.js';
import { sendAssignmentNotification } from '../services/emailService.js';
import logger from '../utils/logger.js';

class AssignmentController {
    // Get all assignments with attached files
    static async getAll(req, res) {
        try {
            const { classId, upcoming } = req.query;

            let sql = `
                SELECT a.*, 
                    u.name as created_by_name,
                    c.name as class_name,
                    (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as total_submissions,
                    (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id AND status = 'graded') as graded_count,
                    (SELECT COUNT(*) FROM students WHERE class_id = a.class_id) as total_students
                FROM assignments a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN classes c ON a.class_id = c.id
                WHERE 1=1
            `;
            const params = [];

            if (classId) {
                sql += ' AND a.class_id = ?';
                params.push(classId);
            }

            if (upcoming === 'true') {
                sql += ' AND a.deadline >= NOW()';
            }

            sql += ' ORDER BY a.deadline DESC';

            const assignments = await query(sql, params);

            // Get attached files for each assignment
            const assignmentsWithFiles = await Promise.all(assignments.map(async (a) => {
                const files = await query(`
                    SELECT f.*, af.file_type, af.display_order
                    FROM assignment_files af
                    JOIN files f ON af.file_id = f.id
                    WHERE af.assignment_id = ?
                    ORDER BY af.display_order
                `, [a.id]);

                return {
                    id: a.id,
                    classId: a.class_id,
                    className: a.class_name,
                    title: a.title,
                    description: a.description,
                    deadline: a.deadline,
                    maxScore: parseFloat(a.max_score),
                    attachedFiles: files.map(f => ({
                        id: f.id,
                        filename: f.filename,
                        originalName: f.original_name,
                        url: f.url,
                        fileType: f.file_type,
                        fileSize: f.file_size,
                        displayOrder: f.display_order,
                        assignmentFileType: f.file_type // instruction, material, reference
                    })),
                    createdBy: a.created_by,
                    createdByName: a.created_by_name,
                    totalSubmissions: a.total_submissions,
                    gradedCount: a.graded_count,
                    totalStudents: a.total_students,
                    submissionRate: a.total_students > 0
                        ? ((a.total_submissions / a.total_students) * 100).toFixed(1)
                        : 0,
                    createdAt: a.created_at
                };
            }));

            res.json({ success: true, data: assignmentsWithFiles });
        } catch (error) {
            logger.error('Get assignments error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get assignments by class with files
    static async getByClass(req, res) {
        try {
            const { classId } = req.params;

            const assignments = await query(`
                SELECT a.*, 
                    u.name as created_by_name,
                    (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id) as total_submissions,
                    (SELECT COUNT(*) FROM submissions WHERE assignment_id = a.id AND status = 'graded') as graded_count,
                    (SELECT COUNT(*) FROM students WHERE class_id = a.class_id) as total_students
                FROM assignments a
                LEFT JOIN users u ON a.created_by = u.id
                WHERE a.class_id = ?
                ORDER BY a.deadline DESC
            `, [classId]);

            const assignmentsWithFiles = await Promise.all(assignments.map(async (a) => {
                const files = await query(`
                    SELECT f.*, af.file_type, af.display_order
                    FROM assignment_files af
                    JOIN files f ON af.file_id = f.id
                    WHERE af.assignment_id = ?
                    ORDER BY af.display_order
                `, [a.id]);

                return {
                    id: a.id,
                    title: a.title,
                    description: a.description,
                    deadline: a.deadline,
                    maxScore: parseFloat(a.max_score),
                    attachedFiles: files.map(f => ({
                        id: f.id,
                        filename: f.filename,
                        originalName: f.original_name,
                        url: f.url,
                        fileSize: f.file_size,
                        assignmentFileType: f.file_type
                    })),
                    submissionCount: a.total_submissions,
                    gradedCount: a.graded_count,
                    totalStudents: a.total_students,
                    createdByName: a.created_by_name,
                    createdAt: a.created_at
                };
            }));

            res.json({ success: true, data: assignmentsWithFiles });
        } catch (error) {
            logger.error('Get assignments by class error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get one assignment with all files
    static async getOne(req, res) {
        try {
            const [assignment] = await query(`
                SELECT a.*, 
                    u.name as created_by_name,
                    c.name as class_name
                FROM assignments a
                LEFT JOIN users u ON a.created_by = u.id
                LEFT JOIN classes c ON a.class_id = c.id
                WHERE a.id = ?
            `, [req.params.id]);

            if (!assignment) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập' });
            }

            // Get attached files
            const files = await query(`
                SELECT f.*, af.file_type, af.display_order
                FROM assignment_files af
                JOIN files f ON af.file_id = f.id
                WHERE af.assignment_id = ?
                ORDER BY af.display_order
            `, [req.params.id]);

            res.json({
                success: true,
                data: {
                    id: assignment.id,
                    classId: assignment.class_id,
                    className: assignment.class_name,
                    title: assignment.title,
                    description: assignment.description,
                    deadline: assignment.deadline,
                    maxScore: parseFloat(assignment.max_score),
                    attachedFiles: files.map(f => ({
                        id: f.id,
                        filename: f.filename,
                        originalName: f.original_name,
                        url: f.url,
                        fileType: f.file_type,
                        fileSize: f.file_size,
                        displayOrder: f.display_order,
                        assignmentFileType: f.file_type,
                        description: f.description
                    })),
                    createdBy: assignment.created_by,
                    createdByName: assignment.created_by_name,
                    createdAt: assignment.created_at,
                    updatedAt: assignment.updated_at
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Create assignment - attach existing files
    static async create(req, res) {
        try {
            const {
                classId,
                title,
                description,
                deadline,
                maxScore,
                fileIds,  // Array of file IDs to attach
                sendNotification
            } = req.body;

            const result = await transaction(async (conn) => {
                // Create assignment
                const [assignmentResult] = await conn.query(
                    `INSERT INTO assignments (class_id, title, description, deadline, max_score, created_by)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [classId, title, description, deadline, maxScore || 10, req.user.id]
                );

                const assignmentId = assignmentResult.insertId;

                // Attach files if provided
                if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
                    for (let i = 0; i < fileIds.length; i++) {
                        const fileId = fileIds[i];
                        // Verify file exists and belongs to this class
                        const [file] = await conn.query(
                            'SELECT id FROM files WHERE id = ? AND (class_id = ? OR class_id IS NULL)',
                            [fileId, classId]
                        );

                        if (file) {
                            await conn.query(
                                `INSERT INTO assignment_files (assignment_id, file_id, file_type, display_order)
                                 VALUES (?, ?, 'instruction', ?)`,
                                [assignmentId, fileId, i]
                            );
                        }
                    }
                }

                // Auto-create submissions for all students in class
                await conn.query(`
                    INSERT INTO submissions (assignment_id, student_id, status)
                    SELECT ?, id, 'not_submitted'
                    FROM students
                    WHERE class_id = ?
                `, [assignmentId, classId]);

                return assignmentId;
            });

            // Send notification
            if (sendNotification) {
                try {
                    const students = await query(
                        'SELECT email, parent_email, name FROM students WHERE class_id = ?',
                        [classId]
                    );
                    const [cls] = await query('SELECT name FROM classes WHERE id = ?', [classId]);

                    for (const student of students) {
                        const emailTo = student.parent_email || student.email;
                        if (emailTo) {
                            await sendAssignmentNotification(emailTo, student.name, cls.name, title, deadline);
                        }
                    }
                } catch (emailError) {
                    logger.warn('Failed to send notifications:', emailError);
                }
            }

            res.status(201).json({
                success: true,
                message: 'Tạo bài tập thành công',
                data: { id: result, classId, title, deadline }
            });
        } catch (error) {
            logger.error('Create assignment error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Update assignment
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { title, description, deadline, maxScore, fileIds } = req.body;

            await transaction(async (conn) => {
                // Update assignment info
                await conn.query(
                    `UPDATE assignments 
                     SET title = ?, description = ?, deadline = ?, max_score = ?
                     WHERE id = ?`,
                    [title, description, deadline, maxScore, id]
                );

                // Update attached files if provided
                if (fileIds !== undefined) {
                    // Remove old file attachments
                    await conn.query('DELETE FROM assignment_files WHERE assignment_id = ?', [id]);

                    // Add new file attachments
                    if (Array.isArray(fileIds) && fileIds.length > 0) {
                        for (let i = 0; i < fileIds.length; i++) {
                            await conn.query(
                                `INSERT INTO assignment_files (assignment_id, file_id, file_type, display_order)
                                 VALUES (?, ?, 'instruction', ?)`,
                                [id, fileIds[i], i]
                            );
                        }
                    }
                }
            });

            res.json({
                success: true,
                message: 'Cập nhật bài tập thành công'
            });
        } catch (error) {
            logger.error('Update assignment error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Attach file to assignment
    static async attachFile(req, res) {
        try {
            const { assignmentId } = req.params;
            const { fileId, fileType } = req.body;

            // Get current max display order
            const [maxOrder] = await query(
                'SELECT COALESCE(MAX(display_order), -1) as max_order FROM assignment_files WHERE assignment_id = ?',
                [assignmentId]
            );

            await query(
                `INSERT INTO assignment_files (assignment_id, file_id, file_type, display_order)
                 VALUES (?, ?, ?, ?)`,
                [assignmentId, fileId, fileType || 'instruction', maxOrder[0].max_order + 1]
            );

            res.json({
                success: true,
                message: 'Đã đính kèm file vào bài tập'
            });
        } catch (error) {
            logger.error('Attach file error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Detach file from assignment
    static async detachFile(req, res) {
        try {
            const { assignmentId, fileId } = req.params;

            await query(
                'DELETE FROM assignment_files WHERE assignment_id = ? AND file_id = ?',
                [assignmentId, fileId]
            );

            res.json({
                success: true,
                message: 'Đã gỡ file khỏi bài tập'
            });
        } catch (error) {
            logger.error('Detach file error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Delete assignment (cascade deletes submissions and file links)
    static async delete(req, res) {
        try {
            const result = await query('DELETE FROM assignments WHERE id = ?', [req.params.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy bài tập' });
            }

            res.json({ success: true, message: 'Đã xóa bài tập thành công' });
        } catch (error) {
            logger.error('Delete assignment error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get assignment statistics
    static async getStatistics(req, res) {
        try {
            const { classId } = req.params;

            const [stats] = await query(`
                SELECT 
                    COUNT(DISTINCT a.id) as total_assignments,
                    COUNT(DISTINCT CASE WHEN a.deadline >= NOW() THEN a.id END) as upcoming_assignments,
                    COUNT(DISTINCT CASE WHEN a.deadline < NOW() THEN a.id END) as past_assignments,
                    COUNT(DISTINCT s.id) as total_submissions,
                    COUNT(DISTINCT CASE WHEN s.status = 'graded' THEN s.id END) as graded_submissions,
                    AVG(CASE WHEN s.score IS NOT NULL THEN s.score END) as average_score
                FROM assignments a
                LEFT JOIN submissions s ON a.id = s.assignment_id
                WHERE a.class_id = ?
            `, [classId]);

            res.json({
                success: true,
                data: {
                    totalAssignments: stats[0].total_assignments || 0,
                    upcomingAssignments: stats[0].upcoming_assignments || 0,
                    pastAssignments: stats[0].past_assignments || 0,
                    totalSubmissions: stats[0].total_submissions || 0,
                    gradedSubmissions: stats[0].graded_submissions || 0,
                    averageScore: stats[0].average_score ? parseFloat(stats[0].average_score).toFixed(2) : 0
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default AssignmentController;