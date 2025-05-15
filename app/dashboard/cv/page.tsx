export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, AlertCircle } from "lucide-react"
import { CvPreview } from "@/components/cv-preview"
import { GeneratePdfButton } from "@/components/generate-pdf-button"
import { Suspense } from "react"

export default async function CVPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const userId = session.user.id

  // Get profile - sin usar .single()
  const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId)

  // Si no hay perfil, intentamos crear uno básico
  let profile = null
  if (!profileData || profileData.length === 0) {
    // Obtener datos del usuario
    const { data: userData } = await supabase.auth.getUser()

    if (userData?.user) {
      // Crear un perfil básico
      const { data: newProfile, error: insertError } = await supabase
        .from("profiles")
        .insert([
          {
            id: userId,
            full_name: userData.user.user_metadata?.full_name || userData.user.email?.split("@")[0] || "Usuario",
            email: userData.user.email || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()

      if (!insertError && newProfile && newProfile.length > 0) {
        profile = newProfile[0]
      }
    }
  } else {
    profile = profileData[0]
  }

  // Get personal info - sin usar .single()
  const { data: personalInfoData } = await supabase.from("personal_info").select("*").eq("user_id", userId)
  const personalInfo = personalInfoData && personalInfoData.length > 0 ? personalInfoData[0] : null

  // Get education
  const { data: education } = await supabase.from("education").select("*").eq("user_id", userId)

  // Get experience
  const { data: experience } = await supabase.from("experience").select("*").eq("user_id", userId)

  // Get languages
  const { data: languages } = await supabase.from("languages").select("*").eq("user_id", userId)

  return (
    <Suspense fallback={<div>Cargando hoja de vida...</div>}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hoja de Vida</h1>
          <p className="text-muted-foreground">Genera y descarga tu hoja de vida</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generar Hoja de Vida</CardTitle>
            <CardDescription>
              Genera tu hoja de vida en formato PDF con toda la información que has registrado en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <FileText className="h-24 w-24 text-primary" />
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <GeneratePdfButton userId={userId} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
            <CardDescription>Visualiza cómo se verá tu hoja de vida antes de generarla.</CardDescription>
          </CardHeader>
          <CardContent>
            {profile ? (
              <CvPreview
                profile={profile}
                personalInfo={personalInfo}
                education={education || []}
                experience={experience || []}
                languages={languages || []}
              />
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  No se pudo crear un perfil. Por favor, contacta al administrador.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Suspense>
  )
}
