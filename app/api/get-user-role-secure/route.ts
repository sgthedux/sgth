import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 1. Obtener la sesión del usuario actual
    const supabase = await createClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: "No authenticated user" }, { status: 401 })
    }

    const userId = session.user.id

    // 2. Usar el cliente admin para evitar problemas de RLS
    const adminClient = createAdminClient()

    // 3. Consulta directa a la base de datos sin pasar por RLS
    const { data, error } = await adminClient.from("profiles").select("role").eq("id", userId).single()

    if (error) {
      console.error("Error al obtener el rol del usuario:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 4. Devolver el rol o "user" por defecto
    return NextResponse.json({ role: data?.role || "user" })
  } catch (error) {
    console.error("Error en la API get-user-role-secure:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error desconocido" }, { status: 500 })
  }
}
