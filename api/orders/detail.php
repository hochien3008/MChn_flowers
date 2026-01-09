<?php
/**
 * Get Order Detail
 * GET: api/orders/detail.php?id=1 hoặc ?order_number=DH202412011234
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

requireAuth(); // Require login

// Get order ID or order number
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
$order_number = isset($_GET['order_number']) ? sanitizeInput($_GET['order_number']) : null;

if (!$id && !$order_number) {
    sendJsonResponse(false, 'ID hoặc mã đơn hàng là bắt buộc');
}

// Get user ID
$user_id = getCurrentUserId();
$is_admin = isAdmin();

// Database connection
$database = new Database();
$db = $database->getConnection();

// Build WHERE clause
if ($id) {
    $where = "o.id = :id";
    $param = [':id' => $id];
} else {
    $where = "o.order_number = :order_number";
    $param = [':order_number' => $order_number];
}

// Get order
$query = "SELECT o.* FROM orders o WHERE {$where} LIMIT 1";
$stmt = $db->prepare($query);
foreach ($param as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->execute();

$order = $stmt->fetch();

if (!$order) {
    sendJsonResponse(false, 'Không tìm thấy đơn hàng');
}

// Check permission (user can only see their own orders, admin can see all)
if (!$is_admin && $order['user_id'] != $user_id) {
    sendJsonResponse(false, 'Không có quyền truy cập đơn hàng này', null, 403);
}

// Get order items
$itemsQuery = "SELECT oi.*, p.name as product_name, p.image, p.slug 
               FROM order_items oi
               LEFT JOIN products p ON oi.product_id = p.id
               WHERE oi.order_id = :order_id
               ORDER BY oi.id ASC";
$itemsStmt = $db->prepare($itemsQuery);
$itemsStmt->bindParam(':order_id', $order['id'], PDO::PARAM_INT);
$itemsStmt->execute();
$items = $itemsStmt->fetchAll();

// Format order
$order['id'] = (int)$order['id'];
$order['user_id'] = $order['user_id'] ? (int)$order['user_id'] : null;
$order['subtotal'] = (float)$order['subtotal'];
$order['discount'] = (float)$order['discount'];
$order['shipping_fee'] = (float)$order['shipping_fee'];
$order['total'] = (float)$order['total'];

// Count items
$order['items_count'] = count($items);

// Format items
foreach ($items as &$item) {
    $item['id'] = (int)$item['id'];
    $item['order_id'] = (int)$item['order_id'];
    $item['product_id'] = (int)$item['product_id'];
    $item['quantity'] = (int)$item['quantity'];
    $item['product_price'] = (float)$item['product_price'];
    $item['subtotal'] = (float)$item['subtotal'];
    $item['product_name'] = $item['product_name'] ?? 'Sản phẩm đã xóa';
    $item['image_url'] = $item['image'] ? APP_URL . '/api/uploads/products/' . $item['image'] : null;
}

$order['items'] = $items;

sendJsonResponse(true, 'Lấy chi tiết đơn hàng thành công', ['order' => $order]);

