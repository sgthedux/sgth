import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Esta ruta sirve archivos simulados para desarrollo/pruebas
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Verificar autenticación
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const path = params.path.join("/")

    // En un entorno de desarrollo/prueba, devolvemos un archivo simulado
    // En producción, aquí se conectaría con R2 para obtener el archivo real

    // Determinar el tipo de contenido basado en la extensión del archivo
    const fileExt = path.split(".").pop()?.toLowerCase()
    let contentType = "application/octet-stream"

    if (fileExt === "pdf") {
      contentType = "application/pdf"
    } else if (["jpg", "jpeg"].includes(fileExt || "")) {
      contentType = "image/jpeg"
    } else if (fileExt === "png") {
      contentType = "image/png"
    }

    // Generar una respuesta simulada
    const mockResponse = new Response("Archivo simulado para desarrollo", {
      headers: {
        "Content-Type": contentType,
      },
    })

    return mockResponse
  } catch (error: any) {
    console.error("Error al servir archivo:", error)
    return NextResponse.json({ error: error.message || "Error al servir archivo" }, { status: 500 })
  }
}
