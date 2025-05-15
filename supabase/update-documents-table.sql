-- Primero, limpiar la tabla de documentos si es necesario
-- TRUNCATE TABLE documents;

-- Añadir columna para la ruta de almacenamiento en Supabase Storage
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Actualizar la estructura para asegurar que cada documento esté correctamente asociado con su formulario
ALTER TABLE documents
ALTER COLUMN type SET NOT NULL,
ALTER COLUMN item_id SET DEFAULT 'default';

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_item_id ON documents(item_id);

-- Actualizar las políticas RLS para la tabla documents
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Admins can update all documents" ON documents;

-- Recrear las políticas
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

-- Crear políticas para el bucket de Storage
-- Nota: Esto debe hacerse manualmente en la interfaz de Supabase o mediante la API
