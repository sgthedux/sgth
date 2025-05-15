-- Actualizar la tabla personal_info para añadir campos requeridos por SNIES
ALTER TABLE personal_info
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS marital_status UUID REFERENCES marital_status(id),
ADD COLUMN IF NOT EXISTS institutional_email TEXT,
ADD COLUMN IF NOT EXISTS institutional_address TEXT,
ADD COLUMN IF NOT EXISTS birth_country TEXT DEFAULT '170',
ADD COLUMN IF NOT EXISTS birth_municipality TEXT,
ADD COLUMN IF NOT EXISTS residence_country TEXT DEFAULT '170',
ADD COLUMN IF NOT EXISTS residence_municipality TEXT;

-- Actualizar la tabla education para añadir campos requeridos por SNIES
ALTER TABLE education
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id),
ADD COLUMN IF NOT EXISTS institution_country TEXT DEFAULT '170',
ADD COLUMN IF NOT EXISTS title_validated BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS ies_code TEXT,
ADD COLUMN IF NOT EXISTS academic_modality UUID REFERENCES academic_modalities(id),
ADD COLUMN IF NOT EXISTS approved_semesters TEXT DEFAULT '1',
ADD COLUMN IF NOT EXISTS current BOOLEAN DEFAULT FALSE;

-- Actualizar la tabla identification_type para usar UUID como referencia
ALTER TABLE personal_info
DROP COLUMN IF EXISTS identification_type CASCADE;

ALTER TABLE personal_info
ADD COLUMN identification_type UUID REFERENCES document_types(id);

-- Actualizar la tabla experience para añadir campo current
ALTER TABLE experience
ADD COLUMN IF NOT EXISTS current BOOLEAN DEFAULT FALSE;
