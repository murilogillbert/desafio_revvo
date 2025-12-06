<?php
header("Content-Type: application/json; charset=UTF-8");
require_once "../connector.php";

function safeJson($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $_GET["action"] ?? ($_POST["action"] ?? null);

if (!$action) {
    safeJson(["error" => "Ação não especificada"]);
}

try {
    switch ($action) {
        
        // ---------------------------------------------------------
        // LOGIN
        // ---------------------------------------------------------
        case "login":
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!$data || !isset($data["email"], $data["senha"])) {
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
            
            // Verifica a senha (em produção, use password_hash/password_verify)
            // NOTA: No seu INSERT inicial, a senha está em texto plano: 'admin'
            // Em produção, você deve usar:
            // $hashedPassword = password_hash($senha, PASSWORD_DEFAULT);
            // E verificar com: password_verify($senha, $user['senha'])
            
            if ($senha !== $user['senha']) {
                safeJson(["error" => "Senha incorreta"]);
            }
            
            // Remove a senha do objeto de resposta
            unset($user['senha']);
            
            // Aqui você pode gerar um token JWT em produção
            // $token = generateJWT($user);
            // $user['token'] = $token;
            
            safeJson([
                "message" => "Login realizado com sucesso",
                "user" => $user
            ]);
            break;
            
        // ---------------------------------------------------------
        // VALIDAR SESSÃO (simplificado)
        // ---------------------------------------------------------
        case "validate":
            // Em produção, você validaria um token JWT
            // Por enquanto, apenas retorna sucesso se o token existir
            $headers = getallheaders();
            $authHeader = $headers['Authorization'] ?? '';
            
            if (strpos($authHeader, 'Bearer ') === 0) {
                $token = substr($authHeader, 7);
                // Validar token aqui (não implementado neste exemplo)
                safeJson(["valid" => true]);
            }
            
            safeJson(["error" => "Token não fornecido"]);
            break;
            
        // ---------------------------------------------------------
        // REGISTRAR USUÁRIO (opcional)
        // ---------------------------------------------------------
        case "register":
            $data = json_decode(file_get_contents("php://input"), true);
            
            if (!$data || !isset($data["nome"], $data["email"], $data["senha"])) {
                safeJson(["error" => "Dados incompletos"]);
            }
            
            // Verifica se email já existe
            $stmt = $pdo->prepare("SELECT id FROM user WHERE email = ?");
            $stmt->execute([$data["email"]]);
            
            if ($stmt->fetch()) {
                safeJson(["error" => "Email já cadastrado"]);
            }
            
            // Hash da senha (em produção)
            // $hashedPassword = password_hash($data["senha"], PASSWORD_DEFAULT);
            $hashedPassword = $data["senha"]; // Temporário
            
            $stmt = $pdo->prepare("
                INSERT INTO user (nome, email, senha, role) 
                VALUES (?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data["nome"],
                $data["email"],
                $hashedPassword,
                $data["role"] ?? "aluno" // Por padrão, cria como aluno
            ]);
            
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