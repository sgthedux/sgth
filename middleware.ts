import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: "",
            ...options,
          })
        },
      },
    },
  )

  try {
    // Verificar si hay una sesión activa
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Si el usuario no está autenticado y trata de acceder a rutas protegidas
    if (!session) {
      if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/admin")) {
        const redirectUrl = new URL("/auth/login", request.url)
        return NextResponse.redirect(redirectUrl)
      }
      return response
    }

    // Si el usuario está autenticado y trata de acceder a la página de login
    if (request.nextUrl.pathname === "/auth/login" && session) {
      // Obtener el rol del usuario
      const userRole = session.user.user_metadata?.role || "user"

      // Redirigir según el rol
      const redirectUrl = new URL(userRole === "admin" ? "/admin/dashboard" : "/dashboard", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Verificar el rol para rutas de administrador
    if (request.nextUrl.pathname.startsWith("/admin")) {
      // Obtener el rol del usuario
      const userRole = session.user.user_metadata?.role || "user"

      if (userRole !== "admin") {
        console.log("Middleware - Redirigiendo usuario no admin desde ruta admin")
        const redirectUrl = new URL("/dashboard", request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // En caso de error, permitir el acceso a rutas públicas y redirigir desde rutas protegidas
    if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/admin")) {
      const redirectUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/:path*"],
}
