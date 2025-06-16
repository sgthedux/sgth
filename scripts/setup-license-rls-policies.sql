-- Configurar políticas RLS para el sistema de licencias

-- Habilitar RLS en las tablas
ALTER TABLE license_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_evidences ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "license_requests_insert_policy" ON license_requests;
DROP POLICY IF EXISTS "license_requests_select_policy" ON license_requests;
DROP POLICY IF EXISTS "license_requests_update_policy" ON license_requests;
DROP POLICY IF EXISTS "license_evidences_insert_policy" ON license_evidences;
DROP POLICY IF EXISTS "license_evidences_select_policy" ON license_evidences;

-- Política para insertar solicitudes de licencia (permite a usuarios autenticados y anónimos)
CREATE POLICY "license_requests_insert_policy" ON license_requests
FOR INSERT 
WITH CHECK (true);

-- Política para leer solicitudes de licencia (permite lectura pública por radicado)
CREATE POLICY "license_requests_select_policy" ON license_requests
FOR SELECT 
USING (true);

-- Política para actualizar solicitudes (solo administradores y RH)
CREATE POLICY "license_requests_update_policy" ON license_requests
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin' 
      OR auth.users.raw_user_meta_data->>'role' = 'rh'
    )
  )
);

-- Política para insertar evidencias (permite a usuarios autenticados y anónimos)
CREATE POLICY "license_evidences_insert_policy" ON license_evidences
FOR INSERT 
WITH CHECK (true);

-- Política para leer evidencias (permite lectura pública)
CREATE POLICY "license_evidences_select_policy" ON license_evidences
FOR SELECT 
USING (true);

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('license_requests', 'license_evidences')
ORDER BY tablename, policyname;
