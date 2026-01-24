<?php
/**
 * Login API
 * POST: api/auth/login.php
 * Body: { email, password }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method not allowed', null, 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['email']) || !isset($input['password'])) {
    sendJsonResponse(false, 'Email và mật khẩu là bắt buộc');
}

$email = sanitizeInput($input['email']);
$password = $input['password'];

if (!isValidEmail($email)) {
    sendJsonResponse(false, 'Email không hợp lệ');
}

if (empty($password)) {
    sendJsonResponse(false, 'Mật khẩu không được để trống');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Query user
$query = "SELECT id, email, password, full_name, phone, role, status FROM users WHERE email = :email LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':email', $email, PDO::PARAM_STR);
$stmt->execute();

$user = $stmt->fetch();

if (!$user) {
    sendJsonResponse(false, 'Email hoặc mật khẩu không đúng');
}

// Check if account is active
if ($user['status'] !== 'active') {
    sendJsonResponse(false, 'Tài khoản đã bị khóa hoặc chưa được kích hoạt');
}

// Verify password
if (!verifyPassword($password, $user['password'])) {
    sendJsonResponse(false, 'Email hoặc mật khẩu không đúng');
}

// Set session
session_regenerate_id(true);
$_SESSION['user_id'] = $user['id'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['user_name'] = $user['full_name'];
$_SESSION['user_role'] = $user['role'];

// Return user data (without password)
unset($user['password']);

sendJsonResponse(true, 'Đăng nhập thành công', [
    'user' => $user,
    'session_id' => session_id()
]);

