-- Script para configurar el sistema de licencias completo
-- Ejecutar en la consola SQL de Supabase

-- Crear tabla de solicitudes de licencia
CREATE TABLE IF NOT EXISTS public.license_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    radicado TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Puede ser nulo si la solicitud es anónima o el usuario se elimina
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    tipo_documento TEXT NOT NULL,
    numero_documento TEXT NOT NULL,
    cargo TEXT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_finalizacion DATE NOT NULL,
    observacion TEXT,
    status TEXT DEFAULT 'pendiente' NOT NULL, -- Ej: pendiente, aprobada, rechazada, en_revision
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_at TIMESTAMPTZ, -- Fecha en que se revisó/cambió el estado
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Quién creó la solicitud (puede ser diferente de user_id si un admin/rh la crea).
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL  -- Quién actualizó por última vez
);

-- Comentarios para columnas importantes
COMMENT ON COLUMN public.license_requests.radicado IS 'Número único de radicado para la solicitud.';
COMMENT ON COLUMN public.license_requests.user_id IS 'ID del usuario (de la tabla profiles) que realiza la solicitud.';
COMMENT ON COLUMN public.license_requests.status IS 'Estado actual de la solicitud (pendiente, aprobada, rechazada, en_revision).';
COMMENT ON COLUMN public.license_requests.reviewed_at IS 'Fecha y hora en que la solicitud fue revisada o su estado fue cambiado significativamente.';
COMMENT ON COLUMN public.license_requests.created_by IS 'ID del usuario que registró la solicitud (puede ser diferente de user_id si un admin/rh la crea).';
COMMENT ON COLUMN public.license_requests.updated_by IS 'ID del usuario que realizó la última actualización.';

-- Crear tabla de evidencias
CREATE TABLE IF NOT EXISTS public.license_evidences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.license_requests(id) ON DELETE CASCADE, -- Cambiado de license_request_id a request_id para consistencia
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Clave del objeto en R2 u otro almacenamiento
    file_url TEXT, -- URL pública directa al archivo en R2
    file_type TEXT,
    file_size BIGINT,
    uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comentarios para columnas importantes
COMMENT ON COLUMN public.license_evidences.request_id IS 'ID de la solicitud de licencia a la que pertenece esta evidencia.';
COMMENT ON COLUMN public.license_evidences.file_path IS 'Ruta o clave del archivo en el sistema de almacenamiento (ej. R2).';
COMMENT ON COLUMN public.license_evidences.file_url IS 'URL pública para acceder directamente al archivo.';

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_license_requests_user_id ON public.license_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_license_requests_status ON public.license_requests(status);
CREATE INDEX IF NOT EXISTS idx_license_evidences_request_id ON public.license_evidences(request_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.license_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_evidences ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Permitir inserción pública de solicitudes" ON public.license_requests;
DROP POLICY IF EXISTS "Permitir lectura pública por radicado" ON public.license_requests;
DROP POLICY IF EXISTS "Permitir actualización a usuarios autenticados" ON public.license_requests;
DROP POLICY IF EXISTS "Permitir inserción pública de evidencias" ON public.license_evidences;
DROP POLICY IF EXISTS "Permitir lectura pública de evidencias" ON public.license_evidences;

-- Políticas RLS para license_requests
-- Permitir inserción pública (para formularios anónimos)
CREATE POLICY "Permitir inserción pública de solicitudes" ON public.license_requests
    FOR INSERT WITH CHECK (true);

-- Permitir lectura pública por radicado (para consulta de estado)
CREATE POLICY "Permitir lectura pública por radicado" ON public.license_requests
    FOR SELECT USING (true);

-- Permitir actualización solo a usuarios autenticados (para RH)
CREATE POLICY "Permitir actualización a usuarios autenticados" ON public.license_requests
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas RLS para license_evidences
-- Permitir inserción pública
CREATE POLICY "Permitir inserción pública de evidencias" ON public.license_evidences
    FOR INSERT WITH CHECK (true);

-- Permitir lectura pública
CREATE POLICY "Permitir lectura pública de evidencias" ON public.license_evidences
    FOR SELECT USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en license_requests
DROP TRIGGER IF EXISTS update_license_requests_updated_at ON public.license_requests;
CREATE TRIGGER update_license_requests_updated_at
    BEFORE UPDATE ON public.license_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertar datos de prueba (opcional)
INSERT INTO public.license_requests (
    id, user_id, nombres, apellidos, tipo_documento, numero_documento, cargo, fecha_inicio, fecha_finalizacion, observacion, status
) VALUES 
(
    uuid_generate_v4(), 
    'profile-id-1', 
    'Juan', 
    'Pérez', 
    'CC', 
    '123456789', 
    'Desarrollador', 
    '2025-01-20', 
    '2025-01-25', 
    'Solicitud de licencia por motivos médicos', 
    'pendiente'
),
(
    uuid_generate_v4(), 
    'profile-id-2', 
    'María', 
    'López', 
    'TI', 
    '987654321', 
    'Analista', 
    '2025-02-01', 
    '2025-02-05', 
    'Solicitud de permiso por asuntos personales', 
    'aprobada'
) ON CONFLICT (id) DO NOTHING;

-- Verificar que las tablas se crearon correctamente
SELECT 
    'license_requests' as tabla,
    COUNT(*) as registros
FROM public.license_requests
UNION ALL
SELECT 
    'license_evidences' as tabla,
    COUNT(*) as registros
FROM public.license_evidences;

-- Mostrar estructura de las tablas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('license_requests', 'license_evidences')
ORDER BY table_name, ordinal_position;

-- Políticas RLS para license_requests:
-- 1. Usuarios pueden ver sus propias solicitudes.
CREATE POLICY "Usuarios pueden ver sus propias solicitudes de licencia"
ON public.license_requests FOR SELECT
USING (auth.uid() = user_id);

-- 2. Usuarios pueden crear solicitudes para sí mismos (user_id debe ser su auth.uid()).
CREATE POLICY "Usuarios pueden crear solicitudes de licencia para sí mismos"
ON public.license_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Administradores y RH pueden ver todas las solicitudes.
CREATE POLICY "Admins y RH pueden ver todas las solicitudes de licencia"
ON public.license_requests FOR SELECT
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'rh')
);

