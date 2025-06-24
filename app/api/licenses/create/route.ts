import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadToR2 } from "@/lib/r2-direct"

// Configuración para runtime dinámico
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Función para generar un radicado único
function generateRadicado() {
  const year = new Date().getFullYear()
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `LIC-${year}-${timestamp.toString().slice(-6)}${random}`
}

// Función para crear respuesta de error JSON
function createErrorResponse(message: string, details?: any, status = 500) {
  console.error(`❌ [API /create] Error Response: ${message}`, details || "")
  return NextResponse.json(
    {
      success: false,
      error: message,
      details: details,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}

// Función para crear respuesta de éxito JSON
function createSuccessResponse(data: any) {
  console.log(`✅ [API /create] Success Response:`, data)
  return NextResponse.json(
    {
      success: true,
      ...data,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 [API /create] Iniciando creación de solicitud de licencia")

    // --- Verificación Crítica de Variables de Entorno ---
    const envVars = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      r2Bucket: process.env.R2_BUCKET,
      r2LicenseBucket: process.env.R2_LICENSE_BUCKET || process.env.R2_BUCKET, // Bucket específico para licencias
      r2Endpoint: process.env.R2_ENDPOINT,
      r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
      r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      r2Region: process.env.R2_REGION, // Generalmente 'auto' para Cloudflare R2
    }

    const missingVars = Object.entries(envVars)
      .filter(([, value]) => !value)
      .map(([key]) => key)

    if (missingVars.length > 0) {
      const errorMessage = `Faltan variables de entorno críticas: ${missingVars.join(", ")}. Por favor, configúralas en Vercel.`
      console.error(`❌ [API /create] CONFIGURATION ERROR: ${errorMessage}`)
      return createErrorResponse(errorMessage, { missingVariables: missingVars, code: "ENV_CONFIG_ERROR" }, 500)
    }
    console.log("✅ [API /create] Variables de entorno críticas verificadas.")
    // --- Fin Verificación Crítica ---

    // --- NUEVO LOG DE DIAGNÓSTICO ---
    console.log(`[API /create] DIAGNÓSTICO: Intentando conectar a Supabase URL: ${envVars.supabaseUrl}`)
    // --- FIN NUEVO LOG ---

    const formData = await request.formData()
    console.log("📝 [API /create] FormData recibido.")
    
    // Debug: Mostrar todas las claves del FormData
    console.log("🔍 [API /create] Claves en FormData:", Array.from(formData.keys()))
    formData.forEach((value, key) => {
      if (value instanceof File) {
        console.log(`📎 [API /create] Archivo encontrado - Key: ${key}, Name: ${value.name}, Size: ${value.size}, Type: ${value.type}`)
      } else {
        console.log(`📝 [API /create] Campo encontrado - Key: ${key}, Value: ${value}`)
      }
    })

    const licenseData = {
      nombres: formData.get("nombres") as string,
      apellidos: formData.get("apellidos")?.toString().trim() as string,
      tipo_documento: formData.get("tipo_documento") as string,
      numero_documento: formData.get("numero_documento") as string,
      area_trabajo: formData.get("area_trabajo")?.toString().trim() || null,
      cargo: formData.get("cargo") as string,
      codigo_tipo_permiso: formData.get("codigo_tipo_permiso") as string,
      fecha_inicio: formData.get("fecha_inicio") as string,
      fecha_finalizacion: formData.get("fecha_finalizacion") as string,
      fecha_compensacion: formData.get("fecha_compensacion")?.toString().trim() || null,
      hora_inicio: formData.get("hora_inicio")?.toString().trim() || null,
      hora_fin: formData.get("hora_fin")?.toString().trim() || null,
      reemplazo: formData.get("reemplazo") === "true",
      reemplazante: formData.get("reemplazante")?.toString().trim() || null,
      observacion: formData.get("observacion") as string,
    }

    const requiredFields = [
      'nombres', 'apellidos', 'tipo_documento', 'numero_documento', 
      'cargo', 'codigo_tipo_permiso', 'fecha_inicio', 'fecha_finalizacion', 
      'observacion'
    ]
    
    for (const field of requiredFields) {
      if (!licenseData[field as keyof typeof licenseData]) {
        console.error(`❌ [API /create] Campo requerido faltante: ${field}`)
        return createErrorResponse(`El campo ${field} es requerido`, { field }, 400)
      }
    }
    
    // Validaciones especiales
    if (licenseData.reemplazo && !licenseData.reemplazante) {
      return createErrorResponse("El campo reemplazante es requerido cuando se indica reemplazo", { field: 'reemplazante' }, 400)
    }
    
    console.log("✅ [API /create] Campos de datos de licencia validados.")

    // Validación de fechas considerando permisos por horas
    const fechaInicio = new Date(licenseData.fecha_inicio)
    const fechaFin = new Date(licenseData.fecha_finalizacion)
    
    // Permitir fechas iguales si se especifican horas (permisos por horas)
    const tieneHoras = licenseData.hora_inicio && licenseData.hora_fin
    
    if (tieneHoras) {
      // Si hay horas, validar que la fecha fin sea igual o posterior
      if (fechaFin < fechaInicio) {
        return createErrorResponse("La fecha de finalización no puede ser anterior a la fecha de inicio", null, 400)
      }
      // Si es el mismo día, validar que la hora fin sea posterior a la hora inicio
      if (fechaFin.getTime() === fechaInicio.getTime() && licenseData.hora_inicio && licenseData.hora_fin) {
        const horaInicio = licenseData.hora_inicio
        const horaFin = licenseData.hora_fin
        if (horaFin <= horaInicio) {
          return createErrorResponse("La hora de fin debe ser posterior a la hora de inicio", null, 400)
        }
      }
    } else {
      // Si no hay horas especificadas, la fecha fin debe ser posterior (no igual)
      if (fechaFin <= fechaInicio) {
        return createErrorResponse("La fecha de finalización debe ser posterior a la fecha de inicio", null, 400)
      }
    }

    const radicado = generateRadicado()
    const supabase = await createClient() // Usa SUPABASE_SERVICE_ROLE_KEY internamente

    // TODO: Implementar obtención de user_id si es necesario y el usuario está autenticado
    // const { data: { user } } = await supabase.auth.getUser();
    // const userId = user?.id;
    const userId = null

    const insertData = { ...licenseData, radicado, user_id: userId, estado: "pendiente" }

    console.log("[API /create] Intentando insertar en license_requests:", JSON.stringify(insertData, null, 2))
    const { data: licenseRequest, error: licenseError } = await supabase
      .from("license_requests")
      .insert(insertData)
      .select()
      .single()

    if (licenseError) {
      // El error 'TypeError: Failed to fetch' ocurre aquí.
      console.error("❌ [API /create] Error creando solicitud de licencia en DB:", licenseError)
      // Añadimos más contexto al error que se devuelve
      return createErrorResponse(
        "Error de red al conectar con la base de datos. Verifique la URL de Supabase y la conectividad.",
        {
          originalMessage: licenseError.message, // "Failed to fetch"
          type: licenseError.name, // "TypeError"
          hint: "Esto usualmente indica que la variable de entorno NEXT_PUBLIC_SUPABASE_URL es incorrecta o que hay un problema de red.",
        },
        500,
      )
    }
    console.log("✅ [API /create] Solicitud de licencia creada en DB:", licenseRequest.id)

    const uploadedEvidences: any[] = []
    const uploadErrors: any[] = []
    const evidenceFiles = formData.getAll("evidences") as File[]

    console.log(`📎 [API /create] Archivos detectados en FormData: ${evidenceFiles.length}`)
    evidenceFiles.forEach((file, index) => {
      console.log(`📎 Archivo ${index + 1}: ${file.name} (${file.size} bytes, tipo: ${file.type})`)
    })

    // Mejorar la lógica de detección de archivos válidos
    const validFiles = evidenceFiles.filter(file => file && file.size > 0 && file.name !== 'undefined')
    console.log(`📎 [API /create] Archivos válidos encontrados: ${validFiles.length}`)

    if (validFiles.length > 0) {
      console.log(`📎 [API /create] Procesando ${validFiles.length} archivo(s) de evidencia.`)

      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        
        try {
          console.log(`📎 [API /create] Procesando archivo: ${file.name} (${file.size} bytes)`)
          
          if (file.size > 5 * 1024 * 1024) {
            uploadErrors.push({ fileName: file.name, error: "El archivo supera los 5MB" })
            continue
          }
          
          const validTypes = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/jpg",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ]
          
          if (!validTypes.includes(file.type)) {
            uploadErrors.push({ fileName: file.name, error: `Tipo de archivo no permitido: ${file.type}` })
            continue
          }

          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          const timestamp = Date.now()
          const fileExtension = file.name.split(".").pop() || "bin"
          // Sanitize original file name for use in the new file name
          const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
          const newFileName = `evidence-${timestamp}-${Math.random().toString(36).substring(2, 7)}-${sanitizedOriginalName}`
          const filePath = `licenses/${licenseRequest.id}/${newFileName}`.replace(/\s+/g, "_") // Reemplazar espacios

          console.log(`📤 [API /create] Subiendo archivo a R2: ${filePath}, Tipo: ${file.type}, Buffer size: ${buffer.length}`)
          
          // Usar bucket específico para licencias si está configurado
          const licenseBucket = process.env.R2_LICENSE_BUCKET || process.env.R2_BUCKET
          const publicUrl = await uploadToR2(buffer, filePath, file.type, licenseBucket)
          console.log(`✅ [API /create] Archivo subido a R2 en bucket ${licenseBucket}. URL: ${publicUrl}`)

          const { data: evidenceData, error: evidenceError } = await supabase
            .from("license_evidences")
            .insert({
              license_request_id: licenseRequest.id,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_path: filePath,
              file_url: publicUrl,
            })
            .select()
            .single()

          if (evidenceError) {
            throw new Error(`Error al guardar evidencia en DB: ${evidenceError.message}`)
          }
          uploadedEvidences.push(evidenceData)
          console.log(`✅ [API /create] Evidencia ${file.name} guardada en DB.`)
        } catch (error: any) {
          console.error(`❌ [API /create] Error procesando archivo ${validFiles[i].name}:`, error)
          uploadErrors.push({ fileName: validFiles[i].name, error: error.message })
        }
      }
    } else {
      console.log("ℹ️ [API /create] No se adjuntaron archivos de evidencia válidos.")
    }

    console.log("🎉 [API /create] Proceso completado.")
    return createSuccessResponse({
      radicado,
      licenseRequest,
      evidences: uploadedEvidences,
      message: `Solicitud de licencia creada exitosamente. ${uploadedEvidences.length} archivo(s) de evidencia procesado(s).`,
      summary: {
        totalFiles: evidenceFiles.length,
        uploadedFiles: uploadedEvidences.length,
        failedFiles: uploadErrors.length,
        uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
      },
    })
  } catch (error: any) {
    console.error("💥 [API /create] Error crítico no capturado:", error)
    return createErrorResponse(
      "Error interno del servidor no manejado.",
      {
        message: error?.message || 'Error desconocido',
        name: error?.name || 'UnknownError',
        // stack: error.stack, // No enviar stack al cliente en producción real
      },
      500,
    )
  }
}
