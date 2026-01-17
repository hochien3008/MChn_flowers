<?php
/**
 * Get Cart
 * GET: api/cart/get.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Get user ID or session ID
$user_id = getCurrentUserId();
$session_id = getSessionId();

// Database connection
$database = new Database();
$db = $database->getConnection();

// Build WHERE clause
if ($user_id) {
    $where = "c.user_id = :user_id";
    $param = [':user_id' => $user_id];
} else {
    $where = "c.session_id = :session_id AND c.user_id IS NULL";
    $param = [':session_id' => $session_id];
}

// Get cart items
$query = "SELECT c.id, c.product_id, c.quantity,
                 p.name, p.slug, p.price, p.sale_price, p.image, p.stock
          FROM cart c
          LEFT JOIN products p ON c.product_id = p.id
          WHERE {$where} AND p.status = 'active'
          ORDER BY c.created_at DESC";

$stmt = $db->prepare($query);
foreach ($param as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->execute();

$items = $stmt->fetchAll();

$total = 0;
$total_quantity = 0;
$cart = [];

foreach ($items as $item) {
    $final_price = $item['sale_price'] ? (float)$item['sale_price'] : (float)$item['price'];
    $quantity = (int)$item['quantity'];
    $subtotal = $final_price * $quantity;
    
    $total += $subtotal;
    $total_quantity += $quantity;

    $cart[] = [
        'id' => (int)$item['id'],
        'product_id' => (int)$item['product_id'],
        'product_name' => $item['name'],
        'product_slug' => $item['slug'],
        'quantity' => $quantity,
        'price' => (float)$item['price'],
        'sale_price' => $item['sale_price'] ? (float)$item['sale_price'] : null,
        'final_price' => $final_price,
        'subtotal' => $subtotal,
        'stock' => (int)$item['stock'],
        'image_url' => $item['image'] ? APP_URL . '/api/uploads/products/' . $item['image'] : null
    ];
}

sendJsonResponse(true, 'Lấy giỏ hàng thành công', [
    'items' => $cart,
    'total' => $total,
    'total_quantity' => $total_quantity,
    'item_count' => count($cart) // Keep for backward compatibility
]);

