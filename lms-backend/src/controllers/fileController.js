// src/controllers/fileController.js
import { query } from '../config/database.js';
import logger from '../utils/logger.js';
import path from 'path';

class FileController {
    /**
     * Get all files (with filters)
     */
    static async getAll(req, res) {
        try {
            const { classId, category, uploaderId } = req.query;

            let sql = `
                SELECT 
                    f.*,
                    u.name as uploader_name,
                    c.name as class_name
                FROM files f
                LEFT JOIN users u ON f.uploader_id = u.id
                LEFT JOIN classes c ON f.class_id = c.id
                WHERE 1=1
            `;
            const params = [];

            if (classId) {
                sql += ' AND f.class_id = ?';
                params.push(classId);
            }

            if (category) {
                sql += ' AND f.category = ?';
                params.push(category);
            }

            if (uploaderId) {
                sql += ' AND f.uploader_id = ?';
                params.push(uploaderId);
            }

            sql += ' ORDER BY f.uploaded_at DESC';

            const files = await query(sql, params);

            res.json({
                success: true,
                data: files.map(f => ({
                    id: f.id,
                    classId: f.class_id,
                    className: f.class_name,
                    uploaderId: f.uploader_id,
                    uploaderName: f.uploader_name,
                    filename: f.filename,
                    originalName: f.original_name,
                    fileType: f.file_type,
                    fileSize: f.file_size,
                    fileSizeFormatted: formatFileSize(f.file_size),
                    url: f.url,
                    category: f.category,
                    description: f.description,
                    uploadedAt: f.uploaded_at
                }))
            });
        } catch (error) {
            logger.error('Get files error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get files by class
     */
    static async getByClass(req, res) {
        try {
            const { classId } = req.params;
            const { category } = req.query;

            let sql = `
                SELECT 
                    f.*,
                    u.name as uploader_name
                FROM files f
                LEFT JOIN users u ON f.uploader_id = u.id
                WHERE f.class_id = ?
            `;
            const params = [classId];

            if (category) {
                sql += ' AND f.category = ?';
                params.push(category);
            }

            sql += ' ORDER BY f.uploaded_at DESC';

            const files = await query(sql, params);

            res.json({
                success: true,
                data: files.map(f => ({
                    id: f.id,
                    filename: f.filename,
                    originalName: f.original_name,
                    fileType: f.file_type,
                    fileSize: f.file_size,
                    fileSizeFormatted: formatFileSize(f.file_size),
                    url: f.url,
                    category: f.category,
                    description: f.description,
                    uploaderName: f.uploader_name,
                    uploadedAt: f.uploaded_at
                }))
            });
        } catch (error) {
            logger.error('Get files by class error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get file statistics
     */
    static async getStats(req, res) {
        try {
            const { classId } = req.query;

            let sql = `
                SELECT 
                    COUNT(*) as total_files,
                    COUNT(CASE WHEN category = 'material' THEN 1 END) as material_count,
                    COUNT(CASE WHEN category = 'assignment' THEN 1 END) as assignment_count,
                    COUNT(CASE WHEN category = 'submission' THEN 1 END) as submission_count,
                    COUNT(CASE WHEN category = 'other' THEN 1 END) as other_count,
                    SUM(file_size) as total_size,
                    AVG(file_size) as avg_size
                FROM files
                WHERE 1=1
            `;
            const params = [];

            if (classId) {
                sql += ' AND class_id = ?';
                params.push(classId);
            }

            const [stats] = await query(sql, params);

            res.json({
                success: true,
                data: {
                    totalFiles: stats.total_files || 0,
                    materialCount: stats.material_count || 0,
                    assignmentCount: stats.assignment_count || 0,
                    submissionCount: stats.submission_count || 0,
                    otherCount: stats.other_count || 0,
                    totalSize: stats.total_size || 0,
                    totalSizeFormatted: formatFileSize(stats.total_size || 0),
                    avgSize: stats.avg_size || 0,
                    avgSizeFormatted: formatFileSize(stats.avg_size || 0)
                }
            });
        } catch (error) {
            logger.error('Get file stats error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get one file
     */
    static async getOne(req, res) {
        try {
            const [file] = await query(`
                SELECT 
                    f.*,
                    u.name as uploader_name,
                    c.name as class_name
                FROM files f
                LEFT JOIN users u ON f.uploader_id = u.id
                LEFT JOIN classes c ON f.class_id = c.id
                WHERE f.id = ?
            `, [req.params.id]);

            if (!file) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy file'
                });
            }

            res.json({
                success: true,
                data: {
                    id: file.id,
                    classId: file.class_id,
                    className: file.class_name,
                    uploaderId: file.uploader_id,
                    uploaderName: file.uploader_name,
                    filename: file.filename,
                    originalName: file.original_name,
                    fileType: file.file_type,
                    fileSize: file.file_size,
                    fileSizeFormatted: formatFileSize(file.file_size),
                    url: file.url,
                    category: file.category,
                    description: file.description,
                    uploadedAt: file.uploaded_at
                }
            });
        } catch (error) {
            logger.error('Get file error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Upload file (metadata only - actual upload handled by frontend/multer)
     */
    static async upload(req, res) {
        try {
            const {
                classId,
                filename,
                originalName,
                fileType,
                fileSize,
                url,
                category,
                description
            } = req.body;

            const uploaderId = req.user.id;

            const result = await query(
                `INSERT INTO files (class_id, uploader_id, filename, original_name, 
                 file_type, file_size, url, category, description)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [classId, uploaderId, filename, originalName, fileType, fileSize,
                    url, category || 'other', description]
            );

            res.status(201).json({
                success: true,
                message: 'Upload file thành công',
                data: {
                    id: result.insertId,
                    filename,
                    originalName,
                    url
                }
            });
        } catch (error) {
            logger.error('Upload file error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update file metadata
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { originalName, category, description } = req.body;

            await query(
                `UPDATE files 
                 SET original_name = COALESCE(?, original_name),
                     category = COALESCE(?, category),
                     description = COALESCE(?, description)
                 WHERE id = ?`,
                [originalName, category, description, id]
            );

            res.json({
                success: true,
                message: 'Cập nhật file thành công'
            });
        } catch (error) {
            logger.error('Update file error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Delete file
     */
    static async delete(req, res) {
        try {
            const { id } = req.params;

            // Check if file is being used
            const [assignmentUsage] = await query(
                'SELECT COUNT(*) as count FROM assignment_files WHERE file_id = ?',
                [id]
            );

            const [submissionUsage] = await query(
                'SELECT COUNT(*) as count FROM submission_files WHERE file_id = ?',
                [id]
            );

            if (assignmentUsage.count > 0 || submissionUsage.count > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'File đang được sử dụng, không thể xóa'
                });
            }

            const result = await query('DELETE FROM files WHERE id = ?', [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Không tìm thấy file'
                });
            }

            res.json({
                success: true,
                message: 'Đã xóa file'
            });
        } catch (error) {
            logger.error('Delete file error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get available files for assignment attachment
     */
    static async getAvailableForAssignment(req, res) {
        try {
            const { classId } = req.params;
            const { category } = req.query;

            let sql = `
                SELECT 
                    f.id,
                    f.filename,
                    f.original_name,
                    f.file_type,
                    f.file_size,
                    f.url,
                    f.category,
                    f.description,
                    f.uploaded_at,
                    u.name as uploader_name,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM assignment_files af 
                            WHERE af.file_id = f.id
                        ) THEN 1 
                        ELSE 0 
                    END as is_used_in_assignments
                FROM files f
                LEFT JOIN users u ON f.uploader_id = u.id
                WHERE f.class_id = ?
            `;
            const params = [classId];

            if (category) {
                sql += ' AND f.category = ?';
                params.push(category);
            }

            sql += ' ORDER BY f.uploaded_at DESC';

            const files = await query(sql, params);

            res.json({
                success: true,
                data: files.map(f => ({
                    id: f.id,
                    filename: f.filename,
                    originalName: f.original_name,
                    fileType: f.file_type,
                    fileSize: f.file_size,
                    fileSizeFormatted: formatFileSize(f.file_size),
                    url: f.url,
                    category: f.category,
                    description: f.description,
                    uploadedAt: f.uploaded_at,
                    uploaderName: f.uploader_name,
                    isUsedInAssignments: !!f.is_used_in_assignments
                }))
            });
        } catch (error) {
            logger.error('Get available files error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get available files for submission attachment
     */
    static async getAvailableForSubmission(req, res) {
        try {
            const { classId, studentId } = req.params;

            const files = await query(`
                SELECT 
                    f.id,
                    f.filename,
                    f.original_name,
                    f.file_type,
                    f.file_size,
                    f.url,
                    f.description,
                    f.uploaded_at,
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM submission_files sf 
                            WHERE sf.file_id = f.id
                        ) THEN 1 
                        ELSE 0 
                    END as is_used_in_submissions
                FROM files f
                WHERE f.class_id = ? 
                AND (f.uploader_id IN (
                    SELECT user_id FROM students WHERE id = ?
                ) OR f.category = 'submission')
                ORDER BY f.uploaded_at DESC
            `, [classId, studentId]);

            res.json({
                success: true,
                data: files.map(f => ({
                    id: f.id,
                    filename: f.filename,
                    originalName: f.original_name,
                    fileType: f.file_type,
                    fileSize: f.file_size,
                    fileSizeFormatted: formatFileSize(f.file_size),
                    url: f.url,
                    description: f.description,
                    uploadedAt: f.uploaded_at,
                    isUsedInSubmissions: !!f.is_used_in_submissions
                }))
            });
        } catch (error) {
            logger.error('Get available submission files error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Update file category
     */
    static async updateCategory(req, res) {
        try {
            const { id } = req.params;
            const { category } = req.body;

            const allowedCategories = ['material', 'assignment', 'submission', 'other'];
            if (!allowedCategories.includes(category)) {
                return res.status(400).json({
                    success: false,
                    error: 'Category không hợp lệ'
                });
            }

            await query(
                'UPDATE files SET category = ? WHERE id = ?',
                [category, id]
            );

            res.json({
                success: true,
                message: 'Đã cập nhật category'
            });
        } catch (error) {
            logger.error('Update file category error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * Get file usage info
     */
    static async getUsageInfo(req, res) {
        try {
            const { id } = req.params;

            // Get assignments using this file
            const assignments = await query(`
                SELECT a.id, a.title, a.deadline, c.name as class_name
                FROM assignment_files af
                JOIN assignments a ON af.assignment_id = a.id
                JOIN classes c ON a.class_id = c.id
                WHERE af.file_id = ?
            `, [id]);

            // Get submissions using this file
            const submissions = await query(`
                SELECT s.id, a.title as assignment_title, st.name as student_name
                FROM submission_files sf
                JOIN submissions s ON sf.submission_id = s.id
                JOIN assignments a ON s.assignment_id = a.id
                JOIN students st ON s.student_id = st.id
                WHERE sf.file_id = ?
            `, [id]);

            res.json({
                success: true,
                data: {
                    usedInAssignments: assignments.length,
                    usedInSubmissions: submissions.length,
                    assignments: assignments,
                    submissions: submissions,
                    canDelete: assignments.length === 0 && submissions.length === 0
                }
            });
        } catch (error) {
            logger.error('Get file usage error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

// Helper function
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export default FileController;