-- Primero, eliminamos las políticas problemáticas si existen
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Creamos una función para verificar si un usuario es administrador
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

-- Modificamos el trigger para incluir el rol en los metadatos del usuario
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

-- Añadimos una política para permitir a cualquier usuario autenticado insertar su propio perfil
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Añadimos políticas para las tablas relacionadas
CREATE POLICY "Users can view their own personal info" 
  ON personal_info FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal info" 
  ON personal_info FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal info" 
  ON personal_info FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

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
