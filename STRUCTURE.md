# Cấu trúc thư mục dự án Sweetie Garden

## 📁 Cấu trúc tổng quan

```
/
├── index.html                    # Trang chủ
├── assets/                       # Tất cả tài nguyên tĩnh
│   ├── css/
│   │   └── styles.css           # CSS chính cho user-facing pages
│   ├── js/
│   │   └── main.js              # JavaScript chính
│   ├── images/
│   │   └── logo.png             # Logo website
│   └── components/               # Components tái sử dụng
│       ├── header.html
│       ├── footer.html
│       └── nav-menu.html
│
├── admin/                        # Admin Panel
│   ├── assets/
│   │   └── admin.css            # CSS cho admin panel
│   ├── pages/                   # Các trang admin
│   │   ├── dashboard.html
│   │   ├── products.html
│   │   ├── orders.html
│   │   ├── customers.html
│   │   ├── coupons.html
│   │   ├── combo.html
│   │   ├── staff.html
│   │   └── blog.html
│   └── login.html               # Trang đăng nhập admin
│
├── auth/                         # Authentication
│   ├── login.html               # Đăng nhập user
│   └── register.html            # Đăng ký user
│
├── account/                      # Quản lý tài khoản
│   ├── profile.html             # Hồ sơ
│   ├── addresses.html           # Địa chỉ
│   └── order-tracking.html      # Theo dõi đơn hàng
│
├── shop/                         # Cửa hàng
│   ├── products.html            # Danh sách sản phẩm
│   ├── product-detail.html      # Chi tiết sản phẩm
│   ├── cart.html                # Giỏ hàng
│   ├── checkout.html            # Thanh toán
│   └── compare.html             # So sánh sản phẩm
│
└── pages/                        # Các trang khác
    ├── blog.html                # Blog
    ├── wishlist.html            # Yêu thích
    └── account.html             # Trang tài khoản
```

## 📝 Quy ước đường dẫn

### Từ root (index.html):
- CSS: `assets/css/styles.css`
- JS: `assets/js/main.js`
- Images: `assets/images/logo.png`

### Từ thư mục con (shop/, account/, auth/, pages/):
- CSS: `../../assets/css/styles.css`
- JS: `../../assets/js/main.js`
- Images: `../../assets/images/logo.png`

### Từ admin/pages/:
- Admin CSS: `../assets/admin.css`
- User CSS: `../../assets/css/styles.css`
- Images: `../../assets/images/logo.png`
- Links giữa các trang admin: relative (dashboard.html, products.html, etc.)
- Login admin: `../login.html`
- Về trang chủ: `../../index.html`

### Từ admin/login.html:
- User CSS: `../assets/css/styles.css`
- Admin CSS: `../assets/admin.css` (nếu cần)
- Images: `../assets/images/logo.png`
- Về trang chủ: `../index.html`

## ✅ Lợi ích của cấu trúc mới

1. **Tổ chức rõ ràng**: Mỗi nhóm chức năng có thư mục riêng
2. **Dễ bảo trì**: Assets tập trung một chỗ, dễ quản lý
3. **Scalable**: Dễ thêm trang mới vào đúng thư mục
4. **Consistent**: Đường dẫn nhất quán, dễ nhớ
5. **Professional**: Cấu trúc chuyên nghiệp, theo best practices
