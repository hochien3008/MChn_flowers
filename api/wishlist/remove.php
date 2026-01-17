<?php
/**
 * Remove Item from Wishlist
 * POST: api/wishlist/remove.php
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
    $query = "DELETE FROM wishlist WHERE user_id = :user_id AND product_id = :product_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':product_id', $product_id);

    if ($stmt->execute()) {
        sendJsonResponse(true, 'Đã xóa khỏi danh sách yêu thích');
    } else {
        sendJsonResponse(false, 'Lỗi khi xóa khỏi wishlist');
    }
} catch (PDOException $e) {
    sendJsonResponse(false, 'Database error: ' . $e->getMessage());
}
