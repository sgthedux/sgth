import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const catalog = searchParams.get("catalog")

    if (!catalog) {
      return NextResponse.json({ error: "Se requiere el parámetro catalog" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Validar que el catálogo solicitado sea uno permitido
    const allowedCatalogs = [
      "document_types",
      "marital_status",
      "academic_modalities",
      "institutions",
      "report_periods",
    ]

    if (!allowedCatalogs.includes(catalog)) {
      return NextResponse.json({ error: "Catálogo no válido" }, { status: 400 })
    }

    // Obtener datos del catálogo
    const { data, error } = await supabase.from(catalog).select("*").order("name", { ascending: true })

    if (error) {
      console.error(`Error al obtener catálogo ${catalog}:`, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    console.error("Error en API de catálogos:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
