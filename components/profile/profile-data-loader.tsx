"use client"

import { useEffect, useState } from "react"
import { useAllProfileData } from "@/hooks/use-profile"
import { PersonalInfoForm } from "@/components/profile/personal-info-form"
import { EducationForm } from "@/components/profile/education-form"
import { ExperienceForm } from "@/components/profile/experience-form"
import { LanguageForm } from "@/components/profile/language-form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

interface ProfileDataLoaderProps {
  userId: string
  activeTab: string
  initialData?: {
    profile?: any
    personalInfo?: any
    education?: any[]
    experience?: any[]
    languages?: any[]
  }
}

export function ProfileDataLoader({ userId, activeTab, initialData }: ProfileDataLoaderProps) {
  const [isClient, setIsClient] = useState(false)
  const { data, isLoading, isError, mutate } = useAllProfileData(userId)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Usar datos iniciales del servidor si están disponibles, sino usar datos del hook
  const profileData = data || initialData
  const profile = profileData?.profile
  const personalInfo = profileData?.personalInfo
  const education = profileData?.education || []
  const experience = profileData?.experience || []
  const languages = profileData?.languages || []

  // Calcular progreso de completitud
  const completedSections = [
    profile?.personal_info_completed,
    profile?.education_completed,
    profile?.experience_completed,
    profile?.languages_completed,
  ].filter(Boolean).length

  const totalSections = 4
  const completionPercentage = Math.round((completedSections / totalSections) * 100)

  if (!isClient) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error al cargar los datos del perfil. Por favor, recargue la página.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading && !profileData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando datos del perfil...</span>
      </div>
    )
  }

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

      {activeTab === "personal" && (
        <PersonalInfoForm userId={userId} initialData={personalInfo || undefined} onSuccess={() => mutate()} />
      )}
      {activeTab === "education" && (
        <EducationForm userId={userId} educations={education || []} onSuccess={() => mutate()} />
      )}
      {activeTab === "experience" && (
        <ExperienceForm userId={userId} experiences={experience || []} onSuccess={() => mutate()} />
      )}
      {activeTab === "languages" && (
        <LanguageForm userId={userId} languages={languages || []} onSuccess={() => mutate()} />
      )}
    </div>
  )
}
