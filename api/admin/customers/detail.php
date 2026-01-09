<?php
/**
 * Get Customer Detail (Admin)
 * GET: api/admin/customers/detail.php?id=1
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

// Require admin access
requireAdmin();

$customer_id = isset($_GET['id']) ? (int)$_GET['id'] : null;

if (!$customer_id) {
    sendJsonResponse(false, 'ID khách hàng là bắt buộc');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Get customer
$query = "SELECT id, email, full_name, phone, status, created_at 
          FROM users 
          WHERE id = :id AND role = 'user'
          LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $customer_id, PDO::PARAM_INT);
$stmt->execute();

$customer = $stmt->fetch();

if (!$customer) {
    sendJsonResponse(false, 'Không tìm thấy khách hàng');
}

// Get customer stats
$statsQuery = "SELECT 
                 COUNT(*) as total_orders,
                 COALESCE(SUM(CASE WHEN status = 'delivered' THEN total ELSE 0 END), 0) as total_spent,
                 COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0) as completed_orders,
                 COALESCE(AVG(CASE WHEN status = 'delivered' THEN total ELSE NULL END), 0) as avg_order_value,
                 COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
                 COUNT(CASE WHEN status IN ('confirmed', 'processing', 'shipping') THEN 1 END) as processing_orders
               FROM orders
               WHERE user_id = :user_id";
$statsStmt = $db->prepare($statsQuery);
$statsStmt->bindParam(':user_id', $customer_id, PDO::PARAM_INT);
$statsStmt->execute();
$stats = $statsStmt->fetch();

// Get recent orders
$ordersQuery = "SELECT id, order_number, total, status, created_at
                FROM orders
                WHERE user_id = :user_id
                ORDER BY created_at DESC
                LIMIT 10";
$ordersStmt = $db->prepare($ordersQuery);
$ordersStmt->bindParam(':user_id', $customer_id, PDO::PARAM_INT);
$ordersStmt->execute();
$orders = $ordersStmt->fetchAll();

// Format customer
$customer['id'] = (int)$customer['id'];
$customer['total_orders'] = (int)$stats['total_orders'];
$customer['total_spent'] = (float)$stats['total_spent'];
$customer['completed_orders'] = (int)$stats['completed_orders'];
$customer['avg_order_value'] = (float)$stats['avg_order_value'];
$customer['pending_orders'] = (int)$stats['pending_orders'];
$customer['processing_orders'] = (int)$stats['processing_orders'];
$customer['points'] = (int)($stats['total_spent'] / 1000); // 1 point per 1000 VND
$customer['completion_rate'] = $stats['total_orders'] > 0 
    ? round(($stats['completed_orders'] / $stats['total_orders']) * 100, 1) 
    : 0;

// Format orders
foreach ($orders as &$order) {
    $order['id'] = (int)$order['id'];
    $order['total'] = (float)$order['total'];
}

$customer['orders'] = $orders;

sendJsonResponse(true, 'Lấy chi tiết khách hàng thành công', ['customer' => $customer]);

