-- Script para corregir la recursión infinita en las políticas RLS

-- 1. Primero, desactivamos temporalmente RLS para la tabla profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Eliminamos las políticas existentes que pueden estar causando la recursión
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete all documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all education" ON education;
DROP POLICY IF EXISTS "Admins can update all education" ON education;
DROP POLICY IF EXISTS "Admins can delete all education" ON education;
DROP POLICY IF EXISTS "Admins can view all experience" ON experience;
DROP POLICY IF EXISTS "Admins can update all experience" ON experience;
DROP POLICY IF EXISTS "Admins can delete all experience" ON experience;
DROP POLICY IF EXISTS "Admins can view all languages" ON languages;
DROP POLICY IF EXISTS "Admins can update all languages" ON languages;
DROP POLICY IF EXISTS "Admins can delete all languages" ON languages;
DROP POLICY IF EXISTS "Admins can view all personal_info" ON personal_info;
DROP POLICY IF EXISTS "Admins can update all personal_info" ON personal_info;
DROP POLICY IF EXISTS "Admins can delete all personal_info" ON personal_info;

-- 3. Creamos una función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT (role = 'admin') INTO is_admin
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recreamos las políticas usando la función is_admin() para evitar la recursión
-- Políticas para profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (is_admin() OR auth.uid() = id);

CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (is_admin() OR auth.uid() = id);

-- Políticas para documents
CREATE POLICY "Users can view their own documents" 
ON documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON documents FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents" 
ON documents FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all documents" 
ON documents FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete all documents" 
ON documents FOR DELETE 
USING (is_admin());

-- 5. Volvemos a activar RLS para la tabla profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Aseguramos que el trigger de usuario incluya el rol en los metadatos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email, 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
