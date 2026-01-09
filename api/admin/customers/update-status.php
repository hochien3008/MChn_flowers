<?php
/**
 * Update Customer Status (Admin)
 * POST: api/admin/customers/update-status.php
 * Body: { customer_id, status }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

// Require admin access
requireAdmin();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method not allowed', null, 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

$customer_id = isset($input['customer_id']) ? (int)$input['customer_id'] : null;
$status = isset($input['status']) ? sanitizeInput($input['status']) : null;

if (!$customer_id || !$status) {
    sendJsonResponse(false, 'Customer ID và trạng thái là bắt buộc');
}

// Validate status
$valid_statuses = ['active', 'suspended', 'banned'];
if (!in_array($status, $valid_statuses)) {
    sendJsonResponse(false, 'Trạng thái không hợp lệ');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Check if customer exists and is not admin
$checkQuery = "SELECT id, status FROM users WHERE id = :id AND role = 'user' LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(':id', $customer_id, PDO::PARAM_INT);
$checkStmt->execute();
$customer = $checkStmt->fetch();

if (!$customer) {
    sendJsonResponse(false, 'Không tìm thấy khách hàng');
}

// Update status
$updateQuery = "UPDATE users SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
$updateStmt = $db->prepare($updateQuery);
$updateStmt->bindParam(':status', $status, PDO::PARAM_STR);
$updateStmt->bindParam(':id', $customer_id, PDO::PARAM_INT);

if ($updateStmt->execute()) {
    sendJsonResponse(true, 'Cập nhật trạng thái khách hàng thành công', [
        'customer_id' => $customer_id,
        'old_status' => $customer['status'],
        'new_status' => $status
    ]);
} else {
    sendJsonResponse(false, 'Cập nhật trạng thái thất bại');
}

