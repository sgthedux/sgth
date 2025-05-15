import { createPresignedPost } from "@aws-sdk/s3-presigned-post"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

// Configuración del cliente S3 para Cloudflare R2
export const s3Client = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
  // Configuración para evitar que intente leer archivos de configuración
  forcePathStyle: true,
  // Deshabilitar completamente la carga de configuración desde archivos
  loadDefaultConfig: false,
  // Configuración adicional para evitar problemas en entornos sin sistema de archivos
  customUserAgent: "sgth-app/1.0.0",
  maxAttempts: 3,
  // Configuración para evitar que intente leer archivos de configuración
  credentialDefaultProvider: () => async () => {
    return {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    }
  },
  // Deshabilitar completamente el proveedor de credenciales de archivos
  credentialProviderChain: {
    defaultProviders: [],
  },
  // Deshabilitar la carga de configuración desde archivos
  systemClockOffset: 0,
  // Configuración para evitar que intente leer archivos de configuración
  retryStrategy: () => async (attempt: number) => {
    return Math.min(attempt > 0 ? 100 * Math.pow(2, attempt) : 0, 1000)
  },
})

// Función para generar una URL firmada para subir archivos
export async function generatePresignedUrl(fileName: string, contentType: string, expiresIn = 3600) {
  try {
    const key = `${Date.now()}-${fileName}`

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.R2_BUCKET || "",
      Key: key,
      Conditions: [
        ["content-length-range", 0, 10485760], // Máximo 10MB
        ["starts-with", "$Content-Type", contentType],
      ],
      Expires: expiresIn,
    })

    return {
      url,
      fields,
      key,
      fullUrl: `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${key}`,
    }
  } catch (error) {
    console.error("Error al generar URL firmada:", error)
    throw error
  }
}

// Función para obtener la URL pública de un archivo
export function getPublicUrl(key: string) {
  return `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${key}?token=${process.env.R2_TOKEN_AUTHENTICATION}`
}

// Función para eliminar un objeto de R2
export async function deleteObject(key: string): Promise<void> {
  try {
    console.log(`Intentando eliminar objeto con clave: ${key}`)

    // En desarrollo, simular éxito sin intentar eliminar realmente
    if (process.env.NODE_ENV === "development") {
      console.log("Simulando eliminación exitosa en desarrollo para la clave:", key)
      return
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET || "",
      Key: key,
    })

    const result = await s3Client.send(command)
    console.log("Objeto eliminado correctamente:", result)
  } catch (error) {
    console.error("Error al eliminar objeto:", error)

    // En desarrollo, ignorar errores
    if (process.env.NODE_ENV === "development") {
      console.log("Ignorando error en desarrollo")
      return
    }

    throw error
  }
}
