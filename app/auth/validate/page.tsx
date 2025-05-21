"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function ValidatePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function validateUserRole() {
      try {
        setLoading(true)
        const supabase = createClient()

        // 1. Verificar si el usuario está autenticado
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error("Error al obtener usuario:", userError)
          router.push("/auth/login")
          return
        }

        // 2. Intentar obtener el rol desde los metadatos del usuario
        let userRole = user.user_metadata?.role

        // 3. Si no está en los metadatos, obtenerlo de la API
        if (!userRole) {
          try {
            const response = await fetch("/api/get-user-role-secure", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            })

            if (!response.ok) {
              throw new Error("Error al obtener el rol del usuario")
            }

            const data = await response.json()
            userRole = data.role

            // Actualizar los metadatos del usuario con el rol obtenido
            await supabase.auth.updateUser({
              data: { role: userRole },
            })
          } catch (apiError) {
            console.error("Error al obtener rol:", apiError)
            setError("No se pudo verificar tu rol. Por favor, intenta nuevamente.")
            setLoading(false)
            return
          }
        }

        // 4. Establecer una cookie de validación
        document.cookie = "role_validated=true; path=/; max-age=3600; SameSite=Strict"

        // 5. Redirigir al usuario según su rol
        if (userRole === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error en la validación:", error)
        setError("Ocurrió un error durante la validación. Por favor, intenta nuevamente.")
        setLoading(false)
      }
    }

    validateUserRole()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Validando acceso</h1>
          <p className="text-sm text-muted-foreground">Estamos verificando tu rol para dirigirte al área correcta</p>
        </div>

        <div className="flex justify-center">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : error ? (
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button onClick={() => window.location.reload()} className="bg-primary text-white px-4 py-2 rounded-md">
                Intentar nuevamente
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
