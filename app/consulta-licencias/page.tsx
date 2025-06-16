"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  ExternalLink,
  Search,
  FileText,
  UserCircle,
  ListChecks,
  ClipboardCopy,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  Home,
  ArrowLeft,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { LicenseRequestForm } from "@/components/licenses/license-request-form"
import type { User } from "@supabase/supabase-js"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface Evidence {
  id: string
  file_name: string | null
  file_path: string
  file_type: string | null
  file_url: string | null
}

interface LicenseRequest {
  id: string
  radicado?: string | null
  user_id?: string | null
  nombres?: string
  apellidos?: string
  license_type: string
  observacion: string | null // Anteriormente reason
  status: "pending" | "approved" | "rejected"
  estado: "pending" | "approved" | "rejected" | "en_proceso" | "finalizada" | "pendiente" | "aprobada" | "rechazada" | "en proceso" | "finished" | null
  created_at: string
  fecha_inicio: string | null // Anteriormente start_date
  fecha_finalizacion: string | null // Anteriormente end_date
  rejection_reason?: string | null
  license_evidences: Evidence[]
}

export default function ConsultaLicenciasPage() {
  const [myLicenses, setMyLicenses] = useState<LicenseRequest[]>([])
  const [searchedLicense, setSearchedLicense] = useState<LicenseRequest | null>(null)
  const [loadingMyLicenses, setLoadingMyLicenses] = useState(false)
  const [loadingSearchedLicense, setLoadingSearchedLicense] = useState(false)
  const [searchTermMyLicenses, setSearchTermMyLicenses] = useState("")
  const [radicadoInput, setRadicadoInput] = useState("")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [errorSearchedLicense, setErrorSearchedLicense] = useState<string | null>(null)
  const [newlyCreatedRadicado, setNewlyCreatedRadicado] = useState<string | null>(null)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const { toast } = useToast()

  const supabase = createClient()

  const fetchCurrentUserAndLicenses = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setCurrentUser(user)

    if (user) {
      setLoadingMyLicenses(true)
      try {
        const { data, error } = await supabase
          .from("license_requests")
          .select(`*, license_evidences (*)`)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        if (error) throw error
        setMyLicenses(data || [])
      } catch (e: any) {
        console.error("Error fetching user's licenses:", e.message)
        setMyLicenses([])
        toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar tus licencias." })
      } finally {
        setLoadingMyLicenses(false)
      }
    } else {
      setMyLicenses([])
    }
  }, [supabase, toast])

  useEffect(() => {
    fetchCurrentUserAndLicenses()
  }, [fetchCurrentUserAndLicenses])

  const handleSearchByRadicado = async () => {
    if (!radicadoInput.trim()) {
      setErrorSearchedLicense("Por favor, ingrese un número de radicado.")
      return
    }
    setLoadingSearchedLicense(true)
    setSearchedLicense(null)
    setErrorSearchedLicense(null)
    try {
      const { data, error } = await supabase
        .from("license_requests")
        .select(`*, license_evidences (*)`)
        .eq("radicado", radicadoInput.trim())
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          setErrorSearchedLicense("No se encontró una solicitud con ese número de radicado.")
        } else {
          throw error
        }
      } else if (data) {
        setSearchedLicense(data)
      } else {
        setErrorSearchedLicense("No se encontró una solicitud con ese número de radicado.")
      }
    } catch (e: any) {
      console.error("Error searching license by radicado:", e.message)
      setErrorSearchedLicense("Error al buscar la solicitud. Verifique el número o intente más tarde.")
    }
    setLoadingSearchedLicense(false)
  }

  const handleLicenseCreated = (result: any) => {
    const displayRadicado = result.radicado || result.licenseRequest?.id
    setNewlyCreatedRadicado(displayRadicado)
    
    // NO cerrar el modal inmediatamente - dejar que el formulario muestre el éxito
    // setIsRequestModalOpen(false) 
    
    toast({
      title: "¡Solicitud Enviada!",
      description: `Tu número de radicado es: ${displayRadicado}. Guárdalo para futuras consultas.`,
      variant: "default",
      duration: 10000,
    })
    
    if (currentUser) {
      fetchCurrentUserAndLicenses()
    }
    setSearchedLicense(null)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({ description: "Radicado copiado al portapapeles." })
      },
      (err) => {
        console.error("Error al copiar radicado: ", err)
        toast({ variant: "destructive", description: "Error al copiar radicado." })
      },
    )
  }

  const getStatusBadge = (license: LicenseRequest) => {
    // Usar la columna 'estado' si existe, sino usar 'status' como fallback
    const currentStatus = license.estado || license.status
    
    // Debug log para ver qué valores estamos recibiendo
    console.log("Estado en BD:", license.estado, "Status:", license.status, "Current:", currentStatus)
    
    switch (currentStatus) {
      case "approved":
      case "aprobada":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white border-0 shadow-sm">
            Aprobada
          </Badge>
        )
      case "rejected":
      case "rechazada":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-sm">
            Rechazada
          </Badge>
        )
      case "pending":
      case "pendiente":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm">
            Pendiente
          </Badge>
        )
      case "en_proceso":
      case "en proceso":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-sm">
            En Proceso
          </Badge>
        )
      case "finalizada":
      case "finished":
        return (
          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-sm">
            Finalizada
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white border-0 shadow-sm">
            {currentStatus || "Pendiente"}
          </Badge>
        )
    }
  }

  // Función helper para normalizar los estados
  const normalizeStatus = (status: string | null | undefined): string => {
    if (!status) return "pending"
    
    const statusLower = status.toLowerCase()
    switch (statusLower) {
      case "aprobada":
      case "approved":
        return "approved"
      case "rechazada":
      case "rejected":
        return "rejected"
      case "pendiente":
      case "pending":
        return "pending"
      case "en_proceso":
      case "en proceso":
        return "en_proceso"
      case "finalizada":
      case "finished":
        return "finalizada"
      default:
        return "pending"
    }
  }

  const filteredMyLicenses = myLicenses.filter(
    (license) =>
      license.license_type?.toLowerCase().includes(searchTermMyLicenses.toLowerCase()) ||
      license.observacion?.toLowerCase().includes(searchTermMyLicenses.toLowerCase()),
  )

  const renderLicenseCard = (license: LicenseRequest, isSearchResult = false) => {
    console.log("Datos de la licencia recibidos en renderLicenseCard:", JSON.stringify(license, null, 2))
    return (
      <Card
        key={license.id}
        className={`overflow-hidden transition-all duration-300 ${isSearchResult ? "mt-4 shadow-lg" : "shadow-md"}`}
      >
        <CardHeader className="bg-muted/30 dark:bg-muted/20 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Solicitud de Licencia</span>
              </CardTitle>
              <CardDescription className="mt-1 text-xs">
                Radicado: <span className="font-medium text-foreground">{license.radicado || license.id}</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">{getStatusBadge(license)}</div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <h4 className="font-medium text-sm mb-1">Detalles de la Solicitud</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong className="text-muted-foreground">Solicitante:</strong> {license.nombres} {license.apellidos}
                </p>
                <p>
                  <strong className="text-muted-foreground">Fecha de inicio:</strong>{" "}
                  {license.fecha_inicio ? format(new Date(license.fecha_inicio), "PPP", { locale: es }) : "N/A"}
                </p>
                <p>
                  <strong className="text-muted-foreground">Fecha de fin:</strong>{" "}
                  {license.fecha_finalizacion
                    ? format(new Date(license.fecha_finalizacion), "PPP", { locale: es })
                    : "N/A"}
                </p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-1">Motivo</h4>
              <p className="text-sm text-muted-foreground break-words">
                {license.observacion || "No se proporcionó un motivo."}
              </p>
            </div>
            {license.rejection_reason && normalizeStatus(license.estado || license.status) === "rejected" && (
              <div className="md:col-span-2">
                <h4 className="font-medium text-sm mb-1 text-destructive">Motivo del Rechazo</h4>
                <p className="text-sm text-destructive-foreground bg-destructive/10 p-2 rounded-md break-words">
                  {license.rejection_reason}
                </p>
              </div>
            )}
            <div className="md:col-span-2">
              <h4 className="font-medium text-sm mb-2">Evidencias Adjuntas</h4>
              {license.license_evidences && license.license_evidences.length > 0 ? (
                <div className="space-y-2">
                  {license.license_evidences.map((evidence) => (
                    <a
                      key={evidence.id}
                      href={evidence.file_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border rounded-md p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="truncate max-w-[calc(100%-50px)]">
                          <p className="text-sm font-medium truncate" title={evidence.file_name || "Archivo"}>
                            {evidence.file_name || "Archivo"}
                          </p>
                          <p className="text-xs text-muted-foreground">{evidence.file_type || "Tipo desconocido"}</p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No se han proporcionado evidencias.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 transition-colors duration-300">
      <div className="container mx-auto px-4 relative">
        {/* Botón de volver al inicio - esquina superior derecha */}
        <div className="absolute top-0 right-4 z-10">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
              <Home className="h-4 w-4 mr-2" />
              Inicio
            </Button>
          </Link>
        </div>
        
        {/* Botón de volver al inicio - parte superior izquierda */}
        <div className="mb-6 flex justify-start">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inicio
            </Button>
          </Link>
        </div>
        
        <header className="mb-10 text-center">
          <FileText className="h-16 w-16 mx-auto text-primary mb-4" />
          <h1 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Sistema de Licencias y Permisos
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Solicita una nueva licencia o consulta el estado de una existente utilizando su número de radicado.
          </p>
        </header>

        <div className="mb-12 flex justify-center">
          <Dialog open={isRequestModalOpen} onOpenChange={setIsRequestModalOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <PlusCircle className="h-5 w-5 mr-2" />
                Solicitar Nueva Licencia
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
              <LicenseRequestForm 
                onSuccess={handleLicenseCreated}
                onClose={() => setIsRequestModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {newlyCreatedRadicado && (
          <Alert
            variant="default"
            className="mb-8 max-w-2xl mx-auto bg-green-50 border-green-300 dark:bg-green-800/20 dark:border-green-600 shadow-md"
          >
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            <AlertTitle className="font-semibold text-green-700 dark:text-green-300">
              ¡Solicitud Enviada Exitosamente!
            </AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-400 mt-1">
              Guarda este número de radicado para consultar tu solicitud:
              <div className="flex items-center gap-2 mt-2">
                <strong className="font-mono bg-green-100 dark:bg-green-700/50 px-3 py-1.5 rounded text-base">
                  {newlyCreatedRadicado}
                </strong>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(newlyCreatedRadicado!)}
                  className="h-8 w-8 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                >
                  <ClipboardCopy className="h-4 w-4" />
                  <span className="sr-only">Copiar radicado</span>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Card className="mb-12 shadow-lg border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/50 max-w-2xl mx-auto">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700/60">
            <CardTitle className="flex items-center text-2xl text-slate-700 dark:text-slate-200">
              <Search className="h-7 w-7 mr-3 text-primary" />
              Consultar Estado de Solicitud
            </CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 mt-1">
              Ingresa el número de radicado de la solicitud para ver su estado actual y detalles.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder="Número de Radicado (Ej: LIC-2025-XXXXX)"
                value={radicadoInput}
                onChange={(e) => {
                  setRadicadoInput(e.target.value)
                  setErrorSearchedLicense(null)
                  setNewlyCreatedRadicado(null)
                }}
                className="flex-grow text-base py-2.5 dark:bg-slate-700 dark:text-slate-200"
                aria-label="Número de Radicado"
              />
              <Button
                onClick={handleSearchByRadicado}
                disabled={loadingSearchedLicense}
                size="lg"
                className="w-full sm:w-auto"
              >
                {loadingSearchedLicense ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5 mr-2" />
                    Buscar
                  </>
                )}
              </Button>
            </div>
            {errorSearchedLicense && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorSearchedLicense}</AlertDescription>
              </Alert>
            )}
            {loadingSearchedLicense && !searchedLicense && (
              <div className="mt-6 text-center py-8">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <p className="text-muted-foreground mt-3 text-lg">Buscando solicitud...</p>
              </div>
            )}
            {searchedLicense && !loadingSearchedLicense && (
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 text-slate-700 dark:text-slate-200">
                  Resultado de la Búsqueda:
                </h3>
                {renderLicenseCard(searchedLicense, true)}
              </div>
            )}
          </CardContent>
        </Card>

        {currentUser && (
          <section className="mt-16">
            <h2 className="text-3xl font-bold mb-6 text-center text-slate-800 dark:text-slate-100 flex items-center justify-center">
              <ListChecks className="h-8 w-8 mr-3 text-primary" />
              Mis Solicitudes
            </h2>
            <p className="text-muted-foreground mb-4">
              Aquí puedes ver todas las licencias y permisos que has solicitado.
            </p>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
              <div className="relative w-full md:w-auto md:flex-grow">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar en mis licencias (tipo, motivo...)"
                  className="pl-8 w-full"
                  value={searchTermMyLicenses}
                  onChange={(e) => setSearchTermMyLicenses(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                onClick={fetchCurrentUserAndLicenses}
                disabled={loadingMyLicenses}
                className="w-full md:w-auto"
              >
                {loadingMyLicenses ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent mr-2"></div>
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Mis Licencias"
                )}
              </Button>
            </div>

            {loadingMyLicenses && myLicenses.length === 0 ? (
              <div className="flex justify-center py-10">
                <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <p className="ml-4 text-muted-foreground self-center">Cargando tus licencias...</p>
              </div>
            ) : !loadingMyLicenses && myLicenses.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Aún no has solicitado ninguna licencia o permiso.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Puedes crear una nueva solicitud usando el botón en la parte superior.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="all" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                  <TabsTrigger value="all">Todas ({filteredMyLicenses.length})</TabsTrigger>
                  <TabsTrigger value="pending">
                    Pendientes ({filteredMyLicenses.filter((l) => normalizeStatus(l.estado || l.status) === "pending").length})
                  </TabsTrigger>
                  <TabsTrigger value="approved">
                    Aprobadas ({filteredMyLicenses.filter((l) => normalizeStatus(l.estado || l.status) === "approved").length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected">
                    Rechazadas ({filteredMyLicenses.filter((l) => normalizeStatus(l.estado || l.status) === "rejected").length})
                  </TabsTrigger>
                </TabsList>

                {["all", "pending", "approved", "rejected"].map((tabValue) => (
                  <TabsContent key={tabValue} value={tabValue} className="space-y-4">
                    {loadingMyLicenses ? (
                      <div className="flex justify-center py-10">
                        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                      </div>
                    ) : filteredMyLicenses.filter((license) => tabValue === "all" || normalizeStatus(license.estado || license.status) === tabValue)
                        .length === 0 ? (
                      <Card>
                        <CardContent className="py-10 text-center">
                          <p className="text-muted-foreground">
                            No tienes licencias {tabValue !== "all" ? `en estado "${tabValue}"` : ""} para mostrar.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredMyLicenses
                        .filter((license) => tabValue === "all" || normalizeStatus(license.estado || license.status) === tabValue)
                        .map((license) => renderLicenseCard(license))
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </section>
        )}

        {!currentUser && !loadingMyLicenses && (
          <div className="mt-16 py-10 border-t border-slate-200 dark:border-slate-700/60 text-center">
            <UserCircle className="h-12 w-12 mx-auto text-slate-400 dark:text-slate-500 mb-4" />
            <p className="text-xl font-medium text-slate-700 dark:text-slate-200 mb-2">¿Ya tienes una cuenta?</p>
            <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
              <a
                href="/auth/login?redirectTo=/consulta-licencias"
                className="font-semibold text-primary hover:underline"
              >
                Inicia sesión
              </a>{" "}
              para ver tu historial de solicitudes y agilizar futuras solicitudes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
