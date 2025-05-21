-- Primero, eliminamos las políticas existentes para la tabla education
DROP POLICY IF EXISTS "Users can insert their own education" ON education;
DROP POLICY IF EXISTS "Users can view their own education" ON education;
DROP POLICY IF EXISTS "Users can update their own education" ON education;
DROP POLICY IF EXISTS "Users can delete their own education" ON education;
DROP POLICY IF EXISTS "Admins can view all education" ON education;
DROP POLICY IF EXISTS "Admins can update all education" ON education;
DROP POLICY IF EXISTS "Admins can delete all education" ON education;

-- Aseguramos que RLS está habilitado para la tabla education
ALTER TABLE education ENABLE ROW LEVEL SECURITY;

-- Creamos una política que permita a cualquier usuario autenticado insertar registros educativos
-- Esta es la política clave que resolverá el problema
CREATE POLICY "Users can insert education" 
ON education FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Recreamos las políticas para que los usuarios puedan ver, actualizar y eliminar sus propios registros educativos
CREATE POLICY "Users can view their own education" 
ON education FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own education" 
ON education FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education" 
ON education FOR DELETE 
USING (auth.uid() = user_id);

-- Recreamos las políticas para que los administradores puedan gestionar todos los registros educativos
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
