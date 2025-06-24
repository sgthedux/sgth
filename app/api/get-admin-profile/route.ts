import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// Configuración para runtime dinámico
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Se requiere userId" }, { status: 400 })
    }

    // Usar el cliente admin para evitar problemas de RLS
    const supabase = createAdminClient()

    // Consulta directa a la base de datos sin pasar por RLS
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error al obtener el perfil del usuario:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Verificar que el usuario sea administrador
    if (data?.role !== "admin") {
      return NextResponse.json({ error: "El usuario no tiene permisos de administrador" }, { status: 403 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error en la API get-admin-profile:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
