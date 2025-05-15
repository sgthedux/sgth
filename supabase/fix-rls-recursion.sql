-- Primero, desactivamos temporalmente RLS para la tabla profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Eliminamos todas las políticas existentes para la tabla profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Volvemos a activar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Creamos una política para permitir a todos los usuarios autenticados ver su propio perfil
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Creamos una política para permitir a todos los usuarios autenticados actualizar su propio perfil
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Creamos una política para permitir a los administradores ver todos los perfiles
-- Esta política usa una función para evitar la recursión
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Consulta directa sin usar políticas RLS
  SELECT role INTO user_role FROM profiles WHERE id = user_id;
  RETURN user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para que los administradores puedan ver todos los perfiles
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  is_admin(auth.uid())
);

-- Política para que los administradores puedan actualizar todos los perfiles
CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (
  is_admin(auth.uid())
);

-- Política para que los administradores puedan insertar perfiles
CREATE POLICY "Admins can insert profiles" 
ON profiles FOR INSERT 
WITH CHECK (
  is_admin(auth.uid())
);

-- Política para que los administradores puedan eliminar perfiles
CREATE POLICY "Admins can delete profiles" 
ON profiles FOR DELETE 
USING (
  is_admin(auth.uid())
);
