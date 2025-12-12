# ClassFlow Frontend

Hệ thống quản lý lớp học - Giao diện người dùng

## 📁 Cấu trúc thư mục

```
classflow-frontend/
├── index.html      # Main HTML
├── style.css       # Styling
├── api.js          # API Client
├── app.js          # Main Application Logic
└── README.md       # Documentation
```

## 🚀 Cách sử dụng

### 1. Mở trực tiếp
Mở file `index.html` trong trình duyệt

### 2. Dùng Live Server (VSCode)
1. Cài extension "Live Server"
2. Click chuột phải vào `index.html` → "Open with Live Server"

### 3. Dùng Python HTTP Server
```bash
cd classflow-frontend
python -m http.server 3000
# Mở http://localhost:3000
```

### 4. Dùng Node.js
```bash
npx serve .
# hoặc
npm install -g http-server
http-server -p 3000
```

## ⚙️ Cấu hình API

Chỉnh sửa `api.js` để thay đổi URL backend:

```javascript
const CONFIG = {
    // Development
    API_URL: 'http://localhost:8080/api',
    
    // Production (Render)
    // API_URL: 'https://backend-lms-y0yb.onrender.com/api',
};
```

## 👤 Tài khoản Demo

| Email | Mật khẩu | Vai trò |
|-------|----------|---------|
| admin@classflow.edu.vn | 123456 | Admin |
| minh.gv@classflow.edu.vn | 123456 | Giáo viên |
| huong.gv@classflow.edu.vn | 123456 | Giáo viên |
| mai.cm@classflow.edu.vn | 123456 | Class Manager |
| tung.cm@classflow.edu.vn | 123456 | Class Manager |

## 🎯 Tính năng theo vai trò

### Admin (role: 0)
- ✅ Toàn quyền quản lý
- ✅ CRUD lớp học, học sinh, giáo viên, CM
- ✅ Xem/sửa điểm danh, nhận xét
- ✅ Export dữ liệu

### Giáo viên (role: 1)
- ✅ Xem lớp được phân công
- ✅ Điểm danh học sinh
- ✅ Nhận xét học sinh
- ✅ Export dữ liệu
- ❌ Không thể CRUD lớp/học sinh

### Class Manager (role: 2)
- ✅ CRUD lớp học được quản lý
- ✅ CRUD học sinh trong lớp
- ✅ Xem điểm danh (chỉ xem)
- ✅ Xem nhận xét (chỉ xem)
- ✅ Export dữ liệu

## 📱 Responsive

- Desktop: Full sidebar + features
- Tablet: Compact sidebar (icons only)
- Mobile: Hidden sidebar, stacked layout

## 🔧 Yêu cầu kỹ thuật

- Trình duyệt hiện đại (Chrome, Firefox, Safari, Edge)
- Backend API đang chạy
- Kết nối internet (để tải Font Awesome, SheetJS)

## 📦 Dependencies (CDN)

- Font Awesome 6.4.0 - Icons
- SheetJS 0.18.5 - Export Excel

## 🔄 API Endpoints

Frontend sử dụng các endpoint sau:

```
Auth:
- POST /api/auth/login
- POST /api/auth/register
- GET  /api/auth/me

Classes:
- GET    /api/classes
- POST   /api/classes
- PUT    /api/classes/:id
- DELETE /api/classes/:id

Students:
- GET    /api/students
- POST   /api/students
- PUT    /api/students/:id
- DELETE /api/students/:id

Teachers:
- GET    /api/teachers
- POST   /api/teachers
- PUT    /api/teachers/:id
- DELETE /api/teachers/:id

CMs:
- GET    /api/cms
- POST   /api/cms
- PUT    /api/cms/:id
- DELETE /api/cms/:id

Sessions:
- GET /api/sessions/:classId
- PUT /api/sessions/:classId

Attendance:
- GET  /api/attendance/:classId/:session
- POST /api/attendance

Comments:
- GET  /api/comments/class/:classId
- POST /api/comments
```

## 💡 Tips

1. **Nếu backend chưa chạy**: Sẽ hiện lỗi khi đăng nhập
2. **Session timeout**: 24 giờ, sau đó cần đăng nhập lại
3. **Export Excel**: Cần thư viện SheetJS (đã include qua CDN)

## 🐛 Troubleshooting

### Lỗi CORS
Đảm bảo backend đã enable CORS:
```javascript
app.use(cors({
    origin: '*',
    credentials: true
}));
```

### Không đăng nhập được
1. Kiểm tra console (F12) để xem lỗi chi tiết
2. Kiểm tra API_URL trong `api.js`
3. Đảm bảo backend đang chạy

### Không load được data
1. Kiểm tra network tab trong DevTools
2. Xác nhận token còn hiệu lực
3. Đăng xuất và đăng nhập lại

---

© 2025 ClassFlow LMS
