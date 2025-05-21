-- Primero, eliminamos los triggers existentes para evitar conflictos
DROP TRIGGER IF EXISTS on_profile_change ON profiles;
DROP TRIGGER IF EXISTS on_role_update ON profiles;
DROP TRIGGER IF EXISTS sync_role_trigger ON profiles;

-- Eliminamos las funciones asociadas para evitar código obsoleto
DROP FUNCTION IF EXISTS sync_auth_user;
DROP FUNCTION IF EXISTS sync_user_role;
DROP FUNCTION IF EXISTS sync_role_to_metadata;

-- Creamos una única función optimizada para sincronizar el rol
CREATE OR REPLACE FUNCTION sync_user_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizamos los metadatos si el rol ha cambiado
    IF (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) OR TG_OP = 'INSERT' THEN
        -- Actualizamos los metadatos del usuario con el nuevo rol
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('role', NEW.role)
                ELSE 
                    raw_user_meta_data || jsonb_build_object('role', NEW.role)
            END
        WHERE id = NEW.id;
        
        RAISE NOTICE 'Usuario % actualizado con rol %', NEW.id, NEW.role;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Creamos un único trigger que maneje tanto INSERT como UPDATE
CREATE TRIGGER sync_user_role
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_role_to_metadata();

-- Sincronizamos manualmente todos los roles existentes
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id, role FROM profiles
    LOOP
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('role', user_record.role)
                ELSE 
                    raw_user_meta_data || jsonb_build_object('role', user_record.role)
            END
        WHERE id = user_record.id;
    END LOOP;
    
    RAISE NOTICE 'Sincronización manual de roles completada';
END;
$$ LANGUAGE plpgsql;
