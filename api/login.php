<?php
require_once "cabeceras.php";
require_once "conexion.php";
require_once "jwt.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    responder(405, ["mensaje" => "Método no permitido"]);
}

// 1) Leer lo que envió Angular
$datos    = leer_json();
$email    = trim($datos["email"] ?? "");
$password = $datos["password"] ?? "";

if ($email === "" || $password === "") {
    responder(400, ["mensaje" => "Correo y contraseña son obligatorios"]);
}

// 2) Buscar al usuario por su correo (consulta preparada = sin inyección SQL)
$stmt = $conexion->prepare(
    "SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = ?"
);
$stmt->execute([$email]);
$usuario = $stmt->fetch();

// 3) Comparar la contraseña escrita con el hash guardado
if (!$usuario || !password_verify($password, $usuario["password"])) {
    responder(401, ["mensaje" => "Credenciales incorrectas"]);
}

if (!$usuario["activo"]) {
    responder(403, ["mensaje" => "Usuario inactivo"]);
}

// 4) Fabricar el token con los datos que Angular necesitará (¡sin contraseña!)
$token = crear_jwt([
    "sub"    => (int) $usuario["id"],   // "subject": a quién pertenece el token
    "nombre" => $usuario["nombre"],
    "email"  => $usuario["email"],
    "rol"    => $usuario["rol"],
]);

// 5) Responder. Quitamos el hash antes de enviar los datos del usuario
unset($usuario["password"]);
responder(200, ["token" => $token, "usuario" => $usuario]);