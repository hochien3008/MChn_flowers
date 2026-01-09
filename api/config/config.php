<?php
/**
 * Configuration File for Sweetie Garden
 * 
 * IMPORTANT: Update these values with your actual hosting credentials
 */

// Database Configuration - CẬP NHẬT VỚI THÔNG TIN HOSTING
define('DB_HOST', 'localhost');
define('DB_NAME', 'fkaltpgx_shop');
define('DB_USER', 'fkaltpgx_shop'); // Cập nhật với DB user của hosting
define('DB_PASS', 'fkaltpgx_shop'); // Cập nhật với DB password của hosting
define('DB_CHARSET', 'utf8mb4');

// Application Configuration
define('APP_NAME', 'Sweetie Garden');
define('APP_URL', 'https://mchn.online'); // Cập nhật với domain của bạn
define('APP_ENV', 'production'); // 'development' hoặc 'production'

// Paths
define('BASE_PATH', dirname(__DIR__, 2));
define('UPLOAD_PATH', BASE_PATH . '/api/uploads/products/');
define('UPLOAD_URL', APP_URL . '/api/uploads/products/');

// Security
define('SECRET_KEY', 'sweetie-garden-secret-key-2024-change-in-production'); // Thay đổi trong production
define('SESSION_LIFETIME', 3600 * 24 * 7); // 7 days

// Email Configuration (for notifications - optional for now)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', '');
define('SMTP_PASS', '');
define('SMTP_FROM_EMAIL', 'noreply@sweetiegarden.com');
define('SMTP_FROM_NAME', 'Sweetie Garden');

// Payment Gateway Configuration (optional for now)
// VNPay
define('VNPAY_TMN_CODE', '');
define('VNPAY_HASH_SECRET', '');
define('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');

// File Upload
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/webp']);

// Pagination
define('PRODUCTS_PER_PAGE', 12);
define('ORDERS_PER_PAGE', 20);

// Timezone
date_default_timezone_set('Asia/Ho_Chi_Minh');

// Error Reporting
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

