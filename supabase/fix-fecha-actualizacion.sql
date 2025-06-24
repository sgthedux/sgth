-- Script para verificar y arreglar el problema de fecha_actualizacion
-- Este script debe ejecutarse en la consola de Supabase

-- 1. Verificar las columnas actuales de license_requests
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'license_requests' 
ORDER BY ordinal_position;

-- 2. Verificar si existe el campo fecha_actualizacion
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'license_requests' 
            AND column_name = 'fecha_actualizacion'
        ) 
        THEN 'fecha_actualizacion EXISTS' 
        ELSE 'fecha_actualizacion MISSING' 
    END as fecha_actualizacion_status;

-- 3. Verificar si existe el trigger
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'license_requests';

-- 4. Si falta la columna, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'license_requests' 
        AND column_name = 'fecha_actualizacion'
    ) THEN
        ALTER TABLE license_requests 
        ADD COLUMN fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Actualizar registros existentes
        UPDATE license_requests 
        SET fecha_actualizacion = COALESCE(updated_at, created_at, NOW())
        WHERE fecha_actualizacion IS NULL;
        
        RAISE NOTICE 'Columna fecha_actualizacion agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna fecha_actualizacion ya existe';
    END IF;
END
$$;

-- 5. Recrear el trigger para asegurar que funcione correctamente
CREATE OR REPLACE FUNCTION update_license_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si la columna existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'license_requests' 
        AND column_name = 'fecha_actualizacion'
    ) THEN
        NEW.fecha_actualizacion = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar y recrear el trigger
DROP TRIGGER IF EXISTS update_license_requests_timestamp ON license_requests;
CREATE TRIGGER update_license_requests_timestamp
    BEFORE UPDATE ON license_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_license_request_timestamp();

-- 6. Verificar que todo esté funcionando
SELECT 'Setup completado' as status;
