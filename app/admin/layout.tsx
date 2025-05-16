"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true
    let retryTimeout: NodeJS.Timeout | null = null

    async function loadUserProfile() {
      try {
        if (!isMounted) return

        setLoading(true)
        setError(null)

        // Verificar si hay una sesión activa
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Error al obtener la sesión:", sessionError)
          if (isMounted) {
            setError("Error al verificar la sesión. Por favor, inicie sesión nuevamente.")
            setLoading(false)

            // Redirigir después de un breve retraso para mostrar el error
            setTimeout(() => {
              if (isMounted) {
                router.push("/auth/login?error=session_error")
              }
            }, 2000)
          }
          return
        }

        if (!session) {
          console.log("Admin layout - No session found, redirecting to login")
          if (isMounted) {
            setError("No se encontró una sesión activa. Por favor, inicie sesión.")
            setLoading(false)

            // Redirigir después de un breve retraso para mostrar el error
            setTimeout(() => {
              if (isMounted) {
                router.push("/auth/login")
              }
            }, 2000)
          }
          return
        }

        // Verificar explícitamente el rol del usuario
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          console.error("Error al obtener el perfil:", profileError)

          // Si hay un error al obtener el perfil, intentar nuevamente después de un retraso
          if (isMounted && retryCount < 3) {
            setRetryCount((prev) => prev + 1)
            retryTimeout = setTimeout(() => {
              if (isMounted) {
                loadUserProfile()
              }
            }, 2000) // Reintentar después de 2 segundos
            return
          }

          if (isMounted) {
            setError("Error al cargar el perfil de usuario. Por favor, inicie sesión nuevamente.")
            setLoading(false)

            // Redirigir después de un breve retraso para mostrar el error
            setTimeout(() => {
              if (isMounted) {
                router.push("/auth/login?error=profile_error")
              }
            }, 2000)
          }
          return
        }

        if (!data || data.role !== "admin") {
          console.log("Admin layout - Non-admin user detected, redirecting")
          if (isMounted) {
            setError("No tiene permisos de administrador para acceder a esta sección.")
            setLoading(false)

            // Redirigir después de un breve retraso para mostrar el error
            setTimeout(() => {
              if (isMounted) {
                router.push("/dashboard")
              }
            }, 2000)
          }
          return
        }

        // Si todo está bien, establecer el perfil y finalizar la carga
        if (isMounted) {
          setProfile(data)
          setLoading(false)
          setError(null)
          setRetryCount(0)
        }
      } catch (error) {
        console.error("Error inesperado al cargar el perfil de administrador:", error)
        if (isMounted) {
          setError("Error inesperado. Por favor, inicie sesión nuevamente.")
          setLoading(false)

          // Redirigir después de un breve retraso para mostrar el error
          setTimeout(() => {
            if (isMounted) {
              router.push("/auth/login?error=unexpected_error")
            }
          }, 2000)
        }
      }
    }

    loadUserProfile()

    return () => {
      isMounted = false
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [router, supabase, retryCount])

  // Memoizar los enlaces de navegación para evitar re-renderizados
  const navigationLinks = useMemo(
    () => [
      { href: "/admin/users", label: "Usuarios" },
      { href: "/admin/reports", label: "Reportes" },
    ],
    [],
  )

  if (loading) {
    return <LoadingState message="Verificando permisos de administrador..." />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar isAdmin={true} />
      <div className="flex flex-col flex-1 md:ml-64">
        <Header
          user={{
            name: profile?.full_name || "",
            email: profile?.email || "",
            imageUrl: profile?.avatar_url,
          }}
          isAdmin={true}
        />
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <div className="bg-slate-700 text-white rounded-lg overflow-hidden shadow-md">
              <div className="p-6 relative">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">SGTH - Sistema de Gestión de Talento Humano</h1>
                <p className="text-slate-200">Panel de Administración Integral</p>
                <div className="absolute right-0 bottom-0 w-24 h-24 bg-orange-600 rounded-tl-full"></div>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-card rounded-lg border shadow-sm">
            <div className="flex overflow-x-auto py-3 px-4 gap-2">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                    pathname === link.href ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
                  }`}
                  prefetch={true}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  )
}

function LoadingState({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center p-8 rounded-lg border bg-card shadow-sm max-w-md w-full">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium text-center">{message}</p>
        <div className="w-full bg-muted h-2 rounded-full mt-6 overflow-hidden">
          <div className="bg-primary h-full animate-pulse" style={{ width: "100%" }}></div>
        </div>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Esto puede tomar unos momentos. Por favor, espere...
        </p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center p-8 rounded-lg border bg-card shadow-sm max-w-md w-full">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-center text-red-600">{message}</p>
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Será redirigido automáticamente en unos momentos...
        </p>
      </div>
    </div>
  )
}
