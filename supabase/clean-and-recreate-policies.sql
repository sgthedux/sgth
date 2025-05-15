-- Eliminar todas las políticas existentes para evitar errores de duplicación
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Allow public profile creation" ON profiles;

DROP POLICY IF EXISTS "Users can view their own personal info" ON personal_info;
DROP POLICY IF EXISTS "Users can update their own personal info" ON personal_info;
DROP POLICY IF EXISTS "Users can insert their own personal info" ON personal_info;

DROP POLICY IF EXISTS "Users can view their own education" ON education;
DROP POLICY IF EXISTS "Users can update their own education" ON education;
DROP POLICY IF EXISTS "Users can insert their own education" ON education;
DROP POLICY IF EXISTS "Users can delete their own education" ON education;

DROP POLICY IF EXISTS "Users can view their own experience" ON experience;
DROP POLICY IF EXISTS "Users can update their own experience" ON experience;
DROP POLICY IF EXISTS "Users can insert their own experience" ON experience;
DROP POLICY IF EXISTS "Users can delete their own experience" ON experience;

DROP POLICY IF EXISTS "Users can view their own languages" ON languages;
DROP POLICY IF EXISTS "Users can update their own languages" ON languages;
DROP POLICY IF EXISTS "Users can insert their own languages" ON languages;
DROP POLICY IF EXISTS "Users can delete their own languages" ON languages;

DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON documents;

-- Eliminar la función is_admin si existe
DROP FUNCTION IF EXISTS public.is_admin();

-- Crear una función para verificar si un usuario es administrador sin consultar la tabla profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Usamos auth.jwt() para obtener el rol del token JWT sin consultar la tabla profiles
  RETURN (current_setting('request.jwt.claims', true)::json->>'role') = 'admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modificar el trigger para incluir el rol en los metadatos del usuario
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

-- Asegurarse de que el trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Asegurarse de que RLS está habilitado en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Crear una política pública para permitir la creación inicial de perfiles
CREATE POLICY "Allow public profile creation" ON profiles
  FOR INSERT WITH CHECK (true);

-- Crear políticas para la tabla profiles
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Crear políticas para la tabla personal_info
CREATE POLICY "Users can view their own personal info" 
  ON personal_info FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal info" 
  ON personal_info FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal info" 
  ON personal_info FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Crear políticas para la tabla education
CREATE POLICY "Users can view their own education" 
  ON education FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own education" 
  ON education FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own education" 
  ON education FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education" 
  ON education FOR DELETE 
  USING (auth.uid() = user_id);

-- Crear políticas para la tabla experience
CREATE POLICY "Users can view their own experience" 
  ON experience FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own experience" 
  ON experience FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experience" 
  ON experience FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experience" 
  ON experience FOR DELETE 
  USING (auth.uid() = user_id);

-- Crear políticas para la tabla languages
CREATE POLICY "Users can view their own languages" 
  ON languages FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own languages" 
  ON languages FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own languages" 
  ON languages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own languages" 
  ON languages FOR DELETE 
  USING (auth.uid() = user_id);

-- Crear políticas para la tabla documents
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

-- Crear políticas para administradores usando la función is_admin()
-- Estas políticas no causarán recursión porque no consultan la tabla profiles
CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR SELECT 
  USING (is_admin());

CREATE POLICY "Admins can update all profiles" 
  ON profiles FOR UPDATE 
  USING (is_admin());

CREATE POLICY "Admins can view all documents" 
  ON documents FOR SELECT 
  USING (is_admin());

CREATE POLICY "Admins can update all documents" 
  ON documents FOR UPDATE 
  USING (is_admin());
