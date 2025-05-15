-- Script para actualizar el esquema de la base de datos (versión 2)

-- 1. Actualizar la tabla personal_info para incluir todos los campos de datos personales
ALTER TABLE personal_info 
ADD COLUMN IF NOT EXISTS first_surname TEXT,
ADD COLUMN IF NOT EXISTS second_surname TEXT,
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS nationality TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS military_booklet_type TEXT,
ADD COLUMN IF NOT EXISTS military_booklet_number TEXT,
ADD COLUMN IF NOT EXISTS military_district TEXT,
ADD COLUMN IF NOT EXISTS birth_country TEXT,
ADD COLUMN IF NOT EXISTS birth_department TEXT,
ADD COLUMN IF NOT EXISTS birth_municipality TEXT,
ADD COLUMN IF NOT EXISTS residence_country TEXT,
ADD COLUMN IF NOT EXISTS residence_department TEXT,
ADD COLUMN IF NOT EXISTS residence_municipality TEXT;

-- 2. Actualizar la tabla education para incluir los campos de formación académica
ALTER TABLE education 
ADD COLUMN IF NOT EXISTS education_type TEXT, -- 'basic', 'higher'
ADD COLUMN IF NOT EXISTS last_grade_approved TEXT, -- Para educación básica
ADD COLUMN IF NOT EXISTS level TEXT, -- 'primary', 'secondary', 'middle'
ADD COLUMN IF NOT EXISTS graduation_year INTEGER,
ADD COLUMN IF NOT EXISTS academic_modality TEXT, -- 'TC', 'TL', 'TE', 'UN', 'ES', 'MG', 'DOC'
ADD COLUMN IF NOT EXISTS approved_semesters INTEGER,
ADD COLUMN IF NOT EXISTS graduated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS professional_card_number TEXT;

-- 3. Actualizar la tabla languages para incluir los campos de idiomas
ALTER TABLE languages 
ADD COLUMN IF NOT EXISTS speaking_level TEXT, -- 'R', 'B', 'MB'
ADD COLUMN IF NOT EXISTS reading_level TEXT, -- 'R', 'B', 'MB'
ADD COLUMN IF NOT EXISTS writing_level TEXT; -- 'R', 'B', 'MB'

-- 4. Actualizar la tabla experience para incluir los campos de experiencia laboral
ALTER TABLE experience 
ADD COLUMN IF NOT EXISTS entity_type TEXT, -- 'public', 'private'
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS municipality TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS dependency TEXT;

-- 5. Actualizar la tabla profiles para incluir campos adicionales
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_experience_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_experience_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS occupation TEXT; -- 'public_servant', 'private_employee', 'independent'

-- 6. Actualizar la tabla documents para mejorar la categorización
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS category TEXT, -- 'personal', 'education', 'language', 'experience'
ADD COLUMN IF NOT EXISTS item_id UUID; -- Referencia al item relacionado (education, language, experience)

-- 7. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_personal_info_user_id ON personal_info(user_id);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON education(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_user_id ON experience(user_id);
CREATE INDEX IF NOT EXISTS idx_languages_user_id ON languages(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_item_id ON documents(item_id);
