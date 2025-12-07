<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:8000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
require_once "../connector.php";

function safeJson($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

// Para requisições OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    safeJson(["status" => "ok"]);
}

// Verifica se é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    safeJson(["error" => "Método não permitido"]);
}

// Pega a ação da query string
$action = $_GET['action'] ?? null;

if (!$action) {
    safeJson(["error" => "Ação não especificada"]);
}

// Lê os dados JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    safeJson(["error" => "Dados JSON inválidos"]);
}

try {
    switch ($action) {
        
        // ---------------------------------------------------------
        // LOGIN
        // ---------------------------------------------------------
        case "login":
            if (!isset($data["email"], $data["senha"])) {
                safeJson(["error" => "Email e senha são obrigatórios"]);
            }
            
            $email = $data["email"];
            $senha = $data["senha"];
            
            // Busca usuário pelo email
            $stmt = $pdo->prepare("SELECT * FROM user WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                safeJson(["error" => "Usuário não encontrado"]);
            }
            
            // Verifica a senha (em texto plano por enquanto)
            if ($senha !== $user['senha']) {
                safeJson(["error" => "Senha incorreta"]);
            }
            
            // Remove a senha do objeto de resposta
            unset($user['senha']);
            
            safeJson([
                "message" => "Login realizado com sucesso",
                "user" => $user
            ]);
            break;
            
        // ---------------------------------------------------------
        // REGISTRO
        // ---------------------------------------------------------
        case "register":
            if (!isset($data["nome"], $data["email"], $data["senha"])) {
                safeJson(["error" => "Todos os campos são obrigatórios"]);
            }
            
            $nome = trim($data["nome"]);
            $email = trim($data["email"]);
            $senha = $data["senha"]; // Em produção, usar password_hash()
            
            // Valor padrão para role
            $role = $data["role"] ?? 'aluno';
            
            // Validações básicas
            if (strlen($nome) < 2) {
                safeJson(["error" => "O nome deve ter pelo menos 2 caracteres"]);
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                safeJson(["error" => "E-mail inválido"]);
            }
            
            if (strlen($senha) < 6) {
                safeJson(["error" => "A senha deve ter no mínimo 6 caracteres"]);
            }
            
            // Verifica se email já existe
            $stmt = $pdo->prepare("SELECT id FROM user WHERE email = ?");
            $stmt->execute([$email]);
            
            if ($stmt->fetch()) {
                safeJson(["error" => "Este e-mail já está cadastrado"]);
            }
            
            // Insere o novo usuário
            // EM PRODUÇÃO: Use password_hash($senha, PASSWORD_DEFAULT)
            $stmt = $pdo->prepare("
                INSERT INTO user (nome, email, senha, role) 
                VALUES (?, ?, ?, ?)
            ");
            
            $stmt->execute([$nome, $email, $senha, $role]);
            
            $userId = $pdo->lastInsertId();
            
            // Busca o usuário recém-criado
            $stmt = $pdo->prepare("SELECT id, nome, email, role FROM user WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            safeJson([
                "message" => "Usuário criado com sucesso",
                "user" => $user
            ]);
            break;
            
        default:
            safeJson(["error" => "Ação desconhecida"]);
    }
    
} catch (Exception $e) {
    safeJson(["error" => "Erro no servidor", "details" => $e->getMessage()]);
}
?>