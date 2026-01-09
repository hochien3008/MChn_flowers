<?php
/**
 * Register API
 * POST: api/auth/register.php
 * Body: { email, password, full_name, phone }
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
if (!isset($input['email']) || !isset($input['password']) || !isset($input['full_name'])) {
    sendJsonResponse(false, 'Email, mật khẩu và tên đầy đủ là bắt buộc');
}

$email = sanitizeInput($input['email']);
$password = $input['password'];
$full_name = sanitizeInput($input['full_name']);
$phone = isset($input['phone']) ? sanitizeInput($input['phone']) : null;

if (!isValidEmail($email)) {
    sendJsonResponse(false, 'Email không hợp lệ');
}

if (strlen($password) < 6) {
    sendJsonResponse(false, 'Mật khẩu phải có ít nhất 6 ký tự');
}

if (empty($full_name)) {
    sendJsonResponse(false, 'Tên đầy đủ không được để trống');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Check if email already exists
$query = "SELECT id FROM users WHERE email = :email LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':email', $email, PDO::PARAM_STR);
$stmt->execute();

if ($stmt->fetch()) {
    sendJsonResponse(false, 'Email này đã được sử dụng');
}

// Hash password
$hashed_password = hashPassword($password);

// Insert user
$query = "INSERT INTO users (email, password, full_name, phone, role, status) 
          VALUES (:email, :password, :full_name, :phone, 'user', 'active')";
$stmt = $db->prepare($query);
$stmt->bindParam(':email', $email, PDO::PARAM_STR);
$stmt->bindParam(':password', $hashed_password, PDO::PARAM_STR);
$stmt->bindParam(':full_name', $full_name, PDO::PARAM_STR);
$stmt->bindParam(':phone', $phone, PDO::PARAM_STR);

if (!$stmt->execute()) {
    sendJsonResponse(false, 'Đăng ký thất bại. Vui lòng thử lại.');
}

// Get new user ID
$user_id = $db->lastInsertId();

// Set session
$_SESSION['user_id'] = $user_id;
$_SESSION['user_email'] = $email;
$_SESSION['user_name'] = $full_name;
$_SESSION['user_role'] = 'user';

sendJsonResponse(true, 'Đăng ký thành công', [
    'user' => [
        'id' => $user_id,
        'email' => $email,
        'full_name' => $full_name,
        'phone' => $phone,
        'role' => 'user'
    ],
    'session_id' => session_id()
]);

