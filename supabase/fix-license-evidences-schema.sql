-- Script para corregir el esquema de license_evidences
-- Este script asegura que la tabla tenga todas las columnas necesarias
-- y que coincida con el código de la aplicación

-- 1. Agregar columna file_path si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'license_evidences' 
        AND column_name = 'file_path'
    ) THEN
        ALTER TABLE license_evidences ADD COLUMN file_path VARCHAR(500);
        -- Inicializar con file_url para registros existentes
        UPDATE license_evidences SET file_path = file_url WHERE file_path IS NULL;
    END IF;
END $$;

-- 2. Verificar que todas las columnas necesarias existan
-- Columnas requeridas por el código:
-- - id (ya existe)
-- - license_request_id (debe coincidir con el esquema actual)
-- - file_name (ya existe)
-- - file_url (ya existe)
-- - file_size (ya existe)
-- - file_type (ya existe)
-- - file_path (agregada arriba)
-- - created_at (ya existe)

-- 3. Verificar y mostrar el esquema actual
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'license_evidences'
ORDER BY ordinal_position;

-- 4. Crear políticas RLS simplificadas para permitir inserciones
-- (Necesario para que la API pueda insertar evidencias)

-- Limpiar políticas existentes
DROP POLICY IF EXISTS "public_insert_license_evidences" ON license_evidences;
DROP POLICY IF EXISTS "public_select_license_evidences" ON license_evidences;

-- Crear políticas simples que permitan inserción pública
-- (En un entorno de producción, esto debería ser más restrictivo)
CREATE POLICY "public_insert_license_evidences" ON license_evidences
    FOR INSERT WITH CHECK (true);

CREATE POLICY "public_select_license_evidences" ON license_evidences
    FOR SELECT USING (true);

-- 5. Mostrar políticas activas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'license_evidences';
