import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PersonalInfoForm } from "@/components/profile/personal-info-form"
import { EducationForm } from "@/components/profile/education-form"
import { ExperienceForm } from "@/components/profile/experience-form"
import { LanguageForm } from "@/components/profile/language-form"

export default async function ProfilePage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login")
  }

  const userId = session.user.id
  const activeTab = searchParams?.tab || "personal"

  // Intentar obtener datos del servidor con manejo de errores RLS
  let profile = null
  let personalInfo = null
  let education = []
  let experience = []
  let languages = []

  try {
    // Get profile completion status
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Error al cargar perfil:", profileError)
    } else {
      profile = profileData
    }

    // Get personal info
    const { data: personalData, error: personalError } = await supabase
      .from("personal_info")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle()

    if (personalError) {
      console.error("Error al cargar información personal:", personalError)
    } else {
      personalInfo = personalData
    }

    // Get education
    const { data: educationData, error: educationError } = await supabase
      .from("education")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false })

    if (educationError) {
      console.error("Error al cargar educación:", educationError)
    } else {
      education = educationData || []
    }

    // Get experience
    const { data: experienceData, error: experienceError } = await supabase
      .from("experience")
      .select("*")
      .eq("user_id", userId)
      .order("start_date", { ascending: false })

    if (experienceError) {
      console.error("Error al cargar experiencia:", experienceError)
    } else {
      experience = experienceData || []
    }

    // Get languages
    const { data: languagesData, error: languagesError } = await supabase
      .from("languages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (languagesError) {
      console.error("Error al cargar idiomas:", languagesError)
    } else {
      languages = languagesData || []
    }
  } catch (error) {
    console.error("Error general al cargar datos:", error)
  }

  // Calculate profile completion percentage
  const completedSections = [
    profile?.personal_info_completed,
    profile?.education_completed,
    profile?.experience_completed,
    profile?.languages_completed,
  ].filter(Boolean).length

  const totalSections = 4
  const completionPercentage = Math.round((completedSections / totalSections) * 100)

  // Log para depuración
  console.log("Datos cargados:", {
    profile: !!profile,
    personalInfo: !!personalInfo,
    education: education.length,
    experience: experience.length,
    languages: languages.length,
  })

  return (
    <div className="space-y-6">
      {/* Mostrar progreso de completitud */}
      {profile && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Progreso del Perfil</h3>
          <div className="w-full bg-blue-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-700 mt-2">{completionPercentage}% completado</p>
        </div>
      )}

      {activeTab === "personal" && <PersonalInfoForm userId={userId} initialData={personalInfo || undefined} />}
      {activeTab === "education" && <EducationForm userId={userId} educations={education || []} />}
      {activeTab === "experience" && <ExperienceForm userId={userId} experiences={experience || []} />}
      {activeTab === "languages" && <LanguageForm userId={userId} languages={languages || []} />}
    </div>
  )
}
