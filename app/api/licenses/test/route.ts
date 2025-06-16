import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("🧪 [TEST API] Iniciando prueba del sistema de licencias")

    // Verificar variables de entorno
    const config = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasR2Bucket: !!process.env.R2_BUCKET,
      hasR2Endpoint: !!process.env.R2_ENDPOINT,
      hasR2AccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasR2SecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
    }

    console.log("🔧 [TEST API] Configuración:", config)

    // Probar conexión a Supabase
    let supabaseTest = null
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()

      // Hacer una consulta simple para probar la conexión
      const { data, error } = await supabase.from("license_requests").select("count").limit(1)

      if (error) {
        supabaseTest = { success: false, error: error.message }
      } else {
        supabaseTest = { success: true, message: "Conexión exitosa" }
      }
    } catch (supabaseError) {
      supabaseTest = {
        success: false,
        error: supabaseError instanceof Error ? supabaseError.message : "Error desconocido",
      }
    }

    console.log("🗄️ [TEST API] Prueba Supabase:", supabaseTest)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      config,
      supabaseTest,
      message: "Sistema de licencias funcionando correctamente",
    })
  } catch (error) {
    console.error("💥 [TEST API] Error en prueba:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
