-- Este script verifica y repara la tabla 'license_requests'
-- Asegura que todas las columnas necesarias existan con los tipos correctos.

-- Asegurar la existencia y tipo correcto de la columna 'id' (PK)
-- Nota: Generalmente, Supabase maneja esto bien, pero es bueno verificar.
-- Si 'id' no es UUID o no es PK, se necesitarían pasos más complejos.

-- Asegurar 'radicado'
ALTER TABLE public.license_requests
ADD COLUMN IF NOT EXISTS radicado TEXT,
ALTER COLUMN radicado TYPE TEXT; -- Asegura que sea TEXT

-- Asegurar 'user_id' (FK a profiles.id)
ALTER TABLE public.license_requests
ADD COLUMN IF NOT EXISTS user_id UUID,
ALTER COLUMN user_id TYPE UUID;
-- Si la FK no existe, puedes añadirla (asegúrate que la tabla profiles y su PK existan):
-- ALTER TABLE public.license_requests
-- ADD CONSTRAINT license_requests_user_id_fkey FOREIGN KEY (user_id)
-- REFERENCES public.profiles (id) ON DELETE SET NULL; -- o ON DELETE CASCADE según tu lógica

-- Asegurar columnas de datos del solicitante
ALTER TABLE public.license_requests
ADD COLUMN IF NOT EXISTS nombres TEXT, ALTER COLUMN nombres TYPE TEXT,
ADD COLUMN IF NOT EXISTS apellidos TEXT, ALTER COLUMN apellidos TYPE TEXT,
ADD COLUMN IF NOT EXISTS tipo_documento TEXT, ALTER COLUMN tipo_documento TYPE TEXT,
ADD COLUMN IF NOT EXISTS numero_documento TEXT, ALTER COLUMN numero_documento TYPE TEXT,
ADD COLUMN IF NOT EXISTS cargo TEXT, ALTER COLUMN cargo TYPE TEXT;

-- Asegurar columnas de fechas de la licencia
ALTER TABLE public.license_requests
ADD COLUMN IF NOT EXISTS fecha_inicio DATE, ALTER COLUMN fecha_inicio TYPE DATE,
ADD COLUMN IF NOT EXISTS fecha_finalizacion DATE, ALTER COLUMN fecha_finalizacion TYPE DATE;

-- Asegurar 'observacion'
ALTER TABLE public.license_requests
ADD COLUMN IF NOT EXISTS observacion TEXT, ALTER COLUMN observacion TYPE TEXT;

-- Asegurar 'status'
ALTER TABLE public.license_requests
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendiente', -- Añade un default si es apropiado
ALTER COLUMN status TYPE TEXT; -- Asegura que sea TEXT (o tu ENUM si usas uno)

-- Asegurar 'created_at'
ALTER TABLE public.license_requests
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ALTER COLUMN created_at TYPE TIMESTAMPTZ,
ALTER COLUMN created_at SET DEFAULT now();

-- Asegurar 'updated_at'
ALTER TABLE public.license_requests
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ALTER COLUMN updated_at TYPE TIMESTAMPTZ,
ALTER COLUMN updated_at SET DEFAULT now();

-- Asegurar 'reviewed_at' (la que causaba problemas antes)
ALTER TABLE public.license_requests
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ALTER COLUMN reviewed_at TYPE TIMESTAMPTZ;

-- (Opcional) Añadir columnas 'created_by' y 'updated_by' si las necesitas
-- ALTER TABLE public.license_requests
-- ADD COLUMN IF NOT EXISTS created_by UUID, ALTER COLUMN created_by TYPE UUID,
-- ADD COLUMN IF NOT EXISTS updated_by UUID, ALTER COLUMN updated_by TYPE UUID;

-- Verifica la estructura final de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'license_requests'
ORDER BY ordinal_position;

-- Verifica también la tabla license_evidences por si acaso
ALTER TABLE public.license_evidences
ADD COLUMN IF NOT EXISTS file_url TEXT; -- Esta columna es usada en el frontend

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'license_evidences'
ORDER BY ordinal_position;
