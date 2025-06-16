-- 1. Verificar la estructura exacta de 'license_requests'
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = 'license_requests'
ORDER BY
    ordinal_position;

-- 2. Verificar la estructura exacta de 'license_evidences'
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_schema = 'public' AND table_name = 'license_evidences'
ORDER BY
    ordinal_position;

-- 3. Verificar el rol de un usuario específico en auth.users
-- REEMPLAZA 'ID_DEL_USUARIO_RH_DE_PRUEBA' CON UN ID DE USUARIO REAL
SELECT
    id,
    email,
    role, -- Este es el rol general en la tabla auth.users
    raw_user_meta_data ->> 'role' AS metadata_role, -- Específicamente el rol en user_metadata
    raw_app_meta_data ->> 'role' AS app_metadata_role
FROM
    auth.users
WHERE
    id = 'ID_DEL_USUARIO_RH_DE_PRUEBA'; -- <--- REEMPLAZA ESTO CON UN UUID VÁLIDO DE USUARIO

-- 4. Verificar el rol de ese mismo usuario en la tabla 'profiles'
-- REEMPLAZA 'ID_DEL_USUARIO_RH_DE_PRUEBA' CON UN ID DE USUARIO REAL
SELECT
    id,
    full_name,
    role AS profile_role
FROM
    public.profiles
WHERE
    id = 'ID_DEL_USUARIO_RH_DE_PRUEBA'; -- <--- REEMPLAZA ESTO CON UN UUID VÁLIDO DE USUARIO
