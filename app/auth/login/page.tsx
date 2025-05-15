"use client"

import { useState } from "react"
import { AuthForm } from "@/components/auth-form"
import { createClient } from "@/lib/supabase/client"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const error = searchParams.get("error")
  const supabase = createClient()

  // Mostrar error si viene en los parámetros de búsqueda
  if (error) {
    toast({
      title: "Error de autenticación",
      description: error,
      variant: "destructive",
    })
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Verificar el rol del usuario para redirigir correctamente
      if (data.user) {
        // Primero intentamos obtener el rol de los metadatos
        let role = data.user.user_metadata?.role

        // Si no está en los metadatos, lo obtenemos de la tabla profiles
        if (!role) {
          const { data: profileData } = await supabase.from("profiles").select("role").eq("id", data.user.id).single()

          role = profileData?.role

          // Actualizamos los metadatos del usuario con su rol
          if (role) {
            await supabase.auth.updateUser({
              data: { role },
            })
          }
        }

        // Redirigir según el rol
        if (role === "admin") {
          router.push("/admin/dashboard")
        } else {
          router.push("/dashboard")
        }
      }
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Ocurrió un error al intentar iniciar sesión.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto grid w-full max-w-[400px] gap-6">
        <div className="grid gap-2 text-center">
          <h1 className="text-3xl font-bold">Iniciar Sesión</h1>
          <p className="text-muted-foreground">Ingresa tus credenciales para acceder al sistema</p>
        </div>
        <AuthForm onSubmit={handleLogin} isLoading={isLoading} />
        <div className="text-center">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>
    </div>
  )
}
