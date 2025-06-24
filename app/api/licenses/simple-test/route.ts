import { type NextRequest, NextResponse } from "next/server"

// Configuración para runtime dinámico
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log("🧪 [API LICENSES SIMPLE] Test endpoint funcionando")

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({
        success: false,
        error: "ID es requerido"
      }, { status: 400 })
    }

    // Respuesta simple sin dependencias externas
    return NextResponse.json({
      success: true,
      message: "API funcionando correctamente",
      id: id,
      timestamp: new Date().toISOString(),
      endpoint: "/api/licenses/simple-test"
    })

  } catch (error) {
    console.error("💥 [API LICENSES SIMPLE] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log("🧪 [API LICENSES SIMPLE] Test PATCH endpoint funcionando")

    const body = await request.json()
    const { licenseId, status } = body

    if (!licenseId || !status) {
      return NextResponse.json({
        success: false,
        error: "licenseId y status son requeridos"
      }, { status: 400 })
    }

    // Respuesta simple sin dependencias externas
    return NextResponse.json({
      success: true,
      message: `Test: Licencia ${licenseId} actualizada a ${status}`,
      data: {
        licenseId,
        status,
        updated_at: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("💥 [API LICENSES SIMPLE] Error en PATCH:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
