# 🎓 Gestión Académica — SPA Angular + API PHP con JWT

Aplicación web de una sola página (SPA) para gestionar **usuarios, cursos, matrículas, horarios y asistencia** de una institución educativa, con inicio de sesión mediante **JWT**, rutas protegidas por **guards**, permisos por rol (**admin**, **profesor**, **estudiante**) y **reportes con gráficos**.

> Evaluación final – Desarrollo de Interfaces 3 · Zegel
> **Integrantes:** Nombre Apellido 1 · Nombre Apellido 2 · Nombre Apellido 3

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | Angular 22 (standalone, lazy loading, Signals), TypeScript, RxJS, Reactive Forms |
| Librerías UI | SweetAlert2 (alertas), Bootstrap Icons, Chart.js (gráficos) |
| Backend | PHP 8.4 sin frameworks (API REST), JWT HS256 implementado con `hash_hmac` |
| Base de datos | MySQL 8 · PDO con consultas preparadas · `password_hash` · transacciones |

## Funcionalidades por rol

| Módulo | Admin | Profesor | Estudiante |
|---|---|---|---|
| Dashboard | Estadísticas generales | Sus cursos | Sus cursos y créditos |
| Cursos | CRUD completo | Crear y editar los suyos | Ver |
| Usuarios | CRUD completo | — | — |
| Matrículas | Ver todas y anular | Ver alumnos de sus cursos | Matricularse / anular |
| Horario | Ver todos (filtro por curso) | Gestionar el de sus cursos | Ver su horario semanal |
| Asistencia | Registrar o corregir cualquier fecha | Tomar lista **solo hoy, desde 15 min antes** | Ver su % y detalle |
| Reportes | Gráficos, exportar CSV, imprimir PDF | — | — |
| Mi perfil | Editar datos y contraseña | ✔ | ✔ |

## Reglas de negocio (validadas en el servidor)

- Contraseñas guardadas con `password_hash`; nunca se devuelven en las respuestas.
- Correo único (409 si se repite). El admin no puede eliminar su propia cuenta.
- **Matrícula:** sin duplicados, con control de **cupos** y sin **cruce de horario** con otros cursos del estudiante.
- **Horario:** sin cruces de **aula** ni de **profesor** (también al reasignar el profesor de un curso).
- **Asistencia:** se habilita **15 minutos antes** del inicio de la clase y cierra al terminar (hora del servidor). Se guarda en una **transacción**. Con menos de 70% el estudiante queda **en riesgo**.

## Requisitos

- Node.js 20+ y npm
- PHP 8.1+ con `pdo_mysql`, `openssl` y `mbstring` habilitadas en `php.ini`
- MySQL 8

## Instalación

```bash
git clone https://github.com/USUARIO/gestion-academica.git
cd gestion-academica

# 1. Base de datos: ejecutar database/db_gestion_academica.sql en MySQL Workbench

# 2. Conexión a MySQL
copy api\conexion.ejemplo.php api\conexion.php
#    → editar api/conexion.php y poner la contraseña de MySQL

# 3. Dependencias de Angular
cd frontend
npm install
```

## Ejecución (2 terminales)

```bash
# Terminal 1 – API PHP  →  http://localhost:8000
cd api
php -S localhost:8000

# Terminal 2 – Angular  →  http://localhost:4200
cd frontend
npm start
```

## Usuarios de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@zegel.edu.pe | admin123 |
| Profesor | profesor@zegel.edu.pe | profe123 |
| Profesora | ecastro@zegel.edu.pe | profe123 |
| Estudiante | estudiante@zegel.edu.pe | estu123 |
| Estudiante (en riesgo) | lfernandez@zegel.edu.pe | estu123 |
| Estudiante (inactivo) | rmendoza@zegel.edu.pe | estu123 |

## Estructura

