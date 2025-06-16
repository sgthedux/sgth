import { NextResponse } from "next/server"

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: "API funcionando correctamente",
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasR2Config: !!process.env.R2_BUCKET,
      },
    })
  } catch (error) {
    console.error("Error en API de prueba:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error en API de prueba",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: "POST funcionando correctamente",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error en POST de prueba:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error en POST de prueba",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
