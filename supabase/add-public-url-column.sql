-- Añadir columna public_url a la tabla documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS public_url TEXT;

-- Actualizar los registros existentes para añadir la URL pública
UPDATE documents 
SET public_url = 'https://pub-373d536905984f8abf123c212109054.r2.dev/' || storage_path
WHERE storage_path IS NOT NULL AND public_url IS NULL;
