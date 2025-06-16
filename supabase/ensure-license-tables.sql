-- Crear tabla license_requests si no existe
CREATE TABLE IF NOT EXISTS license_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    radicado VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    tipo_documento VARCHAR(50) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    cargo VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_finalizacion DATE NOT NULL,
    observacion TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla license_evidences si no existe
CREATE TABLE IF NOT EXISTS license_evidences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    license_request_id UUID REFERENCES license_requests(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_license_requests_radicado ON license_requests(radicado);
CREATE INDEX IF NOT EXISTS idx_license_requests_user_id ON license_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_license_requests_estado ON license_requests(estado);
CREATE INDEX IF NOT EXISTS idx_license_evidences_license_request_id ON license_evidences(license_request_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE license_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_evidences ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para license_requests
DROP POLICY IF EXISTS "Users can view their own license requests" ON license_requests;
CREATE POLICY "Users can view their own license requests" ON license_requests
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own license requests" ON license_requests;
CREATE POLICY "Users can insert their own license requests" ON license_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own license requests" ON license_requests;
CREATE POLICY "Users can update their own license requests" ON license_requests
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para license_evidences
DROP POLICY IF EXISTS "Users can view evidences of their own requests" ON license_evidences;
CREATE POLICY "Users can view evidences of their own requests" ON license_evidences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM license_requests 
            WHERE license_requests.id = license_evidences.license_request_id 
            AND license_requests.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert evidences for their own requests" ON license_evidences;
CREATE POLICY "Users can insert evidences for their own requests" ON license_evidences
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM license_requests 
            WHERE license_requests.id = license_evidences.license_request_id 
            AND license_requests.user_id = auth.uid()
        )
    );

-- Políticas para administradores y RH
DROP POLICY IF EXISTS "Admins and RH can view all license requests" ON license_requests;
CREATE POLICY "Admins and RH can view all license requests" ON license_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'rh')
        )
    );

DROP POLICY IF EXISTS "Admins and RH can update all license requests" ON license_requests;
CREATE POLICY "Admins and RH can update all license requests" ON license_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'rh')
        )
    );

DROP POLICY IF EXISTS "Admins and RH can view all evidences" ON license_evidences;
CREATE POLICY "Admins and RH can view all evidences" ON license_evidences
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'rh')
        )
    );
