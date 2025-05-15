import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PersonalInfoForm } from "@/components/profile/personal-info-form"
import { EducationForm } from "@/components/profile/education-form"
import { ExperienceForm } from "@/components/profile/experience-form"
import { LanguageForm } from "@/components/profile/language-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function EditUserPage({
  params,
  searchParams,
}: { params: { id: string }; searchParams: { tab?: string } }) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  // Verificar si el usuario actual es administrador
  const { data: currentUserProfile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

  if (currentUserProfile?.role !== "admin") {
    redirect("/dashboard")
  }

  const userId = params.id
  const activeTab = searchParams?.tab || "personal"

  // Get profile completion status
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (!profile) {
    redirect("/admin/users?error=Usuario no encontrado")
  }

  // Get personal info
  const { data: personalInfo } = await supabase.from("personal_info").select("*").eq("user_id", userId).maybeSingle()

  // Get education
  const { data: education } = await supabase
    .from("education")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false })

  // Get experience
  const { data: experience } = await supabase
    .from("experience")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false })

  // Get languages
  const { data: languages } = await supabase.from("languages").select("*").eq("user_id", userId)

  // Calculate profile completion percentage
  const completedSections = [
    profile?.personal_info_completed,
    profile?.education_completed,
    profile?.experience_completed,
    profile?.languages_completed,
  ].filter(Boolean).length

  const totalSections = 4
  const completionPercentage = Math.round((completedSections / totalSections) * 100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/admin/users"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a usuarios
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Editar Usuario: {profile.full_name || profile.email}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Perfil completado: {completionPercentage}%</div>
          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${completionPercentage}%` }}></div>
          </div>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="personal" asChild>
            <Link href={`/admin/users/${userId}/edit?tab=personal`}>Datos Personales</Link>
          </TabsTrigger>
          <TabsTrigger value="education" asChild>
            <Link href={`/admin/users/${userId}/edit?tab=education`}>Educación</Link>
          </TabsTrigger>
          <TabsTrigger value="experience" asChild>
            <Link href={`/admin/users/${userId}/edit?tab=experience`}>Experiencia</Link>
          </TabsTrigger>
          <TabsTrigger value="languages" asChild>
            <Link href={`/admin/users/${userId}/edit?tab=languages`}>Idiomas</Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalInfoForm userId={userId} initialData={personalInfo || undefined} />
        </TabsContent>
        <TabsContent value="education">
          <EducationForm userId={userId} educations={education || []} />
        </TabsContent>
        <TabsContent value="experience">
          <ExperienceForm userId={userId} experiences={experience || []} />
        </TabsContent>
        <TabsContent value="languages">
          <LanguageForm userId={userId} languages={languages || []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
