<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    // Pagination
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 6;
    $start = ($page - 1) * $limit;

    // Filters
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $category = isset($_GET['category']) ? trim($_GET['category']) : '';

    // Base query
    $where_clauses = ["status = 'published'"];
    $params = [];

    if (!empty($search)) {
        $where_clauses[] = "(title LIKE :search OR content LIKE :search_content)";
        $params[':search'] = "%$search%";
        $params[':search_content'] = "%$search%";
    }

    if (!empty($category)) {
        $where_clauses[] = "category = :category";
        $params[':category'] = $category;
    }

    $where_sql = implode(" AND ", $where_clauses);

    // Count total
    $count_query = "SELECT COUNT(*) as total FROM blog_posts WHERE $where_sql";
    $stmt_count = $db->prepare($count_query);
    foreach ($params as $key => $value) {
        $stmt_count->bindValue($key, $value);
    }
    $stmt_count->execute();
    $row_count = $stmt_count->fetch(PDO::FETCH_ASSOC);
    $total_records = $row_count['total'];
    $total_pages = ceil($total_records / $limit);

    // Get posts
    $query = "SELECT id, title, slug, category, excerpt, image, views, created_at 
              FROM blog_posts 
              WHERE $where_sql 
              ORDER BY created_at DESC 
              LIMIT :limit OFFSET :offset";
              
    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
    $stmt->bindValue(":offset", $start, PDO::PARAM_INT);
    $stmt->execute();

    $posts = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $posts[] = $row;
    }

    echo json_encode([
        "success" => true,
        "data" => $posts,
        "pagination" => [
            "current_page" => $page,
            "total_pages" => $total_pages,
            "total_records" => $total_records
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Lỗi server: " . $e->getMessage()
    ]);
}
?>
