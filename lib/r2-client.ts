import { S3Client } from "@aws-sdk/client-s3"

// Configuración del cliente S3 para Cloudflare R2
export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
  // Configuración crítica para evitar que intente leer archivos de configuración
  forcePathStyle: true,
  // Deshabilitar la carga de credenciales desde archivos
  credentialDefaultProvider: () => async () => {
    return {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    }
  },
})
