-- Script para corregir la recursión infinita en las políticas RLS (versión 2)

-- 1. Primero, desactivamos temporalmente RLS para la tabla profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Eliminamos TODAS las políticas existentes para asegurarnos de que no haya conflictos
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
DROP POLICY IF EXISTS "Admins can delete all documents" ON documents;

DROP POLICY IF EXISTS "Users can view their own education" ON education;
DROP POLICY IF EXISTS "Users can insert their own education" ON education;
DROP POLICY IF EXISTS "Users can update their own education" ON education;
DROP POLICY IF EXISTS "Users can delete their own education" ON education;
DROP POLICY IF EXISTS "Admins can view all education" ON education;
DROP POLICY IF EXISTS "Admins can update all education" ON education;
DROP POLICY IF EXISTS "Admins can delete all education" ON education;

DROP POLICY IF EXISTS "Users can view their own experience" ON experience;
DROP POLICY IF EXISTS "Users can insert their own experience" ON experience;
DROP POLICY IF EXISTS "Users can update their own experience" ON experience;
DROP POLICY IF EXISTS "Users can delete their own experience" ON experience;
DROP POLICY IF EXISTS "Admins can view all experience" ON experience;
DROP POLICY IF EXISTS "Admins can update all experience" ON experience;
DROP POLICY IF EXISTS "Admins can delete all experience" ON experience;

DROP POLICY IF EXISTS "Users can view their own languages" ON languages;
DROP POLICY IF EXISTS "Users can insert their own languages" ON languages;
DROP POLICY IF EXISTS "Users can update their own languages" ON languages;
DROP POLICY IF EXISTS "Users can delete their own languages" ON languages;
DROP POLICY IF EXISTS "Admins can view all languages" ON languages;
DROP POLICY IF EXISTS "Admins can update all languages" ON languages;
DROP POLICY IF EXISTS "Admins can delete all languages" ON languages;

DROP POLICY IF EXISTS "Users can view their own personal_info" ON personal_info;
DROP POLICY IF EXISTS "Users can insert their own personal_info" ON personal_info;
DROP POLICY IF EXISTS "Users can update their own personal_info" ON personal_info;
DROP POLICY IF EXISTS "Users can delete their own personal_info" ON personal_info;
DROP POLICY IF EXISTS "Admins can view all personal_info" ON personal_info;
DROP POLICY IF EXISTS "Admins can update all personal_info" ON personal_info;
DROP POLICY IF EXISTS "Admins can delete all personal_info" ON personal_info;

-- 3. Eliminamos la función is_admin si existe
DROP FUNCTION IF EXISTS public.is_admin();

-- 4. Creamos una función para verificar si un usuario es administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Usamos una consulta directa sin políticas para evitar recursión
  SELECT (role = 'admin') INTO is_admin
  FROM profiles
  WHERE id = auth.uid();
  
  RETURN COALESCE(is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreamos las políticas usando la función is_admin() para evitar la recursión
-- Políticas para profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (is_admin());

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

-- Políticas para education
CREATE POLICY "Users can view their own education" 
ON education FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own education" 
ON education FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education" 
ON education FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education" 
ON education FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all education" 
ON education FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all education" 
ON education FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete all education" 
ON education FOR DELETE 
USING (is_admin());

-- Políticas para experience
CREATE POLICY "Users can view their own experience" 
ON experience FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experience" 
ON experience FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experience" 
ON experience FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experience" 
ON experience FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all experience" 
ON experience FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all experience" 
ON experience FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete all experience" 
ON experience FOR DELETE 
USING (is_admin());

-- Políticas para languages
CREATE POLICY "Users can view their own languages" 
ON languages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own languages" 
ON languages FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own languages" 
ON languages FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own languages" 
ON languages FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all languages" 
ON languages FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all languages" 
ON languages FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete all languages" 
ON languages FOR DELETE 
USING (is_admin());

-- Políticas para personal_info
CREATE POLICY "Users can view their own personal_info" 
ON personal_info FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal_info" 
ON personal_info FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal_info" 
ON personal_info FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal_info" 
ON personal_info FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all personal_info" 
ON personal_info FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all personal_info" 
ON personal_info FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete all personal_info" 
ON personal_info FOR DELETE 
USING (is_admin());

-- 6. Volvemos a activar RLS para la tabla profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Aseguramos que el trigger de usuario incluya el rol en los metadatos
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
