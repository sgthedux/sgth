-- Desactivar temporalmente RLS para la tabla profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes para la tabla profiles
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios perfiles" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden ver todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios perfiles" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden actualizar todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios perfiles" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden eliminar todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios perfiles" ON profiles;
DROP POLICY IF EXISTS "Administradores pueden insertar perfiles" ON profiles;

-- Crear una función segura para verificar si un usuario es administrador
-- Esta función usa SECURITY DEFINER para evitar la recursión
CREATE OR REPLACE FUNCTION is_admin_safe(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Esto es crucial para evitar la recursión
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Consulta directa a la tabla profiles sin pasar por RLS
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role = 'admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Volver a habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas simplificadas para la tabla profiles
-- Política para permitir a todos los usuarios autenticados ver su propio perfil
CREATE POLICY "Usuarios pueden ver sus propios perfiles"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Política para permitir a todos los usuarios autenticados actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar sus propios perfiles"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Política para permitir a los administradores ver todos los perfiles
CREATE POLICY "Administradores pueden ver todos los perfiles"
ON profiles FOR SELECT
USING (is_admin_safe(auth.uid()));

-- Política para permitir a los administradores actualizar todos los perfiles
CREATE POLICY "Administradores pueden actualizar todos los perfiles"
ON profiles FOR UPDATE
USING (is_admin_safe(auth.uid()));

-- Política para permitir a los administradores insertar perfiles
CREATE POLICY "Administradores pueden insertar perfiles"
ON profiles FOR INSERT
WITH CHECK (is_admin_safe(auth.uid()));

-- Política para permitir a los administradores eliminar perfiles
CREATE POLICY "Administradores pueden eliminar perfiles"
ON profiles FOR DELETE
USING (is_admin_safe(auth.uid()));

-- Sincronizar los roles de usuario con los metadatos
-- Esto asegura que los metadatos de autenticación tengan el rol correcto
CREATE OR REPLACE FUNCTION sync_user_role_metadata()
RETURNS TRIGGER AS $$
BEGIN
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear un trigger para sincronizar el rol cuando se actualiza
DROP TRIGGER IF EXISTS sync_role_to_metadata ON profiles;
CREATE TRIGGER sync_role_to_metadata
AFTER UPDATE OF role ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_role_metadata();

-- Ejecutar una sincronización manual para todos los usuarios
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
