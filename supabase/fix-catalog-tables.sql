-- Primero, eliminamos las restricciones de clave foránea existentes
ALTER TABLE personal_info 
DROP CONSTRAINT IF EXISTS personal_info_identification_type_fkey;

ALTER TABLE education
DROP CONSTRAINT IF EXISTS education_institution_id_fkey,
DROP CONSTRAINT IF EXISTS education_academic_modality_fkey;

ALTER TABLE personal_info
DROP CONSTRAINT IF EXISTS personal_info_marital_status_fkey;

-- Recreamos las tablas de catálogo con tipos consistentes
DROP TABLE IF EXISTS document_types CASCADE;
CREATE TABLE document_types (
  id TEXT PRIMARY KEY,  -- Cambiado a TEXT para mantener los códigos originales
  name TEXT NOT NULL,
  snies_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS marital_status CASCADE;
CREATE TABLE marital_status (
  id TEXT PRIMARY KEY,  -- Cambiado a TEXT para mantener los códigos originales
  name TEXT NOT NULL,
  snies_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS academic_modalities CASCADE;
CREATE TABLE academic_modalities (
  id TEXT PRIMARY KEY,  -- Cambiado a TEXT para mantener los códigos originales
  name TEXT NOT NULL,
  snies_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TABLE IF EXISTS institutions CASCADE;
CREATE TABLE institutions (
  id TEXT PRIMARY KEY,  -- Cambiado a TEXT para mantener los códigos originales
  name TEXT NOT NULL,
  ies_code TEXT,
  country TEXT DEFAULT 'Colombia',
  country_code TEXT DEFAULT '170',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Modificamos las columnas en personal_info y education para que sean de tipo TEXT
ALTER TABLE personal_info
ALTER COLUMN identification_type TYPE TEXT USING identification_type::TEXT,
ALTER COLUMN marital_status TYPE TEXT USING marital_status::TEXT;

ALTER TABLE education
ALTER COLUMN institution_id TYPE TEXT USING institution_id::TEXT,
ALTER COLUMN academic_modality TYPE TEXT USING academic_modality::TEXT;

-- Ahora insertamos los datos iniciales con IDs explícitos
INSERT INTO document_types (id, name, snies_code) VALUES
('CC', 'Cédula de Ciudadanía', '1'),
('TI', 'Tarjeta de Identidad', '2'),
('CE', 'Cédula de Extranjería', '3'),
('PAS', 'Pasaporte', '4'),
('DNI', 'Documento Nacional de Identidad', '5'),
('NIT', 'Número de Identificación Tributaria', '6')
ON CONFLICT (id) DO NOTHING;

INSERT INTO marital_status (id, name, snies_code) VALUES
('S', 'Soltero(a)', '1'),
('C', 'Casado(a)', '2'),
('D', 'Divorciado(a)', '3'),
('V', 'Viudo(a)', '4'),
('U', 'Unión libre', '5')
ON CONFLICT (id) DO NOTHING;

INSERT INTO academic_modalities (id, name, snies_code) VALUES
('P', 'Presencial', '1'),
('D', 'Distancia', '2'),
('V', 'Virtual', '3'),
('DU', 'Dual', '4')
ON CONFLICT (id) DO NOTHING;

-- Recreamos las restricciones de clave foránea
ALTER TABLE personal_info
ADD CONSTRAINT personal_info_identification_type_fkey 
FOREIGN KEY (identification_type) REFERENCES document_types(id),
ADD CONSTRAINT personal_info_marital_status_fkey
FOREIGN KEY (marital_status) REFERENCES marital_status(id);

ALTER TABLE education
ADD CONSTRAINT education_institution_id_fkey
FOREIGN KEY (institution_id) REFERENCES institutions(id),
ADD CONSTRAINT education_academic_modality_fkey
FOREIGN KEY (academic_modality) REFERENCES academic_modalities(id);

-- Establecer políticas RLS para las tablas de catálogo
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE marital_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

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
