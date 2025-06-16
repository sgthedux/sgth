"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import type { User } from "@supabase/supabase-js"
import { BarChart, LayoutDashboard, ClipboardCheck, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProfileData {
  role?: string
  full_name?: string
  email?: string
  avatar_url?: string
}

interface ExtendedUser extends User, ProfileData {}

// Define las rutas donde el Sidebar NO debe mostrarse
const PAGES_WITHOUT_SIDEBAR = ["/rh/dashboard", "/rh/licenses"]

export default function RHLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Determina si el Sidebar debe ocultarse en la página actual
  const shouldHideSidebar = PAGES_WITHOUT_SIDEBAR.includes(pathname)

  useEffect(() => {
    const checkUser = async () => {
      setLoading(true)
      try {
        const {
          data: { session },
          error: sessionAuthError,
        } = await supabase.auth.getSession()

        if (sessionAuthError || !session) {
          router.push("/auth/login")
          setLoading(false)
          return
        }

        const sessionUserRole = session.user.user_metadata?.role

        if (sessionUserRole !== "rh") {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, full_name, email, avatar_url")
            .eq("id", session.user.id)
            .single()

          if (profileError || !profile || profile.role !== "rh") {
            router.push("/dashboard")
            setLoading(false)
            return
          }
          setUser({ ...session.user, ...profile } as ExtendedUser)
        } else {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, email, avatar_url")
            .eq("id", session.user.id)
            .single()

          setUser({ ...session.user, ...(profileData || {}), role: sessionUserRole } as ExtendedUser)
        }
      } catch (error) {
        console.error("Error checking user in RHLayout:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }
    checkUser()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="ml-4 text-muted-foreground">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const rhNavItems = [
    {
      title: "Dashboard",
      href: "/rh/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Solicitudes de Licencias",
      href: "/rh/licenses",
      icon: <ClipboardCheck className="h-5 w-5" />,
    },
    {
      title: "Gestión de Personal",
      href: "/rh/staff",
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      title: "Reportes",
      href: "/rh/reports",
      icon: <BarChart className="h-5 w-5" />,
    },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      {!shouldHideSidebar && <Sidebar isRH={true} />}{" "}
      {/* Renderizar Sidebar solo si NO está en PAGES_WITHOUT_SIDEBAR */}
      <div
        className={cn(
          "flex flex-col flex-1",
          !shouldHideSidebar && "md:ml-64", // Aplicar margen solo si el Sidebar está visible
        )}
      >
        <Header
          user={{
            name: user.full_name || user.email || "Usuario RH",
            email: user.email || "No disponible",
            imageUrl: user.avatar_url,
          }}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
