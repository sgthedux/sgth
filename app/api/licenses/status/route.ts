import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [LICENSE STATUS] Iniciando consulta de estado")

    const { searchParams } = new URL(request.url)
    const radicado = searchParams.get("radicado")

    if (!radicado) {
      return NextResponse.json(
        {
          success: false,
          error: "Número de radicado es requerido",
        },
        { status: 400 },
      )
    }

    console.log("🎫 [LICENSE STATUS] Consultando radicado:", radicado)

    // Verificar configuración de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log("⚠️ [LICENSE STATUS] Supabase no configurado, usando datos simulados")

      // Datos simulados para demostración
      if (radicado.includes("LIC-2025")) {
        return NextResponse.json({
          success: true,
          data: {
            id: "simulated-id",
            radicado: radicado,
            nombres: "Juan",
            apellidos: "Pérez",
            tipo_documento: "Cédula de Ciudadanía",
            numero_documento: "12345678",
            cargo: "Desarrollador",
            fecha_inicio: "2025-01-15",
            fecha_finalizacion: "2025-01-20",
            observacion: "Solicitud de permiso por asuntos personales",
            estado: "pendiente",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            evidences: [
              {
                id: "evidence-1",
                file_name: "comprobante.pdf",
                file_url: "/placeholder.jpg",
                file_size: 1024,
                file_type: "application/pdf",
              },
            ],
          },
          simulated: true,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "No se encontró ninguna solicitud con ese radicado",
          },
          { status: 404 },
        )
      }
    }

    // Crear cliente de Supabase
    const supabase = createClient()
    console.log("✅ [LICENSE STATUS] Cliente Supabase creado")

    // Buscar la solicitud por radicado
    const { data: licenseRequest, error: licenseError } = await supabase
      .from("license_requests")
      .select("*")
      .eq("radicado", radicado)
      .single()

    if (licenseError) {
      console.error("❌ [LICENSE STATUS] Error consultando solicitud:", licenseError)

      if (licenseError.code === "PGRST116") {
        // No se encontró el registro
        return NextResponse.json(
          {
            success: false,
            error: "No se encontró ninguna solicitud con ese radicado",
          },
          { status: 404 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: "Error al consultar la solicitud",
          details: licenseError.message,
        },
        { status: 500 },
      )
    }

    console.log("✅ [LICENSE STATUS] Solicitud encontrada:", licenseRequest.id)

    // Buscar las evidencias/comprobantes asociados
    const { data: evidences, error: evidencesError } = await supabase
      .from("license_evidences")
      .select("*")
      .eq("license_request_id", licenseRequest.id)

    if (evidencesError) {
      console.error("❌ [LICENSE STATUS] Error consultando evidencias:", evidencesError)
      // No fallar por errores de evidencias, continuar sin ellas
    }

    console.log(`📎 [LICENSE STATUS] Encontradas ${evidences?.length || 0} evidencias`)

    // Combinar datos
    const responseData = {
      ...licenseRequest,
      evidences: evidences || [],
    }

    console.log("🎉 [LICENSE STATUS] Consulta completada exitosamente")

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    console.error("💥 [LICENSE STATUS] Error crítico:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
