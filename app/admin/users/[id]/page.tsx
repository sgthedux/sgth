import { createClientComponentClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { ArrowLeft, FileText, Pencil, Settings, Trash2, User, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function UserDetailPage({ params }: { params: { id: string } }) {
  try {
    // Crear cliente de Supabase directamente
    const supabase = createClientComponentClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })

    // Verificar sesión
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Error al obtener la sesión:", sessionError)
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error de autenticación</h1>
          <p className="text-muted-foreground mb-4">No se pudo verificar tu sesión</p>
          <Button asChild>
            <Link href="/auth/login">Volver al inicio de sesión</Link>
          </Button>
        </div>
      )
    }

    if (!session) {
      redirect("/auth/login")
    }

    // Verificar si el usuario es admin
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("Error al obtener el perfil:", profileError)
    }

    if (profile?.role !== "admin") {
      redirect("/dashboard")
    }

    // Obtener datos del usuario
    const { data: user, error: userError } = await supabase.from("profiles").select("*").eq("id", params.id).single()

    if (userError) {
      console.error("Error al obtener usuario:", userError)
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Usuario no encontrado</h1>
          <p className="text-muted-foreground mb-4">No se pudo encontrar el usuario solicitado</p>
          <Button asChild>
            <Link href="/admin/users">Volver a la lista de usuarios</Link>
          </Button>
        </div>
      )
    }

    // Obtener documentos del usuario
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", params.id)
      .order("created_at", { ascending: false })

    if (documentsError) {
      console.error("Error al obtener documentos:", documentsError)
    }

    // Obtener experiencia del usuario
    const { data: experience, error: experienceError } = await supabase
      .from("experience")
      .select("*")
      .eq("user_id", params.id)
      .order("start_date", { ascending: false })

    if (experienceError) {
      console.error("Error al obtener experiencia:", experienceError)
    }

    // Obtener educación del usuario
    const { data: education, error: educationError } = await supabase
      .from("education")
      .select("*")
      .eq("user_id", params.id)
      .order("start_date", { ascending: false })

    if (educationError) {
      console.error("Error al obtener educación:", educationError)
    }

    const getStatusBadge = (status: string) => {
      switch (status) {
        case "Aprobado":
        case "Aceptado":
          return <Badge className="bg-green-500 text-white">Aceptado</Badge>
        case "Rechazado":
        case "Denegado":
          return <Badge variant="destructive">Denegado</Badge>
        default:
          return (
            <Badge variant="outline" className="bg-gray-100">
              Pendiente
            </Badge>
          )
      }
    }

    const getInitials = (name: string) => {
      if (!name) return "U"
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/users">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Perfil de Usuario</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border-green-200"
            >
              <FileText className="mr-2 h-4 w-4" />
              Ver Hoja de Vida
            </Button>
            <Button
              variant="outline"
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar Usuario
            </Button>
            <Button
              variant="outline"
              className="bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 border-amber-200"
            >
              <Settings className="mr-2 h-4 w-4" />
              Cambiar Estado
            </Button>
            <Button
              variant="outline"
              className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>Datos básicos del usuario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center mb-6">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || "Usuario"} />
                  <AvatarFallback className="text-2xl bg-primary/10">
                    {getInitials(user.full_name || "")}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold text-center">{user.full_name}</h3>
                <p className="text-muted-foreground text-center">{user.email}</p>
                <div className="mt-2">{getStatusBadge(user.status || "Pendiente")}</div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Tipo de Documento</p>
                  <p className="text-sm text-muted-foreground">{user.document_type || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Número de Documento</p>
                  <p className="text-sm text-muted-foreground">{user.document_number || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Teléfono</p>
                  <p className="text-sm text-muted-foreground">{user.phone || "No especificado"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Rol</p>
                  <p className="text-sm text-muted-foreground capitalize">{user.role || "user"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Fecha de Registro</p>
                  <p className="text-sm text-muted-foreground">{formatDate(new Date(user.created_at))}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Última Actualización</p>
                  <p className="text-sm text-muted-foreground">{formatDate(new Date(user.updated_at))}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <Tabs defaultValue="documents">
                <TabsList>
                  <TabsTrigger value="documents">Documentos</TabsTrigger>
                  <TabsTrigger value="experience">Experiencia</TabsTrigger>
                  <TabsTrigger value="education">Educación</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <TabsContent value="documents" className="mt-0">
                {documents && documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-primary/70" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Subido el {formatDate(new Date(doc.created_at))}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No hay documentos registrados</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="experience" className="mt-0">
                {experience && experience.length > 0 ? (
                  <div className="space-y-4">
                    {experience.map((exp) => (
                      <div key={exp.id} className="border-b pb-3">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{exp.company}</h4>
                          <Badge variant="outline">{exp.is_current ? "Actual" : "Finalizado"}</Badge>
                        </div>
                        <p className="text-sm">{exp.position}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(new Date(exp.start_date))} -{" "}
                          {exp.is_current ? "Presente" : formatDate(new Date(exp.end_date))}
                        </p>
                        {exp.description && <p className="text-sm mt-2">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No hay experiencia registrada</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="education" className="mt-0">
                {education && education.length > 0 ? (
                  <div className="space-y-4">
                    {education.map((edu) => (
                      <div key={edu.id} className="border-b pb-3">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{edu.institution}</h4>
                          <Badge variant="outline">{edu.level}</Badge>
                        </div>
                        <p className="text-sm">{edu.degree}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(new Date(edu.start_date))} - {formatDate(new Date(edu.end_date))}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">No hay educación registrada</p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error en UserDetailPage:", error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Error inesperado</h1>
        <p className="text-muted-foreground mb-4">Ocurrió un error al cargar la página</p>
        <Button asChild>
          <Link href="/admin/users">Volver a la lista de usuarios</Link>
        </Button>
      </div>
    )
  }
}
