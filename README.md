# Sweetie Garden - Website Bán Bánh Kem & Hoa Tươi

## 📋 Mô tả

Website bán bánh kem và hoa tươi với đầy đủ chức năng cho người dùng và admin panel.

## 🚀 Cài đặt

### Yêu cầu
- PHP 7.4+
- MySQL 5.7+
- Web server (Apache/Nginx)

### Database Setup

1. Import database schema:
```bash
mysql -u [user] -p [database] < database/schema-for-hosting.sql
```

2. Cấu hình database trong `api/config/config.php`:
```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');
```

### File Permissions

```bash
chmod 755 api/uploads/products/
```

## 📁 Cấu trúc Project

```
/
├── admin/              # Admin panel
├── api/               # Backend API
├── assets/            # CSS, JS, Images
├── auth/              # Login/Register pages
├── shop/              # Product pages
├── pages/             # Other pages
└── database/          # Database schema
```

## 🔐 Admin Login

- **URL:** `/admin/login.html`
- **Email:** `admin@sweetiegarden.com`
- **Password:** `admin123`

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login.php` - Đăng nhập
- `POST /api/auth/register.php` - Đăng ký
- `POST /api/auth/logout.php` - Đăng xuất
- `GET /api/auth/check.php` - Kiểm tra session

### Products
- `GET /api/products/list.php` - Danh sách sản phẩm
- `GET /api/products/detail.php` - Chi tiết sản phẩm

### Cart
- `GET /api/cart/get.php` - Lấy giỏ hàng
- `POST /api/cart/add.php` - Thêm vào giỏ
- `POST /api/cart/update.php` - Cập nhật số lượng
- `POST /api/cart/remove.php` - Xóa sản phẩm

### Orders
- `POST /api/orders/create.php` - Tạo đơn hàng
- `GET /api/orders/list.php` - Danh sách đơn hàng
- `GET /api/orders/detail.php` - Chi tiết đơn hàng

### Admin
- `GET /api/admin/dashboard/stats.php` - Dashboard stats
- `POST /api/admin/products/create.php` - Tạo sản phẩm
- `POST /api/admin/products/update.php` - Cập nhật sản phẩm
- `POST /api/admin/products/delete.php` - Xóa sản phẩm
- `POST /api/admin/orders/update-status.php` - Cập nhật trạng thái đơn

## 📝 Features

### User Features
- ✅ Xem sản phẩm, danh mục
- ✅ Tìm kiếm, lọc sản phẩm
- ✅ Giỏ hàng
- ✅ Đặt hàng
- ✅ Tài khoản người dùng
- ✅ Theo dõi đơn hàng

### Admin Features
- ✅ Dashboard với thống kê
- ✅ Quản lý sản phẩm
- ✅ Quản lý đơn hàng
- ✅ Quản lý khách hàng
- ✅ Quản lý mã giảm giá
- ✅ Quản lý combo
- ✅ Quản lý nhân viên
- ✅ Quản lý blog

## 🔧 Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** PHP
- **Database:** MySQL
- **API:** RESTful API

## 📄 License

Private project

## 📧 Contact

Sweetie Garden - Website Bán Bánh Kem & Hoa Tươi

