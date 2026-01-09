<?php
/**
 * Get Products List
 * GET: api/products/list.php?category=slug&page=1&limit=12&search=keyword
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

// Get query parameters
$category = isset($_GET['category']) ? sanitizeInput($_GET['category']) : null;
// Không dùng sanitizeInput cho search vì có thể làm mất dấu tiếng Việt
$search = isset($_GET['search']) ? trim($_GET['search']) : null;
$search = $search ? mb_convert_encoding($search, 'UTF-8', 'UTF-8') : null; // Đảm bảo UTF-8
$status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : null;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : PRODUCTS_PER_PAGE;
$sort = isset($_GET['sort']) ? sanitizeInput($_GET['sort']) : 'newest'; // newest, price_asc, price_desc, popular
$order_by = isset($_GET['order_by']) ? sanitizeInput($_GET['order_by']) : null;
$order = isset($_GET['order']) ? sanitizeInput($_GET['order']) : 'DESC';
$min_price = isset($_GET['min_price']) ? (float)$_GET['min_price'] : null;
$max_price = isset($_GET['max_price']) ? (float)$_GET['max_price'] : null;

$page = max(1, $page);
$limit = max(1, min(50, $limit));
$offset = getPaginationOffset($page, $limit);

// Database connection
$database = new Database();
$db = $database->getConnection();

// Build WHERE clause
// Check if this is admin request (from admin panel) by checking referrer or adding admin param
$is_admin = isset($_GET['admin']) && $_GET['admin'] === 'true';
$is_admin = $is_admin || (isset($_SERVER['HTTP_REFERER']) && strpos($_SERVER['HTTP_REFERER'], '/admin/') !== false);

$where = [];
$params = [];

if ($status) {
    // Filter theo status nếu được chỉ định
    $where[] = "p.status = :status";
    $params[':status'] = $status;
} else if (!$is_admin) {
    // Nếu không phải admin request, mặc định chỉ hiển thị active (cho user)
    $where[] = "p.status = 'active'";
}
// Nếu là admin request và không có status param, hiển thị TẤT CẢ (không filter status)

if ($category) {
    $where[] = "c.slug = :category";
    $params[':category'] = $category;
}

if ($min_price !== null) {
    $where[] = "COALESCE(p.sale_price, p.price) >= :min_price";
    $params[':min_price'] = $min_price;
}

if ($max_price !== null) {
    $where[] = "COALESCE(p.sale_price, p.price) <= :max_price";
    $params[':max_price'] = $max_price;
}

if ($search) {
    // Tìm kiếm với tiếng Việt - đơn giản và hiệu quả
    $search = trim($search);
    if (!empty($search)) {
        $where[] = "(p.name LIKE :search_name OR p.description LIKE :search_desc OR p.short_description LIKE :search_short_desc)";
        $params[':search_name'] = "%{$search}%";
        $params[':search_desc'] = "%{$search}%";
        $params[':search_short_desc'] = "%{$search}%";
    }
}

// Build WHERE clause - nếu không có filter nào, dùng "1=1" để hiển thị TẤT CẢ
try {
    $whereClause = !empty($where) ? implode(' AND ', $where) : '1=1';
} catch (Exception $e) {
    error_log("Error building WHERE clause: " . $e->getMessage());
    $whereClause = '1=1';
}

// Build ORDER BY clause
$orderBy = "p.created_at DESC";
if ($order_by) {
    // Nếu có order_by parameter (dùng trong admin)
    $validOrderBy = ['created_at', 'price', 'name', 'sales_count', 'views', 'stock'];
    $validOrder = ['ASC', 'DESC'];
    if (in_array($order_by, $validOrderBy) && in_array(strtoupper($order), $validOrder)) {
        $orderBy = "p.{$order_by} " . strtoupper($order);
    }
} else {
    // Dùng sort parameter (cho user)
    switch ($sort) {
        case 'price_asc':
        case 'price-asc':
            $orderBy = "COALESCE(p.sale_price, p.price) ASC";
            break;
        case 'price_desc':
        case 'price-desc':
            $orderBy = "COALESCE(p.sale_price, p.price) DESC";
            break;
        case 'popular':
        case 'best-selling':
            $orderBy = "p.sales_count DESC, p.views DESC";
            break;
        case 'newest':
        default:
            $orderBy = "p.created_at DESC";
            break;
    }
}

// Count total - riêng các params filter
$countQuery = "SELECT COUNT(DISTINCT p.id) as total 
               FROM products p 
               LEFT JOIN categories c ON p.category_id = c.id 
               WHERE {$whereClause}";

try {
    $countStmt = $db->prepare($countQuery);
    foreach ($params as $key => $value) {
        if (strpos($key, ':limit') !== false || strpos($key, ':offset') !== false) {
            continue;
        }
        $countStmt->bindValue($key, $value, PDO::PARAM_STR);
    }
    $countStmt->execute();
    $totalResult = $countStmt->fetch(PDO::FETCH_ASSOC);
    $total = $totalResult ? (int)$totalResult['total'] : 0;
} catch (PDOException $e) {
    error_log("SQL Error in COUNT query: " . $e->getMessage());
    error_log("Count query: " . $countQuery);
    error_log("Where clause: " . $whereClause);
    error_log("Params: " . json_encode($params));
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi khi đếm sản phẩm: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
} catch (Exception $e) {
    error_log("General Error in COUNT query: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi không xác định khi đếm sản phẩm: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Get products - Đảm bảo thứ tự SELECT khớp với cách sử dụng trong code
$query = "SELECT 
                 p.id, 
                 p.name, 
                 p.slug, 
                 p.description, 
                 p.short_description, 
                 p.price, 
                 p.sale_price, 
                 p.image, 
                 p.stock, 
                 p.featured, 
                 p.status, 
                 p.views, 
                 p.sales_count, 
                 p.created_at,
                 c.id as category_id, 
                 c.name as category_name, 
                 c.slug as category_slug
          FROM products p 
          LEFT JOIN categories c ON p.category_id = c.id 
          WHERE {$whereClause}
          ORDER BY {$orderBy}
          LIMIT :limit OFFSET :offset";

try {
    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, PDO::PARAM_STR);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
} catch (PDOException $e) {
    error_log("SQL Error in products/list.php: " . $e->getMessage());
    error_log("Query: " . $query);
    error_log("Params: " . json_encode($params));
    error_log("Where clause: " . $whereClause);
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi khi tải danh sách sản phẩm: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
} catch (Exception $e) {
    error_log("General Error in products/list.php: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi không xác định: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Format products
foreach ($products as &$product) {
    // Đảm bảo các field được format đúng kiểu dữ liệu
    $product['id'] = (int)$product['id'];
    $product['price'] = (float)$product['price'];
    $product['sale_price'] = $product['sale_price'] ? (float)$product['sale_price'] : null;
    $product['stock'] = (int)$product['stock'];
    $product['featured'] = (bool)$product['featured'];
    $product['views'] = (int)$product['views'];
    
    // QUAN TRỌNG: sales_count PHẢI là số, không phải text!
    // Nếu sales_count là text hoặc NULL, đặt về 0
    if (isset($product['sales_count'])) {
        if (is_string($product['sales_count']) && !is_numeric($product['sales_count'])) {
            // Nếu là text (như "HOẠT ĐỘNG"), đặt về 0
            error_log("WARNING: Product ID {$product['id']} has invalid sales_count: '{$product['sales_count']}'. Setting to 0.");
            $product['sales_count'] = 0;
        } else {
            $product['sales_count'] = (int)$product['sales_count'];
        }
    } else {
        $product['sales_count'] = 0;
    }
    
    $product['category_id'] = $product['category_id'] ? (int)$product['category_id'] : null;
    
    // Đảm bảo status là string hợp lệ, không phải số hoặc text lạ
    if (!isset($product['status']) || $product['status'] === null || $product['status'] === '') {
        $product['status'] = 'active';
    } else {
        // Nếu status không phải là một trong các giá trị hợp lệ, đặt về 'active'
        $validStatuses = ['active', 'inactive', 'out_of_stock', 'draft'];
        if (!in_array($product['status'], $validStatuses)) {
            error_log("WARNING: Product ID {$product['id']} has invalid status: '{$product['status']}'. Setting to 'active'.");
            $product['status'] = 'active';
        }
    }
    
    $product['final_price'] = $product['sale_price'] ? $product['sale_price'] : $product['price'];
    $product['discount_percent'] = $product['sale_price'] ? round((($product['price'] - $product['sale_price']) / $product['price']) * 100) : 0;
    $product['image_url'] = $product['image'] ? APP_URL . '/api/uploads/products/' . $product['image'] : null;
}

sendJsonResponse(true, 'Lấy danh sách sản phẩm thành công', [
    'products' => $products,
    'pagination' => buildPagination($page, $limit, $total)
]);

