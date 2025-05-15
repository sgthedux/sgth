import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: async (name) => (await cookieStore.get(name))?.value,
        set: async (name, value, options) => {
          await cookieStore.set({ name, value, ...options })
        },
        remove: async (name, options) => {
          await cookieStore.set({ name, value: "", ...options })
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  )
}

// Función para crear un cliente con la clave de servicio
export async function createServiceClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: async (name) => (await cookieStore.get(name))?.value,
        set: async (name, value, options) => {
          await cookieStore.set({ name, value, ...options })
        },
        remove: async (name, options) => {
          await cookieStore.set({ name, value: "", ...options })
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
