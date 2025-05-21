import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, AlertCircle } from "lucide-react"
import { CvPreview } from "@/components/cv-preview"
import { GeneratePdfButton } from "@/components/generate-pdf-button"

export default async function CVPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const userId = session.user.id

  // Usar el cliente admin para obtener datos sin restricciones de RLS
  const supabaseAdmin = createAdminClient()

  // Get profile
  const { data: profileData, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (profileError) {
    console.error("Error al obtener perfil:", profileError)
  }

  // Si no hay perfil, intentamos crear uno básico
  let profile = profileData
  if (!profile) {
    // Obtener datos del usuario
    const { data: userData } = await supabase.auth.getUser()

    if (userData?.user) {
      try {
        // Crear un perfil básico usando el cliente normal primero
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
          .maybeSingle()

        if (insertError) {
          console.error("Error al crear perfil con cliente normal:", insertError)

          // Si falla, intentar con el cliente admin
          const { data: adminNewProfile, error: adminInsertError } = await supabaseAdmin
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
            .maybeSingle()

          if (adminInsertError) {
            console.error("Error al crear perfil con cliente admin:", adminInsertError)
          } else if (adminNewProfile) {
            profile = adminNewProfile
            console.log("Perfil creado exitosamente con cliente admin")
          }
        } else if (newProfile) {
          profile = newProfile
          console.log("Perfil creado exitosamente con cliente normal")
        }
      } catch (error) {
        console.error("Error inesperado al crear perfil:", error)
      }
    }
  }

  // Si aún no tenemos perfil, usar un perfil mínimo para la vista previa
  if (!profile && session.user) {
    profile = {
      id: userId,
      full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "Usuario",
      email: session.user.email || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    console.log("Usando perfil mínimo para vista previa")
  }

  // Get personal info
  const { data: personalInfo, error: personalInfoError } = await supabaseAdmin
    .from("personal_info")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (personalInfoError) {
    console.error("Error al obtener información personal:", personalInfoError)
  }

  // Get education
  const { data: education, error: educationError } = await supabaseAdmin
    .from("education")
    .select("*")
    .eq("user_id", userId)

  if (educationError) {
    console.error("Error al obtener educación:", educationError)
  }

  // Get experience
  const { data: experience, error: experienceError } = await supabaseAdmin
    .from("experience")
    .select("*")
    .eq("user_id", userId)

  if (experienceError) {
    console.error("Error al obtener experiencia:", experienceError)
  }

  // Get languages
  const { data: languages, error: languagesError } = await supabaseAdmin
    .from("languages")
    .select("*")
    .eq("user_id", userId)

  if (languagesError) {
    console.error("Error al obtener idiomas:", languagesError)
  }

  // Log de datos para depuración
  console.log("Datos cargados para la vista previa:", {
    profile: profile ? "Encontrado" : "No encontrado",
    personalInfo: personalInfo ? "Encontrado" : "No encontrado",
    education: education?.length || 0,
    experience: experience?.length || 0,
    languages: languages?.length || 0,
  })

  return (
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
              personalInfo={personalInfo || null}
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
  )
}
