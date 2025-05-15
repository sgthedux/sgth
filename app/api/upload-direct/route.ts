import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { uploadToR2 } from "@/lib/r2-direct"
import { cookies } from "next/headers"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string
    const category = (formData.get("category") as string) || "uploads"
    const itemId = (formData.get("itemId") as string) || "default"

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó ningún archivo" }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: "Se requiere el ID del usuario" }, { status: 400 })
    }

    // Crear un nombre de archivo único
    const fileExtension = file.name.split(".").pop()
    const fileName = `${userId}/${category}/${itemId}_${Date.now()}.${fileExtension}`

    // Convertir el archivo a un ArrayBuffer y luego a Buffer para R2
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Subir el archivo a R2 usando la función existente
    console.log("Subiendo archivo a R2:", fileName, file.type)

    try {
      const publicUrl = await uploadToR2(buffer, fileName, file.type)
      console.log("Archivo subido a R2, URL pública:", publicUrl)

      // Inicializar correctamente el cliente de Supabase
      const cookieStore = cookies()
      const supabase = await createClient()

      // Primero, eliminar cualquier documento existente para evitar duplicados
      try {
        const { error: deleteError } = await supabase
          .from("documents")
          .delete()
          .eq("user_id", userId)
          .eq("type", category)
          .eq("item_id", itemId)

        if (deleteError) {
          console.warn("Error al eliminar documentos existentes:", deleteError)
        }
      } catch (deleteError) {
        console.warn("Error al eliminar documentos existentes:", deleteError)
      }

      // Insertar el nuevo documento
      const documentData = {
        user_id: userId,
        name: file.name,
        type: category,
        item_id: itemId,
        url: publicUrl,
        status: "Aprobado",
        storage_path: fileName,
      }

      console.log("Guardando documento en Supabase:", documentData)

      const { data: insertData, error: insertError } = await supabase.from("documents").insert(documentData).select()

      if (insertError) {
        console.error("Error al insertar documento en Supabase:", insertError)
        throw new Error(`Error al guardar referencia en base de datos: ${insertError.message}`)
      }

      console.log("Documento guardado en Supabase:", insertData)

      // Actualizar el perfil del usuario si es un CV
      if (category === "cv_signed") {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            cv_generated: true,
            cv_url: publicUrl,
            cv_generated_at: new Date().toISOString(),
          })
          .eq("id", userId)

        if (updateError) {
          console.warn("Error al actualizar perfil:", updateError)
        }
      }

      return NextResponse.json({
        url: publicUrl,
        key: fileName,
        fileName: file.name,
        public_url: publicUrl,
      })
    } catch (uploadError) {
      console.error("Error al subir archivo a R2:", uploadError)
      throw new Error(`Error al subir archivo a R2: ${uploadError.message}`)
    }
  } catch (error: any) {
    console.error("Error al subir archivo:", error)
    return NextResponse.json({ error: error.message || "Error al subir archivo" }, { status: 500 })
  }
}
