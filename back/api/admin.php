<?php
header("Content-Type: application/json; charset=UTF-8");
require_once "../connector.php";

// Forçar retorno JSON mesmo em erro fatal
function safeJson($data) {
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$action = $_GET["action"] ?? $_POST["action"] ?? null;

if (!$action) {
    safeJson(["error" => "Ação não especificada"]);
}

try {

    switch ($action) {

        // ---------------------------------------------------------
        // LISTAR CURSOS
        // ---------------------------------------------------------
        case "listarCurso":
            $stmt = $pdo->query("SELECT * FROM course ORDER BY id DESC");
            $cursos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            safeJson($cursos);
        break;


        // ---------------------------------------------------------
        // CRIAR CURSO
        // ---------------------------------------------------------
        case "criarCurso":
            $data = json_decode(file_get_contents("php://input"), true);

            if (!$data || !isset($data["idCreator"], $data["name"])) {
                safeJson(["error" => "Campos obrigatórios não enviados"]);
            }

            $stmt = $pdo->prepare("
                INSERT INTO course (idCreator, name, description, urlImage)
                VALUES (?, ?, ?, ?)
            ");

            $stmt->execute([
                $data["idCreator"],
                $data["name"],
                $data["description"] ?? null,
                $data["urlImage"] ?? null
            ]);

            safeJson(["message" => "Curso criado com sucesso"]);
        break;


        // ---------------------------------------------------------
        // DELETAR CURSO
        // ---------------------------------------------------------
        case "deletarCurso":
            $id = $_GET["id"] ?? null;

            if (!$id) {
                safeJson(["error" => "ID não informado"]);
            }

            $stmt = $pdo->prepare("DELETE FROM course WHERE id = ?");
            $stmt->execute([$id]);

            safeJson(["message" => "Curso deletado"]);
        break;


        // ---------------------------------------------------------
        // MODIFICAR CURSO
        // ---------------------------------------------------------
        case "modificarCurso":
            $data = json_decode(file_get_contents("php://input"), true);

            if (!$data || !isset($data["id"])) {
                safeJson(["error" => "ID do curso não enviado"]);
            }

            $stmt = $pdo->prepare("
                UPDATE course
                SET name = ?, description = ?, urlImage = ?, idCreator = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $data["name"],
                $data["description"] ?? null,
                $data["urlImage"] ?? null,
                $data["idCreator"],
                $data["id"]
            ]);

            safeJson(["message" => "Curso modificado"]);
        break;


        // ---------------------------------------------------------
        default:
            safeJson(["error" => "Ação desconhecida"]);
    }

} catch (Exception $e) {
    safeJson(["error" => "Erro no servidor", "details" => $e->getMessage()]);
}
?>
