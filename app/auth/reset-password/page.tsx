"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Primero verificar si ya hay una sesión activa
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error getting session:", sessionError)
        }

        if (sessionData.session) {
          setIsAuthenticated(true)
          return
        }

        // Verificar si hay un código de recuperación en la URL
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")

        if (code) {
          // Intercambiar el código por una sesión
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error("Error exchanging code for session:", error)
            setError("El enlace de recuperación no es válido o ha expirado. Por favor, solicita uno nuevo.")
          } else if (data.session) {
            setIsAuthenticated(true)
          }
        } else {
          // Verificar si hay tokens en el hash (formato alternativo)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get("access_token")
          const refreshToken = hashParams.get("refresh_token")

          if (accessToken && refreshToken) {
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (setSessionError) {
              console.error("Error setting session:", setSessionError)
              setError("El enlace de recuperación no es válido o ha expirado. Por favor, solicita uno nuevo.")
            } else {
              setIsAuthenticated(true)
            }
          } else {
            setError(
              "No se ha podido verificar tu identidad. Por favor, intenta nuevamente desde el enlace enviado a tu correo.",
            )
          }
        }
      } catch (error) {
        console.error("Error in checkSession:", error)
        setError("Error al verificar la sesión. Por favor, intenta nuevamente.")
      }
    }

    checkSession()
  }, [supabase.auth])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      setLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw error
      }

      setSuccess("Contraseña actualizada correctamente. Serás redirigido al inicio de sesión.")

      // Cerrar sesión y redirigir al login después de 2 segundos
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push("/auth/login")
      }, 2000)
    } catch (error: any) {
      console.error("Error al actualizar contraseña:", error)
      setError(error.message || "Error al actualizar la contraseña")
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto grid w-full max-w-[400px] gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <p className="text-center mt-4">Verificando tu identidad...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto grid w-full max-w-[400px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Restablecer Contraseña</CardTitle>
            <CardDescription>Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.</CardDescription>
          </CardHeader>
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={!isAuthenticated || loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={!isAuthenticated || loading}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={!isAuthenticated || loading}>
                {loading ? "Actualizando..." : "Restablecer Contraseña"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
