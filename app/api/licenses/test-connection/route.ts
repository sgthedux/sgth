import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 [TEST] Iniciando prueba de conexión")

    // Verificar variables de entorno
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      R2_BUCKET: !!process.env.R2_BUCKET,
      R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
    }

    console.log("🌍 [TEST] Variables de entorno:", envCheck)

    if (!envCheck.NEXT_PUBLIC_SUPABASE_URL || !envCheck.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        success: false,
        error: "Variables de Supabase no configuradas",
        envCheck,
      })
    }

    // Crear cliente de Supabase
    const supabase = createClient()
    console.log("✅ [TEST] Cliente Supabase creado")

    // Probar conexión a la base de datos
    const { data: tablesData, error: tablesError } = await supabase
      .from("license_requests")
      .select("count", { count: "exact", head: true })

    if (tablesError) {
      console.error("❌ [TEST] Error consultando tabla license_requests:", tablesError)
      return NextResponse.json({
        success: false,
        error: "Error de conexión a Supabase",
        details: tablesError.message,
        envCheck,
      })
    }

    console.log("✅ [TEST] Conexión a license_requests exitosa")

    // Probar inserción de datos de prueba
    const testData = {
      radicado: `TEST-${Date.now()}`,
      nombres: "Test",
      apellidos: "Usuario",
      tipo_documento: "cedula",
      numero_documento: "12345678",
      cargo: "Tester",
      fecha_inicio: "2024-01-15",
      fecha_finalizacion: "2024-01-20",
      observacion: "Prueba de inserción",
      estado: "pendiente",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("🧪 [TEST] Probando inserción de datos...")

    const { data: insertData, error: insertError } = await supabase
      .from("license_requests")
      .insert(testData)
      .select()
      .single()

    if (insertError) {
      console.error("❌ [TEST] Error insertando datos de prueba:", insertError)
      return NextResponse.json({
        success: false,
        error: "Error insertando datos de prueba",
        details: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        envCheck,
      })
    }

    console.log("✅ [TEST] Inserción exitosa:", insertData.id)

    // Probar consulta por radicado
    const { data: queryData, error: queryError } = await supabase
      .from("license_requests")
      .select("*")
      .eq("radicado", testData.radicado)
      .single()

    if (queryError) {
      console.error("❌ [TEST] Error consultando por radicado:", queryError)
      return NextResponse.json({
        success: false,
        error: "Error consultando por radicado",
        details: queryError.message,
        envCheck,
      })
    }

    console.log("✅ [TEST] Consulta por radicado exitosa")

    // Limpiar datos de prueba
    const { error: deleteError } = await supabase.from("license_requests").delete().eq("id", insertData.id)

    if (deleteError) {
      console.warn("⚠️ [TEST] Error eliminando datos de prueba:", deleteError)
    } else {
      console.log("🧹 [TEST] Datos de prueba eliminados")
    }

    return NextResponse.json({
      success: true,
      message: "Todas las pruebas pasaron exitosamente",
      tests: {
        environment: "✅ Variables configuradas",
        connection: "✅ Conexión a Supabase",
        insert: "✅ Inserción de datos",
        query: "✅ Consulta por radicado",
        cleanup: deleteError ? "⚠️ Error limpiando" : "✅ Limpieza exitosa",
      },
      envCheck,
      testData: {
        radicado: testData.radicado,
        id: insertData.id,
      },
    })
  } catch (error) {
    console.error("💥 [TEST] Error crítico:", error)
    return NextResponse.json({
      success: false,
      error: "Error crítico en la prueba",
      details: error instanceof Error ? error.message : "Error desconocido",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
