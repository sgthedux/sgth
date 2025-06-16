"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface EvidenceUploadProps {
  onUploadComplete: (evidence: {
    file_name: string
    file_type: string
    file_size: number
    file_path: string
    file_url: string
  }) => void
  licenseRequestId?: string
}

export function EvidenceUpload({ onUploadComplete, licenseRequestId }: EvidenceUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Validar tamaño (máximo 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("El archivo no debe superar los 5MB")
        return
      }

      // Validar tipo (PDF, imágenes, documentos comunes)
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]

      if (!validTypes.includes(selectedFile.type)) {
        setError("Tipo de archivo no permitido. Use PDF, imágenes o documentos Word.")
        return
      }

      setFile(selectedFile)
      setError(null)
      await performUpload(selectedFile)
    }
  }

  const performUpload = async (fileToUpload: File) => {
    if (!fileToUpload || !licenseRequestId) return

    try {
      setUploading(true)
      setError(null)

      // Crear un FormData para enviar el archivo
      const formData = new FormData()
      formData.append("file", fileToUpload)
      formData.append("licenseRequestId", licenseRequestId)

      // Usar la API de carga directa que utiliza la misma lógica que otros documentos
      const response = await fetch("/api/upload-direct", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al subir el archivo")
      }

      const data = await response.json()

      // Notificar al componente padre sobre la carga exitosa
      onUploadComplete({
        file_name: fileToUpload.name,
        file_type: fileToUpload.type,
        file_size: fileToUpload.size,
        file_path: data.path,
        file_url: data.url,
      })

      // Limpiar el estado
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      setError(error instanceof Error ? error.message : "Error al subir el archivo")
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="evidence">Evidencia o soporte</Label>

        {!file ? (
          <div
            className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Haga clic para seleccionar un archivo</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG o DOC (máx. 5MB)</p>
            <Input
              id="evidence"
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
          </div>
        ) : (
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                  {uploading ? (
                    <p className="text-xs text-yellow-600 animate-pulse">Subiendo...</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB • {file.type.split("/")[1].toUpperCase()}
                    </p>
                  )}
                </div>
              </div>
              {!uploading && (
                <Button variant="ghost" size="sm" onClick={removeFile}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Eliminar</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive mt-1">{error}</p>}
      </div>
    </div>
  )
}
