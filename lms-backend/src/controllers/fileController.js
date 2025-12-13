// src/controllers/fileController.js
import { query } from '../config/database.js';
import { deleteFile } from '../config/cloudinary.js';
import logger from '../utils/logger.js';

class FileController {
    // Get all files
    static async getAll(req, res) {
        try {
            const { classId, category, uploaderId } = req.query;
            
            let sql = 'SELECT f.*, u.name as uploader_name, c.name as class_name FROM files f LEFT JOIN users u ON f.uploader_id = u.id LEFT JOIN classes c ON f.class_id = c.id WHERE 1=1';
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
            
            sql += ' ORDER BY f.created_at DESC';
            
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
                    url: f.url,
                    publicId: f.public_id,
                    category: f.category,
                    description: f.description,
                    createdAt: f.created_at
                }))
            });
        } catch (error) {
            logger.error('Get files error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get one file
    static async getOne(req, res) {
        try {
            const [file] = await query(
                `SELECT f.*, u.name as uploader_name, c.name as class_name 
                 FROM files f 
                 LEFT JOIN users u ON f.uploader_id = u.id 
                 LEFT JOIN classes c ON f.class_id = c.id 
                 WHERE f.id = ?`,
                [req.params.id]
            );
            
            if (!file) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy file' });
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
                    url: file.url,
                    publicId: file.public_id,
                    category: file.category,
                    description: file.description,
                    createdAt: file.created_at
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Upload file
    static async upload(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'Không có file được upload' });
            }

            const { classId, category, description } = req.body;
            
            const result = await query(
                `INSERT INTO files 
                (class_id, uploader_id, filename, original_name, file_type, file_size, url, public_id, category, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    classId || null,
                    req.user.id,
                    req.file.filename,
                    req.file.originalname,
                    req.file.mimetype,
                    req.file.size,
                    req.file.path,
                    req.file.filename,
                    category || 'other',
                    description || ''
                ]
            );

            res.status(201).json({ 
                success: true, 
                data: {
                    id: result.insertId,
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    url: req.file.path,
                    size: req.file.size
                }
            });
        } catch (error) {
            logger.error('Upload file error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Update file metadata
    static async update(req, res) {
        try {
            const { category, description } = req.body;
            
            const result = await query(
                'UPDATE files SET category = ?, description = ? WHERE id = ?',
                [category, description, req.params.id]
            );
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy file' });
            }
            
            res.json({ success: true, message: 'Cập nhật thông tin file thành công' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Delete file
    static async delete(req, res) {
        try {
            const [file] = await query('SELECT * FROM files WHERE id = ?', [req.params.id]);
            
            if (!file) {
                return res.status(404).json({ success: false, error: 'Không tìm thấy file' });
            }

            // Delete from cloud storage if has public_id
            if (file.public_id) {
                try {
                    await deleteFile(file.public_id);
                } catch (error) {
                    logger.warn('Failed to delete file from cloud:', error);
                }
            }

            // Delete from database
            await query('DELETE FROM files WHERE id = ?', [req.params.id]);
            
            res.json({ success: true, message: 'Đã xóa file thành công' });
        } catch (error) {
            logger.error('Delete file error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get files by class
    static async getByClass(req, res) {
        try {
            const files = await query(
                `SELECT f.*, u.name as uploader_name 
                 FROM files f 
                 LEFT JOIN users u ON f.uploader_id = u.id 
                 WHERE f.class_id = ? 
                 ORDER BY f.created_at DESC`,
                [req.params.classId]
            );
            
            res.json({ 
                success: true, 
                data: files.map(f => ({
                    id: f.id,
                    uploaderId: f.uploader_id,
                    uploaderName: f.uploader_name,
                    filename: f.filename,
                    originalName: f.original_name,
                    fileType: f.file_type,
                    fileSize: f.file_size,
                    url: f.url,
                    category: f.category,
                    description: f.description,
                    createdAt: f.created_at
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // Get storage stats
    static async getStorageStats(req, res) {
        try {
            const [totalSize] = await query(
                'SELECT SUM(file_size) as total FROM files WHERE uploader_id = ?',
                [req.user.id]
            );
            
            const [fileCount] = await query(
                'SELECT COUNT(*) as count FROM files WHERE uploader_id = ?',
                [req.user.id]
            );

            const categoryStats = await query(
                `SELECT category, COUNT(*) as count, SUM(file_size) as total_size 
                 FROM files 
                 WHERE uploader_id = ? 
                 GROUP BY category`,
                [req.user.id]
            );

            res.json({ 
                success: true, 
                data: {
                    totalSize: totalSize[0]?.total || 0,
                    fileCount: fileCount[0]?.count || 0,
                    byCategory: categoryStats
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
}

export default FileController;
