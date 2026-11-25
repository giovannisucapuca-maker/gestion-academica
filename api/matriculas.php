<?php
require_once "cabeceras.php";
require_once "conexion.php";
require_once "auth.php";

$usuario = usuario_autenticado();
$rol     = $usuario["rol"];
$miId    = $usuario["sub"];
$metodo  = $_SERVER["REQUEST_METHOD"];
$id      = isset($_GET["id"]) ? (int) $_GET["id"] : null;
$cursoId = isset($_GET["curso_id"]) ? (int) $_GET["curso_id"] : null;

// Cada matrícula viene con los datos del curso y del estudiante (JOIN)
const SELECT_MATRICULAS = "
    SELECT m.id, m.fecha,
           m.curso_id, c.nombre AS curso, c.creditos,
           m.estudiante_id, u.nombre AS estudiante, u.email AS estudiante_email
    FROM matriculas m
    JOIN cursos c   ON c.id = m.curso_id
    JOIN usuarios u ON u.id = m.estudiante_id";

function buscar_curso(PDO $conexion, int $id): array
{
    $stmt = $conexion->prepare(
        "SELECT c.*, (SELECT COUNT(*) FROM matriculas m WHERE m.curso_id = c.id) AS inscritos
         FROM cursos c WHERE c.id = ?"
    );
    $stmt->execute([$id]);
    $curso = $stmt->fetch();
    if (!$curso) {
        responder(404, ["mensaje" => "Curso no encontrado"]);
    }
    return $curso;
}

function buscar_matricula(PDO $conexion, int $id): array
{
    $stmt = $conexion->prepare(SELECT_MATRICULAS . " WHERE m.id = ?");
    $stmt->execute([$id]);
    $matricula = $stmt->fetch();
    if (!$matricula) {
        responder(404, ["mensaje" => "Matrícula no encontrada"]);
    }
    return $matricula;
}

switch ($metodo) {
    case "GET":
        // GET matriculas.php?curso_id=N → alumnos inscritos en un curso
        if ($cursoId) {
            exigir_rol($usuario, ["admin", "profesor"]);
            $curso = buscar_curso($conexion, $cursoId);
            if ($rol === "profesor" && (int) $curso["profesor_id"] !== $miId) {
                responder(403, ["mensaje" => "Solo puedes ver los alumnos de tus cursos"]);
            }
            $stmt = $conexion->prepare(SELECT_MATRICULAS . " WHERE m.curso_id = ? ORDER BY u.nombre");
            $stmt->execute([$cursoId]);
            responder(200, $stmt->fetchAll());
        }

        // GET matriculas.php → lo que devuelve DEPENDE DEL ROL
        if ($rol === "estudiante") {
            $stmt = $conexion->prepare(SELECT_MATRICULAS . " WHERE m.estudiante_id = ? ORDER BY c.nombre");
            $stmt->execute([$miId]);
        } elseif ($rol === "profesor") {
            $stmt = $conexion->prepare(SELECT_MATRICULAS . " WHERE c.profesor_id = ? ORDER BY m.fecha DESC");
            $stmt->execute([$miId]);
        } else {
            $stmt = $conexion->query(SELECT_MATRICULAS . " ORDER BY m.fecha DESC");
        }
        responder(200, $stmt->fetchAll());

    case "POST":
        // Solo el estudiante se matricula a sí mismo
        exigir_rol($usuario, ["estudiante"]);
        $cursoId = (int) (leer_json()["curso_id"] ?? 0);
        $curso = buscar_curso($conexion, $cursoId);

        $stmt = $conexion->prepare("SELECT COUNT(*) FROM matriculas WHERE estudiante_id = ? AND curso_id = ?");
        $stmt->execute([$miId, $cursoId]);
        if ($stmt->fetchColumn() > 0) {
            responder(409, ["mensaje" => "Ya estás matriculado en este curso"]);
        }

        if ((int) $curso["inscritos"] >= (int) $curso["cupos"]) {
            responder(409, ["mensaje" => "El curso ya no tiene cupos disponibles"]);
        }

        // ¿Alguna clase del curso nuevo se cruza con un curso en el que YA estoy matriculado?
        $stmt = $conexion->prepare(
            "SELECT c.nombre
             FROM horarios nuevo
             JOIN horarios mio  ON mio.dia = nuevo.dia
                               AND mio.hora_inicio < nuevo.hora_fin
                               AND mio.hora_fin > nuevo.hora_inicio
             JOIN matriculas m  ON m.curso_id = mio.curso_id
             JOIN cursos c      ON c.id = mio.curso_id
             WHERE nuevo.curso_id = ? AND m.estudiante_id = ?
             LIMIT 1"
        );
        $stmt->execute([$cursoId, $miId]);
        $cruce = $stmt->fetchColumn();
        if ($cruce) {
            responder(409, ["mensaje" => "Cruce de horario con el curso $cruce"]);
        }

        $conexion->prepare("INSERT INTO matriculas (estudiante_id, curso_id) VALUES (?, ?)")
                 ->execute([$miId, $cursoId]);
        responder(201, buscar_matricula($conexion, (int) $conexion->lastInsertId()));

    case "DELETE":
        // El estudiante anula SU matrícula; el admin puede anular cualquiera
        exigir_rol($usuario, ["estudiante", "admin"]);
        if (!$id) responder(400, ["mensaje" => "Falta el id de la matrícula"]);
        $matricula = buscar_matricula($conexion, $id);
        if ($rol === "estudiante" && (int) $matricula["estudiante_id"] !== $miId) {
            responder(403, ["mensaje" => "No puedes anular la matrícula de otro estudiante"]);
        }
        $conexion->prepare("DELETE FROM matriculas WHERE id = ?")->execute([$id]);
        responder(200, ["mensaje" => "Matrícula anulada"]);

    default:
        responder(405, ["mensaje" => "Método no permitido"]);
}