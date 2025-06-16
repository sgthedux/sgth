-- Script completo para corregir la recursión infinita eliminando todas las dependencias

-- 1. Deshabilitar RLS temporalmente para evitar problemas durante la limpieza
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.education DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas existentes (incluyendo las que tienen nombres en español)

-- Políticas de profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Permitir lectura de perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Permitir actualización de perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Permitir inserción de perfiles" ON public.profiles;

-- Políticas de personal_info
DROP POLICY IF EXISTS "Users can view own personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Users can update own personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Users can insert own personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Admins can view all personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Admins can update all personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Admins can insert any personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Permitir lectura de información personal" ON public.personal_info;
DROP POLICY IF EXISTS "Permitir actualización de información personal" ON public.personal_info;
DROP POLICY IF EXISTS "Permitir inserción de información personal" ON public.personal_info;
DROP POLICY IF EXISTS "Permitir eliminación de información personal" ON public.personal_info;

-- Políticas de education
DROP POLICY IF EXISTS "Users can view own education" ON public.education;
DROP POLICY IF EXISTS "Users can update own education" ON public.education;
DROP POLICY IF EXISTS "Users can insert own education" ON public.education;
DROP POLICY IF EXISTS "Users can delete own education" ON public.education;
DROP POLICY IF EXISTS "Admins can view all education" ON public.education;
DROP POLICY IF EXISTS "Admins can update all education" ON public.education;
DROP POLICY IF EXISTS "Admins can insert any education" ON public.education;
DROP POLICY IF EXISTS "Admins can delete any education" ON public.education;
DROP POLICY IF EXISTS "Permitir lectura de educación" ON public.education;
DROP POLICY IF EXISTS "Permitir actualización de educación" ON public.education;
DROP POLICY IF EXISTS "Permitir inserción de educación" ON public.education;
DROP POLICY IF EXISTS "Permitir eliminación de educación" ON public.education;

-- Políticas de experience
DROP POLICY IF EXISTS "Users can view own experience" ON public.experience;
DROP POLICY IF EXISTS "Users can update own experience" ON public.experience;
DROP POLICY IF EXISTS "Users can insert own experience" ON public.experience;
DROP POLICY IF EXISTS "Users can delete own experience" ON public.experience;
DROP POLICY IF EXISTS "Admins can view all experience" ON public.experience;
DROP POLICY IF EXISTS "Admins can update all experience" ON public.experience;
DROP POLICY IF EXISTS "Admins can insert any experience" ON public.experience;
DROP POLICY IF EXISTS "Admins can delete any experience" ON public.experience;
DROP POLICY IF EXISTS "Permitir lectura de experiencia" ON public.experience;
DROP POLICY IF EXISTS "Permitir actualización de experiencia" ON public.experience;
DROP POLICY IF EXISTS "Permitir inserción de experiencia" ON public.experience;
DROP POLICY IF EXISTS "Permitir eliminación de experiencia" ON public.experience;

-- Políticas de languages
DROP POLICY IF EXISTS "Users can view own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can update own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can insert own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can delete own languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can view all languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can update all languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can insert any languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can delete any languages" ON public.languages;
DROP POLICY IF EXISTS "Permitir lectura de idiomas" ON public.languages;
DROP POLICY IF EXISTS "Permitir actualización de idiomas" ON public.languages;
DROP POLICY IF EXISTS "Permitir inserción de idiomas" ON public.languages;
DROP POLICY IF EXISTS "Permitir eliminación de idiomas" ON public.languages;

-- Políticas de documents
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can insert any documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can delete any documents" ON public.documents;
DROP POLICY IF EXISTS "Permitir lectura de documentos" ON public.documents;
DROP POLICY IF EXISTS "Permitir actualización de documentos" ON public.documents;
DROP POLICY IF EXISTS "Permitir inserción de documentos" ON public.documents;
DROP POLICY IF EXISTS "Permitir eliminación de documentos" ON public.documents;

-- Políticas de catálogos
DROP POLICY IF EXISTS "Anyone can read document_types" ON public.document_types;
DROP POLICY IF EXISTS "Anyone can read marital_status" ON public.marital_status;
DROP POLICY IF EXISTS "Anyone can read academic_modalities" ON public.academic_modalities;
DROP POLICY IF EXISTS "Anyone can read institutions" ON public.institutions;

-- 3. Ahora eliminar la función problemática
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 4. Habilitar RLS nuevamente
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas simplificadas SIN recursión usando solo JWT metadata

-- POLÍTICAS PARA PROFILES
CREATE POLICY "profiles_access" ON public.profiles
  FOR ALL USING (
    auth.uid() = id OR 
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- POLÍTICAS PARA PERSONAL_INFO
CREATE POLICY "personal_info_access" ON public.personal_info
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- POLÍTICAS PARA EDUCATION
CREATE POLICY "education_access" ON public.education
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- POLÍTICAS PARA EXPERIENCE
CREATE POLICY "experience_access" ON public.experience
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- POLÍTICAS PARA LANGUAGES
CREATE POLICY "languages_access" ON public.languages
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- POLÍTICAS PARA DOCUMENTS
CREATE POLICY "documents_access" ON public.documents
  FOR ALL USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 6. Políticas para tablas de catálogos (acceso de lectura para usuarios autenticados)
-- Habilitar RLS en tablas de catálogos si existen
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'document_types') THEN
    ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "document_types_read" ON public.document_types
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'marital_status') THEN
    ALTER TABLE public.marital_status ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "marital_status_read" ON public.marital_status
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'academic_modalities') THEN
    ALTER TABLE public.academic_modalities ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "academic_modalities_read" ON public.academic_modalities
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;

  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'institutions') THEN
    ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "institutions_read" ON public.institutions
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 7. Crear función para manejar nuevos usuarios (sin recursión)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Si el perfil ya existe, no hacer nada
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Verificación final
DO $$
BEGIN
  RAISE NOTICE 'Limpieza completa realizada';
  RAISE NOTICE 'Función is_admin() eliminada con CASCADE';
  RAISE NOTICE 'Políticas RLS simplificadas creadas';
  RAISE NOTICE 'Sin recursión - usando solo JWT metadata';
END $$;
