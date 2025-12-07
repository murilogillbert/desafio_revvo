<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:8000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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

// Verifica a ação
$action = $_GET['action'] ?? null;

if (!$action) {
    safeJson(["error" => "Ação não especificada"]);
}

try {
    switch ($action) {
        
        // ---------------------------------------------------------
        // BUSCAR CURSOS COM PAGINAÇÃO E FILTROS SIMPLES
        // ---------------------------------------------------------
        case "getCourses":
            // Parâmetros de paginação
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;
            
            // Parâmetros de filtro
            $search = $_GET['search'] ?? '';
            $sort = $_GET['sort'] ?? 'newest';
            
            // Construir query base
            $sql = "SELECT SQL_CALC_FOUND_ROWS c.*, u.nome as creator_name 
                    FROM course c
                    LEFT JOIN user u ON c.idCreator = u.id
                    WHERE 1=1";
            
            $params = [];
            
            // Aplicar filtro de busca
            if (!empty($search)) {
                $sql .= " AND (c.name LIKE ? OR c.description LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
            }
            
            // Aplicar ordenação
            switch ($sort) {
                case 'oldest':
                    $sql .= " ORDER BY c.created_at ASC";
                    break;
                case 'name_asc':
                    $sql .= " ORDER BY c.name ASC";
                    break;
                case 'name_desc':
                    $sql .= " ORDER BY c.name DESC";
                    break;
                case 'newest':
                default:
                    $sql .= " ORDER BY c.created_at DESC";
                    break;
            }
            
            // Adicionar paginação
            $sql .= " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            
            // Executar query
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Contar total de registros
            $stmt = $pdo->query("SELECT FOUND_ROWS() as total");
            $total = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
            
            // Se usuário está logado, verificar inscrição em cada curso
            $userId = $_GET['userId'] ?? null;
            if ($userId) {
                foreach ($courses as &$course) {
                    // Verificar se usuário está inscrito
                    $stmt = $pdo->prepare("
                        SELECT watched_at 
                        FROM userCourse 
                        WHERE iduser = ? AND idcourse = ?
                    ");
                    $stmt->execute([$userId, $course['id']]);
                    $enrollment = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    if ($enrollment) {
                        $course['user_enrolled'] = true;
                        $course['watched_at'] = $enrollment['watched_at'];
                    } else {
                        $course['user_enrolled'] = false;
                        $course['watched_at'] = null;
                    }
                }
            }
            
            safeJson([
                "message" => "Cursos carregados com sucesso",
                "page" => $page,
                "limit" => $limit,
                "total" => $total,
                "courses" => $courses
            ]);
            break;
            
        default:
            safeJson(["error" => "Ação desconhecida"]);
    }
    
} catch (Exception $e) {
    safeJson(["error" => "Erro no servidor", "details" => $e->getMessage()]);
}
?>