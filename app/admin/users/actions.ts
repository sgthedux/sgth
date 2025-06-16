export async function updateUserRole(userId: string, role: string) {
  try {
    const supabase = createClient()

    // Actualizar en la tabla profiles
    const { error: profileError } = await supabase.from("profiles").update({ role }).eq("id", userId)

    if (profileError) {
      console.error("Error updating role in profiles:", profileError)
      return { success: false, error: profileError.message }
    }

    // Intentar actualizar también los metadatos del usuario
    try {
      // Usar la API de admin si está disponible
      if (supabase.auth.admin) {
        await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { role },
        })
      } else {
        // Alternativa usando una ruta API
        await fetch("/api/update-user-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, metadata: { role } }),
        })
      }
    } catch (metadataError) {
      console.warn("No se pudieron actualizar los metadatos, pero el rol se actualizó en profiles:", metadataError)
      // No fallamos aquí porque al menos se actualizó en profiles
    }

    return { success: true }
  } catch (error) {
    console.error("Error in updateUserRole:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
