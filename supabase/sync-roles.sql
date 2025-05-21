-- Función para sincronizar el rol entre la tabla profiles y los metadatos de auth.users
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se actualiza el rol en profiles, actualizar también en auth.users
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
DROP TRIGGER IF EXISTS on_role_update ON public.profiles;

-- Crear el trigger para sincronizar el rol cuando se actualiza en profiles
CREATE TRIGGER on_role_update
AFTER UPDATE OF role ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role();

-- Función para sincronizar el rol cuando se crea un nuevo perfil
CREATE OR REPLACE FUNCTION public.sync_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se crea un nuevo perfil, actualizar el rol en auth.users
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN 
        jsonb_build_object('role', NEW.role)
      ELSE
        raw_user_meta_data || jsonb_build_object('role', NEW.role)
    END
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar el trigger si ya existe
DROP TRIGGER IF EXISTS on_profile_create ON public.profiles;

-- Crear el trigger para sincronizar el rol cuando se crea un nuevo perfil
CREATE TRIGGER on_profile_create
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_new_user_role();

-- Sincronizar todos los roles existentes
DO $$
BEGIN
  UPDATE auth.users u
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN 
        jsonb_build_object('role', p.role)
      ELSE
        raw_user_meta_data || jsonb_build_object('role', p.role)
    END
  FROM public.profiles p
  WHERE u.id = p.id;
END $$;
