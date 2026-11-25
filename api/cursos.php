<?php
require_once "cabeceras.php";
require_once "conexion.php";
require_once "auth.php";

$usuario = usuario_autenticado();
$metodo  = $_SERVER["REQUEST_METHOD"];
$id      = isset($_GET["id"]) ? (int) $_GET["id"] : null;

// Cada curso viene con el NOMBRE del profesor y la cantidad de INSCRITOS
const SELECT_CURSOS = "
    SELECT c.*,
           u.nombre AS profesor,
           (SELECT COUNT(*) FROM matriculas m WHERE m.curso_id = c.id) AS inscritos
    FROM cursos c
    LEFT JOIN usuarios u ON u.id = c.profesor_id";

function validar_curso(array $d, array $usuario): array
{
    $nombre   = trim($d["nombre"] ?? "");
    $creditos = (int) ($d["creditos"] ?? 0);
    $cupos    = (int) ($d["cupos"] ?? 30);

    if (mb_strlen($nombre) < 3 || $creditos < 1 || $creditos > 6 || $cupos < 1) {
        responder(400, ["mensaje" => "Nombre (mín. 3 letras), créditos (1 a 6) y cupos son obligatorios"]);
    }

    $profesorId = $usuario["rol"] === "profesor"
        ? $usuario["sub"]
        : (isset($d["profesor_id"]) ? (int) $d["profesor_id"] : null);

    return [$nombre, trim($d["descripcion"] ?? ""), $creditos, $cupos, $profesorId];
}

function buscar_curso(PDO $conexion, int $id): array
{
    $stmt = $conexion->prepare(SELECT_CURSOS . " WHERE c.id = ?");
    $stmt->execute([$id]);
    $curso = $stmt->fetch();
    if (!$curso) {
        responder(404, ["mensaje" => "Curso no encontrado"]);
    }
    return $curso;
}

switch ($metodo) {
    case "GET":
        if ($id) {
            responder(200, buscar_curso($conexion, $id));
        }
        $cursos = $conexion->query(SELECT_CURSOS . " ORDER BY c.id")->fetchAll();
        responder(200, $cursos);

    case "POST":
        exigir_rol($usuario, ["admin", "profesor"]);
        $datos = validar_curso(leer_json(), $usuario);
        $stmt = $conexion->prepare(
            "INSERT INTO cursos (nombre, descripcion, creditos, cupos, profesor_id) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute($datos);
        responder(201, buscar_curso($conexion, (int) $conexion->lastInsertId()));

    case "PUT":
        exigir_rol($usuario, ["admin", "profesor"]);
        if (!$id) responder(400, ["mensaje" => "Falta el id del curso"]);
        $actual = buscar_curso($conexion, $id);
        $datos = validar_curso(leer_json(), $usuario);

        // $datos[3] = cupos nuevos
        if ($datos[3] < (int) $actual["inscritos"]) {
            responder(400, ["mensaje" => "Los cupos no pueden ser menos que los {$actual['inscritos']} alumnos ya matriculados"]);
        }

        // $datos[4] = profesor nuevo
        // Si cambia el profesor: ¿el nuevo profesor ya tiene clase a la misma hora que este curso?
        $nuevoProfesor = $datos[4];
        if ($nuevoProfesor && $nuevoProfesor !== (int) $actual["profesor_id"]) {
            $stmt = $conexion->prepare(
                "SELECT otro.nombre
                 FROM horarios h1
                 JOIN horarios h2 ON h2.dia = h1.dia
                                 AND h2.hora_inicio < h1.hora_fin
                                 AND h2.hora_fin > h1.hora_inicio
                 JOIN cursos otro ON otro.id = h2.curso_id
                 WHERE h1.curso_id = ? AND otro.profesor_id = ? AND otro.id <> ?
                 LIMIT 1"
            );
            $stmt->execute([$id, $nuevoProfesor, $id]);
            $choque = $stmt->fetchColumn();
            if ($choque) {
                responder(409, ["mensaje" => "Ese profesor tiene cruce de horario con su curso $choque"]);
            }
        }

        $stmt = $conexion->prepare(
            "UPDATE cursos SET nombre = ?, descripcion = ?, creditos = ?, cupos = ?, profesor_id = ? WHERE id = ?"
        );
        $stmt->execute([...$datos, $id]);
        responder(200, buscar_curso($conexion, $id));

    case "DELETE":
        exigir_rol($usuario, ["admin"]);
        if (!$id) responder(400, ["mensaje" => "Falta el id del curso"]);
        buscar_curso($conexion, $id);
        $conexion->prepare("DELETE FROM cursos WHERE id = ?")->execute([$id]);
        responder(200, ["mensaje" => "Curso eliminado"]);

    default:
        responder(405, ["mensaje" => "Método no permitido"]);
}