-- 4. Administradores y RH pueden crear solicitudes (potencialmente para otros, user_id puede ser diferente).
CREATE POLICY "Admins y RH pueden crear cualquier solicitud de licencia"
ON public.license_requests FOR INSERT
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'rh')
);

-- 5. Administradores y RH pueden actualizar cualquier solicitud.
CREATE POLICY "Admins y RH pueden actualizar cualquier solicitud de licencia"
ON public.license_requests FOR UPDATE
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'rh')
)
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'rh')
);

-- 6. Administradores y RH pueden eliminar cualquier solicitud.
CREATE POLICY "Admins y RH pueden eliminar cualquier solicitud de licencia"
ON public.license_requests FOR DELETE
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'rh')
);

-- Políticas RLS para license_evidences:
-- 1. Usuarios pueden ver evidencias de sus propias solicitudes.
CREATE POLICY "Usuarios pueden ver evidencias de sus propias licencias"
ON public.license_evidences FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.license_requests lr
        WHERE lr.id = request_id AND lr.user_id = auth.uid()
    )
);

-- 2. Usuarios pueden añadir evidencias a sus propias solicitudes.
CREATE POLICY "Usuarios pueden añadir evidencias a sus propias licencias"
ON public.license_evidences FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.license_requests lr
        WHERE lr.id = request_id AND lr.user_id = auth.uid()
    )
);

-- 3. Administradores y RH pueden ver todas las evidencias.
CREATE POLICY "Admins y RH pueden ver todas las evidencias de licencias"
ON public.license_evidences FOR SELECT
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'rh')
);

-- 4. Administradores y RH pueden añadir evidencias a cualquier solicitud.
CREATE POLICY "Admins y RH pueden añadir evidencias a cualquier licencia"
ON public.license_evidences FOR INSERT
WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'rh')
);

-- 5. Administradores y RH pueden eliminar cualquier evidencia.
CREATE POLICY "Admins y RH pueden eliminar cualquier evidencia de licencia"
ON public.license_evidences FOR DELETE
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'rh')
);

-- Trigger para actualizar 'updated_at' en license_requests
CREATE OR REPLACE FUNCTION public.handle_license_request_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    -- Si el estado cambia y es una acción de revisión, actualiza reviewed_at y updated_by
    IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        NEW.reviewed_at = timezone('utc'::text, now());
        -- Intenta obtener el user_id del usuario autenticado que realiza la acción
        -- Esto puede ser complicado en triggers si la sesión no está disponible directamente.
        -- Una alternativa es pasar el ID del revisor desde la aplicación.
        -- Por ahora, lo dejamos así o puedes añadir una columna 'reviewed_by_user_id'.
        -- NEW.updated_by = auth.uid(); -- Esto podría no funcionar como se espera en todos los contextos de trigger
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_license_request_update ON public.license_requests;
CREATE TRIGGER on_license_request_update
BEFORE UPDATE ON public.license_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_license_request_update();

-- Trigger para actualizar 'updated_at' y 'updated_by' cuando se crea una solicitud
-- (created_by y updated_by se setean al mismo valor en la creación)
CREATE OR REPLACE FUNCTION public.handle_license_request_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- NEW.created_by = auth.uid(); -- Asumiendo que auth.uid() está disponible y es quien crea
    -- NEW.updated_by = auth.uid();
    NEW.updated_at = timezone('utc'::text, now()); -- Asegurar que updated_at también se establece en la inserción
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_license_request_insert ON public.license_requests;
CREATE TRIGGER on_license_request_insert
BEFORE INSERT ON public.license_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_license_request_insert();

SELECT 'Sistema de licencias configurado exitosamente.' AS result;
