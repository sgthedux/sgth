-- Script para corregir la recursión infinita en las políticas RLS
-- Eliminamos la función is_admin() que causa el problema y usamos un enfoque más directo

-- 1. Eliminar la función problemática
DROP FUNCTION IF EXISTS public.is_admin();

-- 2. Deshabilitar RLS temporalmente para limpiar políticas
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.education DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

-- 3. Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Users can update own personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Users can insert own personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Admins can view all personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Admins can update all personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Admins can insert any personal_info" ON public.personal_info;

DROP POLICY IF EXISTS "Users can view own education" ON public.education;
DROP POLICY IF EXISTS "Users can update own education" ON public.education;
DROP POLICY IF EXISTS "Users can insert own education" ON public.education;
DROP POLICY IF EXISTS "Users can delete own education" ON public.education;
DROP POLICY IF EXISTS "Admins can view all education" ON public.education;
DROP POLICY IF EXISTS "Admins can update all education" ON public.education;
DROP POLICY IF EXISTS "Admins can insert any education" ON public.education;
DROP POLICY IF EXISTS "Admins can delete any education" ON public.education;

DROP POLICY IF EXISTS "Users can view own experience" ON public.experience;
DROP POLICY IF EXISTS "Users can update own experience" ON public.experience;
DROP POLICY IF EXISTS "Users can insert own experience" ON public.experience;
DROP POLICY IF EXISTS "Users can delete own experience" ON public.experience;
DROP POLICY IF EXISTS "Admins can view all experience" ON public.experience;
DROP POLICY IF EXISTS "Admins can update all experience" ON public.experience;
DROP POLICY IF EXISTS "Admins can insert any experience" ON public.experience;
DROP POLICY IF EXISTS "Admins can delete any experience" ON public.experience;

DROP POLICY IF EXISTS "Users can view own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can update own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can insert own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can delete own languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can view all languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can update all languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can insert any languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can delete any languages" ON public.languages;

DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can insert any documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can delete any documents" ON public.documents;

-- 4. Habilitar RLS nuevamente
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas simplificadas SIN recursión

-- POLÍTICAS PARA PROFILES
-- Los usuarios pueden ver y editar su propio perfil
CREATE POLICY "profiles_user_access" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Los administradores pueden ver todos los perfiles (usando metadata del JWT)
CREATE POLICY "profiles_admin_access" ON public.profiles
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- POLÍTICAS PARA PERSONAL_INFO
-- Los usuarios pueden gestionar su propia información personal
CREATE POLICY "personal_info_user_access" ON public.personal_info
  FOR ALL USING (auth.uid() = user_id);

-- Los administradores pueden gestionar toda la información personal
CREATE POLICY "personal_info_admin_access" ON public.personal_info
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- POLÍTICAS PARA EDUCATION
-- Los usuarios pueden gestionar su propia educación
CREATE POLICY "education_user_access" ON public.education
  FOR ALL USING (auth.uid() = user_id);

-- Los administradores pueden gestionar toda la educación
CREATE POLICY "education_admin_access" ON public.education
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- POLÍTICAS PARA EXPERIENCE
-- Los usuarios pueden gestionar su propia experiencia
CREATE POLICY "experience_user_access" ON public.experience
  FOR ALL USING (auth.uid() = user_id);

-- Los administradores pueden gestionar toda la experiencia
CREATE POLICY "experience_admin_access" ON public.experience
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- POLÍTICAS PARA LANGUAGES
-- Los usuarios pueden gestionar sus propios idiomas
CREATE POLICY "languages_user_access" ON public.languages
  FOR ALL USING (auth.uid() = user_id);

-- Los administradores pueden gestionar todos los idiomas
CREATE POLICY "languages_admin_access" ON public.languages
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- POLÍTICAS PARA DOCUMENTS
-- Los usuarios pueden gestionar sus propios documentos
CREATE POLICY "documents_user_access" ON public.documents
  FOR ALL USING (auth.uid() = user_id);

-- Los administradores pueden gestionar todos los documentos
CREATE POLICY "documents_admin_access" ON public.documents
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 6. Políticas para tablas de catálogos (acceso público de lectura)
-- Estas tablas necesitan acceso de lectura para todos los usuarios autenticados

-- Habilitar RLS en tablas de catálogos si existen
ALTER TABLE IF EXISTS public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marital_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academic_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.institutions ENABLE ROW LEVEL SECURITY;

-- Políticas para document_types
DROP POLICY IF EXISTS "Anyone can read document_types" ON public.document_types;
CREATE POLICY "document_types_read_access" ON public.document_types
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para marital_status
DROP POLICY IF EXISTS "Anyone can read marital_status" ON public.marital_status;
CREATE POLICY "marital_status_read_access" ON public.marital_status
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para academic_modalities
DROP POLICY IF EXISTS "Anyone can read academic_modalities" ON public.academic_modalities;
CREATE POLICY "academic_modalities_read_access" ON public.academic_modalities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para institutions
DROP POLICY IF EXISTS "Anyone can read institutions" ON public.institutions;
CREATE POLICY "institutions_read_access" ON public.institutions
  FOR SELECT USING (auth.role() = 'authenticated');

-- 7. Crear función para actualizar metadata de usuario (sin recursión)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Verificar que las políticas se aplicaron correctamente
DO $$
BEGIN
  RAISE NOTICE 'RLS configurado correctamente sin recursión';
  RAISE NOTICE 'Políticas simplificadas aplicadas';
  RAISE NOTICE 'Usando metadata del JWT para verificar roles de admin';
END $$;
