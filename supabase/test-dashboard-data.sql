-- Script de prueba para verificar que las tablas existen y tienen datos
-- Ejecuta esto en tu consola de Supabase SQL

-- 1. Verificar que la tabla license_requests existe y ver algunos datos
SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN estado = 'pendiente' THEN 1 END) as pending_requests,
    COUNT(CASE WHEN estado = 'aprobado' THEN 1 END) as approved_requests,
    COUNT(CASE WHEN estado = 'rechazado' THEN 1 END) as rejected_requests
FROM license_requests;

-- 2. Ver las últimas 5 solicitudes
SELECT 
    id,
    nombres,
    apellidos,
    radicado,
    estado,
    created_at,
    observacion
FROM license_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Verificar que la tabla license_evidences existe
SELECT COUNT(*) as total_evidences FROM license_evidences;

-- 4. Verificar el esquema de license_evidences
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'license_evidences'
ORDER BY ordinal_position;
