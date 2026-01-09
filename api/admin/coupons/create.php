<?php
/**
 * Create Coupon (Admin)
 * POST: api/admin/coupons/create.php
 * Body: { code, name, description, discount_type, discount_value, min_order, max_discount, usage_limit, valid_from, valid_until }
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

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$code = isset($input['code']) ? strtoupper(trim($input['code'])) : null;
$name = isset($input['name']) ? sanitizeInput($input['name']) : null;
$discount_type = isset($input['discount_type']) ? sanitizeInput($input['discount_type']) : null;
$discount_value = isset($input['discount_value']) ? (float)$input['discount_value'] : null;

if (!$code || !$discount_type || $discount_value === null) {
    sendJsonResponse(false, 'Mã giảm giá, loại và giá trị giảm giá là bắt buộc');
}

// Validate discount type
if (!in_array($discount_type, ['percentage', 'fixed'])) {
    sendJsonResponse(false, 'Loại giảm giá không hợp lệ (phải là percentage hoặc fixed)');
}

// Validate discount value
if ($discount_type === 'percentage' && ($discount_value <= 0 || $discount_value > 100)) {
    sendJsonResponse(false, 'Giá trị phần trăm phải từ 1 đến 100');
}

if ($discount_type === 'fixed' && $discount_value <= 0) {
    sendJsonResponse(false, 'Giá trị giảm giá phải lớn hơn 0');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Check if code already exists
$checkQuery = "SELECT id FROM coupons WHERE code = :code LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(':code', $code, PDO::PARAM_STR);
$checkStmt->execute();

if ($checkStmt->fetch()) {
    sendJsonResponse(false, 'Mã giảm giá đã tồn tại');
}

// Prepare data
$description = isset($input['description']) ? sanitizeInput($input['description']) : null;
$min_order = isset($input['min_order']) ? (float)$input['min_order'] : 0;
$max_discount = isset($input['max_discount']) ? (float)$input['max_discount'] : null;
$usage_limit = isset($input['usage_limit']) ? (int)$input['usage_limit'] : null;
$valid_from = isset($input['valid_from']) ? sanitizeInput($input['valid_from']) : null;
$valid_until = isset($input['valid_until']) ? sanitizeInput($input['valid_until']) : null;
$status = isset($input['status']) ? sanitizeInput($input['status']) : 'active';
$apply_to = isset($input['apply_to']) ? sanitizeInput($input['apply_to']) : 'all';
$product_ids = isset($input['product_ids']) && is_array($input['product_ids']) ? $input['product_ids'] : [];

// Validate status
if (!in_array($status, ['active', 'inactive'])) {
    $status = 'active';
}

// Validate apply_to
if (!in_array($apply_to, ['all', 'banh-kem', 'hoa-tuoi', 'combo', 'qua-tang', 'specific'])) {
    $apply_to = 'all';
}

// Validate product_ids if apply_to is specific
if ($apply_to === 'specific' && empty($product_ids)) {
    sendJsonResponse(false, 'Vui lòng chọn ít nhất một sản phẩm');
}

// Insert coupon
$query = "INSERT INTO coupons (code, name, description, discount_type, discount_value, 
                              min_order, max_discount, usage_limit, valid_from, valid_until, status, apply_to)
          VALUES (:code, :name, :description, :discount_type, :discount_value,
                  :min_order, :max_discount, :usage_limit, :valid_from, :valid_until, :status, :apply_to)";

$stmt = $db->prepare($query);
$stmt->bindParam(':code', $code, PDO::PARAM_STR);
$stmt->bindValue(':name', $name, PDO::PARAM_STR);
$stmt->bindValue(':description', $description, PDO::PARAM_STR);
$stmt->bindParam(':discount_type', $discount_type, PDO::PARAM_STR);
$stmt->bindParam(':discount_value', $discount_value, PDO::PARAM_STR);
$stmt->bindParam(':min_order', $min_order, PDO::PARAM_STR);
$stmt->bindValue(':max_discount', $max_discount, PDO::PARAM_STR);
$stmt->bindValue(':usage_limit', $usage_limit, PDO::PARAM_INT);
$stmt->bindValue(':valid_from', $valid_from, PDO::PARAM_STR);
$stmt->bindValue(':valid_until', $valid_until, PDO::PARAM_STR);
$stmt->bindParam(':status', $status, PDO::PARAM_STR);
$stmt->bindParam(':apply_to', $apply_to, PDO::PARAM_STR);

if ($stmt->execute()) {
    $coupon_id = $db->lastInsertId();
    
    // Insert product relationships if apply_to is specific
    if ($apply_to === 'specific' && !empty($product_ids)) {
        $insertProductQuery = "INSERT INTO coupon_products (coupon_id, product_id) VALUES (:coupon_id, :product_id)";
        $insertProductStmt = $db->prepare($insertProductQuery);
        
        foreach ($product_ids as $product_id) {
            $product_id = (int)$product_id;
            if ($product_id > 0) {
                $insertProductStmt->bindParam(':coupon_id', $coupon_id, PDO::PARAM_INT);
                $insertProductStmt->bindParam(':product_id', $product_id, PDO::PARAM_INT);
                $insertProductStmt->execute();
            }
        }
    }
    
    // Get created coupon
    $getQuery = "SELECT * FROM coupons WHERE id = :id LIMIT 1";
    $getStmt = $db->prepare($getQuery);
    $getStmt->bindParam(':id', $coupon_id, PDO::PARAM_INT);
    $getStmt->execute();
    $coupon = $getStmt->fetch();
    
    // Format coupon
    $coupon['id'] = (int)$coupon['id'];
    $coupon['discount_value'] = (float)$coupon['discount_value'];
    $coupon['min_order'] = (float)$coupon['min_order'];
    $coupon['max_discount'] = $coupon['max_discount'] ? (float)$coupon['max_discount'] : null;
    $coupon['usage_limit'] = $coupon['usage_limit'] ? (int)$coupon['usage_limit'] : null;
    $coupon['used_count'] = (int)$coupon['used_count'];
    
    sendJsonResponse(true, 'Tạo mã giảm giá thành công', ['coupon' => $coupon]);
} else {
    sendJsonResponse(false, 'Tạo mã giảm giá thất bại');
}

