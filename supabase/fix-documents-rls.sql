-- Primero, eliminamos las políticas existentes para la tabla documents
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON documents;
DROP POLICY IF EXISTS "Admins can delete all documents" ON documents;

-- Aseguramos que RLS está habilitado para la tabla documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Creamos una política que permita a cualquier usuario autenticado insertar documentos
-- Esta es la política clave que resolverá el problema
CREATE POLICY "Users can insert documents" 
ON documents FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Recreamos las políticas para que los usuarios puedan ver, actualizar y eliminar sus propios documentos
CREATE POLICY "Users can view their own documents" 
ON documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON documents FOR DELETE 
USING (auth.uid() = user_id);

-- Recreamos las políticas para que los administradores puedan gestionar todos los documentos
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
