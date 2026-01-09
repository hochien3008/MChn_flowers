<?php
/**
 * Update Blog Post (Admin)
 * POST: api/admin/blog/update.php
 * Body: multipart/form-data with id
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

$title = isset($_POST['title']) ? sanitizeInput($_POST['title']) : null;
$slug = isset($_POST['slug']) ? sanitizeInput($_POST['slug']) : null;
$category = isset($_POST['category']) ? sanitizeInput($_POST['category']) : null;
$status = isset($_POST['status']) ? sanitizeInput($_POST['status']) : 'draft';
$excerpt = isset($_POST['excerpt']) ? sanitizeInput($_POST['excerpt']) : null;
$content = isset($_POST['content']) ? sanitizeInput($_POST['content']) : null;
$removeImage = isset($_POST['remove_image']) && $_POST['remove_image'] === '1';

if (!$title || !$content) {
    sendJsonResponse(false, 'Tiêu đề và nội dung là bắt buộc');
}

if (!$category) {
    sendJsonResponse(false, 'Danh mục là bắt buộc');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Get existing post
$existingQuery = "SELECT id, slug, image FROM blog_posts WHERE id = :id LIMIT 1";
$existingStmt = $db->prepare($existingQuery);
$existingStmt->bindParam(':id', $id, PDO::PARAM_INT);
$existingStmt->execute();
$existingPost = $existingStmt->fetch();

if (!$existingPost) {
    sendJsonResponse(false, 'Không tìm thấy bài viết');
}

if (!$slug) {
    $slug = $existingPost['slug'];
}

// Ensure slug unique if changed
if ($slug !== $existingPost['slug']) {
    $checkQuery = "SELECT id FROM blog_posts WHERE slug = :slug AND id != :id LIMIT 1";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(':slug', $slug, PDO::PARAM_STR);
    $checkStmt->bindParam(':id', $id, PDO::PARAM_INT);
    $checkStmt->execute();
    if ($checkStmt->fetch()) {
        $slug = $slug . '-' . time();
    }
}

// Handle image upload/removal
$image = $existingPost['image'];
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $uploadResult = uploadFile($_FILES['image'], BLOG_UPLOAD_PATH);
    if ($uploadResult['success']) {
        if ($image) {
            deleteFile(BLOG_UPLOAD_PATH . $image);
        }
        $image = $uploadResult['filename'];
    } else {
        sendJsonResponse(false, $uploadResult['message']);
    }
} elseif ($removeImage && $image) {
    deleteFile(BLOG_UPLOAD_PATH . $image);
    $image = null;
}

$query = "UPDATE blog_posts
          SET title = :title,
              slug = :slug,
              category = :category,
              content = :content,
              excerpt = :excerpt,
              image = :image,
              status = :status
          WHERE id = :id";

$stmt = $db->prepare($query);
$stmt->bindParam(':title', $title, PDO::PARAM_STR);
$stmt->bindParam(':slug', $slug, PDO::PARAM_STR);
$stmt->bindParam(':category', $category, PDO::PARAM_STR);
$stmt->bindParam(':content', $content, PDO::PARAM_STR);
$stmt->bindValue(':excerpt', $excerpt, PDO::PARAM_STR);
$stmt->bindValue(':image', $image, PDO::PARAM_STR);
$stmt->bindParam(':status', $status, PDO::PARAM_STR);
$stmt->bindParam(':id', $id, PDO::PARAM_INT);

if ($stmt->execute()) {
    sendJsonResponse(true, 'Cập nhật bài viết thành công', ['slug' => $slug]);
}

sendJsonResponse(false, 'Cập nhật bài viết thất bại');
