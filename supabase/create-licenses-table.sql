-- Crear tabla para solicitudes de licencias y permisos
CREATE TABLE IF NOT EXISTS license_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    radicado VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(10) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_finalizacion DATE NOT NULL,
    observacion TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'en_revision')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Crear tabla para evidencias/documentos de soporte
CREATE TABLE IF NOT EXISTS license_evidences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_request_id UUID REFERENCES license_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_license_requests_radicado ON license_requests(radicado);
CREATE INDEX IF NOT EXISTS idx_license_requests_user_id ON license_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_license_requests_estado ON license_requests(estado);
CREATE INDEX IF NOT EXISTS idx_license_requests_fecha_creacion ON license_requests(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_license_evidences_license_request_id ON license_evidences(license_request_id);

-- Función para generar radicado único
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

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION update_license_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_license_requests_timestamp
    BEFORE UPDATE ON license_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_license_request_timestamp();

-- Habilitar RLS
ALTER TABLE license_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_evidences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para license_requests
CREATE POLICY "Los usuarios pueden ver sus propias solicitudes de licencia"
    ON license_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden crear sus propias solicitudes de licencia"
    ON license_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Los usuarios pueden actualizar sus propias solicitudes de licencia"
    ON license_requests FOR UPDATE
    USING (auth.uid() = user_id);

-- Políticas RLS para license_evidences
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

-- Políticas para administradores (asumiendo que tienen un rol 'admin')
CREATE POLICY "Los administradores pueden ver todas las solicitudes de licencia"
    ON license_requests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );

CREATE POLICY "Los administradores pueden ver todas las evidencias"
    ON license_evidences FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role = 'admin'
        )
    );
