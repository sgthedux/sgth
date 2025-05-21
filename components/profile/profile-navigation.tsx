"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { User, GraduationCap, Briefcase, Languages, CheckCircle, AlertCircle } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

export function ProfileNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("personal")
  const [completionStatus, setCompletionStatus] = useState({
    personal: false,
    education: false,
    experience: false,
    languages: false,
  })
  const [completionPercentage, setCompletionPercentage] = useState(0)
  const isMobile = useMediaQuery("(max-width: 640px)")

  // Obtener el estado de completitud del perfil
  useEffect(() => {
    async function fetchCompletionStatus() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("personal_info_completed, education_completed, experience_completed, languages_completed")
          .eq("id", session.user.id)
          .single()

        if (profile) {
          setCompletionStatus({
            personal: profile.personal_info_completed || false,
            education: profile.education_completed || false,
            experience: profile.experience_completed || false,
            languages: profile.languages_completed || false,
          })

          // Calcular porcentaje de completitud
          const completed = [
            profile.personal_info_completed,
            profile.education_completed,
            profile.experience_completed,
            profile.languages_completed,
          ].filter(Boolean).length

          setCompletionPercentage(Math.round((completed / 4) * 100))
        }
      }
    }

    fetchCompletionStatus()
  }, [pathname, searchParams])

  // Actualizar la pestaña activa basada en la URL
  useEffect(() => {
    if (pathname.includes("/dashboard/profile")) {
      const tab = searchParams.get("tab") || "personal"
      setActiveTab(tab)
    }
  }, [pathname, searchParams])

  // Función para manejar la navegación
  const handleNavigation = (tab: string) => {
    setActiveTab(tab)
    router.push(`/dashboard/profile?tab=${tab}`)
  }

  // Renderizar botón con o sin texto según el tamaño de pantalla
  const renderButton = (
    tab: string,
    icon: React.ReactNode,
    text: string,
    isCompleted: boolean,
    onClick: () => void,
    isActive: boolean,
  ) => {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap mb-2 transition-all ${
          isActive ? "bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
        }`}
        aria-label={text}
      >
        <div className="relative">
          {icon}
          {isCompleted && <CheckCircle className="h-3 w-3 text-green-500 absolute -top-1 -right-1" />}
        </div>
        {!isMobile && <span>{text}</span>}
      </button>
    )
  }

  return (
    <Card className="mb-6 w-full max-w-full overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-sm sm:text-base">Progreso del perfil</h3>
            <span className="text-xs sm:text-sm text-muted-foreground">{completionPercentage}% completado</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
        </div>

        <div className="flex flex-wrap py-3 px-2 sm:px-4 gap-2 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {renderButton(
                  "personal",
                  <User className="h-4 w-4" />,
                  "Información Personal",
                  completionStatus.personal,
                  () => handleNavigation("personal"),
                  activeTab === "personal",
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>{completionStatus.personal ? "Completado" : "Pendiente"}</p>
                <p className="text-xs text-muted-foreground">Datos personales y de contacto</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {renderButton(
                  "education",
                  <GraduationCap className="h-4 w-4" />,
                  "Formación Académica",
                  completionStatus.education,
                  () => handleNavigation("education"),
                  activeTab === "education",
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>{completionStatus.education ? "Completado" : "Pendiente"}</p>
                <p className="text-xs text-muted-foreground">Educación básica y superior</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {renderButton(
                  "experience",
                  <Briefcase className="h-4 w-4" />,
                  "Experiencia Laboral",
                  completionStatus.experience,
                  () => handleNavigation("experience"),
                  activeTab === "experience",
                )}
              </TooltipTrigger>
              <TooltipContent className="w-80 p-3">
                <div className="space-y-2">
                  <p className="font-medium">4. EXPERIENCIA LABORAL (sube documento por cada empleo)</p>
                  <p className="text-xs text-muted-foreground">(En orden cronológico, empezando por la más reciente)</p>
                  <div className="text-xs">
                    <p className="font-medium mt-2">Por cada empleo:</p>
                    <ul className="list-disc pl-4 space-y-1 mt-1">
                      <li>Empresa o entidad</li>
                      <li>Naturaleza (Pública / Privada)</li>
                      <li>País</li>
                      <li>Departamento</li>
                      <li>Municipio</li>
                      <li>Dirección</li>
                      <li>Teléfono</li>
                      <li>Correo electrónico</li>
                      <li>Cargo o contrato</li>
                      <li>Dependencia</li>
                      <li>Fecha de ingreso (día, mes, año)</li>
                      <li>Fecha de retiro (día, mes, año) (si aplica)</li>
                      <li>¿Es el empleo actual?</li>
                    </ul>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {renderButton(
                  "languages",
                  <Languages className="h-4 w-4" />,
                  "Idiomas",
                  completionStatus.languages,
                  () => handleNavigation("languages"),
                  activeTab === "languages",
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>{completionStatus.languages ? "Completado" : "Pendiente"}</p>
                <p className="text-xs text-muted-foreground">Competencias lingüísticas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/60 border-t border-amber-100 dark:border-amber-800 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-300 flex-shrink-0" />
          <span className="line-clamp-2 text-amber-800 dark:text-amber-100 font-medium">
            {completionPercentage < 100
              ? "Complete todas las secciones para generar su hoja de vida completa."
              : "¡Perfil completo! Ya puede generar su hoja de vida."}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
