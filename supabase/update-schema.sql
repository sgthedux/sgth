-- Actualización del esquema de la base de datos para coincidir con la estructura de los formularios

-- 1. Actualizar la tabla personal_info para incluir todos los campos de datos personales
ALTER TABLE personal_info 
DROP COLUMN IF EXISTS identification_type,
DROP COLUMN IF EXISTS identification_number,
DROP COLUMN IF EXISTS birth_date,
DROP COLUMN IF EXISTS gender,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS state,
DROP COLUMN IF EXISTS country,
DROP COLUMN IF EXISTS phone;

ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS first_surname TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS second_surname TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS identification_type TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS identification_number TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS military_booklet_type TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS military_booklet_number TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS military_district TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS birth_country TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS birth_state TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS birth_city TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS residence_country TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS residence_state TEXT;
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS residence_city TEXT;

-- 2. Actualizar la tabla education para incluir los campos de formación académica
ALTER TABLE education 
DROP COLUMN IF EXISTS institution,
DROP COLUMN IF EXISTS degree,
DROP COLUMN IF EXISTS field_of_study,
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS end_date,
DROP COLUMN IF EXISTS current,
DROP COLUMN IF EXISTS description;

ALTER TABLE education ADD COLUMN IF NOT EXISTS education_type TEXT; -- 'basic' o 'higher'
ALTER TABLE education ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE education ADD COLUMN IF NOT EXISTS degree TEXT;
ALTER TABLE education ADD COLUMN IF NOT EXISTS field_of_study TEXT; -- Para básica: Primaria, Secundaria, Media; Para superior: área de estudio
ALTER TABLE education ADD COLUMN IF NOT EXISTS level TEXT; -- Para básica: grado (1° a 11°); Para superior: modalidad (TC, TL, TE, UN, ES, MG, DOC)
ALTER TABLE education ADD COLUMN IF NOT EXISTS graduation_date DATE;
ALTER TABLE education ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE education ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE education ADD COLUMN IF NOT EXISTS current BOOLEAN DEFAULT FALSE;
ALTER TABLE education ADD COLUMN IF NOT EXISTS semesters_completed INTEGER;
ALTER TABLE education ADD COLUMN IF NOT EXISTS graduated BOOLEAN DEFAULT FALSE;
ALTER TABLE education ADD COLUMN IF NOT EXISTS professional_card_number TEXT;
ALTER TABLE education ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Actualizar la tabla languages para incluir los campos de idiomas
ALTER TABLE languages 
DROP COLUMN IF EXISTS language,
DROP COLUMN IF EXISTS proficiency;

ALTER TABLE languages ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE languages ADD COLUMN IF NOT EXISTS speaking_level TEXT; -- R, B, MB
ALTER TABLE languages ADD COLUMN IF NOT EXISTS reading_level TEXT; -- R, B, MB
ALTER TABLE languages ADD COLUMN IF NOT EXISTS writing_level TEXT; -- R, B, MB

-- 4. Actualizar la tabla experience para incluir los campos de experiencia laboral
ALTER TABLE experience 
DROP COLUMN IF EXISTS company,
DROP COLUMN IF EXISTS position,
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS end_date,
DROP COLUMN IF EXISTS current,
DROP COLUMN IF EXISTS description;

ALTER TABLE experience ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS company_type TEXT; -- 'public' o 'private'
ALTER TABLE experience ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS current BOOLEAN DEFAULT FALSE;
ALTER TABLE experience ADD COLUMN IF NOT EXISTS description TEXT;

-- 5. Actualizar la tabla profiles para incluir campos adicionales
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_experience_years INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_experience_months INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation TEXT; -- 'public', 'private', 'independent'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages_completed BOOLEAN DEFAULT FALSE;

-- 6. Actualizar la tabla documents para mejorar la categorización
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category TEXT; -- 'identification', 'military_booklet', 'education_basic', 'education_higher', 'language', 'experience'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS item_id TEXT; -- Para relacionar con elementos específicos (ej: education_1, language_2, etc.)

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_personal_info_user_id ON personal_info(user_id);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON education(user_id);
CREATE INDEX IF NOT EXISTS idx_languages_user_id ON languages(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_user_id ON experience(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- Actualizar las políticas de seguridad para las nuevas columnas
-- Las políticas existentes deberían seguir funcionando ya que están basadas en user_id
-- pero podemos verificarlas y actualizarlas si es necesario
