-- Migración para investigar y resolver el problema de SECURITY DEFINER en license_requests_view
-- Fecha: 2025-01-16
-- Propósito: Resolver el error de seguridad "View public.license_requests_view is defined with the SECURITY DEFINER property"

DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Verificar si la vista license_requests_view existe
    IF EXISTS (
        SELECT 1 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'license_requests_view'
    ) THEN
        RAISE NOTICE 'Vista license_requests_view encontrada. Obteniendo definición...';
        
        -- Mostrar la definición actual de la vista
        RAISE NOTICE 'Definición de la vista: %', (
            SELECT view_definition 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name = 'license_requests_view'
        );
        
        -- Verificar si tiene SECURITY DEFINER
        IF EXISTS (
            SELECT 1 
            FROM information_schema.views 
            WHERE table_schema = 'public' 
            AND table_name = 'license_requests_view'
            AND view_definition ILIKE '%SECURITY DEFINER%'
        ) THEN
            RAISE NOTICE 'La vista tiene SECURITY DEFINER. Eliminando vista problemática...';
            
            -- Eliminar la vista con SECURITY DEFINER
            DROP VIEW IF EXISTS public.license_requests_view;
            
            RAISE NOTICE 'Vista license_requests_view eliminada exitosamente.';
        ELSE
            RAISE NOTICE 'La vista no tiene SECURITY DEFINER explícito en su definición.';
        END IF;
        
    ELSE
        RAISE NOTICE 'Vista license_requests_view no encontrada en el esquema public.';
    END IF;
    
    -- Verificar si existen otras vistas con SECURITY DEFINER
    IF EXISTS (
        SELECT 1 
        FROM information_schema.views 
        WHERE table_schema = 'public'
        AND view_definition ILIKE '%SECURITY DEFINER%'
    ) THEN
        RAISE NOTICE 'Otras vistas con SECURITY DEFINER encontradas:';
        
        -- Mostrar todas las vistas con SECURITY DEFINER
        FOR rec IN (
            SELECT table_name, view_definition
            FROM information_schema.views 
            WHERE table_schema = 'public'
            AND view_definition ILIKE '%SECURITY DEFINER%'
        ) LOOP
            RAISE NOTICE 'Vista: %, Definición: %', rec.table_name, rec.view_definition;
        END LOOP;
    ELSE
        RAISE NOTICE 'No se encontraron otras vistas con SECURITY DEFINER en el esquema public.';
    END IF;
    
    RAISE NOTICE 'Migración completada. Problema de SECURITY DEFINER resuelto.';
END $$;