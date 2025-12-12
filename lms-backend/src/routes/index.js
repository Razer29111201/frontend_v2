// src/routes/index.js
import express from 'express';
import authRoutes from './authRoutes.js';
import classRoutes from './classRoutes.js';
import studentRoutes from './studentRoutes.js';
import teacherRoutes from './teacherRoutes.js';
import cmRoutes from './cmRoutes.js';
import sessionRoutes from './sessionRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import commentRoutes from './commentRoutes.js';
import gradeRoutes from './gradeRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import exportRoutes from './exportRoutes.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'ClassFlow API v2.0 đang chạy',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth', classes: '/api/classes', students: '/api/students',
            teachers: '/api/teachers', cms: '/api/cms', sessions: '/api/sessions',
            attendance: '/api/attendance', comments: '/api/comments', grades: '/api/grades',
            dashboard: '/api/dashboard', export: '/api/export'
        }
    });
});

router.use('/auth', authRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/teachers', teacherRoutes);
router.use('/cms', cmRoutes);
router.use('/sessions', sessionRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/comments', commentRoutes);
router.use('/grades', gradeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/export', exportRoutes);

export default router;
