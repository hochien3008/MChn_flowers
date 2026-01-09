<?php
/**
 * Database Connection Class
 */

require_once __DIR__ . '/config.php';

class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $charset = DB_CHARSET;
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch(PDOException $exception) {
            error_log("Database connection error: " . $exception->getMessage());
            if (APP_ENV === 'development') {
                die(json_encode([
                    'success' => false,
                    'message' => "Database connection error: " . $exception->getMessage()
                ]));
            } else {
                die(json_encode([
                    'success' => false,
                    'message' => 'Database connection failed. Please contact administrator.'
                ]));
            }
        }

        return $this->conn;
    }
}

