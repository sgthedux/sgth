"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileSpreadsheet, FileText, Download, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Interfaces para tipado
interface DocumentType {
  id: string
  name: string
  snies_code: string
}

interface MaritalStatus {
  id: string
  name: string
  snies_code: string
}

interface AcademicModality {
  id: string
  name: string
  snies_code: string
}

interface Institution {
  id: string
  name: string
  ies_code: string
  country: string // Mantengo 'country' si se usa en otro lado, pero para SNIES usamos country_code
  country_code: string
}

interface ReportPeriod {
  id: string
  year: string
  semester: string
  is_active: boolean
}

interface Profile {
  id: string
  user_id: string
  role?: string
  status?: string
  email?: string
}

interface PersonalInfo {
  id: string
  user_id: string
  identification_type: string
  identification_number: string
  document_issue_date?: string
  document_issue_place?: string
  first_name?: string
  middle_name?: string
  first_surname?: string
  second_surname?: string
  gender?: string
  marital_status?: string
  birth_date?: string
  birth_country?: string
  birth_municipality?: string
  residence_country?: string
  residence_municipality?: string
  phone?: string
  email?: string
  institutional_email?: string
  address?: string
  institutional_address?: string
}

interface Education {
  id: string
  user_id: string
  education_type?: string // Nuevo, de la imagen
  institution: string // Existente, usado para NOMBRE_INSTITUCION_ESTUDIO
  degree?: string // Existente, usado para TITULO_RECIBIDO
  field_of_study?: string // Nuevo, de la imagen
  level?: string
  graduation_date?: string // Existente, usado para FECHA_GRADO
  graduation_year?: number // Nuevo, de la imagen
  start_date?: string // Existente, usado para FECHA_INGRESO
  end_date?: string
  current?: boolean
  semesters_completed?: number // Nuevo, de la imagen (int4)
  approved_semesters?: number // Tipo cambiado de string a number, de la imagen (int4)
  graduated?: boolean // Nuevo, de la imagen
  professional_card_number?: string // Nuevo, de la imagen
  description?: string // Nuevo, de la imagen
  last_grade_approved?: string // Nuevo, de la imagen
  academic_modality?: string
  institution_country?: string
  title_validated?: boolean
  ies_code?: string
}

interface Experience {
  id: string
  user_id: string
  company?: string
  position?: string
  start_date?: string
  end_date?: string
  current?: boolean
}

// Interfaces para el contexto de los mappers
interface ParticipantesContext {
  personalInfo: PersonalInfo
  documentTypes: DocumentType[]
  maritalStatuses: MaritalStatus[]
  profile: Profile // El perfil del usuario actual en la iteración
}

interface DocentesContext {
  personalInfo: PersonalInfo
  documentTypes: DocumentType[]
  education: Education
  institutions: Institution[]
  academicModalities: AcademicModality[]
  reportPeriod?: ReportPeriod // Puede ser el periodo seleccionado o el actual implícito
}

