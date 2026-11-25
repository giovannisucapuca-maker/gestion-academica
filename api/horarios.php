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

// Cada sesión de clase con el nombre del curso y del profesor
const SELECT_HORARIOS = "
    SELECT h.id, h.curso_id, h.dia, h.hora_inicio, h.hora_fin, h.aula,
           c.nombre AS curso, c.profesor_id, u.nombre AS profesor
    FROM horarios h
    JOIN cursos c ON c.id = h.curso_id
    LEFT JOIN usuarios u ON u.id = c.profesor_id";

const ORDEN = " ORDER BY h.dia, h.hora_inicio";

// "8:00" o "08:00:00" → "08:00:00" (formato TIME de MySQL)
function normalizar_hora(string $hora): ?string
{
    if (!preg_match('/^(\d{1,2}):(\d{2})(:\d{2})?$/', trim($hora), $p)) {
        return null;
    }
    $h = (int) $p[1];
    $m = (int) $p[2];
    if ($h > 23 || $m > 59) {
        return null;
    }
    return sprintf("%02d:%02d:00", $h, $m);
}

function buscar_curso(PDO $conexion, int $id): array
{
    $stmt = $conexion->prepare("SELECT * FROM cursos WHERE id = ?");
    $stmt->execute([$id]);
    $curso = $stmt->fetch();
    if (!$curso) {
        responder(404, ["mensaje" => "Curso no encontrado"]);
    }
    return $curso;
}

// Admin: cualquier curso · Profesor: solo los suyos
function exigir_gestion(array $curso, string $rol, int $miId): void
{
    if ($rol === "admin") return;
    if ($rol === "profesor" && (int) $curso["profesor_id"] === $miId) return;
    responder(403, ["mensaje" => "Solo puedes gestionar el horario de tus cursos"]);
}

switch ($metodo) {
    case "GET":
        // GET horarios.php?curso_id=N → horario de un curso (cualquier usuario logueado)
        if ($cursoId) {
            $stmt = $conexion->prepare(SELECT_HORARIOS . " WHERE h.curso_id = ?" . ORDEN);
            $stmt->execute([$cursoId]);
            responder(200, $stmt->fetchAll());
        }

        // GET horarios.php → "mi horario" según el rol
        if ($rol === "estudiante") {
            $stmt = $conexion->prepare(
                SELECT_HORARIOS . " JOIN matriculas m ON m.curso_id = h.curso_id WHERE m.estudiante_id = ?" . ORDEN
            );
            $stmt->execute([$miId]);
        } elseif ($rol === "profesor") {
            $stmt = $conexion->prepare(SELECT_HORARIOS . " WHERE c.profesor_id = ?" . ORDEN);
            $stmt->execute([$miId]);
        } else {
            $stmt = $conexion->query(SELECT_HORARIOS . ORDEN);
        }
        responder(200, $stmt->fetchAll());

    case "POST":
        exigir_rol($usuario, ["admin", "profesor"]);
        $d = leer_json();
        $curso = buscar_curso($conexion, (int) ($d["curso_id"] ?? 0));
        exigir_gestion($curso, $rol, $miId);

        $dia    = (int) ($d["dia"] ?? 0);
        $inicio = normalizar_hora($d["hora_inicio"] ?? "");
        $fin    = normalizar_hora($d["hora_fin"] ?? "");
        $aula   = strtoupper(trim($d["aula"] ?? ""));

        if ($dia < 1 || $dia > 6) {
            responder(400, ["mensaje" => "El día debe ser de lunes (1) a sábado (6)"]);
        }
        if (!$inicio || !$fin || $inicio >= $fin) {
            responder(400, ["mensaje" => "La hora de inicio debe ser menor que la hora de fin"]);
        }
        if ($inicio < "07:00:00" || $fin > "22:00:00") {
            responder(400, ["mensaje" => "Las clases deben estar entre las 07:00 y las 22:00"]);
        }
        if ($aula === "") {
            responder(400, ["mensaje" => "El aula es obligatoria"]);
        }

        // CRUCE 1 — ¿Choca con otra clase en la MISMA aula, el MISMO día?
        // Dos intervalos se cruzan si: inicioA < finB  Y  finA > inicioB
        $stmt = $conexion->prepare(
            "SELECT c.nombre FROM horarios h JOIN cursos c ON c.id = h.curso_id
             WHERE h.aula = ? AND h.dia = ? AND h.hora_inicio < ? AND h.hora_fin > ?"
        );
        $stmt->execute([$aula, $dia, $fin, $inicio]);
        $choque = $stmt->fetchColumn();
        if ($choque) {
            responder(409, ["mensaje" => "El aula $aula ya está ocupada a esa hora por $choque"]);
        }

        // CRUCE 2 — ¿El PROFESOR del curso ya dicta otra clase ese día a esa hora (en cualquier aula)?
        if ($curso["profesor_id"]) {
            $stmt = $conexion->prepare(
                "SELECT c.nombre FROM horarios h JOIN cursos c ON c.id = h.curso_id
                 WHERE c.profesor_id = ? AND h.dia = ? AND h.hora_inicio < ? AND h.hora_fin > ?"
            );
            $stmt->execute([(int) $curso["profesor_id"], $dia, $fin, $inicio]);
            $choqueProfesor = $stmt->fetchColumn();
            if ($choqueProfesor) {
                responder(409, ["mensaje" => "El profesor ya dicta $choqueProfesor en ese horario"]);
            }
        }

        $conexion->prepare("INSERT INTO horarios (curso_id, dia, hora_inicio, hora_fin, aula) VALUES (?, ?, ?, ?, ?)")
                 ->execute([(int) $curso["id"], $dia, $inicio, $fin, $aula]);

        $stmt = $conexion->prepare(SELECT_HORARIOS . " WHERE h.id = ?");
        $stmt->execute([(int) $conexion->lastInsertId()]);
        responder(201, $stmt->fetch());

    case "DELETE":
        exigir_rol($usuario, ["admin", "profesor"]);
        if (!$id) responder(400, ["mensaje" => "Falta el id del horario"]);
        $stmt = $conexion->prepare(SELECT_HORARIOS . " WHERE h.id = ?");
        $stmt->execute([$id]);
        $horario = $stmt->fetch();
        if (!$horario) {
            responder(404, ["mensaje" => "Horario no encontrado"]);
        }
        exigir_gestion($horario, $rol, $miId);
        $conexion->prepare("DELETE FROM horarios WHERE id = ?")->execute([$id]);
        responder(200, ["mensaje" => "Sesión de clase eliminada"]);

    default:
        responder(405, ["mensaje" => "Método no permitido"]);
}