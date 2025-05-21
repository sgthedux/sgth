-- Función para sincronizar los roles de usuario entre la tabla profiles y los metadatos de auth.users
CREATE OR REPLACE FUNCTION sync_user_roles()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Iterar sobre todos los usuarios en la tabla profiles
    FOR user_record IN 
        SELECT id, role FROM profiles
    LOOP
        -- Actualizar los metadatos del usuario con el rol de la tabla profiles
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ejecutar la función para sincronizar los roles
SELECT sync_user_roles();

-- Crear un trigger para mantener sincronizados los roles automáticamente
CREATE OR REPLACE FUNCTION sync_role_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el rol ha cambiado, actualizar los metadatos del usuario
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        UPDATE auth.users
        SET raw_user_meta_data = 
            CASE 
                WHEN raw_user_meta_data IS NULL THEN 
                    jsonb_build_object('role', NEW.role)
                ELSE 
                    raw_user_meta_data || jsonb_build_object('role', NEW.role)
            END
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar el trigger si ya existe
DROP TRIGGER IF EXISTS sync_role_trigger ON profiles;

-- Crear el trigger
CREATE TRIGGER sync_role_trigger
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_role_to_metadata();
