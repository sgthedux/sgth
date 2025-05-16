"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function AuthForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const [loadingState, setLoadingState] = useState<
    "idle" | "authenticating" | "verifying_role" | "redirecting" | "timeout"
  >("idle")
  const [loadingTimer, setLoadingTimer] = useState<NodeJS.Timeout | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoadingState("authenticating")
    setLoadingProgress(10)
    setError(null)

    // Configurar un temporizador para detectar si el proceso se queda atascado
    const timer = setTimeout(() => {
      setLoadingState("timeout")
      setError("La solicitud está tardando más de lo esperado. ¿Desea intentar nuevamente?")
      setLoading(false)
    }, 15000) // 15 segundos de tiempo máximo

    setLoadingTimer(timer)

    // Configurar un intervalo para actualizar el progreso visual
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return prev
        }
        return prev + 5
      })
    }, 500)

    try {
      // Autenticación básica
      setLoadingProgress(30)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      setLoadingProgress(60)
      setLoadingState("verifying_role")

      // Verificar el rol del usuario para redirigir correctamente
      const { data: userData } = await supabase.from("profiles").select("role").eq("id", data.session?.user.id).single()

      console.log("Auth form - User role:", userData?.role) // Para depuración

      setLoadingProgress(80)
      setLoadingState("redirecting")

      // Forzar actualización de la sesión en el cliente
      await supabase.auth.refreshSession()

      // Usar window.location para una redirección más forzada en lugar de router.push
      if (userData?.role === "admin") {
        window.location.href = "/admin/dashboard"
      } else {
        window.location.href = "/dashboard"
      }

      setLoadingProgress(100)
      // No llamamos a router.refresh() ya que estamos haciendo una redirección completa
    } catch (error: any) {
      console.error("Error during sign in:", error)
      setError(error.message || "Error al iniciar sesión")
    } finally {
      if (loadingTimer) {
        clearTimeout(loadingTimer)
      }
      clearInterval(progressInterval)
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!name.trim()) {
      setError("El nombre es requerido")
      setLoading(false)
      return
    }

    try {
      // Create the user with metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: "user", // Aseguramos que el rol esté en los metadatos
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // El perfil se creará automáticamente mediante el trigger en Supabase
      router.push("/auth/verify")
      router.refresh()
    } catch (error: any) {
      console.error("Error during signup:", error)
      setError(error.message || "Error al registrarse")
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    setLoadingState("idle")
    setLoadingProgress(0)
    handleSignIn({ preventDefault: () => {} } as React.FormEvent)
  }

  return (
    <Tabs defaultValue="login" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
        <TabsTrigger value="register">Registrarse</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignIn}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                  {loadingState === "timeout" && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={handleRetry}>
                      Intentar nuevamente
                    </Button>
                  )}
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    {loadingState === "timeout" ? (
                      "Reintentar"
                    ) : (
                      <>
                        <span className="animate-pulse">
                          {loadingState === "authenticating" && "Verificando credenciales..."}
                          {loadingState === "verifying_role" && "Verificando permisos..."}
                          {loadingState === "redirecting" && "Redirigiendo..."}
                        </span>
                        <span className="ml-2 text-xs">{loadingProgress}%</span>
                      </>
                    )}
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
              {loading && loadingState !== "timeout" && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 dark:bg-gray-700">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              )}
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="register">
        <Card>
          <CardHeader>
            <CardTitle>Crear Cuenta</CardTitle>
            <CardDescription>Regístrate para acceder al sistema de gestión de talento humano</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-register">Correo Electrónico</Label>
                <Input
                  id="email-register"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-register">Contraseña</Label>
                <Input
                  id="password-register"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Procesando..." : "Registrarse"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
