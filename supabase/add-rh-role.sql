-- Actualizar la tabla profiles para incluir el rol de RH
DO $$
BEGIN
    -- Verificar si ya existe un constraint de rol y actualizarlo
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_name = 'profiles' 
        AND tc.constraint_type = 'CHECK'
        AND ccu.column_name = 'role'
    ) THEN
        -- Eliminar constraint existente
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    END IF;
    
    -- Agregar nuevo constraint con rol RH
    ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin', 'rh'));
    
    RAISE NOTICE 'Rol RH agregado exitosamente';
END $$;

-- Crear función para verificar si un usuario es RH
CREATE OR REPLACE FUNCTION is_rh_user()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'rh'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizar políticas RLS para license_requests para incluir RH
DROP POLICY IF EXISTS "Users can view own license requests" ON license_requests;
DROP POLICY IF EXISTS "Admins can view all license requests" ON license_requests;
DROP POLICY IF EXISTS "RH can view all license requests" ON license_requests;

-- Política para que usuarios vean solo sus solicitudes
CREATE POLICY "Users can view own license requests" ON license_requests
    FOR SELECT USING (user_id = auth.uid());

-- Política para que admins vean todas las solicitudes
CREATE POLICY "Admins can view all license requests" ON license_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Política para que RH vea todas las solicitudes
CREATE POLICY "RH can view all license requests" ON license_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'rh'
        )
    );

-- Política para que usuarios puedan crear sus propias solicitudes
CREATE POLICY "Users can create own license requests" ON license_requests
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Política para que RH pueda actualizar el estado de las solicitudes
CREATE POLICY "RH can update license requests" ON license_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'rh'
        )
    );
