import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Función para crear un cliente de Supabase con la clave de servicio
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Faltan variables de entorno para Supabase")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Se requiere un correo electrónico" }, { status: 400 })
    }

    // Crear cliente de Supabase con la clave de servicio
    const supabase = createAdminClient()

    // Verificar si el usuario existe en auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email)

    if (userError) {
      console.error("Error al verificar usuario:", userError)
      // No revelamos si el usuario existe o no por seguridad
      return NextResponse.json(
        { message: "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña." },
        { status: 200 },
      )
    }

    // Si el usuario existe, asegurarnos de que su email esté confirmado
    if (userData?.user && !userData.user.email_confirmed_at) {
      // Confirmar el email del usuario
      const { error: confirmError } = await supabase.auth.admin.updateUserById(userData.user.id, {
        email_confirmed_at: new Date().toISOString(),
      })

      if (confirmError) {
        console.error("Error al confirmar email:", confirmError)
        return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
      }
    }

    // Generar y enviar el enlace de recuperación
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      console.error("Error al generar enlace de recuperación:", resetError)
      return NextResponse.json(
        { error: "Error al procesar la solicitud de recuperación de contraseña" },
        { status: 500 },
      )
    }

    // Por seguridad, siempre devolvemos el mismo mensaje
    return NextResponse.json(
      { message: "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña." },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error en la API de recuperación de contraseña:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}