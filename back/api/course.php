<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:8000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
require_once "../connector.php";

function safeJson($data)
{
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
        // BUSCAR CURSO POR ID (com dados reais)
        // ---------------------------------------------------------
        case "getCourse":
            $courseId = $_GET['id'] ?? null;

            if (!$courseId) {
                safeJson(["error" => "ID do curso não informado"]);
            }

            // Busca o curso com informações do criador
            $stmt = $pdo->prepare("
                SELECT 
                    c.*, 
                    u.nome as creator_name 
                FROM course c
                LEFT JOIN user u ON c.idCreator = u.id
                WHERE c.id = ?
            ");

            $stmt->execute([$courseId]);
            $course = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$course) {
                safeJson(["error" => "Curso não encontrado"]);
            }

            // Formata as datas para exibição
            if ($course['created_at']) {
                $createdDate = new DateTime($course['created_at']);
                $course['created_at_formatted'] = $createdDate->format('d/m/Y');
            }

            if ($course['modified_at']) {
                $modifiedDate = new DateTime($course['modified_at']);
                $course['modified_at_formatted'] = $modifiedDate->format('d/m/Y');
            }

            safeJson([
                "message" => "Curso carregado com sucesso",
                "course" => $course
            ]);
            break;

        // ---------------------------------------------------------
        // VERIFICAR INSCRIÇÃO DO USUÁRIO
        // ---------------------------------------------------------
        case "checkEnrollment":
            $userId = $_GET['userId'] ?? null;
            $courseId = $_GET['courseId'] ?? null;

            if (!$userId || !$courseId) {
                safeJson(["error" => "IDs não informados"]);
            }

            $stmt = $pdo->prepare("
                SELECT id, watched_at 
                FROM userCourse 
                WHERE iduser = ? AND idcourse = ?
                LIMIT 1
            ");

            $stmt->execute([$userId, $courseId]);
            $enrollment = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$enrollment) {
                safeJson(["error" => "Usuário não inscrito"]);
            }

            safeJson([
                "enrolled" => true,
                "watched_at" => $enrollment['watched_at']
            ]);
            break;

        // ---------------------------------------------------------
        // BUSCAR PROGRESSO DO USUÁRIO NO CURSO
        // ---------------------------------------------------------
        case "getCourseProgress":
            $userId = $_GET['userId'] ?? null;
            $courseId = $_GET['courseId'] ?? null;

            if (!$userId || !$courseId) {
                safeJson(["error" => "IDs não informados"]);
            }

            // Verifica inscrição
            $stmt = $pdo->prepare("
                SELECT watched_at 
                FROM userCourse 
                WHERE iduser = ? AND idcourse = ?
                LIMIT 1
            ");

            $stmt->execute([$userId, $courseId]);
            $enrollment = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$enrollment) {
                safeJson(["error" => "Usuário não inscrito"]);
            }

            // Calcula progresso
            $progress = $enrollment['watched_at'] ? 100 : 0;

            // Para simplicidade, assumimos que todos os cursos têm 10 aulas
            $totalLessons = 10;
            $completedLessons = $enrollment['watched_at'] ? $totalLessons : 0;

            safeJson([
                "progress" => $progress,
                "total_lessons" => $totalLessons,
                "completed_lessons" => $completedLessons,
                "watched_at" => $enrollment['watched_at']
            ]);
            break;
        // ---------------------------------------------------------
        // BUSCAR Os últimos 3 Cursos Para o Slider de Home
        // ---------------------------------------------------------
        case "getLatestCourses":
            $limit = min(10, max(1, intval($_GET['limit'] ?? 3)));

            // Busca os últimos cursos criados
            $stmt = $pdo->prepare("
            SELECT c.*, u.nome as creator_name 
            FROM course c
            LEFT JOIN user u ON c.idCreator = u.id
            ORDER BY c.created_at DESC 
            LIMIT ?
            ");

            $stmt->execute([$limit]);
            $courses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            safeJson([
                "message" => "Últimos cursos carregados",
                "count" => count($courses),
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