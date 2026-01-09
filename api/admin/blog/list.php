<?php
/**
 * Get Blog Posts List (Admin)
 * GET: api/admin/blog/list.php?page=1&limit=20&status=published
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
$category = isset($_GET['category']) ? sanitizeInput($_GET['category']) : null;
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
    $where[] = "bp.status = :status";
    $params[':status'] = $status;
}

if ($category) {
    $where[] = "bp.category = :category";
    $params[':category'] = $category;
}

if ($search) {
    $where[] = "(bp.title LIKE :search OR bp.content LIKE :search)";
    $params[':search'] = '%' . $search . '%';
}

$whereClause = !empty($where) ? "WHERE " . implode(' AND ', $where) : "";

// Count total
$countQuery = "SELECT COUNT(*) as total FROM blog_posts bp {$whereClause}";
$countStmt = $db->prepare($countQuery);
foreach ($params as $key => $value) {
    $countStmt->bindValue($key, $value);
}
$countStmt->execute();
$total = $countStmt->fetch()['total'];

// Get blog posts
$query = "SELECT bp.*, u.full_name as author_name 
          FROM blog_posts bp
          LEFT JOIN users u ON bp.author_id = u.id
          {$whereClause}
          ORDER BY bp.created_at DESC
          LIMIT :limit OFFSET :offset";

$stmt = $db->prepare($query);
foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
$stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
$stmt->execute();

$posts = $stmt->fetchAll();

// Format posts
foreach ($posts as &$post) {
    $post['id'] = (int)$post['id'];
    $post['author_id'] = (int)$post['author_id'];
    $post['views'] = (int)$post['views'];
    $post['image_url'] = $post['image'] ? BLOG_UPLOAD_URL . $post['image'] : null;
}

sendJsonResponse(true, 'Lấy danh sách bài viết thành công', [
    'posts' => $posts,
    'pagination' => buildPagination($page, $limit, $total)
]);
