<?php
/**
 * Get Orders List
 * GET: api/orders/list.php?page=1&limit=20&status=pending
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

requireAuth(); // Require login

// Get query parameters
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : ORDERS_PER_PAGE;
$status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : null;

$page = max(1, $page);
$limit = max(1, min(50, $limit));
$offset = getPaginationOffset($page, $limit);

// Get user ID
$user_id = getCurrentUserId();
$is_admin = isAdmin();

// Database connection
$database = new Database();
$db = $database->getConnection();

// Build WHERE clause
$where = [];
$params = [];

if ($is_admin) {
    // Admin can see all orders
    if ($status) {
        $where[] = "o.status = :status";
        $params[':status'] = $status;
    }
} else {
    // Regular users can only see their own orders
    $where[] = "o.user_id = :user_id";
    $params[':user_id'] = $user_id;
    
    if ($status) {
        $where[] = "o.status = :status";
        $params[':status'] = $status;
    }
}

$whereClause = !empty($where) ? "WHERE " . implode(' AND ', $where) : "";

// Count total
$countQuery = "SELECT COUNT(*) as total FROM orders o {$whereClause}";
$countStmt = $db->prepare($countQuery);
foreach ($params as $key => $value) {
    $countStmt->bindValue($key, $value);
}
$countStmt->execute();
$total = $countStmt->fetch()['total'];

// Get orders
$query = "SELECT o.id, o.order_number, o.user_id, o.guest_name, o.guest_phone,
                 o.subtotal, o.discount, o.shipping_fee, o.total,
                 o.payment_method, o.payment_status, o.status,
                 o.shipping_name, o.shipping_phone, o.shipping_address,
                 o.created_at, o.updated_at
          FROM orders o
          {$whereClause}
          ORDER BY o.created_at DESC
          LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($query);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$orders = $stmt->fetchAll();

// Format orders
foreach ($orders as &$order) {
    $order['id'] = (int)$order['id'];
    $order['user_id'] = $order['user_id'] ? (int)$order['user_id'] : null;
    $order['subtotal'] = (float)$order['subtotal'];
    $order['discount'] = (float)$order['discount'];
    $order['shipping_fee'] = (float)$order['shipping_fee'];
    $order['total'] = (float)$order['total'];
}

sendJsonResponse(true, 'Lấy danh sách đơn hàng thành công', [
    'orders' => $orders,
    'pagination' => buildPagination($page, $limit, $total)
]);

