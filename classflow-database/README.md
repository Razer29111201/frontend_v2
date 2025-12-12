# ClassFlow Database

## 📦 Nội dung

```
classflow-database/
├── 01-schema.sql      # Tạo tất cả tables
├── 02-seed-data.sql   # Dữ liệu mẫu để test
└── README.md          # File này
```

## 🚀 Cách sử dụng

### Cách 1: Import qua MySQL CLI

```bash
# Tạo database và tables
mysql -u root -p < 01-schema.sql

# Import dữ liệu mẫu
mysql -u root -p classflow < 02-seed-data.sql
```

### Cách 2: Import qua phpMyAdmin / MySQL Workbench

1. Mở phpMyAdmin hoặc MySQL Workbench
2. Chạy file `01-schema.sql` trước
3. Sau đó chạy file `02-seed-data.sql`

### Cách 3: Railway MySQL

```bash
# Kết nối Railway MySQL
mysql -h <host> -u <user> -p<password> <database> < 01-schema.sql
mysql -h <host> -u <user> -p<password> <database> < 02-seed-data.sql
```

## 👤 Tài khoản test

| Email | Password | Role | Ghi chú |
|-------|----------|------|---------|
| admin@classflow.edu.vn | 123456 | Admin | Full quyền |
| minh.gv@classflow.edu.vn | 123456 | Teacher | GV Nguyễn Văn Minh |
| huong.gv@classflow.edu.vn | 123456 | Teacher | GV Trần Thị Hương |
| nam.gv@classflow.edu.vn | 123456 | Teacher | GV Lê Hoàng Nam |
| mai.cm@classflow.edu.vn | 123456 | CM | CM Võ Thị Mai |
| tung.cm@classflow.edu.vn | 123456 | CM | CM Đặng Văn Tùng |

**Lưu ý:** Password đã được hash bằng bcrypt.

## 📊 Dữ liệu mẫu

### Teachers (5)
- GV001 - Nguyễn Văn Minh (Web)
- GV002 - Trần Thị Hương (Database)
- GV003 - Lê Hoàng Nam (Java)
- GV004 - Phạm Thị Lan (UI/UX)
- GV005 - Hoàng Đức Anh (ML) - Inactive

### CMs (3)
- CM001 - Võ Thị Mai (quản lý 3 lớp)
- CM002 - Đặng Văn Tùng (quản lý 2 lớp)
- CM003 - Bùi Thị Ngọc (quản lý 1 lớp)

### Classes (6)
| Code | Tên | GV | CM | HS | Buổi |
|------|-----|----|----|-----|------|
| WEB101 | Lập trình Web Frontend | Minh | Mai | 5 | 15 |
| WEB102 | Lập trình Web Backend | Minh | Mai | 4 | 15 |
| DB101 | Cơ sở dữ liệu MySQL | Hương | Tùng | 4 | 15 |
| JAVA101 | Lập trình Java cơ bản | Nam | Tùng | 4 | 15 |
| UI101 | Thiết kế UI/UX | Lan | Ngọc | 3 | 12 |
| REACT101 | ReactJS nâng cao | Minh | Mai | 3 | 10 |

### Students (23)
- HS001 - HS023
- Phân bố vào 6 lớp
- Có thông tin phụ huynh

### Attendance
- WEB101: 3 buổi đã điểm danh
- WEB102: 2 buổi đã điểm danh
- DB101: 2 buổi đã điểm danh
- JAVA101: 2 buổi đã điểm danh

### Grades
- 22 bản ghi điểm số
- Các loại: homework, quiz

## 🗃️ Schema

### Tables chính
1. **users** - Tài khoản đăng nhập
2. **teachers** - Thông tin giáo viên
3. **cms** - Thông tin Class Manager
4. **classes** - Lớp học
5. **students** - Học sinh
6. **sessions** - Buổi học
7. **attendance** - Điểm danh
8. **comments** - Nhận xét học sinh

### Tables mới (v2)
9. **grades** - Điểm số
10. **notifications** - Thông báo
11. **holidays** - Ngày nghỉ
12. **activity_logs** - Nhật ký hoạt động

## 🔐 Roles

| Role | Code | Quyền |
|------|------|-------|
| Admin | 0 | Full quyền |
| Teacher | 1 | Điểm danh, nhận xét lớp được giao |
| CM | 2 | Quản lý lớp, học sinh được giao |

## ⚠️ Lưu ý

1. Chạy `01-schema.sql` trước `02-seed-data.sql`
2. Password mặc định: `123456` (đã hash)
3. Có thể dùng script `hash-existing-passwords.js` trong backend để hash password mới

## 🔄 Reset database

```sql
DROP DATABASE IF EXISTS classflow;
```

Sau đó chạy lại 2 file SQL.
