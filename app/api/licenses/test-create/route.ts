import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Solo para confirmar que recibimos los datos del formulario
    const formData = await request.formData()
    const nombres = formData.get("nombres")
    console.log(`[API /test-create] Solicitud de prueba recibida para: ${nombres}`)

    // Simular un pequeño retraso
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Devolver una respuesta de éxito predefinida
    return NextResponse.json({
      success: true,
      radicado: "TEST-RADICADO-12345",
      message: "Respuesta de la API de prueba exitosa.",
      licenseRequest: { id: "fake-id" },
      simulated: true,
    })
  } catch (error: any) {
    console.error("[API /test-create] Error en la API de prueba:", error)
    return NextResponse.json(
      { success: false, error: "La API de prueba falló", details: error.message },
      { status: 500 },
    )
  }
}
