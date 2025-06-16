-- Verificar las politicas RLS actuales para las tablas de licencias
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('license_requests', 'license_evidences')
ORDER BY tablename, policyname;

-- Verificar si RLS está habilitado en las tablas
SELECT schemaname, tablename, rowsecurity, relforcerowsecurity
FROM pg_tables 
JOIN pg_class ON pg_tables.tablename = pg_class.relname
WHERE tablename IN ('license_requests', 'license_evidences');

-- Verificar permisos generales en las tablas
SELECT table_schema, table_name, privilege_type, grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('license_requests', 'license_evidences')
ORDER BY table_name, grantee;
