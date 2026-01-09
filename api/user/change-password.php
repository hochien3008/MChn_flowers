<?php
/**
 * Change Password
 * POST: api/user/change-password.php
 * Body: { old_password, new_password }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Require authentication
requireAuth();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method not allowed', null, 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

$old_password = isset($input['old_password']) ? $input['old_password'] : null;
$new_password = isset($input['new_password']) ? $input['new_password'] : null;

if (!$old_password || !$new_password) {
    sendJsonResponse(false, 'Mật khẩu cũ và mật khẩu mới là bắt buộc');
}

if (strlen($new_password) < 6) {
    sendJsonResponse(false, 'Mật khẩu mới phải có ít nhất 6 ký tự');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

$user_id = getCurrentUserId();

// Get current password
$query = "SELECT password FROM users WHERE id = :id LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
$stmt->execute();
$user = $stmt->fetch();

if (!$user) {
    sendJsonResponse(false, 'Không tìm thấy người dùng');
}

// Verify old password
if (!verifyPassword($old_password, $user['password'])) {
    sendJsonResponse(false, 'Mật khẩu cũ không đúng');
}

// Hash new password
$hashed_password = hashPassword($new_password);

// Update password
$updateQuery = "UPDATE users SET password = :password, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
$updateStmt = $db->prepare($updateQuery);
$updateStmt->bindParam(':password', $hashed_password, PDO::PARAM_STR);
$updateStmt->bindParam(':id', $user_id, PDO::PARAM_INT);

if ($updateStmt->execute()) {
    sendJsonResponse(true, 'Đổi mật khẩu thành công');
} else {
    sendJsonResponse(false, 'Đổi mật khẩu thất bại');
}

