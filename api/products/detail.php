<?php
/**
 * Get Product Detail
 * GET: api/products/detail.php?id=1 hoặc ?slug=product-slug
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Get product ID or slug
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
$slug = isset($_GET['slug']) ? sanitizeInput($_GET['slug']) : null;

if (!$id && !$slug) {
    sendJsonResponse(false, 'ID hoặc slug sản phẩm là bắt buộc');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Build WHERE clause
if ($id) {
    $where = "p.id = :id";
    $param = [':id' => $id];
} else {
    $where = "p.slug = :slug";
    $param = [':slug' => $slug];
}

// Get product
$query = "SELECT p.id, p.name, p.slug, p.description, p.short_description, 
                 p.price, p.sale_price, p.image, p.gallery, p.stock, p.sku,
                 p.weight, p.dimensions, p.featured, p.views, p.sales_count, 
                 p.created_at, p.updated_at,
                 c.id as category_id, c.name as category_name, c.slug as category_slug
          FROM products p 
          LEFT JOIN categories c ON p.category_id = c.id 
          WHERE {$where} AND p.status = 'active'
          LIMIT 1";

$stmt = $db->prepare($query);
foreach ($param as $key => $value) {
    $stmt->bindValue($key, $value);
}
$stmt->execute();

$product = $stmt->fetch();

if (!$product) {
    sendJsonResponse(false, 'Không tìm thấy sản phẩm');
}

// Increment views
$updateViewsQuery = "UPDATE products SET views = views + 1 WHERE id = :id";
$updateStmt = $db->prepare($updateViewsQuery);
$updateStmt->bindParam(':id', $product['id'], PDO::PARAM_INT);
$updateStmt->execute();

// Parse gallery (JSON)
$product['gallery'] = $product['gallery'] ? json_decode($product['gallery'], true) : [];

// Format product
$product['id'] = (int)$product['id'];
$product['price'] = (float)$product['price'];
$product['sale_price'] = $product['sale_price'] ? (float)$product['sale_price'] : null;
$product['stock'] = (int)$product['stock'];
$product['featured'] = (bool)$product['featured'];
$product['views'] = (int)$product['views'] + 1; // Include the increment
$product['sales_count'] = (int)$product['sales_count'];
$product['category_id'] = (int)$product['category_id'];
$product['final_price'] = $product['sale_price'] ? $product['sale_price'] : $product['price'];
$product['discount_percent'] = $product['sale_price'] ? round((($product['price'] - $product['sale_price']) / $product['price']) * 100) : 0;
$product['image_url'] = $product['image'] ? APP_URL . '/api/uploads/products/' . $product['image'] : null;

// Format gallery images
if (is_array($product['gallery'])) {
    $product['gallery'] = array_map(function($img) {
        return APP_URL . '/api/uploads/products/' . $img;
    }, $product['gallery']);
}

// Get related products (same category)
$relatedQuery = "SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.image
                 FROM products p 
                 WHERE p.category_id = :category_id AND p.id != :product_id AND p.status = 'active'
                 ORDER BY RAND()
                 LIMIT 4";
$relatedStmt = $db->prepare($relatedQuery);
$relatedStmt->bindParam(':category_id', $product['category_id'], PDO::PARAM_INT);
$relatedStmt->bindParam(':product_id', $product['id'], PDO::PARAM_INT);
$relatedStmt->execute();
$related = $relatedStmt->fetchAll();

// Format related products
foreach ($related as &$item) {
    $item['id'] = (int)$item['id'];
    $item['price'] = (float)$item['price'];
    $item['sale_price'] = $item['sale_price'] ? (float)$item['sale_price'] : null;
    $item['final_price'] = $item['sale_price'] ? $item['sale_price'] : $item['price'];
    $item['image_url'] = $item['image'] ? APP_URL . '/api/uploads/products/' . $item['image'] : null;
}

$product['related_products'] = $related;

sendJsonResponse(true, 'Lấy chi tiết sản phẩm thành công', ['product' => $product]);

