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

  // Get profile completion status
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

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

  // Log para depuración
  console.log("Personal Info Data:", personalInfo)

  return (
    <div className="space-y-6">
      {activeTab === "personal" && <PersonalInfoForm userId={userId} initialData={personalInfo || undefined} />}
      {activeTab === "education" && <EducationForm userId={userId} educations={education || []} />}
      {activeTab === "experience" && <ExperienceForm userId={userId} experiences={experience || []} />}
      {activeTab === "languages" && <LanguageForm userId={userId} languages={languages || []} />}
    </div>
  )
}
