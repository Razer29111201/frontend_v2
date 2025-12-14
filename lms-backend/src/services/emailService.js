// src/services/emailService.js
import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
};

// Send email
export const sendEmail = async ({ to, subject, html, text }) => {
    try {
        const transporter = createTransporter();

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.SMTP_USER,
            to,
            subject,
            html,
            text
        });

        logger.info(`Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        logger.error('Email send failed:', error);
        throw error;
    }
};

// Send attendance notification
export const sendAttendanceNotification = async (parentEmail, studentName, className, status, date) => {
    const statusText = {
        'on-time': 'Đúng giờ',
        'late': 'Đi muộn',
        'excused': 'Nghỉ có phép',
        'absent': 'Vắng mặt'
    };

    const statusColor = {
        'on-time': '#10b981',
        'late': '#f59e0b',
        'excused': '#06b6d4',
        'absent': '#ef4444'
    };

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #34a853, #2d8f47); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; color: white; background: ${statusColor[status]}; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #34a853; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📚 ClassFlow</h1>
                <p>Thông báo điểm danh</p>
            </div>
            <div class="content">
                <h2>Xin chào Phụ huynh!</h2>
                <p>Chúng tôi xin thông báo tình hình điểm danh của con bạn:</p>
                
                <div class="info-box">
                    <p><strong>Học sinh:</strong> ${studentName}</p>
                    <p><strong>Lớp:</strong> ${className}</p>
                    <p><strong>Ngày:</strong> ${new Date(date).toLocaleDateString('vi-VN')}</p>
                    <p><strong>Trạng thái:</strong> <span class="status-badge">${statusText[status]}</span></p>
                </div>
                
                ${status === 'absent' ? `
                <p style="color: #ef4444;">⚠️ Con bạn đã vắng mặt trong buổi học hôm nay. Vui lòng liên hệ với giáo viên nếu cần.</p>
                ` : ''}
                
                <p>Trân trọng,<br>Đội ngũ ClassFlow</p>
            </div>
            <div class="footer">
                <p>Email này được gửi tự động từ hệ thống ClassFlow</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: parentEmail,
        subject: `[ClassFlow] Thông báo điểm danh - ${studentName}`,
        html,
        text: `Học sinh ${studentName} lớp ${className} ngày ${date}: ${statusText[status]}`
    });
};

// Send grade notification
export const sendGradeNotification = async (parentEmail, studentName, className, assignmentName, score, maxScore) => {
    const percentage = ((score / maxScore) * 100).toFixed(1);
    const gradeColor = percentage >= 80 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4285f4, #1a73e8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .score-box { background: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; }
            .score { font-size: 48px; font-weight: 700; color: ${gradeColor}; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📝 ClassFlow</h1>
                <p>Thông báo điểm số</p>
            </div>
            <div class="content">
                <h2>Xin chào Phụ huynh!</h2>
                <p>Điểm số mới đã được cập nhật cho con bạn:</p>
                
                <div class="score-box">
                    <p><strong>${studentName}</strong> - ${className}</p>
                    <p style="color: #6b7280;">${assignmentName}</p>
                    <div class="score">${score}/${maxScore}</div>
                    <p style="color: ${gradeColor}; font-weight: 600;">${percentage}%</p>
                </div>
                
                <p>Trân trọng,<br>Đội ngũ ClassFlow</p>
            </div>
            <div class="footer">
                <p>Email này được gửi tự động từ hệ thống ClassFlow</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: parentEmail,
        subject: `[ClassFlow] Điểm số mới - ${studentName}`,
        html,
        text: `Học sinh ${studentName} - ${assignmentName}: ${score}/${maxScore} (${percentage}%)`
    });
};

// Send password reset email
export const sendPasswordResetEmail = async (email, name, resetToken) => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #34a853, #2d8f47); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .btn { display: inline-block; padding: 14px 28px; background: #34a853; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 ClassFlow</h1>
                <p>Đặt lại mật khẩu</p>
            </div>
            <div class="content">
                <h2>Xin chào ${name}!</h2>
                <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới để tiếp tục:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" class="btn">Đặt lại mật khẩu</a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px;">Link này sẽ hết hạn sau 1 giờ.</p>
                <p style="color: #6b7280; font-size: 14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                
                <p>Trân trọng,<br>Đội ngũ ClassFlow</p>
            </div>
            <div class="footer">
                <p>Email này được gửi tự động từ hệ thống ClassFlow</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: '[ClassFlow] Đặt lại mật khẩu',
        html,
        text: `Xin chào ${name}, nhấn vào link sau để đặt lại mật khẩu: ${resetUrl}`
    });
};

// Send welcome email
export const sendWelcomeEmail = async (email, name, role) => {
    const roleText = {
        0: 'Admin',
        1: 'Giáo viên',
        2: 'Class Manager'
    };

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #34a853, #2d8f47); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .feature { display: flex; align-items: center; gap: 12px; margin: 12px 0; }
            .feature-icon { width: 40px; height: 40px; background: #e8f5e9; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Chào mừng đến ClassFlow!</h1>
            </div>
            <div class="content">
                <h2>Xin chào ${name}!</h2>
                <p>Tài khoản của bạn đã được tạo thành công với vai trò <strong>${roleText[role]}</strong>.</p>
                
                <h3>Bạn có thể:</h3>
                <div class="feature">
                    <div class="feature-icon">📚</div>
                    <span>Quản lý lớp học và học sinh</span>
                </div>
                <div class="feature">
                    <div class="feature-icon">✅</div>
                    <span>Điểm danh nhanh chóng</span>
                </div>
                <div class="feature">
                    <div class="feature-icon">📊</div>
                    <span>Xem báo cáo và thống kê</span>
                </div>
                <div class="feature">
                    <div class="feature-icon">📤</div>
                    <span>Xuất dữ liệu Excel</span>
                </div>
                
                <p>Trân trọng,<br>Đội ngũ ClassFlow</p>
            </div>
            <div class="footer">
                <p>Email này được gửi tự động từ hệ thống ClassFlow</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: '[ClassFlow] Chào mừng bạn đến với ClassFlow!',
        html,
        text: `Xin chào ${name}! Tài khoản của bạn đã được tạo thành công với vai trò ${roleText[role]}.`
    });
};

export const sendAssignmentNotification = async (email, studentName, className, assignmentTitle, deadline) => {
    const deadlineDate = new Date(deadline);
    const formattedDeadline = deadlineDate.toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { 
                background: linear-gradient(135deg, #f59e0b, #d97706); 
                color: white; 
                padding: 30px; 
                text-align: center; 
                border-radius: 10px 10px 0 0; 
            }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .assignment-box { 
                background: white; 
                padding: 25px; 
                border-radius: 12px; 
                margin: 20px 0;
                border-left: 4px solid #f59e0b;
            }
            .deadline-badge { 
                display: inline-block; 
                padding: 8px 16px; 
                background: #fef3c7; 
                color: #92400e; 
                border-radius: 20px; 
                font-weight: 600; 
                font-size: 14px;
            }
            .info-row { 
                padding: 10px 0; 
                border-bottom: 1px solid #e5e7eb; 
            }
            .info-row:last-child { border-bottom: none; }
            .label { color: #6b7280; font-weight: 500; }
            .value { color: #111827; font-weight: 600; }
            .btn { 
                display: inline-block; 
                padding: 14px 28px; 
                background: #f59e0b; 
                color: white; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
                margin-top: 20px;
            }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📚 Bài Tập Mới</h1>
                <p>ClassFlow - Hệ thống quản lý lớp học</p>
            </div>
            <div class="content">
                <h2>Xin chào ${studentName}!</h2>
                <p>Giáo viên vừa giao bài tập mới cho lớp <strong>${className}</strong>.</p>
                
                <div class="assignment-box">
                    <div class="info-row">
                        <span class="label">Bài tập:</span>
                        <div class="value" style="margin-top: 5px; font-size: 18px;">${assignmentTitle}</div>
                    </div>
                    <div class="info-row">
                        <span class="label">Lớp:</span>
                        <span class="value">${className}</span>
                    </div>
                    <div class="info-row">
                        <span class="label">Hạn nộp:</span>
                        <div style="margin-top: 5px;">
                            <span class="deadline-badge">⏰ ${formattedDeadline}</span>
                        </div>
                    </div>
                </div>
                
                <p style="background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                    <strong>⚠️ Lưu ý:</strong> Hãy hoàn thành và nộp bài đúng hạn để tránh bị trừ điểm. 
                    Nếu nộp muộn, hệ thống sẽ tự động đánh dấu.
                </p>
                
                <p>Đăng nhập vào hệ thống ClassFlow để xem chi tiết bài tập và nộp bài.</p>
                
                <div style="text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">
                        Xem Bài Tập
                    </a>
                </div>
                
                <p style="margin-top: 30px;">Chúc bạn học tốt!<br>Đội ngũ ClassFlow</p>
            </div>
            <div class="footer">
                <p>Email này được gửi tự động từ hệ thống ClassFlow</p>
                <p style="font-size: 12px; color: #9ca3af;">
                    Nếu bạn không phải là ${studentName}, vui lòng bỏ qua email này.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: `[ClassFlow] Bài tập mới: ${assignmentTitle}`,
        html,
        text: `Bài tập mới: ${assignmentTitle}\nLớp: ${className}\nHạn nộp: ${formattedDeadline}\n\nĐăng nhập ClassFlow để xem chi tiết.`
    });
};

// Send submission reminder (for assignments nearing deadline)
export const sendSubmissionReminder = async (email, studentName, assignmentTitle, deadline, hoursRemaining) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { 
                background: linear-gradient(135deg, #ef4444, #dc2626); 
                color: white; 
                padding: 30px; 
                text-align: center; 
                border-radius: 10px 10px 0 0; 
            }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .warning-box { 
                background: #fee2e2; 
                border: 2px solid #ef4444; 
                border-radius: 12px; 
                padding: 25px; 
                margin: 20px 0;
                text-align: center;
            }
            .countdown { 
                font-size: 48px; 
                font-weight: 700; 
                color: #dc2626;
                margin: 10px 0;
            }
            .btn { 
                display: inline-block; 
                padding: 14px 28px; 
                background: #ef4444; 
                color: white; 
                text-decoration: none; 
                border-radius: 8px; 
                font-weight: 600;
            }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ Nhắc Nhở Nộp Bài</h1>
            </div>
            <div class="content">
                <h2>Xin chào ${studentName}!</h2>
                <p>Bài tập <strong>"${assignmentTitle}"</strong> sắp hết hạn nộp!</p>
                
                <div class="warning-box">
                    <p style="margin: 0; font-size: 16px; color: #7f1d1d;">Thời gian còn lại</p>
                    <div class="countdown">${hoursRemaining}h</div>
                    <p style="margin: 0; color: #991b1b;">Hạn nộp: ${new Date(deadline).toLocaleString('vi-VN')}</p>
                </div>
                
                <p style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
                    <strong>🔔 Hãy nộp bài ngay!</strong><br>
                    Nộp muộn sẽ bị trừ điểm và ảnh hưởng đến kết quả học tập.
                </p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="btn">
                        Nộp Bài Ngay
                    </a>
                </div>
                
                <p style="margin-top: 30px;">Chúc bạn hoàn thành tốt bài tập!<br>Đội ngũ ClassFlow</p>
            </div>
            <div class="footer">
                <p>Email nhắc nhở tự động từ hệ thống ClassFlow</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return sendEmail({
        to: email,
        subject: `[ClassFlow] ⚠️ Nhắc nhở: ${assignmentTitle} - Còn ${hoursRemaining}h`,
        html,
        text: `Nhắc nhở: Bài tập "${assignmentTitle}" sắp hết hạn!\nCòn ${hoursRemaining} giờ nữa.\nHạn nộp: ${new Date(deadline).toLocaleString('vi-VN')}\nNộp bài ngay tại ClassFlow.`
    });
};

// Export all functions including the new ones
export default {
    sendEmail,
    sendAttendanceNotification,
    sendGradeNotification,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    sendAssignmentNotification,
    sendSubmissionReminder
};