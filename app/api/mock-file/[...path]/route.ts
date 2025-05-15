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

    // Determinar el tipo de contenido basado en la extensión del archivo
    const fileExt = path.split(".").pop()?.toLowerCase()
    let contentType = "application/octet-stream"

    if (fileExt === "pdf") {
      contentType = "application/pdf"

      // Generar un PDF válido mínimo
      const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 6 0 R >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 100 700 Td (Documento de prueba) Tj ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000210 00000 n
0000000251 00000 n
0000000344 00000 n
trailer
<< /Size 7 /Root 1 0 R >>
startxref
412
%%EOF`

      return new Response(pdfContent, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${path.split("/").pop()}"`,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      })
    } else if (["jpg", "jpeg"].includes(fileExt || "")) {
      contentType = "image/jpeg"

      // Redirigir a una imagen de placeholder
      return NextResponse.redirect("https://placehold.co/600x400/png", { status: 302 })
    } else if (fileExt === "png") {
      contentType = "image/png"

      // Redirigir a una imagen de placeholder
      return NextResponse.redirect("https://placehold.co/600x400/png", { status: 302 })
    }

    // Para otros tipos de archivos, generar una respuesta simulada
    return new Response(`Archivo simulado para desarrollo (${contentType})`, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.split("/").pop()}"`,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error: any) {
    console.error("Error al servir archivo:", error)
    return NextResponse.json({ error: error.message || "Error al servir archivo" }, { status: 500 })
  }
}
