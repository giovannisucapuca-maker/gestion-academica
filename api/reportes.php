<?php
require_once "cabeceras.php";
require_once "conexion.php";
require_once "auth.php";

date_default_timezone_set("America/Lima");

$usuario = usuario_autenticado();
exigir_rol($usuario, ["admin"]);   // los reportes son solo para el administrador

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    responder(405, ["mensaje" => "Método no permitido"]);
}

// Ejecuta una consulta y devuelve todas las filas
function consultar(PDO $conexion, string $sql, array $params = []): array
{
    $stmt = $conexion->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

// ---------- 1. Totales ----------
$porRol = consultar($conexion, "SELECT rol, COUNT(*) AS total FROM usuarios GROUP BY rol");
$roles = ["admin" => 0, "profesor" => 0, "estudiante" => 0];
foreach ($porRol as $fila) {
    $roles[$fila["rol"]] = (int) $fila["total"];
}

$totales = [
    "estudiantes" => $roles["estudiante"],
    "profesores"  => $roles["profesor"],
    "cursos"      => (int) $conexion->query("SELECT COUNT(*) FROM cursos")->fetchColumn(),
    "matriculas"  => (int) $conexion->query("SELECT COUNT(*) FROM matriculas")->fetchColumn(),
];

// ---------- 2. Ocupación de cursos (los 10 con más matriculados) ----------
$ocupacion = array_map(fn ($f) => [
    "curso"      => $f["curso"],
    "inscritos"  => (int) $f["inscritos"],
    "cupos"      => (int) $f["cupos"],
    "porcentaje" => (int) $f["cupos"] > 0 ? (int) round($f["inscritos"] * 100 / $f["cupos"]) : 0,
], consultar($conexion,
    "SELECT c.nombre AS curso, c.cupos,
            (SELECT COUNT(*) FROM matriculas m WHERE m.curso_id = c.id) AS inscritos
     FROM cursos c
     ORDER BY inscritos DESC, c.nombre
     LIMIT 10"
));

// ---------- 3. Matrículas por día (últimos 14 días, incluyendo días con 0) ----------
$desde = date("Y-m-d", strtotime("-13 days"));
$filas = consultar($conexion,
    "SELECT DATE(fecha) AS dia, COUNT(*) AS total FROM matriculas WHERE fecha >= ? GROUP BY DATE(fecha)",
    [$desde]
);
$porDia = [];
foreach ($filas as $f) {
    $porDia[$f["dia"]] = (int) $f["total"];
}
$matriculasPorDia = [];
for ($i = 13; $i >= 0; $i--) {
    $dia = date("Y-m-d", strtotime("-$i days"));
    $matriculasPorDia[] = ["fecha" => $dia, "total" => $porDia[$dia] ?? 0];   // si no hubo, 0
}

// ---------- 4. Asistencia por estado (toda la institución) ----------
$estados = ["presente" => 0, "tarde" => 0, "falta" => 0, "justificada" => 0];
foreach (consultar($conexion, "SELECT estado, COUNT(*) AS total FROM asistencias GROUP BY estado") as $f) {
    $estados[$f["estado"]] = (int) $f["total"];
}

// ---------- 5. Asistencia promedio por curso ----------
$asistenciaPorCurso = [];
foreach (consultar($conexion,
    "SELECT c.nombre AS curso,
            SUM(CASE WHEN a.estado IN ('presente', 'tarde') THEN 1 ELSE 0 END) AS asistio,
            SUM(CASE WHEN a.estado <> 'justificada' THEN 1 ELSE 0 END) AS evaluables
     FROM asistencias a
     JOIN cursos c ON c.id = a.curso_id
     GROUP BY c.id, c.nombre
     ORDER BY c.nombre"
) as $f) {
    if ((int) $f["evaluables"] > 0) {
        $asistenciaPorCurso[] = [
            "curso"      => $f["curso"],
            "porcentaje" => (int) round($f["asistio"] * 100 / $f["evaluables"]),
        ];
    }
}

$evaluables = $estados["presente"] + $estados["tarde"] + $estados["falta"];
$totales["asistencia_promedio"] = $evaluables > 0
    ? (int) round(($estados["presente"] + $estados["tarde"]) * 100 / $evaluables)
    : null;

// ---------- 6. Estudiantes en riesgo (< 70% en algún curso) ----------
$enRiesgo = [];
foreach (consultar($conexion,
    "SELECT u.nombre AS estudiante, u.email, c.nombre AS curso,
            SUM(CASE WHEN a.estado IN ('presente', 'tarde') THEN 1 ELSE 0 END) AS asistio,
            SUM(CASE WHEN a.estado <> 'justificada' THEN 1 ELSE 0 END) AS evaluables,
            SUM(CASE WHEN a.estado = 'falta' THEN 1 ELSE 0 END) AS faltas
     FROM asistencias a
     JOIN usuarios u ON u.id = a.estudiante_id
     JOIN cursos c   ON c.id = a.curso_id
     GROUP BY u.id, u.nombre, u.email, c.id, c.nombre"
) as $f) {
    if ((int) $f["evaluables"] === 0) continue;
    $porcentaje = (int) round($f["asistio"] * 100 / $f["evaluables"]);
    if ($porcentaje < 70) {
        $enRiesgo[] = [
            "estudiante" => $f["estudiante"],
            "email"      => $f["email"],
            "curso"      => $f["curso"],
            "faltas"     => (int) $f["faltas"],
            "porcentaje" => $porcentaje,
        ];
    }
}
usort($enRiesgo, fn ($a, $b) => $a["porcentaje"] <=> $b["porcentaje"]);   // los más críticos primero

responder(200, [
    "totales"              => $totales,
    "ocupacion"            => $ocupacion,
    "matriculas_por_dia"   => $matriculasPorDia,
    "asistencia_estados"   => $estados,
    "asistencia_por_curso" => $asistenciaPorCurso,
    "en_riesgo"            => $enRiesgo,
]);