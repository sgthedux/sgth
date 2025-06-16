-- Migración para actualizar tablas existentes de licencias (CORREGIDA v2)
-- Este script actualiza las tablas existentes sin perder datos

-- Verificar y agregar columnas faltantes en license_requests
DO $$ 
BEGIN
    -- Agregar columnas que podrían faltar
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_requests' AND column_name = 'fecha_creacion') THEN
        ALTER TABLE license_requests ADD COLUMN fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        -- Copiar datos de created_at si existe
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_requests' AND column_name = 'created_at') THEN
            UPDATE license_requests SET fecha_creacion = created_at WHERE fecha_creacion IS NULL;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_requests' AND column_name = 'fecha_actualizacion') THEN
        ALTER TABLE license_requests ADD COLUMN fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        -- Copiar datos de updated_at si existe
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_requests' AND column_name = 'updated_at') THEN
            UPDATE license_requests SET fecha_actualizacion = updated_at WHERE fecha_actualizacion IS NULL;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_requests' AND column_name = 'created_by') THEN
        ALTER TABLE license_requests ADD COLUMN created_by UUID REFERENCES auth.users(id);
        -- Copiar user_id como created_by para registros existentes
        UPDATE license_requests SET created_by = user_id WHERE created_by IS NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_requests' AND column_name = 'updated_by') THEN
        ALTER TABLE license_requests ADD COLUMN updated_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Verificar y agregar columnas faltantes en license_evidences
DO $$ 
BEGIN
    -- Agregar columna file_path si no existe (mapear desde file_url)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_evidences' AND column_name = 'file_path') THEN
        ALTER TABLE license_evidences ADD COLUMN file_path VARCHAR(500);
        -- Copiar datos de file_url si existe
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_evidences' AND column_name = 'file_url') THEN
            UPDATE license_evidences SET file_path = file_url WHERE file_path IS NULL;
        END IF;
    END IF;

    -- Agregar columna uploaded_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_evidences' AND column_name = 'uploaded_at') THEN
        ALTER TABLE license_evidences ADD COLUMN uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        -- Copiar datos de created_at si existe
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'license_evidences' AND column_name = 'created_at') THEN
            UPDATE license_evidences SET uploaded_at = created_at WHERE uploaded_at IS NULL;
        END IF;
    END IF;
END $$;

-- Actualizar constraints y validaciones
DO $$
BEGIN
    -- Verificar si el constraint de estado existe usando la consulta correcta
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'license_requests' 
        AND tc.constraint_type = 'CHECK'
        AND ccu.column_name = 'estado'
    ) THEN
        -- Intentar agregar el constraint, pero manejar el caso donde ya existe
        BEGIN
            ALTER TABLE license_requests 
            ADD CONSTRAINT check_estado 
            CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'en_revision'));
        EXCEPTION
            WHEN duplicate_object THEN
                -- El constraint ya existe, continuar
                NULL;
        END;
    END IF;
END $$;

-- Crear función para generar radicado único si no existe
CREATE OR REPLACE FUNCTION generate_radicado()
RETURNS VARCHAR(20) AS $$
DECLARE
    new_radicado VARCHAR(20);
    counter INTEGER := 1;
BEGIN
    LOOP
        new_radicado := 'LIC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0');
        
        -- Verificar si el radicado ya existe
        IF NOT EXISTS (SELECT 1 FROM license_requests WHERE radicado = new_radicado) THEN
            RETURN new_radicado;
        END IF;
        
        counter := counter + 1;
        
        -- Evitar bucle infinito
        IF counter > 999999 THEN
            RAISE EXCEPTION 'No se pudo generar un radicado único';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para actualizar fecha_actualizacion si no existe
CREATE OR REPLACE FUNCTION update_license_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger existente si existe y crear uno nuevo
DROP TRIGGER IF EXISTS update_license_requests_timestamp ON license_requests;
CREATE TRIGGER update_license_requests_timestamp
    BEFORE UPDATE ON license_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_license_request_timestamp();

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_license_requests_radicado ON license_requests(radicado);
CREATE INDEX IF NOT EXISTS idx_license_requests_user_id ON license_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_license_requests_estado ON license_requests(estado);
CREATE INDEX IF NOT EXISTS idx_license_requests_fecha_creacion ON license_requests(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_license_evidences_license_request_id ON license_evidences(license_request_id);

-- Habilitar RLS si no está habilitado
ALTER TABLE license_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_evidences ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias solicitudes de licencia" ON license_requests;
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propias solicitudes de licencia" ON license_requests;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias solicitudes de licencia" ON license_requests;
DROP POLICY IF EXISTS "Los usuarios pueden ver evidencias de sus propias solicitudes" ON license_evidences;
DROP POLICY IF EXISTS "Los usuarios pueden crear evidencias para sus propias solicitudes" ON license_evidences;
DROP POLICY IF EXISTS "Los administradores pueden ver todas las solicitudes de licencia" ON license_requests;
DROP POLICY IF EXISTS "Los administradores pueden ver todas las evidencias" ON license_evidences;

-- Crear políticas RLS actualizadas
CREATE POLICY "Los usuarios pueden ver sus propias solicitudes de licencia"
    ON license_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias solicitudes de licencia"
    ON license_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias solicitudes de licencia"
    ON license_requests FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden ver evidencias de sus propias solicitudes"
    ON license_evidences FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM license_requests 
            WHERE license_requests.id = license_evidences.license_request_id 
            AND license_requests.user_id = auth.uid()
        )
    );

CREATE POLICY "Los usuarios pueden crear evidencias para sus propias solicitudes"
    ON license_evidences FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM license_requests 
            WHERE license_requests.id = license_evidences.license_request_id 
            AND license_requests.user_id = auth.uid()
        )
    );

-- Políticas para administradores (CORREGIDO - sin usar user_profiles)
CREATE POLICY "Los administradores pueden ver todas las solicitudes de licencia"
    ON license_requests FOR ALL
    USING (
        -- Permitir acceso a todos los usuarios con rol 'admin' o 'service_role'
        auth.jwt() ->> 'role' IN ('admin', 'service_role')
    );

CREATE POLICY "Los administradores pueden ver todas las evidencias"
    ON license_evidences FOR ALL
    USING (
        -- Permitir acceso a todos los usuarios con rol 'admin' o 'service_role'
        auth.jwt() ->> 'role' IN ('admin', 'service_role')
    );

-- Actualizar registros existentes que no tengan radicado
UPDATE license_requests 
SET radicado = 'LIC-' || TO_CHAR(COALESCE(fecha_creacion, created_at, NOW()), 'YYYY') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY COALESCE(fecha_creacion, created_at, NOW()))::TEXT, 6, '0')
WHERE radicado IS NULL OR radicado = '';

-- Establecer valores por defecto para campos que podrían estar vacíos
UPDATE license_requests SET estado = 'pendiente' WHERE estado IS NULL OR estado = '';
UPDATE license_requests SET fecha_creacion = COALESCE(created_at, NOW()) WHERE fecha_creacion IS NULL;
UPDATE license_requests SET fecha_actualizacion = COALESCE(updated_at, fecha_creacion, NOW()) WHERE fecha_actualizacion IS NULL;
