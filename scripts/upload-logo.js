const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
const { readFileSync } = require("fs")
const { join } = require("path")

// Cliente S3 para Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

async function uploadLogo() {
  try {
    // Leer el archivo logo
    const logoPath = join(__dirname, "../public/images/logo.png")
    const logoBuffer = readFileSync(logoPath)

    const params = {
      Bucket: process.env.R2_BUCKET || "",
      Key: "logo.png",
      Body: logoBuffer,
      ContentType: "image/png",
    }

    const result = await s3Client.send(new PutObjectCommand(params))
    
    const publicUrl = `https://pub-373d5369059842f8abf123c212109054.r2.dev/logo.png`
    console.log("Logo subido exitosamente!")
    console.log("URL pública:", publicUrl)
    
    return publicUrl
  } catch (error) {
    console.error("Error subiendo logo a R2:", error)
    throw error
  }
}

uploadLogo()
  .then(() => {
    console.log("Proceso completado")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Error:", error)
    process.exit(1)
  })
