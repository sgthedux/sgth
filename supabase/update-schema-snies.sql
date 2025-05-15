-- Actualización de la tabla personal_info para incluir campos faltantes
ALTER TABLE personal_info 
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS institutional_email TEXT,
ADD COLUMN IF NOT EXISTS institutional_address TEXT;

-- Crear tabla de catálogo para tipos de documento
CREATE TABLE IF NOT EXISTS document_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  snies_code TEXT NOT NULL
);

-- Insertar valores predefinidos para tipos de documento
INSERT INTO document_types (id, name, snies_code) VALUES
('CC', 'Cédula de Ciudadanía', '1'),
('TI', 'Tarjeta de Identidad', '2'),
('CE', 'Cédula de Extranjería', '3'),
('PAS', 'Pasaporte', '4'),
('DNI', 'Documento Nacional de Identidad', '5'),
('NIT', 'NIT', '6')
ON CONFLICT (id) DO NOTHING;

-- Crear tabla de catálogo para estado civil
CREATE TABLE IF NOT EXISTS marital_status (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  snies_code TEXT NOT NULL
);

-- Insertar valores predefinidos para estado civil
INSERT INTO marital_status (id, name, snies_code) VALUES
('S', 'Soltero/a', '1'),
('C', 'Casado/a', '2'),
('U', 'Unión Libre', '3'),
('D', 'Divorciado/a', '4'),
('V', 'Viudo/a', '5')
ON CONFLICT (id) DO NOTHING;

-- Actualización de la tabla education para incluir campos faltantes
ALTER TABLE education 
ADD COLUMN IF NOT EXISTS institution_country TEXT,
ADD COLUMN IF NOT EXISTS title_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ies_code TEXT,
ADD COLUMN IF NOT EXISTS academic_modality TEXT;

-- Crear tabla de catálogo para modalidades académicas
CREATE TABLE IF NOT EXISTS academic_modalities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  snies_code TEXT NOT NULL
);

-- Insertar valores predefinidos para modalidades académicas
INSERT INTO academic_modalities (id, name, snies_code) VALUES
('P', 'Presencial', '1'),
('D', 'Distancia', '2'),
('V', 'Virtual', '3'),
('DU', 'Dual', '4')
ON CONFLICT (id) DO NOTHING;

-- Crear tabla para instituciones educativas
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ies_code TEXT UNIQUE,
  name TEXT NOT NULL,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Crear tabla para períodos de reporte
CREATE TABLE IF NOT EXISTS report_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(year, semester)
);

-- Insertar período actual
INSERT INTO report_periods (year, semester, start_date, end_date, is_active)
VALUES (
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) <= 6 THEN 1 ELSE 2 END,
  CASE 
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) <= 6 
    THEN DATE_TRUNC('year', CURRENT_DATE)
    ELSE DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '6 months'
  END,
  CASE 
    WHEN EXTRACT(MONTH FROM CURRENT_DATE) <= 6 
    THEN DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '6 months' - INTERVAL '1 day'
    ELSE DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day'
  END,
  TRUE
)
ON CONFLICT (year, semester) DO NOTHING;

-- Actualizar triggers para nuevas tablas
CREATE TRIGGER update_institutions_timestamp
  BEFORE UPDATE ON institutions
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_report_periods_timestamp
  BEFORE UPDATE ON report_periods
  FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
