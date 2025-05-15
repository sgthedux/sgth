import { createHmac, createHash } from "crypto"

// Función para generar la firma AWS Signature V4 para R2
export async function signRequest(
  method: string,
  url: string,
  region: string,
  service: string,
  payload: Buffer | string,
  accessKey: string,
  secretKey: string,
  contentType?: string,
) {
  const endpoint = new URL(url)
  const host = endpoint.host
  const path = endpoint.pathname

  // Fecha actual en formato ISO
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "")
  const date = amzDate.substring(0, 8)

  // Crear payload hash
  const payloadHash = createHash("sha256")
    .update(payload || "")
    .digest("hex")

  // Crear headers canónicos
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

  // Crear solicitud canónica
  const canonicalRequest = [method, path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n")

  // Crear string para firmar
  const algorithm = "AWS4-HMAC-SHA256"
  const credentialScope = `${date}/${region}/${service}/aws4_request`
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n")

  // Calcular firma
  const kDate = createHmac("sha256", `AWS4${secretKey}`).update(date).digest()
  const kRegion = createHmac("sha256", kDate).update(region).digest()
  const kService = createHmac("sha256", kRegion).update(service).digest()
  const kSigning = createHmac("sha256", kService).update("aws4_request").digest()
  const signature = createHmac("sha256", kSigning).update(stringToSign).digest("hex")

  // Crear header de autorización
  const authorizationHeader = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return {
    Authorization: authorizationHeader,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    ...(contentType ? { "Content-Type": contentType } : {}),
  }
}

// Función para subir un archivo a R2 directamente
export async function uploadToR2(fileBuffer: Buffer, key: string, contentType: string): Promise<string> {
  // Usar las variables de entorno directamente con los valores proporcionados
  const bucket = "archivos-sgth"
  const endpoint = `https://348ced26f17802f62b12ce710912eb6d.r2.cloudflarestorage.com/${bucket}/${key}`
  const accessKeyId = "f5e6178fb434543d93facf811c653a7f"
  const secretAccessKey = "29fd05e7bc2ee1e68f3eafc99c59804c83b61fe53bcfb62155692d88af249810"

  console.log("Subiendo archivo a R2:", {
    bucket,
    key,
    contentType,
    size: fileBuffer.length,
    endpoint,
  })

  const headers = await signRequest(
    "PUT",
    endpoint,
    "auto",
    "s3",
    fileBuffer,
    accessKeyId,
    secretAccessKey,
    contentType,
  )

  console.log(
    "Headers generados para la solicitud PUT:",
    Object.keys(headers).map((k) => `${k}: ${k === "Authorization" ? "[REDACTED]" : headers[k]}`),
  )

  try {
    // Verificar que el buffer no esté vacío
    if (fileBuffer.length === 0) {
      throw new Error("El buffer del archivo está vacío")
    }

    const response = await fetch(endpoint, {
      method: "PUT",
      headers,
      body: fileBuffer,
    })

    // Intentar obtener el cuerpo de la respuesta para depuración
    let responseBody = ""
    try {
      responseBody = await response.text()
    } catch (e) {
      console.warn("No se pudo obtener el cuerpo de la respuesta:", e)
    }

    console.log(`Respuesta de R2 PUT: ${response.status} ${response.statusText}`)
    console.log(`Cuerpo de la respuesta: ${responseBody.substring(0, 200)}${responseBody.length > 200 ? "..." : ""}`)

    if (!response.ok) {
      throw new Error(`Error al subir a R2: ${response.status} ${response.statusText} - ${responseBody}`)
    }

    // Verificar que el archivo se haya subido correctamente
    try {
      const checkResponse = await fetch(endpoint, {
        method: "HEAD",
      })

      if (!checkResponse.ok) {
        console.warn(`Verificación de archivo subido falló: ${checkResponse.status} ${checkResponse.statusText}`)
      } else {
        console.log("Verificación de archivo subido exitosa")
      }
    } catch (checkError) {
      console.warn("Error al verificar archivo subido:", checkError)
    }

    // Generar URL pública con el formato correcto
    const publicUrl = `https://pub-373d5369059842f8abf123c212109054.r2.dev/${key}`
    console.log("URL pública generada:", publicUrl)
    return publicUrl
  } catch (error) {
    console.error("Error en uploadToR2:", error)
    throw error
  }
}

// Función para eliminar un archivo de R2 directamente usando fetch
export async function deleteFromR2UsingFetch(key: string): Promise<void> {
  try {
    if (!key) {
      throw new Error("La clave del objeto no puede estar vacía")
    }

    // Usar las variables de entorno directamente con los valores proporcionados
    const bucket = "archivos-sgth"
    const endpoint = `https://348ced26f17802f62b12ce710912eb6d.r2.cloudflarestorage.com/${bucket}/${key}`
    const accessKeyId = "f5e6178fb434543d93facf811c653a7f"
    const secretAccessKey = "29fd05e7bc2ee1e68f3eafc99c59804c83b61fe53bcfb62155692d88af249810"

    console.log(`Eliminando archivo de R2: ${endpoint}`)

    // Usar la función signRequest para generar los headers de autenticación
    const headers = await signRequest(
      "DELETE",
      endpoint,
      "auto",
      "s3",
      "", // payload vacío para DELETE
      accessKeyId,
      secretAccessKey,
    )

    console.log(
      "Headers generados para la solicitud DELETE:",
      Object.keys(headers).map((k) => `${k}: ${k === "Authorization" ? "[REDACTED]" : headers[k]}`),
    )

    // Realizar la solicitud DELETE usando fetch
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers,
    })

    // Intentar obtener el cuerpo de la respuesta para depuración
    let responseBody = ""
    try {
      responseBody = await response.text()
    } catch (e) {
      console.warn("No se pudo obtener el cuerpo de la respuesta:", e)
    }

    console.log(`Respuesta de R2 DELETE: ${response.status} ${response.statusText}`)
    console.log(`Cuerpo de la respuesta: ${responseBody.substring(0, 200)}${responseBody.length > 200 ? "..." : ""}`)

    if (!response.ok) {
      // Si estamos en desarrollo, simular éxito
      if (process.env.NODE_ENV === "development") {
        console.log("Simulando eliminación exitosa en desarrollo")
        return
      }
      throw new Error(`Error al eliminar de R2: ${response.status} ${response.statusText} - ${responseBody}`)
    }
  } catch (error) {
    console.error("Error en deleteFromR2UsingFetch:", error)
    throw error
  }
}
