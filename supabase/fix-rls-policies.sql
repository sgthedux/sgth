-- Añadir política para permitir a los usuarios insertar su propio perfil
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Añadir política para permitir a los administradores insertar cualquier perfil
CREATE POLICY "Admins can insert any profile" 
  ON profiles FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Añadir políticas para las tablas relacionadas
CREATE POLICY "Users can insert their own personal info" 
  ON personal_info FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own education" 
  ON education FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experience" 
  ON experience FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own languages" 
  ON languages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
