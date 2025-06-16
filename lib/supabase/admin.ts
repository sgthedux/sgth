import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Cliente administrativo para operaciones que requieren permisos elevados
export const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

// Función para verificar si un usuario es admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.from("profiles").select("role").eq("id", userId).single()

    if (error) {
      console.error("Error verificando rol de admin:", error)
      return false
    }

    return data?.role === "admin"
  } catch (error) {
    console.error("Error en isUserAdmin:", error)
    return false
  }
}

// Función para obtener perfil de usuario (para admins)
export async function getProfileForAdmin(userId: string) {
  try {
    const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error obteniendo perfil para admin:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error en getProfileForAdmin:", error)
    return null
  }
}

// Exportaciones adicionales para compatibilidad
export const createAdminClient = () => supabaseAdmin
export const createClient = () => supabaseAdmin
export { supabaseAdmin as default }
