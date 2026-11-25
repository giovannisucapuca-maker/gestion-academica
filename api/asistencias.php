<?php
require_once "cabeceras.php";
require_once "conexion.php";
require_once "auth.php";

date_default_timezone_set("America/Lima");   // para comparar fechas con la hora de Perú

$usuario = usuario_autenticado();
$rol     = $usuario["rol"];
$miId    = $usuario["sub"];
$metodo  = $_SERVER["REQUEST_METHOD"];
$cursoId = isset($_GET["curso_id"]) ? (int) $_GET["curso_id"] : null;
$fecha   = $_GET["fecha"] ?? null;
$resumen = isset($_GET["resumen"]);
$ventana = isset($_GET["ventana"]);

const ESTADOS = ["presente", "tarde", "falta", "justificada"];
const MINUTOS_ANTES = 15;   // la asistencia se abre 15 minutos antes del inicio de la clase

// Columnas que cuentan cuántas veces aparece cada estado
const CONTEOS = "
    COUNT(a.id) AS total,
    SUM(CASE WHEN a.estado = 'presente'    THEN 1 ELSE 0 END) AS presentes,
    SUM(CASE WHEN a.estado = 'tarde'       THEN 1 ELSE 0 END) AS tardes,
    SUM(CASE WHEN a.estado = 'falta'       THEN 1 ELSE 0 END) AS faltas,
    SUM(CASE WHEN a.estado = 'justificada' THEN 1 ELSE 0 END) AS justificadas";

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
    responder(403, ["mensaje" => "Solo puedes gestionar la asistencia de tus cursos"]);
}

function validar_fecha(?string $fecha): string
{
    $d = DateTime::createFromFormat("Y-m-d", (string) $fecha);
    if (!$d || $d->format("Y-m-d") !== $fecha) {
        responder(400, ["mensaje" => "Fecha inválida (formato AAAA-MM-DD)"]);
    }
    if ($fecha > date("Y-m-d")) {
        responder(400, ["mensaje" => "No puedes registrar asistencia de una fecha futura"]);
    }
    return $fecha;
}

// ¿Se puede registrar la asistencia de este curso en esta fecha, AHORA?
// Devuelve ["abierta" => true/false, "mensaje" => "..."]
// La hora es la del SERVIDOR (no se puede engañar cambiando el reloj de la PC)
function ventana_asistencia(PDO $conexion, int $cursoId, string $fecha, string $rol): array
{
    $diaSemana = (int) date("N", strtotime($fecha));   // 1 = lunes ... 7 = domingo
    $stmt = $conexion->prepare(
        "SELECT hora_inicio, hora_fin FROM horarios WHERE curso_id = ? AND dia = ? ORDER BY hora_inicio"
    );
    $stmt->execute([$cursoId, $diaSemana]);
    $sesiones = $stmt->fetchAll();

    // El admin puede registrar o corregir cualquier fecha
    if ($rol === "admin") {
        return [
            "abierta" => true,
            "mensaje" => $sesiones
                ? "Como administrador puedes registrar o corregir esta fecha"
                : "Como administrador puedes registrar esta fecha (el curso no tiene clase ese día)",
        ];
    }

    // El profesor: solo HOY, desde 15 min antes del inicio hasta el fin de la clase
    if ($fecha !== date("Y-m-d")) {
        return ["abierta" => false, "mensaje" => "Solo puedes registrar la asistencia del día de hoy"];
    }
    if (!$sesiones) {
        return ["abierta" => false, "mensaje" => "Hoy no hay clase de este curso"];
    }

    $ahora = time();
    foreach ($sesiones as $s) {
        $apertura = strtotime("$fecha {$s['hora_inicio']}") - MINUTOS_ANTES * 60;
        $cierre   = strtotime("$fecha {$s['hora_fin']}");

        if ($ahora < $apertura) {
            return [
                "abierta" => false,
                "mensaje" => "La asistencia se habilita a las " . date("H:i", $apertura)
                           . " (" . MINUTOS_ANTES . " minutos antes de la clase de " . substr($s["hora_inicio"], 0, 5) . ")",
            ];
        }
        if ($ahora <= $cierre) {
            return [
                "abierta" => true,
                "mensaje" => "Asistencia habilitada hasta las " . date("H:i", $cierre) . " (fin de la clase)",
            ];
        }
        // Esta sesión ya terminó: revisamos la siguiente del mismo día (si hay)
    }

    $ultima = end($sesiones);
    return [
        "abierta" => false,
        "mensaje" => "La toma de asistencia de hoy ya cerró (la clase terminó a las " . substr($ultima["hora_fin"], 0, 5) . ")",
    ];
}

// Convierte los conteos a números y calcula el porcentaje de asistencia
// Asistió = presente + tarde · Las justificadas no cuentan como falta
function con_porcentaje(array $filas): array
{
    return array_map(function ($f) {
        foreach (["total", "presentes", "tardes", "faltas", "justificadas"] as $campo) {
            $f[$campo] = (int) $f[$campo];
        }
        $evaluables = $f["total"] - $f["justificadas"];
        $f["porcentaje"] = $evaluables > 0
            ? (int) round(($f["presentes"] + $f["tardes"]) * 100 / $evaluables)
            : null;
        return $f;
    }, $filas);
}

