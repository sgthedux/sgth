-- Script para habilitar RLS y configurar políticas de seguridad
-- Este script resuelve los errores mostrados en la imagen

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public profile creation" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Users can update own personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Users can insert own personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Admins can view all personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Admins can update all personal_info" ON public.personal_info;
DROP POLICY IF EXISTS "Users can insert their own personal info" ON public.personal_info;

DROP POLICY IF EXISTS "Users can view own education" ON public.education;
DROP POLICY IF EXISTS "Users can update own education" ON public.education;
DROP POLICY IF EXISTS "Users can insert own education" ON public.education;
DROP POLICY IF EXISTS "Users can delete own education" ON public.education;
DROP POLICY IF EXISTS "Admins can view all education" ON public.education;
DROP POLICY IF EXISTS "Admins can update all education" ON public.education;
DROP POLICY IF EXISTS "Users can insert their own education" ON public.education;

DROP POLICY IF EXISTS "Users can view own experience" ON public.experience;
DROP POLICY IF EXISTS "Users can update own experience" ON public.experience;
DROP POLICY IF EXISTS "Users can insert own experience" ON public.experience;
DROP POLICY IF EXISTS "Users can delete own experience" ON public.experience;
DROP POLICY IF EXISTS "Admins can view all experience" ON public.experience;
DROP POLICY IF EXISTS "Admins can update all experience" ON public.experience;
DROP POLICY IF EXISTS "Users can insert their own experience" ON public.experience;

DROP POLICY IF EXISTS "Users can view own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can update own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can insert own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can delete own languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can view all languages" ON public.languages;
DROP POLICY IF EXISTS "Admins can update all languages" ON public.languages;
DROP POLICY IF EXISTS "Users can insert their own languages" ON public.languages;

DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON public.documents;

-- 3. Crear función helper para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Políticas para la tabla PROFILES
-- Permitir a los usuarios ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Permitir a los usuarios actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Permitir a los usuarios insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Permitir a los administradores ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Permitir a los administradores actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Permitir a los administradores insertar cualquier perfil
CREATE POLICY "Admins can insert any profile" ON public.profiles
  FOR INSERT WITH CHECK (public.is_admin());

-- 5. Políticas para la tabla PERSONAL_INFO
-- Permitir a los usuarios ver su propia información personal
CREATE POLICY "Users can view own personal_info" ON public.personal_info
  FOR SELECT USING (auth.uid() = user_id);

-- Permitir a los usuarios actualizar su propia información personal
CREATE POLICY "Users can update own personal_info" ON public.personal_info
  FOR UPDATE USING (auth.uid() = user_id);

-- Permitir a los usuarios insertar su propia información personal
CREATE POLICY "Users can insert own personal_info" ON public.personal_info
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir a los administradores ver toda la información personal
CREATE POLICY "Admins can view all personal_info" ON public.personal_info
  FOR SELECT USING (public.is_admin());

-- Permitir a los administradores actualizar toda la información personal
CREATE POLICY "Admins can update all personal_info" ON public.personal_info
  FOR UPDATE USING (public.is_admin());

-- Permitir a los administradores insertar información personal para cualquier usuario
CREATE POLICY "Admins can insert any personal_info" ON public.personal_info
  FOR INSERT WITH CHECK (public.is_admin());

-- 6. Políticas para la tabla EDUCATION
-- Permitir a los usuarios ver su propia educación
CREATE POLICY "Users can view own education" ON public.education
  FOR SELECT USING (auth.uid() = user_id);

-- Permitir a los usuarios actualizar su propia educación
CREATE POLICY "Users can update own education" ON public.education
  FOR UPDATE USING (auth.uid() = user_id);

-- Permitir a los usuarios insertar su propia educación
CREATE POLICY "Users can insert own education" ON public.education
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir a los usuarios eliminar su propia educación
CREATE POLICY "Users can delete own education" ON public.education
  FOR DELETE USING (auth.uid() = user_id);

-- Permitir a los administradores ver toda la educación
CREATE POLICY "Admins can view all education" ON public.education
  FOR SELECT USING (public.is_admin());

-- Permitir a los administradores actualizar toda la educación
CREATE POLICY "Admins can update all education" ON public.education
  FOR UPDATE USING (public.is_admin());

-- Permitir a los administradores insertar educación para cualquier usuario
CREATE POLICY "Admins can insert any education" ON public.education
  FOR INSERT WITH CHECK (public.is_admin());

-- Permitir a los administradores eliminar cualquier educación
CREATE POLICY "Admins can delete any education" ON public.education
  FOR DELETE USING (public.is_admin());

-- 7. Políticas para la tabla EXPERIENCE
-- Permitir a los usuarios ver su propia experiencia
CREATE POLICY "Users can view own experience" ON public.experience
  FOR SELECT USING (auth.uid() = user_id);

-- Permitir a los usuarios actualizar su propia experiencia
CREATE POLICY "Users can update own experience" ON public.experience
  FOR UPDATE USING (auth.uid() = user_id);

-- Permitir a los usuarios insertar su propia experiencia
CREATE POLICY "Users can insert own experience" ON public.experience
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir a los usuarios eliminar su propia experiencia
CREATE POLICY "Users can delete own experience" ON public.experience
  FOR DELETE USING (auth.uid() = user_id);

