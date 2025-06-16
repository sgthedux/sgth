import { createHmac, createHash } from "crypto"

// Función para generar la firma AWS Signature V4 para R2
async function signRequest(
  method: string,
  url: string,
  region: string,
  service: string,
  payload: Buffer | string,
  accessKey: string,
  secretKey: string,
  contentType?: string,
) {
  const endpointUrl = new URL(url) // Renombrado para evitar conflicto con process.env.R2_ENDPOINT
  const host = endpointUrl.host
  const path = endpointUrl.pathname

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "")
  const date = amzDate.substring(0, 8)

  const payloadHash = createHash("sha256")
    .update(payload || "")
    .digest("hex")

  const headers: Record<string, string> = {
    host: host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  }
  if (contentType) {
    headers["content-type"] = contentType
  }

  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((key) => `${key}:${headers[key]}\n`)
    .join("")
  const signedHeaders = Object.keys(headers).sort().join(";")

  const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n")

  const algorithm = "AWS4-HMAC-SHA256"
  const credentialScope = `${date}/${region}/${service}/aws4_request`
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n")

  const kDate = createHmac("sha256", `AWS4${secretKey}`).update(date).digest()
  const kRegion = createHmac("sha256", kDate).update(region).digest()
  const kService = createHmac("sha256", kRegion).update(service).digest()
  const kSigning = createHmac("sha256", kService).update("aws4_request").digest()
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex")

  const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    Authorization: authorizationHeader,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...(contentType ? { "Content-Type": contentType } : {}),
  }
}

// Función para subir un archivo a R2 directamente usando variables de entorno
export async function uploadToR2(fileBuffer: Buffer, key: string, contentType: string, bucketName?: string): Promise<string> {
  const bucket = bucketName || process.env.R2_BUCKET!
  const endpoint = process.env.R2_ENDPOINT!
  const accessKeyId = process.env.R2_ACCESS_KEY_ID!
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!
  const region = process.env.R2_REGION || "auto" // Default a 'auto' si no está especificado

  console.log("Subiendo archivo a R2:", { bucket, key, contentType, size: fileBuffer.length, endpoint, region })

  if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("Faltan variables de entorno de R2 para la subida.")
  }

  // Construir la URL completa para el PUT request
  const fullEndpoint = `${endpoint}/${bucket}/${key}`
  
  const headers = await signRequest(
    "PUT",
    fullEndpoint,
    region,
    "s3", // El servicio para R2 es 's3'
    fileBuffer,
    accessKeyId,
    secretAccessKey,
    contentType,
  )

  console.log(
    "Headers generados para la solicitud PUT:",
    Object.keys(headers).map((k) => `${k}: ${k === "Authorization" ? "[REDACTED]" : (headers as any)[k]}`),
  )

  try {
    if (fileBuffer.length === 0) throw new Error("El buffer del archivo está vacío")

    console.log(`Realizando PUT request a: ${fullEndpoint}`)
    const response = await fetch(fullEndpoint, {
      method: "PUT",
      headers,
      body: new Uint8Array(fileBuffer),
    })

    let responseBody = ""
    try {
      responseBody = await response.text()
    } catch (e) {
      console.warn("No se pudo obtener el cuerpo de la respuesta:", e)
    }

    console.log(`Respuesta de R2 PUT: ${response.status} ${response.statusText}`)
    if (responseBody) {
      console.log(`Cuerpo de la respuesta: ${responseBody.substring(0, 500)}${responseBody.length > 500 ? "..." : ""}`)
    }

    if (!response.ok) {
      throw new Error(`Error al subir a R2: ${response.status} ${response.statusText} - ${responseBody}`)
    }

    // Generar URL pública usando el dominio público configurado según el bucket
    let publicUrl: string
    
    // Seleccionar el dominio público correcto según el bucket
    let publicDomain: string | undefined
    if (bucket === process.env.R2_LICENSE_BUCKET) {
      publicDomain = process.env.R2_LICENSE_PUBLIC_DOMAIN
    } else {
      publicDomain = process.env.R2_PUBLIC_DOMAIN
    }
    
    if (publicDomain) {
      // Usar el dominio público personalizado configurado
      publicUrl = `https://${publicDomain}/${key}`
    } else {
      // Fallback: Usar el formato estándar de Cloudflare R2 público
      // Formato: https://<bucket-name>.<account-id>.r2.cloudflarestorage.com/<key>
      const accountIdMatch = endpoint.match(/https:\/\/([a-f0-9]+)\.r2\.cloudflarestorage\.com/)
      if (accountIdMatch) {
        const accountId = accountIdMatch[1]
        publicUrl = `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${key}`
      } else {
        // Último fallback: formato pub- (puede no funcionar sin configuración)
        const accountId = endpoint.split("/")[2].split(".")[0]
        publicUrl = `https://pub-${accountId}.r2.dev/${key}`
      }
    }

    console.log("URL pública generada:", publicUrl)
    return publicUrl
  } catch (error) {
    console.error("Error en uploadToR2:", error)
    throw error
  }
}

