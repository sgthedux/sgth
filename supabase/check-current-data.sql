-- Verificar el estado actual de los datos antes de la limpieza
-- Esto nos ayudará a ver qué campos se están guardando correctamente

-- 1. Ver estructura actual de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'license_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver datos recientes para verificar qué campos se están llenando
SELECT 
    id,
    radicado,
    nombres,
    apellidos,
    area_trabajo,
    codigo_tipo_permiso,
    hora_inicio,
    hora_fin,
    fecha_compensacion,
    reemplazo,
    reemplazante,
    created_at
FROM license_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Contar registros con campos nulos que deberían tener datos
SELECT 
    COUNT(*) as total_registros,
    COUNT(area_trabajo) as con_area_trabajo,
    COUNT(hora_inicio) as con_hora_inicio,
    COUNT(hora_fin) as con_hora_fin,
    COUNT(fecha_compensacion) as con_fecha_compensacion,
    COUNT(CASE WHEN reemplazo = true THEN reemplazante END) as reemplazantes_cuando_reemplazo_true
FROM license_requests;

-- 4. Ver si hay dependencias en otras tablas o vistas
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.table_name='license_requests';