// Definición de los mapeos de columnas para los reportes SNIES
const PARTICIPANTES_SNIES_MAPPING = {
  CODIGO_IES: "UTEDE", // Valor fijo
  ID_TIPO_DOCUMENTO: (ctx: ParticipantesContext) => {
    const docType = ctx.documentTypes.find((dt) => dt.id === ctx.personalInfo?.identification_type)
    return docType?.snies_code || "1" // Código por defecto si no se encuentra
  },
  NUM_DOCUMENTO: (ctx: ParticipantesContext) => ctx.personalInfo?.identification_number || "",
  FECHA_EXPEDICION: (ctx: ParticipantesContext) => {
    if (!ctx.personalInfo?.document_issue_date) return ""
    const date = new Date(ctx.personalInfo.document_issue_date)
    return date.toISOString().split("T")[0]
  },
  PRIMER_NOMBRE: (ctx: ParticipantesContext) => (ctx.personalInfo?.first_name || "").toUpperCase(),
  SEGUNDO_NOMBRE: (ctx: ParticipantesContext) => (ctx.personalInfo?.middle_name || "").toUpperCase(),
  PRIMER_APELLIDO: (ctx: ParticipantesContext) => (ctx.personalInfo?.first_surname || "").toUpperCase(),
  SEGUNDO_APELLIDO: (ctx: ParticipantesContext) => (ctx.personalInfo?.second_surname || "").toUpperCase(),
  ID_SEXO_BIOLOGICO: (ctx: ParticipantesContext) => {
    const genderMap: Record<string, string> = {
      M: "1", // Masculino
      F: "2", // Femenino
      MASCULINO: "1",
      FEMENINO: "2",
      HOMBRE: "1",
      MUJER: "2",
    }
    return genderMap[ctx.personalInfo?.gender?.toUpperCase() || ""] || "1" // Default a 1 si no se mapea
  },
  ID_ESTADO_CIVIL: (ctx: ParticipantesContext) => {
    const status = ctx.maritalStatuses.find((ms) => ms.id === ctx.personalInfo?.marital_status)
    return status?.snies_code || "1" // Soltero por defecto
  },
  FECHA_NACIMIENTO: (ctx: ParticipantesContext) => {
    if (!ctx.personalInfo?.birth_date) return ""
    const date = new Date(ctx.personalInfo.birth_date)
    return date.toISOString().split("T")[0]
  },
  ID_PAIS: (ctx: ParticipantesContext) => ctx.personalInfo?.residence_country || "170", // Colombia por defecto
  ID_MUNICIPIO: (ctx: ParticipantesContext) => ctx.personalInfo?.residence_municipality || "11001", // Bogotá por defecto
  TELEFONO_CONTACTO: (ctx: ParticipantesContext) => ctx.personalInfo?.phone || "",
  EMAIL_PERSONAL: (ctx: ParticipantesContext) => ctx.personalInfo?.email || ctx.profile?.email || "",
  EMAIL_INSTITUCIONAL: (ctx: ParticipantesContext) => ctx.personalInfo?.institutional_email || "",
  DIRECCION_INSTITUCIONAL: (ctx: ParticipantesContext) =>
    ctx.personalInfo?.institutional_address || ctx.personalInfo?.address || "",
}

