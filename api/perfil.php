<?php
require_once "cabeceras.php";
require_once "conexion.php";
require_once "auth.php";

// Cualquier usuario logueado puede ver y editar SU PROPIO perfil
$usuario = usuario_autenticado();
$miId    = $usuario["sub"];          // el id sale del TOKEN, no de la URL
$metodo  = $_SERVER["REQUEST_METHOD"];
$accion  = $_GET["accion"] ?? "datos";

function mis_datos(PDO $conexion, int $id): array
{
    $stmt = $conexion->prepare("SELECT id, nombre, email, rol, activo, creado_en FROM usuarios WHERE id = ?");
    $stmt->execute([$id]);
    $datos = $stmt->fetch();
    if (!$datos) {
        responder(404, ["mensaje" => "Usuario no encontrado"]);
    }
    return $datos;
}

// GET perfil.php → mis datos
if ($metodo === "GET") {
    responder(200, mis_datos($conexion, $miId));
}

if ($metodo !== "PUT") {
    responder(405, ["mensaje" => "Método no permitido"]);
}

$d = leer_json();

// PUT perfil.php?accion=clave → cambiar contraseña
if ($accion === "clave") {
    $actual = $d["actual"] ?? "";
    $nueva  = $d["nueva"] ?? "";

    $stmt = $conexion->prepare("SELECT password FROM usuarios WHERE id = ?");
    $stmt->execute([$miId]);
    $hash = $stmt->fetchColumn();

    // Pedimos la contraseña actual: si alguien deja la sesión abierta, otro no podría cambiarla
    if (!password_verify($actual, $hash)) {
        responder(400, ["mensaje" => "La contraseña actual es incorrecta"]);
    }
    if (strlen($nueva) < 6) {
        responder(400, ["mensaje" => "La nueva contraseña debe tener al menos 6 caracteres"]);
    }
    if ($actual === $nueva) {
        responder(400, ["mensaje" => "La nueva contraseña debe ser distinta de la actual"]);
    }

    $conexion->prepare("UPDATE usuarios SET password = ? WHERE id = ?")
             ->execute([password_hash($nueva, PASSWORD_DEFAULT), $miId]);
    responder(200, ["mensaje" => "Contraseña actualizada correctamente"]);
}

// PUT perfil.php → actualizar nombre y correo
$nombre = trim($d["nombre"] ?? "");
$email  = trim($d["email"] ?? "");

if ($nombre === "" || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    responder(400, ["mensaje" => "Nombre y un correo válido son obligatorios"]);
}

$stmt = $conexion->prepare("SELECT COUNT(*) FROM usuarios WHERE email = ? AND id <> ?");
$stmt->execute([$email, $miId]);
if ($stmt->fetchColumn() > 0) {
    responder(409, ["mensaje" => "Ese correo ya está registrado"]);
}

$conexion->prepare("UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?")
         ->execute([$nombre, $email, $miId]);

$datos = mis_datos($conexion, $miId);

// El token tenía el nombre y correo ANTERIORES → entregamos uno nuevo
$token = crear_jwt([
    "sub"    => (int) $datos["id"],
    "nombre" => $datos["nombre"],
    "email"  => $datos["email"],
    "rol"    => $datos["rol"],
]);

responder(200, ["mensaje" => "Perfil actualizado", "usuario" => $datos, "token" => $token]);