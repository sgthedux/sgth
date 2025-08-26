-- Migración para resolver problemas de seguridad RLS
-- Fecha: 2025-01-26
-- Descripción: Habilitar RLS en tablas de backup y crear políticas de seguridad

-- Verificar si las tablas de backup existen antes de proceder
DO $$
BEGIN
    -- Habilitar RLS en documents_backup_relations si existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents_backup_relations') THEN
        ALTER TABLE public.documents_backup_relations ENABLE ROW LEVEL SECURITY;
        
        -- Crear política restrictiva para administradores únicamente
        DROP POLICY IF EXISTS "Admin only access" ON public.documents_backup_relations;
        CREATE POLICY "Admin only access" ON public.documents_backup_relations
            FOR ALL
            USING (false); -- Bloquea todo acceso por defecto
            
        RAISE NOTICE 'RLS habilitado en documents_backup_relations';
    END IF;
    
    -- Habilitar RLS en documents_backup_fix_relations_20250718 si existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'documents_backup_fix_relations_20250718') THEN
        ALTER TABLE public.documents_backup_fix_relations_20250718 ENABLE ROW LEVEL SECURITY;
        
        -- Crear política restrictiva para administradores únicamente
        DROP POLICY IF EXISTS "Admin only access" ON public.documents_backup_fix_relations_20250718;
        CREATE POLICY "Admin only access" ON public.documents_backup_fix_relations_20250718
            FOR ALL
            USING (false); -- Bloquea todo acceso por defecto
            
        RAISE NOTICE 'RLS habilitado en documents_backup_fix_relations_20250718';
    END IF;
    
    -- Verificar si license_requests_view existe (aunque no debería según nuestro análisis)
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'license_requests_view') THEN
        RAISE NOTICE 'license_requests_view encontrada - revisar definición manualmente';
    ELSE
        RAISE NOTICE 'license_requests_view no existe - error puede ser obsoleto';
    END IF;
END $$;

-- Verificar el estado final de RLS en las tablas
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND (tablename LIKE '%backup%' OR tablename = 'license_requests')
ORDER BY tablename;

-- Mostrar políticas existentes en las tablas de backup
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename LIKE '%backup%'
ORDER BY tablename, policyname;