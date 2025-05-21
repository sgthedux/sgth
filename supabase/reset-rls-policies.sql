-- Desactivar temporalmente RLS para todas las tablas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE education DISABLE ROW LEVEL SECURITY;
ALTER TABLE experience DISABLE ROW LEVEL SECURITY;
ALTER TABLE languages DISABLE ROW LEVEL SECURITY;
ALTER TABLE personal_info DISABLE ROW LEVEL SECURITY;

-- Eliminar todos los triggers existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_timestamp ON profiles;
DROP TRIGGER IF EXISTS update_documents_timestamp ON documents;
DROP TRIGGER IF EXISTS update_education_timestamp ON education;
DROP TRIGGER IF EXISTS update_experience_timestamp ON experience;
DROP TRIGGER IF EXISTS update_languages_timestamp ON languages;
DROP TRIGGER IF EXISTS update_personal_info_timestamp ON personal_info;
DROP TRIGGER IF EXISTS on_profile_change ON profiles;
DROP TRIGGER IF EXISTS on_role_update ON profiles;
DROP TRIGGER IF EXISTS sync_role_trigger ON profiles;
DROP TRIGGER IF EXISTS sync_role_to_metadata ON profiles;

-- Eliminar todas las funciones de trigger existentes
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.sync_auth_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.sync_role_to_metadata() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin_safe() CASCADE;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete documents" ON documents;
-- Eliminar políticas para education, experience, languages, personal_info (similar a las anteriores)

-- Crear función para verificar si un usuario está autenticado
CREATE OR REPLACE FUNCTION auth.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO is_admin FROM profiles WHERE id = auth.uid();
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear función para manejar nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para nuevos usuarios
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Crear función para sincronizar rol con metadatos
CREATE OR REPLACE FUNCTION public.sync_role_with_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo actualizar si el rol ha cambiado
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Actualizar los metadatos del usuario con el rol
    UPDATE auth.users
    SET raw_user_meta_data = 
      CASE 
        WHEN raw_user_meta_data IS NULL THEN 
          jsonb_build_object('role', NEW.role)
        ELSE 
          raw_user_meta_data || jsonb_build_object('role', NEW.role)
      END
    WHERE id = NEW.id;
  END IF;
  
  -- Actualizar el timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para sincronizar rol
CREATE TRIGGER sync_role_with_metadata
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_role_with_metadata();

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear triggers para actualizar timestamps
CREATE TRIGGER update_documents_timestamp
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_education_timestamp
  BEFORE UPDATE ON education
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_experience_timestamp
  BEFORE UPDATE ON experience
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_languages_timestamp
  BEFORE UPDATE ON languages
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_personal_info_timestamp
  BEFORE UPDATE ON personal_info
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Volver a habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_info ENABLE ROW LEVEL SECURITY;

-- Crear políticas simplificadas para profiles
-- Permitir a usuarios autenticados ver su propio perfil
CREATE POLICY "Usuarios autenticados pueden ver su propio perfil"
ON profiles FOR SELECT
USING (auth.uid() = id OR auth.is_admin());

-- Permitir a usuarios autenticados actualizar su propio perfil
CREATE POLICY "Usuarios autenticados pueden actualizar su propio perfil"
ON profiles FOR UPDATE
USING (auth.uid() = id OR auth.is_admin());

-- Permitir a administradores insertar perfiles
CREATE POLICY "Administradores pueden insertar perfiles"
ON profiles FOR INSERT
WITH CHECK (auth.is_admin());

-- Permitir a administradores eliminar perfiles
CREATE POLICY "Administradores pueden eliminar perfiles"
ON profiles FOR DELETE
USING (auth.is_admin());

-- Crear políticas simplificadas para documents
-- Permitir a usuarios autenticados ver sus propios documentos
CREATE POLICY "Usuarios autenticados pueden ver sus propios documentos"
ON documents FOR SELECT
USING (auth.uid() = user_id OR auth.is_admin());

-- Permitir a usuarios autenticados insertar sus propios documentos
CREATE POLICY "Usuarios autenticados pueden insertar sus propios documentos"
ON documents FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.is_admin());

-- Permitir a usuarios autenticados actualizar sus propios documentos
CREATE POLICY "Usuarios autenticados pueden actualizar sus propios documentos"
ON documents FOR UPDATE
USING (auth.uid() = user_id OR auth.is_admin());

-- Permitir a usuarios autenticados eliminar sus propios documentos
CREATE POLICY "Usuarios autenticados pueden eliminar sus propios documentos"
ON documents FOR DELETE
USING (auth.uid() = user_id OR auth.is_admin());

-- Crear políticas similares para education
CREATE POLICY "Usuarios autenticados pueden ver su propia educación"
ON education FOR SELECT
USING (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden insertar su propia educación"
ON education FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden actualizar su propia educación"
ON education FOR UPDATE
USING (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden eliminar su propia educación"
ON education FOR DELETE
USING (auth.uid() = user_id OR auth.is_admin());

-- Crear políticas similares para experience
CREATE POLICY "Usuarios autenticados pueden ver su propia experiencia"
ON experience FOR SELECT
USING (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden insertar su propia experiencia"
ON experience FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden actualizar su propia experiencia"
ON experience FOR UPDATE
USING (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden eliminar su propia experiencia"
ON experience FOR DELETE
USING (auth.uid() = user_id OR auth.is_admin());

-- Crear políticas similares para languages
CREATE POLICY "Usuarios autenticados pueden ver sus propios idiomas"
ON languages FOR SELECT
USING (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden insertar sus propios idiomas"
ON languages FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden actualizar sus propios idiomas"
ON languages FOR UPDATE
USING (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden eliminar sus propios idiomas"
ON languages FOR DELETE
USING (auth.uid() = user_id OR auth.is_admin());

-- Crear políticas similares para personal_info
CREATE POLICY "Usuarios autenticados pueden ver su propia información personal"
ON personal_info FOR SELECT
USING (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden insertar su propia información personal"
ON personal_info FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden actualizar su propia información personal"
ON personal_info FOR UPDATE
USING (auth.uid() = user_id OR auth.is_admin());

CREATE POLICY "Usuarios autenticados pueden eliminar su propia información personal"
ON personal_info FOR DELETE
USING (auth.uid() = user_id OR auth.is_admin());

-- Sincronizar los roles existentes con los metadatos
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, role FROM profiles
  LOOP
    UPDATE auth.users
    SET raw_user_meta_data = 
      CASE 
        WHEN raw_user_meta_data IS NULL THEN 
          jsonb_build_object('role', r.role)
        ELSE 
          raw_user_meta_data || jsonb_build_object('role', r.role)
      END
    WHERE id = r.id;
  END LOOP;
END;
$$;
