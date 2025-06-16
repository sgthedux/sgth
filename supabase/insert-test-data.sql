-- Script para insertar datos de prueba en license_requests
-- Ejecuta esto en tu consola de Supabase SQL para tener datos de prueba

-- Insertar algunas solicitudes de prueba
INSERT INTO license_requests (
    nombres, 
    apellidos, 
    tipo_documento, 
    numero_documento, 
    cargo, 
    fecha_inicio, 
    fecha_finalizacion, 
    observacion, 
    radicado, 
    estado,
    created_at
) VALUES 
(
    'Juan Carlos', 
    'Pérez García', 
    'cedula', 
    '12345678', 
    'Desarrollador Senior', 
    '2025-06-20', 
    '2025-06-25', 
    'Solicitud de vacaciones familiares por motivos personales', 
    'LIC-2025-' || FLOOR(RANDOM() * 1000000000)::text, 
    'pendiente',
    NOW() - INTERVAL '2 hours'
),
(
    'Ana María', 
    'Gómez Rodríguez', 
    'cedula', 
    '87654321', 
    'Analista de QA', 
    '2025-06-18', 
    '2025-06-22', 
    'Licencia médica por cita especializada', 
    'LIC-2025-' || FLOOR(RANDOM() * 1000000000)::text, 
    'aprobado',
    NOW() - INTERVAL '1 day'
),
(
    'Carlos Alberto', 
    'Ruiz Martínez', 
    'cedula', 
    '45678912', 
    'Project Manager', 
    '2025-06-16', 
    '2025-06-17', 
    'Permiso personal para trámites bancarios', 
    'LIC-2025-' || FLOOR(RANDOM() * 1000000000)::text, 
    'rechazado',
    NOW() - INTERVAL '3 days'
),
(
    'María Elena', 
    'López Hernández', 
    'cedula', 
    '78912345', 
    'Diseñadora UX/UI', 
    '2025-07-01', 
    '2025-07-15', 
    'Vacaciones programadas de medio año', 
    'LIC-2025-' || FLOOR(RANDOM() * 1000000000)::text, 
    'pendiente',
    NOW() - INTERVAL '4 hours'
),
(
    'Pedro José', 
    'Sánchez Torres', 
    'cedula', 
    '23456789', 
    'Administrador de Sistemas', 
    '2025-06-19', 
    '2025-06-21', 
    'Licencia de paternidad por nacimiento de hijo', 
    'LIC-2025-' || FLOOR(RANDOM() * 1000000000)::text, 
    'aprobado',
    NOW() - INTERVAL '6 hours'
),
(
    'Laura Patricia', 
    'Morales Castro', 
    'cedula', 
    '34567891', 
    'Contadora Senior', 
    '2025-06-25', 
    '2025-06-26', 
    'Permiso para cita médica de rutina', 
    'LIC-2025-' || FLOOR(RANDOM() * 1000000000)::text, 
    'pendiente',
    NOW() - INTERVAL '30 minutes'
);

-- Verificar los datos insertados
SELECT 
    nombres,
    apellidos,
    radicado,
    estado,
    created_at,
    observacion
FROM license_requests 
ORDER BY created_at DESC 
LIMIT 10;
