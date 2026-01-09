<?php
/**
 * Update Product (Admin)
 * POST: api/admin/products/update.php
 * Body: multipart/form-data with product data and optional image
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

// Get product ID
$product_id = isset($_POST['id']) ? (int)$_POST['id'] : null;

if (!$product_id) {
    sendJsonResponse(false, 'ID sản phẩm là bắt buộc');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Check if product exists
$checkQuery = "SELECT * FROM products WHERE id = :id LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(':id', $product_id, PDO::PARAM_INT);
$checkStmt->execute();
$existingProduct = $checkStmt->fetch();

if (!$existingProduct) {
    sendJsonResponse(false, 'Không tìm thấy sản phẩm');
}

// Get form data (use existing values if not provided)
$name = isset($_POST['name']) ? sanitizeInput($_POST['name']) : $existingProduct['name'];
$slug = isset($_POST['slug']) ? sanitizeInput($_POST['slug']) : $existingProduct['slug'];
$description = isset($_POST['description']) ? sanitizeInput($_POST['description']) : $existingProduct['description'];
$short_description = isset($_POST['short_description']) ? sanitizeInput($_POST['short_description']) : $existingProduct['short_description'];
$price = isset($_POST['price']) ? (float)$_POST['price'] : $existingProduct['price'];
$sale_price = isset($_POST['sale_price']) ? (float)$_POST['sale_price'] : $existingProduct['sale_price'];
$category_id = isset($_POST['category_id']) ? (int)$_POST['category_id'] : $existingProduct['category_id'];
$stock = isset($_POST['stock']) ? (int)$_POST['stock'] : $existingProduct['stock'];
$sku = isset($_POST['sku']) ? sanitizeInput($_POST['sku']) : $existingProduct['sku'];
$weight = isset($_POST['weight']) ? (float)$_POST['weight'] : $existingProduct['weight'];
$dimensions = isset($_POST['dimensions']) ? sanitizeInput($_POST['dimensions']) : $existingProduct['dimensions'];
$status = isset($_POST['status']) ? sanitizeInput($_POST['status']) : $existingProduct['status'];
$featured = isset($_POST['featured']) ? (bool)$_POST['featured'] : $existingProduct['featured'];

// Handle image upload
$image = $existingProduct['image'];
if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    // Delete old image
    if ($image && file_exists(UPLOAD_PATH . $image)) {
        deleteFile(UPLOAD_PATH . $image);
    }
    
    $uploadResult = uploadFile($_FILES['image'], UPLOAD_PATH);
    if ($uploadResult['success']) {
        $image = $uploadResult['filename'];
    } else {
        sendJsonResponse(false, $uploadResult['message']);
    }
}

// Update product
$query = "UPDATE products SET 
          name = :name, slug = :slug, description = :description, 
          short_description = :short_description, price = :price, sale_price = :sale_price,
          category_id = :category_id, image = :image, stock = :stock, 
          sku = :sku, weight = :weight, dimensions = :dimensions,
          status = :status, featured = :featured,
          updated_at = CURRENT_TIMESTAMP
          WHERE id = :id";

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
$stmt->bindParam(':id', $product_id, PDO::PARAM_INT);

if ($stmt->execute()) {
    sendJsonResponse(true, 'Cập nhật sản phẩm thành công', [
        'product_id' => $product_id
    ]);
} else {
    sendJsonResponse(false, 'Cập nhật sản phẩm thất bại');
}