```
gestion-academica/
├── api/                       API REST en PHP
│   ├── cabeceras.php          CORS, responder(), leer_json()
│   ├── conexion.ejemplo.php   Plantilla de conexión PDO
│   ├── jwt.php                crear_jwt() y verificar_jwt() (HS256)
│   ├── auth.php               usuario_autenticado() → 401 · exigir_rol() → 403
│   ├── login.php              Login: entrega el token
│   ├── perfil.php             Mis datos y cambio de contraseña (renueva el token)
│   ├── usuarios.php           CRUD de usuarios (admin)
│   ├── cursos.php             CRUD de cursos
│   ├── matriculas.php         Matrículas con control de cupos y cruces
│   ├── horarios.php           Horario con control de cruces de aula y profesor
│   ├── asistencias.php        Asistencia con ventana de horario y transacción
│   └── reportes.php           Estadísticas para los gráficos (admin)
├── database/                  Script SQL de instalación
└── frontend/src/app/
    ├── core/                  Una sola instancia en toda la app
    │   ├── models/            Interfaces de TypeScript
    │   ├── services/          AuthService, TokenService, BaseCrudService<T> y servicios por entidad
    │   ├── guards/            authGuard, roleGuard / roleMatchGuard, loginGuard
    │   ├── interceptors/      authInterceptor (token) · errorInterceptor (errores globales)
    │   └── layout/            Menú lateral + <router-outlet>
    ├── shared/                Reutilizable
    │   ├── pipes/             rolLabel, filtro, iniciales, ordenar, paginar, diaSemana
    │   ├── directives/        *appHasRole, appConfirmar, appOrdenar
    │   ├── validators/        clavesIguales
    │   └── components/        Paginador, BarraCupos, HorarioSemanal, IndicadorAsistencia, Grafico, 403, 404
    └── features/              Un módulo funcional por carpeta (lazy loading)
        ├── auth/  dashboard/  cursos/  usuarios/  matriculas/
        └── horario/  asistencia/  reportes/  perfil/
```

## Rutas y protección

| Ruta | Carga | Guards |
|---|---|---|
| `/login` | lazy | `loginGuard` (con sesión → `/dashboard`) |
| `/dashboard`, `/cursos`, `/cursos/:id`, `/matriculas`, `/horario`, `/asistencia`, `/perfil` | lazy | `authGuard` + `canActivateChild` |
| `/cursos/nuevo`, `/cursos/:id/editar` | lazy | + `roleGuard` (admin, profesor) |
| `/usuarios/**`, `/reportes` | lazy | + `roleMatchGuard` (admin; el módulo ni se descarga) |
| `/acceso-denegado` · `/inicio` · `**` | lazy | 403 · redirección · 404 |

## API REST

| Endpoint | Métodos | Roles |
|---|---|---|
| `/login.php` | POST | público |
| `/perfil.php` (`?accion=clave`) | GET · PUT | todos |
| `/usuarios.php` (`?id=`) | GET · POST · PUT · DELETE | admin |
| `/cursos.php` (`?id=`) | GET · POST · PUT · DELETE | GET todos · POST/PUT admin y profesor · DELETE admin |
| `/matriculas.php` (`?id=`, `?curso_id=`) | GET · POST · DELETE | según rol |
| `/horarios.php` (`?id=`, `?curso_id=`) | GET · POST · DELETE | GET todos · POST/DELETE admin y profesor del curso |
| `/asistencias.php` (`?curso_id=&fecha=`, `&resumen=1`, `&ventana=1`) | GET · POST | según rol |
| `/reportes.php` | GET | admin |

Códigos de error: **400** datos inválidos · **401** sin token, token inválido o expirado · **403** sin permiso o fuera de horario · **404** no encontrado · **409** conflicto (duplicado, sin cupos o cruce de horario).

## Flujo de autenticación JWT

1. `Login` → `AuthService.login()` → `POST /login.php`. PHP valida con `password_verify()` y firma un JWT HS256 (30 min).
2. `TokenService` guarda el token en `sessionStorage` y decodifica el payload (`sub`, `nombre`, `rol`, `exp`).
3. `authInterceptor` agrega `Authorization: Bearer <token>` a **todas** las peticiones; si el token expiró, cancela la petición y cierra la sesión.
4. `auth.php` verifica la firma (`hash_equals`) y la expiración en cada endpoint.
5. `errorInterceptor` (`catchError`) maneja los errores globalmente: 401 → cierra sesión; 403/404/409/500 → aviso con SweetAlert2; 0 → API apagada.
6. `AuthService` programa el cierre automático de sesión en el instante en que vence el token.