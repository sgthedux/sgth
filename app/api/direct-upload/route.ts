import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Convertir el archivo a un ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Configuración de R2
    const r2Endpoint = process.env.R2_ENDPOINT || ""
    const r2Bucket = process.env.R2_BUCKET || ""
    const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID || ""
    const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY || ""
    const r2Region = process.env.R2_REGION || "auto"
    const r2TokenAuth = process.env.R2_TOKEN_AUTHENTICATION || ""

    // Construir la URL para la solicitud a R2 con autenticación por token
    const url = `${r2Endpoint}/${fileName}?token=${r2TokenAuth}`

    // Usar fetch directamente para subir a R2 (sin depender del SDK de AWS)
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: arrayBuffer,
    })

    if (!response.ok) {
      throw new Error(`Error al subir a R2: ${response.status} ${response.statusText}`)
    }

    // URL pública del archivo
    const publicUrl = `https://pub-${r2Bucket}.r2.dev/${fileName}`

    // Guardar la referencia en Supabase
    const supabase = await createClient()

    // Primero, eliminar cualquier documento existente para evitar duplicados
    try {
      await supabase.from("documents").delete().eq("user_id", userId).eq("type", category).eq("item_id", itemId)
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

    const { error: insertError } = await supabase.from("documents").insert(documentData)
    if (insertError) {
      console.error("Error al insertar documento en Supabase:", insertError)
      throw new Error(`Error al guardar referencia en base de datos: ${insertError.message}`)
    }

    // Actualizar el perfil del usuario si es un CV
    if (category === "cv_signed") {
      await supabase
        .from("profiles")
        .update({
          cv_generated: true,
          cv_url: publicUrl,
          cv_generated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    }

    return NextResponse.json({
      url: publicUrl,
      key: fileName,
      fileName: file.name,
      public_url: publicUrl,
    })
  } catch (error: any) {
    console.error("Error al subir archivo:", error)
    return NextResponse.json({ error: error.message || "Error al subir archivo" }, { status: 500 })
  }
}
