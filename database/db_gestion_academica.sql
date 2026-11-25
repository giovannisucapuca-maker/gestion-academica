-- =====================================================================
--  GESTIÓN ACADÉMICA · Script de instalación (MySQL 8)
--  Contraseñas de prueba: admin123 · profe123 · estu123
-- =====================================================================
CREATE DATABASE db_gestion_academica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_gestion_academica;

-- ---------- TABLAS ----------
CREATE TABLE usuarios (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  email     VARCHAR(120) NOT NULL UNIQUE,
  password  VARCHAR(255) NOT NULL,
  rol       ENUM('admin','profesor','estudiante') NOT NULL DEFAULT 'estudiante',
  activo    TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cursos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(120) NOT NULL,
  descripcion TEXT,
  creditos    INT NOT NULL,
  cupos       INT NOT NULL DEFAULT 30,
  profesor_id INT NULL,
  FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE TABLE matriculas (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  estudiante_id INT NOT NULL,
  curso_id      INT NOT NULL,
  fecha         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_estudiante_curso (estudiante_id, curso_id),
  FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (curso_id)      REFERENCES cursos(id)   ON DELETE CASCADE
);

CREATE TABLE horarios (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  curso_id    INT NOT NULL,
  dia         TINYINT NOT NULL,          -- 1 = lunes ... 6 = sábado
  hora_inicio TIME NOT NULL,
  hora_fin    TIME NOT NULL,
  aula        VARCHAR(30) NOT NULL,
  FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
);

CREATE TABLE asistencias (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  curso_id      INT NOT NULL,
  estudiante_id INT NOT NULL,
  fecha         DATE NOT NULL,
  estado        ENUM('presente','tarde','falta','justificada') NOT NULL,
  UNIQUE KEY uk_asistencia (curso_id, estudiante_id, fecha),
  FOREIGN KEY (curso_id)      REFERENCES cursos(id)   ON DELETE CASCADE,
  FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ---------- USUARIOS (ids 1 a 9) ----------
INSERT INTO usuarios (nombre, email, password, rol, activo) VALUES
('Ana Torres',     'admin@zegel.edu.pe',      '$2y$10$KM55VsgDTyx8oC1PSSRLsuawACJx5JCEOOVBZprIqrto5lsovj08C', 'admin', 1),
('Carlos Ríos',    'profesor@zegel.edu.pe',   '$2y$10$RaRxDFj9IeXn9zMzXL9Im.jV0htzBebSzF68G4.eevDvbYL8GzbuC', 'profesor', 1),
('Lucía Paredes',  'estudiante@zegel.edu.pe', '$2y$10$E9Dfd/Z60z9MxxKHsbxEheabzICTbJhggrzp8V4ib8ooq/lZOy4Me', 'estudiante', 1),
('Diego Huamán',   'dhuaman@zegel.edu.pe',    '$2y$10$E9Dfd/Z60z9MxxKHsbxEheabzICTbJhggrzp8V4ib8ooq/lZOy4Me', 'estudiante', 1),
('María Quispe',   'mquispe@zegel.edu.pe',    '$2y$10$E9Dfd/Z60z9MxxKHsbxEheabzICTbJhggrzp8V4ib8ooq/lZOy4Me', 'estudiante', 1),
('José Ramírez',   'jramirez@zegel.edu.pe',   '$2y$10$E9Dfd/Z60z9MxxKHsbxEheabzICTbJhggrzp8V4ib8ooq/lZOy4Me', 'estudiante', 1),
('Rosa Mendoza',   'rmendoza@zegel.edu.pe',   '$2y$10$E9Dfd/Z60z9MxxKHsbxEheabzICTbJhggrzp8V4ib8ooq/lZOy4Me', 'estudiante', 0),
('Luis Fernández', 'lfernandez@zegel.edu.pe', '$2y$10$E9Dfd/Z60z9MxxKHsbxEheabzICTbJhggrzp8V4ib8ooq/lZOy4Me', 'estudiante', 1),
('Elena Castro',   'ecastro@zegel.edu.pe',    '$2y$10$RaRxDFj9IeXn9zMzXL9Im.jV0htzBebSzF68G4.eevDvbYL8GzbuC', 'profesor', 1);

-- ---------- CURSOS (ids 1 a 11) · Carlos = 2 · Elena = 9 ----------
INSERT INTO cursos (nombre, descripcion, creditos, cupos, profesor_id) VALUES
('Desarrollo de Interfaces 3', 'Angular, rutas, guards y APIs con JWT', 4, 30, 2),
('Base de Datos II', 'Modelado avanzado y procedimientos', 3, 25, 2),
('Programación Web', 'HTML, CSS, JavaScript y frameworks modernos', 4, 30, 2),
('Sistemas Operativos', 'Procesos, memoria y sistemas de archivos', 3, 28, 2),
('Ingeniería de Software', 'Requisitos, diseño y metodologías ágiles', 4, 30, 2),
('Matemática Discreta', 'Lógica, conjuntos, grafos y combinatoria', 3, 35, 9),
('Estadística Aplicada', 'Probabilidad y análisis de datos', 3, 35, 9),
('Inteligencia Artificial', 'Machine learning y redes neuronales', 4, 20, 9),
('Seguridad Informática', 'Criptografía, vulnerabilidades y buenas prácticas', 3, 22, 9),
('Gestión de Proyectos', 'Planificación, Scrum y gestión de riesgos', 2, 40, 9),
('Ética Profesional', 'Responsabilidad y ética en tecnología', 2, 45, 9);

-- ---------- HORARIOS (sin cruces de aula ni de profesor) ----------
INSERT INTO horarios (curso_id, dia, hora_inicio, hora_fin, aula) VALUES
(1, 1, '08:00', '10:00', 'A101'), (1, 3, '14:00', '16:00', 'LAB1'),
(2, 2, '09:00', '11:00', 'B202'), (2, 4, '18:00', '20:00', 'B202'),
(3, 2, '14:00', '16:00', 'LAB1'),
(4, 4, '08:00', '10:00', 'A101'),
(5, 5, '10:00', '12:00', 'A101'),
(6, 1, '08:00', '10:00', 'C303'),
(7, 3, '08:00', '10:00', 'C303'),
(8, 5, '14:00', '16:00', 'LAB2'),
(9, 6, '09:00', '12:00', 'LAB2'),
(10, 1, '18:00', '20:00', 'C303'),
(11, 2, '18:00', '20:00', 'C303');

-- ---------- MATRÍCULAS (sin cruces de horario) ----------
INSERT INTO matriculas (estudiante_id, curso_id) VALUES
(3, 1), (3, 2),
(4, 1), (4, 7),
(5, 1), (5, 3),
(6, 1), (6, 2),
(8, 1), (8, 4);

-- ---------- ASISTENCIAS DE EJEMPLO ----------
-- Desarrollo de Interfaces 3 (lunes y miércoles)
INSERT INTO asistencias (curso_id, estudiante_id, fecha, estado) VALUES
(1, 3, '2026-11-16', 'presente'), (1, 3, '2026-11-18', 'presente'), (1, 3, '2026-11-23', 'presente'),
(1, 4, '2026-11-16', 'falta'),    (1, 4, '2026-11-18', 'falta'),    (1, 4, '2026-11-23', 'justificada'),
(1, 5, '2026-11-16', 'presente'), (1, 5, '2026-11-18', 'tarde'),    (1, 5, '2026-11-23', 'falta'),
(1, 6, '2026-11-16', 'presente'), (1, 6, '2026-11-18', 'presente'), (1, 6, '2026-11-23', 'tarde'),
(1, 8, '2026-11-16', 'falta'),    (1, 8, '2026-11-18', 'presente'), (1, 8, '2026-11-23', 'falta');

-- Base de Datos II (martes y jueves)
INSERT INTO asistencias (curso_id, estudiante_id, fecha, estado) VALUES
(2, 3, '2026-11-17', 'presente'), (2, 3, '2026-11-19', 'presente'),
(2, 6, '2026-11-17', 'tarde'),    (2, 6, '2026-11-19', 'falta');