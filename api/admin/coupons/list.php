<?php
/**
 * Get Coupons List (Admin)
 * GET: api/admin/coupons/list.php?page=1&limit=20&status=active
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
$status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : null;
$type = isset($_GET['type']) ? sanitizeInput($_GET['type']) : null;
$search = isset($_GET['search']) ? sanitizeInput($_GET['search']) : null;

$page = max(1, $page);
$limit = max(1, min(50, $limit));
$offset = getPaginationOffset($page, $limit);

// Database connection
$database = new Database();
$db = $database->getConnection();

// Build WHERE clause
$where = [];
$params = [];

if ($status) {
    $where[] = "status = :status";
    $params[':status'] = $status;
}

if ($type) {
    $where[] = "discount_type = :type";
    $params[':type'] = $type;
}

if ($search) {
    $where[] = "(code LIKE :search_code OR name LIKE :search_name)";
    $params[':search_code'] = '%' . $search . '%';
    $params[':search_name'] = '%' . $search . '%';
}

// Check for expired coupons
if ($status === 'expired') {
    $where[] = "valid_until < NOW()";
} elseif ($status === 'used-up') {
    $where[] = "used_count >= usage_limit AND usage_limit IS NOT NULL";
}

$whereClause = !empty($where) ? "WHERE " . implode(' AND ', $where) : "";

// Count total
$countQuery = "SELECT COUNT(*) as total FROM coupons {$whereClause}";
$countStmt = $db->prepare($countQuery);
foreach ($params as $key => $value) {
    $countStmt->bindValue($key, $value);
}
$countStmt->execute();
$total = $countStmt->fetch()['total'];

// Get coupons
$query = "SELECT * FROM coupons 
          {$whereClause}
          ORDER BY created_at DESC
          LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($query);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$coupons = $stmt->fetchAll();

// Format coupons
foreach ($coupons as &$coupon) {
    $coupon['id'] = (int)$coupon['id'];
    $coupon['discount_value'] = (float)$coupon['discount_value'];
    $coupon['min_order'] = (float)$coupon['min_order'];
    $coupon['max_discount'] = $coupon['max_discount'] ? (float)$coupon['max_discount'] : null;
    $coupon['usage_limit'] = $coupon['usage_limit'] ? (int)$coupon['usage_limit'] : null;
    $coupon['used_count'] = (int)$coupon['used_count'];
    $coupon['remaining'] = $coupon['usage_limit'] ? $coupon['usage_limit'] - $coupon['used_count'] : null;
    
    // Determine status
    if ($coupon['status'] === 'expired' || ($coupon['valid_until'] && strtotime($coupon['valid_until']) < time())) {
        $coupon['status'] = 'expired';
    } elseif ($coupon['usage_limit'] && $coupon['used_count'] >= $coupon['usage_limit']) {
        $coupon['status'] = 'used-up';
    }
}

sendJsonResponse(true, 'Lấy danh sách mã giảm giá thành công', [
    'coupons' => $coupons,
    'pagination' => buildPagination($page, $limit, $total)
]);

