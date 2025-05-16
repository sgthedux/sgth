export const dynamic = "force-dynamic"

import type React from "react"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { FileText, Users, BarChart, Clock, CheckCircle, AlertCircle, Info } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Dashboard Administrativo | SGTH",
  description: "Dashboard administrativo del Sistema de Gestión de Talento Humano",
}

async function getAdminData() {
  try {
    // Usar el cliente de Supabase mejorado desde lib/supabase/server
    const supabase = await createClient()

    // Verificar la sesión con manejo de errores mejorado
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error al obtener la sesión:", sessionError)
      return {
        redirect: true,
        error: "session_error",
        message: sessionError.message,
      }
    }

    if (!sessionData.session) {
      console.log("No hay sesión activa")
      return {
        redirect: true,
        error: "no_session",
        message: "No hay sesión activa",
      }
    }

    const userId = sessionData.session.user.id

    // Verificar el rol del usuario con manejo de errores mejorado
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Error al obtener el perfil:", profileError)
      return {
        redirect: true,
        error: "profile_error",
        message: profileError.message,
      }
    }

    if (profileData?.role !== "admin") {
      console.log("Usuario no es administrador:", profileData?.role)
      return {
        redirect: true,
        error: "not_admin",
        message: "El usuario no tiene permisos de administrador",
      }
    }

    // Obtener estadísticas con manejo de errores mejorado
    const { count: usersCount, error: usersError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })

    if (usersError) {
      console.error("Error al obtener conteo de usuarios:", usersError)
    }

    const { count: documentsCount, error: documentsError } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })

    if (documentsError) {
      console.error("Error al obtener conteo de documentos:", documentsError)
    }

    // Obtener usuarios recientes con manejo de errores mejorado
    const { data: recentUsers, error: recentUsersError } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at, avatar_url")
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentUsersError) {
      console.error("Error al obtener usuarios recientes:", recentUsersError)
    }

    // Obtener documentos recientes con manejo de errores mejorado
    const { data: recentDocuments, error: recentDocumentsError } = await supabase
      .from("documents")
      .select("id, name, status, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(5)

    if (recentDocumentsError) {
      console.error("Error al obtener documentos recientes:", recentDocumentsError)
    }

    // Obtener nombres de usuarios para los documentos
    const userIds = recentDocuments?.map((doc) => doc.user_id) || []
    let userMap = {}

    if (userIds.length > 0) {
      const { data: users, error: usersMapError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)

      if (usersMapError) {
        console.error("Error al obtener mapa de usuarios:", usersMapError)
      }

      userMap = (users || []).reduce((acc, user) => {
        acc[user.id] = user
        return acc
      }, {})
    }

    return {
      redirect: false,
      profile: profileData,
      user: sessionData.session.user,
      stats: {
        usersCount: usersCount || 0,
        documentsCount: documentsCount || 0,
        pendingDocuments: recentDocuments?.filter((doc) => doc.status === "pending").length || 0,
        activeUsers: usersCount || 0, // Podríamos refinar esto con una consulta más específica
      },
      recentUsers: recentUsers || [],
      recentDocuments: recentDocuments || [],
      userMap,
    }
  } catch (error) {
    console.error("Error en getAdminData:", error)
    return {
      redirect: true,
      error: "server_error",
      message: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export default async function AdminDashboardPage() {
  const adminData = await getAdminData()

  // Manejar redirección si es necesario
  if (adminData.redirect) {
    console.log(`Redirigiendo: ${adminData.error} - ${adminData.message}`)
    redirect("/auth/login?error=" + adminData.error)
  }

  const { profile, user, stats, recentUsers, recentDocuments, userMap } = adminData

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h2>
          <p className="text-muted-foreground">
            Bienvenido, {profile?.full_name || user.email}. Aquí tienes un resumen del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/admin/reports">
              <BarChart className="mr-2 h-4 w-4" />
              Generar Reportes
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.usersCount}</div>
                <p className="text-xs text-muted-foreground">{stats.activeUsers} activos en total</p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Documentos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.documentsCount}</div>
                <p className="text-xs text-muted-foreground">{stats.pendingDocuments} pendientes de revisión</p>
              </CardContent>
            </Card>
            <Card className="card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Operativo</div>
                <p className="text-xs text-muted-foreground">Última actualización: {new Date().toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="card-hover">
              <CardHeader className="pb-3">
                <CardTitle>Usuarios Recientes</CardTitle>
                <CardDescription>Últimos usuarios registrados en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[320px] pr-4">
                  {recentUsers && recentUsers.length > 0 ? (
                    <div className="space-y-4">
                      {recentUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent/10 transition-colors"
                        >
                          <Avatar className="h-10 w-10 border">
                            <AvatarImage
                              src={user.avatar_url || `/placeholder.svg?height=40&width=40&query=user`}
                              alt={user.full_name || user.email}
                            />
                            <AvatarFallback>
                              {user.full_name
                                ? user.full_name.charAt(0).toUpperCase()
                                : user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-none truncate">
                              {user.full_name || "Usuario sin nombre"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Registrado: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                      <Info className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No hay usuarios registrados recientemente</p>
                    </div>
                  )}
                </ScrollArea>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/users">Ver todos los usuarios</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardHeader className="pb-3">
                <CardTitle>Documentos Recientes</CardTitle>
                <CardDescription>Últimos documentos subidos al sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[320px] pr-4">
                  {recentDocuments && recentDocuments.length > 0 ? (
                    <div className="space-y-4">
                      {recentDocuments.map((doc) => {
                        const docUser = userMap[doc.user_id] || { full_name: "Usuario desconocido", email: "" }
                        return (
                          <div
                            key={doc.id}
                            className="p-3 rounded-lg border bg-card hover:bg-accent/10 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{doc.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  Por: {docUser.full_name || docUser.email || doc.user_id}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                {doc.status === "approved" && (
                                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                                    <CheckCircle className="mr-1 h-3 w-3" /> Aprobado
                                  </span>
                                )}
                                {doc.status === "pending" && (
                                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800">
                                    <Clock className="mr-1 h-3 w-3" /> Pendiente
                                  </span>
                                )}
                                {doc.status === "rejected" && (
                                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800">
                                    <AlertCircle className="mr-1 h-3 w-3" /> Rechazado
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Subido el {new Date(doc.created_at).toLocaleDateString()} a las{" "}
                              {new Date(doc.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                      <Info className="h-10 w-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No hay documentos subidos recientemente</p>
                    </div>
                  )}
                </ScrollArea>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/documents">Ver todos los documentos</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>Administra los usuarios del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button asChild>
                  <Link href="/admin/users">Ver todos los usuarios</Link>
                </Button>
              </div>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">Usuario</th>
                      <th className="p-2 text-left font-medium">Email</th>
                      <th className="p-2 text-left font-medium">Fecha de registro</th>
                      <th className="p-2 text-left font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers && recentUsers.length > 0 ? (
                      recentUsers.map((user) => (
                        <tr key={user.id} className="border-b">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={user.avatar_url || "/placeholder.svg?height=32&width=32&query=person"}
                                  alt={user.full_name || user.email}
                                />
                                <AvatarFallback>
                                  {user.full_name
                                    ? user.full_name.charAt(0).toUpperCase()
                                    : user.email.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[150px]">{user.full_name || "Usuario sin nombre"}</span>
                            </div>
                          </td>
                          <td className="p-2 truncate max-w-[200px]">{user.email}</td>
                          <td className="p-2">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="p-2">
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" /> Activo
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                          No hay usuarios registrados recientemente
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Documentos</CardTitle>
              <CardDescription>Administra los documentos del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button asChild>
                  <Link href="/admin/documents">Ver todos los documentos</Link>
                </Button>
              </div>
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">Documento</th>
                      <th className="p-2 text-left font-medium">Usuario</th>
                      <th className="p-2 text-left font-medium">Fecha</th>
                      <th className="p-2 text-left font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentDocuments && recentDocuments.length > 0 ? (
                      recentDocuments.map((doc) => {
                        const docUser = userMap[doc.user_id] || { full_name: "Usuario desconocido", email: "" }
                        return (
                          <tr key={doc.id} className="border-b">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                <span className="truncate max-w-[200px]">{doc.name}</span>
                              </div>
                            </td>
                            <td className="p-2 truncate max-w-[200px]">
                              {docUser.full_name || docUser.email || doc.user_id}
                            </td>
                            <td className="p-2">{new Date(doc.created_at).toLocaleDateString()}</td>
                            <td className="p-2">
                              {doc.status === "approved" && (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                                  <CheckCircle className="mr-1 h-3 w-3" /> Aprobado
                                </span>
                              )}
                              {doc.status === "pending" && (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800">
                                  <Clock className="mr-1 h-3 w-3" /> Pendiente
                                </span>
                              )}
                              {doc.status === "rejected" && (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">
                                  <AlertCircle className="mr-1 h-3 w-3" /> Rechazado
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                          No hay documentos subidos recientemente
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Avatar({ className, ...props }: React.ComponentProps<"div"> & { className?: string }) {
  return <div className={cn("relative h-10 w-10 rounded-full overflow-hidden", className)} {...props} />
}

function AvatarImage({ className, ...props }: React.ComponentProps<typeof Image> & { className?: string }) {
  return <Image className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
}

function AvatarFallback({ className, ...props }: React.ComponentProps<"div"> & { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-primary text-primary-foreground",
        className,
      )}
      {...props}
    />
  )
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
