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

    // Count total
    $count_query = "SELECT COUNT(*) as total FROM blog_posts WHERE status = 'published'";
    $stmt_count = $db->prepare($count_query);
    $stmt_count->execute();
    $row_count = $stmt_count->fetch(PDO::FETCH_ASSOC);
    $total_records = $row_count['total'];
    $total_pages = ceil($total_records / $limit);

    // Get posts
    $query = "SELECT id, title, slug, category, excerpt, image, views, created_at 
              FROM blog_posts 
              WHERE status = 'published' 
              ORDER BY created_at DESC 
              LIMIT :start, :limit";
              
    $stmt = $db->prepare($query);
    $stmt->bindParam(":start", $start, PDO::PARAM_INT);
    $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
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
