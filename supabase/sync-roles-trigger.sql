-- Function to update auth.users.user_metadata.role when profiles.role changes
    -- This function runs with the permissions of the definer, allowing it to modify auth.users
    CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth_user_metadata()
    RETURNS TRIGGER AS $$
    DECLARE
      current_auth_user_metadata jsonb;
      new_auth_user_metadata jsonb;
    BEGIN
      -- Get current user_metadata from auth.users
      SELECT u.raw_user_meta_data INTO current_auth_user_metadata 
      FROM auth.users u WHERE u.id = NEW.id;

      -- Construct new metadata with the updated role.
      -- This merges the new role with existing metadata to avoid overwriting other metadata fields.
      IF current_auth_user_metadata IS NULL THEN
        new_auth_user_metadata := jsonb_build_object('role', NEW.role);
      ELSE
        -- Ensure we don't create nested 'role' if it somehow got into metadata as an object
        IF jsonb_typeof(current_auth_user_metadata->'role') = 'object' THEN
          current_auth_user_metadata := current_auth_user_metadata - 'role'; -- Remove the object 'role'
        END IF;
        new_auth_user_metadata := current_auth_user_metadata || jsonb_build_object('role', NEW.role);
      END IF;

      -- Update user_metadata in auth.users only if the role has actually changed
      -- or if the role key didn't exist in metadata or was of a different type.
      IF (current_auth_user_metadata->>'role' IS DISTINCT FROM NEW.role) THEN
        UPDATE auth.users 
        SET raw_user_meta_data = new_auth_user_metadata 
        WHERE id = NEW.id;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger to call the function after insert or update of 'role' on profiles table
    -- Drop existing trigger if it exists to ensure a clean setup
    DROP TRIGGER IF EXISTS on_profile_role_change_sync_to_auth ON public.profiles;
    
    CREATE TRIGGER on_profile_role_change_sync_to_auth
      AFTER INSERT OR UPDATE OF role ON public.profiles
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_profile_role_to_auth_user_metadata();

    -- Grant execute permission on the function to the 'authenticated' role
    -- This might not be strictly necessary if SECURITY DEFINER is used correctly and the definer has perms,
    -- but it's good practice if other authenticated operations might indirectly cause this.
    -- However, for SECURITY DEFINER, the definer's permissions are used.
    -- Let's ensure supabase_auth_admin (or postgres) can execute it.
    -- Typically, the user creating the function (e.g., 'postgres' via migrations) has necessary rights.

    COMMENT ON FUNCTION public.sync_profile_role_to_auth_user_metadata IS 
    'Synchronizes the role from the public.profiles table to auth.users.raw_user_meta_data upon insert or update of profiles.role.';
    COMMENT ON TRIGGER on_profile_role_change_sync_to_auth ON public.profiles IS 
    'Calls sync_profile_role_to_auth_user_metadata() after insert or update of role on profiles table.';
