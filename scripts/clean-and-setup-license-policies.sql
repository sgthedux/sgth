-- Limpiar todas las políticas existentes de las tablas de licencias
-- Esta sección ya es bastante extensa, pero nos aseguraremos de que las políticas
-- que creamos más abajo también se eliminen si existen.
DROP POLICY IF EXISTS "Allow admin role to manage all evidences" ON license_evidences;
DROP POLICY IF EXISTS "Allow delete evidence for own pending request" ON license_evidences;
DROP POLICY IF EXISTS "Allow insert evidence for own request" ON license_evidences;
DROP POLICY IF EXISTS "Allow read evidence for own request" ON license_evidences;
DROP POLICY IF EXISTS "Los administradores pueden ver todas las evidencias" ON license_evidences;
DROP POLICY IF EXISTS "Los usuarios pueden crear evidencias para sus propias solicitud" ON license_evidences;
DROP POLICY IF EXISTS "Los usuarios pueden ver evidencias de sus propias solicitudes" ON license_evidences;
DROP POLICY IF EXISTS "Permitir inserción pública de evidencias" ON license_evidences;
DROP POLICY IF EXISTS "Permitir lectura pública de evidencias" ON license_evidences;
DROP POLICY IF EXISTS "license_evidences_insert_policy" ON license_evidences;
DROP POLICY IF EXISTS "license_evidences_select_policy" ON license_evidences;

DROP POLICY IF EXISTS "Allow admin role to manage all requests" ON license_requests;
DROP POLICY IF EXISTS "Allow authenticated insert for own requests" ON license_requests;
DROP POLICY IF EXISTS "Allow individual user to delete their own pending requests" ON license_requests;
DROP POLICY IF EXISTS "Allow individual user to read their own requests" ON license_requests;
DROP POLICY IF EXISTS "Allow individual user to update their own pending requests" ON license_requests;
DROP POLICY IF EXISTS "Los administradores pueden ver todas las solicitudes de licenci" ON license_requests;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias solicitudes de licen" ON license_requests;
DROP POLICY IF EXISTS "Los usuarios pueden crear sus propias solicitudes de licencia" ON license_requests;
DROP POLICY IF EXISTS "Los usuarios pueden ver sus propias solicitudes de licencia" ON license_requests;
DROP POLICY IF EXISTS "Permitir actualización a usuarios autenticados" ON license_requests;
DROP POLICY IF EXISTS "Permitir inserción pública de solicitudes" ON license_requests;
DROP POLICY IF EXISTS "Permitir lectura pública por radicado" ON license_requests;
DROP POLICY IF EXISTS "license_requests_insert_policy" ON license_requests;
DROP POLICY IF EXISTS "license_requests_select_policy" ON license_requests;
DROP POLICY IF EXISTS "license_requests_update_policy" ON license_requests;
DROP POLICY IF EXISTS "salud_ocupacional_update" ON license_requests;
DROP POLICY IF EXISTS "salud_ocupacional_view_all" ON license_requests;

-- Adicionalmente, eliminamos explícitamente las políticas que este script crea, por si acaso.
DROP POLICY IF EXISTS "public_insert_license_requests" ON license_requests;
DROP POLICY IF EXISTS "public_select_license_requests" ON license_requests;
DROP POLICY IF EXISTS "authenticated_update_license_requests" ON license_requests;
DROP POLICY IF EXISTS "public_insert_license_evidences" ON license_evidences;
DROP POLICY IF EXISTS "public_select_license_evidences" ON license_evidences;


-- Deshabilitar RLS temporalmente para limpiar (si es necesario, aunque los DROP IF EXISTS deberían ser suficientes)
-- ALTER TABLE license_requests DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE license_evidences DISABLE ROW LEVEL SECURITY;

-- Habilitar RLS nuevamente (asegurarse de que estén habilitadas)
ALTER TABLE license_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_evidences ENABLE ROW LEVEL SECURITY;

-- Crear políticas simples y funcionales para license_requests

-- Primero, eliminar si existen, para evitar el error 42710
DROP POLICY IF EXISTS "public_insert_license_requests" ON license_requests;
CREATE POLICY "public_insert_license_requests" ON license_requests
FOR INSERT 
TO public -- O 'authenticated' si solo usuarios logueados pueden crear
WITH CHECK (true); -- O alguna condición específica

DROP POLICY IF EXISTS "public_select_license_requests" ON license_requests;
CREATE POLICY "public_select_license_requests" ON license_requests
FOR SELECT 
TO public -- O 'authenticated'
USING (true); -- O alguna condición específica

DROP POLICY IF EXISTS "authenticated_update_license_requests" ON license_requests;
CREATE POLICY "authenticated_update_license_requests" ON license_requests
FOR UPDATE 
TO authenticated -- O roles específicos como 'admin', 'rh'
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'rh')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'rh')
    )
);

-- Crear políticas simples y funcionales para license_evidences

DROP POLICY IF EXISTS "public_insert_license_evidences" ON license_evidences;
CREATE POLICY "public_insert_license_evidences" ON license_evidences
FOR INSERT 
TO public -- O 'authenticated'
WITH CHECK (true); -- O alguna condición específica

DROP POLICY IF EXISTS "public_select_license_evidences" ON license_evidences;
CREATE POLICY "public_select_license_evidences" ON license_evidences
FOR SELECT 
TO public -- O 'authenticated'
USING (true); -- O alguna condición específica

-- Verificar las nuevas políticas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('license_requests', 'license_evidences')
ORDER BY tablename, policyname;

-- Mensaje de confirmación
SELECT 'Políticas RLS limpiadas y configuradas correctamente para el sistema de licencias' as status;
