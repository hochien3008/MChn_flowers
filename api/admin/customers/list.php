<?php
/**
 * Get Customers List (Admin)
 * GET: api/admin/customers/list.php?page=1&limit=20&sort=newest
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

// Require admin access
requireAdmin();

// Get query parameters
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
$sort = isset($_GET['sort']) ? sanitizeInput($_GET['sort']) : 'newest';
$search = isset($_GET['search']) ? sanitizeInput($_GET['search']) : null;

$page = max(1, $page);
$limit = max(1, min(50, $limit));
$offset = getPaginationOffset($page, $limit);

// Database connection
$database = new Database();
$db = $database->getConnection();

// Build WHERE clause
$where = ["role = 'user'"]; // Only regular users, not admins
$params = [];

if ($search) {
    $where[] = "(full_name LIKE :search OR email LIKE :search OR phone LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

$whereClause = !empty($where) ? "WHERE " . implode(' AND ', $where) : "";

// Build ORDER BY clause
$orderBy = "created_at DESC";
switch ($sort) {
    case 'orders':
        $orderBy = "total_orders DESC";
        break;
    case 'spent':
        $orderBy = "total_spent DESC";
        break;
    case 'oldest':
        $orderBy = "created_at ASC";
        break;
    default:
        $orderBy = "created_at DESC";
}

// Count total
$countQuery = "SELECT COUNT(*) as total FROM users {$whereClause}";
$countStmt = $db->prepare($countQuery);
foreach ($params as $key => $value) {
    $countStmt->bindValue($key, $value);
}
$countStmt->execute();
$total = $countStmt->fetch()['total'];

// Get customers with stats
$query = "SELECT u.id, u.email, u.full_name, u.phone, u.status, u.created_at,
                 COUNT(DISTINCT o.id) as total_orders,
                 COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total ELSE 0 END), 0) as total_spent,
                 COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END), 0) as completed_orders
          FROM users u
          LEFT JOIN orders o ON u.id = o.user_id
          {$whereClause}
          GROUP BY u.id
          ORDER BY {$orderBy}
          LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($query);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$customers = $stmt->fetchAll();

// Format customers
foreach ($customers as &$customer) {
    $customer['id'] = (int)$customer['id'];
    $customer['total_orders'] = (int)$customer['total_orders'];
    $customer['total_spent'] = (float)$customer['total_spent'];
    $customer['completed_orders'] = (int)$customer['completed_orders'];
    $customer['points'] = (int)($customer['total_spent'] / 1000); // 1 point per 1000 VND
}

sendJsonResponse(true, 'Lấy danh sách khách hàng thành công', [
    'customers' => $customers,
    'pagination' => buildPagination($page, $limit, $total)
]);

