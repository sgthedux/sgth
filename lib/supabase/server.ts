import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error("Supabase URL no está definida en las variables de entorno del servidor.")
    throw new Error("Supabase URL no está definida en las variables de entorno del servidor.")
  }
  if (!supabaseServiceRoleKey) {
    console.error("Supabase Service Role Key no está definida en las variables de entorno del servidor.")
    throw new Error("Supabase Service Role Key no está definida en las variables de entorno del servidor.")
  }

  return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Ignorar errores si se llama desde un Server Component sin middleware de refresco
          console.warn(`[Supabase Server Client] Error en cookie set (ignorado): ${name}`, error)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // Ignorar errores si se llama desde un Server Component sin middleware de refresco
          console.warn(`[Supabase Server Client] Error en cookie remove (ignorado): ${name}`, error)
        }
      },
    },
    auth: {
      persistSession: false, // Para API routes, no persistir sesión en cookies
    },
  })
}
