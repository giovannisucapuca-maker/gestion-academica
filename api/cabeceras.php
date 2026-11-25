<?php
// CORS: permite que Angular (puerto 4200) llame a esta API (puerto 8000)
header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=utf-8");

// Antes de un POST/PUT/DELETE, el navegador pregunta con OPTIONS si tiene permiso
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(204);
    exit;
}

// Envía una respuesta JSON con su código HTTP y termina
function responder(int $codigo, array $datos): never
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);  // así la "ó" se ve bien
    exit;
}

// Angular envía JSON, así que no usamos $_POST sino php://input
function leer_json(): array
{
    return json_decode(file_get_contents("php://input"), true) ?? [];
}