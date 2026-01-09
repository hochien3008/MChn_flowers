<?php
/**
 * Check Authentication Status
 * GET: api/auth/check.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

if (!isLoggedIn()) {
    sendJsonResponse(false, 'Not authenticated', ['authenticated' => false], 200);
}

// Get user info
$user_id = getCurrentUserId();
$database = new Database();
$db = $database->getConnection();

$query = "SELECT id, email, full_name, phone, role, status FROM users WHERE id = :id LIMIT 1";
$stmt = $db->prepare($query);
$stmt->bindParam(':id', $user_id, PDO::PARAM_INT);
$stmt->execute();

$user = $stmt->fetch();

if (!$user) {
    sendJsonResponse(false, 'User not found', ['authenticated' => false], 200);
}

sendJsonResponse(true, 'Authenticated', [
    'authenticated' => true,
    'user' => $user
]);

