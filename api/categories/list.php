<?php
/**
 * Get Categories List
 * GET: api/categories/list.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Database connection
$database = new Database();
$db = $database->getConnection();

// Get categories
$query = "SELECT id, name, slug, parent_id, description, image, sort_order
          FROM categories 
          WHERE status = 'active'
          ORDER BY sort_order ASC, name ASC";

$stmt = $db->prepare($query);
$stmt->execute();

$categories = $stmt->fetchAll();

// Format categories
foreach ($categories as &$category) {
    $category['id'] = (int)$category['id'];
    $category['parent_id'] = $category['parent_id'] ? (int)$category['parent_id'] : null;
    $category['sort_order'] = (int)$category['sort_order'];
}

sendJsonResponse(true, 'Lấy danh sách danh mục thành công', [
    'categories' => $categories
]);

