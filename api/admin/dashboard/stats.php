<?php
/**
 * Dashboard Statistics (Admin)
 * GET: api/admin/dashboard/stats.php?period=today|week|month|year
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/functions.php';

// Require admin access
requireAdmin();

// Get period
$period = isset($_GET['period']) ? sanitizeInput($_GET['period']) : 'today';

// Database connection
$database = new Database();
$db = $database->getConnection();

// Build date filter
$dateFilter = "";
switch ($period) {
    case 'today':
        $dateFilter = "DATE(orders.created_at) = CURDATE()";
        break;
    case 'week':
        $dateFilter = "YEARWEEK(orders.created_at, 1) = YEARWEEK(CURDATE(), 1)";
        break;
    case 'month':
        $dateFilter = "YEAR(orders.created_at) = YEAR(CURDATE()) AND MONTH(orders.created_at) = MONTH(CURDATE())";
        break;
    case 'year':
        $dateFilter = "YEAR(orders.created_at) = YEAR(CURDATE())";
        break;
    default:
        $dateFilter = "1=1";
}

// Total revenue
$revenueQuery = "SELECT COALESCE(SUM(total), 0) as total_revenue 
                 FROM orders 
                 WHERE status != 'cancelled' AND {$dateFilter}";
$revenueStmt = $db->prepare($revenueQuery);
$revenueStmt->execute();
$revenue = $revenueStmt->fetch();

// Total orders
$ordersQuery = "SELECT COUNT(*) as total_orders 
                FROM orders 
                WHERE {$dateFilter}";
$ordersStmt = $db->prepare($ordersQuery);
$ordersStmt->execute();
$orders = $ordersStmt->fetch();

// Orders by status
$statusQuery = "SELECT status, COUNT(*) as count 
                FROM orders 
                WHERE {$dateFilter}
                GROUP BY status";
$statusStmt = $db->prepare($statusQuery);
$statusStmt->execute();
$ordersByStatus = $statusStmt->fetchAll();

// Total products
$productsQuery = "SELECT COUNT(*) as total_products FROM products WHERE status = 'active'";
$productsStmt = $db->prepare($productsQuery);
$productsStmt->execute();
$products = $productsStmt->fetch();

// Total customers
$customersQuery = "SELECT COUNT(*) as total_customers FROM users WHERE role = 'user'";
$customersStmt = $db->prepare($customersQuery);
$customersStmt->execute();
$customers = $customersStmt->fetch();

// Low stock products
$lowStockQuery = "SELECT COUNT(*) as low_stock_count 
                  FROM products 
                  WHERE status = 'active' AND stock < 10";
$lowStockStmt = $db->prepare($lowStockQuery);
$lowStockStmt->execute();
$lowStock = $lowStockStmt->fetch();

// Best selling products
$bestSellingQuery = "SELECT p.id, p.name, p.image, p.price, p.sales_count
                     FROM products p
                     WHERE p.status = 'active'
                     ORDER BY p.sales_count DESC
                     LIMIT 5";
$bestSellingStmt = $db->prepare($bestSellingQuery);
$bestSellingStmt->execute();
$bestSelling = $bestSellingStmt->fetchAll();

// Format best selling products
foreach ($bestSelling as &$item) {
    $item['id'] = (int)$item['id'];
    $item['price'] = (float)$item['price'];
    $item['sales_count'] = (int)$item['sales_count'];
    $item['image_url'] = $item['image'] ? APP_URL . '/api/uploads/products/' . $item['image'] : null;
}

// Recent orders
$recentOrdersQuery = "SELECT id, order_number, total, status, created_at, guest_name, shipping_name, user_id
                      FROM orders
                      ORDER BY created_at DESC
                      LIMIT 10";
$recentOrdersStmt = $db->prepare($recentOrdersQuery);
$recentOrdersStmt->execute();
$recentOrders = $recentOrdersStmt->fetchAll();

// Format recent orders
foreach ($recentOrders as &$order) {
    $order['id'] = (int)$order['id'];
    $order['total'] = (float)$order['total'];
    $order['user_id'] = $order['user_id'] ? (int)$order['user_id'] : null;
}

// Revenue by category (for current period)
$dateFilterForJoin = str_replace('orders.', 'o.', $dateFilter);
$revenueByCategoryQuery = "SELECT 
                            c.slug as category_slug,
                            COALESCE(SUM(oi.subtotal), 0) as revenue
                          FROM categories c
                          LEFT JOIN products p ON c.id = p.category_id
                          LEFT JOIN order_items oi ON p.id = oi.product_id
                          LEFT JOIN orders o ON oi.order_id = o.id
                          WHERE c.slug IN ('banh-kem', 'hoa-tuoi', 'combo')
                          AND o.status != 'cancelled'
                          AND ({$dateFilterForJoin})
                          GROUP BY c.id, c.slug";
$revenueByCategoryStmt = $db->prepare($revenueByCategoryQuery);
$revenueByCategoryStmt->execute();
$revenueByCategoryData = $revenueByCategoryStmt->fetchAll();

$revenueByCategory = [];
foreach ($revenueByCategoryData as $item) {
    $revenueByCategory[$item['category_slug']] = (float)$item['revenue'];
}

// Ensure all categories are present (even if 0)
if (!isset($revenueByCategory['banh-kem'])) $revenueByCategory['banh-kem'] = 0;
if (!isset($revenueByCategory['hoa-tuoi'])) $revenueByCategory['hoa-tuoi'] = 0;
if (!isset($revenueByCategory['combo'])) $revenueByCategory['combo'] = 0;

// Revenue chart data (last 7 days)
$chartQuery = "SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as revenue
               FROM orders
               WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
               AND status != 'cancelled'
               GROUP BY DATE(created_at)
               ORDER BY date ASC";
$chartStmt = $db->prepare($chartQuery);
$chartStmt->execute();
$chartData = $chartStmt->fetchAll();

// Format chart data
$formattedChartData = [];
foreach ($chartData as $item) {
    $formattedChartData[] = [
        'date' => $item['date'],
        'revenue' => (float)$item['revenue']
    ];
}

sendJsonResponse(true, 'Lấy thống kê thành công', [
    'total_revenue' => (float)$revenue['total_revenue'],
    'total_orders' => (int)$orders['total_orders'],
    'total_products' => (int)$products['total_products'],
    'total_customers' => (int)$customers['total_customers'],
    'low_stock_count' => (int)$lowStock['low_stock_count'],
    'orders_by_status' => $ordersByStatus,
    'best_selling_products' => $bestSelling,
    'recent_orders' => $recentOrders,
    'chart_data' => $formattedChartData,
    'revenue_by_category' => $revenueByCategory,
    'period' => $period
]);

