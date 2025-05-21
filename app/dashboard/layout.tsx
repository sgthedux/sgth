"use client"

export const dynamic = 'force-dynamic'

import type React from "react"
import { useMemo, Suspense, useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { PersonalInfoForm } from "@/components/profile/personal-info-form"
import { EducationForm } from "@/components/profile/education-form"
import { ExperienceForm } from "@/components/profile/experience-form"
import { LanguageForm } from "@/components/profile/language-form"
import { ProfileNavigation } from "@/components/profile/profile-navigation"
import { SWRProvider } from "@/lib/swr-config"
import { createClient } from "@/lib/supabase/client"
import { useAllProfileData } from "@/hooks/use-profile"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <SWRProvider>
      <Suspense fallback={<LoadingState message="Loading params..." />}>
        <LayoutInner pathname={pathname} router={router}>
          {children}
        </LayoutInner>
      </Suspense>
    </SWRProvider>
  )
}

function LayoutInner({
  pathname,
  router,
  children,
}: {
  pathname: string
  router: any
  children: React.ReactNode
}) {
  const searchParams = useSearchParams()
  return (
    <DashboardContent pathname={pathname} router={router} searchParams={searchParams}>
      {children}
    </DashboardContent>
  )
}

function DashboardContent({
  pathname,
  router,
  searchParams,
  children,
}: {
  pathname: string
  router: any
  searchParams: any
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Cargar usuario de forma optimizada
  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        // Intentar obtener usuario del localStorage primero
        const cachedUser = localStorage.getItem("currentUser")
        if (cachedUser) {
          const parsedUser = JSON.parse(cachedUser)
          if (isMounted) {
            setUser(parsedUser)
            setLoading(false)
          }
        }

        // Obtener usuario fresco de Supabase
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error || !session) {
          console.error("Error loading user session:", error)
          if (isMounted) {
            setLoading(false)
            router.push("/auth/login")
          }
          return
        }

        if (isMounted) {
          setUser(session.user)
          setLoading(false)
          // Guardar en localStorage
          localStorage.setItem("currentUser", JSON.stringify(session.user))
        }
      } catch (error) {
        console.error("Error in loadUser:", error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [router, supabase])

  // Cargar todos los datos del perfil de una vez
  const { data: allProfileData, isLoading: profileDataLoading } = useAllProfileData(user?.id)

  // Determinar la sección activa basada en la URL
  const activeSection = useMemo(() => {
    if (pathname.includes("/dashboard/profile")) return "profile"
    if (pathname.includes("/dashboard/documents")) return "documents"
    if (pathname.includes("/dashboard/cv")) return "cv"
    return "dashboard"
  }, [pathname])

  // Determinar la pestaña activa basada en los parámetros de búsqueda
  const activeTab = useMemo(() => {
    return searchParams.get("tab") || "personal"
  }, [searchParams])

  // Mostrar estado de carga solo si no hay datos en caché
  if (loading && !localStorage.getItem("currentUser")) {
    return <LoadingState message="Cargando usuario..." />
  }

  // Usar datos en caché mientras se cargan los datos frescos
  const profile = allProfileData?.profile || JSON.parse(localStorage.getItem(`profile/${user?.id}`) || "{}")

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 md:ml-64 w-full max-w-full overflow-hidden">
        <Header
          user={{
            name: profile?.full_name || "",
            email: profile?.email || "",
            imageUrl: profile?.avatar_url,
          }}
        />
        <main className="flex-1 p-4 md:p-6 w-full max-w-full overflow-hidden">
          <Suspense fallback={<LoadingState message="Cargando contenido..." />}>
            {user && (
              <ProfileContent
                userId={user.id}
                allProfileData={allProfileData}
                isLoading={profileDataLoading}
                activeSection={activeSection}
                activeTab={activeTab}
                children={children}
              />
            )}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

function LoadingState({ message = "Cargando..." }) {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

function ProfileContent({
  userId,
  allProfileData,
  isLoading,
  activeSection,
  activeTab,
  children,
}: {
  userId: string
  allProfileData: any
  isLoading: boolean
  activeSection: string
  activeTab: string
  children: React.ReactNode
}) {
  // Usar datos en caché si están disponibles
  const getDataFromCacheOrFresh = (key: string) => {
    if (allProfileData && allProfileData[key]) {
      return allProfileData[key]
    }

    try {
      const cachedData = localStorage.getItem(`${key}/${userId}`)
      return cachedData ? JSON.parse(cachedData) : key === "profile" ? {} : []
    } catch (e) {
      console.error(`Error getting ${key} from cache:`, e)
      return key === "profile" ? {} : []
    }
  }

  // Obtener datos del perfil
  const personalInfo = getDataFromCacheOrFresh("personalInfo")
  const education = getDataFromCacheOrFresh("education")
  const experience = getDataFromCacheOrFresh("experience")
  const languages = getDataFromCacheOrFresh("languages")

  // Mostrar indicador de carga solo si no hay datos en caché
  const showLoading =
    isLoading &&
    !localStorage.getItem(`profile/${userId}`) &&
    !localStorage.getItem(`personal_info/${userId}`) &&
    !localStorage.getItem(`education/${userId}`) &&
    !localStorage.getItem(`experience/${userId}`) &&
    !localStorage.getItem(`languages/${userId}`)

  return (
    <div className="w-full max-w-full overflow-hidden">
      {activeSection === "profile" && <ProfileNavigation activeTab={activeTab} userId={userId} />}

      {/* Renderizado condicional del contenido */}
      {activeSection === "dashboard" && <div className="w-full max-w-full overflow-hidden">{children}</div>}

      {activeSection === "profile" && (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
            <p className="text-muted-foreground">Completa tu información personal y profesional</p>
          </div>

          <Tabs value={activeTab} className="space-y-4 w-full max-w-full overflow-hidden">
            {/* Contenido de las pestañas */}
            <TabsContent value="personal" className="w-full max-w-full overflow-hidden">
              {showLoading ? (
                <LoadingState message="Cargando información personal..." />
              ) : (
                <PersonalInfoForm
                  userId={userId}
                  initialData={personalInfo}
                  key={`personal-${personalInfo ? personalInfo.id : "new"}`}
                />
              )}
            </TabsContent>
            <TabsContent value="education" className="w-full max-w-full overflow-hidden">
              {showLoading ? (
                <LoadingState message="Cargando información educativa..." />
              ) : (
                <EducationForm
                  userId={userId}
                  educations={education || []}
                  key={`education-${education ? education.length : 0}`}
                />
              )}
            </TabsContent>
            <TabsContent value="experience" className="w-full max-w-full overflow-hidden">
              {showLoading ? (
                <LoadingState message="Cargando experiencia laboral..." />
              ) : (
                <ExperienceForm
                  userId={userId}
                  experiences={experience || []}
                  key={`experience-${experience ? experience.length : 0}`}
                />
              )}
            </TabsContent>
            <TabsContent value="languages" className="w-full max-w-full overflow-hidden">
              {showLoading ? (
                <LoadingState message="Cargando idiomas..." />
              ) : (
                <LanguageForm
                  userId={userId}
                  languages={languages || []}
                  key={`languages-${languages ? languages.length : 0}`}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {activeSection === "documents" && <div className="w-full max-w-full overflow-hidden">{children}</div>}

      {activeSection === "cv" && <div className="w-full max-w-full overflow-hidden">{children}</div>}
    </div>
  )
}
