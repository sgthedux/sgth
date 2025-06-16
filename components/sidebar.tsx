"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  User,
  FileText,
  Users,
  Briefcase,
  GraduationCap,
  Languages,
  ChevronRight,
  BarChart,
  LogOut,
  Menu,
  X,
  FolderOpen,
  ClipboardCheck,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect, useCallback, memo } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface SidebarProps {
  isAdmin?: boolean
  isRH?: boolean
}

export function Sidebar({ isAdmin = false, isRH = false }: SidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Verificar el rol del usuario al cargar el componente
  useEffect(() => {
    let isMounted = true

    async function checkUserRole() {
      if (loading) return

      try {
        setLoading(true)
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session || !isMounted) return

        // Usar el cliente seguro para obtener el rol
        const { secureDB } = await import("@/lib/supabase/secure-client")
        const profileData = await secureDB.getProfile(session.user.id)

        if (!isMounted) return

        setUserRole(profileData?.role || "user")

        // Redirigir si el rol no coincide con la sección
        if (profileData?.role === "admin" && !isAdmin && !isRH) {
          router.push("/admin/dashboard")
        } else if (profileData?.role === "rh" && !isRH && !isAdmin) {
          router.push("/rh/dashboard")
        } else if (profileData?.role === "user" && (isAdmin || isRH)) {
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Error checking user role:", error)
        // En caso de error, asumir usuario regular
        setUserRole("user")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkUserRole()

    return () => {
      isMounted = false
    }
  }, [isAdmin, isRH, router, supabase, loading])

  // Cerrar el sidebar en pantallas pequeñas cuando cambia la ruta
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const handleSignOut = useCallback(async () => {
    try {
      setIsSigningOut(true)
      console.log("Iniciando cierre de sesión...")

      // Primero verificar si hay una sesión activa
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        console.log("No hay sesión activa, redirigiendo directamente...")
        // Si no hay sesión, simplemente redirigir
        window.location.href = `/auth/login?t=${Date.now()}`
        return
      }

      // Limpiar cookies manualmente
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      // Intentar cerrar sesión con manejo de errores
      try {
        await supabase.auth.signOut({ scope: "local" })
        console.log("Sesión cerrada localmente")
      } catch (signOutError) {
        console.warn("Error al cerrar sesión localmente:", signOutError)
        // Continuar con la redirección incluso si hay error
      }

      // Limpiar localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem("supabase.auth.token")
        localStorage.removeItem("supabase.auth.expires_at")
      }

      // Pequeña pausa para asegurar que todo se limpie
      await new Promise((resolve) => setTimeout(resolve, 100))

      console.log("Sesión cerrada correctamente, redirigiendo...")

      // Forzar la redirección con recarga completa
      window.location.href = `/auth/login?t=${Date.now()}`
    } catch (error) {
      console.error("Error inesperado al cerrar sesión:", error)

      // Incluso si hay error, intentar redirigir
      try {
        window.location.href = `/auth/login?t=${Date.now()}&error=true`
      } catch (redirectError) {
        console.error("Error al redirigir:", redirectError)
        setIsSigningOut(false)
      }
    }
  }, [supabase])

  const toggleGroup = useCallback((title: string) => {
    setActiveGroup((prevActiveGroup) => (prevActiveGroup === title ? null : title))
  }, [])

  const userRoutes = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Perfil",
      href: "/dashboard/profile",
      icon: <User className="h-5 w-5" />,
      children: [
        {
          title: "Información Personal",
          href: "/dashboard/profile?tab=personal",
          icon: <User className="h-4 w-4" />,
        },
        {
          title: "Formación Académica",
          href: "/dashboard/profile?tab=education",
          icon: <GraduationCap className="h-4 w-4" />,
        },
        {
          title: "Experiencia Laboral",
          href: "/dashboard/profile?tab=experience",
          icon: <Briefcase className="h-4 w-4" />,
        },
        {
          title: "Idiomas",
          href: "/dashboard/profile?tab=languages",
          icon: <Languages className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Hoja de Vida",
      href: "/dashboard/cv",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Documentos",
      href: "/dashboard/documents",
      icon: <FolderOpen className="h-5 w-5" />,
    },
  ]

  const adminRoutes = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Usuarios",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Documentos",
      href: "/admin/documents",
      icon: <FolderOpen className="h-5 w-5" />,
    },
    {
      title: "Reportes",
      href: "/admin/reports",
      icon: <BarChart className="h-5 w-5" />,
    },
  ]

  const rhRoutes = [
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

  const routes = isRH ? rhRoutes : isAdmin ? adminRoutes : userRoutes
  const basePath = isRH ? "/rh/dashboard" : isAdmin ? "/admin/dashboard" : "/dashboard"

  return (
    <>
      {/* Botón de menú móvil */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden fixed left-4 top-4 z-40 rounded-full shadow-md">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <MobileSidebar
            isAdmin={isAdmin}
            isRH={isRH}
            onSignOut={handleSignOut}
            routes={routes}
            activeGroup={activeGroup}
            toggleGroup={toggleGroup}
            isSigningOut={isSigningOut}
            basePath={basePath}
          />
        </SheetContent>
      </Sheet>

      {/* Sidebar de escritorio */}
      <div className="hidden md:flex h-screen w-64 flex-col fixed inset-y-0 z-50">
        <div className="flex flex-col h-full bg-card border-r shadow-sm">
          <div className="h-16 flex items-center px-6 border-b">
            <Link href={basePath} className="flex items-center gap-2">
              <div className="flex items-center">
                <Image
                  src="/images/logo.png"
                  alt="Utedé Logo"
                  width={120}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
          <ScrollArea className="flex-1 py-4">
            <nav className="grid gap-1 px-2">
              {routes.map((route, i) => (
                <div key={i} className="space-y-1">
                  {route.children ? (
                    <>
                      <button
                        onClick={() => toggleGroup(route.title)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                          pathname.includes(route.href) ? "bg-accent text-primary" : "text-muted-foreground",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {route.icon}
                          {route.title}
                        </div>
                        <ChevronRight
                          className={cn("h-4 w-4 transition-transform", activeGroup === route.title && "rotate-90")}
                        />
                      </button>
                      {activeGroup === route.title && (
                        <div className="ml-4 pl-2 border-l border-border">
                          {route.children.map((child, j) => (
                            <Link
                              key={j}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                                pathname === child.href ||
                                  (pathname.includes(child.href.split("?")[0]) &&
                                    child.href.includes(pathname.split("?")[0]))
                                  ? "bg-accent text-primary"
                                  : "text-muted-foreground",
                              )}
                              prefetch={true}
                            >
                              {child.icon}
                              {child.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={route.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                        pathname === route.href ? "bg-accent text-primary" : "text-muted-foreground",
                      )}
                      prefetch={true}
                    >
                      {route.icon}
                      {route.title}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </ScrollArea>
          <div className="mt-auto p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <>
                  <span className="h-4 w-4 animate-spin">◌</span>
                  Cerrando sesión...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

const MobileSidebar = memo(function MobileSidebar({
  isAdmin = false,
  isRH = false,
  onSignOut,
  routes,
  activeGroup,
  toggleGroup,
  isSigningOut = false,
  basePath,
}: {
  isAdmin?: boolean
  isRH?: boolean
  onSignOut: () => void
  routes: any[]
  activeGroup: string | null
  toggleGroup: (title: string) => void
  isSigningOut?: boolean
  basePath: string
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="h-16 flex items-center justify-between px-6 border-b">
        <Link href={basePath} className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="Utedé Logo" width={120} height={40} className="object-contain" priority />
        </Link>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar menú</span>
          </Button>
        </SheetTrigger>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid gap-1 px-2">
          {routes.map((route, i) => (
            <div key={i} className="space-y-1">
              {route.children ? (
                <>
                  <button
                    onClick={() => toggleGroup(route.title)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                      pathname.includes(route.href) ? "bg-accent text-primary" : "text-muted-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {route.icon}
                      {route.title}
                    </div>
                    <ChevronRight
                      className={cn("h-4 w-4 transition-transform", activeGroup === route.title && "rotate-90")}
                    />
                  </button>
                  {activeGroup === route.title && (
                    <div className="ml-4 pl-2 border-l border-border">
                      {route.children.map((child, j) => (
                        <Link
                          key={j}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                            pathname === child.href ||
                              (pathname.includes(child.href.split("?")[0]) &&
                                child.href.includes(pathname.split("?")[0]))
                              ? "bg-accent text-primary"
                              : "text-muted-foreground",
                          )}
                          prefetch={true}
                        >
                          {child.icon}
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                    pathname === route.href ? "bg-accent text-primary" : "text-muted-foreground",
                  )}
                  prefetch={true}
                >
                  {route.icon}
                  {route.title}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
      <div className="mt-auto p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={onSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <>
              <span className="h-4 w-4 animate-spin">◌</span>
              Cerrando sesión...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </>
          )}
        </Button>
      </div>
    </div>
  )
})
