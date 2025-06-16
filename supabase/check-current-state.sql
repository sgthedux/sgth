-- Verificar el estado actual de las tablas de licencias
SELECT 'license_requests' as table_name, COUNT(*) as total_records FROM license_requests
UNION ALL
SELECT 'license_evidences' as table_name, COUNT(*) as total_records FROM license_evidences;

-- Ver las últimas 10 licencias en la base de datos
SELECT 
    id,
    radicado,
    nombres,
    apellidos,
    status,
    created_at
FROM license_requests 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver si hay evidencias huérfanas (sin license_request asociado)
SELECT 
    le.id,
    le.license_request_id,
    le.file_path,
    CASE 
        WHEN lr.id IS NULL THEN 'HUÉRFANA - Sin licencia asociada'
        ELSE 'OK - Licencia existe'
    END as status
FROM license_evidences le
LEFT JOIN license_requests lr ON le.license_request_id = lr.id
ORDER BY le.created_at DESC
LIMIT 10;
