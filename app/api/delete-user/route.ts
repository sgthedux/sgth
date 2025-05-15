import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "ID de usuario no proporcionado" }, { status: 400 })
    }

    // Usar el cliente de servicio para tener permisos de administrador
    const supabase = await createServiceClient()

    // Eliminar el usuario de auth.users
    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
      console.error("Error al eliminar usuario de auth:", error)
      return NextResponse.json({ error: `Error al eliminar usuario: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en la API delete-user:", error)
    return NextResponse.json(
      { error: `Error interno del servidor: ${error instanceof Error ? error.message : "Error desconocido"}` },
      { status: 500 },
    )
  }
}
