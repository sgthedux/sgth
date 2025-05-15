import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Verificar autenticación
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener la ruta del archivo
    const path = params.path.join("/")

    // Construir la URL completa al archivo en R2
    const fileUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${path}?token=${process.env.R2_TOKEN_AUTHENTICATION}`

    // Obtener el archivo de R2
    const response = await fetch(fileUrl, {
      headers: {
        // Añadir cabeceras necesarias para la autenticación
        Authorization: `Bearer ${process.env.R2_TOKEN_AUTHENTICATION}`,
      },
    })

    if (!response.ok) {
      console.error(`Error al obtener archivo: ${response.status} ${response.statusText}`)
      return NextResponse.json({ error: "No se pudo obtener el archivo" }, { status: response.status })
    }

    // Obtener el contenido del archivo
    const fileContent = await response.arrayBuffer()

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

    // Devolver el archivo con las cabeceras adecuadas
    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.split("/").pop()}"`,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error: any) {
    console.error("Error al servir archivo:", error)
    return NextResponse.json({ error: error.message || "Error al servir archivo" }, { status: 500 })
  }
}
