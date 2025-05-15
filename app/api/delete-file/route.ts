import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { deleteFromR2UsingFetch } from "@/lib/r2-direct"

export async function POST(request: Request) {
  try {
    const { key, userId, documentId } = await request.json()

    if (!key) {
      return NextResponse.json({ error: "Se requiere la clave del archivo" }, { status: 400 })
    }

    console.log(`Eliminando archivo con clave: ${key}`)

    try {
      // Eliminar el archivo de R2
      await deleteFromR2UsingFetch(key)
      console.log("Archivo eliminado de R2 correctamente")
    } catch (r2Error) {
      console.error("Error al eliminar archivo de R2:", r2Error)
      // Continuar para eliminar la referencia en la base de datos incluso si falla la eliminación en R2
    }

    // Eliminar la referencia en la base de datos
    const supabase = await createClient()

    if (documentId) {
      // Si se proporciona un ID de documento específico, eliminar solo ese documento
      const { error } = await supabase.from("documents").delete().eq("id", documentId)

      if (error) {
        console.error("Error al eliminar documento por ID:", error)
        throw new Error(`Error al eliminar referencia en base de datos: ${error.message}`)
      }
    } else if (userId) {
      // Si se proporciona un ID de usuario, eliminar todos los documentos que coincidan con la clave de almacenamiento
      const { error } = await supabase.from("documents").delete().eq("user_id", userId).eq("storage_path", key)

      if (error) {
        console.error("Error al eliminar documento por usuario y ruta:", error)
        throw new Error(`Error al eliminar referencia en base de datos: ${error.message}`)
      }
    } else {
      return NextResponse.json({ error: "Se requiere el ID del documento o del usuario" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Archivo eliminado correctamente" })
  } catch (error: any) {
    console.error("Error al eliminar archivo:", error)
    return NextResponse.json({ error: error.message || "Error al eliminar archivo" }, { status: 500 })
  }
}
