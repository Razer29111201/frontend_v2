// src/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage for different file types
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let folder = 'classflow/files';
        let resource_type = 'auto';
        
        // Determine folder based on file type
        if (file.mimetype.startsWith('image/')) {
            folder = 'classflow/images';
            resource_type = 'image';
        } else if (file.mimetype === 'application/pdf') {
            folder = 'classflow/documents';
            resource_type = 'raw';
        } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
            folder = 'classflow/spreadsheets';
            resource_type = 'raw';
        }
        
        return {
            folder,
            resource_type,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
            transformation: file.mimetype.startsWith('image/') ? [{ width: 1000, crop: 'limit' }] : undefined
        };
    }
});

// Multer upload middleware
export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Loại file không được hỗ trợ'), false);
        }
    }
});

// Delete file from Cloudinary
export const deleteFile = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error('Không thể xóa file: ' + error.message);
    }
};

export { cloudinary };
export default { upload, deleteFile, cloudinary };
