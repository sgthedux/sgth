import { NextResponse } from "next/server"

// Configuración para runtime dinámico
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log("🩺 [API HEALTH] Verificación de salud de APIs")
    
    const apiEndpoints = [
      "/api/licenses/excel",
      "/api/licenses/update-status", 
      "/api/licenses/report",
      "/api/licenses/status"
    ]

    const healthStatus = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      endpoints: apiEndpoints,
      runtime: "nodejs",
      dynamic: "force-dynamic",
      status: "healthy"
    }

    return NextResponse.json(healthStatus)

  } catch (error) {
    console.error("💥 [API HEALTH] Error:", error)
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
