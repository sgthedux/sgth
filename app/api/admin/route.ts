import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServiceClient()

    // Verificar autenticación y rol de administrador
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Verificar si el usuario es administrador
    const { data: profileData } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

    if (!profileData || profileData.role !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Obtener datos del cuerpo
    const { userId, newPassword } = await request.json()

    if (!userId || !newPassword) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Actualizar la contraseña del usuario usando la clave de servicio
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    if (updateError) {
      console.error("Error al actualizar contraseña:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Registrar la acción en un log de auditoría (opcional)
    await supabase.from("admin_logs").insert({
      admin_id: session.user.id,
      action: "reset_password",
      user_id: userId,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error en la ruta admin/reset-password:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
