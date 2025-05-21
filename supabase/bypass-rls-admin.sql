-- Este script modifica las políticas RLS para permitir que el cliente administrativo
-- pueda realizar operaciones sin restricciones

-- Habilitar el bypass de RLS para el rol de servicio
ALTER ROLE service_role BYPASSRLS;

-- Verificar que el bypass está habilitado
SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = 'service_role';
