<?php
/**
 * Add Item to Wishlist
 * POST: api/wishlist/add.php
 * Body: { "product_id": 1 }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Require authentication
requireAuth();

// Get input
$input = json_decode(file_get_contents('php://input'), true);
$product_id = isset($input['product_id']) ? (int)$input['product_id'] : 0;

if (!$product_id) {
    sendJsonResponse(false, 'Product ID is required');
}

// Get user ID
$user_id = getCurrentUserId();

// Database connection
$database = new Database();
$db = $database->getConnection();

try {
    // Check if product exists
    $checkProduct = $db->prepare("SELECT id FROM products WHERE id = :id");
    $checkProduct->bindParam(':id', $product_id);
    $checkProduct->execute();
    
    if ($checkProduct->rowCount() === 0) {
        sendJsonResponse(false, 'Sản phẩm không tồn tại');
    }

    // Insert into wishlist (IGNORE to avoid duplicate error)
    $query = "INSERT IGNORE INTO wishlist (user_id, product_id) VALUES (:user_id, :product_id)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':product_id', $product_id);

    if ($stmt->execute()) {
        sendJsonResponse(true, 'Đã thêm vào danh sách yêu thích');
    } else {
        sendJsonResponse(false, 'Lỗi khi thêm vào wishlist');
    }
} catch (PDOException $e) {
    sendJsonResponse(false, 'Database error: ' . $e->getMessage());
}
