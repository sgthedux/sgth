import { type NextRequest, NextResponse } from "next/server"
import { generatePresignedUrl, getPublicUrl } from "@/lib/r2"
import { createClient } from "@/lib/supabase/server"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos de la solicitud
    const { fileName, fileType, category, userId, itemId = "default" } = await request.json()

    if (!fileName || !fileType) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    // Validar tipo de archivo
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if (!validTypes.includes(fileType)) {
      return NextResponse.json({ error: "Tipo de archivo no válido" }, { status: 400 })
    }

    try {
      // Generar URL firmada para subir a R2
      const { url, fields, key } = await generatePresignedUrl(fileName, fileType)

      // Obtener la URL pública del archivo
      const publicUrl = getPublicUrl(key)

      return NextResponse.json({
        success: true,
        url,
        fields,
        key,
        publicUrl,
        uploadData: {
          userId,
          category,
          itemId,
          fileName,
          key,
        },
      })
    } catch (error: any) {
      console.error("Error al generar URL firmada:", error)

      // Respuesta alternativa para desarrollo/pruebas
      // Esto permite que la aplicación siga funcionando incluso si R2 no está configurado
      const mockKey = `mock-${Date.now()}-${fileName}`
      const mockUrl = "https://httpbin.org/post" // URL para pruebas

      return NextResponse.json({
        success: true,
        url: mockUrl,
        fields: {},
        key: mockKey,
        publicUrl: `/api/mock-file?name=${encodeURIComponent(fileName)}`,
        uploadData: {
          userId,
          category,
          itemId,
          fileName,
          key: mockKey,
        },
        isMock: true,
      })
    }
  } catch (error: any) {
    console.error("Error en la ruta de upload:", error)
    return NextResponse.json({ error: error.message || "Error al procesar la solicitud" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { key } = await request.json()

    if (!key) {
      return NextResponse.json({ error: "Se requiere la clave del objeto" }, { status: 400 })
    }

    // Configuración del cliente S3 para Cloudflare R2
    const s3Client = new S3Client({
      region: process.env.R2_REGION || "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
      // Evitar que intente leer archivos de configuración
      credentialDefaultProvider: () => async () => {
        return {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
        }
      },
    })

    // Eliminar el objeto
    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET || "",
      Key: key,
    })

    await s3Client.send(command)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error al eliminar objeto:", error)
    return NextResponse.json({ error: error.message || "Error al eliminar objeto" }, { status: 500 })
  }
}
