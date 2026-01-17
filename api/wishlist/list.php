<?php
/**
 * Get Wishlist
 * GET: api/wishlist/list.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Require authentication
requireAuth();

// Get user ID
$user_id = getCurrentUserId();

// Database connection
$database = new Database();
$db = $database->getConnection();

try {
    $query = "
        SELECT p.*, c.name as category_name, c.slug as category_slug, w.created_at as added_at
        FROM wishlist w
        JOIN products p ON w.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE w.user_id = :user_id
        ORDER BY w.created_at DESC
    ";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Process image URLs
    foreach ($products as &$product) {
        if ($product['image'] && !filter_var($product['image'], FILTER_VALIDATE_URL)) {
             $product['image_url'] = APP_URL . '/uploads/products/' . $product['image'];
        } else {
             $product['image_url'] = $product['image'];
        }
        
        // Ensure numbers
        $product['price'] = (float)$product['price'];
        if ($product['sale_price']) {
             $product['sale_price'] = (float)$product['sale_price'];
             $product['discount_percent'] = round((($product['price'] - $product['sale_price']) / $product['price']) * 100);
        }
    }

    sendJsonResponse(true, 'Lấy danh sách yêu thích thành công', [
        'products' => $products
    ]);

} catch (PDOException $e) {
    sendJsonResponse(false, 'Database error: ' . $e->getMessage());
}
