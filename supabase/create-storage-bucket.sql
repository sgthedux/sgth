-- SQL para crear el bucket de almacenamiento en Supabase
-- Nota: Esto debe ejecutarse en la consola SQL de Supabase

-- Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('archivos-sgth', 'archivos-sgth', true)
ON CONFLICT (id) DO NOTHING;

-- Establecer políticas de acceso para el bucket
-- Permitir a los usuarios autenticados leer cualquier archivo
CREATE POLICY "Archivos visibles para usuarios autenticados"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'archivos-sgth');

-- Permitir a los usuarios subir sus propios archivos
CREATE POLICY "Los usuarios pueden subir sus propios archivos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'archivos-sgth' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permitir a los usuarios actualizar sus propios archivos
CREATE POLICY "Los usuarios pueden actualizar sus propios archivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'archivos-sgth' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permitir a los usuarios eliminar sus propios archivos
CREATE POLICY "Los usuarios pueden eliminar sus propios archivos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'archivos-sgth' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permitir a los administradores acceso completo a todos los archivos
CREATE POLICY "Los administradores tienen acceso completo"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'archivos-sgth' AND 
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'
  )
);
