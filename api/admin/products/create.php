<?php
/**
 * Create Product (Admin)
 * POST: api/admin/products/create.php
 * Body: multipart/form-data with product data and image
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

// Get form data
$name = isset($_POST['name']) ? sanitizeInput($_POST['name']) : null;
$slug = isset($_POST['slug']) ? sanitizeInput($_POST['slug']) : null;
$description = isset($_POST['description']) ? sanitizeInput($_POST['description']) : null;
$short_description = isset($_POST['short_description']) ? sanitizeInput($_POST['short_description']) : null;
$price = isset($_POST['price']) ? (float)$_POST['price'] : null;
$sale_price = isset($_POST['sale_price']) ? (float)$_POST['sale_price'] : null;
$category_id = isset($_POST['category_id']) ? (int)$_POST['category_id'] : null;
$stock = isset($_POST['stock']) ? (int)$_POST['stock'] : 0;
$sku = isset($_POST['sku']) ? sanitizeInput($_POST['sku']) : null;
$weight = isset($_POST['weight']) ? (float)$_POST['weight'] : null;
$dimensions = isset($_POST['dimensions']) ? sanitizeInput($_POST['dimensions']) : null;
$status = isset($_POST['status']) ? sanitizeInput($_POST['status']) : 'active';
$featured = isset($_POST['featured']) ? (bool)$_POST['featured'] : false;

// Validate required fields
if (!$name || !$price || !$category_id) {
    sendJsonResponse(false, 'Tên, giá và danh mục là bắt buộc');
}

// Auto-generate slug if not provided
if (!$slug) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', 
        iconv('UTF-8', 'ASCII//TRANSLIT', $name))));
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Check if slug already exists
$checkQuery = "SELECT id FROM products WHERE slug = :slug LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(':slug', $slug, PDO::PARAM_STR);
$checkStmt->execute();
if ($checkStmt->fetch()) {
    $slug = $slug . '-' . time();
}

// Handle image upload
$image = null;
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $uploadResult = uploadFile($_FILES['image'], UPLOAD_PATH);
    if ($uploadResult['success']) {
        $image = $uploadResult['filename'];
    } else {
        sendJsonResponse(false, $uploadResult['message']);
    }
}

// Insert product
$query = "INSERT INTO products 
          (name, slug, description, short_description, price, sale_price, 
           category_id, image, stock, sku, weight, dimensions, status, featured)
          VALUES 
          (:name, :slug, :description, :short_description, :price, :sale_price,
           :category_id, :image, :stock, :sku, :weight, :dimensions, :status, :featured)";

$stmt = $db->prepare($query);
$stmt->bindParam(':name', $name, PDO::PARAM_STR);
$stmt->bindParam(':slug', $slug, PDO::PARAM_STR);
$stmt->bindValue(':description', $description, PDO::PARAM_STR);
$stmt->bindValue(':short_description', $short_description, PDO::PARAM_STR);
$stmt->bindParam(':price', $price, PDO::PARAM_STR);
$stmt->bindValue(':sale_price', $sale_price, PDO::PARAM_STR);
$stmt->bindParam(':category_id', $category_id, PDO::PARAM_INT);
$stmt->bindValue(':image', $image, PDO::PARAM_STR);
$stmt->bindParam(':stock', $stock, PDO::PARAM_INT);
$stmt->bindValue(':sku', $sku, PDO::PARAM_STR);
$stmt->bindValue(':weight', $weight, PDO::PARAM_STR);
$stmt->bindValue(':dimensions', $dimensions, PDO::PARAM_STR);
$stmt->bindParam(':status', $status, PDO::PARAM_STR);
$stmt->bindValue(':featured', $featured, PDO::PARAM_INT);

if ($stmt->execute()) {
    $product_id = $db->lastInsertId();
    
    sendJsonResponse(true, 'Tạo sản phẩm thành công', [
        'product_id' => $product_id,
        'slug' => $slug
    ]);
} else {
    sendJsonResponse(false, 'Tạo sản phẩm thất bại');
}

