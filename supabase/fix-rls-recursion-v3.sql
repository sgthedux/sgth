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

-- Crear nuevas políticas simplificadas que usen la función segura
CREATE POLICY "Usuarios pueden ver sus propios perfiles"
ON profiles FOR SELECT
USING (auth.uid() = id OR is_admin_safe(auth.uid()));

CREATE POLICY "Usuarios pueden actualizar sus propios perfiles"
ON profiles FOR UPDATE
USING (auth.uid() = id OR is_admin_safe(auth.uid()));

CREATE POLICY "Usuarios pueden eliminar sus propios perfiles"
ON profiles FOR DELETE
USING (auth.uid() = id OR is_admin_safe(auth.uid()));

CREATE POLICY "Usuarios pueden insertar sus propios perfiles"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id OR is_admin_safe(auth.uid()));
