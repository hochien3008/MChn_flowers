<?php
/**
 * Update Order Status (Admin)
 * POST: api/admin/orders/update-status.php
 * Body: { order_id, status }
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

$order_id = isset($input['order_id']) ? (int)$input['order_id'] : null;
$status = isset($input['status']) ? sanitizeInput($input['status']) : null;

if (!$order_id || !$status) {
    sendJsonResponse(false, 'Order ID và trạng thái là bắt buộc');
}

// Validate status
$valid_statuses = ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'];
if (!in_array($status, $valid_statuses)) {
    sendJsonResponse(false, 'Trạng thái không hợp lệ');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Check if order exists
$checkQuery = "SELECT id, status FROM orders WHERE id = :id LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(':id', $order_id, PDO::PARAM_INT);
$checkStmt->execute();
$order = $checkStmt->fetch();

if (!$order) {
    sendJsonResponse(false, 'Không tìm thấy đơn hàng');
}

// Update status
$updateQuery = "UPDATE orders SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
$updateStmt = $db->prepare($updateQuery);
$updateStmt->bindParam(':status', $status, PDO::PARAM_STR);
$updateStmt->bindParam(':id', $order_id, PDO::PARAM_INT);

if ($updateStmt->execute()) {
    sendJsonResponse(true, 'Cập nhật trạng thái đơn hàng thành công', [
        'order_id' => $order_id,
        'old_status' => $order['status'],
        'new_status' => $status
    ]);
} else {
    sendJsonResponse(false, 'Cập nhật trạng thái thất bại');
}

