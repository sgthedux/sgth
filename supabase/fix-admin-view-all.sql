-- Este script simplemente elimina todas las políticas RLS para la tabla profiles
-- y crea una política simple que permite a todos ver todos los perfiles

-- 1. Eliminar todas las políticas existentes para la tabla profiles
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios perfiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Usuarios pueden insertar perfiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios perfiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios perfiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Usuarios pueden ver perfiles según su rol" ON "public"."profiles";

-- 2. Crear políticas simples que permitan todas las operaciones
-- Política para seleccionar: todos pueden ver todos los perfiles
CREATE POLICY "Todos pueden ver todos los perfiles"
ON "public"."profiles"
FOR SELECT
USING (true);

-- Política para insertar: cualquier usuario autenticado puede insertar perfiles
CREATE POLICY "Usuarios pueden insertar perfiles"
ON "public"."profiles"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Política para actualizar: los usuarios solo pueden actualizar sus propios perfiles
CREATE POLICY "Usuarios pueden actualizar sus propios perfiles"
ON "public"."profiles"
FOR UPDATE
USING (auth.uid() = id);

-- Política para eliminar: los usuarios solo pueden eliminar sus propios perfiles
CREATE POLICY "Usuarios pueden eliminar sus propios perfiles"
ON "public"."profiles"
FOR DELETE
USING (auth.uid() = id);

-- 3. Asegurarse de que RLS está habilitado para la tabla profiles
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
