import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getPublicUrl } from "@/lib/r2"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos de la solicitud
    const { userId, name, type, itemId = "default", key } = await request.json()

    if (!userId || !name || !type || !key) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    // Obtener la URL pública del archivo
    const url = getPublicUrl(key)

    // Guardar referencia en Supabase
    const { data, error } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        name,
        type,
        item_id: itemId,
        url,
        status: "Aprobado",
        key,
      })
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      document: data[0],
    })
  } catch (error: any) {
    console.error("Error al guardar documento:", error)
    return NextResponse.json({ error: error.message || "Error al guardar documento" }, { status: 500 })
  }
}
