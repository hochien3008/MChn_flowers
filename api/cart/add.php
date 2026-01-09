<?php
/**
 * Add to Cart
 * POST: api/cart/add.php
 * Body: { product_id, quantity }
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

if (!isset($input['product_id']) || !isset($input['quantity'])) {
    sendJsonResponse(false, 'Product ID và số lượng là bắt buộc');
}

$product_id = (int)$input['product_id'];
$quantity = (int)$input['quantity'];

if ($quantity < 1) {
    sendJsonResponse(false, 'Số lượng phải lớn hơn 0');
}

// Get user ID or session ID
$user_id = getCurrentUserId();
$session_id = getSessionId();

// Database connection
$database = new Database();
$db = $database->getConnection();

// Check if product exists and is active
$productQuery = "SELECT id, name, price, sale_price, stock FROM products WHERE id = :id AND status = 'active'";
$productStmt = $db->prepare($productQuery);
$productStmt->bindParam(':id', $product_id, PDO::PARAM_INT);
$productStmt->execute();
$product = $productStmt->fetch();

if (!$product) {
    sendJsonResponse(false, 'Sản phẩm không tồn tại hoặc đã ngừng bán');
}

// Check stock
if ($product['stock'] < $quantity) {
    sendJsonResponse(false, 'Số lượng sản phẩm không đủ. Còn lại: ' . $product['stock']);
}

// Check if item already in cart
if ($user_id) {
    $checkQuery = "SELECT id, quantity FROM cart WHERE user_id = :user_id AND product_id = :product_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $checkStmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
    $checkStmt->execute();
    $existing = $checkStmt->fetch();
} else {
    $checkQuery = "SELECT id, quantity FROM cart WHERE session_id = :session_id AND user_id IS NULL AND product_id = :product_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':session_id', $session_id, PDO::PARAM_STR);
    $checkStmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
    $checkStmt->execute();
    $existing = $checkStmt->fetch();
}

if ($existing) {
    // Update quantity
    $new_quantity = (int)$existing['quantity'] + $quantity;
    
    // Check stock again
    if ($product['stock'] < $new_quantity) {
        sendJsonResponse(false, 'Số lượng sản phẩm không đủ. Còn lại: ' . $product['stock']);
    }
    
    $updateQuery = "UPDATE cart SET quantity = :quantity WHERE id = :id";
    $updateStmt = $db->prepare($updateQuery);
    $updateStmt->bindParam(':quantity', $new_quantity, PDO::PARAM_INT);
    $updateStmt->bindParam(':id', $existing['id'], PDO::PARAM_INT);
    $updateStmt->execute();
    
    sendJsonResponse(true, 'Cập nhật giỏ hàng thành công', ['quantity' => $new_quantity]);
} else {
    // Add new item
    $insertQuery = "INSERT INTO cart (user_id, session_id, product_id, quantity) 
                    VALUES (:user_id, :session_id, :product_id, :quantity)";
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $insertStmt->bindParam(':session_id', $session_id, PDO::PARAM_STR);
    $insertStmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
    $insertStmt->bindParam(':quantity', $quantity, PDO::PARAM_INT);
    
    if ($insertStmt->execute()) {
        sendJsonResponse(true, 'Thêm vào giỏ hàng thành công', ['quantity' => $quantity]);
    } else {
        sendJsonResponse(false, 'Thêm vào giỏ hàng thất bại');
    }
}

