"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, Upload, X, FileText, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

interface AutoDocumentUploadProps {
  userId: string
  documentType: string
  formType: string
  itemIndex?: number
  label?: string
  onUploadSuccess?: (documentUrl: string) => void
  onUploadError?: (error: string) => void
  className?: string
  required?: boolean
}

export function AutoDocumentUpload({
  userId,
  documentType,
  formType,
  itemIndex,
  label = "Subir documento",
  onUploadSuccess,
  onUploadError,
  className = "",
  required = false
}: AutoDocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [documentName, setDocumentName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadExistingDocument = async () => {
      if (!userId || !documentType || !formType) return

      try {
        const checkUrl = `/api/documents/check?userId=${userId}&documentType=${documentType}&formType=${formType}${itemIndex !== undefined ? `&itemIndex=${itemIndex}` : ''}`
        console.log("Consultando documentos existentes:", checkUrl)
        
        const response = await fetch(checkUrl)
        
        if (response.ok) {
          const data = await response.json()
          console.log("Respuesta de documentos existentes:", data)
          
          if (data.exists && data.url) {
            setUploadedUrl(data.url)
            setDocumentName(data.name || 'Documento subido')
            setSuccess(true)
            console.log("Documento existente encontrado:", data.url)
          }
        }
      } catch (error) {
        console.error("Error loading existing document:", error)
      }
    }

    loadExistingDocument()
  }, [userId, documentType, formType, itemIndex])

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

      const formData = new FormData()
      formData.append("file", fileToUpload)
      formData.append("userId", userId)
      formData.append("documentType", documentType)
      formData.append("formType", formType)
      if (itemIndex !== undefined) {
        formData.append("itemIndex", itemIndex.toString())
      }

      const response = await fetch("/api/upload-profile", {
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
    setProgress(0)
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
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
        id={`file-${documentType}-${itemIndex || 0}`}
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
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {file?.name || documentName || 'Documento subido'}
                </p>
                {file && (
                  <p className="text-xs text-gray-500">
                    {Math.round(file.size / 1024)} KB
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {success && (
                <div className="flex items-center gap-1 text-green-600">
                  <Check className="h-4 w-4" />
                  <span className="text-xs font-medium">Completado</span>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {uploading && (
            <div className="mt-3">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-blue-600 mt-1 font-medium">
                Subiendo... {progress}%
              </p>
            </div>
          )}
        </div>
      )}

      {uploadedUrl && !uploading && (
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(uploadedUrl, '_blank')}
            className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
          >
            <FileText className="h-4 w-4 mr-1" />
            Ver documento
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClick}
            className="text-gray-600 hover:text-gray-700 hover:bg-gray-100"
          >
            <Upload className="h-4 w-4 mr-1" />
            Cambiar archivo
          </Button>
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
}