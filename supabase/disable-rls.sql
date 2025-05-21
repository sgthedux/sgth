-- Deshabilitar RLS para todas las tablas relevantes

ALTER TABLE "public"."profiles" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."personal_info" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."education" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."experience" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."languages" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."documents" DISABLE ROW LEVEL SECURITY;
