<?php
/**
 * Create Order
 * POST: api/orders/create.php
 * Body: { shipping_name, shipping_phone, shipping_address, payment_method, coupon_code }
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(false, 'Method not allowed', null, 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['shipping_name']) || !isset($input['shipping_phone']) || !isset($input['shipping_address'])) {
    sendJsonResponse(false, 'Thông tin giao hàng là bắt buộc');
}

$shipping_name = sanitizeInput($input['shipping_name']);
$shipping_phone = sanitizeInput($input['shipping_phone']);
$shipping_address = sanitizeInput($input['shipping_address']);
$shipping_city = isset($input['shipping_city']) ? sanitizeInput($input['shipping_city']) : null;
$shipping_district = isset($input['shipping_district']) ? sanitizeInput($input['shipping_district']) : null;
$shipping_ward = isset($input['shipping_ward']) ? sanitizeInput($input['shipping_ward']) : null;
$payment_method = isset($input['payment_method']) ? sanitizeInput($input['payment_method']) : 'cod';
$coupon_code = isset($input['coupon_code']) ? sanitizeInput($input['coupon_code']) : null;
$notes = isset($input['notes']) ? sanitizeInput($input['notes']) : null;

// Validate payment method
$valid_payment_methods = ['cod', 'vnpay', 'momo', 'zalopay', 'paypal'];
if (!in_array($payment_method, $valid_payment_methods)) {
    $payment_method = 'cod';
}

// Get user ID or session ID
$user_id = getCurrentUserId();
$session_id = getSessionId();

// Database connection
$database = new Database();
$db = $database->getConnection();

// Start transaction
$db->beginTransaction();

try {
    // Get cart items
    if ($user_id) {
        $cartWhere = "c.user_id = :user_id";
        $cartParam = [':user_id' => $user_id];
    } else {
        $cartWhere = "c.session_id = :session_id AND c.user_id IS NULL";
        $cartParam = [':session_id' => $session_id];
    }

    $cartQuery = "SELECT c.id, c.product_id, c.quantity,
                         p.name, p.price, p.sale_price, p.stock
                  FROM cart c
                  LEFT JOIN products p ON c.product_id = p.id
                  WHERE {$cartWhere} AND p.status = 'active'";
    
    $cartStmt = $db->prepare($cartQuery);
    foreach ($cartParam as $key => $value) {
        $cartStmt->bindValue($key, $value);
    }
    $cartStmt->execute();
    $cart_items = $cartStmt->fetchAll();

    if (empty($cart_items)) {
        $db->rollBack();
        sendJsonResponse(false, 'Giỏ hàng trống');
    }

    // Calculate totals
    $subtotal = 0;
    $discount = 0;
    $shipping_fee = 30000; // Default shipping fee
    $coupon_id = null;

    foreach ($cart_items as $item) {
        $final_price = $item['sale_price'] ? (float)$item['sale_price'] : (float)$item['price'];
        
        // Check stock
        if ($item['stock'] < $item['quantity']) {
            $db->rollBack();
            sendJsonResponse(false, 'Sản phẩm "' . $item['name'] . '" không đủ số lượng. Còn lại: ' . $item['stock']);
        }
        
        $subtotal += $final_price * (int)$item['quantity'];
    }

    // Apply coupon if provided
    if ($coupon_code) {
        $couponQuery = "SELECT * FROM coupons 
                       WHERE code = :code 
                       AND status = 'active' 
                       AND (valid_from IS NULL OR valid_from <= NOW())
                       AND (valid_until IS NULL OR valid_until >= NOW())
                       AND (usage_limit IS NULL OR used_count < usage_limit)
                       LIMIT 1";
        $couponStmt = $db->prepare($couponQuery);
        $couponStmt->bindParam(':code', $coupon_code, PDO::PARAM_STR);
        $couponStmt->execute();
        $coupon = $couponStmt->fetch();

        if ($coupon && $subtotal >= $coupon['min_order']) {
            $coupon_id = $coupon['id'];
            
            if ($coupon['discount_type'] === 'percentage') {
                $discount = ($subtotal * $coupon['discount_value']) / 100;
                if ($coupon['max_discount']) {
                    $discount = min($discount, $coupon['max_discount']);
                }
            } else {
                $discount = $coupon['discount_value'];
            }
            
            $discount = min($discount, $subtotal); // Discount can't exceed subtotal
        }
    }

    $total = $subtotal - $discount + $shipping_fee;

    // Generate order number
    $order_number = generateOrderNumber();

    // Create order
    $guest_email = null;
    $guest_name = null;
    $guest_phone = null;

    if (!$user_id) {
        // For guest checkout, try to get email from input
        $guest_email = isset($input['email']) ? sanitizeInput($input['email']) : null;
        $guest_name = $shipping_name;
        $guest_phone = $shipping_phone;
    }

    $orderQuery = "INSERT INTO orders 
                   (order_number, user_id, guest_email, guest_name, guest_phone,
                    subtotal, discount, shipping_fee, total,
                    payment_method, shipping_name, shipping_phone, shipping_address,
                    shipping_city, shipping_district, shipping_ward, notes, status)
                   VALUES 
                   (:order_number, :user_id, :guest_email, :guest_name, :guest_phone,
                    :subtotal, :discount, :shipping_fee, :total,
                    :payment_method, :shipping_name, :shipping_phone, :shipping_address,
                    :shipping_city, :shipping_district, :shipping_ward, :notes, 'pending')";
    
    $orderStmt = $db->prepare($orderQuery);
    $orderStmt->bindParam(':order_number', $order_number, PDO::PARAM_STR);
    $orderStmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
    $orderStmt->bindValue(':guest_email', $guest_email, PDO::PARAM_STR);
    $orderStmt->bindValue(':guest_name', $guest_name, PDO::PARAM_STR);
    $orderStmt->bindValue(':guest_phone', $guest_phone, PDO::PARAM_STR);
    $orderStmt->bindParam(':subtotal', $subtotal, PDO::PARAM_STR);
    $orderStmt->bindParam(':discount', $discount, PDO::PARAM_STR);
    $orderStmt->bindParam(':shipping_fee', $shipping_fee, PDO::PARAM_STR);
    $orderStmt->bindParam(':total', $total, PDO::PARAM_STR);
    $orderStmt->bindParam(':payment_method', $payment_method, PDO::PARAM_STR);
    $orderStmt->bindParam(':shipping_name', $shipping_name, PDO::PARAM_STR);
    $orderStmt->bindParam(':shipping_phone', $shipping_phone, PDO::PARAM_STR);
    $orderStmt->bindParam(':shipping_address', $shipping_address, PDO::PARAM_STR);
    $orderStmt->bindValue(':shipping_city', $shipping_city, PDO::PARAM_STR);
    $orderStmt->bindValue(':shipping_district', $shipping_district, PDO::PARAM_STR);
    $orderStmt->bindValue(':shipping_ward', $shipping_ward, PDO::PARAM_STR);
    $orderStmt->bindValue(':notes', $notes, PDO::PARAM_STR);
    $orderStmt->execute();

    $order_id = $db->lastInsertId();

    // Create order items
    foreach ($cart_items as $item) {
        $final_price = $item['sale_price'] ? (float)$item['sale_price'] : (float)$item['price'];
        $item_subtotal = $final_price * (int)$item['quantity'];

        $itemQuery = "INSERT INTO order_items 
                     (order_id, product_id, product_name, product_price, quantity, subtotal)
                     VALUES 
                     (:order_id, :product_id, :product_name, :product_price, :quantity, :subtotal)";
        
        $itemStmt = $db->prepare($itemQuery);
        $itemStmt->bindParam(':order_id', $order_id, PDO::PARAM_INT);
        $itemStmt->bindParam(':product_id', $item['product_id'], PDO::PARAM_INT);
        $itemStmt->bindParam(':product_name', $item['name'], PDO::PARAM_STR);
        $itemStmt->bindParam(':product_price', $final_price, PDO::PARAM_STR);
        $itemStmt->bindParam(':quantity', $item['quantity'], PDO::PARAM_INT);
        $itemStmt->bindParam(':subtotal', $item_subtotal, PDO::PARAM_STR);
        $itemStmt->execute();

        // Update stock
        $updateStockQuery = "UPDATE products SET stock = stock - :quantity WHERE id = :product_id";
        $updateStockStmt = $db->prepare($updateStockQuery);
        $updateStockStmt->bindParam(':quantity', $item['quantity'], PDO::PARAM_INT);
        $updateStockStmt->bindParam(':product_id', $item['product_id'], PDO::PARAM_INT);
        $updateStockStmt->execute();

        // Update sales count
        $updateSalesQuery = "UPDATE products SET sales_count = sales_count + :quantity WHERE id = :product_id";
        $updateSalesStmt = $db->prepare($updateSalesQuery);
        $updateSalesStmt->bindParam(':quantity', $item['quantity'], PDO::PARAM_INT);
        $updateSalesStmt->bindParam(':product_id', $item['product_id'], PDO::PARAM_INT);
        $updateSalesStmt->execute();
    }

    // Record coupon usage if applied
    if ($coupon_id) {
        $couponUsageQuery = "INSERT INTO coupon_usage (coupon_id, order_id, user_id, discount_amount)
                            VALUES (:coupon_id, :order_id, :user_id, :discount_amount)";
        $couponUsageStmt = $db->prepare($couponUsageQuery);
        $couponUsageStmt->bindParam(':coupon_id', $coupon_id, PDO::PARAM_INT);
        $couponUsageStmt->bindParam(':order_id', $order_id, PDO::PARAM_INT);
        $couponUsageStmt->bindValue(':user_id', $user_id, PDO::PARAM_INT);
        $couponUsageStmt->bindParam(':discount_amount', $discount, PDO::PARAM_STR);
        $couponUsageStmt->execute();

        // Update coupon used count
        $updateCouponQuery = "UPDATE coupons SET used_count = used_count + 1 WHERE id = :coupon_id";
        $updateCouponStmt = $db->prepare($updateCouponQuery);
        $updateCouponStmt->bindParam(':coupon_id', $coupon_id, PDO::PARAM_INT);
        $updateCouponStmt->execute();
    }

    // Clear cart
    if ($user_id) {
        $clearCartQuery = "DELETE FROM cart WHERE user_id = :user_id";
        $clearCartStmt = $db->prepare($clearCartQuery);
        $clearCartStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $clearCartStmt->execute();
    } else {
        $clearCartQuery = "DELETE FROM cart WHERE session_id = :session_id AND user_id IS NULL";
        $clearCartStmt = $db->prepare($clearCartQuery);
        $clearCartStmt->bindParam(':session_id', $session_id, PDO::PARAM_STR);
        $clearCartStmt->execute();
    }

    // Commit transaction
    $db->commit();

    sendJsonResponse(true, 'Đặt hàng thành công', [
        'order_id' => $order_id,
        'order_number' => $order_number,
        'total' => $total
    ]);

} catch (Exception $e) {
    $db->rollBack();
    error_log("Order creation error: " . $e->getMessage());
    sendJsonResponse(false, 'Đặt hàng thất bại: ' . $e->getMessage());
}

