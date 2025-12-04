<?php
$host = 'localhost';
$dbname = 'app_db';
$username = 'dev_user';
$password = 'devpassword';
$port = '3333';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$dbname;port=$port;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $username, $password, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "erro" => "Erro ao conectar ao banco",
        "mensagem" => $e->getMessage()
    ]);
    exit;
}
