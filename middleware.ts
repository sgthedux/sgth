import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { CookieOptions } from "@supabase/ssr"

async function getUserRole(supabaseClient: any, userId: string): Promise<string> {
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser()
  if (userError) {
    console.error("Middleware/getUserRole: Error fetching user from session:", userError.message)
  }
  if (user && user.user_metadata?.role) {
    return user.user_metadata.role
  }
  console.warn(`Middleware/getUserRole: Role not in user_metadata for user ${userId}. Querying profiles table.`)
  try {
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()
    if (profileError) {
      console.error("Middleware/getUserRole: Error fetching role from profiles:", profileError.message)
      return "user"
    }
    if (profile?.role) {
      console.log("Middleware/getUserRole: Role from profiles table:", profile.role)
      return profile.role
    }
  } catch (e: any) {
    console.error("Middleware/getUserRole: Exception fetching role from profiles:", e.message)
  }
  console.log("Middleware/getUserRole: Role not found, defaulting to 'user'.")
  return "user"
}

export async function middleware(request: NextRequest) {
  const currentPath = request.nextUrl.pathname
  console.log(`Middleware: Processing request for ${currentPath}`)

  const response = NextResponse.next({
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
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options })
        },
      },
    },
  )

  try {
    // Usar getUser() en lugar de getSession() para autenticación más segura
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error(`Middleware: Error getting user for ${currentPath}:`, userError.message)
    }

    // Obtener la sesión solo si necesitamos información adicional
    const { data: { session } } = await supabase.auth.getSession()

    // --- 1. Rutas explícitamente públicas ---
    // Estas rutas son accesibles para todos, autenticados o no.
    // No hay redirección a login si no hay sesión para estas rutas.
    const alwaysPublicPaths = [
      "/", // La raíz es siempre pública
      "/consulta-licencias", // Ahora también es siempre pública
    ]

    if (alwaysPublicPaths.includes(currentPath)) {
      console.log(
        `Middleware: Accessing always public path '${currentPath}' for ${user ? "authenticated" : "unauthenticated"} user. Allowing.`,
      )
      return response // Permitir acceso directo
    }

    // --- 2. Rutas de Autenticación ---
    // Accesibles para no autenticados. Si está autenticado Y en login/forgot, redirigir.
    const authPaths = ["/auth/login", "/auth/forgot-password", "/auth/reset-password", "/auth/verify", "/auth/callback"]
    if (authPaths.some((path) => currentPath.startsWith(path))) {
      if (user && (currentPath.startsWith("/auth/login") || currentPath.startsWith("/auth/forgot-password"))) {
        const userRole = await getUserRole(supabase, user.id)
        let redirectPath = "/dashboard"
        if (userRole === "admin") redirectPath = "/admin/dashboard"
        else if (userRole === "rh") redirectPath = "/rh/dashboard"
        console.log(
          `Middleware: Authenticated user (role: ${userRole}) on auth path '${currentPath}', redirecting to ${redirectPath}`,
        )
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
      console.log(
        `Middleware: Accessing auth path ${currentPath} (${user ? "authenticated" : "unauthenticated"}). Allowing.`,
      )
      return response
    }

    // --- 3. Verificación de Usuario para Todas las Demás Rutas (Protegidas) ---
    // Si la ruta no es una de las 'alwaysPublicPaths' ni 'authPaths', requiere autenticación.
    if (!user) {
      console.log(`Middleware: No authenticated user for protected path ${currentPath}. Redirecting to /auth/login.`)
      const redirectUrl = new URL("/auth/login", request.url)
      redirectUrl.searchParams.set("redirectTo", currentPath)
      return NextResponse.redirect(redirectUrl)
    }

    // --- 4. Usuario Autenticado: Aplicar Lógica de Roles Específicos ---
    // A este punto, el usuario está autenticado y la ruta no es 'alwaysPublic' ni 'authPath'.
    const userRole = await getUserRole(supabase, user.id)
    console.log(`Middleware: Authenticated user (role: ${userRole}). Path: ${currentPath}.`)

    if (currentPath.startsWith("/admin")) {
      if (userRole !== "admin") {
        console.log(`Middleware: Role '${userRole}' trying to access /admin. Redirecting.`)
        const userDashboard = userRole === "rh" ? "/rh/dashboard" : "/dashboard"
        return NextResponse.redirect(new URL(userDashboard, request.url))
      }
      console.log(`Middleware: Admin access to ${currentPath} granted.`)
      return response
    }

    if (currentPath.startsWith("/rh")) {
      if (userRole !== "rh" && userRole !== "admin") {
        console.log(`Middleware: Role '${userRole}' trying to access /rh. Redirecting to /dashboard.`)
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      console.log(`Middleware: Role '${userRole}' access to ${currentPath} granted.`)
      return response
    }

    if (currentPath === "/dashboard") {
      if (userRole === "admin") {
        console.log("Middleware: Admin on /dashboard, redirecting to /admin/dashboard")
        return NextResponse.redirect(new URL("/admin/dashboard", request.url))
      }
      if (userRole === "rh") {
        console.log("Middleware: RH on /dashboard, redirecting to /rh/dashboard")
        return NextResponse.redirect(new URL("/rh/dashboard", request.url))
      }
      console.log("Middleware: User access to /dashboard granted.")
      return response
    }

    console.log(`Middleware: Accessing other authenticated route ${currentPath} with role '${userRole}'. Allowing.`)
    return response
  } catch (error: any) {
    console.error(`Middleware global error for ${currentPath}:`, error.message, error.stack)
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|templates).*)"],
}
