"use server"

import { createServiceClient } from "@/lib/supabase/server"
import { updateUserRoleMetadata } from "@/lib/auth"
import { revalidatePath } from "next/cache"

// Acción para actualizar el rol de un usuario
export async function updateUserRole(userId: string, role: string) {
  try {
    // Usamos el cliente de servicio para evitar problemas de RLS
    const supabase = await createServiceClient()

    // Actualizar el rol en la tabla profiles
    const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)

    if (error) {
      console.error("Error updating user role in database:", error)
      return { success: false, error: error.message }
    }

    // También actualizamos el rol en los metadatos del usuario
    await updateUserRoleMetadata(userId, role)

    // Revalidar la página para mostrar los cambios
    revalidatePath("/admin/users")

    return { success: true }
  } catch (error) {
    console.error("Error in updateUserRole:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Acción para actualizar el estado de un usuario
export async function updateUserStatus(userId: string, status: string) {
  try {
    const supabase = await createServiceClient()

    const { error } = await supabase.from("profiles").update({ status }).eq("id", userId)

    if (error) {
      console.error("Error updating user status:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/users")

    return { success: true }
  } catch (error) {
    console.error("Error in updateUserStatus:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}

// Acción para eliminar un usuario
export async function deleteUser(userId: string) {
  try {
    const supabase = await createServiceClient()

    // Eliminar el usuario de auth.users (esto eliminará en cascada todos sus datos)
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      console.error("Error deleting user:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/users")

    return { success: true }
  } catch (error) {
    console.error("Error in deleteUser:", error)
    return { success: false, error: "Error interno del servidor" }
  }
}
