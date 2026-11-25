<?php
require_once "cabeceras.php";
require_once "conexion.php";
require_once "auth.php";

$usuario = usuario_autenticado();      // 401 si no hay token válido
exigir_rol($usuario, ["admin"]);       // 403 para profesor y estudiante: TODO el archivo es de admin

$metodo = $_SERVER["REQUEST_METHOD"];
$id     = isset($_GET["id"]) ? (int) $_GET["id"] : null;

// Columnas que SÍ se pueden mostrar (fíjate que no está "password")
const COLUMNAS = "id, nombre, email, rol, activo, creado_en";

function buscar_usuario(PDO $conexion, int $id): array
{
    $stmt = $conexion->prepare("SELECT " . COLUMNAS . " FROM usuarios WHERE id = ?");
    $stmt->execute([$id]);
    $u = $stmt->fetch();
    if (!$u) {
        responder(404, ["mensaje" => "Usuario no encontrado"]);
    }
    return $u;
}

// $esNuevo = true al crear (contraseña obligatoria); false al editar (opcional)
function validar_usuario(array $d, bool $esNuevo): array
{
    $nombre   = trim($d["nombre"] ?? "");
    $email    = trim($d["email"] ?? "");
    $rol      = $d["rol"] ?? "";
    $activo   = !empty($d["activo"]) ? 1 : 0;
    $password = $d["password"] ?? "";

    if ($nombre === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        responder(400, ["mensaje" => "Nombre y un correo válido son obligatorios"]);
    }
    if (!in_array($rol, ["admin", "profesor", "estudiante"])) {
        responder(400, ["mensaje" => "Rol no válido"]);
    }
    if (($esNuevo || $password !== "") && strlen($password) < 6) {
        responder(400, ["mensaje" => "La contraseña debe tener al menos 6 caracteres"]);
    }

    // compact() arma ["nombre" => $nombre, "email" => $email, ...]
    return compact("nombre", "email", "rol", "activo", "password");
}

// ¿Otro usuario (distinto de $excluirId) ya usa ese correo?
function email_ocupado(PDO $conexion, string $email, int $excluirId = 0): bool
{
    $stmt = $conexion->prepare("SELECT COUNT(*) FROM usuarios WHERE email = ? AND id <> ?");
    $stmt->execute([$email, $excluirId]);
    return $stmt->fetchColumn() > 0;
}

switch ($metodo) {
    case "GET":
        if ($id) {
            responder(200, buscar_usuario($conexion, $id));
        }
        $lista = $conexion->query("SELECT " . COLUMNAS . " FROM usuarios ORDER BY id")->fetchAll();
        responder(200, $lista);

    case "POST":
        $d = validar_usuario(leer_json(), true);
        if (email_ocupado($conexion, $d["email"])) {
            responder(409, ["mensaje" => "Ese correo ya está registrado"]);
        }
        $stmt = $conexion->prepare(
            "INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([
            $d["nombre"],
            $d["email"],
            password_hash($d["password"], PASSWORD_DEFAULT),   // ← se guarda encriptada
            $d["rol"],
            $d["activo"],
        ]);
        responder(201, buscar_usuario($conexion, (int) $conexion->lastInsertId()));

    case "PUT":
        if (!$id) responder(400, ["mensaje" => "Falta el id del usuario"]);
        buscar_usuario($conexion, $id);   // 404 si no existe
        $d = validar_usuario(leer_json(), false);
        if (email_ocupado($conexion, $d["email"], $id)) {
            responder(409, ["mensaje" => "Ese correo ya está registrado"]);
        }

        if ($d["password"] !== "") {
            // Vino una contraseña nueva: también la actualizamos
            $stmt = $conexion->prepare(
                "UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ?, password = ? WHERE id = ?"
            );
            $stmt->execute([
                $d["nombre"], $d["email"], $d["rol"], $d["activo"],
                password_hash($d["password"], PASSWORD_DEFAULT), $id,
            ]);
        } else {
            // Sin contraseña: se conserva la anterior
            $stmt = $conexion->prepare(
                "UPDATE usuarios SET nombre = ?, email = ?, rol = ?, activo = ? WHERE id = ?"
            );
            $stmt->execute([$d["nombre"], $d["email"], $d["rol"], $d["activo"], $id]);
        }
        responder(200, buscar_usuario($conexion, $id));

    case "DELETE":
        if (!$id) responder(400, ["mensaje" => "Falta el id del usuario"]);
        if ($id === $usuario["sub"]) {
            responder(400, ["mensaje" => "No puedes eliminar tu propia cuenta"]);
        }
        buscar_usuario($conexion, $id);
        $conexion->prepare("DELETE FROM usuarios WHERE id = ?")->execute([$id]);
        responder(200, ["mensaje" => "Usuario eliminado"]);

    default:
        responder(405, ["mensaje" => "Método no permitido"]);
}