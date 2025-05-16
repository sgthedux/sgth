import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") || "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Error exchanging code for session:", error)
      return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
    }

    // Después de autenticar, obtenemos el usuario y su rol
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      try {
        // Obtenemos el rol del usuario
        const { data: profileData } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        const role = profileData?.role || "user"

        // Actualizamos los metadatos del usuario con su rol
        await supabase.auth.updateUser({
          data: { role },
        })

        // Forzar una redirección completa con un parámetro de tiempo para evitar caché
        const timestamp = Date.now()

        // Redirigimos según el rol
        if (role === "admin") {
          return NextResponse.redirect(new URL(`/admin/dashboard?t=${timestamp}`, requestUrl.origin))
        } else {
          return NextResponse.redirect(new URL(`/dashboard?t=${timestamp}`, requestUrl.origin))
        }
      } catch (error) {
        console.error("Error setting user role in metadata:", error)
      }
    }
  }

  // Si no hay código o hubo un error, redirigimos a la página especificada o a la raíz
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
