<?php
/**
 * Delete Coupon (Admin)
 * POST: api/admin/coupons/delete.php
 * Body: { id }
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

$coupon_id = isset($input['id']) ? (int)$input['id'] : null;

if (!$coupon_id) {
    sendJsonResponse(false, 'ID mã giảm giá là bắt buộc');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Check if coupon exists
$checkQuery = "SELECT id, code FROM coupons WHERE id = :id LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(':id', $coupon_id, PDO::PARAM_INT);
$checkStmt->execute();

if (!$checkStmt->fetch()) {
    sendJsonResponse(false, 'Không tìm thấy mã giảm giá');
}

// Check if coupon has been used
$usageQuery = "SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = :id";
$usageStmt = $db->prepare($usageQuery);
$usageStmt->bindParam(':id', $coupon_id, PDO::PARAM_INT);
$usageStmt->execute();
$usage = $usageStmt->fetch();

// Delete coupon (cascade will handle coupon_usage if configured)
// But we use RESTRICT, so check first
if ((int)$usage['count'] > 0) {
    sendJsonResponse(false, 'Không thể xóa mã giảm giá đã được sử dụng. Vui lòng vô hiệu hóa thay vì xóa.');
}

// Delete coupon
$deleteQuery = "DELETE FROM coupons WHERE id = :id";
$deleteStmt = $db->prepare($deleteQuery);
$deleteStmt->bindParam(':id', $coupon_id, PDO::PARAM_INT);

if ($deleteStmt->execute()) {
    sendJsonResponse(true, 'Xóa mã giảm giá thành công');
} else {
    sendJsonResponse(false, 'Xóa mã giảm giá thất bại');
}

