-- Verificar datos actuales en license_requests
SELECT 
    COUNT(*) as total_solicitudes,
    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pendientes,
    COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as aprobadas,
    COUNT(CASE WHEN estado = 'rechazado' THEN 1 END) as rechazadas
FROM license_requests;

-- Si el resultado anterior muestra 0 solicitudes, ejecuta este INSERT para crear datos de prueba:
-- (Descomenta las siguientes líneas si necesitas datos de prueba)

/*
INSERT INTO license_requests (
    nombres, apellidos, tipo_documento, numero_documento, cargo, 
    fecha_inicio, fecha_finalizacion, observacion, radicado, estado, created_at
) VALUES 
    ('Juan', 'Pérez', 'cedula', '12345678', 'Desarrollador', 
     '2025-06-20', '2025-06-25', 'Vacaciones familiares', 
     'LIC-2025-123456789', 'pendiente', NOW() - INTERVAL '2 hours'),
    
    ('Ana', 'García', 'cedula', '87654321', 'Analista', 
     '2025-06-18', '2025-06-19', 'Cita médica especializada', 
     'LIC-2025-987654321', 'aprobado', NOW() - INTERVAL '1 day'),
     
    ('Carlos', 'Ruiz', 'cedula', '45678912', 'Project Manager', 
     '2025-06-16', '2025-06-17', 'Asunto personal urgente', 
     'LIC-2025-456789123', 'rechazado', NOW() - INTERVAL '3 days'),
     
    ('María', 'López', 'cedula', '78912345', 'Diseñadora', 
     '2025-07-01', '2025-07-15', 'Vacaciones de medio año programadas', 
     'LIC-2025-789123456', 'pendiente', NOW() - INTERVAL '4 hours'),
     
    ('Pedro', 'Sánchez', 'cedula', '23456789', 'Administrador', 
     '2025-06-19', '2025-06-21', 'Licencia de paternidad', 
     'LIC-2025-234567891', 'aprobado', NOW() - INTERVAL '6 hours');
*/

-- Verificar los datos después de la inserción
SELECT nombres, apellidos, radicado, estado, created_at 
FROM license_requests 
ORDER BY created_at DESC 
LIMIT 10;
