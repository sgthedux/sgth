"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { FileText, CheckCircle, AlertCircle, Download, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUpload } from "@/components/profile/document-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// URL pública de R2 para desarrollo - CORREGIDA
const R2_PUBLIC_URL = "https://pub-373d5369059842f8abf123c212109054.r2.dev"

interface DocumentsPreviewProps {
  userId: string
}

// Define los tipos de documentos requeridos por cada formulario
const requiredDocuments = {
  personal: [
    { type: "identification", label: "Documento de Identidad", required: true },
    { type: "profile_picture", label: "Foto de Perfil", required: true },
    { type: "military_service", label: "Libreta Militar", required: false },
  ],
  education: [
    { type: "education_basic", label: "Certificado de Educación Básica", required: true },
    { type: "education_higher", label: "Certificado de Educación Superior", required: false },
  ],
  experience: [{ type: "experience", label: "Certificado Laboral", required: true }],
  languages: [{ type: "language", label: "Certificado de Idioma", required: false }],
  legal: [
    { type: "cv_signed", label: "Hoja de Vida Firmada", required: true },
    { type: "rut", label: "RUT (DIAN)", required: true },
    { type: "bank_certification", label: "Certificación Bancaria", required: true },
    { type: "fiscal_background", label: "Antecedentes Fiscales", required: true },
    { type: "disciplinary_background", label: "Antecedentes Disciplinarios", required: true },
    { type: "criminal_background", label: "Antecedentes Penales", required: true },
    { type: "professional_validation", label: "Validación Profesional", required: true },
    { type: "redam", label: "Registro de Deudores Alimentarios Morosos (REDAM)", required: false },
  ],
}

