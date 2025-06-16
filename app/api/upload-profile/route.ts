import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadToR2 } from "@/lib/r2-direct"

// Route segment config
export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const documentType = formData.get("documentType") as string
    const formType = formData.get("formType") as string // 'experience', 'education', 'language', etc.
    const itemIndex = formData.get("itemIndex") as string

    if (!file) {
      return NextResponse.json({ error: "No se ha proporcionado ningún archivo" }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: "Falta el ID del usuario" }, { status: 400 })
    }
    if (!documentType) {
      return NextResponse.json({ error: "Falta el tipo de documento" }, { status: 400 })
    }
    if (!formType) {
      return NextResponse.json({ error: "Falta el tipo de formulario" }, { status: 400 })
    }

    // Validar tamaño del archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo no debe superar los 5MB" }, { status: 400 })
    }

    // Validar tipo de archivo
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]

    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const randomSuffix = Math.random().toString(36).substring(2, 7)
    const fileName = `${documentType}-${timestamp}-${randomSuffix}.${fileExtension}`
    const filePath = `profiles/${userId}/${formType}/${fileName}`

    let publicUrl: string
    try {
      publicUrl = await uploadToR2(buffer, filePath, file.type)
    } catch (uploadError) {
      console.error("Error al subir el archivo a R2:", uploadError)
      return NextResponse.json(
        { error: "Error al subir el archivo al almacenamiento.", details: (uploadError as Error).message },
        { status: 500 },
      )
    }    // Save to existing documents table
    const supabase = await createClient()
    
    // Debug: Log all data before saving
    console.log("=== DEBUG DOCUMENT SAVE ===")
    console.log("userId:", userId)
    console.log("documentType:", documentType)
    console.log("formType:", formType)
    console.log("itemIndex:", itemIndex)
    console.log("file.name:", file.name)
    console.log("publicUrl:", publicUrl)
    console.log("filePath:", filePath)    
    // Create a unique identifier for this document
    const documentId = `${formType}_${documentType}_${itemIndex || 0}`
      // Calcular item_id según el tipo de formulario y documento
    let itemId = null
    if (itemIndex !== null && itemIndex !== undefined && itemIndex !== "" && formType !== "personal_info") {
      if (formType === "education") {
        if (documentType === "basic_education_certificate") {
          itemId = `basic_${itemIndex}`
        } else if (documentType === "higher_education_diploma") {
          itemId = `higher_${itemIndex}`
        }
      } else if (formType === "experience") {
        itemId = `experience_${itemIndex}`
      } else if (formType === "language") {
        itemId = `language_${itemIndex}`
      }
    }
    
    console.log("itemId calculado:", itemId)
    
    const documentData = {
      user_id: userId,
      type: documentType,
      category: formType,
      name: file.name,
      url: publicUrl,
      status: 'uploaded',
      item_id: itemId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    console.log("Datos del documento a guardar:", documentData)    // Primero verificar si ya existe un documento con los mismos criterios
    let existingDoc = null
    if (itemId) {
      // Para documentos con item_id específico
      const { data: existing } = await supabase
        .from("documents")
        .select("id")
        .eq("user_id", userId)
        .eq("type", documentType)
        .eq("category", formType)
        .eq("item_id", itemId)
        .single()
      existingDoc = existing
    } else {
      // Para documentos sin item_id (información personal)
      const { data: existing } = await supabase
        .from("documents")
        .select("id")
        .eq("user_id", userId)
        .eq("type", documentType)
        .eq("category", formType)
        .is("item_id", null)
        .single()
      existingDoc = existing
    }

    let result
    if (existingDoc) {
      // Actualizar documento existente
      result = await supabase
        .from("documents")
        .update({
          name: file.name,
          url: publicUrl,
          status: 'uploaded',
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingDoc.id)
        .select()
        .single()
    } else {
      // Insertar nuevo documento
      result = await supabase
        .from("documents")
        .insert(documentData)
        .select()
        .single()
    }

    const { data, error } = result

    console.log("Resultado del upsert:", { data, error })

    if (error) {
      console.error("Error al guardar el documento en la base de datos:", error)
      return NextResponse.json({ error: "Error al guardar la referencia del archivo" }, { status: 500 })
    }

    console.log("Documento guardado exitosamente:", data)
    console.log("=== FIN DEBUG DOCUMENT SAVE ===")

    return NextResponse.json({
      success: true,
      path: filePath,
      url: publicUrl,
      document: data,
    })
  } catch (error) {
    console.error("Error en la carga de archivos:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
