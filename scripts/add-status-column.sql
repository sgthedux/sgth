DO $$
BEGIN
    -- Verificar si la columna 'status' no existe en la tabla 'license_requests'
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'license_requests'
        AND column_name = 'status'
    ) THEN
        -- Si no existe, añadirla con un valor por defecto
        ALTER TABLE public.license_requests
        ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';

        RAISE NOTICE 'Columna "status" añadida exitosamente a "license_requests".';
    ELSE
        RAISE NOTICE 'La columna "status" ya existe en "license_requests". No se realizaron cambios.';
    END IF;
END;
$$;

-- Opcional pero recomendado: Añadir una restricción para asegurar la integridad de los datos
-- Esto asegura que la columna 'status' solo pueda contener los valores esperados.
-- Si esto da un error, puede que tengas que limpiar datos existentes primero, pero es poco probable.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'license_requests_status_check'
        AND conrelid = 'public.license_requests'::regclass
    ) THEN
        ALTER TABLE public.license_requests
        ADD CONSTRAINT license_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'));
        RAISE NOTICE 'Restricción "license_requests_status_check" añadida.';
    ELSE
        RAISE NOTICE 'La restricción "license_requests_status_check" ya existe.';
    END IF;
END;
$$;
