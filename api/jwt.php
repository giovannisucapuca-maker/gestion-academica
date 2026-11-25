<?php
const JWT_SECRETO  = "zegel-di3-clave-super-secreta-2026";  // solo la conoce el servidor
const JWT_DURACION = 1800;                                  // 30 minutos, en segundos

// Base64 "seguro para URL": cambia + por -, / por _, y quita los =
function base64url_encode(string $datos): string
{
    return rtrim(strtr(base64_encode($datos), "+/", "-_"), "=");
}

function crear_jwt(array $payload): string
{
    $header = ["alg" => "HS256", "typ" => "JWT"];

    $ahora = time();
    $payload["iat"] = $ahora;                  // issued at: cuándo se creó
    $payload["exp"] = $ahora + JWT_DURACION;   // expiration: cuándo vence

    $parte1 = base64url_encode(json_encode($header));
    $parte2 = base64url_encode(json_encode($payload, JSON_UNESCAPED_UNICODE));

    // La firma: HMAC-SHA256 de "parte1.parte2" usando la clave secreta
    $firma  = hash_hmac("sha256", "$parte1.$parte2", JWT_SECRETO, true);
    $parte3 = base64url_encode($firma);

    return "$parte1.$parte2.$parte3";
}

function base64url_decode(string $datos): string
{
    return base64_decode(strtr($datos, "-_", "+/"));
}

function verificar_jwt(string $token): array
{
    // 1) Un JWT debe tener exactamente 3 partes
    $partes = explode(".", $token);
    if (count($partes) !== 3) {
        throw new Exception("Token inválido");
    }
    [$parte1, $parte2, $parte3] = $partes;

    // 2) Recalculamos la firma con NUESTRA clave y la comparamos con la que vino
    $firmaEsperada = base64url_encode(
        hash_hmac("sha256", "$parte1.$parte2", JWT_SECRETO, true)
    );
    if (!hash_equals($firmaEsperada, $parte3)) {
        throw new Exception("Token inválido");   // alguien lo modificó
    }

    // 3) Leemos el payload y revisamos si ya venció
    $payload = json_decode(base64url_decode($parte2), true);
    if (!$payload || ($payload["exp"] ?? 0) < time()) {
        throw new Exception("Token expirado");
    }

    return $payload;   // ["sub" => 1, "nombre" => ..., "rol" => "admin", ...]
}