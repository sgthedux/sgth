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
      console.log("Role from user_metadata:", user.user_metadata.role)
      return user.user_metadata.role
    }

    // Si no está en los metadatos, obtenerlo de la tabla profiles
    const { data, error } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (error) {
      console.error("Error getting user role from profiles:", error)
      return "user" // Rol por defecto
    }

    console.log("Role from profiles table:", data.role)

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

    // También actualizar los metadatos del usuario de forma prioritaria
    const { data: updatedUser, error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    })

    if (metadataError) {
      console.error("Error updating user metadata (admin):", metadataError)
      // Considerar si esto debe ser un error fatal o si la actualización de 'profiles' es suficiente como fallback.
      // Por ahora, si falla metadata pero profiles tuvo éxito, podría ser aceptable con un warning.
      // return false; // Descomentar si la actualización de metadata es crítica.
    } else {
      console.log("User metadata updated successfully for role:", role)
    }

    // Actualizar el rol en la tabla profiles (puede ser redundante si la metadata es la fuente de verdad,
    // pero bueno para consistencia o si hay triggers/RLS basados en la tabla profiles)
    const { error: profileError } = await supabase.from("profiles").update({ role }).eq("id", userId)

    if (profileError) {
      console.error("Error updating user role in profiles:", profileError)
      // Si metadata se actualizó pero profiles falló, es un estado inconsistente.
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateUserRole:", error)
    return false
  }
}
