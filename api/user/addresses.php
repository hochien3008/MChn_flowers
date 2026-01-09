<?php
/**
 * User Addresses Management
 * GET: api/user/addresses.php - List addresses
 * POST: api/user/addresses.php - Create/Update/Delete address
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Require authentication
requireAuth();

// Database connection
$database = new Database();
$db = $database->getConnection();

$user_id = getCurrentUserId();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get addresses list
    $query = "SELECT * FROM addresses WHERE user_id = :user_id ORDER BY is_default DESC, created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $addresses = $stmt->fetchAll();
    
    // Format addresses
    foreach ($addresses as &$address) {
        $address['id'] = (int)$address['id'];
        $address['user_id'] = (int)$address['user_id'];
        $address['is_default'] = (bool)$address['is_default'];
    }
    
    sendJsonResponse(true, 'Lấy danh sách địa chỉ thành công', ['addresses' => $addresses]);
    
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Create, update, or delete address
    $input = json_decode(file_get_contents('php://input'), true);
    $action = isset($input['action']) ? $input['action'] : 'create'; // create, update, delete, set_default
    
    if ($action === 'create') {
        // Create new address
        $name = isset($input['name']) ? sanitizeInput($input['name']) : null;
        $phone = isset($input['phone']) ? sanitizeInput($input['phone']) : null;
        $address = isset($input['address']) ? sanitizeInput($input['address']) : null;
        $city = isset($input['city']) ? sanitizeInput($input['city']) : null;
        $district = isset($input['district']) ? sanitizeInput($input['district']) : null;
        $ward = isset($input['ward']) ? sanitizeInput($input['ward']) : null;
        $is_default = isset($input['is_default']) ? (bool)$input['is_default'] : false;
        
        if (!$name || !$phone || !$address) {
            sendJsonResponse(false, 'Tên, số điện thoại và địa chỉ là bắt buộc');
        }
        
        // If set as default, unset other defaults
        if ($is_default) {
            $unsetQuery = "UPDATE addresses SET is_default = 0 WHERE user_id = :user_id";
            $unsetStmt = $db->prepare($unsetQuery);
            $unsetStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $unsetStmt->execute();
        }
        
        $query = "INSERT INTO addresses (user_id, name, phone, address, city, district, ward, is_default) 
                  VALUES (:user_id, :name, :phone, :address, :city, :district, :ward, :is_default)";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->bindParam(':name', $name, PDO::PARAM_STR);
        $stmt->bindParam(':phone', $phone, PDO::PARAM_STR);
        $stmt->bindParam(':address', $address, PDO::PARAM_STR);
        $stmt->bindValue(':city', $city, PDO::PARAM_STR);
        $stmt->bindValue(':district', $district, PDO::PARAM_STR);
        $stmt->bindValue(':ward', $ward, PDO::PARAM_STR);
        $stmt->bindValue(':is_default', $is_default, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            sendJsonResponse(true, 'Thêm địa chỉ thành công', ['address_id' => $db->lastInsertId()]);
        } else {
            sendJsonResponse(false, 'Thêm địa chỉ thất bại');
        }
        
    } elseif ($action === 'delete') {
        // Delete address
        $address_id = isset($input['id']) ? (int)$input['id'] : null;
        
        if (!$address_id) {
            sendJsonResponse(false, 'ID địa chỉ là bắt buộc');
        }
        
        $query = "DELETE FROM addresses WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $address_id, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            sendJsonResponse(true, 'Xóa địa chỉ thành công');
        } else {
            sendJsonResponse(false, 'Xóa địa chỉ thất bại');
        }
        
    } elseif ($action === 'set_default') {
        // Set address as default
        $address_id = isset($input['id']) ? (int)$input['id'] : null;
        
        if (!$address_id) {
            sendJsonResponse(false, 'ID địa chỉ là bắt buộc');
        }
        
        // Unset all defaults
        $unsetQuery = "UPDATE addresses SET is_default = 0 WHERE user_id = :user_id";
        $unsetStmt = $db->prepare($unsetQuery);
        $unsetStmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $unsetStmt->execute();
        
        // Set new default
        $query = "UPDATE addresses SET is_default = 1 WHERE id = :id AND user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $address_id, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            sendJsonResponse(true, 'Đặt địa chỉ mặc định thành công');
        } else {
            sendJsonResponse(false, 'Đặt địa chỉ mặc định thất bại');
        }
    }
} else {
    sendJsonResponse(false, 'Method not allowed', null, 405);
}

