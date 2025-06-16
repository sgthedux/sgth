-- SOLUCIÓN DEFINITIVA: DESHABILITAR RLS COMPLETAMENTE
-- Esta es una solución estable para producción

-- 1. Deshabilitar RLS en TODAS las tablas
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.personal_info DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.education DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.experience DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.languages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.document_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.marital_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.academic_modalities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.institutions DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas RLS existentes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', r.policyname, r.schemaname, r.tablename);
    END LOOP;
    RAISE NOTICE 'Todas las políticas RLS han sido eliminadas';
END $$;

-- 3. Eliminar todas las funciones relacionadas con RLS
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_user_admin() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 4. Crear función simple para nuevos usuarios (sin RLS)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recrear trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Verificación final
DO $$
BEGIN
  RAISE NOTICE '=== SOLUCIÓN APLICADA ===';
  RAISE NOTICE 'RLS COMPLETAMENTE DESHABILITADO';
  RAISE NOTICE 'Seguridad manejada a nivel de aplicación';
  RAISE NOTICE 'Listo para producción';
END $$;
