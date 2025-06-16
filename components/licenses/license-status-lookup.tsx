"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Search, FileText, Calendar, User, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LicenseRequest {
  id: string
  radicado: string
  nombres: string
  apellidos: string
  tipo_documento: string
  numero_documento: string
  cargo: string
  fecha_inicio: string
  fecha_finalizacion: string
  observacion: string
  estado: "pendiente" | "en_revision" | "aprobada" | "rechazada"
  comentarios_rh?: string
  created_at: string
  updated_at: string
  evidences?: Array<{
    id: string
    file_name: string
    file_url: string
    file_size: number
    file_type: string
  }>
}

const estadoConfig = {
  pendiente: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  en_revision: {
    label: "En Revisión",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: AlertCircle,
  },
  aprobada: {
    label: "Aprobada",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  rechazada: {
    label: "Rechazada",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
}

export function LicenseStatusLookup() {
  const [radicado, setRadicado] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [licenseData, setLicenseData] = useState<LicenseRequest | null>(null)
  const [error, setError] = useState("")
  const [isSimulated, setIsSimulated] = useState(false)
  const { toast } = useToast()

  const handleSearch = async () => {
    if (!radicado.trim()) {
      setError("Por favor ingrese un número de radicado")
      return
    }

    setIsLoading(true)
    setError("")
    setLicenseData(null)

    try {
      console.log("🔍 Consultando radicado:", radicado)

      const response = await fetch(`/api/licenses/status?radicado=${encodeURIComponent(radicado.trim())}`)

      // Leer respuesta como texto primero
      const responseText = await response.text()
      console.log("📥 Respuesta recibida:", response.status, responseText.substring(0, 200))

      if (!response.ok) {
        let errorMessage = "Error al consultar el radicado"

        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Error ${response.status}: ${response.statusText}`
        }

        if (response.status === 404) {
          setError("No se encontró ninguna solicitud con el radicado proporcionado")
        } else {
          setError(errorMessage)
        }
        return
      }

      // Parsear respuesta exitosa
      const result = JSON.parse(responseText)
      console.log("✅ Datos recibidos:", result)

      setIsSimulated(result.simulated || false)
      setLicenseData(result.data)

      toast({
        title: "Solicitud encontrada",
        description: `Estado: ${estadoConfig[result.data.estado]?.label || result.data.estado}`,
      })
    } catch (error) {
      console.error("Error en la consulta:", error)
      setError(error instanceof Error ? error.message : "Error inesperado al consultar el radicado")
      toast({
        title: "Error en la consulta",
        description: "No se pudo consultar el estado de la solicitud",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Formulario de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Consultar Estado de Solicitud
          </CardTitle>
          <CardDescription>
            Ingrese el número de radicado para consultar el estado de su solicitud de licencia o permiso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="radicado">Número de Radicado</Label>
              <Input
                id="radicado"
                placeholder="Ej: LIC-2025-123456"
                value={radicado}
                onChange={(e) => setRadicado(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Consultando..." : "Consultar"}
              </Button>
            </div>
          </div>
          {error && (
            <Alert className="mt-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resultados */}
      {licenseData && (
        <div className="space-y-6">
          {isSimulated && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-800">Datos simulados</AlertTitle>
              <AlertDescription className="text-yellow-700">
                Esta información es simulada para propósitos de demostración.
              </AlertDescription>
            </Alert>
          )}

          {/* Información principal */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Solicitud {licenseData.radicado}
                </CardTitle>
                <Badge className={estadoConfig[licenseData.estado]?.color}>
                  {React.createElement(estadoConfig[licenseData.estado]?.icon, { className: "h-4 w-4 mr-1" })}
                  {estadoConfig[licenseData.estado]?.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información del solicitante */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <User className="h-4 w-4" />
                    Información del Solicitante
                  </div>
                  <div className="space-y-2 pl-6">
                    <div>
                      <span className="text-sm text-gray-600">Nombre completo:</span>
                      <p className="font-medium">
                        {licenseData.nombres} {licenseData.apellidos}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Documento:</span>
                      <p className="font-medium">{licenseData.numero_documento}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Cargo:</span>
                      <p className="font-medium">{licenseData.cargo}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="h-4 w-4" />
                    Fechas de la Solicitud
                  </div>
                  <div className="space-y-2 pl-6">
                    <div>
                      <span className="text-sm text-gray-600">Fecha de inicio:</span>
                      <p className="font-medium">{formatDate(licenseData.fecha_inicio)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Fecha de finalización:</span>
                      <p className="font-medium">{formatDate(licenseData.fecha_finalizacion)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Fecha de solicitud:</span>
                      <p className="font-medium">{formatDate(licenseData.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Observación */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Observación:</span>
                <p className="text-sm bg-gray-50 p-3 rounded-md">{licenseData.observacion}</p>
              </div>

              {/* Comentarios de RH */}
              {licenseData.comentarios_rh && (
                <div className="space-y-2">
                  <span className="text-sm font-medium text-gray-700">Comentarios de Talento Humano:</span>
                  <p className="text-sm bg-blue-50 p-3 rounded-md border border-blue-200">
                    {licenseData.comentarios_rh}
                  </p>
                </div>
              )}

              {/* Evidencias */}
              {licenseData.evidences && licenseData.evidences.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <FileText className="h-4 w-4" />
                    Documentos de Soporte ({licenseData.evidences.length})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {licenseData.evidences.map((evidence) => (
                      <div key={evidence.id} className="flex items-center gap-3 p-3 border rounded-md bg-gray-50">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{evidence.file_name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(evidence.file_size)}</p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={evidence.file_url} target="_blank" rel="noopener noreferrer">
                            Ver
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
