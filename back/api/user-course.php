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
        // BUSCAR CURSOS DO USUÁRIO
        // ---------------------------------------------------------
        case "getUserCourses":
            $userId = $_GET['userId'] ?? null;
            
            if (!$userId) {
                safeJson(["error" => "ID do usuário não informado"]);
            }
            
            // Busca os cursos do usuário com informações de progresso
            $stmt = $pdo->prepare("
                SELECT 
                    c.*,
                    uc.watched_at,
                    uc.id as user_course_id,
                    CASE 
                        WHEN uc.watched_at IS NOT NULL THEN 100
                        ELSE 0 
                    END as progress
                FROM userCourse uc
                JOIN course c ON uc.idcourse = c.id
                WHERE uc.iduser = ?
                ORDER BY uc.watched_at DESC, c.created_at DESC
            ");
            
            $stmt->execute([$userId]);
            $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            safeJson([
                "message" => "Cursos carregados com sucesso",
                "count" => count($courses),
                "courses" => $courses
            ]);
            break;
            
        // ---------------------------------------------------------
        // BUSCAR CURSOS EM DESTAQUE (para visitantes)
        // ---------------------------------------------------------
        case "getFeaturedCourses":
            // Busca cursos mais populares/com mais inscrições
            $stmt = $pdo->prepare("
                SELECT 
                    c.*,
                    COUNT(uc.id) as student_count,
                    ROUND(AVG(
                        CASE 
                            WHEN uc.watched_at IS NOT NULL THEN 100
                            ELSE 0 
                        END
                    ), 1) as avg_rating
                FROM course c
                LEFT JOIN userCourse uc ON c.id = uc.idcourse
                GROUP BY c.id
                ORDER BY student_count DESC, c.created_at DESC
                LIMIT 6
            ");
            
            $stmt->execute();
            $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Formata os dados para exibição
            foreach ($courses as &$course) {
                $course['rating'] = number_format($course['avg_rating'] / 20, 1); // Converte para escala 0-5
                $course['lesson_count'] = rand(8, 20); // Exemplo, pode ser substituído por dados reais
                unset($course['avg_rating']);
            }
            
            safeJson([
                "message" => "Cursos em destaque carregados",
                "count" => count($courses),
                "courses" => $courses
            ]);
            break;
            
        // ---------------------------------------------------------
        // INSCREVER USUÁRIO EM UM CURSO
        // ---------------------------------------------------------
        case "enrollCourse":
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data["userId"], $data["courseId"])) {
                safeJson(["error" => "Dados incompletos"]);
            }
            
            $userId = $data["userId"];
            $courseId = $data["courseId"];
            
            // Verifica se o usuário já está inscrito
            $stmt = $pdo->prepare("
                SELECT id FROM userCourse 
                WHERE iduser = ? AND idcourse = ?
            ");
            $stmt->execute([$userId, $courseId]);
            
            if ($stmt->fetch()) {
                safeJson(["error" => "Usuário já inscrito neste curso"]);
            }
            
            // Inscreve o usuário no curso
            $stmt = $pdo->prepare("
                INSERT INTO userCourse (iduser, idcourse) 
                VALUES (?, ?)
            ");
            
            $stmt->execute([$userId, $courseId]);
            $enrollmentId = $pdo->lastInsertId();
            
            safeJson([
                "message" => "Inscrição realizada com sucesso",
                "enrollmentId" => $enrollmentId
            ]);
            break;
            
        // ---------------------------------------------------------
        // MARCAR CURSO COMO ASSISTIDO
        // ---------------------------------------------------------
        case "markAsWatched":
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data["userCourseId"])) {
                safeJson(["error" => "ID da inscrição não informado"]);
            }
            
            $userCourseId = $data["userCourseId"];
            
            $stmt = $pdo->prepare("
                UPDATE userCourse 
                SET watched_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ");
            
            $stmt->execute([$userCourseId]);
            
            safeJson([
                "message" => "Curso marcado como assistido"
            ]);
            break;
            
        // ---------------------------------------------------------
        // REMOVER INSCRIÇÃO
        // ---------------------------------------------------------
        case "removeEnrollment":
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data["userCourseId"])) {
                safeJson(["error" => "ID da inscrição não informado"]);
            }
            
            $userCourseId = $data["userCourseId"];
            
            $stmt = $pdo->prepare("
                DELETE FROM userCourse 
                WHERE id = ?
            ");
            
            $stmt->execute([$userCourseId]);
            
            safeJson([
                "message" => "Inscrição removida com sucesso"
            ]);
            break;
            
        default:
            safeJson(["error" => "Ação desconhecida"]);
    }
    
} catch (Exception $e) {
    safeJson(["error" => "Erro no servidor", "details" => $e->getMessage()]);
}
?>