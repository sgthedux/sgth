import { createClient } from "@/lib/supabase/client"

// Función para obtener el rol del usuario actual
export async function getUserRole() {
  try {
    const supabase = createClient()

    // Obtener el usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Error getting user:", userError)
      return null
    }

    // Obtener el rol desde los metadatos del usuario
    if (user.user_metadata?.role) {
      return user.user_metadata.role
    }

    // Si no está en los metadatos, obtenerlo de la tabla profiles
    const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (error) {
      console.error("Error getting user role:", error)
      return "user" // Rol por defecto
    }

    // Actualizar los metadatos del usuario con el rol obtenido
    await supabase.auth.updateUser({
      data: { role: data.role },
    })

    return data.role || "user"
  } catch (error) {
    console.error("Error in getUserRole:", error)
    return "user" // Rol por defecto en caso de error
  }
}

// Función para actualizar el rol de un usuario
export async function updateUserRole(userId: string, role: string) {
  try {
    const supabase = createClient()

    // Actualizar el rol en la tabla profiles
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)

    if (error) {
      console.error("Error updating user role:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateUserRole:", error)
    return false
  }
}
