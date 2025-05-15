"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, Upload, X, Download, FileText, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// URL pública de R2 para desarrollo - CORREGIDA
const R2_PUBLIC_URL = "https://pub-373d5369059842f8abf123c212109054.r2.dev"

// Caché global para documentos ya cargados
const documentCache = new Map()

interface DocumentUploadProps {
  userId: string
  category?: string
  documentType?:
    | "identification"
    | "military_booklet"
    | "education_basic"
    | "education_higher"
    | "experience"
    | "language"
    | "profile_picture"
    | "cv_signed"
    | "rut"
    | "bank_certification"
    | "fiscal_background"
    | "disciplinary_background"
    | "criminal_background"
    | "professional_validation"
    | "redam"
    | string
  itemId?: string
  label?: string
  onUploadSuccess?: () => void
}

export function DocumentUpload({
  userId,
  category,
  documentType,
  itemId = "default",
  label,
  onUploadSuccess,
}: DocumentUploadProps) {
  // Determinar la categoría y etiqueta basada en documentType si no se proporciona explícitamente
  const [actualCategory, setActualCategory] = useState<string>(() => {
    if (category) return category

    // Si documentType incluye un índice (ej: education_basic_0), extraer la parte base
    const baseType = documentType?.split("_").slice(0, 2).join("_")

    switch (baseType) {
      case "identification":
        return documentType || "identification"
      case "military_booklet":
        return documentType || "military_booklet"
      case "education_basic":
        return documentType || "education_basic"
      case "education_higher":
        return documentType || "education_higher"
      case "experience":
        return documentType || "experience"
      case "language":
        return documentType || "language"
      case "profile_picture":
        return documentType || "profile_picture"
      case "cv_signed":
        return documentType || "cv_signed"
      case "rut":
        return documentType || "rut"
      case "bank_certification":
        return documentType || "bank_certification"
      case "fiscal_background":
        return documentType || "fiscal_background"
      case "disciplinary_background":
        return documentType || "disciplinary_background"
      case "criminal_background":
        return documentType || "criminal_background"
      case "professional_validation":
        return documentType || "professional_validation"
      case "redam":
        return documentType || "redam"
      default:
        return documentType || "document"
    }
  })

  const [actualLabel, setActualLabel] = useState<string>(() => {
    if (label) return label

    // Si documentType incluye un índice (ej: education_basic_0), extraer la parte base
    const baseType = documentType?.split("_").slice(0, 2).join("_")

    switch (baseType) {
      case "identification":
        return "Subir documento de identidad"
      case "military_booklet":
        return "Subir libreta militar"
      case "education_basic":
        return "Subir diploma o certificado de educación básica"
      case "education_higher":
        return "Subir diploma o certificado de educación superior"
      case "experience":
        return "Subir certificado laboral"
      case "language":
        return "Subir certificado de idioma"
      case "profile_picture":
        return "Subir foto de perfil"
      case "cv_signed":
        return "Subir hoja de vida firmada"
      case "rut":
        return "Subir RUT (DIAN)"
      case "bank_certification":
        return "Subir certificación bancaria"
      case "fiscal_background":
        return "Subir antecedentes fiscales"
      case "disciplinary_background":
        return "Subir antecedentes disciplinarios"
      case "criminal_background":
        return "Subir antecedentes penales"
      case "professional_validation":
        return "Subir validación profesional"
      case "redam":
        return "Subir registro de deudores alimentarios morosos"
      default:
        return "Subir documento"
    }
  })

  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [documentName, setDocumentName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [fileType, setFileType] = useState<string | null>(null)
  const [storagePath, setStoragePath] = useState<string | null>(null)
  const [documentLoaded, setDocumentLoaded] = useState(false)
  const [loadingDocument, setLoadingDocument] = useState(false)
  const [autoLoadFailed, setAutoLoadFailed] = useState(false)
  const supabase = createClient()

  // Control de carga asíncrona
  const mountedRef = useRef(true)
  const loadingRef = useRef(false)
  const cacheKey = `${userId}-${actualCategory}-${itemId}`

  // Función para manejar solicitudes a supabase con protección contra errores de limitación de tasa
  const safeSupabaseRequest = async (requestFn) => {
    try {
      return await requestFn()
    } catch (error) {
      // Si el error es de tipo SyntaxError y contiene "Too Many R", es un error de limitación de tasa
      if (error instanceof SyntaxError && error.message.includes("Too Many R")) {
        console.warn("Rate limit detected, returning empty result instead of throwing")
        // Devolver un resultado vacío en lugar de lanzar un error
        return { data: null, error: null }
      }
      throw error
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Validar tamaño (máximo 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("El archivo es demasiado grande. El tamaño máximo es 5MB.")
        return
      }

      setFile(selectedFile)
      setFileType(selectedFile.type)
      setError(null)
    }
  }

  // Función para cargar documentos utilizando caché y manejo de errores mejorado
  const loadDocumentData = useCallback(async () => {
    // Verificar si ya estamos cargando o si no hay userId/category
    if (loadingRef.current || !userId || !actualCategory) return null

    // Verificar si el documento ya está en caché
    if (documentCache.has(cacheKey)) {
      return documentCache.get(cacheKey)
    }

    loadingRef.current = true

    try {
      // Estrategia simplificada: buscar documento por usuario, tipo y item_id
      const { data, error } = await supabase
        .from("documents")
        .select("name, url, storage_path")
        .eq("user_id", userId)
        .eq("type", actualCategory)
        .eq("item_id", itemId)
        .limit(1)

      if (error) {
        console.error("Error al buscar documento:", error)
        return null
      }

      if (data && data.length > 0) {
        // Guardar en caché
        documentCache.set(cacheKey, data[0])
        return data[0]
      }

      // Guardar el resultado nulo en caché también
      documentCache.set(cacheKey, null)
      return null
    } catch (error) {
      console.error("Error al cargar documento:", error)
      return null
    } finally {
      loadingRef.current = false
    }
  }, [userId, actualCategory, itemId, supabase, cacheKey])

  // Función para cargar el documento bajo demanda
  const handleLoadDocument = async () => {
    if (loadingDocument) return

    try {
      setLoadingDocument(true)
      setError(null)

      const data = await loadDocumentData()

      if (!mountedRef.current) return

      if (data) {
        setUploadedUrl(data.url)
        setDocumentName(data.name)
        setStoragePath(data.storage_path)

        // Crear URL pública a partir de storage_path de manera más robusta
        if (data.storage_path) {
          try {
            const publicUrlValue = `${R2_PUBLIC_URL}/${data.storage_path}`
            console.log("URL pública generada para documento existente:", publicUrlValue)
            setPublicUrl(publicUrlValue)
          } catch (error) {
            console.error("Error al generar URL pública:", error)
            setPublicUrl(null)
          }
        } else if (data.url && data.url.includes(R2_PUBLIC_URL)) {
          // Si la URL ya es una URL pública de R2, usarla directamente
          setPublicUrl(data.url)
        }

        // Inferir el tipo de contenido a partir de la URL
        if (data.url) {
          setFileType(inferContentTypeFromUrl(data.url))
        }

        setDocumentLoaded(true)
        setAutoLoadFailed(false)
      } else {
        console.log("No se encontró ningún documento para:", { actualCategory, itemId, userId })
        setAutoLoadFailed(true)
      }
    } catch (error) {
      console.error("Error al cargar documento:", error)
      setAutoLoadFailed(true)
    } finally {
      setLoadingDocument(false)
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Por favor, selecciona un archivo primero.")
      return
    }

    if (!actualCategory) {
      setError("La categoría del documento es requerida.")
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Simular progreso inicial
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 30) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 5
        })
      }, 200)

      try {
        // Generar un nombre único para el archivo que incluya la categoría y el itemId
        const fileExt = file.name.split(".").pop()

        // Esquema de carpetas consistente que evita colisiones
        const uniqueFileName = `${userId}/${actualCategory}/${itemId}_${Date.now()}.${fileExt}`
        console.log("Subiendo archivo con nombre único:", uniqueFileName)

        // Crear un FormData para enviar el archivo directamente
        const formData = new FormData()
        formData.append("file", file)
        formData.append("userId", userId)
        formData.append("category", actualCategory)
        formData.append("itemId", itemId)
        formData.append("fileName", uniqueFileName) // Usar el nombre único generado
        formData.append("contentType", file.type)

        // Enviar el archivo
        const response = await fetch("/api/upload-direct", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          let errorMessage = "Error al subir el archivo"
          try {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            // Si no es JSON válido, intentar obtener el texto
            try {
              const errorText = await response.text()
              errorMessage = errorText || errorMessage
            } catch (e2) {
              // Si todo falla, usar el mensaje genérico
            }
          }
          throw new Error(errorMessage)
        }

        // Intentar analizar la respuesta como JSON
        let uploadResult
        try {
          uploadResult = await response.json()
        } catch (e) {
          throw new Error("Error al analizar la respuesta del servidor")
        }

        const { url, key, fileName, public_url } = uploadResult
        console.log("Respuesta de la API:", { url, key, fileName, public_url })

        // Actualizar progreso
        setProgress(70)

        // Crear URL pública correctamente
        const publicUrlValue = public_url || (key ? `${R2_PUBLIC_URL}/${key}` : null)
        console.log("URL pública generada:", publicUrlValue)
        setPublicUrl(publicUrlValue)

        // Actualizar el caché con el nuevo documento
        documentCache.set(cacheKey, {
          name: fileName || file.name,
          url: url,
          storage_path: key,
        })

        clearInterval(progressInterval)
        setProgress(100)
        setUploadedUrl(url)
        setDocumentName(fileName || file.name)
        setFileType(file.type)
        setStoragePath(key)
        setFile(null)
        setDocumentLoaded(true)
        setAutoLoadFailed(false)

        // Resetear el input de archivo
        const fileInput = document.getElementById(`file-upload-${actualCategory}`) as HTMLInputElement
        if (fileInput) fileInput.value = ""

        // Notificar que la carga fue exitosa
        if (onUploadSuccess) {
          onUploadSuccess()
        }
      } catch (error: any) {
        console.error("Error al subir el documento:", error)
        setError(error.message || "Error al subir el documento")
      }
    } catch (error: any) {
      console.error("Error al subir el documento:", error)
      setError(error.message || "Error al subir el documento")
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!uploadedUrl && !storagePath) {
      setError("No hay documento para eliminar")
      return
    }

    try {
      setError(null)

      // Si tenemos la ruta de almacenamiento, intentar eliminar el archivo
      if (storagePath) {
        try {
          // Llamar a la API para eliminar el archivo de R2
          const deleteResponse = await fetch("/api/delete-file", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              key: storagePath,
            }),
          })

          if (!deleteResponse.ok) {
            console.warn("Error al eliminar archivo de R2:", await deleteResponse.text())
          }
        } catch (deleteError) {
          // Capturar cualquier error pero continuar con la eliminación del registro
          console.error("Error al eliminar archivo de R2:", deleteError)
        }
      }

      // Eliminar el documento de la base de datos
      const { error: deleteError } = await supabase
        .from("documents")
        .delete()
        .eq("user_id", userId)
        .eq("type", actualCategory)
        .eq("item_id", itemId)

      if (deleteError) {
        console.error("Error al eliminar documento de la base de datos:", deleteError)
        throw new Error("Error al eliminar el documento de la base de datos")
      }

      // Eliminar del caché
      documentCache.delete(cacheKey)

      setUploadedUrl(null)
      setPublicUrl(null)
      setDocumentName(null)
      setFileType(null)
      setStoragePath(null)
      setDocumentLoaded(false)
      setAutoLoadFailed(false)

      // Notificar que la eliminación fue exitosa
      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (error: any) {
      console.error("Error en handleRemove:", error)
      setError(error.message || "Error al eliminar el documento")
    }
  }

  // Función para inferir el tipo de contenido a partir de la URL
  const inferContentTypeFromUrl = (url: string): string => {
    const extension = url.split(".").pop()?.toLowerCase() || ""

    switch (extension) {
      case "pdf":
        return "application/pdf"
      case "jpg":
        return "image/jpeg"
      case "png":
        return "image/png"
      case "gif":
        return "image/gif"
      case "webp":
        return "image/webp"
      case "svg":
        return "image/svg+xml"
      case "doc":
        return "application/msword"
      case "xls":
        return "application/vnd.ms-excel"
      case "ppt":
        return "application/vnd.ms-powerpoint"
      case "txt":
        return "text/plain"
      default:
        return "application/octet-stream"
    }
  }

  // Función para verificar si la URL es una imagen
  const isImageUrl = (url: string | null): boolean => {
    if (!url) return false

    // Verificar por tipo MIME
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg"]
    return (
      imageExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
      fileType?.startsWith("image/") ||
      false ||
      actualCategory === "profile_picture"
    )
  }

  // Función para verificar si la URL es un PDF
  const isPdfUrl = (url: string | null): boolean => {
    if (!url) return false

    // Verificar por tipo MIME
    return url.toLowerCase().includes(".pdf") || fileType === "application/pdf"
  }

  const downloadDocument = (url: string, filename: string) => {
    try {
      setPreviewLoading(true)

      // Verificar si la URL es válida
      if (!url) {
        setError("URL de descarga no disponible")
        setPreviewLoading(false)
        return
      }

      // Usar la URL pública si está disponible, asegurándose de que sea la correcta
      const downloadUrl = publicUrl || url
      console.log("URL de descarga:", downloadUrl)

      // Método directo: Usar el elemento <a> para descargar
      const link = window.document.createElement("a")
      link.href = downloadUrl
      link.download = filename || "documento"
      link.target = "_blank"

      // Añadir al DOM, hacer clic y luego eliminar
      window.document.body.appendChild(link)
      link.click()

      // Limpiar
      setTimeout(() => {
        window.document.body.removeChild(link)
        setPreviewLoading(false)
      }, 100)
    } catch (error) {
      console.error("Error al descargar el documento:", error)
      setError("Error al descargar el documento. Intente nuevamente.")
      setPreviewLoading(false)

      // Método alternativo si falla todo lo anterior
      window.open(publicUrl || url, "_blank")
    }
  }

  // Función para abrir el documento en una nueva pestaña
  const openDocumentInNewTab = (url: string) => {
    if (!url) {
      setError("URL no disponible")
      return
    }

    // Usar la URL pública si está disponible
    const openUrl = publicUrl || url
    window.open(openUrl, "_blank")
  }

  // Función para obtener el título del documento basado en la categoría
  const getDocumentTitle = (category: string): string => {
    // Extraer la parte base del tipo de documento (sin el índice)
    const baseType = category.split("_").slice(0, 2).join("_")

    switch (baseType) {
      case "military_booklet":
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
      default:
        return "Documento"
    }
  }

  // Sistema de cola para cargar documentos de forma secuencial
  useEffect(() => {
    // Evitar caídas de memoria al desmontar
    mountedRef.current = true

    // Función para cargar el documento
    const loadThisDocument = async () => {
      if (!mountedRef.current || !userId || !actualCategory) return

      try {
        setLoading(true)
        const data = await loadDocumentData()

        if (!mountedRef.current) return

        if (data) {
          setUploadedUrl(data.url)
          setDocumentName(data.name)
          setStoragePath(data.storage_path)

          if (data.storage_path) {
            setPublicUrl(`${R2_PUBLIC_URL}/${data.storage_path}`)
          } else if (data.url && data.url.includes(R2_PUBLIC_URL)) {
            setPublicUrl(data.url)
          }

          if (data.url) {
            setFileType(inferContentTypeFromUrl(data.url))
          }

          setDocumentLoaded(true)
        } else {
          setAutoLoadFailed(true)
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error("Error loading document data:", error)
          setAutoLoadFailed(true)
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    // Cargar el documento con un pequeño retraso para evitar demasiadas solicitudes simultáneas
    const timeoutId = setTimeout(() => {
      loadThisDocument()
    }, 300)

    return () => {
      mountedRef.current = false
      clearTimeout(timeoutId)
    }
  }, [loadDocumentData, userId, actualCategory])

  // Generar un ID único para el input de archivo
  const fileInputId = `file-upload-${actualCategory}`

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="p-3 border rounded-md animate-pulse bg-muted/50 mb-4">
          <div className="h-6 w-3/4 bg-muted rounded"></div>
        </div>
      ) : null}

      {autoLoadFailed && !uploadedUrl ? (
        <div className="flex justify-center p-4 border rounded-md mb-4">
          <Button variant="outline" onClick={handleLoadDocument} disabled={loadingDocument} className="w-full">
            {loadingDocument ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Cargando documento...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" /> Cargar documento existente
              </>
            )}
          </Button>
        </div>
      ) : null}

      {uploadedUrl ? (
        <div className="flex flex-col p-3 border rounded-md mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{getDocumentTitle(actualCategory)}</p>
                <p className="text-xs text-muted-foreground">Categoría: {actualCategory}</p>
                <p className="text-xs text-muted-foreground">ID: {itemId}</p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              className="hover:bg-red-600"
              aria-label="Eliminar documento"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm text-muted-foreground">{documentName}</p>
            <p className="text-xs text-muted-foreground truncate">Ruta: {storagePath}</p>
            <p className="text-xs text-muted-foreground truncate">URL: {publicUrl ? publicUrl : "No disponible"}</p>
          </div>
          <div className="flex justify-between mt-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadDocument(publicUrl || uploadedUrl, documentName || "documento")}
            >
              <Download className="h-4 w-4 mr-2" /> Descargar
            </Button>
            {publicUrl && (
              <Button variant="outline" size="sm" onClick={() => window.open(publicUrl, "_blank")}>
                <FileText className="h-4 w-4 mr-2" /> Ver
              </Button>
            )}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor={fileInputId}>{actualLabel}</Label>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              id={fileInputId}
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploading}
            />
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
              disabled={uploading}
              onClick={() => {
                const fileInput = window.document.getElementById(fileInputId)
                if (fileInput) {
                  fileInput.click()
                }
              }}
            >
              <Upload className="h-4 w-4 mr-2" />
              {file ? file.name : "Seleccionar archivo"}
            </Button>
          </div>

          <Button onClick={handleUpload} disabled={!file || uploading} size="sm">
            {uploading ? "Subiendo..." : "Subir"}
          </Button>
        </div>

        {uploading && <Progress value={progress} className="h-2" />}

        <p className="text-xs text-muted-foreground">Tamaño máximo: 5MB</p>
      </div>

      {/* Diálogo para visualizar documentos */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {getDocumentTitle(actualCategory)}: {documentName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-auto p-2">
            {isImageUrl(uploadedUrl) ? (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src={publicUrl || uploadedUrl || "/placeholder.svg"}
                  alt={documentName || "Documento"}
                  className="max-w-full max-h-full object-contain mx-auto"
                  onError={(e: any) => {
                    console.error("Error al cargar imagen:", publicUrl || uploadedUrl)
                    e.target.onerror = null
                    e.target.src = "/placeholder.svg"
                  }}
                />
              </div>
            ) : isPdfUrl(uploadedUrl) ? (
              <div className="flex flex-col items-center justify-center p-8">
                <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  La previsualización de PDF no está disponible. Por favor, descarga el documento.
                </p>
                <Button
                  variant="outline"
                  onClick={() => downloadDocument(publicUrl || uploadedUrl || "", documentName || "documento")}
                >
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
            <Button
              variant="outline"
              onClick={() => downloadDocument(publicUrl || uploadedUrl || "", documentName || "documento")}
              disabled={previewLoading}
            >
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
