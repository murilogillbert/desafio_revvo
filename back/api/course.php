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
        // BUSCAR CURSO POR ID
        // ---------------------------------------------------------
        case "getCourse":
            $courseId = $_GET['id'] ?? null;
            
            if (!$courseId) {
                safeJson(["error" => "ID do curso não informado"]);
            }
            
            // Busca o curso
            $stmt = $pdo->prepare("
                SELECT c.*, u.nome as creator_name 
                FROM course c
                LEFT JOIN user u ON c.idCreator = u.id
                WHERE c.id = ?
            ");
            
            $stmt->execute([$courseId]);
            $course = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$course) {
                safeJson(["error" => "Curso não encontrado"]);
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
            
            // Calcula progresso (exemplo simplificado)
            // Em produção, isso consideraria aulas assistidas
            $progress = $enrollment['watched_at'] ? 100 : 0;
            
            // Contagem de aulas (exemplo fixo - em produção viria de tabela de aulas)
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
        // BUSCAR MÓDULOS DO CURSO
        // ---------------------------------------------------------
        case "getCourseModules":
            $courseId = $_GET['courseId'] ?? null;
            
            if (!$courseId) {
                safeJson(["error" => "ID do curso não informado"]);
            }
            
            // Em produção, isso buscaria de uma tabela 'module' e 'lesson'
            // Aqui retornamos dados de exemplo
            $modules = [
                [
                    'id' => 1,
                    'title' => 'Introdução ao Curso',
                    'description' => 'Conheça o curso e prepare seu ambiente',
                    'lessons' => [
                        [
                            'id' => 1,
                            'title' => 'Bem-vindo ao curso',
                            'description' => 'Apresentação geral do curso',
                            'duration' => '5:00',
                            'video_url' => null
                        ],
                        [
                            'id' => 2,
                            'title' => 'Configuração do ambiente',
                            'description' => 'Preparando tudo para começar',
                            'duration' => '15:00',
                            'video_url' => null
                        ]
                    ]
                ],
                [
                    'id' => 2,
                    'title' => 'Conceitos Fundamentais',
                    'description' => 'Aprenda os fundamentos necessários',
                    'lessons' => [
                        [
                            'id' => 3,
                            'title' => 'O que é?',
                            'description' => 'Entendendo o conceito principal',
                            'duration' => '20:00',
                            'video_url' => null
                        ],
                        [
                            'id' => 4,
                            'title' => 'Primeiros passos',
                            'description' => 'Começando a praticar',
                            'duration' => '25:00',
                            'video_url' => null
                        ]
                    ]
                ]
            ];
            
            safeJson([
                "message" => "Módulos carregados",
                "modules" => $modules
            ]);
            break;
            
        // ---------------------------------------------------------
        // BUSCAR ESTATÍSTICAS DO CURSO
        // ---------------------------------------------------------
        case "getCourseStats":
            $courseId = $_GET['courseId'] ?? null;
            
            if (!$courseId) {
                safeJson(["error" => "ID do curso não informado"]);
            }
            
            // Conta alunos inscritos
            $stmt = $pdo->prepare("
                SELECT COUNT(*) as total_students 
                FROM userCourse 
                WHERE idcourse = ?
            ");
            $stmt->execute([$courseId]);
            $students = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Calcula taxa de conclusão
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN watched_at IS NOT NULL THEN 1 ELSE 0 END) as completed
                FROM userCourse 
                WHERE idcourse = ?
            ");
            $stmt->execute([$courseId]);
            $completion = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Média de avaliação (exemplo fixo - em produção viria de tabela de avaliações)
            $average_rating = 4.5;
            
            safeJson([
                "total_students" => $students['total_students'] ?? 0,
                "completion_rate" => $completion['total'] > 0 ? 
                    round(($completion['completed'] / $completion['total']) * 100, 1) : 0,
                "average_rating" => $average_rating,
                "total_ratings" => rand(50, 200) // Exemplo
            ]);
            break;
            
        // ---------------------------------------------------------
        // MARCAR AULA COMO ASSISTIDA
        // ---------------------------------------------------------
        case "markLessonWatched":
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data["userId"], $data["courseId"], $data["lessonId"])) {
                safeJson(["error" => "Dados incompletos"]);
            }
            
            // Em produção, isso atualizaria uma tabela 'user_lesson_progress'
            // Aqui apenas retornamos sucesso
            
            safeJson([
                "message" => "Aula marcada como assistida"
            ]);
            break;
            
        default:
            safeJson(["error" => "Ação desconhecida"]);
    }
    
} catch (Exception $e) {
    safeJson(["error" => "Erro no servidor", "details" => $e->getMessage()]);
}
?>