import { createClient } from "@/lib/supabase/client"

// Función para obtener el rol del usuario actual
export async function getUserRole() {
  try {
    const supabase = createClient()

    // Primero intentamos obtener el usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error getting user:", userError)
      return null
    }

    // Intentamos obtener el rol desde los metadatos del usuario
    if (user.user_metadata?.role) {
      return user.user_metadata.role
    }

    // Si no está en los metadatos, lo obtenemos de la tabla profiles
    const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()

    if (error) {
      console.error("Error getting user role:", error)
      return "user" // Rol por defecto
    }

    return data?.role || "user"
  } catch (error) {
    console.error("Error in getUserRole:", error)
    return "user" // Rol por defecto en caso de error
  }
}

// Función para actualizar el rol en los metadatos del usuario
export async function updateUserRoleMetadata(userId: string, role: string) {
  try {
    const supabase = createClient()

    // Actualizar los metadatos del usuario
    const { error } = await supabase.auth.updateUser({
      data: { role },
    })

    if (error) {
      console.error("Error updating user metadata:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateUserRoleMetadata:", error)
    return false
  }
}