switch ($metodo) {
    case "GET":
        // ---------- ESTUDIANTE ----------
        if ($rol === "estudiante") {
            if ($cursoId) {
                // Mi detalle en un curso: fecha por fecha
                $stmt = $conexion->prepare(
                    "SELECT fecha, estado FROM asistencias WHERE curso_id = ? AND estudiante_id = ? ORDER BY fecha DESC"
                );
                $stmt->execute([$cursoId, $miId]);
                responder(200, $stmt->fetchAll());
            }
            // Mi resumen: un registro por cada curso en el que estoy matriculado
            $stmt = $conexion->prepare(
                "SELECT c.id AS curso_id, c.nombre AS curso, " . CONTEOS . "
                 FROM matriculas m
                 JOIN cursos c ON c.id = m.curso_id
                 LEFT JOIN asistencias a ON a.curso_id = m.curso_id AND a.estudiante_id = m.estudiante_id
                 WHERE m.estudiante_id = ?
                 GROUP BY c.id, c.nombre
                 ORDER BY c.nombre"
            );
            $stmt->execute([$miId]);
            responder(200, con_porcentaje($stmt->fetchAll()));
        }

        // ---------- PROFESOR / ADMIN ----------
        if (!$cursoId) {
            responder(400, ["mensaje" => "Indica el curso (curso_id)"]);
        }
        $curso = buscar_curso($conexion, $cursoId);
        exigir_gestion($curso, $rol, $miId);

        // GET ...?curso_id=N&fecha=AAAA-MM-DD&ventana=1 → ¿está abierta la toma de asistencia?
        if ($ventana) {
            responder(200, ventana_asistencia($conexion, $cursoId, validar_fecha($fecha), $rol));
        }

        if ($resumen) {
            // Resumen por estudiante del curso
            $stmt = $conexion->prepare(
                "SELECT u.id AS estudiante_id, u.nombre AS estudiante, " . CONTEOS . "
                 FROM matriculas m
                 JOIN usuarios u ON u.id = m.estudiante_id
                 LEFT JOIN asistencias a ON a.curso_id = m.curso_id AND a.estudiante_id = m.estudiante_id
                 WHERE m.curso_id = ?
                 GROUP BY u.id, u.nombre
                 ORDER BY u.nombre"
            );
            $stmt->execute([$cursoId]);
            responder(200, con_porcentaje($stmt->fetchAll()));
        }

        // Lista para tomar asistencia: todos los matriculados + su estado en esa fecha (o null)
        $fecha = validar_fecha($fecha);
        $stmt = $conexion->prepare(
            "SELECT u.id AS estudiante_id, u.nombre AS estudiante, u.email AS estudiante_email, a.estado
             FROM matriculas m
             JOIN usuarios u ON u.id = m.estudiante_id
             LEFT JOIN asistencias a ON a.curso_id = m.curso_id
                                    AND a.estudiante_id = m.estudiante_id
                                    AND a.fecha = ?
             WHERE m.curso_id = ?
             ORDER BY u.nombre"
        );
        $stmt->execute([$fecha, $cursoId]);
        responder(200, $stmt->fetchAll());

    case "POST":
        // Guardar la asistencia de UN curso en UNA fecha
        exigir_rol($usuario, ["admin", "profesor"]);
        $d = leer_json();
        $curso = buscar_curso($conexion, (int) ($d["curso_id"] ?? 0));
        exigir_gestion($curso, $rol, $miId);
        $fecha = validar_fecha($d["fecha"] ?? null);

        // ¿Está dentro del horario permitido?
        $estado = ventana_asistencia($conexion, (int) $curso["id"], $fecha, $rol);
        if (!$estado["abierta"]) {
            responder(403, ["mensaje" => $estado["mensaje"]]);
        }

        $registros = $d["registros"] ?? [];

        if (!is_array($registros) || count($registros) === 0) {
            responder(400, ["mensaje" => "No hay registros de asistencia para guardar"]);
        }

        // Ids de los estudiantes matriculados en el curso
        $stmt = $conexion->prepare("SELECT estudiante_id FROM matriculas WHERE curso_id = ?");
        $stmt->execute([(int) $curso["id"]]);
        $matriculados = array_map("intval", $stmt->fetchAll(PDO::FETCH_COLUMN));

        foreach ($registros as $r) {
            if (!in_array($r["estado"] ?? "", ESTADOS, true)) {
                responder(400, ["mensaje" => "Estado de asistencia no válido"]);
            }
            if (!in_array((int) ($r["estudiante_id"] ?? 0), $matriculados, true)) {
                responder(400, ["mensaje" => "Hay un estudiante que no está matriculado en el curso"]);
            }
        }

        // TRANSACCIÓN: o se guarda TODO, o no se guarda NADA
        $conexion->beginTransaction();
        try {
            $conexion->prepare("DELETE FROM asistencias WHERE curso_id = ? AND fecha = ?")
                     ->execute([(int) $curso["id"], $fecha]);

            $insertar = $conexion->prepare(
                "INSERT INTO asistencias (curso_id, estudiante_id, fecha, estado) VALUES (?, ?, ?, ?)"
            );
            foreach ($registros as $r) {
                $insertar->execute([(int) $curso["id"], (int) $r["estudiante_id"], $fecha, $r["estado"]]);
            }
            $conexion->commit();
        } catch (Exception $e) {
            $conexion->rollBack();
            responder(500, ["mensaje" => "No se pudo guardar la asistencia"]);
        }

        responder(200, ["mensaje" => "Asistencia guardada (" . count($registros) . " estudiantes)"]);

    default:
        responder(405, ["mensaje" => "Método no permitido"]);
}