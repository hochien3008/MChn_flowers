<?php
/**
 * Remove from Cart
 * POST: api/cart/remove.php
 * Body: { cart_id }
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

if (!isset($input['cart_id'])) {
    sendJsonResponse(false, 'Cart ID là bắt buộc');
}

$cart_id = (int)$input['cart_id'];

// Get user ID or session ID
$user_id = getCurrentUserId();
$session_id = getSessionId();

// Database connection
$database = new Database();
$db = $database->getConnection();

// Build WHERE clause
if ($user_id) {
    $where = "id = :cart_id AND user_id = :user_id";
    $param = [':cart_id' => $cart_id, ':user_id' => $user_id];
} else {
    $where = "id = :cart_id AND session_id = :session_id AND user_id IS NULL";
    $param = [':cart_id' => $cart_id, ':session_id' => $session_id];
}

// Delete cart item
$deleteQuery = "DELETE FROM cart WHERE {$where}";
$deleteStmt = $db->prepare($deleteQuery);
foreach ($param as $key => $value) {
    $deleteStmt->bindValue($key, $value);
}

if ($deleteStmt->execute()) {
    sendJsonResponse(true, 'Xóa khỏi giỏ hàng thành công');
} else {
    sendJsonResponse(false, 'Xóa khỏi giỏ hàng thất bại');
}

