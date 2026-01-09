<?php
/**
 * Get/Update User Profile
 * GET: api/user/profile.php - Get profile
 * POST: api/user/profile.php - Update profile
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Require authentication
requireAuth();

// Database connection
$database = new Database();
$db = $database->getConnection();

$user_id = getCurrentUserId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get profile
    $query = "SELECT id, email, full_name, phone, address, created_at FROM users WHERE id = :id LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $user = $stmt->fetch();
    
    if (!$user) {
        sendJsonResponse(false, 'Không tìm thấy người dùng');
    }
    
    sendJsonResponse(true, 'Lấy thông tin thành công', ['user' => $user]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Update profile
    $input = json_decode(file_get_contents('php://input'), true);
    
    $full_name = isset($input['full_name']) ? sanitizeInput($input['full_name']) : null;
    $phone = isset($input['phone']) ? sanitizeInput($input['phone']) : null;
    $address = isset($input['address']) ? sanitizeInput($input['address']) : null;
    
    if (!$full_name) {
        sendJsonResponse(false, 'Tên đầy đủ là bắt buộc');
    }
    
    $query = "UPDATE users SET full_name = :full_name, phone = :phone, address = :address, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':full_name', $full_name, PDO::PARAM_STR);
    $stmt->bindValue(':phone', $phone, PDO::PARAM_STR);
    $stmt->bindValue(':address', $address, PDO::PARAM_STR);
    $stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        sendJsonResponse(true, 'Cập nhật thông tin thành công');
    } else {
        sendJsonResponse(false, 'Cập nhật thông tin thất bại');
    }
} else {
    sendJsonResponse(false, 'Method not allowed', null, 405);
}

