import { createClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { userId, metadata } = await request.json()

    if (!userId || !metadata) {
      return NextResponse.json({ error: "Se requiere userId y metadata" }, { status: 400 })
    }

    // Usar el cliente admin para actualizar metadatos
    const supabase = createClient()

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    })

    if (error) {
      console.error("Error al actualizar metadatos:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error en la ruta update-user-metadata:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