export function DocumentsPreview({ userId }: DocumentsPreviewProps) {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  // Referencia para controlar el tiempo entre cargas
  const lastLoadTimeRef = useRef<number>(0)
  const loadingInProgressRef = useRef<boolean>(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Función para actualizar la lista de documentos
  const refreshDocuments = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  // Función para cargar documentos con manejo de errores mejorado
  const loadDocuments = async () => {
    // Evitar cargas simultáneas
    if (loadingInProgressRef.current) return

    // Limitar la frecuencia de carga (mínimo 2 segundos entre cargas)
    const now = Date.now()
    const timeSinceLastLoad = now - lastLoadTimeRef.current
    if (timeSinceLastLoad < 2000 && lastLoadTimeRef.current !== 0) {
      // Si se intenta cargar demasiado rápido, programar una carga diferida
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = setTimeout(() => {
        loadDocuments()
      }, 2000 - timeSinceLastLoad)
      return
    }

    // Actualizar referencias
    loadingInProgressRef.current = true
    lastLoadTimeRef.current = now

    if (!userId) {
      loadingInProgressRef.current = false
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Intentar obtener los documentos con reintentos
      let attempts = 0
      let success = false
      let data = null
      let fetchError = null

      while (attempts < 3 && !success) {
        try {
          console.log("Cargando documentos para el usuario:", userId)
          const response = await supabase
            .from("documents")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })

          if (response.error) {
            fetchError = response.error
            throw response.error
          }

          data = response.data
          console.log("Documentos cargados:", data?.length || 0)
          success = true
        } catch (err: any) {
          attempts++
          fetchError = err
          console.error(`Intento ${attempts} fallido:`, err)

          // Si es un error de "Too Many Requests", esperar más tiempo
          if (err.message && err.message.includes("Too Many")) {
            await new Promise((resolve) => setTimeout(resolve, 2000 * attempts))
          } else if (attempts < 3) {
            // Para otros errores, esperar menos tiempo
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }
        }
      }

      if (!success) {
        throw fetchError || new Error("No se pudieron cargar los documentos después de varios intentos")
      }

      // Añadir URLs públicas calculadas a los documentos
      const documentsWithPublicUrls =
        data?.map((doc: any) => {
          let calculatedPublicUrl = null
          try {
            if (doc.storage_path) {
              calculatedPublicUrl = `${R2_PUBLIC_URL}/${doc.storage_path}`
            } else if (doc.url && doc.url.includes(R2_PUBLIC_URL)) {
              calculatedPublicUrl = doc.url
            }
          } catch (error) {
            console.error("Error al calcular URL pública:", error)
          }

          return {
            ...doc,
            calculatedPublicUrl,
          }
        }) || []

      console.log("Documentos procesados con URLs:", documentsWithPublicUrls.length)
      setDocuments(documentsWithPublicUrls)
    } catch (error: any) {
      console.error("Error al cargar documentos:", error)

      // Mensaje de error más amigable para el usuario
      if (error.message && error.message.includes("Too Many")) {
        setError("Demasiadas solicitudes. Por favor, espera un momento e intenta nuevamente.")
      } else if (error.message && error.message.includes("JSON")) {
        setError("Error al procesar la respuesta del servidor. Intenta recargar la página.")
      } else {
        setError(error.message || "Error al cargar documentos")
      }
    } finally {
      setLoading(false)
      loadingInProgressRef.current = false
    }
  }

  // Cargar documentos del usuario
  useEffect(() => {
    loadDocuments()

    // Limpiar timeouts al desmontar
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [userId, refreshTrigger])

  // Suscribirse a cambios en la tabla de documentos
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel("documents_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Cambio detectado en documentos:", payload.eventType)
          // En lugar de recargar todos los documentos, actualizar la lista localmente
          if (payload.eventType === "INSERT") {
            // Añadir el nuevo documento a la lista
            setDocuments((prev) => {
              const newDoc = {
                ...payload.new,
                calculatedPublicUrl: payload.new.storage_path ? `${R2_PUBLIC_URL}/${payload.new.storage_path}` : null,
              }
              return [newDoc, ...prev]
            })
          } else if (payload.eventType === "DELETE") {
            // Eliminar el documento de la lista
            setDocuments((prev) => prev.filter((doc) => doc.id !== payload.old.id))
          } else if (payload.eventType === "UPDATE") {
            // Actualizar el documento en la lista
            setDocuments((prev) =>
              prev.map((doc) => {
                if (doc.id === payload.new.id) {
                  return {
                    ...payload.new,
                    calculatedPublicUrl: payload.new.storage_path
                      ? `${R2_PUBLIC_URL}/${payload.new.storage_path}`
                      : null,
                  }
                }
                return doc
              }),
            )
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Filtrar documentos por tipo según la pestaña activa
  const getFilteredDocuments = () => {
    if (activeTab === "all") return documents

    const docTypes = requiredDocuments[activeTab as keyof typeof requiredDocuments]
      .map((doc) => doc.type)
      .filter(Boolean)

    return documents.filter((doc) => docTypes.some((type) => doc.type.startsWith(type)))
  }

  // Verificar si un documento requerido ya ha sido subido
  const isDocumentUploaded = (type: string) => {
    return documents.some((doc) => doc.type.startsWith(type))
  }

  // Obtener documentos faltantes por categoría
  const getMissingDocuments = (category: keyof typeof requiredDocuments) => {
    return requiredDocuments[category].filter((doc) => doc.required && !isDocumentUploaded(doc.type))
  }

  // Contar documentos por categoría
  const countDocumentsByCategory = (category: keyof typeof requiredDocuments) => {
    const docTypes = requiredDocuments[category].map((doc) => doc.type)
    return documents.filter((doc) => docTypes.some((type) => doc.type.startsWith(type))).length
  }

  // Contar documentos obligatorios pendientes
  const countMissingRequiredDocuments = () => {
    let count = 0
    for (const category in requiredDocuments) {
      if (requiredDocuments.hasOwnProperty(category)) {
        count += getMissingDocuments(category as keyof typeof requiredDocuments).length
      }
    }
    return count
  }

  // Función para verificar si la URL es una imagen
  const isImageUrl = (url: string | null, docType?: string): boolean => {
    if (!url) return false

    try {
      // Verificar por extensión de archivo
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]
      return (
        imageExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
        (docType && docType.startsWith("profile_picture"))
      )
    } catch (error) {
      console.error("Error al verificar URL de imagen:", error)
      return false
    }
  }

  // Función para verificar si la URL es un PDF
  const isPdfUrl = (url: string | null): boolean => {
    if (!url) return false

    // Verificar por extensión de archivo
    return url.toLowerCase().includes(".pdf")
  }

  // Función para descargar un documento
  const downloadDocument = (doc: any) => {
    try {
      setPreviewLoading(true)

      // Verificar si la URL es válida
      if (!doc || (!doc.url && !doc.calculatedPublicUrl)) {
        setError("URL de descarga no disponible")
        setPreviewLoading(false)
        return
      }

      // Usar la URL pública calculada si está disponible
      const downloadUrl = doc.calculatedPublicUrl || doc.url
      const filename = doc.name || "documento"

      // Método directo: Usar el elemento <a> para descargar
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      link.target = "_blank"

      // Añadir al DOM, hacer clic y luego eliminar
      document.body.appendChild(link)
      link.click()

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(link)
        setPreviewLoading(false)
      }, 100)
    } catch (error) {
      console.error("Error al descargar el documento:", error)
      setError("Error al descargar el documento. Intente nuevamente.")
      setPreviewLoading(false)

      // Método alternativo si falla todo lo anterior
      if (doc && (doc.calculatedPublicUrl || doc.url)) {
        window.open(doc.calculatedPublicUrl || doc.url, "_blank")
      }
    }
  }

  // Función para abrir el documento en una nueva pestaña
  const openDocumentInNewTab = (doc: any) => {
    if (!doc || (!doc.url && !doc.calculatedPublicUrl)) {
      setError("URL no disponible")
      return
    }

    // Usar la URL pública calculada si está disponible
    const openUrl = doc.calculatedPublicUrl || doc.url
    window.open(openUrl, "_blank")
  }

  // Función para manejar la subida exitosa de un documento
  const handleDocumentUploaded = () => {
    refreshDocuments()
    router.refresh()
  }

  // Función para abrir el documento en un diálogo
  const openDocumentDialog = (doc: any) => {
    setSelectedDocument(doc)
    setIsDialogOpen(true)
    setPreviewLoading(false) // Inicialmente no mostrar carga
  }

  const filteredDocuments = getFilteredDocuments()

  // Función para recargar manualmente los documentos
  const handleManualRefresh = () => {
    refreshDocuments()
  }

  // Obtener el título de la categoría
  const getCategoryTitle = (category: string): string => {
    switch (category) {
      case "personal":
        return "Documentos Personales"
      case "education":
        return "Documentos de Educación"
      case "experience":
        return "Documentos de Experiencia"
      case "languages":
        return "Documentos de Idiomas"
      case "legal":
        return "Documentos Legales y Administrativos"
      default:
        return "Documentos"
    }
  }

  // Obtener el nombre del documento basado en su tipo
  const getDocumentName = (docType: string): string => {
    switch (docType) {
      case "cv_signed":
        return "Hoja de Vida Firmada"
      case "rut":
        return "RUT (DIAN)"
      case "bank_certification":
        return "Certificación Bancaria"
      case "fiscal_background":
        return "Antecedentes Fiscales"
      case "disciplinary_background":
        return "Antecedentes Disciplinarios"
      case "criminal_background":
        return "Antecedentes Penales"
      case "professional_validation":
        return "Validación Profesional"
      case "redam":
        return "Registro de Deudores Alimentarios Morosos (REDAM)"
      case "military_service":
        return "Libreta Militar"
      case "identification":
        return "Documento de Identidad"
      case "education_basic":
        return "Certificado de Educación Básica"
      case "education_higher":
        return "Certificado de Educación Superior"
      case "experience":
        return "Certificado Laboral"
      case "language":
        return "Certificado de Idioma"
      case "profile_picture":
        return "Foto de Perfil"
      default:
        return "Documento"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Mis Documentos</h2>
          <p className="text-muted-foreground">
            {documents.length} documento(s) subido(s), {countMissingRequiredDocuments()} obligatorio(s) pendiente(s)
          </p>
        </div>
        <Button variant="outline" onClick={handleManualRefresh} disabled={loading}>
          {loading ? "Cargando..." : "Actualizar"}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="all">Todos ({documents.length})</TabsTrigger>
          {Object.keys(requiredDocuments).map((category) => {
            const count = countDocumentsByCategory(category as keyof typeof requiredDocuments)
            const total = requiredDocuments[category as keyof typeof requiredDocuments].length
            return (
              <TabsTrigger key={category} value={category}>
                {category === "personal"
                  ? "Personales"
                  : category === "education"
                    ? "Educación"
                    : category === "experience"
                      ? "Experiencia"
                      : category === "languages"
                        ? "Idiomas"
                        : "Legales"}{" "}
                ({count}/{total})
              </TabsTrigger>
            )
          })}
        </TabsList>

        {Object.keys(requiredDocuments).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{getCategoryTitle(category)}</CardTitle>
                {category === "legal" && (
                  <Alert className="mt-2">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Estos documentos son necesarios para completar tu proceso. Si no los has subido, aparecerán como
                      pendientes.
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requiredDocuments[category as keyof typeof requiredDocuments].map((docType, idx) => {
                    const isUploaded = isDocumentUploaded(docType.type)
                    const uploadedDoc = documents.find((doc) => doc.type.startsWith(docType.type))

                    return (
                      <Card
                        key={idx}
                        className={`border ${
                          isUploaded ? "border-green-200" : docType.required ? "border-red-200" : "border-gray-200"
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">{docType.label}</CardTitle>
                            {isUploaded ? (
                              <Badge className="bg-green-500">Subido</Badge>
                            ) : docType.required ? (
                              <Badge variant="destructive">Pendiente</Badge>
                            ) : (
                              <Badge variant="outline">Opcional</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          {isUploaded && uploadedDoc ? (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center text-sm text-green-600">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Documento subido correctamente
                              </div>

                              <div className="h-40 overflow-hidden rounded-md bg-muted/20 flex items-center justify-center">
                                {isImageUrl(uploadedDoc.url, uploadedDoc.type) ? (
                                  <img
                                    src={uploadedDoc.calculatedPublicUrl || uploadedDoc.url || "/placeholder.svg"}
                                    alt={uploadedDoc.name}
                                    className="h-full w-full object-contain"
                                    onError={(e: any) => {
                                      e.target.onerror = null
                                      e.target.src = "/placeholder.svg"
                                    }}
                                  />
                                ) : isPdfUrl(uploadedDoc.url) ? (
                                  <div className="flex flex-col items-center justify-center">
                                    <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">Documento PDF</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center">
                                    <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">Vista previa no disponible</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-end mt-2">
                                <Button variant="outline" size="sm" onClick={() => downloadDocument(uploadedDoc)}>
                                  <Download className="h-4 w-4 mr-2" /> Descargar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <AlertCircle className="h-4 w-4 mr-2" />
                              {docType.required ? "Documento pendiente por subir" : "Documento opcional"}
                            </div>
                          )}
                        </CardContent>
                        <CardFooter>
                          {!isUploaded && (
                            <DocumentUpload
                              userId={userId}
                              category={docType.type}
                              label={`Subir ${docType.label}`}
                              onUploadSuccess={handleDocumentUploaded}
                            />
                          )}
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <span className="ml-3">Cargando documentos...</span>
              </div>
            ) : filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <Card key={doc.id} className="overflow-hidden flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{getDocumentName(doc.type)}</CardTitle>
                    <p className="text-sm text-muted-foreground truncate">{doc.name}</p>
                  </CardHeader>
                  <CardContent className="pb-2 flex-grow">
                    <div className="h-40 overflow-hidden rounded-md bg-muted/20 flex items-center justify-center">
                      {isImageUrl(doc.url, doc.type) ? (
                        <img
                          src={doc.calculatedPublicUrl || doc.url || "/placeholder.svg"}
                          alt={doc.name}
                          className="h-full w-full object-contain"
                          onError={(e: any) => {
                            console.log("Error al cargar imagen:", doc.calculatedPublicUrl || doc.url)
                            e.target.onerror = null
                            e.target.src = "/placeholder.svg"
                          }}
                        />
                      ) : isPdfUrl(doc.url) ? (
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Documento PDF</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Vista previa no disponible</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center border-t bg-muted/10">
                    <Badge
                      variant={
                        doc.status === "Aprobado" ? "default" : doc.status === "Rechazado" ? "destructive" : "outline"
                      }
                    >
                      {doc.status}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => downloadDocument(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 bg-muted/20 rounded-lg">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay documentos subidos</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo para visualizar documentos */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {getDocumentName(selectedDocument?.type || "")}: {selectedDocument?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-auto p-2">
            {previewLoading ? (
              <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : isImageUrl(selectedDocument?.url, selectedDocument?.type) ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={selectedDocument?.calculatedPublicUrl || selectedDocument?.url || "/placeholder.svg"}
                  alt={selectedDocument?.name}
                  className="max-w-full max-h-full object-contain mx-auto"
                  onError={(e: any) => {
                    console.error(
                      "Error al cargar imagen en diálogo:",
                      selectedDocument?.calculatedPublicUrl || selectedDocument?.url,
                    )
                    e.target.onerror = null
                    e.target.src = "/placeholder.svg"
                  }}
                />
              </div>
            ) : isPdfUrl(selectedDocument?.url) ? (
              <div className="flex flex-col items-center justify-center p-8">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  La previsualización de PDF no está disponible. Por favor, descarga el documento.
                </p>
                <Button variant="outline" onClick={() => downloadDocument(selectedDocument)}>
                  <Download className="h-4 w-4 mr-2" /> Descargar
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Vista previa no disponible</p>
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => downloadDocument(selectedDocument)} disabled={previewLoading}>
              <Download className="h-4 w-4 mr-2" /> Descargar
            </Button>
            <Button variant="default" onClick={() => setIsDialogOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
