import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadToR2, generatePublicUrl } from "@/lib/r2-direct"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const documentType = formData.get("documentType") as string
    const formType = formData.get("formType") as string
    const recordId = formData.get("recordId") as string
    const itemIndex = formData.get("itemIndex") as string

    if (!file || !userId || !documentType || !formType) {
      return NextResponse.json({ 
        error: "Faltan parámetros requeridos" 
      }, { status: 400 })
    }

    // Generar item_id robusto
    let itemId: string
    if (recordId) {
      // Usar recordId real si está disponible
      if (formType === "education") {
        if (documentType === "basic_education_certificate") {
          itemId = `basic_${recordId}`
        } else if (documentType === "higher_education_diploma") {
          itemId = `higher_${recordId}`
        } else {
          itemId = `${formType}_${recordId}`
        }
      } else {
        itemId = `${formType}_${recordId}`
      }
    } else if (itemIndex !== null && itemIndex !== undefined) {
      // Fallback para compatibilidad con índices existentes
      itemId = `${formType}_${itemIndex}`
    } else {
      return NextResponse.json({ 
        error: "Se requiere recordId o itemIndex" 
      }, { status: 400 })
    }

    console.log("Generated itemId for upload:", itemId, "from recordId:", recordId, "itemIndex:", itemIndex)

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generar clave única para el archivo
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = `profile/${userId}/${itemId}/${timestamp}-${sanitizedFileName}`

    // Subir archivo a R2
    const uploadUrl = await uploadToR2(buffer, key, file.type)
    
    // Generar URL pública
    const publicUrl = generatePublicUrl(key)

    // Verificar si ya existe un documento para este item_id
    const { data: existingDocs, error: checkError } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("type", documentType)
      .eq("item_id", itemId)

    if (checkError) {
      console.error("Error checking existing document:", checkError)
      return NextResponse.json({ 
        error: "Error verificando documento existente" 
      }, { status: 500 })
    }

    const existingDoc = existingDocs && existingDocs.length > 0 ? existingDocs[0] : null

    let result
    if (existingDoc) {
      // Actualizar documento existente
      const { data, error } = await supabase
        .from("documents")
        .update({
          name: file.name,
          url: publicUrl,
          status: 'uploaded',
          updated_at: new Date().toISOString()
        })
        .eq("id", existingDoc.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Crear nuevo documento
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          name: file.name,
          type: documentType,
          category: formType,
          url: publicUrl,
          status: 'uploaded',
          item_id: itemId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      console.error("Error saving document:", result.error)
      return NextResponse.json({ 
        error: "Error guardando documento" 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      document: result.data
    })

  } catch (error) {
    console.error("Error in upload-profile-robust:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}
