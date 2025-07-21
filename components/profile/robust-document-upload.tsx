"use client"

import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, Upload, X, FileText, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { usePendingDocuments } from "@/hooks/use-pending-documents"

interface RobustDocumentUploadProps {
  userId: string
  documentType: string
  formType: string
  recordId?: string | number  // ID real del registro, no el índice
  itemIndex?: number          // Solo para backward compatibility
  label?: string
  onUploadSuccess?: (documentUrl: string) => void
  onUploadError?: (error: string) => void
  className?: string
  required?: boolean
  onPendingUpload?: (tempId: string) => void  // Callback para documentos pendientes
  initialDocumentUrl?: string | null  // URL del documento si ya existe
  ref?: React.Ref<{ getPendingTempId: () => string | null; getDocumentUrl: () => string | null }>
}

export const RobustDocumentUpload = forwardRef<
  { getPendingTempId: () => string | null; getDocumentUrl: () => string | null },
  RobustDocumentUploadProps
>(function RobustDocumentUpload({
  userId,
  documentType,
  formType,
  recordId,
  itemIndex,
  label = "Subir documento",
  onUploadSuccess,
  onUploadError,
  className = "",
  required = false,
  onPendingUpload,
  initialDocumentUrl
}, ref) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [documentName, setDocumentName] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRecordId, setLastRecordId] = useState<string | number | null>(null)
  const [pendingTempId, setPendingTempId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Usar el hook de documentos pendientes
  const { savePendingDocument, getPendingDocumentsByForm, removePendingDocumentByItemId } = usePendingDocuments()

  // Evitar problemas de hidratación
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Manejar initialDocumentUrl - cargar documento existente desde el formulario
  useEffect(() => {
    console.log("🔄 Effect initialDocumentUrl:", { 
      initialDocumentUrl, 
      uploadedUrl, 
      isMounted,
      hasInitialDoc: !!initialDocumentUrl,
      hasUploadedDoc: !!uploadedUrl
    })
    
    if (initialDocumentUrl && !uploadedUrl && isMounted) {
      console.log("🔄 Cargando documento inicial desde formulario:", initialDocumentUrl)
      setUploadedUrl(initialDocumentUrl)
      setDocumentName("Documento existente")
      setSuccess(true)
      setError(null) // Limpiar cualquier error
    }
  }, [initialDocumentUrl, uploadedUrl, isMounted])

  // Resetear estado cuando cambie initialDocumentUrl
  useEffect(() => {
    if (!initialDocumentUrl && uploadedUrl) {
      console.log("🔄 Reseteando estado - no hay documento inicial")
      setUploadedUrl(null)
      setDocumentName(null)
      setSuccess(false)
      setError(null)
    }
  }, [initialDocumentUrl, uploadedUrl])

  // Verificar si hay documentos pendientes al cargar - DESHABILITADO
  useEffect(() => {
    // SOLUCIÓN TEMPORAL: Deshabilitamos la carga de documentos pendientes
    // para evitar que aparezcan documentos de otros items
    // Solo cargar documentos si ya tiene un recordId específico
    if (isMounted && recordId) {
      // Lógica existente para cargar documentos de registros existentes
      // (esto funciona bien)
    }
    // NO cargar documentos pendientes para nuevos items
  }, [isMounted, recordId, formType, documentType, itemIndex])

  // Generar item_id consistente
  const generateItemId = useCallback(() => {
    if (!recordId) return null
    
    // Si el recordId es un tempId (comienza con tipo_), usarlo directamente
    if (typeof recordId === 'string' && recordId.includes('_')) {
      return recordId
    }
    
    if (formType === "education") {
      if (documentType === "basic_education_certificate") {
        return `basic_${recordId}`
      } else if (documentType === "higher_education_diploma") {
        return `higher_${recordId}`
      } else {
        return `${formType}_${recordId}`
      }
    } else if (formType === "experience") {
      return `experience_${recordId}`
    } else if (formType === "language") {
      return `language_${recordId}`
    }
    
    return `${formType}_${recordId}`
  }, [recordId, formType, documentType])

  useEffect(() => {
    if (!isMounted || !userId || !documentType || !formType) return
    
    const loadExistingDocument = async () => {
      // Prevenir múltiples cargas simultáneas
      if (isLoading) return
      
      // Solo cargar si el recordId ha cambiado
      if (recordId && recordId === lastRecordId) return
      
      // Solo cargar si no tenemos documento ya cargado para este recordId
      if (uploadedUrl && success && recordId === lastRecordId) return
      
      setIsLoading(true)
      
      try {
        const itemId = generateItemId()
        
        // Solo hacer la consulta si tenemos un itemId válido y un ID real (no tempId)
        if (!itemId) {
          console.log("No se pudo generar itemId, esperando recordId...", { recordId, formType, documentType })
          setLastRecordId(recordId || null)
          return
        }

        // Si es un tempId, no hacer consulta a la BD - esperar a que se guarde primero
        if (typeof recordId === 'string' && recordId.includes('_') && !uploadedUrl) {
          console.log("Esperando ID real para", recordId, "- no consultando BD para tempId")
          setLastRecordId(recordId || null)
          return
        }

        console.log("Generated itemId for check:", itemId, "from recordId:", recordId, "formType:", formType, "documentType:", documentType)

        const queryParams = new URLSearchParams({
          userId,
          documentType,
          formType,
          itemId
        })

        const checkUrl = `/api/documents/check-robust?${queryParams}`
        console.log("Consultando documentos existentes (robust):", checkUrl)
        
        const response = await fetch(checkUrl)
        
        if (response.ok) {
          const data = await response.json()
          console.log("Respuesta de documentos existentes (robust):", data)
          
          if (data.exists && data.url) {
            setUploadedUrl(data.url)
            setDocumentName(data.name || 'Documento subido')
            setSuccess(true)
            console.log("Documento existente encontrado:", data.url)
          }
          
          // Actualizar el último recordId consultado
          setLastRecordId(recordId || null)
        } else {
          console.log("No se encontró documento existente o error en la consulta")
          setLastRecordId(recordId || null) // Marcar como consultado aunque no tenga documento
        }
      } catch (error) {
        console.error("Error loading existing document:", error)
        setLastRecordId(recordId || null) // Marcar como consultado aunque haya error
      } finally {
        setIsLoading(false)
      }
    }

    // Solo cargar si tenemos recordId válido, no está en loading y no hemos consultado este ID antes
    if (recordId && recordId.toString().length > 10 && !isLoading && recordId !== lastRecordId) {
      // Debounce la carga para evitar múltiples requests
      const timeoutId = setTimeout(() => {
        loadExistingDocument()
      }, 1000) // Aumentar timeout a 1 segundo
      
      return () => clearTimeout(timeoutId)
    }
  }, [userId, documentType, formType, recordId, isMounted, generateItemId, isLoading, lastRecordId, success, uploadedUrl])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setSuccess(false)
      uploadFile(selectedFile)
    }
  }

  const uploadFile = async (fileToUpload: File) => {
    setUploading(true)
    setProgress(0)
    setError(null)
    setSuccess(false)

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // SOLUCIÓN SIMPLE: Usar el mismo sistema que DocumentUpload
      if (!recordId) {
        // Subir usando el API que SÍ funciona
        const formData = new FormData()
        formData.append("file", fileToUpload)
        formData.append("userId", userId)
        formData.append("category", documentType)
        formData.append("itemId", `${formType}_${itemIndex}`)

        const response = await fetch("/api/upload-direct", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setProgress(100)

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Error al subir el archivo")
        }

        // Guardar la URL en el estado local para asociarla después
        setUploadedUrl(result.url)
        setDocumentName(fileToUpload.name)
        setSuccess(true)
        
        // Notificar al formulario padre con la URL
        if (onUploadSuccess) {
          onUploadSuccess(result.url)
        }

        console.log("Documento subido correctamente:", result.url)

      } else {
        // Si hay recordId, usar el sistema existente (ya funciona)
        const formData = new FormData()
        formData.append("file", fileToUpload)
        formData.append("userId", userId)
        formData.append("category", documentType)
        formData.append("itemId", `${formType}_${recordId}`)

        const response = await fetch("/api/upload-direct", {
          method: "POST",
          body: formData,
        })

        clearInterval(progressInterval)
        setProgress(100)

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Error al subir el archivo")
        }
        
        setUploadedUrl(result.url)
        setDocumentName(result.document?.name || fileToUpload.name || 'Archivo subido')
        setSuccess(true)
        
        if (onUploadSuccess) {
          onUploadSuccess(result.url)
        }
      }

    } catch (error: any) {
      console.error("Error al subir archivo:", error)
      const errorMessage = error.message || "Error al subir el archivo"
      setError(errorMessage)
      
      if (onUploadError) {
        onUploadError(errorMessage)
      }
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setFile(null)
    setUploadedUrl(null)
    setDocumentName(null)
    setError(null)
    setSuccess(false)
    setPendingTempId(null)
    setProgress(0)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Función para que los formularios puedan acceder a la URL del documento
  const getDocumentUrl = useCallback(() => uploadedUrl, [uploadedUrl])

  // Exponer la función a través del ref
  useImperativeHandle(ref, () => ({
    getPendingTempId: () => pendingTempId,
    getDocumentUrl: getDocumentUrl
  }), [pendingTempId, getDocumentUrl])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  // Evitar renderizado durante hidratación
  if (!isMounted) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
          <div className="h-8 w-8 mx-auto mb-2 animate-pulse bg-gray-300 rounded"></div>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {(uploadedUrl || success) && (
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" />
            <span className="text-sm">Subido</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
        id={`file-${documentType}-${recordId || itemIndex || 0}`}
      />

      {!uploadedUrl && !success && (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors bg-blue-50/50"
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <p className="text-sm text-blue-700 mb-1 font-medium">
            Haz clic para subir un archivo
          </p>
          <p className="text-xs text-blue-600">
            PDF, DOC, DOCX, JPG, PNG (max. 5MB)
          </p>
        </div>
      )}

      {(file || uploadedUrl) && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{documentName || (file?.name)}</p>
                <p className="text-xs text-gray-500">
                  {uploadedUrl ? "Subido exitosamente" : "Listo para subir"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {uploadedUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(uploadedUrl, "_blank")}
                >
                  Ver
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {uploading && (
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Subiendo... {progress}%</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
})

RobustDocumentUpload.displayName = 'RobustDocumentUpload'

export default RobustDocumentUpload
