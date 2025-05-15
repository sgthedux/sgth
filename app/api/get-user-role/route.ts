import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Obtener la sesión del usuario
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: "No authenticated user" }, { status: 401 })
    }

    // Usar una consulta directa para evitar problemas de RLS
    const { data, error } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle()

    if (error) {
      console.error("Error fetching user role:", error)
      return NextResponse.json({ role: "user", error: error.message }, { status: 200 })
    }

    return NextResponse.json({ role: data?.role || "user" }, { status: 200 })
  } catch (error) {
    console.error("Error in get-user-role API:", error)
    return NextResponse.json({ role: "user", error: "Internal server error" }, { status: 200 })
  }
}
