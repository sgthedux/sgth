-- Actualizar las políticas de seguridad para las nuevas columnas y tablas

-- Asegurarse de que RLS está habilitado en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_info ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas
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

DROP POLICY IF EXISTS "Users can view their own education" ON education;
DROP POLICY IF EXISTS "Users can insert their own education" ON education;
DROP POLICY IF EXISTS "Users can update their own education" ON education;
DROP POLICY IF EXISTS "Users can delete their own education" ON education;
DROP POLICY IF EXISTS "Admins can view all education" ON education;
DROP POLICY IF EXISTS "Admins can update all education" ON education;

DROP POLICY IF EXISTS "Users can view their own experience" ON experience;
DROP POLICY IF EXISTS "Users can insert their own experience" ON experience;
DROP POLICY IF EXISTS "Users can update their own experience" ON experience;
DROP POLICY IF EXISTS "Users can delete their own experience" ON experience;
DROP POLICY IF EXISTS "Admins can view all experience" ON experience;
DROP POLICY IF EXISTS "Admins can update all experience" ON experience;

DROP POLICY IF EXISTS "Users can view their own languages" ON languages;
DROP POLICY IF EXISTS "Users can insert their own languages" ON languages;
DROP POLICY IF EXISTS "Users can update their own languages" ON languages;
DROP POLICY IF EXISTS "Users can delete their own languages" ON languages;
DROP POLICY IF EXISTS "Admins can view all languages" ON languages;
DROP POLICY IF EXISTS "Admins can update all languages" ON languages;

DROP POLICY IF EXISTS "Users can view their own personal_info" ON personal_info;
DROP POLICY IF EXISTS "Users can insert their own personal_info" ON personal_info;
DROP POLICY IF EXISTS "Users can update their own personal_info" ON personal_info;
DROP POLICY IF EXISTS "Users can delete their own personal_info" ON personal_info;
DROP POLICY IF EXISTS "Admins can view all personal_info" ON personal_info;
DROP POLICY IF EXISTS "Admins can update all personal_info" ON personal_info;

-- Recrear políticas para profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Recrear políticas para documents
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
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all documents" 
ON documents FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete all documents" 
ON documents FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Recrear políticas para education
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
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all education" 
ON education FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete all education" 
ON education FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Recrear políticas para experience
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
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all experience" 
ON experience FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete all experience" 
ON experience FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Recrear políticas para languages
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
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all languages" 
ON languages FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete all languages" 
ON languages FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Recrear políticas para personal_info
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
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update all personal_info" 
ON personal_info FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete all personal_info" 
ON personal_info FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
