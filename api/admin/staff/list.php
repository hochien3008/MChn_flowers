<?php
/**
 * Get Staff List (Admin)
 * GET: api/admin/staff/list.php?page=1&limit=20
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
$search = isset($_GET['search']) ? sanitizeInput($_GET['search']) : null;

$page = max(1, $page);
$limit = max(1, min(50, $limit));
$offset = getPaginationOffset($page, $limit);

// Database connection
$database = new Database();
$db = $database->getConnection();

// Build WHERE clause
$where = ["role = 'staff'"];
$params = [];

if ($search) {
    $where[] = "(full_name LIKE :search OR email LIKE :search OR phone LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

$whereClause = "WHERE " . implode(' AND ', $where);

// Count total
$countQuery = "SELECT COUNT(*) as total FROM users {$whereClause}";
$countStmt = $db->prepare($countQuery);
foreach ($params as $key => $value) {
    $countStmt->bindValue($key, $value);
}
$countStmt->execute();
$total = $countStmt->fetch()['total'];

// Get staff
$query = "SELECT id, email, full_name, phone, status, created_at 
          FROM users 
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

$staff = $stmt->fetchAll();

// Format staff
foreach ($staff as &$member) {
    $member['id'] = (int)$member['id'];
}

sendJsonResponse(true, 'Lấy danh sách nhân viên thành công', [
    'staff' => $staff,
    'pagination' => buildPagination($page, $limit, $total)
]);

