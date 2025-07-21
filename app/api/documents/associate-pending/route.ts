import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      tempId, 
      realItemId, 
      realRecordId, 
      userId, 
      documentType, 
      formType, 
      name, 
      url 
    } = body

    if (!tempId || !realItemId || !realRecordId || !userId || !documentType || !formType || !name || !url) {
      return NextResponse.json({ 
        error: "Faltan parámetros requeridos" 
      }, { status: 400 })
    }

    console.log("Asociando documento pendiente:", { tempId, realItemId, realRecordId, documentType, formType })

    // Verificar si ya existe un documento con este item_id
    const { data: existingDocs, error: checkError } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .eq("type", documentType)
      .eq("item_id", realItemId)

    if (checkError) {
      console.error("Error verificando documento existente:", checkError)
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
          name,
          url,
          status: 'uploaded',
          updated_at: new Date().toISOString()
        })
        .eq("id", existingDoc.id)
        .select()
        .single()

      result = { data, error }
    } else {
      // Crear nuevo documento con el item_id real
      const { data, error } = await supabase
        .from("documents")
        .insert({
          user_id: userId,
          name,
          type: documentType,
          category: formType,
          url,
          status: 'uploaded',
          item_id: realItemId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      result = { data, error }
    }

    if (result.error) {
      console.error("Error guardando documento asociado:", result.error)
      return NextResponse.json({ 
        error: "Error guardando documento asociado" 
      }, { status: 500 })
    }

    console.log("Documento asociado correctamente:", result.data)

    return NextResponse.json({
      success: true,
      document: result.data,
      message: "Documento asociado correctamente"
    })

  } catch (error) {
    console.error("Error en associate-pending:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
}
