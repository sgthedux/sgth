-- Limpieza de columnas obsoletas en license_requests
-- Eliminar columnas que no se usan y están duplicadas

-- 1. Primero, eliminar o recrear la vista que depende de las columnas obsoletas
DROP VIEW IF EXISTS license_requests_view CASCADE;

-- 2. Eliminar columnas obsoletas/duplicadas
ALTER TABLE license_requests 
DROP COLUMN IF EXISTS fecha_creacion,
DROP COLUMN IF EXISTS fecha_actualizacion, 
DROP COLUMN IF EXISTS created_by,
DROP COLUMN IF EXISTS updated_by,
DROP COLUMN IF EXISTS reviewed_at,
DROP COLUMN IF EXISTS status;

-- 2. Verificar que los campos necesarios existen y tienen el tipo correcto
-- (Ya se agregaron en la migración anterior, pero por si acaso)

-- 4. Limpiar datos inconsistentes existentes
-- Asegurar que reemplazante sea NULL cuando reemplazo es FALSE
UPDATE license_requests 
SET reemplazante = NULL 
WHERE reemplazo = FALSE AND reemplazante IS NOT NULL;

-- 5. Comentarios actualizados
COMMENT ON TABLE license_requests IS 'Tabla de solicitudes de licencias - Limpia y optimizada con solo los campos necesarios';

-- 6. Verificar estructura final
-- Esta query te mostrará las columnas que quedan
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'license_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Recrear la vista actualizada con solo las columnas necesarias
CREATE OR REPLACE VIEW license_requests_view AS
SELECT 
    lr.*,
    CASE 
        WHEN lr.codigo_tipo_permiso = 'PR' THEN 'Permiso Remunerado'
        WHEN lr.codigo_tipo_permiso = 'PNR' THEN 'Permiso No Remunerado'
        WHEN lr.codigo_tipo_permiso = 'LM' THEN 'Licencia de Maternidad'
        WHEN lr.codigo_tipo_permiso = 'LP' THEN 'Licencia de Paternidad'
        WHEN lr.codigo_tipo_permiso = 'IRL' THEN 'Incapacidad por Riesgo Laboral'
        WHEN lr.codigo_tipo_permiso = 'IGE' THEN 'Incapacidad General'
        WHEN lr.codigo_tipo_permiso = 'COM' THEN 'Compensatorio'
        WHEN lr.codigo_tipo_permiso = 'VAC' THEN 'Vacaciones'
        WHEN lr.codigo_tipo_permiso = 'PER' THEN 'Personal'
        WHEN lr.codigo_tipo_permiso = 'EST' THEN 'Estudio'
        WHEN lr.codigo_tipo_permiso = 'LUT' THEN 'Luto'
        WHEN lr.codigo_tipo_permiso = 'OTR' THEN 'Otro'
        ELSE 'Desconocido'
    END as tipo_permiso_nombre,
    CASE 
        WHEN lr.estado = 'pendiente' THEN 'Pendiente'
        WHEN lr.estado = 'en_revision' THEN 'En Revisión'
        WHEN lr.estado = 'aprobada' THEN 'Aprobada'
        WHEN lr.estado = 'rechazada' THEN 'Rechazada'
        WHEN lr.estado = 'cancelada' THEN 'Cancelada'
        ELSE 'Desconocido'
    END as estado_nombre
FROM license_requests lr;

-- Otorgar permisos sobre la vista
GRANT SELECT ON license_requests_view TO authenticated;
GRANT SELECT ON license_requests_view TO anon;
