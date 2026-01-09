<?php
/**
 * Update Coupon (Admin)
 * POST: api/admin/coupons/update.php
 * Body: { id, code, name, description, discount_type, discount_value, min_order, max_discount, usage_limit, valid_from, valid_until, status }
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

$coupon_id = isset($input['id']) ? (int)$input['id'] : null;

if (!$coupon_id) {
    sendJsonResponse(false, 'ID mã giảm giá là bắt buộc');
}

// Database connection
$database = new Database();
$db = $database->getConnection();

// Check if coupon exists
$checkQuery = "SELECT id, code FROM coupons WHERE id = :id LIMIT 1";
$checkStmt = $db->prepare($checkQuery);
$checkStmt->bindParam(':id', $coupon_id, PDO::PARAM_INT);
$checkStmt->execute();
$existing = $checkStmt->fetch();

if (!$existing) {
    sendJsonResponse(false, 'Không tìm thấy mã giảm giá');
}

// Prepare update fields
$updates = [];
$params = [':id' => $coupon_id];

if (isset($input['code'])) {
    $code = strtoupper(trim($input['code']));
    // Check if code already exists (except current coupon)
    if ($code !== $existing['code']) {
        $codeCheckQuery = "SELECT id FROM coupons WHERE code = :code AND id != :id LIMIT 1";
        $codeCheckStmt = $db->prepare($codeCheckQuery);
        $codeCheckStmt->bindParam(':code', $code, PDO::PARAM_STR);
        $codeCheckStmt->bindParam(':id', $coupon_id, PDO::PARAM_INT);
        $codeCheckStmt->execute();
        if ($codeCheckStmt->fetch()) {
            sendJsonResponse(false, 'Mã giảm giá đã tồn tại');
        }
    }
    $updates[] = "code = :code";
    $params[':code'] = $code;
}

if (isset($input['name'])) {
    $updates[] = "name = :name";
    $params[':name'] = sanitizeInput($input['name']);
}

if (isset($input['description'])) {
    $updates[] = "description = :description";
    $params[':description'] = sanitizeInput($input['description']);
}

if (isset($input['discount_type'])) {
    $discount_type = sanitizeInput($input['discount_type']);
    if (!in_array($discount_type, ['percentage', 'fixed'])) {
        sendJsonResponse(false, 'Loại giảm giá không hợp lệ');
    }
    $updates[] = "discount_type = :discount_type";
    $params[':discount_type'] = $discount_type;
}

if (isset($input['discount_value'])) {
    $discount_value = (float)$input['discount_value'];
    if (isset($input['discount_type']) && $input['discount_type'] === 'percentage' && ($discount_value <= 0 || $discount_value > 100)) {
        sendJsonResponse(false, 'Giá trị phần trăm phải từ 1 đến 100');
    }
    if ($discount_value <= 0) {
        sendJsonResponse(false, 'Giá trị giảm giá phải lớn hơn 0');
    }
    $updates[] = "discount_value = :discount_value";
    $params[':discount_value'] = $discount_value;
}

if (isset($input['min_order'])) {
    $updates[] = "min_order = :min_order";
    $params[':min_order'] = (float)$input['min_order'];
}

if (isset($input['max_discount'])) {
    $updates[] = "max_discount = :max_discount";
    $params[':max_discount'] = $input['max_discount'] ? (float)$input['max_discount'] : null;
}

if (isset($input['usage_limit'])) {
    $updates[] = "usage_limit = :usage_limit";
    $params[':usage_limit'] = $input['usage_limit'] ? (int)$input['usage_limit'] : null;
}

if (isset($input['valid_from'])) {
    $updates[] = "valid_from = :valid_from";
    $params[':valid_from'] = sanitizeInput($input['valid_from']);
}

if (isset($input['valid_until'])) {
    $updates[] = "valid_until = :valid_until";
    $params[':valid_until'] = sanitizeInput($input['valid_until']);
}

if (isset($input['status'])) {
    $status = sanitizeInput($input['status']);
    if (in_array($status, ['active', 'inactive'])) {
        $updates[] = "status = :status";
        $params[':status'] = $status;
    }
}

if (isset($input['apply_to'])) {
    $apply_to = sanitizeInput($input['apply_to']);
    if (in_array($apply_to, ['all', 'banh-kem', 'hoa-tuoi', 'combo', 'qua-tang', 'specific'])) {
        $updates[] = "apply_to = :apply_to";
        $params[':apply_to'] = $apply_to;
    }
}

$product_ids = isset($input['product_ids']) && is_array($input['product_ids']) ? $input['product_ids'] : null;

// Validate product_ids if apply_to is being set to specific
if ($product_ids !== null && isset($input['apply_to']) && $input['apply_to'] === 'specific' && empty($product_ids)) {
    sendJsonResponse(false, 'Vui lòng chọn ít nhất một sản phẩm');
}

if (empty($updates)) {
    sendJsonResponse(false, 'Không có dữ liệu để cập nhật');
}

$updates[] = "updated_at = CURRENT_TIMESTAMP";

// Update coupon
$query = "UPDATE coupons SET " . implode(', ', $updates) . " WHERE id = :id";
$stmt = $db->prepare($query);

foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
}

if ($stmt->execute()) {
    // Update product relationships if product_ids is provided
    if ($product_ids !== null) {
        // Delete existing relationships
        $deleteQuery = "DELETE FROM coupon_products WHERE coupon_id = :coupon_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(':coupon_id', $coupon_id, PDO::PARAM_INT);
        $deleteStmt->execute();
        
        // Insert new relationships if apply_to is specific
        $apply_to_value = isset($input['apply_to']) ? $input['apply_to'] : null;
        if ($apply_to_value === 'specific' && !empty($product_ids)) {
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
    }
    
    // Get updated coupon
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
    
    sendJsonResponse(true, 'Cập nhật mã giảm giá thành công', ['coupon' => $coupon]);
} else {
    sendJsonResponse(false, 'Cập nhật mã giảm giá thất bại');
}

