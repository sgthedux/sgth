import { NextResponse } from "next/server"

// Configuración para runtime dinámico
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log("🚀 [API TEST] Endpoint de prueba funcionando")
    
    return NextResponse.json({
      success: true,
      message: "API de prueba funcionando correctamente",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      endpoint: "/api/test-licenses"
    })

  } catch (error) {
    console.error("💥 [API TEST] Error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    console.log("🚀 [API TEST] Test POST funcionando")
    
    return NextResponse.json({
      success: true,
      message: "POST endpoint funcionando correctamente",
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("💥 [API TEST] Error en POST:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
