<?php
/**
 * Helper Functions
 */

require_once __DIR__ . '/../config/config.php';

/**
 * Send JSON response
 */
function sendJsonResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    
    $response = [
        'success' => $success,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Validate email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Sanitize input
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

/**
 * Hash password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Generate session ID for guest users
 */
function getSessionId() {
    if (!isset($_SESSION['session_id'])) {
        $_SESSION['session_id'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['session_id'];
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']) && isset($_SESSION['user_role']);
}

/**
 * Check if user is admin
 */
function isAdmin() {
    return isLoggedIn() && $_SESSION['user_role'] === 'admin';
}

/**
 * Require authentication
 */
function requireAuth() {
    if (!isLoggedIn()) {
        sendJsonResponse(false, 'Authentication required', null, 401);
    }
}

/**
 * Require admin
 */
function requireAdmin() {
    requireAuth();
    if (!isAdmin()) {
        sendJsonResponse(false, 'Admin access required', null, 403);
    }
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
    return isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
}

/**
 * Get current user role
 */
function getCurrentUserRole() {
    return isset($_SESSION['user_role']) ? $_SESSION['user_role'] : null;
}

/**
 * Format price
 */
function formatPrice($price) {
    return number_format($price, 0, ',', '.') . ' ₫';
}

/**
 * Generate order number
 */
function generateOrderNumber() {
    return 'DH' . date('Ymd') . strtoupper(substr(uniqid(), -6));
}

/**
 * Upload file
 */
function uploadFile($file, $destination) {
    if (!isset($file['error']) || is_array($file['error'])) {
        return ['success' => false, 'message' => 'Invalid file'];
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'File upload error'];
    }

    if ($file['size'] > MAX_FILE_SIZE) {
        return ['success' => false, 'message' => 'File too large'];
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);
    
    if (!in_array($mime, ALLOWED_IMAGE_TYPES)) {
        return ['success' => false, 'message' => 'Invalid file type'];
    }

    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $extension;
    $path = $destination . $filename;

    if (!is_dir($destination)) {
        mkdir($destination, 0755, true);
    }

    if (!move_uploaded_file($file['tmp_name'], $path)) {
        return ['success' => false, 'message' => 'Failed to save file'];
    }

    return ['success' => true, 'filename' => $filename];
}

/**
 * Delete file
 */
function deleteFile($filepath) {
    if (file_exists($filepath)) {
        return unlink($filepath);
    }
    return false;
}

/**
 * Get pagination offset
 */
function getPaginationOffset($page, $perPage) {
    return ($page - 1) * $perPage;
}

/**
 * Build pagination data
 */
function buildPagination($page, $perPage, $total) {
    $totalPages = ceil($total / $perPage);
    return [
        'current_page' => $page,
        'per_page' => $perPage,
        'total' => $total,
        'total_pages' => $totalPages,
        'has_prev' => $page > 1,
        'has_next' => $page < $totalPages
    ];
}

