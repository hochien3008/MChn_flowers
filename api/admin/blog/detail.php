<?php
/**
 * Get Blog Post Detail (Admin)
 * GET: api/admin/blog/detail.php?id=1
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

// Require admin access
requireAdmin();

// Only allow GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJsonResponse(false, 'Method not allowed', null, 405);
}

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    sendJsonResponse(false, 'ID bài viết là bắt buộc');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

$query = "SELECT bp.*, u.full_name as author_name
          FROM blog_posts bp
          LEFT JOIN users u ON bp.author_id = u.id
          WHERE bp.id = :id
          LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $id, PDO::PARAM_INT);
$stmt->execute();
$post = $stmt->fetch();

if (!$post) {
    sendJsonResponse(false, 'Không tìm thấy bài viết');
}

$post['id'] = (int)$post['id'];
$post['author_id'] = (int)$post['author_id'];
$post['views'] = (int)$post['views'];
$post['image_url'] = $post['image'] ? BLOG_UPLOAD_URL . $post['image'] : null;

sendJsonResponse(true, 'Lấy chi tiết bài viết thành công', ['post' => $post]);
