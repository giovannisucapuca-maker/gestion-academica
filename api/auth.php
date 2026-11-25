<?php
require_once "jwt.php";

// Devuelve los datos del usuario del token, o corta con 401
function usuario_autenticado(): array
{
    // La cabecera llega así: "Bearer eyJhbGci..."
    $cabecera = $_SERVER["HTTP_AUTHORIZATION"] ?? (getallheaders()["Authorization"] ?? "");

    if (!str_starts_with($cabecera, "Bearer ")) {
        responder(401, ["mensaje" => "Token no proporcionado"]);
    }

    $token = substr($cabecera, 7);   // quitamos "Bearer " (7 caracteres)

    try {
        return verificar_jwt($token);
    } catch (Exception $e) {
        responder(401, ["mensaje" => $e->getMessage()]);
    }
}

// Corta con 403 si el rol del usuario no está en la lista
function exigir_rol(array $usuario, array $rolesPermitidos): void
{
    if (!in_array($usuario["rol"], $rolesPermitidos)) {
        responder(403, ["mensaje" => "No tienes permisos para esta acción"]);
    }
}