-- Permitir a los administradores ver toda la experiencia
CREATE POLICY "Admins can view all experience" ON public.experience
  FOR SELECT USING (public.is_admin());

-- Permitir a los administradores actualizar toda la experiencia
CREATE POLICY "Admins can update all experience" ON public.experience
  FOR UPDATE USING (public.is_admin());

-- Permitir a los administradores insertar experiencia para cualquier usuario
CREATE POLICY "Admins can insert any experience" ON public.experience
  FOR INSERT WITH CHECK (public.is_admin());

-- Permitir a los administradores eliminar cualquier experiencia
CREATE POLICY "Admins can delete any experience" ON public.experience
  FOR DELETE USING (public.is_admin());

-- 8. Políticas para la tabla LANGUAGES
-- Permitir a los usuarios ver sus propios idiomas
CREATE POLICY "Users can view own languages" ON public.languages
  FOR SELECT USING (auth.uid() = user_id);

-- Permitir a los usuarios actualizar sus propios idiomas
CREATE POLICY "Users can update own languages" ON public.languages
  FOR UPDATE USING (auth.uid() = user_id);

-- Permitir a los usuarios insertar sus propios idiomas
CREATE POLICY "Users can insert own languages" ON public.languages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir a los usuarios eliminar sus propios idiomas
CREATE POLICY "Users can delete own languages" ON public.languages
  FOR DELETE USING (auth.uid() = user_id);

-- Permitir a los administradores ver todos los idiomas
CREATE POLICY "Admins can view all languages" ON public.languages
  FOR SELECT USING (public.is_admin());

-- Permitir a los administradores actualizar todos los idiomas
CREATE POLICY "Admins can update all languages" ON public.languages
  FOR UPDATE USING (public.is_admin());

-- Permitir a los administradores insertar idiomas para cualquier usuario
CREATE POLICY "Admins can insert any languages" ON public.languages
  FOR INSERT WITH CHECK (public.is_admin());

-- Permitir a los administradores eliminar cualquier idioma
CREATE POLICY "Admins can delete any languages" ON public.languages
  FOR DELETE USING (public.is_admin());

-- 9. Políticas para la tabla DOCUMENTS
-- Permitir a los usuarios ver sus propios documentos
CREATE POLICY "Users can view own documents" ON public.documents
  FOR SELECT USING (auth.uid() = user_id);

-- Permitir a los usuarios actualizar sus propios documentos
CREATE POLICY "Users can update own documents" ON public.documents
  FOR UPDATE USING (auth.uid() = user_id);

-- Permitir a los usuarios insertar sus propios documentos
CREATE POLICY "Users can insert own documents" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Permitir a los usuarios eliminar sus propios documentos
CREATE POLICY "Users can delete own documents" ON public.documents
  FOR DELETE USING (auth.uid() = user_id);

-- Permitir a los administradores ver todos los documentos
CREATE POLICY "Admins can view all documents" ON public.documents
  FOR SELECT USING (public.is_admin());

-- Permitir a los administradores actualizar todos los documentos
CREATE POLICY "Admins can update all documents" ON public.documents
  FOR UPDATE USING (public.is_admin());

-- Permitir a los administradores insertar documentos para cualquier usuario
CREATE POLICY "Admins can insert any documents" ON public.documents
  FOR INSERT WITH CHECK (public.is_admin());

-- Permitir a los administradores eliminar cualquier documento
CREATE POLICY "Admins can delete any documents" ON public.documents
  FOR DELETE USING (public.is_admin());

-- 10. Políticas para tablas de catálogos (acceso público de lectura)
-- Estas tablas necesitan acceso de lectura para todos los usuarios autenticados

-- Habilitar RLS en tablas de catálogos si existen
ALTER TABLE IF EXISTS public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marital_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academic_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.institutions ENABLE ROW LEVEL SECURITY;

-- Políticas para document_types
DROP POLICY IF EXISTS "Anyone can read document_types" ON public.document_types;
CREATE POLICY "Anyone can read document_types" ON public.document_types
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para marital_status
DROP POLICY IF EXISTS "Anyone can read marital_status" ON public.marital_status;
CREATE POLICY "Anyone can read marital_status" ON public.marital_status
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para academic_modalities
DROP POLICY IF EXISTS "Anyone can read academic_modalities" ON public.academic_modalities;
CREATE POLICY "Anyone can read academic_modalities" ON public.academic_modalities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Políticas para institutions
DROP POLICY IF EXISTS "Anyone can read institutions" ON public.institutions;
CREATE POLICY "Anyone can read institutions" ON public.institutions
  FOR SELECT USING (auth.role() = 'authenticated');

-- 11. Verificar que las políticas se aplicaron correctamente
DO $$
BEGIN
  RAISE NOTICE 'RLS habilitado y políticas configuradas correctamente';
  RAISE NOTICE 'Tablas con RLS habilitado:';
  RAISE NOTICE '- profiles: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles');
  RAISE NOTICE '- personal_info: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'personal_info');
  RAISE NOTICE '- education: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'education');
  RAISE NOTICE '- experience: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'experience');
  RAISE NOTICE '- languages: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'languages');
  RAISE NOTICE '- documents: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'documents');
END $$;
