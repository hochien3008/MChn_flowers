<?php
/**
 * Delete Product (Admin)
 * POST: api/admin/products/delete.php
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

$product_id = isset($input['id']) ? (int)$input['id'] : null;

if (!$product_id) {
    sendJsonResponse(false, 'ID sản phẩm là bắt buộc');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Get product to delete image
$query = "SELECT image FROM products WHERE id = :id LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $product_id, PDO::PARAM_INT);
$stmt->execute();
$product = $stmt->fetch();

if (!$product) {
    sendJsonResponse(false, 'Không tìm thấy sản phẩm');
}

// Delete product
$deleteQuery = "DELETE FROM products WHERE id = :id";
$deleteStmt = $db->prepare($deleteQuery);
$deleteStmt->bindParam(':id', $product_id, PDO::PARAM_INT);

if ($deleteStmt->execute()) {
    // Delete image file
    if ($product['image'] && file_exists(UPLOAD_PATH . $product['image'])) {
        deleteFile(UPLOAD_PATH . $product['image']);
    }
    
    sendJsonResponse(true, 'Xóa sản phẩm thành công');
} else {
    sendJsonResponse(false, 'Xóa sản phẩm thất bại');
}

