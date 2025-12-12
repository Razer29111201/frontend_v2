# ClassFlow API v2.0

Hệ thống quản lý lớp học hoàn chỉnh với Node.js, Express và MySQL.

## 🚀 Tính năng

- ✅ Authentication: JWT, đổi mật khẩu, quên mật khẩu
- ✅ Quản lý lớp học: CRUD với tự động tạo lịch
- ✅ Quản lý học sinh: CRUD với thông tin phụ huynh  
- ✅ Điểm danh: Theo buổi, thống kê, thông báo email
- ✅ Quản lý điểm: CRUD, tính trung bình
- ✅ Dashboard: Thống kê tổng quan
- ✅ Export Excel: Danh sách, điểm danh, điểm
- ✅ Security: Rate limiting, helmet, validation

## 📦 Cài đặt

```bash
npm install
cp .env.example .env
# Chỉnh sửa .env
npm run seed   # Tạo admin user
npm run dev    # Chạy server
```

## ⚙️ Cấu hình .env

```env
DB_HOST=your-host
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=classflow
PORT=8080
JWT_SECRET=your-secret-key
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📚 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/auth/login | Đăng nhập |
| GET | /api/classes | Danh sách lớp |
| POST | /api/classes | Tạo lớp |
| GET | /api/students | Danh sách học sinh |
| POST | /api/attendance | Lưu điểm danh |
| GET | /api/grades/class/:id | Điểm theo lớp |
| GET | /api/dashboard/stats | Thống kê |
| GET | /api/export/classes | Xuất Excel |

## 🔐 Roles: Admin (0), Teacher (1), CM (2)

## 🚀 Deploy: Railway, Render, Heroku

MIT License
