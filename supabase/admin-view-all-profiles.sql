-- Este script modifica las políticas RLS para permitir que los administradores vean todos los perfiles

-- 1. Primero, eliminamos la política existente para la tabla profiles
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios perfiles" ON "public"."profiles";

-- 2. Creamos una nueva política que permite a los administradores ver todos los perfiles
--    y a los usuarios normales ver solo su propio perfil
CREATE POLICY "Usuarios pueden ver perfiles según su rol"
ON "public"."profiles"
FOR SELECT
USING (
  (auth.uid() = id) OR  -- El usuario puede ver su propio perfil
  EXISTS (             -- O el usuario es un administrador
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. Mantenemos las políticas existentes para insertar, actualizar y eliminar
-- (No es necesario modificarlas, ya que solo estamos cambiando quién puede ver los perfiles)

-- 4. Aseguramos que RLS está habilitado para la tabla profiles
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
