-- Crear tabla de solicitudes de licencia
CREATE TABLE IF NOT EXISTS license_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    radicado VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_finalizacion DATE NOT NULL,
    observacion TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'aprobada', 'rechazada')),
    comentarios_rh TEXT,
    aprobado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de evidencias
CREATE TABLE IF NOT EXISTS license_evidences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_request_id UUID REFERENCES license_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_path TEXT,
    file_size INTEGER,
    file_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_license_requests_radicado ON license_requests(radicado);
CREATE INDEX IF NOT EXISTS idx_license_requests_user_id ON license_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_license_requests_estado ON license_requests(estado);
CREATE INDEX IF NOT EXISTS idx_license_requests_created_at ON license_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_license_evidences_license_request_id ON license_evidences(license_request_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE license_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_evidences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para license_requests
-- Permitir inserción pública (para formularios anónimos)
CREATE POLICY IF NOT EXISTS "Permitir inserción pública de solicitudes" ON license_requests
    FOR INSERT WITH CHECK (true);

-- Permitir lectura pública por radicado (para consulta de estado)
CREATE POLICY IF NOT EXISTS "Permitir lectura pública por radicado" ON license_requests
    FOR SELECT USING (true);

-- Permitir actualización solo a usuarios autenticados (para RH)
CREATE POLICY IF NOT EXISTS "Permitir actualización a usuarios autenticados" ON license_requests
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas RLS para license_evidences
-- Permitir inserción pública
CREATE POLICY IF NOT EXISTS "Permitir inserción pública de evidencias" ON license_evidences
    FOR INSERT WITH CHECK (true);

-- Permitir lectura pública
CREATE POLICY IF NOT EXISTS "Permitir lectura pública de evidencias" ON license_evidences
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
DROP TRIGGER IF EXISTS update_license_requests_updated_at ON license_requests;
CREATE TRIGGER update_license_requests_updated_at
    BEFORE UPDATE ON license_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comentarios para documentación
COMMENT ON TABLE license_requests IS 'Tabla para almacenar solicitudes de licencias y permisos';
COMMENT ON TABLE license_evidences IS 'Tabla para almacenar evidencias/documentos de soporte de las solicitudes';
COMMENT ON COLUMN license_requests.radicado IS 'Número único de radicado para identificar la solicitud';
COMMENT ON COLUMN license_requests.estado IS 'Estado actual de la solicitud: pendiente, en_revision, aprobada, rechazada';
COMMENT ON COLUMN license_evidences.file_url IS 'URL pública del archivo en R2';
COMMENT ON COLUMN license_evidences.file_path IS 'Ruta interna del archivo en R2';
