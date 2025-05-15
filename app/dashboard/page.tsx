export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, User, CheckCircle, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Dashboard | SGTH",
  description: "Dashboard de usuario del Sistema de Gestión de Talento Humano",
}

async function getDashboardData() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const userId = session.user.id

  // Obtener perfil del usuario
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  // Obtener documentos del usuario
  const { data: documents, error: documentsError } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Obtener experiencia laboral del usuario
  const { data: experiences, error: experiencesError } = await supabase
    .from("experience")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Obtener educación del usuario
  const { data: education, error: educationError } = await supabase
    .from("education")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Obtener idiomas del usuario
  const { data: languages, error: languagesError } = await supabase
    .from("languages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  // Crear un array de actividades recientes basado en datos reales
  type Activity = { id: string; action: string; date: string; type: string }
  const activities: Activity[] = []

  // Añadir documentos como actividades
  if (documents && documents.length > 0) {
    documents.slice(0, 3).forEach((doc) => {
      activities.push({
        id: `doc-${doc.id}`,
        action: `Documento subido: ${doc.name}`,
        date: doc.created_at,
        type: "document",
      })
    })
  }

  // Añadir experiencias como actividades
  if (experiences && experiences.length > 0) {
    experiences.slice(0, 2).forEach((exp) => {
      activities.push({
        id: `exp-${exp.id}`,
        action: `Experiencia añadida: ${exp.company}`,
        date: exp.created_at,
        type: "profile",
      })
    })
  }

  // Añadir educación como actividades
  if (education && education.length > 0) {
    education.slice(0, 2).forEach((edu) => {
      activities.push({
        id: `edu-${edu.id}`,
        action: `Educación añadida: ${edu.institution}`,
        date: edu.created_at,
        type: "profile",
      })
    })
  }

  // Ordenar actividades por fecha (más recientes primero)
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calcular si la hoja de vida está disponible
  const cvAvailable =
    (experiences && experiences.length > 0) || (education && education.length > 0) || (profile && profile.full_name)

  // Encontrar la fecha de la última actualización del perfil
  let lastProfileUpdate = profile?.updated_at || profile?.created_at

  // Comprobar si hay actualizaciones más recientes en experiencias o educación
  if (experiences && experiences.length > 0) {
    const latestExpUpdate = experiences[0].updated_at || experiences[0].created_at
    if (new Date(latestExpUpdate) > new Date(lastProfileUpdate || 0)) {
      lastProfileUpdate = latestExpUpdate
    }
  }

  if (education && education.length > 0) {
    const latestEduUpdate = education[0].updated_at || education[0].created_at
    if (new Date(latestEduUpdate) > new Date(lastProfileUpdate || 0)) {
      lastProfileUpdate = latestEduUpdate
    }
  }

  return {
    profile,
    user: session.user,
    documents: documents || [],
    activities: activities.slice(0, 5),
    cvAvailable,
    lastProfileUpdate,
    totalDocuments: documents?.length || 0,
  }
}

export default async function DashboardPage() {
  const { profile, user, documents, activities, cvAvailable, lastProfileUpdate, totalDocuments } =
    await getDashboardData()

  return (
    <Suspense fallback={<div>Cargando dashboard...</div>}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 animate-fade-in">
        <div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Bienvenido, {profile?.full_name || user.email}. Aquí tienes un resumen de tu información.
            </p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documentos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalDocuments}</div>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hoja de Vida</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cvAvailable ? "Disponible" : "Incompleta"}</div>
                  {lastProfileUpdate && (
                    <p className="text-xs text-muted-foreground">
                      Última actualización: hace {formatDistanceToNow(new Date(lastProfileUpdate), { locale: es })}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Estado</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Activo</div>
                  <p className="text-xs text-muted-foreground">
                    Desde: {new Date(user.created_at).toLocaleDateString("es-ES")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Historial de tus actividades recientes</CardDescription>
              </CardHeader>
              <CardContent>
                {activities.length > 0 ? (
                  <div className="space-y-4">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-2 border-b last:border-0">
                        <div className="rounded-full p-2 bg-muted">
                          {activity.type === "profile" && <User className="h-4 w-4 text-primary" />}
                          {activity.type === "document" && <FileText className="h-4 w-4 text-primary" />}
                          {activity.type === "login" && <CheckCircle className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.date), { addSuffix: true, locale: es })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay actividades recientes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Suspense>
  )
}
