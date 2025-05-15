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

    // Verificar si la ruta actual es /auth/login y el usuario ya está autenticado
    if (request.nextUrl.pathname === "/auth/login" && session) {
      // Redirigir a los usuarios autenticados fuera de la página de login
      const redirectUrl = new URL("/dashboard", request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Obtener el rol del usuario directamente de la sesión o metadatos
    // Evitamos hacer una solicitud fetch a nuestra propia API
    let userRole = session.user.user_metadata?.role || null

    // Si no tenemos el rol en los metadatos, intentamos obtenerlo de la tabla profiles
    // pero solo si no estamos en una ruta que pueda causar recursión
    if (!userRole) {
      try {
        // Consulta directa a la tabla profiles usando el cliente de Supabase
        const { data, error } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle()

        if (!error && data) {
          userRole = data.role
          console.log("Middleware - User role from profiles:", userRole)
        } else if (error) {
          console.log("Error al obtener el rol del usuario:", error.message)
          // Si hay un error con la consulta, asumimos un rol por defecto
          userRole = "user"
        }
      } catch (roleError) {
        console.error("Error al consultar el rol:", roleError)
        userRole = "user"
      }
    }

    // Si aún no tenemos un rol, asumimos 'user' por defecto
    userRole = userRole || "user"
    console.log("Middleware - User ID:", session.user.id)
    console.log("Middleware - User role:", userRole)

    // Verificar el rol para rutas de administrador
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (userRole !== "admin") {
        console.log("Middleware - Redirecting non-admin from admin route")
        const redirectUrl = new URL("/dashboard", request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Verificar el rol para rutas de usuario
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      if (userRole === "admin") {
        console.log("Middleware - Redirecting admin to admin dashboard")
        const redirectUrl = new URL("/admin/dashboard", request.url)
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