const DOCENTES_SNIES_MAPPING = {
  CODIGO_IES: "UTEDE", // Valor fijo
  AÑO: (ctx: DocentesContext) => ctx.reportPeriod?.year || new Date().getFullYear().toString(),
  SEMESTRE: (ctx: DocentesContext) => ctx.reportPeriod?.semester || "1", // Default a semestre 1 si no hay periodo
  ID_TIPO_DOCUMENTO: (ctx: DocentesContext) => {
    const docType = ctx.documentTypes.find((dt) => dt.id === ctx.personalInfo?.identification_type)
    return docType?.snies_code || "1"
  },
  NUM_DOCUMENTO: (ctx: DocentesContext) => ctx.personalInfo?.identification_number || "",
  FECHA_NACIMIENTO: (ctx: DocentesContext) => {
    if (!ctx.personalInfo?.birth_date) return ""
    const date = new Date(ctx.personalInfo.birth_date)
    return date.toISOString().split("T")[0]
  },
  ID_PAIS_NACIMIENTO: (ctx: DocentesContext) => ctx.personalInfo?.birth_country || "170",
  ID_MUNICIPIO_NACIMIENTO: (ctx: DocentesContext) => ctx.personalInfo?.birth_municipality || "11001",
  EMAIL_INSTITUCIONAL: (ctx: DocentesContext) => ctx.personalInfo?.institutional_email || "",
  ID_NIVEL_MAX_ESTUDIO: (ctx: DocentesContext) => {
    const levelMap: Record<string, string> = {
      DOCTORADO: "6",
      MAESTRIA: "5",
      ESPECIALIZACION: "4",
      UNIVERSITARIA: "3",
      TECNOLOGICA: "2",
      TECNICA: "1",
    }
    if (!ctx.education?.level) return "3" // Universitaria por defecto
    return levelMap[ctx.education.level.toUpperCase()] || "3"
  },
  TITULO_RECIBIDO: (ctx: DocentesContext) => ctx.education?.degree || "",
  FECHA_GRADO: (ctx: DocentesContext) => {
    if (!ctx.education?.graduation_date) return ""
    const date = new Date(ctx.education.graduation_date)
    return date.toISOString().split("T")[0]
  },
  ID_PAIS_INSTITUCION_ESTUDIO: (ctx: DocentesContext) => {
    const institution = ctx.institutions.find((inst) => inst.name === ctx.education?.institution)
    return institution?.country_code || ctx.education?.institution_country || "170"
  },
  TITULO_CONVALIDADO: (ctx: DocentesContext) => (ctx.education?.title_validated ? "S" : "N"),
  ID_IES_ESTUDIO: (ctx: DocentesContext) => {
    const institution = ctx.institutions.find((inst) => inst.name === ctx.education?.institution)
    return institution?.ies_code || ctx.education?.ies_code || "1101"
  },
  NOMBRE_INSTITUCION_ESTUDIO: (ctx: DocentesContext) => ctx.education?.institution || "",
  ID_METODOLOGIA_PROGRAMA: (ctx: DocentesContext) => {
    const modality = ctx.academicModalities.find((am) => am.id === ctx.education?.academic_modality)
    return modality?.snies_code || "1" // Presencial por defecto
  },
  FECHA_INGRESO: (ctx: DocentesContext) => {
    if (!ctx.education?.start_date) return ""
    const date = new Date(ctx.education.start_date)
    return date.toISOString().split("T")[0]
  },
}

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatingReport, setGeneratingReport] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [personalInfos, setPersonalInfos] = useState<PersonalInfo[]>([])
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [educations, setEducations] = useState<Education[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [maritalStatuses, setMaritalStatuses] = useState<MaritalStatus[]>([])
  const [academicModalities, setAcademicModalities] = useState<AcademicModality[]>([])
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [reportPeriods, setReportPeriods] = useState<ReportPeriod[]>([])
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("")
  const [currentYear, setCurrentYear] = useState<string>(new Date().getFullYear().toString())
  const [currentSemester, setCurrentSemester] = useState<string>(new Date().getMonth() < 6 ? "1" : "2")

  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true)
      setError(null)

      try {
        // Verificar autenticación
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession()

        if (authError) {
          throw new Error(`Error de autenticación: ${authError.message}`)
        }

        if (!session) {
          router.push("/auth/login")
          return
        }

        // Verificar rol de administrador
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          throw new Error(`Error al obtener perfil: ${profileError.message}`)
        }

        if (profile?.role !== "admin") {
          router.push("/dashboard")
          return
        }

        // Cargar datos para reportes
        await loadReportData()
      } catch (err: any) {
        console.error("Error en la verificación:", err)
        setError(err.message || "Error al cargar la página")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const loadReportData = async () => {
    try {
      // Cargar catálogos primero
      await Promise.all([
        loadCatalogs(),
        loadProfiles(),
        loadPersonalInfos(),
        loadExperiences(),
        loadEducations(),
        loadReportPeriods(),
      ])

      // Añadir logs para verificar que los datos se cargaron correctamente
      console.log("Datos cargados:", {
        profiles: profiles.length,
        personalInfos: personalInfos.length,
        experiences: experiences.length,
        educations: educations.length,
        documentTypes: documentTypes.length,
        maritalStatuses: maritalStatuses.length,
        academicModalities: academicModalities.length,
        institutions: institutions.length,
        reportPeriods: reportPeriods.length,
      })
    } catch (err: any) {
      console.error("Error al cargar datos para reportes:", err)
      setError(err.message || "Error al cargar datos para reportes")
    }
  }

  const loadCatalogs = async () => {
    try {
      // Cargar tipos de documento
      const { data: docTypes, error: docTypesError } = await supabase.from("document_types").select("*")

      if (docTypesError) throw new Error(`Error al cargar tipos de documento: ${docTypesError.message}`)
      setDocumentTypes(docTypes || [])

      // Cargar estados civiles
      const { data: maritalData, error: maritalError } = await supabase.from("marital_status").select("*")

      if (maritalError) throw new Error(`Error al cargar estados civiles: ${maritalError.message}`)
      setMaritalStatuses(maritalData || [])

      // Cargar modalidades académicas
      const { data: modalitiesData, error: modalitiesError } = await supabase.from("academic_modalities").select("*")

      if (modalitiesError) throw new Error(`Error al cargar modalidades académicas: ${modalitiesError.message}`)
      setAcademicModalities(modalitiesData || [])

      // Cargar instituciones
      const { data: institutionsData, error: institutionsError } = await supabase.from("institutions").select("*")

      if (institutionsError) throw new Error(`Error al cargar instituciones: ${institutionsError.message}`)
      setInstitutions(institutionsData || [])
    } catch (err: any) {
      console.error("Error al cargar catálogos:", err)
      throw err
    }
  }

  const loadProfiles = async () => {
    try {
      // Primero intentar cargar desde la tabla profiles
      const { data, error } = await supabase.from("profiles").select("*")

      if (error) {
        console.error("Error al cargar perfiles:", error)
        throw new Error(`Error al cargar perfiles: ${error.message}`)
      }

      if (!data || data.length === 0) {
        console.log("No se encontraron perfiles en la tabla profiles, intentando cargar desde auth.users")

        // Si no hay perfiles, intentar cargar desde auth.users
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

        if (authError) {
          console.error("Error al cargar usuarios de auth:", authError)
          throw new Error(`Error al cargar usuarios: ${authError.message}`)
        }

        // Convertir usuarios de auth a formato de perfil
        const profilesFromAuth =
          authUsers?.users?.map((user) => ({
            id: user.id,
            user_id: user.id,
            email: user.email,
            role: user.user_metadata?.role || "user",
            status: "ACEPTADO", // Asumir que todos los usuarios de auth están aceptados
            created_at: user.created_at,
          })) || []

        console.log(`Se cargaron ${profilesFromAuth.length} usuarios desde auth`)
        setProfiles(profilesFromAuth)
        return
      }

      console.log(`Se cargaron ${data.length} perfiles desde la tabla profiles`)
      setProfiles(data)
    } catch (err: any) {
      console.error("Error al cargar perfiles:", err)
      // No lanzar error para permitir continuar con un array vacío
      setProfiles([])
    }
  }

  const loadPersonalInfos = async () => {
    try {
      const { data, error } = await supabase.from("personal_info").select("*")

      if (error) {
        console.error("Error al cargar información personal:", error)
        throw new Error(`Error al cargar información personal: ${error.message}`)
      }

      console.log(`Se cargaron ${data?.length || 0} registros de información personal`)
      setPersonalInfos(data || [])
    } catch (err: any) {
      console.error("Error al cargar información personal:", err)
      // No lanzar error para permitir continuar con un array vacío
      setPersonalInfos([])
    }
  }

  const loadExperiences = async () => {
    try {
      const { data, error } = await supabase.from("experience").select("*")
      if (error) throw new Error(`Error al cargar experiencias: ${error.message}`)
      setExperiences(data || [])
    } catch (err: any) {
      console.error("Error al cargar experiencias:", err)
      throw err
    }
  }

  const loadEducations = async () => {
    try {
      const { data, error } = await supabase.from("education").select("*")
      if (error) throw new Error(`Error al cargar educación: ${error.message}`)
      setEducations(data || [])
    } catch (err: any) {
      console.error("Error al cargar educación:", err)
      throw err
    }
  }

  const loadReportPeriods = async () => {
    try {
      const { data, error } = await supabase.from("report_periods").select("*")

      // Si no hay tabla de períodos o no hay datos, usamos el período actual
      if (error || !data || data.length === 0) {
        console.log("No se encontraron períodos de reporte, usando período actual")
        return
      }

      setReportPeriods(data)

      // Seleccionar el período activo por defecto
      const activePeriod = data.find((p) => p.is_active)
      if (activePeriod) {
        setSelectedPeriodId(activePeriod.id)
      } else if (data.length > 0) {
        // Si no hay período activo, seleccionar el primero
        setSelectedPeriodId(data[0].id)
      }
    } catch (err: any) {
      console.error("Error al cargar períodos de reporte:", err)
      // No lanzamos el error para permitir continuar con el período actual
    }
  }

  // Función para obtener el registro de educación más reciente o marcado como actual
  const getMostRelevantEducation = (userId: string): Education | undefined => {
    const userEducations = educations.filter((edu) => edu.user_id === userId)

    // Primero buscar si hay alguno marcado como actual
    const currentEducation = userEducations.find((edu) => edu.current === true)
    if (currentEducation) return currentEducation

    // Si no hay actual, buscar el más reciente por fecha de graduación
    return userEducations.sort((a, b) => {
      const dateA = a.graduation_date ? new Date(a.graduation_date).getTime() : 0
      const dateB = b.graduation_date ? new Date(b.graduation_date).getTime() : 0
      return dateB - dateA // Orden descendente (más reciente primero)
    })[0]
  }

  const generateParticipantesSNIES = async () => {
    setGeneratingReport("participantes")
    try {
      // Obtener el período de reporte seleccionado o usar el actual
      let reportPeriod: ReportPeriod | undefined

      if (selectedPeriodId && reportPeriods.length > 0) {
        reportPeriod = reportPeriods.find((p) => p.id === selectedPeriodId)
      }

      // Si no hay período seleccionado, usar el actual
      if (!reportPeriod) {
        reportPeriod = {
          id: "current",
          year: currentYear,
          semester: currentSemester,
          is_active: true,
        }
      }

      let approvedProfiles = profiles.filter((profile) => profile.status === "ACEPTADO")

      if (approvedProfiles.length === 0) {
        console.log("No se encontraron perfiles con estado ACEPTADO, usando todos los perfiles")
        approvedProfiles = profiles
      }

      console.log(`Generando reporte para ${approvedProfiles.length} perfiles`)

      const reportData = approvedProfiles.map((profileEntry) => {
        const personalInfo = personalInfos.find((pi) => pi.user_id === profileEntry.id)

        if (!personalInfo) {
          console.log(`No se encontró información personal para el perfil ${profileEntry.id}`)
        }

        const rowData: Record<string, any> = {}
        const context: ParticipantesContext = {
          personalInfo: personalInfo || ({} as PersonalInfo),
          documentTypes,
          maritalStatuses,
          profile: profileEntry, // Usar el perfil actual de la iteración
        }

        Object.entries(PARTICIPANTES_SNIES_MAPPING).forEach(([column, mapper]) => {
          if (typeof mapper === "function") {
            try {
              rowData[column] = mapper(context)
            } catch (err) {
              console.error(`Error al mapear columna ${column}:`, err)
              rowData[column] = ""
            }
          } else {
            rowData[column] = mapper
          }
        })

        rowData["AÑO"] = reportPeriod?.year || currentYear
        rowData["SEMESTRE"] = reportPeriod?.semester || currentSemester

        return rowData
      })

      console.log(`Datos del reporte generados: ${reportData.length} filas`)

      if (reportData.length === 0) {
        throw new Error("No hay datos para generar el reporte")
      }

      const headers = [...Object.keys(PARTICIPANTES_SNIES_MAPPING), "AÑO", "SEMESTRE"].join(",")
      const rows = reportData.map((row) => {
        const allColumns = [...Object.keys(PARTICIPANTES_SNIES_MAPPING), "AÑO", "SEMESTRE"]
        return allColumns
          .map((key) => {
            const value = row[key]
            return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value || ""
          })
          .join(",")
      })
      const csv = [headers, ...rows].join("\n")

      console.log(`CSV generado con ${rows.length} filas y ${headers.split(",").length} columnas`)

      const periodYear = reportPeriod?.year || currentYear
      const periodSemester = reportPeriod?.semester || currentSemester
      downloadCSV(csv, `Participante_SNIES_${periodYear}_${periodSemester}.csv`)
    } catch (err: any) {
      console.error("Error al generar reporte de participantes:", err)
      setError(`Error al generar reporte de participantes: ${err.message}`)
    } finally {
      setGeneratingReport(null)
    }
  }

  const generateDocentesSNIES = async () => {
    setGeneratingReport("docentes")
    try {
      let reportPeriodOuter: ReportPeriod | undefined // Renombrar para evitar conflicto con el ctx.reportPeriod

      if (selectedPeriodId && reportPeriods.length > 0) {
        reportPeriodOuter = reportPeriods.find((p) => p.id === selectedPeriodId)
      }

      if (!reportPeriodOuter) {
        reportPeriodOuter = {
          id: "current",
          year: currentYear,
          semester: currentSemester,
          is_active: true,
        }
      }

      const docentesIds = new Set(
        experiences
          .filter(
            (exp) =>
              exp.company?.toLowerCase().includes("universidad") ||
              exp.position?.toLowerCase().includes("docente") ||
              exp.position?.toLowerCase().includes("profesor"),
          )
          .map((exp) => exp.user_id),
      )

      console.log(`Se identificaron ${docentesIds.size} posibles docentes`)

      let approvedDocentes = profiles.filter((profile) => profile.status === "ACEPTADO" && docentesIds.has(profile.id))

      if (approvedDocentes.length === 0) {
        console.log(
          "No se encontraron docentes con estado ACEPTADO y experiencia relevante, usando todos los perfiles aceptados",
        )
        approvedDocentes = profiles.filter((profile) => profile.status === "ACEPTADO")

        if (approvedDocentes.length === 0) {
          console.log("No se encontraron perfiles aceptados, usando todos los perfiles")
          approvedDocentes = profiles
        }
      }

      console.log(`Generando reporte para ${approvedDocentes.length} docentes`)

      const reportData = approvedDocentes.map((profileEntry) => {
        const personalInfo = personalInfos.find((pi) => pi.user_id === profileEntry.id) || ({} as PersonalInfo)
        const education = getMostRelevantEducation(profileEntry.id) || ({} as Education)

        if (!personalInfo.id) {
          // Chequear si el objeto está vacío
          console.log(`No se encontró información personal para el perfil ${profileEntry.id}`)
        }

        if (!education.id) {
          // Chequear si el objeto está vacío
          console.log(`No se encontró educación para el perfil ${profileEntry.id}`)
        }

        const rowData: Record<string, any> = {}
        const context: DocentesContext = {
          personalInfo,
          documentTypes,
          education,
          institutions,
          academicModalities,
          reportPeriod: reportPeriodOuter, // Pasar el período de reporte al contexto
        }

        Object.entries(DOCENTES_SNIES_MAPPING).forEach(([column, mapper]) => {
          if (typeof mapper === "function") {
            try {
              rowData[column] = mapper(context)
            } catch (err) {
              console.error(`Error al mapear columna ${column}:`, err)
              rowData[column] = ""
            }
          } else {
            rowData[column] = mapper
          }
        })

        return rowData
      })

      console.log(`Datos del reporte generados: ${reportData.length} filas`)

      if (reportData.length === 0) {
        throw new Error("No hay datos para generar el reporte")
      }

      const headers = Object.keys(DOCENTES_SNIES_MAPPING).join(",")
      const rows = reportData.map((row) =>
        Object.keys(DOCENTES_SNIES_MAPPING)
          .map((key) => {
            const value = row[key]
            return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value || ""
          })
          .join(","),
      )
      const csv = [headers, ...rows].join("\n")

      console.log(`CSV generado con ${rows.length} filas y ${headers.split(",").length} columnas`)

      const periodYear = reportPeriodOuter?.year || currentYear
      const periodSemester = reportPeriodOuter?.semester || currentSemester
      downloadCSV(csv, `Docentes_IES_SNIES_${periodYear}_${periodSemester}.csv`)
    } catch (err: any) {
      console.error("Error al generar reporte de docentes:", err)
      setError(`Error al generar reporte de docentes: ${err.message}`)
    } finally {
      setGeneratingReport(null)
    }
  }

  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // Liberar recursos
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando datos para reportes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground">Genera reportes del sistema</p>
        </div>

        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button onClick={() => window.location.reload()}>Intentar nuevamente</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">Genera reportes del sistema</p>
      </div>    

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reporte de Participantes SNIES</CardTitle>
            <CardDescription>
              Genera un reporte con la información de todos los usuarios registrados en formato SNIES.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <FileSpreadsheet className="h-16 w-16 text-primary" />
            <Button
              className="w-full"
              onClick={generateParticipantesSNIES}
              disabled={generatingReport === "participantes"}
            >
              {generatingReport === "participantes" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Exportar Participantes SNIES
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reporte de Docentes SNIES</CardTitle>
            <CardDescription>Genera un reporte con la información de docentes en formato SNIES.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <FileText className="h-16 w-16 text-primary" />
            <Button className="w-full" onClick={generateDocentesSNIES} disabled={generatingReport === "docentes"}>
              {generatingReport === "docentes" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" /> Exportar Docentes SNIES
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
