import { NextResponse } from "next/server"

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  console.log("🩺 [API /diagnose-connection] Iniciando diagnóstico de conexión.")
  console.log(`🩺 [API /diagnose-connection] URL de Supabase a probar: ${supabaseUrl}`)

  if (!supabaseUrl) {
    console.error("❌ [API /diagnose-connection] La variable de entorno NEXT_PUBLIC_SUPABASE_URL no está definida.")
    return NextResponse.json(
      {
        success: false,
        message: "Error de configuración: La variable de entorno NEXT_PUBLIC_SUPABASE_URL no está definida en Vercel.",
      },
      { status: 500 },
    )
  }

  try {
    // Hacemos una petición fetch simple a la URL base de Supabase.
    // No necesitamos la API key para esta prueba, solo queremos ver si la URL es alcanzable.
    // El endpoint de Supabase debería devolver un 401 o similar si no se provee API key,
    // pero no un 'Failed to fetch'.
    const response = await fetch(supabaseUrl, { method: "HEAD" }) // Usamos HEAD para una petición ligera

    console.log(
      `✅ [API /diagnose-connection] Conexión exitosa. La URL es alcanzable. Status recibido: ${response.status}`,
    )
    return NextResponse.json({
      success: true,
      message: "¡Conexión exitosa! La URL de Supabase es alcanzable desde el servidor de Vercel.",
      details: {
        url: supabaseUrl,
        status: response.status,
        statusText: response.statusText,
      },
    })
  } catch (error: any) {
    console.error("❌ [API /diagnose-connection] Falló la conexión fetch:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Falló la conexión de red (TypeError: Failed to fetch).",
        details: {
          url: supabaseUrl,
          errorName: error.name,
          errorMessage: error.message,
          cause: error.cause, // 'cause' puede contener más detalles del sistema
          hint: "Esto confirma que el servidor de Vercel no puede resolver o conectar con la URL de Supabase. Revisa la variable de entorno NEXT_PUBLIC_SUPABASE_URL en Vercel.",
        },
      },
      { status: 500 },
    )
  }
}
