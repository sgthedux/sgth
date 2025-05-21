-- Este script corrige las políticas RLS para todas las tablas relevantes

-- 1. Tabla profiles
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios perfiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios perfiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios perfiles" ON "public"."profiles";
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios perfiles" ON "public"."profiles";

CREATE POLICY "Usuarios pueden ver sus propios perfiles"
ON "public"."profiles"
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar perfiles"
ON "public"."profiles"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden actualizar sus propios perfiles"
ON "public"."profiles"
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden eliminar sus propios perfiles"
ON "public"."profiles"
FOR DELETE
USING (auth.uid() = id);

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- 2. Tabla personal_info
DROP POLICY IF EXISTS "Usuarios pueden ver su propia información personal" ON "public"."personal_info";
DROP POLICY IF EXISTS "Usuarios pueden insertar su propia información personal" ON "public"."personal_info";
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propia información personal" ON "public"."personal_info";
DROP POLICY IF EXISTS "Usuarios pueden eliminar su propia información personal" ON "public"."personal_info";

CREATE POLICY "Usuarios pueden ver su propia información personal"
ON "public"."personal_info"
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar información personal"
ON "public"."personal_info"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden actualizar su propia información personal"
ON "public"."personal_info"
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar su propia información personal"
ON "public"."personal_info"
FOR DELETE
USING (auth.uid() = user_id);

ALTER TABLE "public"."personal_info" ENABLE ROW LEVEL SECURITY;

-- 3. Tabla education
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias educaciones" ON "public"."education";
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias educaciones" ON "public"."education";
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias educaciones" ON "public"."education";
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias educaciones" ON "public"."education";

CREATE POLICY "Usuarios pueden ver sus propias educaciones"
ON "public"."education"
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar educaciones"
ON "public"."education"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden actualizar sus propias educaciones"
ON "public"."education"
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias educaciones"
ON "public"."education"
FOR DELETE
USING (auth.uid() = user_id);

ALTER TABLE "public"."education" ENABLE ROW LEVEL SECURITY;

-- 4. Tabla experience
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias experiencias" ON "public"."experience";
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propias experiencias" ON "public"."experience";
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias experiencias" ON "public"."experience";
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias experiencias" ON "public"."experience";

CREATE POLICY "Usuarios pueden ver sus propias experiencias"
ON "public"."experience"
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar experiencias"
ON "public"."experience"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden actualizar sus propias experiencias"
ON "public"."experience"
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias experiencias"
ON "public"."experience"
FOR DELETE
USING (auth.uid() = user_id);

ALTER TABLE "public"."experience" ENABLE ROW LEVEL SECURITY;

-- 5. Tabla languages
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios idiomas" ON "public"."languages";
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios idiomas" ON "public"."languages";
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios idiomas" ON "public"."languages";
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios idiomas" ON "public"."languages";

CREATE POLICY "Usuarios pueden ver sus propios idiomas"
ON "public"."languages"
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar idiomas"
ON "public"."languages"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden actualizar sus propios idiomas"
ON "public"."languages"
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios idiomas"
ON "public"."languages"
FOR DELETE
USING (auth.uid() = user_id);

ALTER TABLE "public"."languages" ENABLE ROW LEVEL SECURITY;

-- 6. Tabla documents
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios documentos" ON "public"."documents";
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios documentos" ON "public"."documents";
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios documentos" ON "public"."documents";
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios documentos" ON "public"."documents";

CREATE POLICY "Usuarios pueden ver sus propios documentos"
ON "public"."documents"
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar documentos"
ON "public"."documents"
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuarios pueden actualizar sus propios documentos"
ON "public"."documents"
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propios documentos"
ON "public"."documents"
FOR DELETE
USING (auth.uid() = user_id);

ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;
