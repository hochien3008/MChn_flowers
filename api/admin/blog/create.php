<?php
/**
 * Create Blog Post (Admin)
 * POST: api/admin/blog/create.php
 * Body: multipart/form-data
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

$title = isset($_POST['title']) ? sanitizeInput($_POST['title']) : null;
$slug = isset($_POST['slug']) ? sanitizeInput($_POST['slug']) : null;
$category = isset($_POST['category']) ? sanitizeInput($_POST['category']) : null;
$status = isset($_POST['status']) ? sanitizeInput($_POST['status']) : 'draft';
$excerpt = isset($_POST['excerpt']) ? sanitizeInput($_POST['excerpt']) : null;
$content = isset($_POST['content']) ? sanitizeInput($_POST['content']) : null;

if (!$title || !$content) {
    sendJsonResponse(false, 'Tiêu đề và nội dung là bắt buộc');
}

if (!$category) {
    sendJsonResponse(false, 'Danh mục là bắt buộc');
}

// Auto-generate slug if not provided
if (!$slug) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-',
        iconv('UTF-8', 'ASCII//TRANSLIT', $title))));
}

$authorId = isset($_SESSION['user_id']) ? (int)$_SESSION['user_id'] : null;
if (!$authorId) {
    sendJsonResponse(false, 'Không tìm thấy thông tin người dùng');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Ensure slug unique
$checkQuery = "SELECT id FROM blog_posts WHERE slug = :slug LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(':slug', $slug, PDO::PARAM_STR);
$checkStmt->execute();
if ($checkStmt->fetch()) {
    $slug = $slug . '-' . time();
}

// Handle image upload
$image = null;
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $uploadResult = uploadFile($_FILES['image'], BLOG_UPLOAD_PATH);
    if ($uploadResult['success']) {
        $image = $uploadResult['filename'];
    } else {
        sendJsonResponse(false, $uploadResult['message']);
    }
}

$query = "INSERT INTO blog_posts
          (title, slug, category, content, excerpt, image, author_id, status)
          VALUES
          (:title, :slug, :category, :content, :excerpt, :image, :author_id, :status)";

$stmt = $db->prepare($query);
$stmt->bindParam(':title', $title, PDO::PARAM_STR);
$stmt->bindParam(':slug', $slug, PDO::PARAM_STR);
$stmt->bindParam(':category', $category, PDO::PARAM_STR);
$stmt->bindParam(':content', $content, PDO::PARAM_STR);
$stmt->bindValue(':excerpt', $excerpt, PDO::PARAM_STR);
$stmt->bindValue(':image', $image, PDO::PARAM_STR);
$stmt->bindParam(':author_id', $authorId, PDO::PARAM_INT);
$stmt->bindParam(':status', $status, PDO::PARAM_STR);

if ($stmt->execute()) {
    $postId = $db->lastInsertId();
    sendJsonResponse(true, 'Tạo bài viết thành công', [
        'post_id' => $postId,
        'slug' => $slug
    ]);
}

sendJsonResponse(false, 'Tạo bài viết thất bại');
