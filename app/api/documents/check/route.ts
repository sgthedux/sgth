import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generatePublicUrl } from "@/lib/r2-direct"

// Configuración para runtime dinámico
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const documentType = searchParams.get("documentType")
    const formType = searchParams.get("formType")
    const itemIndex = searchParams.get("itemIndex")

    if (!userId || !documentType || !formType) {
      return NextResponse.json({ error: "Parámetros faltantes" }, { status: 400 })
    }

    const supabase = await createClient()
    
    console.log("Buscando documento con parámetros:", { userId, documentType, formType, itemIndex })
      // Función helper para crear mapeo de tipos con compatibilidad
    function createTypeMapping(documentType: string, formType: string, itemIndex: string | null): string[] {
      const possibleTypes: string[] = []
      
      // Mapear tipos con compatibilidad entre formatos antiguos y nuevos
      if (documentType === "identification_document") {
        possibleTypes.push("identification_document", "identification")
      } else if (documentType === "military_booklet") {
        possibleTypes.push("military_booklet")
      } else if (documentType === "basic_education_certificate") {
        possibleTypes.push("basic_education_certificate")
        if (itemIndex !== null && itemIndex !== undefined && itemIndex !== "") {
          possibleTypes.push(`education_basic_${itemIndex}`)
        }
      } else if (documentType === "higher_education_diploma") {
        possibleTypes.push("higher_education_diploma")
        if (itemIndex !== null && itemIndex !== undefined && itemIndex !== "") {
          possibleTypes.push(`education_higher_${itemIndex}`)
        }
      } else if (documentType === "experience_certificate") {
        possibleTypes.push("experience_certificate")
        if (itemIndex !== null && itemIndex !== undefined && itemIndex !== "") {
          possibleTypes.push(`experience_${itemIndex}`)
        }
      } else if (documentType === "language_certificate") {
        possibleTypes.push("language_certificate")
        if (itemIndex !== null && itemIndex !== undefined && itemIndex !== "") {
          possibleTypes.push(`language_${itemIndex}`)
        }
      } else {
        // Para otros tipos, usar el tipo exacto
        possibleTypes.push(documentType)
      }
      
      return possibleTypes
    }
    
    // Crear mapeo de tipos posibles
    const possibleTypes = createTypeMapping(documentType, formType, itemIndex)
    console.log("Tipos posibles:", possibleTypes)
    
    // Build the query to find existing document
    let query = supabase
      .from("documents")
      .select("url, name, created_at, type, category, item_id")
      .eq("user_id", userId)
    
    // Filtrar por tipos (con compatibilidad)
    if (possibleTypes.length === 1) {
      query = query.eq("type", possibleTypes[0])
    } else {
      query = query.in("type", possibleTypes)
    }
    
    // Filtro adicional por categoría si está disponible (pero no estricto)
    // Solo agregar filtro de categoría si no es null/undefined
    if (formType && formType !== "") {
      // Usar filter or para incluir documentos sin categoría (null) o con la categoría correcta
      query = query.or(`category.eq.${formType},category.is.null`)
    }

    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(1)

    console.log("Resultado de la consulta:", { data, error })

    // Debug: Si no se encontró nada, hagamos una consulta sin filtros para ver qué hay
    if (!data || data.length === 0) {
      console.log("No se encontró documento, consultando todos los documentos del usuario...")
      const { data: allDocs } = await supabase
        .from("documents")
        .select("type, category, item_id, name")
        .eq("user_id", userId)
        .limit(10)
      console.log("Todos los documentos del usuario:", allDocs)
    }

    if (error) {
      console.error("Error checking document:", error)
      return NextResponse.json({ exists: false, error: error.message })
    }

    if (data && data.length > 0) {
      const document = data[0]
      console.log("Documento encontrado:", document)
      
      // Generar URL pública correcta según el bucket del documento
      let publicUrl = document.url
      
      // Si la URL no es completa, generarla usando la función helper
      if (publicUrl && !publicUrl.startsWith('http')) {
        // Determinar el bucket basado en la categoría o tipo de documento
        const isLicenseDocument = document.category === 'license' || document.type?.includes('license')
        const bucketName = isLicenseDocument ? process.env.R2_LICENSE_BUCKET : process.env.R2_BUCKET
        publicUrl = generatePublicUrl(publicUrl, bucketName)
      }
      
      return NextResponse.json({
        exists: true,
        url: publicUrl,
        name: document.name,
        type: document.type,
        category: document.category,
        createdAt: document.created_at
      })
    }

    console.log("No se encontró documento para:", { userId, documentType, formType })
    return NextResponse.json({ exists: false })
  } catch (error) {
    console.error("Error in document check API:", error)
    return NextResponse.json({ exists: false })
  }
}
