<?php
/**
 * Update Cart Item
 * POST: api/cart/update.php
 * Body: { cart_id, quantity }
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

if (!isset($input['cart_id']) || !isset($input['quantity'])) {
    sendJsonResponse(false, 'Cart ID và số lượng là bắt buộc');
}

$cart_id = (int)$input['cart_id'];
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

// Build WHERE clause
if ($user_id) {
    $where = "c.id = :cart_id AND c.user_id = :user_id";
    $param = [':cart_id' => $cart_id, ':user_id' => $user_id];
} else {
    $where = "c.id = :cart_id AND c.session_id = :session_id AND c.user_id IS NULL";
    $param = [':cart_id' => $cart_id, ':session_id' => $session_id];
}

// Check if cart item exists and get product info
$checkQuery = "SELECT c.*, p.stock FROM cart c 
               LEFT JOIN products p ON c.product_id = p.id 
               WHERE {$where}";
$checkStmt = $db->prepare($checkQuery);
foreach ($param as $key => $value) {
    $checkStmt->bindValue($key, $value);
}
$checkStmt->execute();
$cart_item = $checkStmt->fetch();

if (!$cart_item) {
    sendJsonResponse(false, 'Không tìm thấy sản phẩm trong giỏ hàng');
}

// Check stock
if ($cart_item['stock'] < $quantity) {
    sendJsonResponse(false, 'Số lượng sản phẩm không đủ. Còn lại: ' . $cart_item['stock']);
}

// Update quantity
$updateQuery = "UPDATE cart SET quantity = :quantity WHERE id = :cart_id";
$updateStmt = $db->prepare($updateQuery);
$updateStmt->bindParam(':quantity', $quantity, PDO::PARAM_INT);
$updateStmt->bindParam(':cart_id', $cart_id, PDO::PARAM_INT);

if ($updateStmt->execute()) {
    sendJsonResponse(true, 'Cập nhật giỏ hàng thành công', ['quantity' => $quantity]);
} else {
    sendJsonResponse(false, 'Cập nhật giỏ hàng thất bại');
}

