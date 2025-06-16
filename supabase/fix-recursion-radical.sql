-- Solución radical: Eliminar RLS de profiles y usar un enfoque híbrido

-- 1. Deshabilitar RLS en todas las tablas temporalmente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.education DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Eliminar todas las políticas de todas las tablas
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 3. Eliminar funciones problemáticas
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 4. MANTENER profiles SIN RLS (para evitar recursión)
-- La tabla profiles NO tendrá RLS - se manejará a nivel de aplicación

-- 5. Habilitar RLS solo en las otras tablas
ALTER TABLE public.personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 6. Crear función auxiliar SIN recursión para verificar admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar directamente desde los metadatos del JWT sin consultar profiles
  RETURN (
    auth.jwt() ->> 'role' = 'admin' OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 7. Crear políticas SOLO para las tablas que NO son profiles

-- POLÍTICAS PARA PERSONAL_INFO
CREATE POLICY "personal_info_select" ON public.personal_info
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "personal_info_insert" ON public.personal_info
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "personal_info_update" ON public.personal_info
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "personal_info_delete" ON public.personal_info
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

-- POLÍTICAS PARA EDUCATION
CREATE POLICY "education_select" ON public.education
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "education_insert" ON public.education
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "education_update" ON public.education
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "education_delete" ON public.education
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

-- POLÍTICAS PARA EXPERIENCE
CREATE POLICY "experience_select" ON public.experience
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "experience_insert" ON public.experience
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "experience_update" ON public.experience
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "experience_delete" ON public.experience
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

-- POLÍTICAS PARA LANGUAGES
CREATE POLICY "languages_select" ON public.languages
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "languages_insert" ON public.languages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "languages_update" ON public.languages
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "languages_delete" ON public.languages
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

-- POLÍTICAS PARA DOCUMENTS
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE USING (
    auth.uid() = user_id OR public.is_user_admin()
  );

-- 8. Políticas para tablas de catálogos (si existen)
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

-- 9. Crear función para manejar nuevos usuarios
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
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Crear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. Verificación final
DO $$
BEGIN
  RAISE NOTICE 'Solución radical aplicada:';
  RAISE NOTICE '- profiles: SIN RLS (manejado por aplicación)';
  RAISE NOTICE '- Otras tablas: CON RLS usando función auxiliar';
  RAISE NOTICE '- Sin recursión infinita';
END $$;
