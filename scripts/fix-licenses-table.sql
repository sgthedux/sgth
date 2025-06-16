-- Este script repara la tabla 'license_requests' asegurando que la columna 'reviewed_at' exista.
-- Ejecútalo en el SQL Editor de tu proyecto Supabase.

ALTER TABLE public.license_requests
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Verifica que la columna ahora existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'license_requests' AND column_name = 'reviewed_at';
