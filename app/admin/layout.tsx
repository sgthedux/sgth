"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    async function loadUserProfile() {
      try {
        setLoading(true)
        // Usar getUser en lugar de getSession para mayor seguridad
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          console.error("Error loading user:", error)
          router.push("/auth/login")
          return
        }

        // Verificar explícitamente el rol del usuario
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (!data || data.role !== "admin") {
          console.log("Admin layout - Non-admin user detected, redirecting")
          router.push("/dashboard")
          return
        }

        if (isMounted) {
          setProfile(data)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error loading admin profile:", error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadUserProfile()

    return () => {
      isMounted = false
    }
  }, [router, supabase])

  // Memoizar los enlaces de navegación para evitar re-renderizados
  const navigationLinks = useMemo(
    () => [      
      { href: "/admin/users", label: "Usuarios" },      
      { href: "/admin/reports", label: "Reportes" },
    ],
    [],
  )

  if (loading) {
    return <LoadingState />
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

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  )
}
