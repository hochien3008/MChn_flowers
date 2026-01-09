<?php
/**
 * Get Coupon Detail (Admin)
 * GET: api/admin/coupons/detail.php?id=123
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

requireAdmin();

$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

if (!$id) {
    sendJsonResponse(false, 'ID mã giảm giá là bắt buộc');
}

$database = new Database();
$db = $database->getConnection();

$query = "SELECT * FROM coupons WHERE id = :id LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $id, PDO::PARAM_INT);
$stmt->execute();
$coupon = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$coupon) {
    sendJsonResponse(false, 'Không tìm thấy mã giảm giá');
}

$coupon['id'] = (int)$coupon['id'];
$coupon['discount_value'] = (float)$coupon['discount_value'];
$coupon['min_order'] = (float)$coupon['min_order'];
$coupon['max_discount'] = $coupon['max_discount'] ? (float)$coupon['max_discount'] : null;
$coupon['usage_limit'] = $coupon['usage_limit'] ? (int)$coupon['usage_limit'] : null;
$coupon['used_count'] = (int)$coupon['used_count'];
$coupon['remaining'] = $coupon['usage_limit'] ? $coupon['usage_limit'] - $coupon['used_count'] : null;
$coupon['apply_to'] = isset($coupon['apply_to']) ? $coupon['apply_to'] : 'all';

// Get associated products if apply_to is specific
$coupon['products'] = [];
if ($coupon['apply_to'] === 'specific') {
    $productsQuery = "SELECT p.id, p.name 
                      FROM coupon_products cp
                      INNER JOIN products p ON cp.product_id = p.id
                      WHERE cp.coupon_id = :coupon_id
                      ORDER BY p.name";
    $productsStmt = $db->prepare($productsQuery);
    $productsStmt->bindParam(':coupon_id', $id, PDO::PARAM_INT);
    $productsStmt->execute();
    $coupon['products'] = $productsStmt->fetchAll();
}

sendJsonResponse(true, 'Chi tiết mã giảm giá', ['coupon' => $coupon]);

