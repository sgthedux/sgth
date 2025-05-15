import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verificar autenticación
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Obtener datos del cuerpo
    const body = await request.json()
    const { userId, fullName, avatarUrl } = body

    // Verificar que el usuario solo actualice su propio perfil
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado para actualizar este perfil" }, { status: 403 })
    }

    // Preparar datos para actualizar (asegurando que sean serializables)
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (fullName !== undefined) {
      updateData.full_name = String(fullName)
    }

    if (avatarUrl !== undefined) {
      updateData.avatar_url = String(avatarUrl)
    }

    // Actualizar perfil en Supabase
    const { error } = await supabase.from("profiles").update(updateData).eq("id", userId)

    if (error) {
      // Convertir el error a un objeto serializable simple
      const errorMessage = error.message || "Error desconocido"
      const errorCode = error.code || "UNKNOWN"

      console.error("Error al actualizar perfil:", { message: errorMessage, code: errorCode })
      return NextResponse.json(
        {
          error: errorMessage,
          code: errorCode,
        },
        { status: 500 },
      )
    }

    // Actualizar también los metadatos del usuario en auth
    try {
      if (fullName !== undefined) {
        await supabase.auth.updateUser({
          data: {
            full_name: String(fullName),
          },
        })
      }
    } catch (authError: any) {
      // Solo registramos el error pero no fallamos la operación
      console.error("Error al actualizar metadatos de auth:", authError.message || "Error desconocido")
    }

    // Devolver una respuesta serializable simple
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    // Asegurar que el error sea serializable
    const errorMessage = error.message || "Error interno del servidor"
    console.error("Error en la ruta update-profile:", errorMessage)

    return NextResponse.json(
      {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
