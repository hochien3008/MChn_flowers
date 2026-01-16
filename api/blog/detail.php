<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once '../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $slug = isset($_GET['slug']) ? $_GET['slug'] : null;
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;

    if (!$slug && !$id) {
        throw new Exception("Missing slug or id");
    }

    // Build Query
    $query = "SELECT p.*, u.full_name as author_name 
              FROM blog_posts p 
              LEFT JOIN users u ON p.author_id = u.id 
              WHERE p.status = 'published' AND ";
              
    if ($slug) {
        $query .= "p.slug = :slug";
    } else {
        $query .= "p.id = :id";
    }

    $stmt = $db->prepare($query);
    
    if ($slug) {
        $stmt->bindParam(":slug", $slug);
    } else {
        $stmt->bindParam(":id", $id);
    }
    
    $stmt->execute();
    $post = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$post) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Post not found"]);
        exit;
    }

    // Increment Views
    $update_views = "UPDATE blog_posts SET views = views + 1 WHERE id = :id";
    $stmt_views = $db->prepare($update_views);
    $stmt_views->bindValue(":id", $post['id']);
    $stmt_views->execute();

    echo json_encode([
        "success" => true,
        "data" => $post
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server Error: " . $e->getMessage()
    ]);
}
?>
