// ESTE ARCHIVO DEBE SER CORREGIDO COMO SE INDICÓ EN LA RESPUESTA ANTERIOR.
// Lo incluyo aquí para que esté en el CodeProject, pero usa la versión corregida
// que te proporcioné que maneja correctamente las cookies.
// Si no lo has hecho, por favor, actualízalo.
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    // Necesitamos crear una respuesta aquí para poder establecer cookies
    const response = NextResponse.redirect(new URL(next, origin).toString()) // Redirección por defecto

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => request.cookies.get(name)?.value,
          set: (name: string, value: string, options: CookieOptions) => {
            response.cookies.set({ name, value, ...options }) // Establecer cookie en la respuesta
          },
          remove: (name: string, options: CookieOptions) => {
            response.cookies.set({ name, value: "", ...options }) // Eliminar cookie en la respuesta
          },
        },
      },
    )
    const {
      error,
      data: { session },
    } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session) {
      console.log(
        `Auth callback successful for user ${session.user.id}, redirecting to: ${new URL(next, origin).toString()}`,
      )
      // La URL de redirección ya está en 'response', y las cookies se establecieron.
      return response
    }
    console.error("Auth callback error exchanging code:", error?.message)
  } else {
    console.error("Auth callback: No code found in search params")
  }

  // Fallback redirect en caso de error o no code
  const errorRedirectPath = new URL("/auth/login?error=auth_callback_failed", origin).toString()
  console.log(`Auth callback failed or no code, redirecting to: ${errorRedirectPath}`)
  return NextResponse.redirect(errorRedirectPath)
}