// Función para eliminar un archivo de R2 directamente usando fetch y variables de entorno
export async function deleteFromR2UsingFetch(key: string): Promise<void> {
  try {
    if (!key) throw new Error("La clave del objeto no puede estar vacía")

    const bucket = process.env.R2_BUCKET!
    const endpoint = process.env.R2_ENDPOINT!
    const fullEndpoint = `${endpoint}/${bucket}/${key}`
    const accessKeyId = process.env.R2_ACCESS_KEY_ID!
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!
    const region = process.env.R2_REGION || "auto"

    if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error("Faltan variables de entorno de R2 para la eliminación.")
    }

    console.log(`Eliminando archivo de R2: ${fullEndpoint}`)

    const headers = await signRequest("DELETE", fullEndpoint, region, "s3", "", accessKeyId, secretAccessKey)
    console.log(
      "Headers generados para la solicitud DELETE:",
      Object.keys(headers).map((k) => `${k}: ${k === "Authorization" ? "[REDACTED]" : (headers as any)[k]}`),
    )

    const response = await fetch(fullEndpoint, { method: "DELETE", headers })
    let responseBody = ""
    try {
      responseBody = await response.text()
    } catch (e) {
      console.warn("No se pudo obtener el cuerpo de la respuesta:", e)
    }

    console.log(`Respuesta de R2 DELETE: ${response.status} ${response.statusText}`)
    if (responseBody) {
      console.log(`Cuerpo de la respuesta: ${responseBody.substring(0, 200)}${responseBody.length > 200 ? "..." : ""}`)
    }

    if (!response.ok) {
      throw new Error(`Error al eliminar de R2: ${response.status} ${response.statusText} - ${responseBody}`)
    }
  } catch (error) {
    console.error("Error en deleteFromR2UsingFetch:", error)
    throw error
  }
}

// Función para eliminar un archivo de R2 con bucket específico
export async function deleteFromR2WithBucket(key: string, bucketName?: string): Promise<void> {
  try {
    if (!key) throw new Error("La clave del objeto no puede estar vacía")

    const bucket = bucketName || process.env.R2_LICENSE_BUCKET || process.env.R2_BUCKET!
    const endpoint = process.env.R2_ENDPOINT!
    const fullEndpoint = `${endpoint}/${bucket}/${key}`
    const accessKeyId = process.env.R2_ACCESS_KEY_ID!
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!
    const region = process.env.R2_REGION || "auto"

    if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error("Faltan variables de entorno de R2 para la eliminación.")
    }

    console.log(`Eliminando archivo de R2: ${fullEndpoint}`)

    const headers = await signRequest("DELETE", fullEndpoint, region, "s3", "", accessKeyId, secretAccessKey)
    console.log(
      "Headers generados para la solicitud DELETE:",
      Object.keys(headers).map((k) => `${k}: ${k === "Authorization" ? "[REDACTED]" : (headers as any)[k]}`),
    )

    const response = await fetch(fullEndpoint, { method: "DELETE", headers })
    let responseBody = ""
    try {
      responseBody = await response.text()
    } catch (e) {
      console.warn("No se pudo obtener el cuerpo de la respuesta:", e)
    }

    console.log(`Respuesta de R2 DELETE: ${response.status} ${response.statusText}`)
    if (responseBody) {
      console.log(`Cuerpo de la respuesta: ${responseBody.substring(0, 200)}${responseBody.length > 200 ? "..." : ""}`)
    }

    if (!response.ok) {
      throw new Error(`Error al eliminar de R2: ${response.status} ${response.statusText} - ${responseBody}`)
    }
  } catch (error) {
    console.error("Error en deleteFromR2WithBucket:", error)
    throw error
  }
}

// Función para generar URL pública desde una clave existente
export function generatePublicUrl(key: string, bucketName?: string): string {
  const bucket = bucketName || process.env.R2_BUCKET!
  
  // Seleccionar el dominio público correcto según el bucket
  let publicDomain: string | undefined
  if (bucket === process.env.R2_LICENSE_BUCKET) {
    publicDomain = process.env.R2_LICENSE_PUBLIC_DOMAIN
  } else {
    publicDomain = process.env.R2_PUBLIC_DOMAIN
  }
  
  if (publicDomain) {
    return `https://${publicDomain}/${key}`
  } else {
    // Fallback: usar el endpoint directo (menos confiable)
    const endpoint = process.env.R2_ENDPOINT!
    const accountIdMatch = endpoint.match(/https:\/\/([a-f0-9]+)\.r2\.cloudflarestorage\.com/)
    if (accountIdMatch) {
      const accountId = accountIdMatch[1]
      return `https://${bucket}.${accountId}.r2.cloudflarestorage.com/${key}`
    } else {
      // Último fallback
      const accountId = endpoint.split("/")[2].split(".")[0]
      return `https://pub-${accountId}.r2.dev/${key}`
    }
  }
}
