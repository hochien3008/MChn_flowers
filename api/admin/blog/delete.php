<?php
/**
 * Delete Blog Post (Admin)
 * POST: api/admin/blog/delete.php
 * Body: { id }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

// Require admin access
requireAdmin();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method not allowed', null, 405);
}

$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
if ($id <= 0) {
    sendJsonResponse(false, 'ID bài viết là bắt buộc');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Get image before delete
$selectQuery = "SELECT image FROM blog_posts WHERE id = :id LIMIT 1";
$selectStmt = $db->prepare($selectQuery);
$selectStmt->bindParam(':id', $id, PDO::PARAM_INT);
$selectStmt->execute();
$post = $selectStmt->fetch();

if (!$post) {
    sendJsonResponse(false, 'Không tìm thấy bài viết');
}

$deleteQuery = "DELETE FROM blog_posts WHERE id = :id";
$deleteStmt = $db->prepare($deleteQuery);
$deleteStmt->bindParam(':id', $id, PDO::PARAM_INT);

if ($deleteStmt->execute()) {
    if (!empty($post['image'])) {
        deleteFile(BLOG_UPLOAD_PATH . $post['image']);
    }
    sendJsonResponse(true, 'Xóa bài viết thành công');
}

sendJsonResponse(false, 'Xóa bài viết thất bại');
