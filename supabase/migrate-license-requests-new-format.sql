-- Migración de la tabla license_requests al nuevo formato
-- Esta migración agrega los nuevos campos requeridos según el formulario actualizado

-- 1. Agregar las nuevas columnas
ALTER TABLE license_requests 
ADD COLUMN IF NOT EXISTS hora_inicio TIME,
ADD COLUMN IF NOT EXISTS hora_fin TIME,
ADD COLUMN IF NOT EXISTS fecha_compensacion DATE,
ADD COLUMN IF NOT EXISTS area_trabajo VARCHAR(100),
ADD COLUMN IF NOT EXISTS reemplazo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reemplazante VARCHAR(200);

-- 2. Modificar la columna estado para usar códigos (PR, PNR, etc.)
-- Primero creamos el nuevo tipo ENUM para los códigos de estado
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'license_status_code') THEN
        CREATE TYPE license_status_code AS ENUM (
            'PR',   -- Permiso Remunerado
            'PNR',  -- Permiso No Remunerado
            'LM',   -- Licencia de Maternidad
            'LP',   -- Licencia de Paternidad
            'IRL',  -- Incapacidad por Riesgo Laboral
            'IGE',  -- Incapacidad General
            'COM',  -- Compensatorio
            'VAC',  -- Vacaciones
            'PER',  -- Personal
            'EST',  -- Estudio
            'LUT',  -- Luto
            'OTR'   -- Otro
        );
    END IF;
END
$$;

-- 3. Agregar nueva columna para el código de estado
ALTER TABLE license_requests 
ADD COLUMN IF NOT EXISTS codigo_tipo_permiso license_status_code DEFAULT 'PER'::license_status_code;

-- 4. Migrar datos existentes del campo estado al nuevo campo codigo_tipo_permiso
UPDATE license_requests 
SET codigo_tipo_permiso = CASE 
    WHEN estado = 'pendiente' THEN 'PER'::license_status_code
    WHEN estado = 'en_revision' THEN 'PER'::license_status_code
    WHEN estado = 'aprobada' THEN 'PER'::license_status_code
    WHEN estado = 'rechazada' THEN 'PER'::license_status_code
    ELSE 'PER'::license_status_code
END
WHERE codigo_tipo_permiso IS NULL;

-- 5. Modificar el campo estado para reflejar el estado del proceso (no el tipo)
-- Mantener los valores actuales pero cambiar el constraint
ALTER TABLE license_requests 
DROP CONSTRAINT IF EXISTS license_requests_estado_check;

ALTER TABLE license_requests 
ADD CONSTRAINT license_requests_estado_check 
CHECK (estado IN ('pendiente', 'en_revision', 'aprobada', 'rechazada', 'cancelada'));

-- 6. Agregar comentarios para documentar los nuevos campos
COMMENT ON COLUMN license_requests.hora_inicio IS 'Hora de inicio del permiso o licencia';
COMMENT ON COLUMN license_requests.hora_fin IS 'Hora de fin del permiso o licencia';
COMMENT ON COLUMN license_requests.fecha_compensacion IS 'Fecha en que se compensará el tiempo (si aplica)';
COMMENT ON COLUMN license_requests.area_trabajo IS 'Área de trabajo del solicitante';
COMMENT ON COLUMN license_requests.reemplazo IS 'Indica si requiere reemplazo (SI/NO)';
COMMENT ON COLUMN license_requests.reemplazante IS 'Nombre de la persona que reemplazará (si aplica)';
COMMENT ON COLUMN license_requests.codigo_tipo_permiso IS 'Código del tipo de permiso (PR, PNR, etc.)';

-- 7. Crear índices para los nuevos campos importantes
CREATE INDEX IF NOT EXISTS idx_license_requests_codigo_tipo ON license_requests(codigo_tipo_permiso);
CREATE INDEX IF NOT EXISTS idx_license_requests_area_trabajo ON license_requests(area_trabajo);
CREATE INDEX IF NOT EXISTS idx_license_requests_fecha_compensacion ON license_requests(fecha_compensacion);

-- 8. Actualizar las políticas RLS existentes (mantener las actuales)
-- Las políticas existentes seguirán funcionando con los nuevos campos

-- 9. Función para generar radicado automáticamente si no se proporciona
-- Primero eliminar la función existente si existe
DROP FUNCTION IF EXISTS generate_radicado();

CREATE OR REPLACE FUNCTION generate_radicado()
RETURNS TRIGGER AS $$
BEGIN
    -- Si no se proporciona radicado, generar uno automáticamente
    IF NEW.radicado IS NULL OR NEW.radicado = '' THEN
        NEW.radicado := 'LIC-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                       LPAD(NEXTVAL('radicado_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear secuencia para radicados si no existe
CREATE SEQUENCE IF NOT EXISTS radicado_seq START 1;

-- Crear trigger para generar radicado automáticamente
DROP TRIGGER IF EXISTS trigger_generate_radicado ON license_requests;
CREATE TRIGGER trigger_generate_radicado
    BEFORE INSERT ON license_requests
    FOR EACH ROW
    EXECUTE FUNCTION generate_radicado();

-- 10. Vista para mostrar información completa con nombres de tipos legibles
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

-- Comentario sobre la migración
COMMENT ON TABLE license_requests IS 'Tabla de solicitudes de licencias - Actualizada con nuevo formato que incluye horas, reemplazo, área de trabajo y códigos de tipo de permiso';
