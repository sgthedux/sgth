-- Crear tabla de tipos de documento
CREATE TABLE IF NOT EXISTS document_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  snies_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de estados civiles
CREATE TABLE IF NOT EXISTS marital_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  snies_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de modalidades académicas
CREATE TABLE IF NOT EXISTS academic_modalities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  snies_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de instituciones
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  ies_code TEXT,
  country TEXT DEFAULT 'Colombia',
  country_code TEXT DEFAULT '170',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla de períodos de reporte
CREATE TABLE IF NOT EXISTS report_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year TEXT NOT NULL,
  semester TEXT NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos iniciales para tipos de documento
INSERT INTO document_types (name, snies_code) VALUES
('CC', '1'),
('TI', '2'),
('CE', '3'),
('PS', '4'),
('DNI', '5'),
('NIT', '6')
ON CONFLICT DO NOTHING;

-- Insertar datos iniciales para estados civiles
INSERT INTO marital_status (name, snies_code) VALUES
('Soltero(a)', '1'),
('Casado(a)', '2'),
('Divorciado(a)', '3'),
('Viudo(a)', '4'),
('Unión libre', '5')
ON CONFLICT DO NOTHING;

-- Insertar datos iniciales para modalidades académicas
INSERT INTO academic_modalities (name, snies_code) VALUES
('Presencial', '1'),
('Distancia', '2'),
('Virtual', '3'),
('Dual', '4')
ON CONFLICT DO NOTHING;

-- Insertar período de reporte actual
INSERT INTO report_periods (year, semester, is_active) VALUES
(EXTRACT(YEAR FROM NOW())::TEXT, 
 CASE WHEN EXTRACT(MONTH FROM NOW()) <= 6 THEN '1' ELSE '2' END,
 TRUE)
ON CONFLICT DO NOTHING;

-- Establecer políticas RLS para las tablas de catálogo
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE marital_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_periods ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir lectura a todos los usuarios autenticados
CREATE POLICY "Permitir lectura de tipos de documento a usuarios autenticados"
ON document_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir lectura de estados civiles a usuarios autenticados"
ON marital_status FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir lectura de modalidades académicas a usuarios autenticados"
ON academic_modalities FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir lectura de instituciones a usuarios autenticados"
ON institutions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir lectura de períodos de reporte a usuarios autenticados"
ON report_periods FOR SELECT
TO authenticated
USING (true);

-- Crear políticas para permitir escritura solo a administradores
CREATE POLICY "Permitir escritura de tipos de documento a administradores"
ON document_types FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Permitir escritura de estados civiles a administradores"
ON marital_status FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Permitir escritura de modalidades académicas a administradores"
ON academic_modalities FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Permitir escritura de instituciones a administradores"
ON institutions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Permitir escritura de períodos de reporte a administradores"
ON report_periods FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
