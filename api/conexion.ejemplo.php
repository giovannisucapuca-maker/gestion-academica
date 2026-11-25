<?php
// 1) Copia este archivo como "conexion.php"
// 2) Escribe tu contraseña de MySQL
$host       = "127.0.0.1";
$puerto     = "3306";
$baseDatos  = "db_gestion_academica";
$usuario    = "root";
$contrasena = "TU_CONTRASEÑA";

try {
    $conexion = new PDO(
        "mysql:host=$host;port=$puerto;dbname=$baseDatos;charset=utf8mb4",
        $usuario,
        $contrasena
    );
    $conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conexion->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    exit(json_encode(["mensaje" => "Error de conexión: " . $e->getMessage()], JSON_UNESCAPED_UNICODE));
}