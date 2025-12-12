// server.js - Main Entry Point
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initDB } from './src/config/database.js';
import routes from './src/routes/index.js';
import { notFoundHandler, errorHandler } from './src/middleware/errorHandler.js';
import { generalLimiter } from './src/middleware/rateLimiter.js';
import logger from './src/utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ===== SECURITY MIDDLEWARE =====
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// ===== RATE LIMITING =====
app.use(generalLimiter);

// ===== BODY PARSER =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== REQUEST LOGGER =====
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// ===== ROUTES =====
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '2.0.0'
    });
});

// ===== ERROR HANDLING =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== START SERVER =====
const startServer = async () => {
    try {
        await initDB();
        
        app.listen(PORT, () => {
            console.log('╔════════════════════════════════════════╗');
            console.log('║     ClassFlow API Server v2.0         ║');
            console.log('╠════════════════════════════════════════╣');
            console.log(`║  🚀 Server: http://localhost:${PORT}        ║`);
            console.log(`║  📡 API: http://localhost:${PORT}/api       ║`);
            console.log(`║  💚 Health: http://localhost:${PORT}/health ║`);
            console.log(`║  🌍 Env: ${(process.env.NODE_ENV || 'development').padEnd(24)}║`);
            console.log('╚════════════════════════════════════════╝');
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION!', err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION!', err);
    process.exit(1);
});

startServer();

export default app;
