import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

// Cliente S3 para Cloudflare R2
const s3Client = new S3Client({
  region: process.env.R2_REGION || "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

export async function uploadPdfToR2(userId: string, pdfBuffer: Uint8Array): Promise<string> {
  try {
    const key = `hojas-de-vida/cv_${userId}.pdf`

    const params = {
      Bucket: process.env.R2_BUCKET || "",
      Key: key,
      Body: pdfBuffer,
      ContentType: "application/pdf",
      ACL: "public-read",
    }

    await s3Client.send(new PutObjectCommand(params))

    // Construir la URL pública
    const publicUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET}/${key}`
    return publicUrl
  } catch (error) {
    console.error("Error subiendo PDF a R2:", error)
    throw error
  }
}
